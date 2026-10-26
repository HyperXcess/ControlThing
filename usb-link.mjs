import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const execute=promisify(execFile),ADB=process.env.DESKTHING_ADB||'/Applications/DeskThing.app/Contents/Resources/mac/adb';
export function chooseCarThing(text,configured=''){const rows=text.split(/\r?\n/).map(line=>line.match(/^(\S+)\s+device\s+.*(?:product:spotify-car-thing|model:Car_Thing)\b/)).filter(Boolean).map(m=>m[1]);return configured?rows.includes(configured)?configured:null:rows.length===1?rows[0]:null}
export function hasListener(text,port){return text.split(/\r?\n/).some(line=>new RegExp('(?:127\\.0\\.0\\.1|0\\.0\\.0\\.0|::):'+port+'\\s').test(line)&&line.includes('LISTEN'))}
export function createUSBLink({run=(args)=>execute(ADB,args,{timeout:6000,maxBuffer:65536}),getSettings=()=>({}),now=()=>Date.now(),report=()=>{},interval=15000}={}){
 let running=false,busy=false,timer=null,lastState='',lastBoot=null,generation=0;
 const announce=(state,detail)=>{if(state!==lastState){lastState=state;report({state,...detail})}};
 async function check(){if(busy||getSettings().usb_reconnect?.value===false)return;busy=true;const turn=generation;try{
  const settings=getSettings(),configured=String(settings.device_serial?.value||'').trim();const devices=(await run(['devices','-l'])).stdout;if(turn!==generation)return{state:'stopped'};const serial=chooseCarThing(devices,configured);
  if(!serial){announce('waiting',{});return{state:'waiting'}}
  const prefix=['-s',serial],output=(await run([...prefix,'shell','cat /proc/sys/kernel/random/boot_id; date +%s; netstat -lnt'])).stdout;const lines=output.trim().split(/\r?\n/),boot=lines[0],epoch=Number(lines[1]);let repaired=false;if(turn!==generation)return{state:'stopped'};
  // A missing remote listener is observable without the unsafe old-adbd reverse-list query.
  if(!hasListener(output,8891)){await run([...prefix,'reverse','tcp:8891','tcp:8891']);repaired=true}
  if(turn!==generation)return{state:'stopped'};if(!hasListener(output,8892)&&(repaired||boot!==lastBoot))await run([...prefix,'reverse','tcp:8892','tcp:8892']);
  if(turn!==generation)return{state:'stopped'};if(!Number.isFinite(epoch)||Math.abs(epoch*1000-now())>120000){const date=new Date(now()).toISOString().slice(0,19).replace('T',' ');await run([...prefix,'shell',"date -u -s '"+date+"'"])}
  lastBoot=boot;const state=repaired?'repaired':'ready';announce(state,{serial});return{state,serial,boot};
 }catch{announce('unavailable',{});return{state:'unavailable'}}finally{busy=false}}
 async function tick(){if(!running)return;await check();if(running){timer=setTimeout(tick,interval);timer.unref?.()}}
 return{check,start(){if(running)return;running=true;void tick()},stop(){generation++;running=false;clearTimeout(timer);timer=null}};
}
