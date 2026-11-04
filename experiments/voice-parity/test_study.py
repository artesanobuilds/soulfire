import importlib.util, json, pathlib, tempfile, unittest
spec = importlib.util.spec_from_file_location('study', pathlib.Path(__file__).with_name('study.py'))
study = importlib.util.module_from_spec(spec); spec.loader.exec_module(study)
class StudyTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.capture = self.root / 'capture.json'; study.write(self.capture, {'instructions': 'fixed'})
        self.folder = self.root / 'study'; self.manifest = study.prepare(self.folder, self.capture)
        self.record = {'run_id': self.manifest['runs'][0]['id'], 'status': 'completed', 'answer': 'test answer', 'effective_config_verified': True, 'full_turn_verified': True}
    def run_blind(self, rows):
        p = self.root / 'records.json'; study.write(p, rows)
        return study.blind(self.folder, p, self.root / 'review')
    def test_empty_audio_rejected(self):
        import wave
        p = self.root / 'empty.wav'
        with wave.open(str(p), 'wb') as wav:
            wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(24000)
        with self.assertRaises(ValueError): study.validate_audio(p)
    def test_plan_and_no_overwrite(self):
        self.assertEqual(len(self.manifest['runs']), 120)
        self.assertEqual(self.manifest['network_calls'], 0)
        with self.assertRaises(FileExistsError): study.prepare(self.folder, self.capture)
    def test_blinding_removes_arm_and_preserves_coverage(self):
        self.assertEqual(self.run_blind([self.record]), 1)
        packet = study.read(self.root / 'review/review.json')
        self.assertEqual(set(packet[0]), {'id', 'input', 'checks', 'answer'})
        self.assertEqual(len(study.read(self.root / 'review/coverage.json')['missing']), 119)
    def test_cap_failure_not_quality_score(self):
        self.record['status'] = 'incomplete'
        self.assertEqual(self.run_blind([self.record]), 0)
        self.assertEqual(len(study.read(self.root / 'review/delivery-failures.json')), 1)
    def test_duplicate_rejected(self):
        with self.assertRaises(ValueError): self.run_blind([self.record, self.record])
    def test_frozen_tamper_rejected(self):
        study.write(self.folder / 'instructions.json', {'changed': True})
        with self.assertRaises(ValueError): self.run_blind([self.record])
    def test_unscored_and_duplicate_ratings_rejected(self):
        self.run_blind([self.record]); review = self.root / 'review'
        rows = study.read(review / 'ratings-template.json'); rows[0]['rater'] = 'A'; rows[0]['evidence'] = 'quote'
        p = self.root / 'ratings.json'; study.write(p, rows)
        with self.assertRaises(ValueError): study.report(review, p)
        rows[0].update({c: 2 for c in study.CRITERIA}); study.write(p, rows + rows)
        with self.assertRaises(ValueError): study.report(review, p)
if __name__ == '__main__': unittest.main()
