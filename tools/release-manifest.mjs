import {readFile,writeFile,stat} from 'node:fs/promises';import {join} from 'node:path';import {createHash} from 'node:crypto';
export async function writeReleaseManifest({directory='release',manifestPath='dist/manifest.json',iconPath,owner='HyperXcess',repo,now=Date.now()}){
 const appManifest=JSON.parse(await readFile(manifestPath,'utf8'));if(!repo||!appManifest.id||!appManifest.version)throw Error('Repository, app ID and version are required.');
 const filename=appManifest.id+'-v'+appManifest.version+'.zip',archivePath=join(directory,filename),bytes=await readFile(archivePath),size=(await stat(archivePath)).size;
 const metadata={meta_version:'0.11.8',meta_type:'app',repository:`https://api.github.com/repos/${owner}/${repo}`,appManifest,updateUrl:`https://github.com/${owner}/${repo}/releases/download/v${appManifest.version}/${filename}`,downloads:0,size,hash:createHash('sha512').update(bytes).digest('hex'),hashAlgorithm:'sha512',updatedAt:now,createdAt:now};
 if(iconPath)metadata.icon='data:image/svg+xml;base64,'+Buffer.from(await readFile(iconPath)).toString('base64');
 await writeFile(join(directory,'latest.json'),JSON.stringify(metadata,null,2)+'\n');return metadata;
}
