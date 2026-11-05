"""Summarize recorded usage; estimates are not provider invoice totals."""
import json
from pathlib import Path
root=Path('test-results/situated-paid-run')
run=json.loads((root/'ledger.json').read_text())
if run['status']=='running':raise SystemExit('Run still active')
text=[]
for p in root.glob('*-text-usage.jsonl'):
 for line in p.read_text().splitlines():
  d=json.loads(line);u=d.get('usage') or {};inp=u.get('input_tokens',0);cached=(u.get('input_tokens_details') or {}).get('cached_tokens',0);out=u.get('output_tokens',0)
  text.append({'arm':p.name.split('-')[0],'inputTokens':inp,'cachedInputTokens':cached,'outputTokens':out,'reasoningTokens':(u.get('output_tokens_details') or {}).get('reasoning_tokens',0),'estimateUsd':((inp-cached)*2+cached*.1+out*10)/1e6,'conservativeCacheWriteUpperUsd':((inp-cached)*2.5+cached*.1+out*10)/1e6})
voice=[]
for t in run['tasks']:
 if t['mode']=='text':continue
 for r in t.get('evidence',{}).get('responses',[]):
  u=r.get('usage') or {};i=u.get('input_token_details') or u.get('input_tokens_details') or {};o=u.get('output_token_details') or u.get('output_tokens_details') or {}
  if not i or not o:
   voice.append({'case':t['case'],'arm':t['arm'],'role':r.get('role'),'estimateUsd':None,'usageUnavailable':True});continue
  voice.append({'case':t['case'],'arm':t['arm'],'role':r.get('role'),'inputTextTokens':i.get('text_tokens',0),'inputAudioTokens':i.get('audio_tokens',0),'cachedTokens':i.get('cached_tokens',0),'outputTextTokens':o.get('text_tokens',0),'outputAudioTokens':o.get('audio_tokens',0),'estimateUsd':(i.get('text_tokens',0)*4+i.get('audio_tokens',0)*32+o.get('text_tokens',0)*16+o.get('audio_tokens',0)*64)/1e6})
textEst=sum(t['estimateUsd'] for t in text);textUpper=sum(t['conservativeCacheWriteUpperUsd'] for t in text);voiceEst=sum(v['estimateUsd'] or 0 for v in voice)
summary={'status':run['status'],'stageReservationUsd':10.15,'requestReservationsUsd':run['requestReservationsUsd'],'textUsageRecords':len(text),'voiceUsageRecords':len(voice),'textTokenEstimateUsd':textEst,'textConservativeCacheWriteUpperUsd':textUpper,'voiceTokenEstimateWithoutCacheDiscountUsd':voiceEst,'knownTokenEstimateUsd':textEst+voiceEst,'knownTokenConservativeUpperUsd':textUpper+voiceEst,'ASRActualCost':'not returned; not part of known token estimate','ASRRetainedAllowanceUsd':sum(t['mode']!='text' for t in run['tasks'])*.02,'invoicesVerified':False,'voiceUsageUnavailableResponses':sum(v.get('usageUnavailable',False) for v in voice),'ratesSource':'Official model pricing checked 2026-11-04; $/M Sol input2/cache.1/cache-write2.5/output10; Realtime text4/16 audio32/64. Voice estimate retains uncached input rates even where cached tokens reported.','textDetails':text,'voiceDetails':voice}
(root/'usage-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k not in ['textDetails','voiceDetails']},indent=2))
