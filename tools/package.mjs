import {execFileSync} from 'node:child_process';import {mkdir,readFile,rm,cp} from 'node:fs/promises';import {writeReleaseManifest} from './release-manifest.mjs';
const meta=JSON.parse(await readFile('package.json','utf8')),repo=meta.homepage.split('/').filter(Boolean).at(-1);await rm('release',{recursive:true,force:true});await mkdir('release',{recursive:true});
execFileSync(process.execPath,['build.mjs'],{stdio:'inherit'});const manifest=JSON.parse(await readFile('dist/manifest.json','utf8'));if(manifest.version!==meta.version)throw Error('App manifest and package versions must match.');
execFileSync('zip',['-qr','../release/'+manifest.id+'-v'+meta.version+'.zip','.'],{cwd:'dist'});
await writeReleaseManifest({repo,iconPath:'dist/icons/'+manifest.id+'.svg'});
const folder='release/source';await mkdir(folder,{recursive:true});const files=execFileSync('git',['ls-files'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const file of files)await cp(file,folder+'/'+file,{recursive:true});
execFileSync('zip',['-qr','../'+repo+'-source-v'+meta.version+'.zip','.'],{cwd:folder});await rm(folder,{recursive:true,force:true});console.log('Runtime ZIP, source ZIP, and DeskThing latest.json are in release/.');
