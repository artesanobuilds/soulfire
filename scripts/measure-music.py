"""Local measurement and identical comparison renders; no model or remote service.
Use existing local numpy/soundfile tooling. Source audio is kept unchanged.
"""
import sys,json,subprocess,re,hashlib,math
from pathlib import Path
import numpy as np
import soundfile as sf
job=json.loads(sys.stdin.buffer.read(10000));folder=Path(job['folder']);source=folder/'source.wav';ffmpeg=job['ffmpeg'];app=Path(job['app'])
a,sr=sf.read(source,dtype='float32',always_2d=True);assert 1<=a.shape[1]<=2 and 1<=len(a)/sr<=100 and np.isfinite(a).all()
def meter(path):
 p=subprocess.run([ffmpeg,'-hide_banner','-nostdin','-i',str(path),'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
 final=p.stderr.rsplit('Summary:',1)[-1]
 def value(pattern):
  m=re.search(pattern,final);assert m,(pattern,final);v=float(m.group(1));assert math.isfinite(v);return v
 return {'I':value(r'I:\s+([-\d.]+) LUFS'),'TP':value(r'Peak:\s+([-\d.]+) dBFS'),'LRA':value(r'LRA:\s+([-\d.]+) LU')}
def normalize(src,dst):
 # Identical two-pass EBU R128 normalization. True-peak ceiling leaves crossfade headroom.
 args=[ffmpeg,'-hide_banner','-nostdin','-i',str(src),'-af','loudnorm=I=-20:TP=-3:LRA=11:print_format=json','-f','null','-']
 log=subprocess.run(args,capture_output=True,text=True,check=True).stderr;measure=json.loads(log[log.rfind('{'):log.rfind('}')+1])
 filt='loudnorm=I=-20:TP=-3:LRA=11:linear=true:measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}'.format(**measure)
 subprocess.run([ffmpeg,'-v','error','-nostdin','-y','-i',str(src),'-af',filt,'-ar','48000','-ac','2','-c:a','pcm_s16le',str(dst)],check=True)
def match(src,dst):
 normalize(src,dst)
 before=meter(dst)
 assert -21.05<=before['I']<=-19 and before['TP']<=-2.5,'Initial normalization outside its bound'
 # A final attenuation-only trim gives every render the same -21 LUFS reference.
 gain=-21-before['I'];temp=dst.with_name(dst.stem+'-trim.wav')
 subprocess.run([ffmpeg,'-v','error','-nostdin','-y','-i',str(dst),'-af',f'volume={min(0,gain)}dB','-c:a','pcm_s16le',str(temp)],check=True);temp.replace(dst)
 final=meter(dst);assert abs(final['I']+21)<=.2 and final['TP']<=-2.5,'Loudness match failed'
 return final
original=meter(source);matched=match(source,folder/'bed.wav');bed,rate=sf.read(folder/'bed.wav',dtype='float32',always_2d=True)
assert abs(matched['I']+21)<=.2 and matched['TP']<=-2.5,'Loudness matching failed; no misleading match label'
# Same two Ember clips on each bed, at the same gain and positions, using the actual existing assets.
voice=np.zeros_like(bed);starts=[3, max(16,len(bed)/rate-12)]
for name,start in zip(['arrival','natural'],starts):
 temp=folder/('voice-'+name+'.wav');subprocess.run([ffmpeg,'-v','error','-nostdin','-y','-i',str(app/'public/audio/ember'/(name+'.m4a')),'-ar',str(rate),'-ac','2','-c:a','pcm_f32le',str(temp)],check=True)
 clip,_=sf.read(temp,dtype='float32',always_2d=True);index=round(start*rate);count=min(len(clip),len(voice)-index);voice[index:index+count]+=clip[:count]*.65;temp.unlink()
sf.write(folder/'narration-unmatched.wav',np.clip(bed*.25+voice,-.95,.95),rate,subtype='PCM_16');narration=match(folder/'narration-unmatched.wav',folder/'narration.wav');(folder/'narration-unmatched.wav').unlink()
# Identical 1-second equal-power crossfades for a 3-minute audition. Retain measured raw seam separately.
n=rate;tail=bed.copy();fade=np.linspace(0,np.pi/2,n,dtype='float32')[:,None]
while len(tail)<180*rate:
 cross=tail[-n:]*np.cos(fade)+bed[:n]*np.sin(fade);tail=np.concatenate([tail[:-n],cross,bed[n:]])
loop=tail[:180*rate];sf.write(folder/'loop-unmatched.wav',loop,rate,subtype='FLOAT');loopMeter=match(folder/'loop-unmatched.wav',folder/'loop.wav');(folder/'loop-unmatched.wav').unlink()
window=max(1,min(round(sr*.1),len(a)//2));rms=lambda x:float(np.sqrt(np.mean(x*x))+1e-12)
seam=float(np.max(np.abs(a[-1]-a[0])));loopData,_=sf.read(folder/'loop.wav',dtype='float32',always_2d=True)
metrics={'duration':len(a)/sr,'sampleRate':sr,'channels':a.shape[1],'integratedLufs':original['I'],'truePeakDb':original['TP'],'loudnessRange':original['LRA'],'peak':float(np.max(np.abs(a))),'clippedFraction':float(np.mean(np.abs(a)>=.999)),'seamJump':seam,'seamRmsDifferenceDb':20*math.log10(rms(a[-window:])/rms(a[:window])),'matchedLufs':matched['I'],'matchedTruePeakDb':matched['TP'],'loopLufs':loopMeter['I'],'loopTruePeakDb':loopMeter['TP'],'narrationLufs':narration['I'],'narrationTruePeakDb':narration['TP'],'loopSeamJump':float(np.max(np.abs(loopData[max(0,len(bed)-n)]-loopData[max(0,len(bed)-n-1)]))),'pcmSha256':hashlib.sha256(a.astype('<f4').tobytes()).hexdigest(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
print(json.dumps(metrics))
