'use client';
import {useEffect,useRef,useState} from 'react';
import {WobblyText} from './wobbly-text';
import {Character,ParkTrim} from './characters';
export const Playground=ParkTrim;
export function BuddyTip({avatar,index=0}:{avatar:number,index?:number}){return <div className="buddy-tip"><div className="buddy-small"><Character id={avatar} happy/></div><div className="buddy-bubble"><span>PSST…</span><b>{['Kokeile rohkeasti. Minä kannustan!','Pieni haaste, isot tuuletukset!','Katso rauhassa — sitten mennään!','Tämä on meidän juttu. Anna mennä!'][index%4]}</b></div><i aria-hidden="true">✦</i></div>;}
function Confetti(){return <div className="confetti" aria-hidden="true">{Array.from({length:19},(_,i)=><i key={i} style={{left:(i*37%100)+'%',top:(i*19%66)+'%',background:['#c8fa63','#b89aef','#ffae86','#85d9e5','#ffda77'][i%5],animationDelay:(i%6)*.12+'s',rotate:i*31+'deg'}}/>)}</div>;}
export function ResultParty({avatar,name,scores,players,me}:{avatar:number,name:string,scores:number[],players?:any[],me?:string}){
 const total=scores.reduce((a,b)=>a+b,0),max=scores.length*1000;
 const ranked=players?[...players].filter(p=>!p.disconnected||p.id===me).map(p=>p.id===me?{...p,scores}:p).sort((a,b)=>sum(b.scores)-sum(a.scores)):null;
 const complete=!ranked||ranked.every(p=>p.disconnected||p.scores?.length===scores.length),winner=ranked?.[0],cast=ranked?ranked.slice(0,3):[{id:'solo',name:name||'Sinä',avatar,scores}],shared=!!ranked;
 const winningName=winner?.id===me?'Sinä':winner?.name;
 const title=shared?(complete?(winningName==='Sinä'?'Sinä veit voiton!':`${winningName} vei voiton!`):'Jännitys jatkuu…'):(total>=max*.8?'Aikamoinen taitotemppu!':'Hups, hyvä kierros!');
 return <div className={'result-party ceremony '+(complete?'is-complete':'waiting-results')+(shared?'':' solo-ceremony')}><Confetti/><div className="party-ribbon">{complete?'★ TÄÄLTÄ TULEE TÄHTI ★':'★ ODOTETAAN LOPPUTULOKSIA ★'}</div><h1><WobblyText text={title}/></h1><p className="ceremony-note">{shared?(complete?'Kunnia kierroksen mestarille!':'Palkintopalli elää, kunnes kaikki ovat maalissa.'):'Pieni haaste. Iso virnistys.'}</p><div className={'podium-cast '+(cast.length===1?'single':'')}>{cast.map((p,i)=><div className={'podium-player place-'+(i+1)} key={p.id}><div className="podium-avatar"><Character id={p.avatar??i} happy/>{i===0&&<span className="podium-crown" aria-label={complete?'Voittajan kruunu':'Tämänhetkinen kärki'}>♛</span>}{i===0&&complete&&<span className="winner-rays" aria-hidden="true">✦</span>}</div><div className="podium-block"><b>{shared?1+cast.filter(q=>sum(q.scores)>sum(p.scores)).length:'★'}</b><span>{p.id===me?'Sinä':p.name}</span><small>{sum(p.scores).toLocaleString('fi-FI')} p</small></div></div>)}</div><div className="ceremony-score"><span>{scores.length} peliä pelattu</span><b>Sinulle {total.toLocaleString('fi-FI')} p</b></div>{shared&&!complete&&<p className="ceremony-live" role="status">Kaverit pelaavat vielä — tulokset päivittyvät tähän.</p>}</div>;
}

function sum(a:number[]|null){return (a||[]).reduce((x,y)=>x+y,0);}

export function LaunchScene({avatar,index}:{avatar:number,index:number}){return <div className="park-intro"><BuddyTip avatar={avatar} index={index}/><ParkTrim/><span className="park-intro-caption">PIENI HAASTE. ISO VIRNISTYS.</span></div>;}

export function WinnerReveal({avatar,name,scores,players,me,onDone}:{avatar:number,name:string,scores:number[],players?:any[],me?:string,onDone:()=>void}){
 const contenders=players?.filter(p=>!p.disconnected).map(p=>p.id===me?{...p,scores}:p).sort((a,b)=>sum(b.scores)-sum(a.scores));
 const winner=contenders?.[0]||{name,avatar,scores},tied=!!contenders&&contenders.length>1&&sum(contenders[0].scores)===sum(contenders[1].scores),key=(players?.map(p=>p.id).join('-')||'solo')+scores.join('-');
 const done=useRef(onDone);done.current=onDone;
 useEffect(()=>{const t=setTimeout(()=>done.current(),4300);return()=>clearTimeout(t);},[key]);
 return <div className="winner-reveal"><Confetti/><span className="party-ribbon">★ HETKI MESTARILLE ★</span><p>{tied?'Jaettu voitto — tuplasti tuuletusta!':players?'Kierroksen voittaja on…':'Kierroksen tähti on…'}</p><h1><WobblyText text={tied?'Tasapeli!':winner.id===me?'Sinä!':winner.name||'Sinä!'}/></h1><div className="winner-flip-stage"><span className="winner-halo" aria-hidden="true">✦</span><div className="winner-acrobat"><span className="flip-crown" aria-hidden="true">♛</span><Character id={winner.avatar??avatar} happy/></div><div className="flip-shadow"/></div><b className="winner-cheer">{tied?'Hupsista, mikä tasakilpailu!':'Hupsista, mikä suoritus!'}</b><button className="primary" onClick={onDone}>Palkintopallille →</button></div>;
}
