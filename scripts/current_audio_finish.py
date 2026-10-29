"""Deterministic boundary finishing. No interior note editing or stem claims."""
import json,hashlib
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfilt
POLICY='current-boundary-master-v2'
def envelope(a,sr,window=.02):
 hop=max(1,round(sr*window));n=len(a)//hop
 return np.sqrt(np.mean(a[:n*hop].reshape(n,hop,a.shape[1])**2,axis=(1,2))+1e-20),hop

def finish(raw,output,requested,style):
 a,sr=sf.read(raw,dtype='float32',always_2d=True)
 assert a.shape[1] in (1,2) and np.isfinite(a).all() and 10<=len(a)/sr<=100
 duration=len(a)/sr;assert abs(duration-requested)<=3
 rms,hop=envelope(a,sr);filtered=sosfilt(butter(4,80,fs=sr,btype='highpass',output='sos'),a,axis=0);band,_=envelope(filtered,sr)
 db=20*np.log10(rms);banddb=20*np.log10(band);reference=float(np.percentile(banddb,95));threshold=max(-65,reference-35)
 active=np.flatnonzero(banddb>threshold);assert len(active),'No usable musical activity'
 last=(int(active[-1])+1)*hop/sr
 end=min(duration,last+.35);reason='low-activity terminal padding only';hard=None
 # Only terminal drops with no meaningful later return are eligible; never erase internal rests.
 for i in range(max(5,int(duration*.72*sr/hop)),len(db)-8):
  before=float(np.mean(db[i-5:i]));after=float(np.mean(db[i:i+5]));future=banddb[i+5:]
  if before>reference-22 and after-before<-18 and len(future) and np.max(future)<reference-22:
   hard=i*hop/sr;end=min(end,hard+.12);reason='terminal source drop, softened before its boundary';break
 if end<max(10,requested*.75):raise ValueError('Insufficient phrase duration; candidate needs regeneration, not aggressive cropping')
 end_frames=min(len(a),round(end*sr));master=a[:end_frames].copy()
 fade_out=min(4.0 if style=='ambient' else 3.0,end/5)
 fade_in=min(.08,end/20);fi=round(fade_in*sr);fo=round(fade_out*sr)
 master[:fi]*=(np.sin(np.linspace(0,np.pi/2,fi))**2)[:,None]
 master[-fo:]*=(np.cos(np.linspace(0,np.pi/2,fo))**2)[:,None]
 master[-1]=0
 # Recheck after the fade: a quiet natural release can otherwise become a long empty tail.
 original_fade_start=len(master)-fo
 for _ in range(2):
  filtered_master=sosfilt(butter(4,80,fs=sr,btype='highpass',output='sos'),master,axis=0)
  post,_=envelope(filtered_master,sr);post_db=20*np.log10(post);post_active=np.flatnonzero(post_db>max(-65,float(np.percentile(post_db,95))-35))
  if not len(post_active):raise ValueError('No activity after finishing')
  last_post=(int(post_active[-1])+1)*hop
  if (len(master)-last_post)/sr<=1.2:break
  new_end=min(len(master),last_post+round(.5*sr))
  if new_end/sr<max(10,requested*.75) or new_end-original_fade_start<sr:raise ValueError('Release is too short to finish safely')
  master=master[:new_end].copy();secondary=min(round(.35*sr),new_end-original_fade_start)
  master[-secondary:] *= (np.cos(np.linspace(0,np.pi/2,secondary))**2)[:,None]
  fo=new_end-original_fade_start;fade_out=fo/sr;end_frames=new_end;master[-1]=0
 # The middle remains sample-identical. This is a fade/crop, never a claimed note repair.
 interior=float(np.max(np.abs(master[fi:-fo]-a[fi:end_frames-fo]))) if end_frames>fi+fo else 0
 existing=None
 if Path(output).exists():
  existing,existing_sr=sf.read(output,dtype='float32',always_2d=True)
 if existing is None or existing_sr!=sr or existing.shape!=master.shape or not np.array_equal(existing,master):sf.write(output,master,sr,subtype='FLOAT')
 result={'version':1,'policyVersion':POLICY,'rawDuration':duration,'playableDuration':len(master)/sr,'requestedDuration':requested,'startSeconds':0,'endSeconds':len(master)/sr,'fadeInSeconds':fade_in,'fadeOutSeconds':fade_out,'tailRemovedSeconds':duration-len(master)/sr,'reason':reason,'terminalDropSeconds':hard,'interiorMaxSampleDifference':interior,'rawSha256':hashlib.sha256(Path(raw).read_bytes()).hexdigest(),'masterSha256':hashlib.sha256(Path(output).read_bytes()).hexdigest(),'last100msRmsDbfs':float(20*np.log10(np.sqrt(np.mean(master[-round(sr*.1):]**2))+1e-12)),'stems':False}
 Path(output).with_name('preparation.json').write_text(json.dumps(result,indent=2)+'\n');return result
if __name__=='__main__':
 import sys
 job=json.loads(sys.stdin.buffer.read(10000));folder=Path(job['folder']);print(json.dumps(finish(folder/'raw-source.wav',folder/'source.wav',job['requestedSeconds'],job['style'])))
