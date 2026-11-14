import {random,shuffle} from './libgame';
export type P={x:number,y:number};
export const puzzleIds=['colorsort','coderoute','memorypairs','parcel','speedlights','pipes','majority','slide','onestroke','cups','bisect','tilt'];
export const inkColors=['#91dcea','#f3a3cf','#cafa70'];
export function memoryLayout(seed:number,pairs:number){const r=random(seed),ids=pairs===8?Array.from({length:8},(_,i)=>i):[...shuffle([0,1,2,3,4,5],r).slice(0,pairs===4?3:4),...shuffle([6,7],r).slice(0,pairs===4?1:2)];return shuffle([...ids,...ids],r);}
export function majorityLayout(seed:number,easy=false){const r=random(seed),count=easy?[17,10]:[18,21,15],order=shuffle(count,r),winner=order.indexOf(Math.max(...order)),items=shuffle(order.flatMap((n,c)=>Array(n).fill(c)),r);return {items,winner,counts:order,shape:seed%2?'●':'■'};}
export function parcelLayout(seed:number,count:number){const r=random(seed),paths=Array.from({length:count},(_,i)=>[i]);for(let row=0;row<5;row++){const perm=shuffle(Array.from({length:count},(_,i)=>i),r);paths.forEach((p,i)=>p.push(perm[i]));}const target=Math.floor(r()*count);return {paths,target,answer:paths[target].at(-1)!};}
export function cupMoves(seed:number,count:number){const r=random(seed);return Array.from({length:10},()=>{const a=Math.floor(r()*count),b=(a+1+Math.floor(r()*(count-1)))%count;return [a,b];});}
export function cupPositions(moves:number[][],step:number,count:number){const p=Array.from({length:count},(_,i)=>i);for(const [a,b]of moves.slice(0,step))[p[a],p[b]]=[p[b],p[a]];return p;}
export function lightSeries(seed:number){const r=random(seed);let t=750,previous=-1;return Array.from({length:120},()=>{const key=previous<0?Math.floor(r()*4):(previous+1+Math.floor(r()*3))%4;const v={at:t,key};previous=key;t+=Math.max(180,740-t*.021);return v;}).filter(v=>v.at<30000);}
// Connected pipe ports: top, right, bottom, left. The planted path is always solvable.
export const turnPorts=(ports:number[],turn:number)=>ports.map(v=>(v+turn)%4);
export function pipeLayout(seed:number,easy=false){const r=random(seed);const path=easy?[0,1,5,9,10,11,15]:seed%2?[0,4,8,9,5,6,10,14,15]:[0,1,2,6,5,9,10,11,15];const cells=Array.from({length:16},()=>({ports:shuffle([0,1,2,3],r).slice(0,2),turn:Math.floor(r()*4)}));
 path.forEach((n,i)=>{const prev=i?path[i-1]:-4,next=i===path.length-1?19:path[i+1];const port=(v:number)=>v===n-4?0:v===n+1?1:v===n+4?2:3;cells[n]={ports:[port(prev),port(next)],turn:Math.floor(r()*4)};});if(pipeRoute(cells))cells[0].turn=(cells[0].turn+1)%4;return {cells,path};}
