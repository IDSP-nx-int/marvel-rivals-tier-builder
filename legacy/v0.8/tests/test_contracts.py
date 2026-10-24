"""Run: python -m unittest discover -s tests -v"""
import copy,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from validate import demo_bundle, validate_bundle
from jsonschema.exceptions import ValidationError

class ContractTests(unittest.TestCase):
 def setUp(self):self.bundle=list(demo_bundle())
 def check_invalid(self):
  with self.assertRaises((ValueError,ValidationError)):
   validate_bundle(*self.bundle)
 def test_demo_valid(self):
  results=validate_bundle(*self.bundle)
  self.assertEqual(len(results['resourceConflicts']),1)
  self.assertEqual(results['resourceConflicts'][0]['demand'],2)
  self.assertEqual(results['resourceConflicts'][0]['supply'],1)
 def test_duplicate_hero_in_composition(self):
  self.bundle[2][0]['slots'][1]['heroId']=self.bundle[2][0]['slots'][0]['heroId']
  self.check_invalid()
 def test_wrong_official_class(self):
  self.bundle[1]['assignments'][0]['subroleId']='subrole.main-dps'
  self.check_invalid()
 def test_invalid_score(self):
  self.bundle[1]['assignments'][0]['ratings']['cap.space-control']['score']=6
  self.check_invalid()
 def test_unknown_capability(self):
  self.bundle[1]['assignments'][0]['ratings']['cap.unknown']={'state':'rated','score':4}
  self.check_invalid()
 def test_patch_mismatch(self):
  self.bundle[2][0]['patchId']='patch.fake'
  self.check_invalid()
 def test_locked_without_locked_at(self):
  a=self.bundle[1]['assignments'][1]
  self.assertTrue(a['locked'])
  del a['lockedAt']
  self.check_invalid()
 def test_unknown_not_zero_and_locks_allow_partial_profile(self):
  a=self.bundle[1]['assignments'][-1]
  self.assertEqual(a['ratings']['cap.effective-uptime'],{'state':'not_applicable'})
  self.assertNotIn('cap.kill-conversion',a['ratings'])
  a['locked']=True;a['lockedAt']='2026-10-23T10:00:00-06:00'
  results=validate_bundle(*self.bundle)
  self.assertEqual(results['assignments'],13)
 def test_excluded_subrole_cannot_be_ranked(self):
  self.bundle[1]['eligibilityOverrides'].append({'heroId':'hero.bastion','subroleId':'subrole.main-tank','status':'ineligible'})
  self.check_invalid()
 def test_resource_claim_unknown(self):
  self.bundle[2][0]['resourceClaims'][0]['resourceId']='res.fake'
  self.check_invalid()
 def test_report_wrong_revision(self):
  self.bundle[5]['inputs']['modelRevision']=8
  self.check_invalid()
 def test_not_applicable_cannot_have_a_score(self):
  self.bundle[1]['assignments'][-1]['ratings']['cap.effective-uptime']['score']=0
  self.check_invalid()

if __name__=='__main__':unittest.main()
