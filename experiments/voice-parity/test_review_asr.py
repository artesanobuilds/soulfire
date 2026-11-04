import unittest, tempfile, pathlib, json, hashlib
import review_asr as review
class ASRReviewTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name)
  def write(path,data): (self.root/path).write_text(json.dumps(data))
  self.source='A reply is due by noon.';self.run='test-native-audio'
  write('scenarios.json',[{'id':'test','input':self.source}])
  write('plan.json',{'scenario_sha256':review.digest(self.root/'scenarios.json'),'runs':[{'id':self.run,'scenario':'test','arm':'native-audio'}]})
  (self.root/self.run).mkdir()
  write(self.run+'/result.json',{'status':'completed','effective_config_verified':True,'full_turn_verified':True,'asr':self.source})
  write('records.json',[{'run_id':self.run,'source_input_sha256':hashlib.sha256(self.source.encode()).hexdigest(),'result_sha256':review.digest(self.root/self.run/'result.json'),'full_turn_verified':False}])
 def test_confirmation_required_and_original_preserved(self):
  template=review.template(self.root)
  with self.assertRaises(ValueError): review.apply(self.root,template)
  template['items'][0].update(critical_facts_and_closing_request_preserved=True,reviewer='A',evidence='Noon duty preserved.')
  self.assertTrue(review.apply(self.root,template)[0]['full_turn_verified'])
  self.assertFalse(review.read(self.root/'records.json')[0]['full_turn_verified'])
 def test_changed_asr_cannot_be_approved(self):
  template=review.template(self.root);template['items'][0].update(asr='invented',critical_facts_and_closing_request_preserved=True,reviewer='A',evidence='test')
  with self.assertRaises(ValueError): review.apply(self.root,template)
