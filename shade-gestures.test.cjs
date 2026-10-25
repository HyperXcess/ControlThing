const fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/shade-component.txt','utf8');
let states=[true,null,'',0,false,Date.now(),null,0],stateIndex=0,refIndex=0,refs=[],effects=[],listeners={},stopped=0;
const R={useState:initial=>{const i=stateIndex++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value]},useRef:initial=>refs[refIndex++]||(refs[refIndex-1]={current:initial}),useEffect:fn=>effects.push(fn)};
const J={Fragment:'fragment',jsx:(tag,props)=>({tag,props}),jsxs:(tag,props)=>({tag,props})};
global.window={innerHeight:480,innerWidth:800,addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:()=>{}};
const component=new Function('REACT','JSX','SOCKETSTORE','BUTTONSTORE','return ('+source+')')(R,J,{},{});
function render(){stateIndex=0;refIndex=0;effects=[];const tree=component();effects[4]();return tree}
const event=(x,y,end=false)=>({[end?'changedTouches':'touches']:[{clientX:x,clientY:y}],target:{closest:()=>null},preventDefault(){},stopImmediatePropagation(){stopped++}});
render();listeners.touchstart(event(500,180));listeners.touchmove(event(340,185));listeners.touchend(event(340,185,true));assert.equal(states[3],2,'left swipe selects the tools page');assert.equal(stopped,2,'page gestures are consumed before app navigation');
render();listeners.touchstart(event(300,200));listeners.touchmove(event(300,80));listeners.touchend(event(300,80,true));assert.equal(states[0],false,'swipe up dismisses');
render();listeners.touchstart(event(300,5));listeners.touchmove(event(300,110));assert.equal(states[6],-375,'top-edge pull tracks the finger');listeners.touchend(event(300,110,true));assert.equal(states[0],true,'pull down reveals');
const tree=render();let dots=0;const walk=node=>{if(!node||typeof node!=='object')return;if(node.props&&/^Page \d/.test(node.props['aria-label']||''))dots++;const c=node.props&&node.props.children;(Array.isArray(c)?c:[c]).forEach(walk)};walk(tree);assert.equal(dots,2,'four tiles produce two pageable groups');
console.log('Passed: horizontal paging, gesture isolation, swipe-up dismissal, finger-follow reveal, page indicators.');
