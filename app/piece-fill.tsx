'use client';

import {useMemo,useRef,useState} from 'react';
import type {PointerEvent} from 'react';
import {random,shuffle} from '../libgame';

type Cell = [number,number];
const colors=['#80dce9','#f7a9d2','#c5ef85','#ffca73','#be9be8'];
const easyBoards=[['AAB.','ACBB','.CCB'],['.ABB','AABB','ACCC']];
const boards=[['AA.B','ACBB','ACDB','.CDD','..D.'],['.AAB','CAAB','CCDB','CCDE','..EE'],['AA..','CAB.','CABB','CDDB','.DD.']];

function normalize(cells:Cell[]):Cell[]{
 const left=Math.min(...cells.map(([x])=>x));
 const top=Math.min(...cells.map(([,y])=>y));
 return cells.map(([x,y])=>[x-left,y-top]);
}
function rotate(cells:Cell[]){
 return normalize(cells.map(([x,y])=>[-y,x]));
}
function layout(seed:number,easy:boolean){
 const rng=random(seed);
 const variants=easy?easyBoards:boards;
 const source=variants[Math.floor(rng()*variants.length)];
 const rows=rng()<.5?source.map(row=>[...row].reverse().join('')):source;
 const cells=rows.flatMap((row,y)=>[...row].map((label,x)=>({label,x,y})));
 const labels=[...new Set(cells.map(c=>c.label))].filter(label=>label!=='.');
 const pieces=labels.map((label,index)=>{
  let shape=normalize(cells.filter(c=>c.label===label).map(c=>[c.x,c.y]));
  const turns=easy?0:Math.floor(rng()*4);
  for(let turn=0;turn<turns;turn++)shape=rotate(shape);
  return {id:index,shape,color:colors[index]};
 });
 return {rows,cells,pieces:shuffle(pieces,rng)};
}

export function PieceFill({seed,easy,blocked,finish}:{seed:number,easy:boolean,blocked:()=>boolean,finish:(score:number,text:string)=>void}){
 const game=useMemo(()=>layout(seed,easy),[seed,easy]);
 const [pieces,setPieces]=useState(game.pieces);
 const [placed,setPlaced]=useState<Record<number,Cell>>({});
 const [selected,setSelected]=useState<number|null>(null);
 const [hint,setHint]=useState('');
 const [ghost,setGhost]=useState<{id:number,x:number,y:number}|null>(null);
 const drag=useRef<{id:number,pointer:number,x:number,y:number}|null>(null);
 const draggedPiece=useRef<number|null>(null);
 const board=useRef<HTMLDivElement>(null);
 const width=game.rows[0].length,height=game.rows.length;
 const occupied=(x:number,y:number,ignore:number|null=null)=>pieces.find(piece=>{
  const origin=placed[piece.id];
  return piece.id!==ignore&&origin&&piece.shape.some(([dx,dy])=>origin[0]+dx===x&&origin[1]+dy===y);
 });
 function drop(id:number,x:number,y:number){
  if(blocked())return;
  const piece=pieces.find(piece=>piece.id===id)!;
  if(!piece.shape.every(([dx,dy])=>{
   const row=game.rows[y+dy],column=x+dx;
   return row&&column>=0&&column<width&&row[column]!=='.'&&!occupied(column,y+dy,id);
  })){
   setHint('Hups, pala ei mahdu tuohon!');
   return;
  }
  const next:Record<number,Cell>={...placed,[id]:[x,y]};
  setPlaced(next);
  setSelected(null);
  setHint('');
  if(Object.keys(next).length===pieces.length)finish(1000,'Kuvio täyttyi. Pala paikalleen!');
 }
 function pointerUp(event:PointerEvent<HTMLButtonElement>){
  const active=drag.current;
  if(!active||active.pointer!==event.pointerId)return;
  drag.current=null;
  setGhost(null);
  if(Math.hypot(active.x-event.clientX,active.y-event.clientY)<8)return;
  draggedPiece.current=active.id;
  const rect=board.current?.getBoundingClientRect();
  if(!rect)return;
  const x=Math.floor((event.clientX-rect.left)/rect.width*width);
  const y=Math.floor((event.clientY-rect.top)/rect.height*height);
  drop(active.id,x,y);
 }
 function tile(shape:Cell[],color:string){
  const columns=Math.max(...shape.map(([x])=>x))+1;
  const rows=Math.max(...shape.map(([,y])=>y))+1;
  return <span className="fill-tile" style={{gridTemplateColumns:`repeat(${columns},1em)`,gridTemplateRows:`repeat(${rows},1em)`}}>
   {shape.map(([x,y])=><i key={`${x},${y}`} style={{gridColumn:x+1,gridRow:y+1,background:color}}/>)}
  </span>;
 }
 return <>
  <p className="puzzle-instruction">Täytä kuvio. Vedä pala tai valitse pala ja napauta ruutua.</p>
  <div className="fill-frame"><div ref={board} className="fill-board" style={{gridTemplateColumns:`repeat(${width},1fr)`,aspectRatio:`${width} / ${height}`}}>
   {game.cells.map(({x,y,label})=>{
    const piece=occupied(x,y);
    return <button key={`${x},${y}`} aria-label={`Rivi ${y+1}, ruutu ${x+1}`} className={label==='.'?'fill-outside':''} style={piece?{background:piece.color}:undefined} disabled={label==='.'}
     onClick={()=>{
      if(blocked())return;
      if(selected!==null){drop(selected,x,y);return;}
      if(!piece)return;
      const next={...placed};delete next[piece.id];
      setPlaced(next);setSelected(piece.id);
     }}/>;
   })}
  </div></div>
  <div className="fill-tray">
   {pieces.map(piece=><button key={piece.id} disabled={!!placed[piece.id]} aria-label={`Pala ${piece.id+1}`} aria-pressed={selected===piece.id}
    onClick={()=>{if(draggedPiece.current===piece.id){draggedPiece.current=null;return;}
     if(!blocked()&&!placed[piece.id])setSelected(piece.id);}}
    onPointerDown={event=>{
     if(blocked()||drag.current)return;
     draggedPiece.current=null;
     event.currentTarget.setPointerCapture(event.pointerId);
     drag.current={id:piece.id,pointer:event.pointerId,x:event.clientX,y:event.clientY};
     setSelected(piece.id);
    }}
    onPointerMove={event=>{
     if(drag.current?.pointer===event.pointerId&&Math.hypot(drag.current.x-event.clientX,drag.current.y-event.clientY)>=8)setGhost({id:piece.id,x:event.clientX,y:event.clientY});
    }}
    onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null;setGhost(null);}}>
    {tile(piece.shape,piece.color)}
   </button>)}
  </div>
  {!easy&&<button className="fill-rotate" disabled={selected===null||blocked()} onClick={()=>setPieces(pieces.map(piece=>piece.id===selected?{...piece,shape:rotate(piece.shape)}:piece))}>↻ Käännä palaa</button>}
  <p className="puzzle-note" role="status">{hint||`${Object.keys(placed).length} / ${pieces.length} palaa`}</p>
  {ghost&&<div className="fill-ghost" style={{left:ghost.x,top:ghost.y}}>{tile(pieces.find(piece=>piece.id===ghost.id)!.shape,colors[ghost.id])}</div>}
 </>;
}
