#!/usr/bin/env python3
"""Record a human check of source facts versus parallel ASR without editing original evidence."""
import argparse, hashlib, json, pathlib

def digest(path): return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
def read(path): return json.loads(pathlib.Path(path).read_text())
def write_new(path, data):
    with pathlib.Path(path).open('x') as stream: json.dump(data, stream, indent=2); stream.write('\n')
def template(root):
    root=pathlib.Path(root); plan=read(root/'plan.json')
    if digest(root/'scenarios.json')!=plan['scenario_sha256']: raise ValueError('Frozen scenarios changed')
    cases={s['id']:s for s in read(root/'scenarios.json')}; runs={r['id']:r for r in plan['runs']}
    items=[]
    for record in read(root/'records.json'):
        run=runs[record['run_id']]
        if run['arm']!='native-audio': continue
        source=cases[run['scenario']]['input']
        if hashlib.sha256(source.encode()).hexdigest()!=record['source_input_sha256']: raise ValueError('Source mismatch')
        result_path=root/record['run_id']/'result.json'
        if digest(result_path)!=record['result_sha256']: raise ValueError('Original result changed')
        result=read(result_path)
        items.append({'run_id':record['run_id'],'source':source,'asr':result.get('asr',''),
                      'critical_facts_and_closing_request_preserved':None,'reviewer':'','evidence':''})
    return {'records_sha256':digest(root/'records.json'),'items':items,
            'caution':'ASR is parallel diagnostic evidence; it cannot prove native internal perception.'}
def apply(root, review):
    root=pathlib.Path(root); expected=template(root)
    if review['records_sha256']!=expected['records_sha256']: raise ValueError('Records changed')
    originals={r['run_id']:r for r in expected['items']}; confirmations={}
    for item in review['items']:
        key=item['run_id']
        if key not in originals or key in confirmations: raise ValueError('Unknown/duplicate review')
        for field in ['source','asr']:
            if item[field]!=originals[key][field]: raise ValueError('Review changed evidence')
        if type(item['critical_facts_and_closing_request_preserved']) is not bool or not item['reviewer'].strip() or not item['evidence'].strip(): raise ValueError('Human verdict, reviewer and evidence required')
        confirmations[key]=item
    if set(confirmations)!=set(originals): raise ValueError('Missing transcript review')
    records=read(root/'records.json')
    for record in records:
        if record['run_id'] not in confirmations: continue
        confirmation=confirmations[record['run_id']]
        result=read(root/record['run_id']/'result.json')
        record['full_turn_verified']=bool(confirmation['critical_facts_and_closing_request_preserved'] and result['full_turn_verified'] and result['effective_config_verified'] and result['status']=='completed' and result.get('asr'))
        record['asr_review_required']=False; record['asr_review']=confirmation
    return records
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('command',choices=['template','apply']);parser.add_argument('root');parser.add_argument('out');parser.add_argument('--review')
    args=parser.parse_args()
    result=template(args.root) if args.command=='template' else apply(args.root,read(args.review))
    write_new(args.out,result)
