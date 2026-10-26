import {readFile,writeFile,access,copyFile} from 'node:fs/promises';
import {dirname,resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=dirname(fileURLToPath(import.meta.url));
async function findAssets(){const i=process.argv.indexOf('--assets');if(i>=0&&process.argv[i+1])return resolve(process.argv[i+1]);let parent=root;for(let n=0;n<6;n++){const candidate=join(parent,'webapp','assets');try{await access(join(candidate,'index-BoMDv8nD.js'));await access(join(candidate,'index-legacy-DSl9FxfH.js'));return candidate;}catch{}const next=dirname(parent);if(next===parent)break;parent=next;}throw Error('Could not find a compatible staged DeskThing client. Install client 0.11.2 first, then retry.');}
const assets=await findAssets(),config=JSON.parse(await readFile(join(root,'client-patches.json'),'utf8')),changes=[];
for(const spec of config.specs){const path=join(assets,spec.file),original=await readFile(path,'utf8');let source=original;
 if(config.feature==='launcher'){
  const a=source.indexOf(spec.start),b=source.indexOf(spec.end,a);if(a<0||b<0)throw Error('Unsupported client bundle: '+spec.file+'; no files were changed. Tested with client 0.11.2 only.');
  const shade=source.indexOf(','+spec.name+'=',a),stop=shade>=0&&shade<b?shade:b+1;source=source.slice(0,a)+spec.start.split('=')[0]+'='+spec.expression+source.slice(stop);
 }else if(config.feature==='control'){
  if(source.includes(spec.name+'=')){const a=source.indexOf(','+spec.name+'='),b=source.indexOf(spec.boundary,a);if(a<0||b<0)throw Error('Unsupported shade boundaries; no files changed.');source=source.slice(0,a)+','+spec.name+'='+spec.expression+source.slice(b);}
  else{if(!source.includes(spec.boundary)||!source.includes(spec.root)||!source.includes(spec.method))throw Error('Unsupported client layout; no files changed. Tested with client 0.11.2 only.');source=source.replace(spec.boundary,','+spec.name+'='+spec.expression+spec.boundary);source=source.replace(spec.root,'children:['+spec.jsx+'.jsx('+spec.name+',{}),'+spec.root.slice('children:['.length));const x=spec.argument;source=source.replace(spec.method,spec.method+'if('+x+'.id==="mission-show"||'+x+'.id==="mission-hide"){window.dispatchEvent(new CustomEvent("hyper-mission",{detail:'+x+'.id==="mission-show"?"show":"hide"}));return;}');}
 }else if(config.feature==='calendar'){
  if(!source.includes('/*calendar-dial*/')){if(!source.includes(spec.wheelPrefix))throw Error('Unsupported client wheel handler; no files changed. Tested with client 0.11.2 only.');const e=spec.event;const insert=`/*calendar-dial*/if(${spec.pref}.getState().preferences.currentView.name==="agenda"&&!${spec.wheel}.getState().wheelState){const delta=Math.abs(${e}.deltaX)>Math.abs(${e}.deltaY)?${e}.deltaX:${e}.deltaY;const frame=Array.from(document.querySelectorAll("iframe")).find(frame=>/\\/app\\/agenda(?:[/?#]|$)/.test(frame.src));if(frame&&frame.contentWindow){frame.contentWindow.postMessage({source:"deskthing",type:"calendar-dial",payload:{direction:delta===0?0:delta>0?1:-1}},new URL(frame.src).origin);return;}}`;source=source.replace(spec.wheelPrefix,spec.wheelPrefix.replace('return;','return;'+insert));}
 }else throw Error('Unknown client integration.');
 if(source.includes('miniplayer:{state:'))for(const edit of spec.isolationEdits||[]){if(source.includes(edit.marker))continue;if(!source.includes(edit.anchor))throw Error('Unsupported gesture layout; no files changed.');source=source.replace(edit.anchor,edit.replacement)}
 changes.push({path,original,source});
}
// All supported-layout checks finish before any writes. Roll back changed files on a write failure.
const written=[];try{for(const item of changes){if(item.original===item.source)continue;const backup=item.path+'.'+config.feature+'.backup';try{await access(backup);}catch{await copyFile(item.path,backup);}await writeFile(item.path,item.source);written.push(item);}}catch(error){for(const item of written)await writeFile(item.path,item.original);throw error;}
console.log(config.label+' client integration staged. Existing calendar settings and other supported integrations were preserved.');
console.log('Next: DeskThing > Clients > Push staged client, then Restart Chromium on the Device. No firmware flashing or automatic device restart was performed.');
