import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {cpuPercent,finishFocus} from './mission.mjs';
test('CPU deltas account for idle time and reject zero sample windows',()=>{assert.equal(cpuPercent({total:100,idle:40},{total:200,idle:110}),30);assert.equal(cpuPercent({total:100,idle:40},{total:100,idle:40}),null)});
test('a completed focus block is counted exactly once',()=>{const focus={end:1000,remaining:1,completed:{},finished:false};assert.equal(finishFocus(focus,2000,'2026-10-24'),true);assert.equal(focus.completed['2026-10-24'],1);assert.equal(finishFocus(focus,3000,'2026-10-24'),false);assert.equal(focus.end,null)});
test('Mission Control renders all four tiles from a live snapshot',async()=>{
 const source=await readFile('./shade-component.txt','utf8');let call=0;
 const sample={stats:{cpu:12,memoryAvailable:81,battery:42,power:'On battery'},focus:{duration:1500,remaining:1200,running:false,completed:2},audio:{current:1,devices:[{id:1,name:'Speakers'}]},updated:Date.now(),brightness:50};
 const values=[true,sample,'',0,false,Date.now()];const R={useState:initial=>[call<values.length?values[call++]:initial,()=>{}],useRef:initial=>({current:initial}),useEffect:()=>{}};
 const J={jsx:(tag,props)=>({tag,props}),jsxs:(tag,props)=>({tag,props})};
 const component=new Function('REACT','JSX','SOCKETSTORE','BUTTONSTORE','return ('+source+')')(R,J,{getState:()=>({send:()=>{}})},{});
 const tree=component();let count=0;function walk(n){if(!n||typeof n!=='object')return;if(n.tag==='section')count++;const c=n.props?.children;(Array.isArray(c)?c:[c]).forEach(walk)}walk(tree);assert.equal(count,4);
});
test('focus countdown advances each second despite a different server clock',async()=>{
 const source=await readFile('./shade-component.txt','utf8');
 function render(tick){let call=0;const data={focus:{remaining:1200,running:true},focusEndsAt:1300000,updated:1792800000000};const values=[true,data,'',0,false,tick];const R={useState:initial=>[call<values.length?values[call++]:initial,()=>{}],useRef:initial=>({current:initial}),useEffect:()=>{}};const J={jsx:(tag,props)=>({tag,props}),jsxs:(tag,props)=>({tag,props})};return JSON.stringify(new Function('REACT','JSX','SOCKETSTORE','BUTTONSTORE','return ('+source+')')(R,J,{getState:()=>({send:()=>{}})},{})());}
 assert.ok(render(100000).includes('20:00'));assert.ok(render(101000).includes('19:59'));assert.ok(render(102000).includes('19:58'));
});
