import unittest,tempfile,pathlib,json
from reconcile_budget import reconcile
class ReconcileTest(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=pathlib.Path(self.temp.name);self.p=self.root/'pilot';self.f=self.root/'follow';self.p.mkdir();self.f.mkdir();rows=[]
  self.usage={'input_tokens':100,'output_tokens':10};asr={'input_tokens':20,'output_tokens':5}
  for arm in ['native-audio','native-text','production-text','matched-text']:
   for i in range(8):
    raw={'response':{'id':f'{arm}-{i}','usage':self.usage}}
    if arm.startswith('native'):raw['effective']={}
    if arm=='native-audio':raw['events']=[{'type':'conversation.item.input_audio_transcription.completed','usage':asr}]
    rows.append({'run_id':f'{i}-{arm}','status':'completed','raw':raw})
  self.write(self.p/'records.json',rows);self.write(self.p/'ledger.json',{'attempts':[{'state':'completed'}]*32});self.write(self.f/'ledger.json',{'attempts':[{'state':'completed'}]*3})
  self.write(self.f/'native-browser.json',{'status':'completed','evidence':{'response':{'id':'follow-native','status':'completed','usage':self.usage},'events':[{'event':{'type':'conversation.item.input_audio_transcription.completed','usage':asr}}]}})
  self.write(self.f/'text-provider-response.json',{'http_status':200,'body':{'id':'follow-text','status':'completed','usage':self.usage}});self.write(self.f/'transcribe-provider-response.json',{'http_status':200,'body':{'usage':asr}})
 def write(self,p,v):p.write_text(json.dumps(v))
 def test_inflated_bound_and_rounding(self):
  r=reconcile(self.p,self.f);self.assertAlmostEqual(r['conservative_completed_liability_bound_usd'],.16056);self.assertEqual(r['protected_prior_obligation_usd'],.25);self.assertEqual(r['new_headroom_usd'],4.75);self.assertFalse(r['invoice_observed'])
 def test_unfinished_obligation_blocks_reconciliation(self):
  self.write(self.f/'ledger.json',{'attempts':[{'state':'completed'}]*2+[{'state':'uncertain'}]})
  with self.assertRaises(ValueError):reconcile(self.p,self.f)
 def test_missing_usage_never_treated_as_zero(self):
  rows=json.loads((self.p/'records.json').read_text());del rows[0]['raw']['response']['usage'];self.write(self.p/'records.json',rows)
  with self.assertRaises(KeyError):reconcile(self.p,self.f)
 def test_duplicate_response_blocks_release(self):
  rows=json.loads((self.p/'records.json').read_text());rows[1]['raw']['response']['id']=rows[0]['raw']['response']['id'];self.write(self.p/'records.json',rows)
  with self.assertRaises(ValueError):reconcile(self.p,self.f)
 def test_invalid_usage_blocks_release(self):
  rows=json.loads((self.p/'records.json').read_text());rows[0]['raw']['response']['usage']['input_tokens']=-1;self.write(self.p/'records.json',rows)
  with self.assertRaises(ValueError):reconcile(self.p,self.f)
if __name__=='__main__':unittest.main()
