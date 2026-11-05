#!/usr/bin/env python3
"""Offline usage/transport aggregation. Reported-token estimates are not invoice observations."""
import argparse, collections, json, pathlib, statistics

def aggregate(root):
    root=pathlib.Path(root);rows=json.loads((root/'records.json').read_text());ledger=json.loads((root/'ledger.json').read_text())
    plan=json.loads((root/'plan.json').read_text());runs={r['id']:r for r in plan['runs']}
    totals=collections.defaultdict(float);timings=collections.defaultdict(list);durations=collections.defaultdict(list)
    usage_missing=[];counts=collections.Counter();responses=set();word_counts=collections.defaultdict(list)
    for r in rows:
        arm=runs[r['run_id']]['arm'];counts[(arm,r['status'])]+=1
        word_counts[arm].append(len(r['answer'].split()))
        raw=r.get('raw',{});response=raw.get('response',{});usage=response.get('usage')
        if arm=='text-tts':
            timings[arm].append(r['timing']['full_text_plus_complete_synthesis_ms']);continue
        rid=response.get('id')
        if rid:
            if rid in responses: raise ValueError('Duplicate response ID')
            responses.add(rid)
        if not usage:usage_missing.append(r['run_id']);continue
        if arm.startswith('native'):
            i=usage['input_token_details'];o=usage['output_token_details'];c=i.get('cached_tokens_details',{})
            totals['native_input_tokens']+=usage['input_tokens'];totals['native_output_tokens']+=usage['output_tokens']
            totals['native_response_estimate_usd']+=((i['text_tokens']-c.get('text_tokens',0))*4+c.get('text_tokens',0)*.4+(i['audio_tokens']-c.get('audio_tokens',0))*32+c.get('audio_tokens',0)*.4+o['text_tokens']*16+o['audio_tokens']*64)/1e6
            if r['timing']['first_pcm_energy_received_ms'] is not None:timings[arm].append(r['timing']['first_pcm_energy_received_ms'])
            durations[arm].append(r['timing']['output_pcm_duration_ms'])
            if arm=='native-audio':
                events=[e for e in raw['events'] if e.get('type')=='conversation.item.input_audio_transcription.completed']
                if len(events)!=1 or not events[0].get('usage'):usage_missing.append(r['run_id']+'/ASR')
                else:
                    u=events[0]['usage'];totals['asr_calls_with_usage']+=1
                    totals['asr_input_tokens']+=u['input_tokens'];totals['asr_output_tokens']+=u['output_tokens']
                    totals['asr_estimate_usd']+=(u['input_tokens']*1.25+u['output_tokens']*5)/1e6
        else:
            i=usage['input_tokens'];d=usage.get('input_tokens_details',{});cached=d.get('cached_tokens',0);writes=d.get('cache_write_tokens',0);o=usage['output_tokens']
            if cached+writes>i:raise ValueError('Overlapping Sol input categories require manual accounting')
            totals['sol_input_tokens']+=i;totals['sol_cache_write_tokens']+=writes;totals['sol_cached_tokens']+=cached;totals['sol_output_tokens']+=o
            totals['sol_estimate_low_usd']+=((i-cached-writes)*2+cached*.1+writes*2.5+o*10)/1e6
            totals['sol_estimate_high_usd']+=((i-cached-writes)*2+cached*.1+writes*5+o*10)/1e6
            timings[arm].append(r['timing']['full_response_ms'])
    stats=lambda values:{'n':len(values),'median':statistics.median(values),'min':min(values),'max':max(values)}
    return {'state':'offline-aggregation','observed_record_count':len(rows),'expected_units':len(runs),
      'paid_attempt_count':len(ledger['attempts']),'reserved_usd':ledger['reserved_usd'],'ceiling_usd':ledger['ceiling_usd'],
      'attempt_states':dict(collections.Counter(a['state'] for a in ledger['attempts'])),
      'delivery':[{ 'arm':a,'status':s,'n':n} for (a,s),n in counts.items()],
      'token_usage_totals':dict(totals),'usage_missing':usage_missing,
      'reported_usage_estimate_low_usd':totals['native_response_estimate_usd']+totals['asr_estimate_usd']+totals['sol_estimate_low_usd'],
      'reported_usage_estimate_high_usd':totals['native_response_estimate_usd']+totals['asr_estimate_usd']+totals['sol_estimate_high_usd'],
      'cost_caveat':'Not invoiced spend. Sol cache-write estimate spans documented 30m and 12h write prices; no billing ledger access. Missing usage is not treated as free.',
      'timing_ms':{a:stats(v) for a,v in timings.items() if v},'native_pcm_duration_ms':{a:stats(v) for a,v in durations.items() if v},
      'answer_word_counts':{a:stats(v) for a,v in word_counts.items() if v},
      'timing_definitions':{'production-text':'request to complete structured response','matched-text':'request to complete raw text response','native-text':'text input submission to first non-silent received PCM chunk','native-audio':'paced final audio sample/manual commit to first non-silent received PCM chunk','text-tts':'complete matched-text response plus complete local synthesis; no playback measurement'},
      'source_parity':{'native_matched_instruction_hashes':sorted({__import__('hashlib').sha256(r['raw']['effective']['instructions'].encode()).hexdigest() for r in rows if runs[r['run_id']]['arm'].startswith('native')}),
         'matched_text_instruction_hashes':sorted({__import__('hashlib').sha256(r['raw']['request']['instructions'].encode()).hexdigest() for r in rows if runs[r['run_id']]['arm']=='matched-text'})}}
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('root');p.add_argument('out');a=p.parse_args()
    with pathlib.Path(a.out).open('x') as stream:json.dump(aggregate(a.root),stream,indent=2);stream.write('\n')
