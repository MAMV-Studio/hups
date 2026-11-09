'use client';
import {WobblyText} from './wobbly-text';
import {useEffect,useRef,useState} from 'react';
export const characters=[{name:'Vieterö',color:'#c8fa63',cell:0},{name:'Pörhö',color:'#b69cff',cell:4},{name:'Moukku',color:'#ff986e',cell:1},{name:'Löllö',color:'#76dbea',cell:2},{name:'Nuppu',color:'#f6a5d3',cell:5},{name:'Töppö',color:'#ffda69',cell:3}];
export function Character({id=0,happy=false,climbing=false}:{id?:number,happy?:boolean,climbing?:boolean}){const i=Math.abs(Number(id)||0)%6,c=characters[i];return <span role="img" aria-label={c.name} className={`character char-${i}${happy?' is-cheering':''}${climbing?' is-running':''}`}><i className="char-art" style={{backgroundPosition:`${c.cell%3*50}% ${c.cell<3?0:100}%`}}/></span>;}
export function ParkTrim(){return <div className="park-trim" aria-hidden="true"><svg viewBox="0 0 400 115" preserveAspectRatio="none"><path d="M-30 106Q140 14 440 101" fill="none" stroke="#4a325b" strokeWidth="40"/><path d="M-30 89Q140 -3 440 84" fill="none" stroke="#efa6c1" strokeWidth="6"/><path d="M-30 121Q140 29 440 116" fill="none" stroke="#82d6df" strokeWidth="6"/></svg><i className="trim-ball ball-cyan"/><i className="trim-ball ball-pink"/><i className="trim-target"/><i className="trim-bush"/></div>;}
export function ParkRace({players,round,me,length=8,onComplete}:{players:any[],round:number,length?:number,me:string,onComplete?:()=>void}){
 const [fraction,setFraction]=useState(0),done=useRef(onComplete);done.current=onComplete;
 useEffect(()=>{const start=performance.now();let frame:number;const step=(now:number)=>{const t=Math.min(1,(now-start)/750);setFraction(t);if(t<1)frame=requestAnimationFrame(step);else done.current?.();};frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame);},[round]);
 const sum=(a:number[],n:number)=>(a||[]).slice(0,n).reduce((x,y)=>x+y,0),values=players.map(p=>sum(p.scores,round)+(sum(p.scores,round+1)-sum(p.scores,round))*fraction),lead=Math.max(0,...values.filter((_,i)=>!players[i].disconnected));
 return <section className="buddy-standings"><div className="standings-title"><h2>Välitilanne!</h2><span>{round+1} / {length}</span></div><div className={'standings-grid '+(players.length>3?'many':'')}>
 {players.map((p,i)=><div className={'standing-buddy '+(p.id===me?'is-me':'')} key={p.id}><div className="standing-avatar"><Character id={p.avatar??i} happy={fraction===1}/>{!p.disconnected&&lead>0&&values[i]===lead&&<i aria-label="Johtaja">♛</i>}</div><div className="standing-info"><b title={p.name}>{p.id===me?'Sinä':p.name}</b><strong>{Math.round(values[i]).toLocaleString('fi-FI')} <small>p</small></strong><span>{p.disconnected?'Keskeytti':p.scores?.length<=round?'Pelaa vielä…':`${1+values.filter((v,j)=>!players[j].disconnected&&v>values[i]).length}. sija`}</span></div></div>)}
 </div></section>;
}
export const RocketRace=ParkRace;
export const RopeRace=ParkRace;
