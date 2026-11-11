import ts from 'typescript';import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');const compile=p=>ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const lib=uri(compile('libgame.ts')),logicSrc=uri(compile('puzzle-logic.ts').replace("'./libgame'",JSON.stringify(lib))),L=await import(logicSrc),extra=uri(compile('extra-tasks.ts').replace("'./libgame'",JSON.stringify(lib)));
const tasks=await import(uri(compile('tasks.ts').replace("'./libgame'",JSON.stringify(lib)).replace("'./extra-tasks'",JSON.stringify(extra))));
for(let seed=0;seed<150;seed++){
 for(const pairs of [4,6,8]){const cards=L.memoryLayout(seed,pairs);assert.equal(cards.length,pairs*2);assert.equal(new Set(cards).size,pairs);for(const i of new Set(cards))assert.equal(cards.filter(v=>v===i).length,2);assert.deepEqual(cards,L.memoryLayout(seed,pairs));}
 for(const easy of [true,false]){const pipes=L.pipeLayout(seed,easy);assert.equal(L.pipeRoute(pipes.cells),null,'Starts unsolved');pipes.path.forEach(i=>pipes.cells[i].turn=0);assert.ok(L.pipeRoute(pipes.cells),'Planted pipe solution connects');const slide=L.slideLayout(seed,easy);assert.ok(L.slideMinimum(slide)>0&&L.slideMinimum(slide)<30,'Sliding puzzle is solvable in few moves');const g=L.lineGraph(seed,easy);const degrees=g.points.map((_,i)=>g.edges.filter(e=>e.includes(i)).length);assert.ok([0,2].includes(degrees.filter(d=>d%2).length),'Euler trail exists');const maze=L.windingMaze(seed,easy);assert.equal(maze.route[0],0);assert.equal(maze.route.at(-1),maze.size**2-1);assert.ok(maze.holes.every(h=>!maze.route.includes(h)));const m=L.majorityLayout(seed,easy);assert.equal(m.counts.filter(n=>n===Math.max(...m.counts)).length,1);assert.equal(m.items.length,m.counts.reduce((a,b)=>a+b,0));}
 for(const n of [2,3,4]){const x=L.parcelLayout(seed,n);assert.equal(x.answer,x.paths[x.target].at(-1));for(let row=0;row<6;row++)assert.equal(new Set(x.paths.map(p=>p[row])).size,n);const swaps=L.cupMoves(seed,n);assert.equal(swaps.length,10);for(let s=0;s<=10;s++)assert.equal(new Set(L.cupPositions(swaps,s,n)).size,n);}
 const poly=L.polygon(seed),a={x:0,y:150},b={x:300,y:150};assert.ok(Math.abs(L.area(L.clipPolygon(poly,a,b))+L.area(L.clipPolygon(poly,a,b,-1))-L.area(poly))<.001);
 const series=L.lightSeries(seed);assert.ok(series.length>40);assert.ok(series.every((v,i)=>v.at<30000&&v.key>=0&&v.key<4&&(!i||(v.at>series[i-1].at&&v.key!==series[i-1].key))));
 const easy=tasks.taskDeck(seed,20,'easy');assert.equal(easy.length,20);assert.equal(new Set(easy.map(t=>t.id)).size,20);assert.ok(easy.every(t=>t.data.level==='easy'));assert.ok(!easy.some(t=>['add','subtract','double','half','digits','shortword','longword','colorword','alphabet','lettergap','even','speedlights','pipes'].includes(t.id)));assert.deepEqual(easy,tasks.taskDeck(seed,20,'easy'));
}
// New board diversity, sufficient difficulty, Euler connectivity and physical maze traversal.
for(const easy of [true,false]){
 const slides=new Set(),graphs=new Set(),shapes=new Set();let hardest=0;
 for(let seed=0;seed<60;seed++){
  const b=L.slideLayout(seed,easy);slides.add(JSON.stringify(b));hardest=Math.max(hardest,L.slideMinimum(b));assert.deepEqual(b,L.slideLayout(seed,easy));
  shapes.add(JSON.stringify(L.polygon(seed,easy)));
  const graph=L.lineGraph(seed,easy);graphs.add(JSON.stringify(graph));const seen=new Set([graph.edges[0][0]]);for(let pass=0;pass<graph.points.length;pass++)for(const [a,b]of graph.edges)if(seen.has(a)||seen.has(b)){seen.add(a);seen.add(b);}assert.ok(graph.edges.every(([a,b])=>seen.has(a)&&seen.has(b)));
  const m=L.windingMaze(seed,easy);assert.equal(m.holes.length,0);assert.ok(m.route.length>=m.size*2);let pos={x:.5,y:.5};for(const n of m.route.slice(1)){const target={x:n%m.size+.5,y:Math.floor(n/m.size)+.5};for(let tick=0;tick<60;tick++){const dx=target.x-pos.x,dy=target.y-pos.y;pos=L.moveMarble(m,pos,{x:Math.max(-.04,Math.min(.04,dx)),y:Math.max(-.04,Math.min(.04,dy))},.23);}assert.ok(Math.hypot(pos.x-target.x,pos.y-target.y)<.01,'Full-size marble traverses every corridor and corner');}
  assert.deepEqual(m,L.windingMaze(seed,easy));
 }
 assert.ok(shapes.size>=10,'Rotated variants of different split shapes');
 assert.ok(slides.size>45,'Many distinct sliding puzzles');assert.ok(graphs.size>=20,'Rotated graph variants');assert.ok(hardest>=(easy?4:8));
}
const sealed={size:2,walls:Array.from({length:4},()=>[true,true,true,true]),holes:[],route:[]};let marble={x:.5,y:.5};for(let i=0;i<100;i++)marble=L.moveMarble(sealed,marble,{x:.1,y:.1});assert.ok(marble.x<=.81&&marble.y<=.81,'Marble cannot cross closed walls diagonally');
console.log('PASS: 150 seeds, exact matching pairs at 3 sizes, soluble pipes/slides/Euler trails/mazes, unique majority, consistent parcels/cups, split areas, timed light series, same easy decks without maths/reading.');
// Exercise real component input handlers with deterministic state, not duplicate game rules.
const h=globalThis.__puzzleHooks={states:[],refs:[],si:0,ri:0,effects:[]};const hooks=uri(`const h=globalThis.__puzzleHooks;export function useState(v){const i=h.si++;if(!(i in h.states))h.states[i]=v;return [h.states[i],n=>h.states[i]=typeof n==='function'?n(h.states[i]):n];}export function useRef(v){const i=h.ri++;return h.refs[i]??(h.refs[i]={current:v});}export function useMemo(fn){return fn();}export function useEffect(fn){h.effects.push(fn);}`);
const runtime=JSON.stringify('file://'+require.resolve('react/jsx-runtime')),components=await import(uri(compile('app/puzzle-games.tsx').replace("'react'",JSON.stringify(hooks)).replace('"react/jsx-runtime"',runtime).replace("'./characters'",JSON.stringify(uri('export function Character(){return null;}'))).replace("'../puzzle-logic'",JSON.stringify(logicSrc))));
let calls=[],p={seed:20,easy:false,kids:false,ms:1000,blocked:()=>false,finish:(...a)=>calls.push(a)};
const render=(name,reset=false)=>{if(reset){h.states=[];h.refs=[];calls=[];}h.si=0;h.ri=0;return components[name](p);};
function nodes(tree){const result=[];function walk(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(walk);return;}if(v.props){result.push(v);walk(v.props.children);}}walk(tree);return result;}
const buttons=t=>nodes(t).filter(v=>v.type==='button');
let tree=render('Memory',true),layout=L.memoryLayout(p.seed,8);for(let pair=0;pair<8;pair++){for(const i of layout.flatMap((v,i)=>v===pair?[i]:[])){tree=render('Memory');buttons(tree)[i].props.onClick();}}assert.equal(calls.length,1);assert.equal(calls[0][0],1000);
render('Parcel',true);const parcel=L.parcelLayout(p.seed,4);buttons(render('Parcel'))[parcel.answer].props.onClick();assert.equal(calls[0][0],1000);
render('Pipes',true);const pipes=L.pipeLayout(p.seed);for(let i=0;i<16;i++)for(let k=0;k<(4-pipes.cells[i].turn)%4;k++)buttons(render('Pipes'))[i].props.onClick();assert.ok(calls.some(v=>v[0]===1000));
p.ms=6500;render('Cups',true);buttons(render('Cups'))[p.seed%4].props.onClick();assert.equal(calls[0][0],1000);
p.ms=1000;render('Majority',true);buttons(render('Majority'))[L.majorityLayout(p.seed).winner].props.onClick();assert.equal(calls[0][0],1000);
const graph=L.lineGraph(p.seed);function euler(n,edges,path){if(!edges.length)return path;for(let i=0;i<edges.length;i++){const [a,b]=edges[i];if(a===n||b===n){const next=a===n?b:a,r=euler(next,edges.filter((_,j)=>j!==i),[...path,next]);if(r)return r;}}return null;}let route;for(let i=0;i<graph.points.length&&!route;i++)route=euler(i,graph.edges,[i]);render('OneStroke',true);let svg=nodes(render('OneStroke')).find(n=>n.type==='svg');const event=i=>({clientX:graph.points[i].x,clientY:graph.points[i].y,pointerId:1,currentTarget:{getBoundingClientRect:()=>({left:0,top:0,width:300,height:300}),setPointerCapture(){}}});svg.props.onPointerDown(event(route[0]));for(const i of route.slice(1))svg.props.onPointerMove(event(i));assert.equal(calls[0][0],1000);
// Solve sliding by exercising actual finger drags, including walls and cancellation.
render('Slide',true);let queue=[{b:L.slideLayout(p.seed),moves:[]}],seen=new Set(),solution;for(const {b,moves}of queue){const key=JSON.stringify(b);if(seen.has(key))continue;seen.add(key);if(b[0].x===2){solution=moves;break;}for(let i=0;i<b.length;i++)for(const d of [-1,1]){const v=L.moveBlock(b,i,d);if(v)queue.push({b:v,moves:[...moves,[i,d]]});}}
const dragEvent=(b,delta=0)=>({clientX:b.axis==='h'?100+delta*100:100,clientY:b.axis==='v'?100+delta*100:100,pointerId:1,preventDefault(){},currentTarget:{parentElement:{getBoundingClientRect:()=>({width:410})},setPointerCapture(){}}});
let actual=L.slideLayout(p.seed);for(const [i,d]of solution){const b=buttons(render('Slide'))[i],ev=dragEvent(actual[i]);b.props.onPointerDown(ev);b.props.onPointerMove(dragEvent(actual[i],d));b.props.onPointerUp(dragEvent(actual[i],d));actual=L.moveBlock(actual,i,d);}assert.equal(calls.length,1);assert.ok(calls[0][0]>0);
render('Slide',true);let dragButton=buttons(render('Slide'))[0];dragButton.props.onPointerDown(dragEvent(actual[0]));dragButton.props.onPointerMove(dragEvent(actual[0],-8));dragButton.props.onPointerCancel(dragEvent(actual[0],-8));assert.equal(calls.length,0);assert.equal(h.states[2],0,'Cancelled drag does not count moves');
render('Lights',true);const lights=L.lightSeries(p.seed);for(const light of lights.slice(0,6)){p.ms=light.at;const b=buttons(render('Lights'))[light.key];b.props.onPointerDown({preventDefault(){}});}p.ms=lights[6].at;buttons(render('Lights'))[(lights[6].key+1)%4].props.onPointerDown({preventDefault(){}});assert.equal(calls[0][0],150,'Wrong light preserves 6 earned hits');
// Rendered light is the sole accepted target, including late first taps and a backlog.
p.ms=0;render('Lights',true);buttons(render('Lights'))[0].props.onPointerDown({preventDefault(){}});assert.equal(calls.length,0,'Before the first light, taps are ignored');
p.ms=3000;for(let hit=0;hit<10;hit++){
 const pads=buttons(render('Lights')),lit=pads.findIndex(b=>b.props.className==='lit');assert.ok(lit>=0,'A queued target is visible');
 pads[lit].props.onPointerDown({preventDefault(){}});assert.equal(calls.length,0,'Visible light is accepted even when later events are due');
 const gap=buttons(render('Lights'));assert.ok(gap.every(b=>b.props.className!== 'lit'),'Accepted light switches off');gap[lit].props.onPointerDown({preventDefault(){}});assert.equal(calls.length,0,'Duplicate tap in dark gap is ignored');p.ms+=750;
}
let pads=buttons(render('Lights')),visible=pads.findIndex(b=>b.props.className==='lit');pads[(visible+1)%4].props.onPointerDown({preventDefault(){}});assert.equal(calls[0][0],250,'Only a wrong active light ends the game, with earned points retained');
console.log('PASS: late first press, ten visible lights, brief dark gap, duplicate taps and actual wrong-light scoring.');
console.log('PASS: actual matching, parcel selection, pipe rotation, majority, cup choice, continuous one-stroke, finger drags and earned speed-light points.');
// Actual wrapper timeouts: long puzzles must not inherit the legacy 10-second cap.
const oldInterval=globalThis.setInterval,oldClear=globalThis.clearInterval,oldTimeout=globalThis.setTimeout,oldNow=performance.now;let now=0,tick;
Object.defineProperty(performance,'now',{value:()=>now,configurable:true});globalThis.setInterval=fn=>(tick=fn,1);globalThis.clearInterval=()=>{};globalThis.setTimeout=fn=>(fn(),1);
try{
 for(const [id,deadline]of [['pipes',30000],['onestroke',30000],['memorypairs',30000],['bisect',15000],['majority',5000],['cups',11500]]){
  h.states=[];h.refs=[];h.effects=[];h.si=0;h.ri=0;calls=[];now=0;components.PuzzleGame({id,seed:1,onFinish:(...a)=>calls.push(a)});h.effects[0]();now=deadline-1;tick();assert.equal(calls.length,0,id+' still active');now=deadline;tick();tick();assert.equal(calls.length,1,id+' ends once');assert.equal(calls[0][0],0);
 }
 h.states=[];h.refs=[];h.effects=[];h.si=0;h.ri=0;calls=[];components.PuzzleGame({id:'tilt',onFinish:(...a)=>calls.push(a)});assert.equal(h.states[1],false,'Tilt timer awaits explicit start');h.effects[0]();assert.equal(calls.length,0);
 console.log('PASS: actual 30s/15s/5s deadlines, cup reveal exclusion, single completion and tilt waits for explicit start.');
}finally{globalThis.setInterval=oldInterval;globalThis.clearInterval=oldClear;globalThis.setTimeout=oldTimeout;Object.defineProperty(performance,'now',{value:oldNow,configurable:true});}
