#!/usr/bin/env python3
"""Offline-only baseline preparation and masked review. Never invokes a provider."""
import argparse, hashlib, json, pathlib, random, subprocess, statistics, wave, array, os

ROOT = pathlib.Path(__file__).resolve().parents[2]
ARMS = ['production-text', 'matched-text', 'native-text', 'native-audio', 'text-tts']
CRITERIA = ['grounding', 'no_unsupported_assumptions', 'decision_usefulness', 'actionability']
SOURCES = ['src/lib/agent.ts', 'src/lib/schema.ts', 'src/infrastructure/openai-responses.ts',
           'src/application/companion.ts', 'app/api/realtime/route.ts',
           'src/components/VoiceControls.tsx', 'src/lib/voice-reliability.ts']
def read(p): return json.loads(pathlib.Path(p).read_text())
def digest(p): return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def write(p, obj): pathlib.Path(p).write_text(json.dumps(obj, indent=2) + '\n')
def validate_audio(path):
    with wave.open(str(path)) as wav:
        if wav.getnchannels() != 1 or wav.getframerate() != 24000 or wav.getsampwidth() != 2 or wav.getnframes() < 2400:
            raise ValueError("Invalid or empty 24kHz mono PCM fixture")
        samples = array.array("h", wav.readframes(wav.getnframes()))
        if not samples or max(abs(s) for s in samples) < 100:
            raise ValueError("Silent fixture")
        return len(samples) / 24000

