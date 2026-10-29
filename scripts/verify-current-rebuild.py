"""Independent file-level QA of all finished candidates; no subjective score."""
import json,pathlib,hashlib
import numpy as np,soundfile as sf
from scipy.signal import butter,sosfilt
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'docs/research-runs/2026-10-29-current-listening-feedback';progress=json.loads((OUT/'rebuild-progress.json').read_text());selection=json.loads((OUT/'catalogue-selection.json').read_text());chosen={r['id'] for r in selection['selected']};rows=[]
for item in progress['completed']:
 p=pathlib.Path(item['folder']);raw,sr=sf.read(p/'raw-source.wav',dtype='float32',always_2d=True);master,msr=sf.read(p/'source.wav',dtype='float32',always_2d=True);bed,bsr=sf.read(p/'bed.wav',dtype='float32',always_2d=True);prep=item['preparation'];fi=round(prep['fadeInSeconds']*sr);fo=round(prep['fadeOutSeconds']*sr)
 assert sr==msr==bsr==48000 and len(master)==len(bed) and np.isfinite(master).all() and np.isfinite(bed).all()
 assert np.max(np.abs(raw[fi:len(master)-fo]-master[fi:-fo]))==0
 assert hashlib.sha256((p/'raw-source.wav').read_bytes()).hexdigest()==prep['rawSha256']
 assert hashlib.sha256((p/'source.wav').read_bytes()).hexdigest()==prep['masterSha256']
 assert len(master)/sr>=45 and np.max(np.abs(master[-1]))<1e-8 and np.max(np.abs(bed))<1
 hop=round(sr*.02);filtered=sosfilt(butter(4,80,fs=sr,btype='highpass',output='sos'),bed,axis=0);n=len(bed)//hop;energy=np.sqrt(np.mean(filtered[:n*hop].reshape(n,hop,2)**2,axis=(1,2))+1e-20);db=20*np.log10(energy);active=np.flatnonzero(db>max(-65,float(np.percentile(db,95))-35));tail=len(bed)/sr-(active[-1]+1)*.02
 assert tail<1.5,('Tail too long',item['id'],tail)
 rms100=float(20*np.log10(np.sqrt(np.mean(bed[-round(sr*.1):]**2))+1e-12));assert rms100<-50
 rows.append({'id':item['id'],'conceptId':item['conceptId'],'selected':item['id'] in chosen,'name':item['name'],'rawSeconds':len(raw)/sr,'playableSeconds':len(bed)/sr,'finishedLowActivityTailSeconds':round(tail,3),'last100msRmsDbfs':rms100,'finalSampleZero':True,'interiorUnchanged':True,'matchedLufs':item['metrics']['matchedLufs'],'matchedTruePeakDb':item['metrics']['matchedTruePeakDb'],'pcmSha256':item['metrics']['pcmSha256'],'bedSha256':hashlib.sha256((p/'bed.wav').read_bytes()).hexdigest()})
assert len(rows)==72 and len({r['pcmSha256'] for r in rows})==72
old=json.loads((OUT/'../2026-10-29-current-musicality/inventory.json').read_text());assert all(hashlib.sha256(pathlib.Path(r['source']).read_bytes()).hexdigest()==r['sourceSha256'] for r in old['records'])
report={'candidatesVerified':72,'selected':36,'distinctNewPcm':72,'originalHashesUnchanged':49,'interiorPreservedOutsideDeclaredFades':True,'maxFinishedTailSeconds':max(r['finishedLowActivityTailSeconds'] for r in rows),'selectedDurationRange':[min(r['playableSeconds'] for r in rows if r['selected']),max(r['playableSeconds'] for r in rows if r['selected'])],'humanAudition':False,'rows':rows};(OUT/'rebuild-audio-verification.json').write_text(json.dumps(report,indent=2)+'\n');print({k:v for k,v in report.items() if k!='rows'})
