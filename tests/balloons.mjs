import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const lib=uri(compile('libgame.ts')),extra=uri(compile('extra-tasks.ts').replace("'./libgame'",JSON.stringify(lib))),tasks=uri(compile('tasks.ts').replace("'./libgame'",JSON.stringify(lib)).replace("'./extra-tasks'",JSON.stringify(extra)));
const {makeTask}=await import(tasks),h=globalThis.__ballHooks={states:[],refs:[],si:0,ri:0};
const hooks=uri(`const h=globalThis.__ballHooks;export function useState(initial){const i=h.si++;if(!(i in h.states))h.states[i]=initial;return [h.states[i],v=>h.states[i]=typeof v==='function'?v(h.states[i]):v];}export function useRef(initial){const i=h.ri++;return h.refs[i]??(h.refs[i]={current:initial});}`);
const src=compile('app/park-games.tsx').replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',JSON.stringify('file://'+require.resolve('react/jsx-runtime'))).replace("'../tasks'",JSON.stringify(tasks));const {BubbleHunt}=await import(uri(src));
function flatten(n){if(!n)return [];if(Array.isArray(n))return n.flatMap(flatten);if(typeof n!=='object')return [];return [n,...flatten(n.props?.children)];}
for(let seed=0;seed<100;seed++){const d=makeTask('colorhunt',seed).data;assert.equal(d.options.length,12);assert.equal(d.positions.length,12);const good=d.options.flatMap((v,i)=>v===1?[i]:[]),bad=d.options.findIndex(v=>v!==1);assert.ok(good.length===5||good.length===6);assert.ok(d.positions.every(p=>p.x>7&&p.x<94&&p.y>7&&p.y<94));h.states=[];h.refs=[];let finished=0,wrong=0,allowed=true;function render(){h.si=0;h.ri=0;return flatten(BubbleHunt({data:d,canAnswer:()=>allowed,onWrong:()=>wrong++,onComplete:()=>finished++}));}const button=i=>render().filter(n=>n.type==='button')[i];button(good[0]).props.onClick();assert.equal(h.states[0].length,1);button(good[0]).props.onClick();assert.equal(h.states[0].length,1);button(bad).props.onClick();assert.equal(wrong,1);assert.equal(h.states[0].length,1);assert.equal(button(bad).props.disabled,false);allowed=false;button(good[1]).props.onClick();assert.equal(h.states[0].length,1);allowed=true;good.slice(1).forEach(i=>button(i).props.onClick());assert.equal(finished,1);assert.equal(h.states[0].length,good.length);button(bad).props.onClick();assert.equal(finished,1);assert.equal(wrong,1);assert.ok(good.every(i=>button(i).props.disabled));}
console.log('PASS: 100 balloon layouts: exactly twelve balls, only blue balls pop, wrong colors remain intact, progress survives mistakes, double taps cannot count twice, completion occurs exactly once.');

const {BalloonSurprise}=await import(uri(src));
for(let seed=0;seed<30;seed++){
 const d=makeTask('bubbles',seed).data;h.states=[];h.refs=[];let complete=0;
 function renderSurprise(ms=0){h.si=0;h.ri=0;return flatten(BalloonSurprise({data:d,ms,canAnswer:()=>true,onComplete:()=>complete++}));}
 const sealed=renderSurprise();sealed.find(n=>n.type==='button').props.onClick();
 const balls=renderSurprise(1000).filter(n=>n.type==='button');assert.equal(balls.length,8);
 balls.forEach((n,i)=>{renderSurprise(2000).filter(n=>n.type==='button')[i].props.onClick();renderSurprise(2000).filter(n=>n.type==='button')[i].props.onClick();});assert.equal(complete,1);assert.equal(h.states[1].length,8);
}
for(let seed=0;seed<20;seed++){
 const d=makeTask('movinghunt',seed).data;h.states=[];h.refs=[];
 function moving(ms){h.si=0;h.ri=0;return flatten(BubbleHunt({data:d,ms,moving:true,canAnswer:()=>true,onWrong(){},onComplete(){}})).filter(n=>n.type==='button');}
 const a=moving(0),b=moving(800);assert.ok(a.some((v,i)=>v.props.style.left!==b[i].props.style.left));assert.ok(b.every(v=>parseFloat(v.props.style.left)>=14&&parseFloat(v.props.style.left)<=86));
}
console.log('PASS: surprise balloon releases eight distinct moving targets, double taps cannot finish twice, and moving colour targets stay inside the mat.');
