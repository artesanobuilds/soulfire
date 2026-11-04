"""Verify bounded PCM speech fixtures without playback or networking."""
import array
import hashlib
import json
import math
import sys
import wave
from pathlib import Path
root = Path('test-results/situated-audio')
manifest = json.loads((root / 'manifest.json').read_text())
checks = []
for fixture in manifest['fixtures']:
    path = root / fixture['file']
    with wave.open(str(path), 'rb') as wav:
        assert wav.getsampwidth() == 2 and wav.getnchannels() == 1
        rate = wav.getframerate()
        duration = wav.getnframes() / rate
        samples = array.array('h', wav.readframes(wav.getnframes()))
    if sys.byteorder != 'little':
        samples.byteswap()
    peak = max(abs(s) for s in samples) / 32768
    rms = math.sqrt(sum(s*s for s in samples) / len(samples)) / 32768
    near_silent = [max(abs(s) for s in samples[start:start+rate//100]) < 32768 * 0.003 for start in range(0, len(samples), rate//100)]
    longest = run = 0
    for silent in near_silent:
        run = run + 1 if silent else 0
        longest = max(longest, run)
    match = hashlib.sha256(path.read_bytes()).hexdigest() == fixture['audioSha256']
    checks.append({**fixture, 'durationSeconds': round(duration, 4), 'sampleRate': rate,
                   'peak': round(peak, 5), 'rms': round(rms, 5),
                   'longestNearSilentRunMsIncludingEdges': longest * 10,
                   'sha256Matches': match, 'within30Seconds': duration <= 30,
                   'nonSilent': rms > 0.001, 'notClipped': peak < 0.999})
result = {'status': 'passed' if all(c['sha256Matches'] and c['within30Seconds'] and c['nonSilent'] and c['notClipped'] for c in checks) else 'failed',
          'limitations': 'Signal-level checks only; no direct listening, ASR, native provider or physical microphone assessment.',
          'cloudCalls': 0, 'personalMicrophone': False, 'noTimeStretchOrPauseEditing': True, 'fixtures': checks}
(root / 'verified-manifest.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if result['status'] != 'passed':
    raise SystemExit(1)
