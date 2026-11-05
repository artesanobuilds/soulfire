"""Reconcile completed voice requests; retain immutable historic reservations separately.
No invoice claims. Missing/unfinished usage prevents release. Rates intentionally exceed documented rates.
"""
import json,pathlib,math,hashlib
from decimal import Decimal as D

def reconcile(pilot,followup):
 pilot,followup=pathlib.Path(pilot),pathlib.Path(followup)
 records=json.loads((pilot/'records.json').read_text());ledger=json.loads((pilot/'ledger.json').read_text())
 if len(ledger['attempts'])!=32 or any(x['state']!='completed' for x in ledger['attempts']):raise ValueError('Unfinished pilot obligation')
 f=json.loads((followup/'ledger.json').read_text())
 if len(f['attempts'])!=3 or any(x['state']!='completed' for x in f['attempts']):raise ValueError('Unfinished follow-up obligation')
 native=[];text=[];asr=[];ids=[]
 for row in records:
  if row['run_id'].endswith('text-tts'):continue
  if row['status']!='completed':raise ValueError('Incomplete generation')
  response=row['raw']['response'];u=response['usage'];ids.append(response['id'])
  (native if 'effective' in row['raw'] else text).append(u)
  if row['run_id'].endswith('native-audio'):
   events=[e['usage'] for e in row['raw']['events'] if e['type']=='conversation.item.input_audio_transcription.completed']
   if len(events)!=1:raise ValueError('Missing/duplicate ASR usage')
   asr+=events
 n=json.loads((followup/'native-browser.json').read_text())
 if n['status']!='completed' or n['evidence']['response']['status']!='completed':raise ValueError('Native followup incomplete')
 native.append(n['evidence']['response']['usage']);ids.append(n['evidence']['response']['id'])
 asr.extend(e['event']['usage'] for e in n['evidence']['events'] if e['event']['type']=='conversation.item.input_audio_transcription.completed')
 response=json.loads((followup/'text-provider-response.json').read_text())
 if response['http_status']!=200 or response['body']['status']!='completed':raise ValueError('Text followup incomplete')
 text.append(response['body']['usage']);ids.append(response['body']['id'])
 a=json.loads((followup/'transcribe-provider-response.json').read_text())
 if a['http_status']!=200:raise ValueError('Transcription incomplete')
 asr.append(a['body']['usage'])
 if len(ids)!=len(set(ids)) or (len(native),len(text),len(asr))!=(17,17,10):raise ValueError('Coverage/dedup failure')
 for u in native+text+asr:
  if any(type(u[k]) is not int or u[k]<0 for k in ['input_tokens','output_tokens']):raise ValueError('Invalid token usage')
 # Native: every input token priced as audio at DOUBLE $32/M; every output at DOUBLE $64/M.
 # Text: every input priced at DOUBLE maximum cache-write $5/M; every output at DOUBLE $10/M.
 # ASR: every token priced at native-audio $32/$64, far above transcriber $1.25/$5.
 upper=sum((D(u['input_tokens'])*64+D(u['output_tokens'])*128)/1000000 for u in native)
 upper+=sum((D(u['input_tokens'])*10+D(u['output_tokens'])*20)/1000000 for u in text)
 upper+=sum((D(u['input_tokens'])*32+D(u['output_tokens'])*64)/1000000 for u in asr)
 protected=D(math.ceil(float(upper)*4))/4
 return {'historical_reservations_usd':5,'historical_ledgers_preserved':True,'completed_generations':len(ids),'completed_transcription_usages':len(asr),'usage_missing':False,'duplicate_response_ids':False,'conservative_completed_liability_bound_usd':float(upper),'protected_prior_obligation_usd':float(protected),'new_headroom_usd':float(D(5)-protected),'global_ceiling_usd':5,'invoice_observed':False,'basis':'Complete returned usage, no cache discounts; doubled maximum model/modal rates and rounding up to next $0.25. Historical authorization is a $5 charge ceiling, not permanent consumption of all initial maximum reservations.'}
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('pilot');p.add_argument('followup');p.add_argument('out');a=p.parse_args();result=reconcile(a.pilot,a.followup)
 with pathlib.Path(a.out).open('x') as f:json.dump(result,f,indent=2);f.write('\n')
 print(json.dumps(result,indent=2))
