import ts from 'typescript';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const h=globalThis.__reviewHooks={states:[],refs:[],effects:[],si:0,ri:0};
const hooks=uri(`const h=globalThis.__reviewHooks;export {Component} from ${JSON.stringify('file://'+require.resolve('react'))};export function useState(v){const i=h.si++;if(!(i in h.states))h.states[i]=typeof v==='function'?v():v;return [h.states[i],n=>h.states[i]=typeof n==='function'?n(h.states[i]):n];}export function useRef(v){return h.refs[h.ri++]??(h.refs[h.ri-1]={current:v});}export function useEffect(fn){h.effects.push(fn)}`);
const lib=uri(compile('libgame.ts')),extra=uri(compile('extra-tasks.ts').replace("'./libgame'",JSON.stringify(lib))),tasks=uri(compile('tasks.ts').replace("'./libgame'",JSON.stringify(lib)).replace("'./extra-tasks'",JSON.stringify(extra))),kids=uri(compile('little-tasks.ts').replace("'./libgame'",JSON.stringify(lib)));
const source=compile('app/testikierros/review-runner.tsx').replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',JSON.stringify('file://'+require.resolve('react/jsx-runtime'))).replace("'../../tasks'",JSON.stringify(tasks)).replace("'../../little-tasks'",JSON.stringify(kids)).replace("'../minigame'",JSON.stringify(uri('export default function Minigame(){return null;}'))).replace("'../little-hups'",JSON.stringify(uri('export function LittleHups(){return null;}'))).replace("'../task-look'",JSON.stringify(uri('export const taskActions={};'))).replace("'../wobbly-text'",JSON.stringify(uri('export function WobblyText(){return null;}')));
const {ReviewRunner}=await import(uri(source));
let stored=null;globalThis.localStorage={getItem:()=>stored,setItem:(_,v)=>stored=v};globalThis.window={scrollTo(){}};
function flat(n){if(!n)return [];if(Array.isArray(n))return n.flatMap(flat);if(typeof n!=='object')return [];return [n,...flat(n.props?.children)];}
function render(){h.si=0;h.ri=0;return flat(ReviewRunner());}
function button(text){return render().find(n=>n.type==='button'&&n.props.children===text);}
render();h.effects[0]();
render().find(n=>n.type==='textarea').props.onChange({target:{value:'Suuremmat kuvat'}});
assert.ok(stored.includes('Suuremmat kuvat'));
button('Ohita peli →').props.onClick();assert.equal(JSON.parse(stored).cursors.hups,1);
button('← Edellinen peli').props.onClick();assert.equal(render().find(n=>n.type==='textarea').props.value,'Suuremmat kuvat');
h.states[2]='play';render().find(n=>typeof n.type==='function'&&n.type.name==='Minigame').props.onFinish(800,'Valmis');assert.equal(h.states[2],'notes');
button('Tallenna ja jatka →').props.onClick();assert.equal(Object.values(JSON.parse(stored).entries)[0].status,'played');
const saved=stored;h.states=[];h.refs=[];h.effects=[];render();h.effects[0]();assert.equal(h.states[0].cursors.hups,1);
let blob;const oldURL=globalThis.URL;globalThis.URL={createObjectURL:b=>(blob=b,'blob:review'),revokeObjectURL(){}};globalThis.document={createElement:()=>({click(){}})};
button('Lataa kaikki muistiinpanot ↓').props.onClick();const text=await blob.text();assert.ok(text.includes('Suuremmat kuvat'));assert.ok(text.includes('PIKKUHUPS'));assert.ok(text.includes('Testisiemen:'));
globalThis.URL=oldURL;
assert.ok(fs.readFileSync('app/testikierros/page.tsx','utf8').includes('if(!adminValid(request))redirect'));
console.log('PASS: notes autosave, skip/back, game result, resume, export for both catalogs and protected test entry.');
process.exit(0);
