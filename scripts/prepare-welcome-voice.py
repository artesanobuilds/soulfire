"""Reproduce the soulfire introduction with existing local Kokoro tooling.
No downloads, credentials, PTO writes, pitch changes or post-synthesis time stretching.
Run using /Users/miguelalvarado/Coding/AI-native/tts/venv/bin/python.
"""
from pathlib import Path
import sys,json,subprocess
import numpy as np
import soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
TTS=Path('/Users/miguelalvarado/Coding/AI-native/tts')
sys.path.insert(0,str(TTS))
from kokoro_say import speak
parts=[
 'Welcome to SoulFire.',
 'A space to bring the principles of twelve-step practice into everyday life.',
 'Bring whatever is on your mind.',
 'Make room to reflect, pause for a moment of stillness if you choose,',
 'and find one small action to carry into your day.',
 'You set the pace.',
]
voice='af_heart'; speed=.84
out=ROOT/'assets/voice';out.mkdir(parents=True,exist_ok=True)
audio=[];segments=[];position=.3;sr=24000
audio.append(np.zeros(round(sr*position),dtype=np.float32))
for i,text in enumerate(parts):
 a,rate=speak(text,voice=voice,speed=speed,lang='en-us')
 assert rate==sr and np.isfinite(a).all() and len(a)>sr*.3
 segments.append({'text':text,'start':position,'seconds':len(a)/sr})
 audio.append(a);position+=len(a)/sr
 pause=[.7,.9,1.5,1.5,.85,.75][i]
 audio.append(np.zeros(round(sr*pause),dtype=np.float32));position+=pause
 print(i+1,round(len(a)/sr,2),'s',flush=True)
a=np.concatenate(audio);peak=float(np.max(np.abs(a)));assert peak>0
# Conservative peak normalization leaves more than 3 dB of headroom.
gain=min(10**(-3/20)/peak,1.5);a*=gain
wav=out/'welcome-kokoro-heart.wav';sf.write(wav,a,sr,subtype='PCM_24')
target=ROOT/'public/audio/welcome-kokoro-heart.m4a'
subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(wav),'-c:a','aac','-b:a','160k','-movflags','+faststart',str(target)],check=True)
manifest={'provider':'Local Kokoro-82M via kokoro-onnx','voice':voice,'language':'en-us','speed':speed,'seconds':len(a)/sr,'cues':[0,segments[3]['start'],segments[4]['start']],'segments':segments,'sampleRate':sr,'peakDbFS':float(20*np.log10(np.max(np.abs(a)))),'gain':gain,'timeStretch':False,'directListening':False,'sourceWorkflow':'Existing local PTO English af_heart pipeline; no PTO assets changed.'}
(ROOT/'public/audio/welcome-introduction.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({k:manifest[k] for k in ['voice','speed','seconds','cues','peakDbFS']},indent=2))
