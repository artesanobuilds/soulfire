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
current_only=job.get('currentOnly',False) is True
narration=loopMeter=None
loopData=None
if not current_only:
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
seam=float(np.max(np.abs(a[-1]-a[0])))
if not current_only: loopData,_=sf.read(folder/'loop.wav',dtype='float32',always_2d=True)
metrics={'duration':len(a)/sr,'sampleRate':sr,'channels':a.shape[1],'integratedLufs':original['I'],'truePeakDb':original['TP'],'loudnessRange':original['LRA'],'peak':float(np.max(np.abs(a))),'clippedFraction':float(np.mean(np.abs(a)>=.999)),'seamJump':seam,'seamRmsDifferenceDb':20*math.log10(rms(a[-window:])/rms(a[:window])),'matchedLufs':matched['I'],'matchedTruePeakDb':matched['TP'],'loopLufs':None if current_only else loopMeter['I'],'loopTruePeakDb':None if current_only else loopMeter['TP'],'narrationLufs':None if current_only else narration['I'],'narrationTruePeakDb':None if current_only else narration['TP'],'loopSeamJump':None if current_only else float(np.max(np.abs(loopData[max(0,len(bed)-n)]-loopData[max(0,len(bed)-n-1)]))),'pcmSha256':hashlib.sha256(a.astype('<f4').tobytes()).hexdigest(),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()}
# Approximate acoustic descriptors, not clinical or musical-quality scores.
mono=np.mean(a,axis=1)[::max(1,sr//12000)];analysis_sr=sr/max(1,sr//12000)
frame=4096;hop=2048;windowed=np.lib.stride_tricks.sliding_window_view(mono,frame)[::hop] if len(mono)>=frame else np.zeros((1,frame))
spectrum=np.abs(np.fft.rfft(windowed*np.hanning(frame),axis=1));freq=np.fft.rfftfreq(frame,1/analysis_sr)
energy=spectrum.sum(axis=1)+1e-12;centroid=float(np.mean((spectrum*freq).sum(axis=1)/energy))
valid=(freq>=65)&(freq<=2000);bins=np.round(69+12*np.log2(np.maximum(freq[valid],1)/440)).astype(int)%12
chroma=np.zeros(12)
for k in range(12):chroma[k]=float(np.mean(spectrum[:,valid][:,bins==k])) if np.any(bins==k) else 0
chroma=chroma/(np.linalg.norm(chroma)+1e-12)
major=np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]);minor=np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
key_scores=np.array([float(np.dot(chroma,np.roll(profile,k))/(np.linalg.norm(profile)+1e-12)) for profile in (major,minor) for k in range(12)])
order=np.argsort(key_scores);key=int(order[-1]);confidence=float(np.clip((key_scores[order[-1]]-key_scores[order[-2]])*8,0,1))
step=max(1,int(analysis_sr*.05));trim=mono[:len(mono)//step*step];rms_envelope=np.sqrt(np.mean(trim.reshape(-1,step)**2,axis=1)+1e-12);onset=np.maximum(0,np.diff(rms_envelope));onset-=onset.mean();corr=np.correlate(onset,onset,mode='full')[len(onset)-1:];lo,hi=7,min(34,len(corr)-1)
if hi>lo and corr[0]>1e-12:
 lag=int(np.argmax(corr[lo:hi+1]))+lo;tempo_conf=float(np.clip(corr[lag]/corr[0],0,1));bpm=float(60/(lag*.05))
else:bpm=None;tempo_conf=0
onset_rate=float(np.sum(np.diff(rms_envelope)>max(.01,float(np.std(rms_envelope))))/(len(a)/sr))
metrics.update({'estimatedKey':key if confidence>=.1 else None,'keyConfidence':confidence,'estimatedBpm':bpm if tempo_conf>=.4 else None,'tempoConfidence':tempo_conf,'chroma':chroma.tolist(),'spectralCentroidHz':centroid,'onsetRate':onset_rate})
print(json.dumps(metrics))
