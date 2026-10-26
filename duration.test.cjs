global.window={};
const fs=require('fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/shade-component.txt','utf8');let i=0,states=[],sent=[];
const R={useState:v=>{const n=i++;if(!(n in states))states[n]=v;return[states[n],v=>states[n]=typeof v==='function'?v(states[n]):v]},useRef:v=>({current:v}),useEffect:()=>{}};
const J={jsx:(tag,props)=>({tag,props}),jsxs:(tag,props)=>({tag,props})};
const c=new Function('REACT','JSX','SOCKETSTORE','BUTTONSTORE','PREFSTORE','return ('+source+')')(R,J,{getState:()=>({send:m=>sent.push(m)})},{},{getState:()=>({preferences:{currentView:{name:'spotify'}}})});
function render(){i=0;return c()}
function find(n,predicate){if(!n||typeof n!=='object')return; if(predicate(n))return n;const children=n.props?.children;for(const child of Array.isArray(children)?children:[children]){const match=find(child,predicate);if(match)return match}}
render();states[0]=true;states[1]={focus:{duration:1500,remaining:1500},audio:{devices:[]}};states[3]=2;
find(render(),n=>n.tag==='button'&&n.props.children==='25 min ▾').props.onClick();assert.equal(states[9],true);
find(render(),n=>n.tag==='button'&&n.props.children===45).props.onClick();assert.equal(states[10],45);
find(render(),n=>n.props?.['aria-label']==='Longer session').props.onClick();assert.equal(states[10],46);
find(render(),n=>n.tag==='button'&&n.props.children==='Set duration').props.onClick();assert.equal(states[9],false);assert.deepEqual(sent.at(-1).payload.payload,{command:'focus-duration',value:46});
console.log('Passed: duration picker opens, presets and minute adjustment work, chosen duration reaches backend.');
