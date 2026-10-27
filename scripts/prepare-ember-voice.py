"""Offline local Kokoro stock voice. No user content, network or credentials."""
from pathlib import Path
import os,sys,json,subprocess,hashlib
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
import numpy as np
import soundfile as sf
root=Path(__file__).resolve().parents[1]
home=Path('/Users/miguelalvarado/Coding/AI-native/tts');sys.path.insert(0,str(home))
from kokoro_say import speak
phrases=json.loads((root/'scripts/ember-phrases.json').read_text())
out=root/'public/audio/ember';out.mkdir(parents=True,exist_ok=True)
manifest={'provider':'Offline local Kokoro-82M','voice':'af_heart','speed':.84,'directListening':False,'clips':{}}
for key,text in phrases.items():
 a,sr=speak(text,voice='af_heart',speed=.84,lang='en-us')
 assert sr==24000 and np.isfinite(a).all() and len(a)>sr
 peak=float(np.max(np.abs(a)));assert peak>0;a*=min(.6/peak,1.5)
 wav=out/(key+'.wav');target=out/(key+'.m4a');sf.write(wav,a,sr,subtype='PCM_16')
 subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-i',str(wav),'-c:a','aac','-b:a','128k','-movflags','+faststart',str(target)],check=True);wav.unlink()
 manifest['clips'][key]={'text':text,'seconds':len(a)/sr,'path':'/audio/ember/'+key+'.m4a','sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
 print(key,round(len(a)/sr,2),flush=True)
(root/'src/lib/ember-recording.json').write_text(json.dumps(manifest,indent=2)+'\n')
