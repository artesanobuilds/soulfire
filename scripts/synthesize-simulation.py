"""Bounded local synthesis: validated fictional text on stdin, WAV on stdout.
No network, credentials, microphone, output files or text in process arguments.
"""
import contextlib,io,json,sys
from pathlib import Path
request=json.loads(sys.stdin.buffer.read(20000))
text=request['text'];voice=request['voice'];home=Path(sys.argv[1])
assert isinstance(text,str) and 0<len(text)<=3000
assert voice in ('am_michael','af_heart')
sys.path.insert(0,str(home))
with contextlib.redirect_stdout(sys.stderr):
 import numpy as np
 import soundfile as sf
 from kokoro_say import speak
 samples,rate=speak(text,voice=voice,speed=.94 if voice=='am_michael' else .89,lang='en-us')
 assert rate==24000 and rate*.1<len(samples)<=rate*120 and np.isfinite(samples).all()
 peak=float(np.max(np.abs(samples)));assert peak>0
 samples*=min(.7/peak,1.5)
 buffer=io.BytesIO();sf.write(buffer,samples,rate,format='WAV',subtype='PCM_16')
sys.stdout.buffer.write(buffer.getvalue())
