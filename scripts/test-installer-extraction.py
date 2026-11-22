"""Verify the installer's path/CRC safeguards independently of Windows UI."""
from pathlib import Path
import os,subprocess,sys,tempfile,unittest,zipfile
SCRIPT=Path(__file__).with_name('extract-windows-resources.py')
class Extraction(unittest.TestCase):
 def run_case(self,name,data=b'example',corrupt=False):
  location=tempfile.gettempdir()
  if os.name=='nt' and not location.startswith('\\\\?\\'):
   location='\\\\?\\UNC\\'+location[2:] if location.startswith('\\\\') else '\\\\?\\'+location
  temp=tempfile.TemporaryDirectory(prefix='docstudio-installer-check-',dir=location);self.addCleanup(temp.cleanup)
  base=Path(temp.name);archive=base/'payload.zip';dest=base/'install';dest.mkdir()
  with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED) as z:z.writestr(name,data)
  if corrupt:
   raw=bytearray(archive.read_bytes());at=raw.index(data);raw[at]^=1;archive.write_bytes(raw)
  destination=str(dest)
  if destination.startswith('\\\\?\\UNC\\'):
   destination='\\\\'+destination[8:]
  elif destination.startswith('\\\\?\\'):
   destination=destination[4:]
  result=subprocess.run([sys.executable,str(SCRIPT),str(archive),destination],capture_output=True,text=True)
  return result,dest
 def test_valid_payload_installs(self):
  result,dest=self.run_case('app-resources/test.txt');self.assertEqual(result.returncode,0,result.stderr);self.assertEqual((dest/'app-resources/test.txt').read_bytes(),b'example')
 def test_traversal_is_rejected(self):
  result,dest=self.run_case('../outside.txt');self.assertNotEqual(result.returncode,0);self.assertEqual(list(dest.iterdir()),[])
 def test_corrupt_payload_is_rejected_before_extraction(self):
  result,dest=self.run_case('app-resources/test.txt',corrupt=True);self.assertNotEqual(result.returncode,0);self.assertEqual(list(dest.iterdir()),[])
 def test_long_component_path(self):
  name='app-resources/'+('deep-module-'*5+'/')*4+'component.txt'
  result,dest=self.run_case(name)
  self.assertEqual(result.returncode,0,result.stderr)
  self.assertEqual((dest/name).read_bytes(),b'example')
if __name__=='__main__':unittest.main()
