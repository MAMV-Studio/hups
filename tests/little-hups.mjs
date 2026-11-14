import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=(p,jsx)=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx}}).outputText;
const lib=uri(compile('libgame.ts'));
const {kidCatalog,kidDeck,kidChallenge}=await import(uri(compile('little-tasks.ts').replace("'./libgame'",JSON.stringify(lib))));
const {paintStroke,paintCoverage,holeAt}=await import(uri(compile('play-logic.ts')));
for(let seed=0;seed<200;seed++){
 for(const group of ['all','pop','colors','find']){const deck=kidDeck(seed,group);assert.ok(deck.length>=3);assert.equal(deck.length,new Set(deck).size);assert.deepEqual(deck,kidDeck(seed,group));assert.ok(deck.every(id=>group==='all'||kidCatalog.find(t=>t.id===id).group===group));}
 for(const {id} of kidCatalog){const c=kidChallenge(id,seed);assert.deepEqual(c,kidChallenge(id,seed));if(['scratch','spray','peek','memorypairs','parcel'].includes(id))continue;const good=c.items.filter(i=>i.correct);assert.equal(good.length,id==='popall'?6:id==='popblue'?2:1);assert.ok(c.items.every(i=>i.label));}
 for(let slot=0;slot<20;slot++)for(const count of [3,6])assert.ok(holeAt(seed,slot,count)>=0&&holeAt(seed,slot,count)<count);
}
const empty=new Set();assert.equal(paintCoverage(empty),0);paintStroke(empty,{x:0,y:100},{x:320,y:100});assert.ok(empty.size>40,'A fast stroke must fill its entire path');const again=new Set(empty);paintStroke(again,{x:0,y:100},{x:320,y:100});assert.equal(again.size,empty.size,'Repeated painting does not inflate coverage');
const complete=new Set();for(let y=0;y<=240;y+=25)paintStroke(complete,{x:0,y},{x:320,y});assert.ok(paintCoverage(complete)>=.9);assert.ok([...complete].every(n=>n>=0&&n<320));
console.log('PASS: 17 child-friendly task types across 200 seeds, category filters, unique correct choices, repeatable data, bounded holes, continuous brush coverage and duplicate-stroke protection.');
// Exercise the actual pointer handlers and caught-hole guard, not a duplicate implementation.
const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
const runtime=JSON.stringify('file://'+require.resolve('react/jsx-runtime'));
const h=globalThis.__littleHooks={states:[],refs:[],si:0,ri:0};
const hooks=uri(`const h=globalThis.__littleHooks;export function useState(v){const i=h.si++;if(!(i in h.states))h.states[i]=typeof v==='function'?v():v;return [h.states[i],n=>h.states[i]=typeof n==='function'?n(h.states[i]):n];}export function useRef(v){return h.refs[h.ri++]??(h.refs[h.ri-1]={current:v});}export function useEffect(){}`);
const src=ts.transpileModule(fs.readFileSync('app/tactile-games.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime).replace("'./characters'",JSON.stringify(uri('export function Character(){return null;}'))).replace("'../play-logic'",JSON.stringify(uri(compile('play-logic.ts'))));
const {TactileGame}=await import(uri(src));
function mount(props,reset=false){if(reset){h.states=[];h.refs=[];}h.si=0;h.ri=0;return TactileGame(props);}
function nodes(tree){const all=[];function walk(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(walk);return;}if(v.props){all.push(v);walk(v.props.children);}}walk(tree);return all;}
for(const kind of ['scratch','spray']){let finished=0;const props={kind,seed:0,onComplete:()=>finished++,canPlay:()=>true};let tree=mount(props,true),svg=nodes(tree).find(n=>n.type==='svg'),captured=false;const target={getBoundingClientRect:()=>({left:0,top:0,width:320,height:240}),setPointerCapture:()=>captured=true,hasPointerCapture:()=>captured,releasePointerCapture:()=>captured=false};const event=(x,y)=>({clientX:x,clientY:y,currentTarget:target,pointerId:1});
 if(kind==='spray'){svg.props.onPointerDown(event(10,10));assert.equal(h.refs[0].current.size,0,'Painting without the right pot must not progress');const pots=nodes(tree).filter(n=>n.type==='button');pots[1].props.onClick();tree=mount(props);svg=nodes(tree).find(n=>n.type==='svg');svg.props.onPointerDown(event(10,10));assert.equal(h.refs[0].current.size,0,'Wrong paint must not progress');pots[0].props.onClick();tree=mount(props);svg=nodes(tree).find(n=>n.type==='svg');}
 for(let y=0;y<=240;y+=25){svg.props.onPointerDown(event(0,y));svg.props.onPointerMove(event(320,y));svg.props.onPointerUp(event(320,y));}assert.equal(finished,1);svg.props.onPointerDown(event(0,0));assert.equal(finished,1);}
let wins=0;const props={kind:'peek',seed:5,onComplete:()=>wins++};mount(props,true);for(const slot of [0,1,3,4]){h.states[4]=slot;const tree=mount(props),buttons=nodes(tree).filter(n=>n.type==='button'),b=buttons[holeAt(5,slot,6)];b.props.onClick();const n=h.refs[5]?.current;b.props.onClick();assert.equal(h.refs[5]?.current,n,'One appearance cannot count twice');}assert.equal(wins,1);
console.log('PASS: actual scratch and spray pointer completion exactly once; correct-paint gate; four distinct hole appearances and double-tap guard.');
// Cover actual child flow: concealed scratch DOM, obvious size differences and fifth-game return.
for(const id of ['big','small']){const t=kidChallenge(id,42);assert.equal(t.sample,'');const sizes=t.items.map(x=>parseInt(x.size)).sort((a,b)=>a-b);assert.deepEqual(sizes,[24,48,78,116]);}
const scratchNodes=nodes(mount({kind:'scratch',onComplete(){}},true));assert.ok(!scratchNodes.some(n=>n.type==='foreignObject'));assert.ok(scratchNodes.some(n=>n.type==='mask'));assert.equal(h.states[6].length,0,'Scratch starts without any revealed strokes');
const wobble=uri(compile('app/wobbly-text.tsx',ts.JsxEmit.ReactJSX).replace('"react/jsx-runtime"',runtime));
const littleSrc=ts.transpileModule(fs.readFileSync('app/little-hups.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime).replace("'./wobbly-text'",JSON.stringify(wobble)).replace("'./play-counter'",JSON.stringify(uri('export function beginCount(){return {complete(){}};}'))).replace("'./puzzle-games'",JSON.stringify(uri('export function PuzzleGame(){return null;}'))).replace("'./tactile-games'",JSON.stringify(uri('export function TactileGame(){return null;}'))).replace("'../little-tasks'",JSON.stringify(uri(compile('little-tasks.ts').replace("'./libgame'",JSON.stringify(lib)))));
const {LittleHups,littleFriends}=await import(uri(littleSrc));assert.equal(littleFriends[3].name,'Räyhä');
function kidMount(){h.si=0;h.ri=0;return LittleHups({onExit(){}});}
h.states=[];h.refs=[];let home=kidMount();const texts=nodes(home).filter(n=>n.type==='button');assert.ok(texts.findIndex(n=>n.props.children==='Leikitään! →')<texts.findIndex(n=>n.props.className==='pack-all'));
h.states[0]=3;h.states[2]=true;h.states[4]=4;h.states[5]=true;let celebration=kidMount();const returnButton=nodes(celebration).find(n=>n.props.children==='Valitse uusi kaveri! →');assert.ok(returnButton);returnButton.props.onClick();assert.equal(h.states[2],false);assert.equal(h.states[1],'all');assert.equal(h.states[0],3);
console.log('PASS: scratch uses a separate concealed layer; four clear ball sizes without animal cues; dinosaur replaces bunny; play button precedes packs; fifth-game celebration returns to character selection.');
