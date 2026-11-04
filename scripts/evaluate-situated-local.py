"""No-cost surrogate probe. Hard-coded loopback Ollama; no cloud execution path.
Requires prepare-situated-evaluation.ts first. Not production-model or audio evidence.
"""
import hashlib
import json
import time
import urllib.request
from pathlib import Path

BASE = 'http://127.0.0.1:11434'
MODEL = 'qwen3:30b'
DIGEST = 'ad815644918f0eaab341c12b67837cc6dd4562342cdaf118f83d5d554cb37226'

def request(path, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.load(response)

inventory = request('/api/tags')
if not any(m['name'] == MODEL and m['digest'] == DIGEST for m in inventory['models']):
    raise SystemExit('Expected installed local model not found; no download/fallback allowed')
show = request('/api/show', {'model': MODEL})
if 'thinking' not in show.get('capabilities', []):
    raise SystemExit('Cannot verify think=false support')
heldout = json.loads(Path('evaluations/situated-support-heldout-20261104.json').read_text())
ids = {c['id'] for c in heldout['cases']}
raw = Path('test-results/situated-evaluation-offline-requests.json').read_bytes()
requests = json.loads(raw)
results = {'status': 'running', 'model': MODEL, 'modelDigest': DIGEST,
           'limitation': 'Surrogate content probe using voice instructions with text input/output. No Sol, Realtime, ASR, speech, production schema, quality parity or human benefit evidence.',
           'candidateFrozen': True, 'paidCalls': 0, 'cloudEndpoints': [],
           'requestBundleSha256': hashlib.sha256(raw).hexdigest(),
           'settings': {'think': False, 'temperature': 0, 'seed': 7, 'num_ctx': 8192, 'num_predict': 512},
           'responses': []}
output = Path('test-results/situated-local-surrogate.json')
for index, case in enumerate(heldout['cases']):
    arms = ['baseline', 'candidate'] if index % 2 == 0 else ['candidate', 'baseline']
    for arm in arms:
        item = next(r for r in requests if r['case'] == case['id'] and r['arm'] == arm and r['mode'] == 'voice')
        body = {'model': MODEL, 'stream': False, 'think': False, 'keep_alive': '2m',
                'options': {k: v for k, v in results['settings'].items() if k != 'think'},
                'messages': [{'role': 'system', 'content': item['request']['instructions']},
                             {'role': 'user', 'content': item['userTextForLocalSpeechOnly']}]}
        started = time.monotonic()
        record = {'case': case['id'], 'arm': arm}
        try:
            record['response'] = request('/api/chat', body)
            record['status'] = 'completed' if record['response'].get('done_reason') == 'stop' else 'incomplete'
        except Exception as exc:
            record.update(status='failed', error=type(exc).__name__ + ': ' + str(exc))
        record['wallSeconds'] = round(time.monotonic() - started, 3)
        results['responses'].append(record)
        output.write_text(json.dumps(results, indent=2) + '\n')
        print(json.dumps({k: v for k, v in record.items() if k != 'response'}), flush=True)
        if record['status'] != 'completed':
            results['status'] = 'stopped-on-delivery-failure; no retries'
            output.write_text(json.dumps(results, indent=2) + '\n')
            request('/api/generate', {'model': MODEL, 'keep_alive': 0})
            raise SystemExit(1)
results['status'] = 'completed; not production quality evidence'
output.write_text(json.dumps(results, indent=2) + '\n')
# This stage found no model loaded before it began; unload only its own local model.
request('/api/generate', {'model': MODEL, 'keep_alive': 0})
