"""Read-only source/bed boundary and timestamp audit; activity is not musical-quality inference."""
import json,pathlib,hashlib,re,statistics
import numpy as np
import soundfile as sf
from scipy.signal import butter,sosfilt
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'docs/research-runs/2026-10-29-current-listening-feedback';old=ROOT/'docs/research-runs/2026-10-29-current-musicality';inventory=json.loads((old/'inventory.json').read_text());study=json.loads((old/'study-results.json').read_text());mapped=json.loads((OUT/'mapped-ratings.json').read_text())
sources=[]
for r in inventory['records']:sources.append({'id':r['id'],'category':r['category'],'source':r['source'],'bed':str(pathlib.Path(r['source']).parent/'bed.wav'),'parentHash':r['sourceSha256']})
for r in study['completed']:sources.append({'id':r['baselineId']+'-'+r['arm'],'category':'study-'+r['arm'],'source':r['source'],'bed':r['bed'],'parentHash':r['sourceSha256']})
def describe(path):
 a,sr=sf.read(path,dtype='float32',always_2d=True);mono=a.mean(axis=1);hop=round(sr*.05);n=len(mono)//hop;full=np.sqrt(np.mean(mono[:n*hop].reshape(n,hop)**2,axis=1)+1e-20);filtered=sosfilt(butter(4,80,fs=sr,btype='highpass',output='sos'),mono);band=np.sqrt(np.mean(filtered[:n*hop].reshape(n,hop)**2,axis=1)+1e-20);db=20*np.log10(full);banddb=20*np.log10(band);active=np.flatnonzero(banddb>max(-65,float(np.percentile(banddb,95))-35));last=(float(active[-1]+1)*.05 if len(active) else 0);drops=[]
 for i in range(2,len(db)-3):
  before=float(np.mean(db[i-2:i]));after=float(np.mean(db[i:i+3]));delta=after-before
  if delta<-10:drops.append({'seconds':round(i*.05,2),'dropDb':round(delta,2),'beforeDbfs':round(before,2),'afterDbfs':round(after,2)})
 return {'duration':len(a)/sr,'sampleRate':sr,'frames':len(a),'lastBandActivitySeconds':round(last,2),'bandActivityThresholdDbfs':round(max(-65,float(np.percentile(banddb,95))-35),2),'activityTailSeconds':round(len(a)/sr-last,2),'lastHalfSecondRmsDbfs':round(float(20*np.log10(np.sqrt(np.mean(a[-sr//2:]**2))+1e-12)),2),'maxDropFinalTenSeconds':min([d for d in drops if d['seconds']>len(a)/sr-10],key=lambda d:d['dropDb'],default=None),'envelopeDbfs':db.tolist(),'bandEnvelopeDbfs':banddb.tolist()}
rows=[]
for s in sources:
 source=describe(s['source']);bed=describe(s['bed']);assert hashlib.sha256(pathlib.Path(s['source']).read_bytes()).hexdigest()==s['parentHash'];events=[]
 for r in mapped['rows']:
  arm=r['actualArm'];id=r['groupId'] if arm=='A' else r['groupId']+'-'+arm
  if id==s['id']:
   for m in re.finditer(r'(\d+):(\d+)',r['ratings']['notes']):
    t=int(m[1])*60+int(m[2]);start=max(0,round((t-.5)/.05));end=min(len(source['envelopeDbfs']),round((t+.5)/.05));events.append({'reportedAt':t,'blindLabel':r['displayLabel'],'notesVerbatim':r['ratings']['notes'],'sourceRmsAroundDbfs':round(float(np.mean(source['envelopeDbfs'][start:end])),2),'bedRmsAroundDbfs':round(float(np.mean(bed['envelopeDbfs'][start:end])),2)})
 rows.append({**s,'sourceAnalysis':source,'bedAnalysis':bed,'sameDurationAndFrames':source['frames']==bed['frames'],'envelopeCorrelation':float(np.corrcoef(source['envelopeDbfs'],bed['envelopeDbfs'])[0,1]),'reportedEvents':events})
report={'method':'50ms full-band and >80Hz activity plus source-vs-bed timing; no absence-of-onset=silence assumption','rows':rows,'counts':{'auditedRecords':len(rows),'sameSourceBedDuration':sum(r['sameDurationAndFrames'] for r in rows),'activityTailOverTwoSeconds':sum(r['sourceAnalysis']['activityTailSeconds']>2 for r in rows)},'interpretation':'Activity thresholds identify audit candidates only; low bass, natural rests and intentional decays must not be removed blindly.'};(OUT/'boundary-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(report['counts'])
for r in rows:
 if r['reportedEvents']:print(r['id'],r['sourceAnalysis']['lastBandActivitySeconds'],r['sourceAnalysis']['maxDropFinalTenSeconds'],round(r['envelopeCorrelation'],4))
