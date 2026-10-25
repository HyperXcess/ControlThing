import {readFile,writeFile,copyFile} from 'node:fs/promises';
const path=process.argv[2];if(!path)throw Error('Specify your editable mapping profile JSON path, with DeskThing closed.');
const data=JSON.parse(await readFile(path,'utf8'));if(!data.mapping||data.id==='default')throw Error('Choose an editable custom profile.');
try{await readFile(path+'.controlthing.backup')}catch{await copyFile(path,path+'.controlthing.backup')}
data.mapping.Swipe={...data.mapping.Swipe,6:{id:'mission-hide',source:'server',enabled:true},7:{id:'mission-show',source:'server',enabled:true}};
await writeFile(path,JSON.stringify(data,null,2));console.log('Swipe actions saved. Restart DeskThing with this profile active.');
