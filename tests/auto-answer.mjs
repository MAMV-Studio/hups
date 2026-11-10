import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const runtime=JSON.stringify('file://'+require.resolve('react/jsx-runtime'));
let clock=5000;Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});
const h=globalThis.__testHooks={states:[],refs:[],si:0,ri:0,effects:[]};
const hooks=uri(`const h=globalThis.__testHooks;export function useState(initial){const i=h.si++;if(!(i in h.states))h.states[i]=initial;return [h.states[i],v=>h.states[i]=typeof v==='function'?v(h.states[i]):v];}export function useRef(initial){const i=h.ri++;return h.refs[i]??(h.refs[i]={current:initial});}export function useEffect(fn){h.effects.push(fn);}`);
const lib=uri(compile('libgame.ts')),extra=uri(compile('extra-tasks.ts').replace("'./libgame'",JSON.stringify(lib))),tasks=uri(compile('tasks.ts').replace("'./libgame'",JSON.stringify(lib)).replace("'./extra-tasks'",JSON.stringify(extra)));
const pictures=uri(compile('app/picture-games.tsx').replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime));
const wobble=uri(compile('app/wobbly-text.tsx').replace('"react/jsx-runtime"',runtime));
const characters=uri(compile('app/characters.tsx').replace("'./wobbly-text'",JSON.stringify(wobble)).replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime));
const look=uri(compile('app/task-look.ts').replace("'../extra-tasks'",JSON.stringify(extra)));
const extraGame=uri(compile('app/extra-games.tsx').replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime).replace("'../tasks'",JSON.stringify(tasks)));
const parkGames=uri(compile('app/park-games.tsx').replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime).replace("'../tasks'",JSON.stringify(tasks)));
const logic=uri(compile('play-logic.ts'));
const tactile=uri(compile('app/tactile-games.tsx').replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime).replace("'./characters'",JSON.stringify(characters)).replace("'../play-logic'",JSON.stringify(logic)));
const src=compile('app/minigame.tsx').replace("'./puzzle-games'",JSON.stringify(uri('export function PuzzleGame(){return null;}'))).replace("'./tactile-games'",JSON.stringify(tactile)).replace("'./park-games'",JSON.stringify(parkGames)).replace("'./extra-games'",JSON.stringify(extraGame)).replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime).replace("'../tasks'",JSON.stringify(tasks)).replace("'../libgame'",JSON.stringify(lib)).replace("'./picture-games'",JSON.stringify(pictures)).replace("'./characters'",JSON.stringify(characters)).replace("'./task-look'",JSON.stringify(look));
const {default:Minigame}=await import(uri(src)),{makeTask}=await import(tasks);
function flatten(n){if(!n)return [];if(Array.isArray(n))return n.flatMap(flatten);if(typeof n!=='object')return [];return [n,...flatten(n.props?.children)];}
function text(n){if(n==null)return '';if(Array.isArray(n))return n.map(text).join('');if(typeof n==='object')return text(n.props?.children);return String(n);}
let calls=[],task;
function render(){h.si=0;h.ri=0;return flatten(Minigame({task,onFinish:(...v)=>calls.push(v)}));}
function init(id){h.states=[];h.refs=[];h.effects=[];clock=5000;calls=[];task=makeTask(id,44);render();h.states[0]=5000;}
function click(predicate){const b=render().find(n=>n.type==='button'&&predicate(n));assert.ok(b,'button exists');b.props.onClick();}
for(const id of ['colors','picorder','numsequence','reversepics']){
 init(id);const expected=id==='reversepics'?[...task.data.order].reverse():task.data.order;
 const pick=v=>click(n=>id==='colors'?n.props['aria-label']===['Punainen','Sininen','Keltainen','Vihreä'][v]:id==='numsequence'?n.props['aria-label']===String(v):n.props['aria-label']===task.data.pictures[v].name);
 const bad=[...expected];bad[0]=id==='numsequence'?expected[0]%6+1:(expected[0]+1)%4;
 bad.forEach(pick);assert.equal(calls.length,0);assert.deepEqual(h.states[1],[]);
 clock+=1000;expected.forEach(pick);assert.equal(calls.length,1);assert.ok(calls[0][0]>0);
}
init('pictures');
const good=task.data.second.filter(p=>task.data.first.some(v=>v.name===p.name)),bad=task.data.second.filter(p=>!task.data.first.some(v=>v.name===p.name));
[bad[0],...good.slice(0,2)].forEach(p=>click(n=>n.props['aria-label']===p.name));assert.equal(calls.length,0);assert.deepEqual(h.states[2],[]);
clock+=1000;good.forEach(p=>click(n=>n.props['aria-label']===p.name));assert.equal(calls.length,1);
init('gridmemory');const cells=task.data.cells,badCell=[0,1,2,3,4,5,6,7,8].find(i=>!cells.includes(i));
[cells[0],cells[1],badCell].forEach(i=>click(n=>n.props['aria-label']===`Ruutu ${i+1}`));assert.equal(calls.length,0);assert.deepEqual(h.states[1],[]);
clock+=1000;cells.forEach(i=>click(n=>n.props['aria-label']===`Ruutu ${i+1}`));assert.equal(calls.length,1);
for(const id of ['circle','line','pictures','gridmemory','colors','picorder','numsequence','reversepics']){init(id);assert.ok(!render().some(n=>n.type==='button'&&text(n).includes('Valmis')));}
init('circle');const svg=render().find(n=>n.type==='svg'&&n.props['aria-label']==='Piirtoalue');
const e=(x,y)=>({clientX:x,clientY:y,pointerId:1,currentTarget:{getBoundingClientRect:()=>({left:0,top:0,width:300,height:300}),setPointerCapture(){}}});
svg.props.onPointerDown(e(230,150));for(let i=1;i<=64;i++){const a=i/64*Math.PI*2;svg.props.onPointerMove(e(150+80*Math.cos(a),150+80*Math.sin(a)));}
svg.props.onPointerUp(e(230,150));await new Promise(r=>setTimeout(r,400));assert.equal(calls.length,1);assert.ok(calls[0][0]>0);
console.log('PASS: actual game handlers auto-check sequences, three-picture choices, three-cell choices and drawing on lift; wrong selections clear, retry completes, no submit buttons.');
for(const id of ['sort','descend']){
 init(id);const order=task.data.order;
 click(n=>text(n)===String(order[0]));click(n=>text(n)===String(order[2]));assert.equal(calls.length,0);assert.deepEqual(h.states[1],[]);
 clock+=1000;order.forEach(v=>click(n=>text(n)===String(v)));assert.equal(calls.length,1);
}
init('alternate');
function side(i){const buttons=render().filter(n=>n.type==='button'&&String(n.props.className||'').includes(i===0?'your-turn':'__unused'));const target=render().find(n=>n.type==='button'&&text(n).includes(i===0?'VASEN':'OIKEA'));target.props.onPointerDown({preventDefault(){}});}
side(0);side(0);assert.equal(h.states[5],0);assert.equal(calls.length,0);clock+=1000;for(let i=0;i<6;i++)side(i%2);assert.equal(calls.length,1);
console.log('PASS: wrong number-order and alternating-tap answers reset progress and can be retried.');