export function pipeRoute(cells:{ports:number[],turn:number}[]){const seen=new Set<number>(),queue=[[0]];if(!turnPorts(cells[0].ports,cells[0].turn).includes(0))return null;for(const path of queue){const n=path.at(-1)!;if(seen.has(n))continue;seen.add(n);const ps=turnPorts(cells[n].ports,cells[n].turn);if(n===15&&ps.includes(2))return path;for(const p of ps){const x=n%4,y=Math.floor(n/4),nx=x+[0,1,0,-1][p],ny=y+[-1,0,1,0][p];if(nx<0||nx>3||ny<0||ny>3)continue;const m=ny*4+nx;if(turnPorts(cells[m].ports,cells[m].turn).includes((p+2)%4))queue.push([...path,m]);}}return null;}
export type Block={x:number,y:number,axis:'h'|'v',len:number};
// Generate several legal boards and retain a genuinely obstructed, solvable puzzle.
const slideCache=new Map<string,Block[]>();
export function slideLayout(seed:number,easy=false):Block[]{
 const key=seed+':'+easy,cached=slideCache.get(key);if(cached)return cached.map(b=>({...b}));
 const r=random(seed),target=easy?4:8;let best:Block[]=[{x:0,y:1,axis:'h',len:2},{x:2,y:0,axis:'v',len:2}],bestDistance=0;
 for(let attempt=0;attempt<180;attempt++){
  const blocks:Block[]=[{x:0,y:1,axis:'h',len:2}],occupied=new Set([4,5]),count=easy?4:5+Math.floor(r()*2);
  for(let k=0;k<60&&blocks.length<count;k++){const axis=r()<.5?'h':'v',len=!easy&&r()<.12?3:2,x=Math.floor(r()*4),y=Math.floor(r()*4);if(x+(axis==='h'?len:1)>4||y+(axis==='v'?len:1)>4)continue;const cells=Array.from({length:len},(_,i)=>(y+(axis==='v'?i:0))*4+x+(axis==='h'?i:0));if(cells.some(n=>occupied.has(n)))continue;cells.forEach(n=>occupied.add(n));blocks.push({x,y,axis,len});}
  const d=slideMinimum(blocks);if(d>bestDistance){best=blocks;bestDistance=d;}if(d>=target&&d<=(easy?8:17)){best=blocks;break;}
 }
 if(slideCache.size>100)slideCache.clear();slideCache.set(key,best);return best.map(b=>({...b}));
}
export function moveBlock(blocks:Block[],i:number,delta:number){const b=blocks[i],x=b.x+(b.axis==='h'?delta:0),y=b.y+(b.axis==='v'?delta:0);if(x<0||y<0||x+(b.axis==='h'?b.len:1)>4||y+(b.axis==='v'?b.len:1)>4)return null;const occupied=new Set<number>();blocks.forEach((v,j)=>{if(j!==i)for(let k=0;k<v.len;k++)occupied.add((v.y+(v.axis==='v'?k:0))*4+v.x+(v.axis==='h'?k:0));});for(let k=0;k<b.len;k++)if(occupied.has((y+(b.axis==='v'?k:0))*4+x+(b.axis==='h'?k:0)))return null;return blocks.map((v,j)=>j===i?{...v,x,y}:v);}
export function slideMinimum(start:Block[]){const q=[{b:start,n:0}],seen=new Set<string>();for(const {b,n}of q){const key=b.map(v=>v.x+','+v.y).join(';');if(seen.has(key))continue;seen.add(key);if(b[0].x===2)return n;for(let i=0;i<b.length;i++)for(const d of [-1,1]){const next=moveBlock(b,i,d);if(next)q.push({b:next,n:n+1});}}return -1;}
export function lineGraph(seed:number,easy=false){
 const templates:{points:P[],edges:number[][]}[]=[
  {points:[{x:65,y:110},{x:235,y:110},{x:235,y:245},{x:65,y:245},{x:150,y:35}],edges:easy?[[0,1],[1,2],[2,3],[3,0],[0,4],[4,1]]:[[0,1],[1,2],[2,3],[3,0],[0,4],[4,1],[0,2],[1,3]]},
  {points:[{x:150,y:35},{x:255,y:140},{x:150,y:245},{x:45,y:140},{x:150,y:140}],edges:easy?[[0,1],[1,2],[2,3],[3,0]]:[[0,1],[1,2],[2,3],[3,0],[0,4],[4,2]]},
  {points:[{x:40,y:55},{x:150,y:140},{x:40,y:225},{x:260,y:55},{x:260,y:225}],edges:[[0,1],[1,2],[2,0],[1,3],[3,4],[4,1]]},
  {points:[{x:65,y:55},{x:235,y:55},{x:235,y:225},{x:65,y:225},{x:150,y:140}],edges:easy?[[0,1],[1,4],[4,0],[4,2],[2,3],[3,4]]:[[1,2],[2,3],[3,0],[0,4],[4,2],[1,4],[4,3]]},
  {points:[{x:40,y:140},{x:95,y:45},{x:205,y:45},{x:260,y:140},{x:205,y:235},{x:95,y:235}],edges:easy?[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]]:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,2],[2,4],[4,0]]},
  {points:[{x:150,y:140},{x:45,y:140},{x:95,y:45},{x:205,y:45},{x:255,y:140},{x:205,y:235},{x:95,y:235}],edges:easy?[[0,1],[1,2],[2,0],[0,4],[4,5],[5,0]]:[[0,1],[1,2],[2,0],[0,3],[3,4],[4,0],[0,5],[5,6],[6,0]]}
 ];
 const g=templates[Math.abs(seed)%templates.length],turn=Math.floor(Math.abs(seed)/templates.length)%4;
 return {points:g.points.map(p=>{let x=p.x-150,y=p.y-140;for(let i=0;i<turn;i++)[x,y]=[-y,x];return {x:x+150,y:y+140};}),edges:g.edges};
}
const splitShapes = [
 [[45,55],[255,55],[235,240],[70,260]],
 [[50,215],[85,62],[262,130]],
 [[42,115],[159,41],[261,101],[240,229],[98,260]],
 [[40,40],[160,40],[160,140],[260,140],[260,260],[40,260]],
 [[42,69],[253,69],[253,130],[165,130],[165,253],[91,253],[91,130],[42,130]],
 [[40,56],[258,56],[258,234],[195,234],[195,132],[112,132],[112,254],[40,254]],
];
export function polygon(seed:number,easy=false):P[]{
 const r=random(seed),index=Math.floor(r()*3)+(easy?0:3),turn=Math.floor(r()*4);
 return splitShapes[index].map(([x,y])=>{
  for(let i=0;i<turn;i++)[x,y]=[300-y,x];
  return {x,y};
 });
}
export function area(poly:P[]){return Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p.x*q.y-q.x*p.y;},0)/2);}
export function clipPolygon(poly:P[],a:P,b:P,side=1){const cross=(p:P)=>((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))*side,out:P[]=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],u=cross(p),v=cross(q);if(u>=0)out.push(p);if((u>=0)!==(v>=0)){const t=u/(u-v);out.push({x:p.x+t*(q.x-p.x),y:p.y+t*(q.y-p.y)});}}return out;}
export function splitRatio(poly:P[],a:P,b:P){if(Math.hypot(b.x-a.x,b.y-a.y)<20)return null;const ratio=area(clipPolygon(poly,a,b))/area(poly);return ratio<=.001||ratio>=.999?null:ratio;}
// Maze walls use a seeded depth-first spanning tree: exactly one route joins every cell.
export function mazeLayout(seed:number,easy=false){const r=random(seed),size=easy?5:6,walls=Array.from({length:size*size},()=>[true,true,true,true]),visited=new Set([0]),stack=[0];while(stack.length){const n=stack.at(-1)!,x=n%size,y=Math.floor(n/size),options=shuffle([0,1,2,3],r).map(d=>({d,x:x+[0,1,0,-1][d],y:y+[-1,0,1,0][d]})).filter(v=>v.x>=0&&v.x<size&&v.y>=0&&v.y<size&&!visited.has(v.y*size+v.x));if(!options.length){stack.pop();continue;}const v=options[0],m=v.y*size+v.x;walls[n][v.d]=false;walls[m][(v.d+2)%4]=false;visited.add(m);stack.push(m);}
 const goal=size*size-1,q=[[0]],seen=new Set<number>();let route:number[]=[];for(const path of q){const n=path.at(-1)!;if(seen.has(n))continue;seen.add(n);if(n===goal){route=path;break;}walls[n].forEach((w,d)=>{if(!w)q.push([...path,n+[ -size,1,size,-1][d]]);});}
 return {size,walls,holes:[] as number[],route};}
