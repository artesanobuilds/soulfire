import unittest,tempfile,pathlib,sys
import numpy as np,soundfile as sf
from current_audio_finish import finish
class BoundaryFinishing(unittest.TestCase):
 def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name);self.sr=8000;self.t=np.arange(self.sr*30)/self.sr
 def tearDown(self):self.tmp.cleanup()
 def runFinish(self,a):
  raw=self.root/'raw-source.wav';out=self.root/'source.wav';sf.write(raw,a,self.sr,subtype='FLOAT');r=finish(raw,out,30,'piano');b,_=sf.read(out,always_2d=True);return r,b
 def test_trailing_padding_only_and_stereo_antiphase_preserved(self):
  a=.2*np.sin(2*np.pi*220*self.t);a[(self.t>10)&(self.t<14)]=0;a[self.t>24]=0;r,b=self.runFinish(np.c_[a,-a]);self.assertGreater(r['playableDuration'],23);self.assertLess(r['playableDuration'],25);self.assertEqual(r['interiorMaxSampleDifference'],0);self.assertLess(r['last100msRmsDbfs'],-50);self.assertTrue(np.all(b[-1]==0))
 def test_later_music_after_an_internal_rest_is_not_cut(self):
  a=.2*np.sin(2*np.pi*220*self.t);a[(self.t>21)&(self.t<26)]=0;r,b=self.runFinish(np.c_[a,a]);self.assertGreater(r['playableDuration'],29);self.assertEqual(r['interiorMaxSampleDifference'],0)
 def test_held_low_bass_is_not_assumed_silence(self):
  a=.2*np.sin(2*np.pi*55*self.t);r,b=self.runFinish(np.c_[a,a]);self.assertGreater(r['playableDuration'],29)
 def test_empty_audio_is_rejected_not_filled(self):
  with self.assertRaises(AssertionError):self.runFinish(np.zeros((len(self.t),2)))
 def test_nonfinite_audio_is_rejected(self):
  a=np.ones((len(self.t),2))*.1;a[20]=np.nan
  with self.assertRaises(AssertionError):self.runFinish(a)
 def test_early_ending_needs_regeneration_not_overcropping(self):
  a=.2*np.sin(2*np.pi*220*self.t);a[self.t>15]=0
  with self.assertRaises(ValueError):self.runFinish(np.c_[a,a])
 def test_post_fade_quiet_tail_is_bounded_without_touching_the_middle(self):
  from current_audio_finish import envelope
  from scipy.signal import butter,sosfilt
  a=.2*np.sin(2*np.pi*220*self.t)*np.exp(-np.maximum(0,self.t-22)*1.2)
  r,b=self.runFinish(np.c_[a,a]);filtered=sosfilt(butter(4,80,fs=self.sr,btype='highpass',output='sos'),b,axis=0);power,hop=envelope(filtered,self.sr);db=20*np.log10(power);active=np.flatnonzero(db>max(-65,float(np.percentile(db,95))-35));tail=len(b)/self.sr-(active[-1]+1)*hop/self.sr
  self.assertLess(tail,1.3);self.assertEqual(r['interiorMaxSampleDifference'],0)
unittest.main()
