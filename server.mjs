import {DeskThing} from '@deskthing/server';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createUSBLink} from './usb-link.mjs';
import {createMission} from './mission.mjs';
const mission=createMission();let settings={};
const usb=createUSBLink({getSettings:()=>settings,report:({state})=>console.log('[USB link] '+state)});
DeskThing.on('stop',()=>usb.stop());
const bridge=fileURLToPath(new URL('../../../data/calthing-events.json',import.meta.url));
async function events(){try{const data=JSON.parse(await readFile(bridge,'utf8'));return Date.now()-data.updated<900000&&Array.isArray(data.events)?data.events:[]}catch{return []}}
DeskThing.on('start',async()=>{const old=await DeskThing.getSettings()||{};await DeskThing.initSettings({usb_reconnect:{type:'boolean',label:'Automatically restore USB connection',description:'Repairs a missing Car Thing USB server link while DeskThing is running. Does not reboot the device.',value:old.usb_reconnect?.value??true},focus_shortcut:{type:'string',label:'Focus Shortcut',description:'Optional exact name of a Mac Shortcut to run when tapped. No Shortcut runs automatically.',value:old.focus_shortcut?.value||''},device_serial:{type:'string',label:'Car Thing USB serial',description:'Optional if exactly one ADB device is connected. Required when several devices are attached.',value:old.device_serial?.value||''}});settings=await DeskThing.getSettings()||old;if(process.platform==='darwin')usb.start();});
DeskThing.on('settings',data=>{settings=data.payload||{};});
DeskThing.on('mission-get',async()=>DeskThing.send({type:'mission',payload:await mission.snapshot(await events(),settings)}));
DeskThing.on('mission-control',async data=>{try{await mission.action(data.payload,settings);DeskThing.send({type:'mission',payload:{...await mission.snapshot(await events(),settings),notice:'Done'}});}catch(error){DeskThing.send({type:'mission-notice',payload:{message:error.message}});}});