// Prefer a winding route; seed variation stays identical for every player in a room.
const baseMaze=mazeLayout;
export function windingMaze(seed:number,easy=false){let best=baseMaze(seed,easy);for(let i=1;i<24;i++){const next=baseMaze(seed+i*7919,easy);if(next.route.length>best.route.length)best=next;if(best.route.length>=best.size*best.size*.78)break;}return best;}
// Sweep a circle against expanded wall segments so corners cannot be cut through.
export function moveMarble(maze:ReturnType<typeof mazeLayout>,v:P,delta:P,r=.19):P{
 const n=maze.size;let x=v.x+delta.x,y=v.y;
 for(let i=0;i<n*n;i++){const wx=i%n,wy=Math.floor(i/n);if(maze.walls[i][3]&&y>wy-r&&y<wy+1+r){if(v.x<=wx-r&&x>wx-r)x=wx-r;if(v.x>=wx+r&&x<wx+r)x=wx+r;}}
 x=Math.max(r,Math.min(n-r,x));y=v.y+delta.y;
 for(let i=0;i<n*n;i++){const wx=i%n,wy=Math.floor(i/n);if(maze.walls[i][0]&&x>wx-r&&x<wx+1+r){if(v.y<=wy-r&&y>wy-r)y=wy-r;if(v.y>=wy+r&&y<wy+r)y=wy+r;}}
 return {x,y:Math.max(r,Math.min(n-r,y))};
}

export const codeDirections = [
 {x:0,y:-1,symbol:'↑',label:'Ylös'},
 {x:1,y:0,symbol:'→',label:'Oikealle'},
 {x:0,y:1,symbol:'↓',label:'Alas'},
 {x:-1,y:0,symbol:'←',label:'Vasemmalle'},
];

export function codeLayout(seed:number){
 const layouts=[
  ['.....G','.###..','.....#','.#.##.','.#....','S..#..'],
  ['G..#..','##....','...##.','.#....','...##.','#....S'],
  ['..G...','.#.##.','.#....','....#.','#.###.','S.....'],
 ];
 const r=random(seed),rows=layouts[Math.floor(r()*layouts.length)];
 const tiles=(r()<.5?rows:rows.map(row=>Array.from(row).reverse().join(''))).join('');
 return {tiles,start:tiles.indexOf('S'),goal:tiles.indexOf('G'),size:6};
}

export function codeStep(layout:ReturnType<typeof codeLayout>,cell:number,command:number){
 const {x,y}=codeDirections[command];
 const col=cell%layout.size+x,row=Math.floor(cell/layout.size)+y;
 if(col<0||row<0||col>=layout.size||row>=layout.size)return null;
 const next=row*layout.size+col;
 return layout.tiles[next]==='#'?null:next;
}
