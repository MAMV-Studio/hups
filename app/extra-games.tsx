'use client';
import {useEffect,useRef,useState} from 'react';
import {Task,colorCards} from '../tasks';
const arrowNames: Record<string,string>={'↑':'Ylös','→':'Oikealle','↓':'Alas','←':'Vasemmalle'};
const arrowRotation: Record<string,number>={'↑':0,'→':90,'↓':180,'←':270};
function MirrorArrow({direction}:{direction:string}){
 return <svg className="mirror-arrow" viewBox="0 0 48 48" aria-hidden="true">
  <path d="M24 39V9m-11 11L24 9l11 11" transform={`rotate(${arrowRotation[direction]} 24 24)`} fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
 </svg>;
}
export default function ExtraGame({task,ms,mistakes,choose,canAnswer}:{task:Task,ms:number,mistakes:number,choose:(correct:boolean,text?:string)=>void,canAnswer:()=>boolean}){
 const d=task.data,[progress,setProgress]=useState<number[]>([]),selected=useRef<number[]>([]);
 useEffect(()=>{selected.current=[];setProgress([]);},[mistakes]);
 const [mirrorSolved,setMirrorSolved]=useState(false);
 const [oddSolved,setOddSolved]=useState(false);
 const mirror=task.id==='mirrorarrow';
 const showing=ms<d.wait;
 const answer=(i:number)=>{if(showing||!canAnswer())return;if(d.mode==='sequence'){const next=[...selected.current,i];selected.current=next;setProgress(next);if(next.length===d.expected.length)choose(next.every((v,j)=>v===d.expected[j]),'Koko jono oikein!');}
 else if(d.mode==='hunt'){if(d.options[i]!==d.answer){selected.current=[];setProgress([]);choose(false);return;}const next=[...selected.current,i];selected.current=next;setProgress(next);if(next.length===6)choose(true,'Kuusi oikeaa väriosumaa!');}
 else {if(mirror&&i===d.answer)setMirrorSolved(true);if(task.id==='oddarrow'&&i===d.answer)setOddSolved(true);choose(i===d.answer,'Oikein! Tarkka havainto.');}};
 const flag=(pair:number[])=><span className="mini-flag">{pair.map((c,i)=><i key={i} style={{background:colorCards[c].hex}}/>)}</span>;
 const colorLabel=(i:number)=>colorCards[i].name;
 return <div className={'extra-game extra-'+d.mode+' extra-task-'+task.id}>
 {d.wait>0&&showing?<><p className="play-prompt">Paina mieleen…</p><div className="extra-model">{d.mode==='sequence'?<span key={Math.floor(ms/1000)}>{task.id==='reversecolors'?<i className="sequence-marble" style={{background:colorCards[d.order[Math.min(3,Math.floor(ms/1000))]].hex}}/>:d.options[d.order[Math.min(3,Math.floor(ms/1000))]]}</span>:d.mode==='missingcolor'?<div className="color-marble-row">{d.order.map((c:number)=><i key={c} style={{background:colorCards[c].hex}}/>)}</div>:d.mode==='flags'?flag(d.options[d.answer]):d.model}</div></>:<>
 {d.model&&!d.wait&&<div className={mirror?'extra-model mirror-frame'+(mirrorSolved?' mirror-solved':''):'extra-model'} role={mirror?'img':undefined} aria-label={mirror||task.id==='orientation'?arrowNames[d.model]:undefined}>{(mirror||task.id==='orientation')?<MirrorArrow direction={d.model}/>:d.model}</div>}
 {d.hint&&<p className="play-prompt">{d.hint}{d.mode==='hunt'&&` · ${progress.length}/6`}</p>}
 {d.mode==='missingcolor'&&<div className="color-marble-row">{d.order.slice(1).map((c:number)=><i key={c} style={{background:colorCards[c].hex}}/>)}</div>}
 {d.mode==='sequence'&&<div className="extra-progress" aria-label={`${progress.length} / 4 valittu`}>{d.expected.map((_:any,i:number)=><i key={i} className={i<progress.length?'filled':''}/>)}</div>}
 {d.mode==='board'?<div className="star-choice-board">{task.id==='farcenter'&&<span className="board-reference" role="img" aria-label="Oranssi vertailupiste" style={{left:d.reference.x+'%',top:d.reference.y+'%'}}/>}{d.options.map((p:any,i:number)=><button key={i} aria-label={`Piste ${i+1}`} style={{left:p.x+'%',top:p.y+'%',color:p.color}} onClick={()=>answer(i)}><span aria-hidden="true"/></button>)}</div>:<div className={d.mode==='grid'?'extra-nine':d.mode==='hunt'?'extra-hunt':'choice-grid'}>{d.options.map((v:any,i:number)=><button key={i} className={oddSolved&&i===d.answer?'odd-hit':undefined} disabled={d.mode==='sequence'&&progress.length===4} aria-label={d.mode==='swatches'?`Värilaatta ${i+1}`:d.mode==='flags'?`Lippu ${i+1}: ${v.map(colorLabel).join(', ')}`:d.mode==='hunt'?`Pallo ${i+1}: ${colorLabel(v)}`:d.mode==='grid'?`Nuoli ${i+1}: ${v}`:mirror?arrowNames[v]:String(v)} style={d.mode==='swatches'?{background:v}:d.mode==='hunt'?{background:colorCards[v].hex}:undefined} onClick={()=>answer(i)}>{d.mode==='swatches'?<span className="swatch-dot"/>:d.mode==='flags'?flag(v):d.mode==='hunt'?'●':(mirror||task.id==='orientation'||task.id==='oddarrow')?<MirrorArrow direction={v}/>:v}</button>)}</div>}
 </>}
 </div>;
}
