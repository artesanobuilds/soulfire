"""Delivery and timing summaries only; no semantic grading or inference calls."""
import json
import statistics
from pathlib import Path
root=Path('test-results/situated-paid-run')
r=json.loads((root/'ledger.json').read_text())
if r['status']=='running':raise SystemExit('Stage active')
groups={}
for t in r['tasks']:
 mode='text' if t['mode']=='text' else 'voice'
 g=groups.setdefault(mode+'-'+t['arm'],{'attempted':0,'completed':0,'failures':[],'completeTextSeconds':[],'audioOnsetSeconds':[],'spokenSpanSeconds':[],'guideWords':[],'parallelASRCount':0})
 g['attempted']+=1
 if t['status']!='completed':
  e=t.get('evidence',{});g['failures'].append({'order':t['order'],'case':t['case'],'status':t['status'],'beforeUserInput':not e.get('injection'),'modelResponses':len(e.get('responses',[])),'category':t.get('failure',{}).get('message')});continue
 g['completed']+=1
 if mode=='text':g['completeTextSeconds'].append(t['wallSeconds']);continue
 e=t['evidence'];guide=next(x for x in e['responses'] if x['role']=='guide');audio=e['audio'].get(guide['id'],{});injection=e['injection']
 if audio.get('firstNonSilentAt') is not None:
  g['audioOnsetSeconds'].append((audio['firstNonSilentAt']-injection['lastNonSilentAt'])/1000)
  g['spokenSpanSeconds'].append((audio['lastNonSilentAt']-audio['firstNonSilentAt'])/1000)
 text=' '.join(c.get('transcript',c.get('text','')) for o in guide.get('output',[]) for c in o.get('content',[]) if c.get('transcript') or c.get('text'))
 g['guideWords'].append(len(text.split()));g['parallelASRCount']+=sum(x['type']=='conversation.item.input_audio_transcription.completed' for x in e['events'])
for g in groups.values():
 for k in ['completeTextSeconds','audioOnsetSeconds','spokenSpanSeconds','guideWords']:
  values=g[k];g[k]={'n':len(values),'median':statistics.median(values) if values else None,'min':min(values) if values else None,'max':max(values) if values else None}
result={'status':r['status'],'groups':groups,'latencyDefinition':'Text: full HTTP response and application validation. Voice: scheduled last non-silent synthetic input sample to first sustained decoded remote audio (>0.005 RMS, 10ms poll, >=8ms sustained). Not first spoken word or physical loudspeaker latency; metrics are not directly equivalent.','qualityConclusion':'Not implied by delivery or latency.','scheduledTasks':34,'attemptedTasks':len(r['tasks'])}
(root/'delivery-metrics.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
