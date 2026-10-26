global.setTimeout=fn=>{timers.push(fn);return timers.length};global.clearTimeout=()=>{};
const fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/shade-component.txt','utf8');
let currentView='agenda';
let states=[true,null,'',0,false,Date.now(),null,0],stateIndex=0,refIndex=0,refs=[],effects=[],listeners={},stopped=0,actions=[],timers=[];
const R={useState:initial=>{const i=stateIndex++;if(!(i in states))states[i]=initial;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value]},useRef:initial=>refs[refIndex++]||(refs[refIndex-1]={current:initial}),useEffect:fn=>effects.push(fn)};
const J={Fragment:'fragment',jsx:(tag,props)=>({tag,props}),jsxs:(tag,props)=>({tag,props})};
global.window={innerHeight:480,innerWidth:800,addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener:()=>{}};
const component=new Function('REACT','JSX','SOCKETSTORE','BUTTONSTORE','PREFSTORE','return ('+source+')')(R,J,{}, {getState:()=>({executeAction:action=>actions.push(action)})},{getState:()=>({preferences:{currentView:{name:currentView}}})});
function render(){stateIndex=0;refIndex=0;effects=[];const tree=component();effects[5]();return tree}
const event=(x,y,end=false)=>({[end?'changedTouches':'touches']:[{clientX:x,clientY:y}],target:{closest:()=>null},preventDefault(){},stopImmediatePropagation(){stopped++}});
render();listeners.touchstart(event(500,180));listeners.touchmove(event(340,185));listeners.touchend(event(340,185,true));assert.equal(states[3],1,'left swipe selects the day page');assert.equal(stopped,2,'page gestures are consumed before app navigation');
render();listeners.touchstart(event(300,200));listeners.touchmove(event(300,80));listeners.touchend(event(300,80,true));assert.equal(states[0],false,'swipe up dismisses');
render();listeners.touchstart(event(300,5));listeners.touchmove(event(300,110));assert.equal(states[6],-375,'top-edge pull tracks the finger');listeners.touchend(event(300,110,true));assert.equal(states[0],true,'pull down reveals');
const tree=render();let dots=0;const walk=node=>{if(!node||typeof node!=='object')return;if(node.props&&/^Page \d/.test(node.props['aria-label']||''))dots++;const c=node.props&&node.props.children;(Array.isArray(c)?c:[c]).forEach(walk)};walk(tree);assert.equal(dots,5,'health and focus have full-width pages');
console.log('Passed: horizontal paging, gesture isolation, swipe-up dismissal, finger-follow reveal, page indicators.');

states[0]=false;render();listeners.touchstart(event(400,475));listeners.touchmove(event(400,360));assert.equal(states[11].y,365,'peek follows finger');listeners.touchend(event(400,360,true));assert.equal(states[11].y,0,'committed peek finishes opening');assert.equal(actions.length,0,'app opens after the reveal animation');timers.shift()();assert.equal(actions.at(-1).value,'musicthing');assert.equal(window.__hyperMusicReturnApp,'agenda');assert.equal(states[0],false,'bottom edge does not open control shade');
const count=actions.length;render();listeners.touchstart(event(400,350));listeners.touchmove(event(400,200));listeners.touchend(event(400,200,true));assert.equal(actions.length,count,'body scrolling does not launch music');
render();listeners.touchstart(event(400,475));listeners.touchend(event(400,475,true));assert.equal(actions.length,count,'bottom tap is not a swipe');
render();listeners.touchstart(event(400,4));listeners.touchmove(event(400,120));listeners.touchend(event(400,120,true));assert.equal(states[0],true);assert.equal(actions.length,count,'top edge opens only ControlThing');
console.log('Passed: bottom-edge MusicThing entry, previous-app return context, edge-only gestures, and tap safety.');

states[0]=false;render();listeners.touchstart(event(400,475));listeners.touchmove(event(400,430));listeners.touchend(event(400,430,true));assert.equal(states[11].y,480,'short pull returns peek offscreen');assert.equal(states[11].commit,false);timers.shift()();assert.equal(states[11],null);assert.equal(actions.length,count,'short peek cancels without opening');
console.log('Passed: finger-follow MusicThing peek, animated commit, and animated cancellation.');
render();const tabTap=event(400,450);tabTap.target.closest=selector=>selector==='[data-music-tab]'?{}:null;listeners.touchstart(tabTap);listeners.touchend(event(400,450,true));assert.equal(actions.length,count+1,'bottom shade waveform tab opens MusicThing on tap');assert.equal(actions.at(-1).value,'musicthing');
console.log('Passed: bottom shade waveform tab opens on tap above the edge strip.');

currentView='musicthing';states[12]='musicthing';const musicTree=render();listeners.touchstart(tabTap);listeners.touchend(event(400,450,true));assert.equal(actions.length,count+1,'MusicThing entry does not toggle or reopen while already inside');assert.equal(window.__hyperMusicReturnApp,'agenda');
let musicTabs=0;const findTab=node=>{if(!node||typeof node!=='object')return;if(node.props?.['data-music-tab'])musicTabs++;const c=node.props?.children;(Array.isArray(c)?c:[c]).forEach(findTab)};findTab(musicTree);assert.equal(musicTabs,0,'entry icon is absent inside MusicThing');console.log('Passed: MusicThing entry disappears while open and preserves return destination.');
