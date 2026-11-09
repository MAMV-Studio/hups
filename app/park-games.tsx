'use client';
import {useRef,useState} from 'react';
import {colorCards} from '../tasks';
export function BubbleHunt({data:d,canAnswer,onWrong,onComplete}:{data:any,canAnswer:()=>boolean,onWrong:()=>void,onComplete:()=>void}){
 const [popped,setPopped]=useState<number[]>([]),[wrong,setWrong]=useState(-1),poppedRef=useRef<number[]>([]),finished=useRef(false);
 const goal=d.options.filter((v:number)=>v===d.answer).length;
 function pop(i:number){if(!canAnswer()||finished.current||poppedRef.current.includes(i))return;if(d.options[i]!==d.answer){setWrong(i);onWrong();return;}const next=[...poppedRef.current,i];poppedRef.current=next;setPopped(next);setWrong(-1);if(next.length===goal){finished.current=true;onComplete();}}
 return <div className="bubble-hunt"><p className="play-prompt">Vain <b>siniset</b> poksautetaan!</p><div className="pop-progress" role="status" aria-label={`${popped.length} / ${goal} sinistä puhjennut`}><i style={{width:popped.length/goal*100+'%'}}/><b>{popped.length} / {goal}</b></div><div className="toy-playmat" aria-label="Yhdeksän pallon pelialue">{d.options.map((v:number,i:number)=><button key={i} className={'toy-ball '+(popped.includes(i)?'popped ':'')+(wrong===i?'wrong-ball':'')} disabled={popped.includes(i)} aria-label={`Pallo ${i+1}: ${colorCards[v].name}${popped.includes(i)?', puhjennut':''}`} onClick={()=>pop(i)} style={{'--ball-color':colorCards[v].hex,left:d.positions[i].x+'%',top:d.positions[i].y+'%','--ball-tilt':`${i%2?5:-5}deg`} as React.CSSProperties}><span className="ball-skin"/><span className="pop-burst" aria-hidden="true"><b/>{Array.from({length:6},(_,j)=><i key={j} style={{'--angle':`${j*60}deg`} as React.CSSProperties}/>)}</span></button>)}</div></div>;
}
