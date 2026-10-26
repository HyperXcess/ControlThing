import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile);
const ADB=process.env.DESKTHING_ADB || '/Applications/DeskThing.app/Contents/Resources/mac/adb';
const helper=fileURLToPath(new URL('./audio-control',import.meta.url));
const stateFile=fileURLToPath(new URL('../../../data/controlthing-focus.json',import.meta.url));
const run=(file,args)=>exec(file,args,{timeout:6000,maxBuffer:1024*1024});
const today=()=>new Date().toLocaleDateString('en-CA');
export const brightnessRaw=percent=>Math.round(245-percent*244/100);
export const brightnessPercent=raw=>Math.max(0,Math.min(100,Math.round((245-raw)*100/244)));
export function cpuSample(cpus){return cpus.reduce((sum,c)=>{sum.idle+=c.times.idle;sum.total+=Object.values(c.times).reduce((a,b)=>a+b,0);return sum},{idle:0,total:0})}
export function cpuPercent(before,after){const total=after.total-before.total;return total>0?Math.max(0,Math.min(100,Math.round(100*(1-(after.idle-before.idle)/total)))):null}
export function finishFocus(focus,now=Date.now(),day){
 if(focus.end&&focus.end<=now){day=day||new Date(focus.end).toLocaleDateString('en-CA');focus.completed[day]=(focus.completed[day]||0)+1;focus.end=null;focus.remaining=0;focus.finished=true;return true}return false;
}
export function upcomingEvents(events,now=Date.now()){return events.filter(e=>!e.allDay&&new Date(e.end).getTime()>now).sort((a,b)=>new Date(a.start)-new Date(b.start)).slice(0,3).map(e=>({title:e.title,start:e.start,end:e.end,calendar:e.calendar,location:e.location,timeLabel:new Date(e.start).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),dayLabel:new Date(e.start).toDateString()===new Date(now).toDateString()?'Today':new Date(e.start).toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'})}))}
export function createMission(){
 let deviceSerial="";
 async function serial(settings){const configured=String(settings.device_serial?.value||"").trim();const text=(await run(ADB,["devices"])).stdout;const devices=text.split(/\r?\n/).map(line=>line.match(/^(\S+)\s+device$/)).filter(Boolean).map(match=>match[1]);if(configured){if(!devices.includes(configured))throw Error("Configured Car Thing is not connected.");return deviceSerial=configured;}if(devices.length!==1)throw Error("Connect one Car Thing, or set its USB serial in ControlThing settings.");return deviceSerial=devices[0];}
 let focus={duration:25*60,remaining:25*60,end:null,completed:{},finished:false},loaded=false,lastCPU=cpuSample(os.cpus()),audio={devices:[],current:0},shortcuts=[],lastAudio=0,brightness=null,brightnessMax=255;
 let busy=false,cached=null,lastStats=0,stats={cpu:null,memoryAvailable:null,battery:null,power:''};
 const save=()=>writeFile(stateFile,JSON.stringify(focus),{mode:0o600}).catch(()=>{});
 const load=async()=>{if(loaded)return;loaded=true;try{const d=JSON.parse(await readFile(stateFile,'utf8'));if(d&&typeof d.duration==='number'&&d.duration>=60&&d.duration<=7200&&d.completed&&typeof d.completed==='object')focus=d}catch{};if(finishFocus(focus))await save()};
 async function snapshot(events=[],settings={}){
  await load();if(finishFocus(focus))await save();
  const now=Date.now();if(!busy&&now-lastStats>2500){busy=true;const first=lastStats===0;lastStats=now;
   try{
    const sample=cpuSample(os.cpus());stats.cpu=first?null:cpuPercent(lastCPU,sample);lastCPU=sample;
    const results=await Promise.allSettled([run('/usr/bin/memory_pressure',['-Q']),run('/usr/bin/pmset',['-g','batt'])]);
    if(results[0].status==='fulfilled'){const m=results[0].value.stdout.match(/free percentage:\s*(\d+)%/i);stats.memoryAvailable=m?Number(m[1]):null}
    if(results[1].status==='fulfilled'){const s=results[1].value.stdout,m=s.match(/(\d+)%/);stats.battery=m?Number(m[1]):null;stats.power=/AC Power/.test(s)?'Plugged in':'On battery'}
    if(now-lastAudio>30000){lastAudio=now;try{audio=JSON.parse((await run(helper,[])).stdout)}catch{audio={devices:[],current:0}};try{const values=(await run(ADB,['-s',await serial(settings),'shell','cat /sys/devices/platform/backlight/backlight/aml-bl/brightness /sys/devices/platform/backlight/backlight/aml-bl/max_brightness'])).stdout.trim().split(/\s+/).map(Number);if(Number.isFinite(values[1])&&values[1]>0)brightnessMax=values[1];if(Number.isFinite(values[0]))brightness=brightnessPercent(values[0])}catch{brightness=null}}
   }finally{busy=false}
  }
  const upcoming=upcomingEvents(events,now);
  const next=upcoming[0];
  cached={stats:{...stats},upcoming,next:next?{title:next.title,start:next.start,end:next.end,calendar:next.calendar,location:next.location}:null,focus:{duration:focus.duration,remaining:focus.end?Math.max(0,Math.ceil((focus.end-now)/1000)):focus.remaining,running:!!focus.end,completed:focus.completed[today()]||0,finished:focus.finished},audio,brightness,focusShortcut:String(settings.focus_shortcut?.value||''),updated:now};return cached;
 }
 async function action(payload={},settings={}){
  await load();if(finishFocus(focus))await save();const {command,value}=payload;
  if(command==='focus-start'){if(!focus.end){if(focus.remaining<=0)focus.remaining=focus.duration;focus.finished=false;focus.end=Date.now()+focus.remaining*1000}await save()}
  else if(command==='focus-pause'){if(focus.end)focus.remaining=Math.max(0,Math.ceil((focus.end-Date.now())/1000));focus.end=null;await save()}
  else if(command==='focus-reset'){focus.end=null;focus.remaining=focus.duration;focus.finished=false;await save()}
  else if(command==='focus-duration'){const minutes=Number(value);if(!Number.isInteger(minutes)||minutes<1||minutes>120)throw Error('Choose 1–120 minutes.');focus.duration=minutes*60;focus.remaining=focus.duration;focus.end=null;focus.finished=false;await save()}
  else if(command==='brightness'){
   const percent=Number(value);if(!Number.isInteger(percent)||percent<5||percent>100)throw Error('Choose brightness from 5–100%.');
   await serial(settings);
   await run(ADB,['-s',await serial(settings),'shell',`supervisorctl stop backlight >/dev/null 2>&1; mkdir -p /var/lib/controlthing && echo ${brightnessRaw(percent)} > /var/lib/controlthing/brightness.tmp && mv /var/lib/controlthing/brightness.tmp /var/lib/controlthing/brightness && echo ${brightnessRaw(percent)} > /sys/devices/platform/backlight/backlight/aml-bl/brightness`]);brightness=percent;
  } else if(command==='volume'){
   const percent=Number(value);if(!Number.isInteger(percent)||percent<0||percent>100)throw Error('Choose volume from 0–100%.');audio=JSON.parse((await run(helper,['volume',String(percent)])).stdout);
  } else if(command==='audio'){
   const id=Number(value);if(!Number.isInteger(id)||!audio.devices.some(d=>d.id===id))throw Error('Select an available output.');audio=JSON.parse((await run(helper,['set',String(id)])).stdout);
  } else if(command==='shortcut'){
   const name=String(settings.focus_shortcut?.value||'').trim();if(!name)throw Error('Set a focus Shortcut name in ControlThing settings first.');
   const names=(await run('/usr/bin/shortcuts',['list'])).stdout.trim().split('\n');if(!names.includes(name))throw Error('That Shortcut was not found on the Mac.');await run('/usr/bin/shortcuts',['run',name]);
  }else throw Error('Unknown control.');
 }
 return {snapshot,action};
}
