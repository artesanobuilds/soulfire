"""Prepare arm-masked review files. Mapping remains separate until ratings are frozen."""
import json
import secrets
import random
import sys
from pathlib import Path
root = Path('test-results/situated-paid-run')
ledger = json.loads((root/'ledger.json').read_text())
subset = 'text' if '--text-only' in sys.argv else 'voice' if '--voice-only' in sys.argv else 'all'
through = next((int(v.split('=')[1]) for v in sys.argv if v.startswith('--through-order=')), None)
after = next((int(v.split('=')[1]) for v in sys.argv if v.startswith('--after-order=')), None)
suffix = subset + ('-through-'+str(through) if through else '') + ('-after-'+str(after) if after else '')
if ledger['status'] == 'running' and subset != 'text' and through is None:
    raise SystemExit('Wait for bounded stage completion/stoppage before masking')
output = root/('masked-'+suffix+'-review.json')
if output.exists():
    raise SystemExit('Existing review mask; preserve rather than reshuffle')
cases = {c['id']:c for p in ['evaluations/situated-support-20261104.json','evaluations/situated-support-heldout-20261104.json'] for c in json.loads(Path(p).read_text())['cases']}
rng = random.Random(secrets.randbits(256))
records = []; mapping = {}
for task in ledger['tasks']:
    if through is not None and task['order'] > through: continue
    if after is not None and task['order'] <= after: continue
    if task['status'] == 'reserved-before-request': raise SystemExit('Selected task still running')
    if subset == 'text' and task['mode'] != 'text': continue
    if subset == 'voice' and task['mode'] == 'text': continue
    label = secrets.token_hex(4)
    mapping[label] = {k:task[k] for k in ['order','mode','case','repeat','arm']}
    content = None
    if task['mode'] == 'text':
        content = task.get('result',{}).get('reply',{}).get('message')
        exercise = task.get('result',{}).get('reply',{}).get('exercise')
    else:
        exercise = None
        guide = next((r for r in task.get('evidence',{}).get('responses',[]) if r.get('role') == 'guide'),{})
        content = '\n'.join(c.get('transcript',c.get('text','')) for o in guide.get('output',[]) for c in o.get('content',[]) if c.get('transcript') or c.get('text'))
    recognized = [e['transcript'] for e in task.get('evidence',{}).get('events',[]) if e.get('type') == 'conversation.item.input_audio_transcription.completed' and e.get('transcript')]
    c = cases[task['case']]
    records.append({'reviewId':label,'case':task['case'],'repeat':task['repeat'],'mode':task['mode'],'deliveryStatus':task['status'],'input':c['input'],'must':c['must'],'mustNot':c['mustNot'],'response':content,'exercise':exercise,'parallelASR':recognized})
rng.shuffle(records)
output.write_text(json.dumps({'method':'Arm masked with independent random IDs and shuffled order; implementing-agent review, not independent blinded evaluation. Do not inspect mapping until ratings are saved.','records':records},indent=2)+'\n')
(root/('review-mapping-'+suffix+'-private.json')).write_text(json.dumps(mapping,indent=2)+'\n')
print(json.dumps({'maskedRecords':len(records),'reviewFile':str(output),'mappingNotPrinted':True}))
