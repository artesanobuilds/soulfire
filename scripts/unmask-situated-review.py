"""Unmask only after every selected record has a persisted rating."""
import hashlib
import json
from pathlib import Path
root=Path('test-results/situated-paid-run')
batches=['text','voice-through-26','voice-through-31-after-26','voice-after-31']
records=[];proof=[]
for batch in batches:
 review=root/f'masked-{batch}-review.json';ratings=root/f'masked-{batch}-ratings.json';mapping=root/f'review-mapping-{batch}-private.json'
 rr=json.loads(review.read_text());grade=json.loads(ratings.read_text());assert len(rr['records'])==len(grade['records'])
 byid={g['reviewId']:g for g in grade['records']};assert set(byid)=={x['reviewId'] for x in rr['records']}
 proof.append({'batch':batch,'frozenAtUtc':grade['frozenAtUtc'],'ratingsSha256':hashlib.sha256(ratings.read_bytes()).hexdigest()})
 # Deliberately read the mapping only after persisted ratings have been checked.
 key=json.loads(mapping.read_text())
 for x in rr['records']:
  k=key[x['reviewId']];g=byid[x['reviewId']];records.append({**k,'mode':'text' if k['mode']=='text' else 'voice','input':x['input'],'response':x['response'],'parallelASR':x.get('parallelASR',[]),'deliveryStatus':x['deliveryStatus'],'review':g})
assert len(records)==34 and len({r['order'] for r in records})==34
records.sort(key=lambda x:x['order'])
groups={};pairs={}
for r in records:
 group=groups.setdefault(r['mode']+'-'+r['arm'],{'attempted':0,'semanticPass':0,'semanticFail':0,'unassessed':0})
 group['attempted']+=1;group[{'pass':'semanticPass','fail':'semanticFail','unassessed':'unassessed'}[r['review']['overall']]]+=1
 pairs.setdefault((r['mode'],r['case'],r['repeat']),{})[r['arm']]=r
paired={'text':{'n':0,'candidateOnlyPass':0,'baselineOnlyPass':0,'bothPass':0,'bothFail':0,'incompletePair':0},'voice':{'n':0,'candidateOnlyPass':0,'baselineOnlyPass':0,'bothPass':0,'bothFail':0,'incompletePair':0}}
for (mode,case,repeat),arms in pairs.items():
 b=arms.get('baseline',{}).get('review',{}).get('overall','unassessed');c=arms.get('candidate',{}).get('review',{}).get('overall','unassessed');s=paired[mode]
 if 'unassessed' in [b,c]:s['incompletePair']+=1;continue
 s['n']+=1;s['bothPass' if b==c=='pass' else 'bothFail' if b==c=='fail' else 'candidateOnlyPass' if c=='pass' else 'baselineOnlyPass']+=1
summary={'method':'Arm-masked implementing-agent case-criterion review, not independent blinded human review. Same-author held-out cases. Binary all-criteria outcomes do not measure universal quality, efficacy or statistical significance.','ratingsFrozenBeforeMapping':proof,'groups':groups,'completePairs':paired,'records':records}
(root/'unmasked-review.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='records'},indent=2))
print('FAILURES:')
for r in records:
 if r['review']['overall']=='fail':print(json.dumps({'mode':r['mode'],'arm':r['arm'],'case':r['case'],'repeat':r['repeat'],'note':r['review']['note'],'response':r['response']}))
