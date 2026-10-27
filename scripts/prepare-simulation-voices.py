"""Generate only fictional fixture lines with the already installed local Kokoro model.
No network, credentials, microphone, browser speech engine or PTO asset changes.
Run: /Users/miguelalvarado/Coding/AI-native/tts/venv/bin/python scripts/prepare-simulation-voices.py
"""
from pathlib import Path
import json,sys,subprocess
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,'/Users/miguelalvarado/Coding/AI-native/tts')
from kokoro_say import speak
out=ROOT/'public/audio/simulations';out.mkdir(parents=True,exist_ok=True)
manifest=[]
for scenario in json.loads((ROOT/'simulations/scenarios.json').read_text()):
 if scenario.get('fixtureAudio')!='static-v1':continue
 for i,turn in enumerate(scenario['turns']):
  voice='am_michael' if turn['role']=='user' else 'af_heart'
  samples,rate=speak(turn['text'],voice=voice,speed=.94 if turn['role']=='user' else .89,lang='en-us')
  assert np.isfinite(samples).all() and len(samples)>rate*.5
  peak=float(np.max(np.abs(samples)));assert peak>0
  samples*=min(.7/peak,1.5)
  wav=Path('/tmp')/f"soulfire-synthetic-{scenario['id']}-{i}.wav"
  sf.write(wav,samples,rate,subtype='PCM_16')
  target=out/f"{scenario['id']}-{i}.m4a"
  subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(wav),'-c:a','aac','-b:a','128k','-movflags','+faststart',str(target)],check=True)
  manifest.append({'scenario':scenario['id'],'turn':i,'role':turn['role'],'voice':voice,'seconds':len(samples)/rate,'sampleRate':rate,'peakDbFS':float(20*np.log10(np.max(np.abs(samples)))),'file':target.name})
  print(scenario['id'],i,voice,round(len(samples)/rate,2),flush=True)
(out/'manifest.json').write_text(json.dumps({'provenance':'fixture text + local Kokoro-82M / kokoro-onnx','directListening':False,'realAgentAudioRoundTrip':False,'turns':manifest},indent=2)+'\n')
