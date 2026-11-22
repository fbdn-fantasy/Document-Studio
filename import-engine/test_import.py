"""Real PDFium/DOCX integration tests; no mocked extraction or OCR."""
import importlib.util, json, shutil, tempfile, unittest, zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('worker',Path(__file__).with_name('worker.py'));worker=importlib.util.module_from_spec(spec);spec.loader.exec_module(worker)

class ImportTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
 def tearDown(self):self.temp.cleanup()
 def fixture(self,name='digital.pdf',encrypted=False):
  p=self.root/name;fixture=Path(__file__).resolve().parent.parent/'test'/'import-evidence'/'inputs'/('encrypted.pdf' if encrypted else 'digital.pdf');shutil.copyfile(fixture,p);return p
 def test_digital_geometry_text_graphics_and_archive(self):
  path=self.fixture();before=path.read_bytes();pages,sources=worker.process_inputs([str(path)],self.root)
  self.assertEqual(len(pages),2);self.assertTrue(all(p['method']=='pdf-text' for p in pages));self.assertIn('Native selectable',str(pages[0]['blocks']))
  self.assertNotEqual(pages[0]['width'],pages[1]['width']);self.assertEqual(path.read_bytes(),before)
  project=worker.project_for(pages,'Fixture');output=self.root/'result.docx';worker.build_docx(pages,output,project)
  validation=worker.validate_output(output,pages);self.assertEqual(validation['missingTextBlocks'],0);self.assertEqual(validation['pageSections'],2)
  with zipfile.ZipFile(output) as z:self.assertIn('document-studio/project.json',z.namelist())
  self.assertIn('ds-import-page',project['html']);self.assertIn('font-weight:bold',project['html'])
 def test_encrypted_pdf_fails_cleanly(self):
  with self.assertRaisesRegex(ValueError,'password protected'):worker.process_inputs([str(self.fixture(encrypted=True))],self.root)
 def test_malformed_pdf_fails_cleanly(self):
  p=self.root/'broken.pdf';p.write_bytes(b'%PDF-1.7 damaged')
  with self.assertRaisesRegex(ValueError,'damaged'):worker.process_inputs([str(p)],self.root)
 def test_unsupported_extension(self):
  p=self.root/'not.exe';p.write_bytes(b'no')
  with self.assertRaisesRegex(ValueError,'Unsupported'):worker.process_inputs([str(p)],self.root)
 def test_html_merged_cells(self):
  cells=worker.normalize_cells({'html':'<table><tr><td colspan="2">One</td></tr><tr><td>A</td><td>B</td></tr></table>'})
  self.assertEqual(cells[0]['colspan'],2);self.assertEqual(cells[2]['col'],1)
 def test_incomplete_formula_is_not_invented(self):
  with self.assertRaisesRegex(ValueError,'Incomplete'):worker.latex_to_omml(r'\ =\ \ c^{2}')
  self.assertIn('sSup',worker.latex_to_omml('E=mc^2'))

if __name__=='__main__':unittest.main()
