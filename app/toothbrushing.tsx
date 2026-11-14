'use client';

import {useEffect,useRef,useState} from 'react';

const toothNames=['Ylävasen','Yläkeskellä vasen','Yläkeskellä oikea','Yläoikea','Alavasen','Alakeskellä vasen','Alakeskellä oikea','Alaoikea'];
const strokesNeeded=3;

export function Toothbrushing({mascot,onBack}:{mascot:React.ReactNode,onBack:()=>void}){
 const [progress,setProgress]=useState(()=>toothNames.map(()=>0));
 const board=useRef<HTMLDivElement>(null);
 const stroke=useRef<{pointer:number,segment:number,x:number,y:number}|null>(null);
 const completed=progress.filter(value=>value>=strokesNeeded).length;
 const finished=completed===toothNames.length;
 const [timeLeft,setTimeLeft]=useState<number|null>(null);
 const deadline=useRef(0);

 function brush(index:number){
  setProgress(previous=>previous.map((value,i)=>i===index?Math.min(strokesNeeded,value+1):value));
 }
 function move(event:React.PointerEvent<HTMLDivElement>){
  const active=stroke.current;
  if(!active||active.pointer!==event.pointerId||finished)return;
  const tile=document.elementFromPoint(event.clientX,event.clientY)?.closest<HTMLButtonElement>('[data-tooth]');
  if(!tile||!board.current?.contains(tile))return;
  const index=Number(tile.dataset.tooth);
  if(index===active.segment&&Math.hypot(event.clientX-active.x,event.clientY-active.y)<13)return;
  stroke.current={pointer:event.pointerId,segment:index,x:event.clientX,y:event.clientY};
  brush(index);
 }
 function startTimer(){
  deadline.current=Date.now()+120000;
  setTimeLeft(120);
 }
 const timerRunning=timeLeft!==null&&timeLeft>0;
 useEffect(()=>{
  if(!timerRunning)return;
  const id=setInterval(()=>setTimeLeft(Math.max(0,Math.ceil((deadline.current-Date.now())/1000))),250);
  return ()=>clearInterval(id);
 },[timerRunning]);

 return <section className="tooth-game">
  <h1>Pese hampaat!</h1>
  {mascot}
  <p>{finished?'Hienosti harjattu! Nyt pestään omat hampaat.':'Harjaa hampaita sormella edestakaisin.'}</p>
  <div className="tooth-board" ref={board} onPointerMove={move} onLostPointerCapture={()=>{stroke.current=null;}}>
   {toothNames.map((name,index)=><button type="button" key={name} data-tooth={index}
    className={progress[index]===strokesNeeded?'tooth-clean':''}
    aria-label={`${name}. ${progress[index]===strokesNeeded?'Puhdas':`Harjaa ${progress[index]} / ${strokesNeeded}`}`}
    style={{'--film':1-progress[index]/strokesNeeded} as React.CSSProperties}
    onPointerDown={event=>{
     if(event.button!==0||stroke.current||finished)return;
     event.currentTarget.setPointerCapture(event.pointerId);
     stroke.current={pointer:event.pointerId,segment:index,x:event.clientX,y:event.clientY};
     brush(index);
    }}
    onClick={event=>{if(event.detail===0)brush(index);}}>
    <span aria-hidden="true">{progress[index]===strokesNeeded?'✦':'•'}</span>
   </button>)}
  </div>
  <p role="status">{completed} / {toothNames.length} hammasta puhtaana {finished?'⭐':''}</p>
  {finished&&(timeLeft===null?<button type="button" className="primary" onClick={startTimer}>Pese omat hampaat · 2 min</button>:<p className="tooth-timer" role="timer">{timeLeft>0?`${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,'0')}`:'Valmista! ✨'}</p>)}
  <button type="button" className="textbutton" onClick={onBack}>Pikkuhupsin etusivulle</button>
 </section>;
}