def prepare(out, capture, synthesize=False, kokoro_home=None):
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=False)  # no overwrite, including failed attempts
    scenarios = read(ROOT / 'experiments/voice-parity/scenarios.json')
    frozen = read(capture)
    write(out / 'instructions.json', frozen)
    write(out / 'scenarios.json', scenarios)
    hashes = {s: digest(ROOT / s) for s in SOURCES}
    hashes['experiments/voice-parity/scenarios.json'] = digest(ROOT / 'experiments/voice-parity/scenarios.json')
    runs = []
    for scenario in scenarios:
        for repeat in range(1, 4):
            arms = ARMS.copy()
            random.Random(f'{scenario["id"]}-{repeat}').shuffle(arms)
            for arm in arms:
                runs.append({'id': f'{scenario["id"]}-{repeat}-{arm}', 'scenario': scenario['id'],
                             'repeat': repeat, 'arm': arm, 'state': 'not-run',
                             'depends_on': f'{scenario["id"]}-{repeat}-matched-text' if arm == 'text-tts' else None})
    audio = {}
    if synthesize:
        for scenario in scenarios:
            src = out / f'{scenario["id"]}.txt'
            src.write_text(scenario['input'])
            wav = out / f'{scenario["id"]}.wav'
            if kokoro_home:
                home = pathlib.Path(kokoro_home).resolve()
                result = subprocess.run([str(home / 'venv/bin/python'), str(ROOT / 'scripts/synthesize-simulation.py'), str(home)], input=json.dumps({'text': scenario['input'], 'voice': 'af_heart'}).encode(), stdout=subprocess.PIPE, check=True, env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1', 'HF_HUB_OFFLINE': '1'})
                wav.write_bytes(result.stdout)
            else:
                subprocess.run(['/usr/bin/say', '-v', 'Samantha', '-r', '165', '-f', str(src), '-o', str(wav), '--file-format=WAVE', '--data-format=LEI16@24000'], check=True)
            duration = validate_audio(wav)
            audio[scenario['id']] = {'path': wav.name, 'sha256': digest(wav), 'source_sha256': digest(src), 'duration_seconds': duration, 'provenance': 'local Kokoro af_heart' if kokoro_home else 'macOS Samantha synthetic; no microphone'}
    manifest = {'revision': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
                'source_sha256': hashes, 'history': [], 'memory': False, 'tools': [], 'language': 'plain',
                'practiceTitle': '', 'repeats': 3, 'runs': runs, 'audio': audio,
                'network_calls': 0, 'new_reserved_usd': 0,
                'execution_authorized': False, 'instruction_sha256': digest(out / 'instructions.json'),
                'scenario_sha256': digest(out / 'scenarios.json'),
                'source_defaults': {'text_model': 'gpt-6.1-sol', 'native_model': 'gpt-realtime',
                                    'native_cap': 900, 'production_text_cap': 2200,
                                    'matched_text_cap': 900, 'voice': 'marin',
                                    'vad': 'source default 200ms provider silence; record effective value',
                                    'asr': 'gpt-4o-mini-transcribe'},
                'warning': 'Prepared plan, not provider observations. Native manual commit and production VAD are separate experiments. TTS waits for matched-text dependency regardless of randomized display order.'}
    write(out / 'manifest.json', manifest)
    return manifest

def blind(study, records_path, out):
    study, out = pathlib.Path(study), pathlib.Path(out)
    manifest, scenarios = read(study / 'manifest.json'), read(study / 'scenarios.json')
    if digest(study / 'instructions.json') != manifest['instruction_sha256'] or digest(study / 'scenarios.json') != manifest['scenario_sha256']:
        raise ValueError('Frozen study files changed')
    runs = {r['id']: r for r in manifest['runs']}
    records = read(records_path)
    if len({r['run_id'] for r in records}) != len(records): raise ValueError('Duplicate run IDs; retain retries as separate attempts')
    eligible, failures = [], []
    for r in records:
        if r['run_id'] not in runs: raise ValueError('Unknown run ID')
        # Do not silently repair incomplete audio, configuration drift or capped output.
        if r.get('status') != 'completed' or not r.get('effective_config_verified') or not r.get('full_turn_verified'):
            failures.append({'run_id': r['run_id'], 'status': r.get('status'), 'reason': 'delivery/configuration/turn not verified'})
            continue
        if not isinstance(r.get('answer'), str) or not r['answer'].strip(): raise ValueError('Missing answer')
        eligible.append(r)
    random.SystemRandom().shuffle(eligible)
    out.mkdir(parents=True, exist_ok=False)
    cases = {s['id']: s for s in scenarios}
    packet, key, ratings = [], {}, []
    for i, record in enumerate(eligible):
        label = f'item-{i+1:04d}'
        run = runs[record['run_id']]
        scenario = cases[run['scenario']]
        packet.append({'id': label, 'input': scenario['input'], 'checks': scenario['checks'], 'answer': record['answer']})
        key[label] = {'run': run, 'timing': record.get('timing', {})}
        ratings.append({'id': label, 'rater': '', **{c: None for c in CRITERIA}, 'evidence': '', 'presentation': None})
    write(out / 'review.json', packet)
    write(out / 'ratings-template.json', ratings)
    write(out / 'PRIVATE-key.json', key)
    write(out / 'delivery-failures.json', failures)
    write(out / 'coverage.json', {'planned': len(runs), 'submitted': len(records), 'eligible': len(eligible),
                                 'missing': sorted(set(runs)-{r['run_id'] for r in records})})
    return len(packet)

def report(review, ratings_file):
    review = pathlib.Path(review)
    key, ratings = read(review / 'PRIVATE-key.json'), read(ratings_file)
    seen, groups = set(), {}
    for rating in ratings:
        label, rater = rating['id'], rating['rater'].strip()
        if label not in key or not rater or (label, rater) in seen: raise ValueError('Unknown item, missing rater or duplicate rating')
        seen.add((label, rater))
        if not rating.get('evidence', '').strip(): raise ValueError('Rating needs evidence')
        arm = key[label]['run']['arm']
        for criterion in CRITERIA:
            value = rating[criterion]
            if type(value) is not int or value not in [0, 1, 2]: raise ValueError('Scores must be integers 0..2')
            groups.setdefault(arm, {}).setdefault(criterion, []).append(value)
    return {'coverage': read(review / 'coverage.json'), 'ratings': len(ratings),
            'unique_raters': len({r['rater'] for r in ratings}),
            'descriptive_only': {a: {c: {'n_ratings': len(v), 'mean': statistics.mean(v)} for c,v in cs.items()} for a,cs in groups.items()},
            'warning': 'Repeated scenario/rater scores are dependent. No model-causal or parity conclusion. Missing items and delivery failures remain in coverage.'}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('prepare'); p.add_argument('out'); p.add_argument('capture'); p.add_argument('--synthesize', action='store_true'); p.add_argument('--kokoro-home')
    p = sub.add_parser('blind'); p.add_argument('study'); p.add_argument('records'); p.add_argument('out')
    p = sub.add_parser('report'); p.add_argument('review'); p.add_argument('ratings')
    args = parser.parse_args()
    if args.command == 'prepare': print(json.dumps({'planned': len(prepare(args.out, args.capture, args.synthesize, args.kokoro_home)['runs']), 'paid_calls': 0}))
    elif args.command == 'blind': print(json.dumps({'eligible': blind(args.study, args.records, args.out)}))
    else: print(json.dumps(report(args.review, args.ratings), indent=2))
if __name__ == '__main__': main()
