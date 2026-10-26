const fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/shade-component.txt','utf8');
let states=[],refs=[],effects=[],handlers={},i=0,r=0,sent=[],now=1000;
const realNow=Date.now;Date.now=()=>now;
const data={brightness:50,audio:{volume:50,devices:[]},focus:{}};
const R={useState:v=>{const n=i++;if(!(n in states))states[n]=v;return[states[n],v=>states[n]=typeof v==='function'?v(states[n]):v]},useRef:v=>refs[r++]||(refs[r-1]={current:v}),useEffect:f=>effects.push(f)};
const J={jsx:(tag,props)=>({tag,props}),jsxs:(tag,props)=>({tag,props})};
global.window={addEventListener:(name,f)=>handlers[name]=f,removeEventListener:()=>{}};
const component=new Function('REACT','JSX','SOCKETSTORE','BUTTONSTORE','PREFSTORE','return ('+source+')')(R,J,{getState:()=>({send:m=>sent.push(m)})},{},{getState:()=>({preferences:{currentView:{name:'spotify'}}})});
const render=()=>{i=0;r=0;effects=[];component();effects[4]()};
const event=extra=>({preventDefault(){},stopImmediatePropagation(){},...extra});
render();states[0]=true;states[1]=data;
for(const tile of [4,5]){states[3]=tile;states[8]=false;render();handlers.keydown(event({key:'Enter'}));render();assert.equal(states[8],true);now+=100;handlers.wheel(event({deltaY:1,deltaX:0}));render();assert.equal(tile===4?states[1].brightness:states[1].audio.volume,55);assert.equal(states[3],tile,'adjustment must not switch tiles');now+=100;handlers.wheel(event({deltaY:-1,deltaX:0}));render();assert.equal(tile===4?states[1].brightness:states[1].audio.volume,50);handlers.keydown(event({key:'Enter'}));render();assert.equal(states[8],false);}
states[3]=2;states[8]=false;render();now+=100;handlers.wheel(event({deltaY:1,deltaX:0}));assert.equal(states[3],4,'dial skips removed shortcut');render();now+=100;handlers.wheel(event({deltaY:-1,deltaX:0}));assert.equal(states[3],2);clearTimeout(refs[2].current.timer);Date.now=realNow;
console.log('Passed: click engages brightness/audio, turning adjusts both directions without navigation, click disengages.');