// Run the actual mounted task timer against a monotonic fake clock.
const realInterval=globalThis.setInterval,realClear=globalThis.clearInterval;
let tick;globalThis.setInterval=fn=>(tick=fn,1);globalThis.clearInterval=()=>{};
globalThis.document={hidden:false,addEventListener(){},removeEventListener(){}};
for(const id of ['odd','reversepics','colors','pictures','flashes','reaction','movingspot']){
 init(id);const cleanup=h.effects[0]();
 const {revealTimeMs}=await import(tasks),wait=revealTimeMs(id,task.data);
 clock=5000+wait+9999;tick();assert.equal(calls.length,0,id+' has full answer time');
 clock++;tick();assert.equal(calls.length,1,id+' expires');assert.equal(calls[0][0],0);assert.match(calls[0][1],/Hupsista/);tick();assert.equal(calls.length,1);cleanup();
}
init('reversepics');h.effects[0]();clock=8100;tick();
click(n=>text(n).includes('Näytä uudelleen'));assert.equal(h.states[8],3100);
clock=11100;tick();task.data.order.slice().reverse().forEach(v=>click(n=>n.props['aria-label']===task.data.pictures[v].name));
assert.equal(calls.length,1);assert.ok(calls[0][0]<=500);
init('reversepics');h.effects[0]();clock=8100;tick();click(n=>text(n).includes('Näytä uudelleen'));clock=20999;tick();assert.equal(calls.length,0);clock=21000;tick();assert.equal(calls[0][0],0);
init('redcount');const reds=render().filter(n=>n.type==='i'&&n.props['aria-label']==='Punainen pallo');assert.equal(reds.length,task.data.count);click(n=>text(n)===String(task.data.count));assert.equal(calls.length,1);assert.ok(calls[0][0]>0);
const css=fs.readFileSync('app/hups.css','utf8');assert.match(css,/color-count i\{background:[^}]*var\(--orb-color\)!important/);
globalThis.setInterval=realInterval;globalThis.clearInterval=realClear;
console.log('PASS: actual task timer gives 10 answer seconds after reveals, completes once with zero, replay shows same sequence once with 500 cap, and red counting preserves per-ball colour and accepts the count.');
init('timer');task.data.seconds=4;const startButton=render().find(n=>n.type==='button'&&text(n).includes('ALOITA'));assert.ok(startButton);startButton.props.onClick();assert.equal(calls.length,0);clock+=4000;click(n=>text(n).includes('PYSÄYTÄ'));assert.equal(calls.length,1);assert.equal(calls[0][0],1000);console.log('PASS: Ajantaju starts only from the explicit start press and measures stop from that press.');
