"""Prepare arm-masked review files. Mapping remains separate until ratings are frozen."""
import json
import secrets
import random
from pathlib import Path
root = Path('test-results/situated-paid-run')
ledger = json.loads((root/'ledger.json').read_text())
if ledger['status'] == 'running':
    raise SystemExit('Wait for bounded stage completion/stoppage before masking')
output = root/'masked-review.json'
if output.exists():
    raise SystemExit('Existing review mask; preserve rather than reshuffle')
cases = {c['id']:c for p in ['evaluations/situated-support-20261104.json','evaluations/situated-support-heldout-20261104.json'] for c in json.loads(Path(p).read_text())['cases']}
rng = random.Random(secrets.randbits(256))
records = []; mapping = {}
for task in ledger['tasks']:
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
    c = cases[task['case']]
    records.append({'reviewId':label,'case':task['case'],'repeat':task['repeat'],'mode':task['mode'],'deliveryStatus':task['status'],'input':c['input'],'must':c['must'],'mustNot':c['mustNot'],'response':content,'exercise':exercise})
rng.shuffle(records)
output.write_text(json.dumps({'method':'Arm masked with independent random IDs and shuffled order; implementing-agent review, not independent blinded evaluation. Do not inspect mapping until ratings are saved.','records':records},indent=2)+'\n')
(root/'review-mapping-private.json').write_text(json.dumps(mapping,indent=2)+'\n')
print(json.dumps({'maskedRecords':len(records),'reviewFile':str(output),'mappingNotPrinted':True}))
