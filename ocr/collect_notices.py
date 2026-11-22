"""Create model provenance, pinned dependency list and copied license notices."""
from pathlib import Path
import hashlib,importlib.metadata,json,shutil,sys,zipfile
import yaml
ROOT=Path(__file__).resolve().parent
APP=ROOT.parent

def sha(path):
    digest=hashlib.sha256()
    with path.open('rb') as stream:
        while chunk:=stream.read(1024*1024):digest.update(chunk)
    return digest.hexdigest()

def main():
    deps=[]
    pinned=[]
    for dist in sorted(importlib.metadata.distributions(),key=lambda d:d.metadata['Name'].lower()):
        name=dist.metadata['Name']
        meta=dist.metadata
        record={'name':name,'version':dist.version,'license':meta.get('License-Expression',meta.get('License','See bundled notices')),'notices':[]}
        for path in dist.files or []:
            if any(token in path.name.lower() for token in ('license','copying','notice','copyright')) and ('.dist-info/' in str(path).replace('\\','/') or path.name=='COPYING'):
                origin=Path(dist.locate_file(path))
                if not origin.is_file():continue
                target=ROOT/'licenses'/'packages'/name/str(path).replace('\\','/').split('.dist-info/')[-1]
                target.parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(origin,target)
                record['notices'].append(str(target.relative_to(APP)).replace('\\','/'))
        deps.append(record)
        pinned.append(f'{name}=={dist.version}')
    (ROOT/'requirements-lock.txt').write_text('\n'.join(pinned)+'\n',encoding='utf-8')
    (ROOT/'dependency-manifest.json').write_text(json.dumps({'python':sys.version,'packages':deps},indent=2),encoding='utf-8')
    models=[]
    for folder in sorted((ROOT/'models').iterdir()):
        if not folder.is_dir():continue
        config=yaml.safe_load((folder/'inference.yml').read_text(encoding='utf-8'))
        models.append({'model':config['Global']['model_name'],'directory':str(folder.relative_to(APP)).replace('\\','/'),'license':'Apache-2.0 (supplied model card)','files':[{'name':f.name,'bytes':f.stat().st_size,'sha256':sha(f)} for f in sorted(folder.iterdir()) if f.is_file()]})
    (ROOT/'model-manifest.json').write_text(json.dumps({'models':models,'runtime':'PaddlePaddle 3.3.1 CPU / PaddleOCR 3.7.0 / PaddleX 3.7.2','inference':'Paddle inference JSON + pdiparams, CPU, MKLDNN disabled'},indent=2),encoding='utf-8')
    shutil.copy2(APP/'runtime'/'LICENSE.txt',ROOT/'licenses'/'Python-LICENSE.txt')
    print(json.dumps({'models':len(models),'packages':len(deps),'licenses':sum(len(d['notices']) for d in deps)}))

if __name__=='__main__':main()
