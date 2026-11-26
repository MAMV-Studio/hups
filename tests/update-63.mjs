import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const uri=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const lib=uri(compile('libgame.ts'));
const extra=uri(compile('extra-tasks.ts').replace("'./libgame'",JSON.stringify(lib)));
const tasks=await import(uri(compile('tasks.ts').replace("'./libgame'",JSON.stringify(lib)).replace("'./extra-tasks'",JSON.stringify(extra))));
const progression=await import(uri(compile('app/progression.ts')));
assert.equal(tasks.revealTimeMs('digits'),1500);
for(const [id,threshold] of [[6,10],[7,25],[8,50]]){
 assert.equal(progression.unlockedAvatar(id,threshold,false),false);
 assert.equal(progression.unlockedAvatar(id,threshold-1,true),false);
 assert.equal(progression.unlockedAvatar(id,threshold,true),true);
}
assert.equal(progression.dailySeed('2026-11-26'),progression.dailySeed('2026-11-26'));
assert.notEqual(progression.dailySeed('2026-11-26'),progression.dailySeed('2026-11-27'));
const lines=new Set();
for(let seed=0;seed<100;seed++){
 const line=tasks.makeTask('line',seed).data;lines.add(JSON.stringify(line.model));assert.ok(line.length>100);
 const direction=tasks.makeTask('alternate',seed).data;
 assert.equal(direction.directions.length,10);assert.equal(direction.inks.length,10);
 assert.deepEqual(direction.inks.slice(0,2),direction.directions.slice(0,2));
 assert.equal(direction.directions[3],direction.directions[4]);
 assert.notEqual(direction.inks[3],direction.directions[3]);
 const stars=tasks.makeTask('stars',seed).data;
 assert.equal(stars.positions.length,stars.symbols.length);assert.equal(stars.colors.length,12);
 const dots=tasks.makeTask('dots',seed).data.positions;
 assert.ok(dots.every(p=>p.x>=25&&p.x<=275&&p.y>=25&&p.y<=275));
}
assert.ok(lines.size>=4);
const h=globalThis.__xmasHooks={states:[],refs:[],si:0,ri:0,effects:[]};
const hooks=uri(`const h=globalThis.__xmasHooks;export function useState(v){const i=h.si++;if(!(i in h.states))h.states[i]=typeof v==='function'?v():v;return [h.states[i],n=>h.states[i]=typeof n==='function'?n(h.states[i]):n];}export function useRef(v){return h.refs[h.ri++]??(h.refs[h.ri-1]={current:v});}export function useMemo(fn){return fn()}export function useEffect(fn){h.effects.push(fn)}`);
const component=compile('app/christmas-games.tsx').replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',JSON.stringify('file://'+require.resolve('react/jsx-runtime'))).replace("'../libgame'",JSON.stringify(lib)).replace("'./characters'",JSON.stringify(uri('export function Character(){return null;}'))).replace("'./puzzle-games'",JSON.stringify(uri('export function PuzzleGame(){return null;}')));
const {ChristmasGame}=await import(uri(component));
function flatten(n){if(!n)return [];if(Array.isArray(n))return n.flatMap(flatten);if(typeof n!=='object')return [];return [n,...flatten(n.props?.children)];}
let calls=[],id;
function render(){h.si=0;h.ri=0;return flatten(ChristmasGame({id,seed:21,kids:true,onFinish:(...args)=>calls.push(args)}));}
function init(next){id=next;h.states=[];h.refs=[];h.effects=[];calls=[];render();}
init('xmastree');let nodes=render();const ornaments=nodes.filter(n=>n.props?.className?.startsWith('tree-ornament'));
const colors=ornaments.map(n=>n.props.style.background);h.states[0]=3500;
for(const color of colors){const button=render().find(n=>n.type==='button'&&n.props.style?.background===color);button.props.onClick();}
assert.equal(calls.length,1);assert.equal(calls[0][0],1000);
init('xmascookies');const order=[];for(let i=0;i<4;i++){h.states[0]=i*1000;order.push(render().find(n=>n.type==='span'&&n.props.style?.color)?.props.style.color);}
h.states[0]=4500;for(const color of order)render().find(n=>n.type==='button'&&n.props.style?.color===color).props.onClick();assert.equal(calls.length,1);
init('xmasgifts');const bags=render().filter(n=>n.props['data-gift-bag']!==undefined);let hit;
globalThis.document={elementFromPoint:()=>({closest:()=>hit})};
const target={setPointerCapture(){},closest:()=>({contains:()=>true})};
for(let index=0;index<9;index++){
 const button=render().filter(n=>n.type==='button')[index];const color=button.props.style.background;
 hit={dataset:{giftBag:String(bags.findIndex(n=>n.props.style.background===color))}};
 const event={pointerId:index+1,clientX:10,clientY:20,currentTarget:target,preventDefault(){}};
 button.props.onPointerDown(event);button.props.onPointerMove({...event,clientY:80});render().filter(n=>n.type==='button')[index].props.onPointerUp({...event,clientY:80});
}
assert.equal(calls.length,1);assert.equal(calls[0][0],1000);
init('xmassnow');const snow=render().find(n=>n.type==='svg');const targetRadius=flatten(snow).find(n=>n.type==='circle').props.r;
snow.props.onPointerDown({pointerId:1,clientX:0,clientY:0,currentTarget:{setPointerCapture(){}}});snow.props.onPointerMove({clientX:(targetRadius-22)/.035,clientY:0});snow.props.onPointerUp();render().find(n=>n.type==='button').props.onClick();assert.equal(calls.length,1);assert.equal(calls[0][0],1000);
for(const taskId of ['xmaselves','xmashats']){init(taskId);for(let round=0;round<30&&!calls.length;round++){
 h.states[8]=round;const nodes=render();const buttons=nodes.filter(n=>n.type==='button');const active=buttons.find(n=>flatten(n).some(v=>typeof v.type==='function'));
 if(!active)continue;const content=flatten(active);const mask=content.some(n=>n.props.className==='elf-mask');const hat=content.find(n=>n.props.className==='elf-hat');
 if(taskId==='xmaselves'&&!mask||taskId==='xmashats'&&hat?.props.style.color==='#82dce9'){active.props.onClick();active.props.onClick();}
 }assert.equal(calls.length,1,taskId+' can be completed');}
console.log('PASS: Christmas drag, tree memory, cookie sequence, snowball size, elf/hat catches, single completion, unlock thresholds, number reveal and ten word directions.');
