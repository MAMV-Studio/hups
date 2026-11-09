'use client';
import {useRef,useState} from 'react';
const colors=['#fb947b','#8bdc8a','#a9b5ff','#ffc96b','#8edcec','#f2a5d9'];
export function ObjectPicture({kind,shadow=false}:{kind:number,shadow?:boolean}){
 const fill=shadow?'#100f19':colors[kind],line=shadow?'#100f19':'#30263c';
 return <svg viewBox="0 0 100 100" aria-hidden="true"><g fill={fill} stroke={line} strokeWidth="4" strokeLinejoin="round">
 {kind===0&&<><path d="M10 47L50 12 90 47H80V88H20V47Z"/><path d="M43 88V61H60V88" fill={shadow?fill:'#ffe5b4'}/></>}
 {kind===1&&<><path d="M42 58H58V91H42Z"/><path d="M50 7L82 46H68L89 69H11L32 46H18Z"/></>}
 {kind===2&&<><path d="M8 66H92L75 88H28Z"/><path d="M49 12V60H16Z"/><path d="M55 23V60H86Z"/></>}
 {kind===3&&<><path d="M50 6Q75 26 68 69H32Q25 26 50 6Z"/><path d="M32 51L14 77 34 72M68 51L86 77 66 72M41 76L50 96 59 76"/><circle cx="50" cy="35" r="9" fill={shadow?fill:'#d8f5ff'}/></>}
 {kind===4&&<><circle cx="32" cy="34" r="23"/><path d="M49 47L85 83 94 74 83 63 76 70 67 61 74 54 58 38Z"/></>}
 {kind===5&&<><path d="M18 50Q49 8 80 50Q49 92 18 50L5 26V74Z"/><circle cx="63" cy="45" r="4" fill={line}/></>}
 </g></svg>;
}
export function ShadowGame({data:d,choose}:{data:any,choose:(correct:boolean)=>void}){
 const [selected,setSelected]=useState<number|null>(null),[drag,setDrag]=useState<{x:number,y:number,kind:number}|null>(null),zone=useRef<HTMLButtonElement>(null);
 function drop(e:React.PointerEvent,kind:number){const r=zone.current?.getBoundingClientRect();setDrag(null);if(r&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){choose(kind===d.answer);setSelected(null);}}
 return <><button ref={zone} className="shadow-zone" aria-label="Pudota kuva varjon päälle" onClick={()=>{if(selected!==null){choose(selected===d.answer);setSelected(null);}}}><ObjectPicture kind={d.answer} shadow/><span>{selected===null?'Mikä kuva tekee tämän varjon?':'Napauta varjoa tai vedä kuva tähän'}</span></button><div className="shadow-options">{d.options.map((kind:number,i:number)=><button key={kind} className={selected===kind?'chosen':''} aria-label={['Talo','Puu','Vene','Raketti','Avain','Kala'][kind]} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setSelected(kind);setDrag({x:e.clientX,y:e.clientY,kind});}} onPointerMove={e=>{if(e.buttons)setDrag({x:e.clientX,y:e.clientY,kind});}} onPointerUp={e=>drop(e,kind)} onPointerCancel={()=>setDrag(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(kind);}}}><ObjectPicture kind={kind}/><small>{i+1}</small></button>)}</div>{drag&&<div className="drag-picture" style={{left:drag.x,top:drag.y}}><ObjectPicture kind={drag.kind}/></div>}</>;
}
export function DifferenceGame({data:d,finish,retry}:{data:any,finish:()=>void,retry:()=>void}){
 const [found,setFound]=useState<number[]>([]);
 const cells=[{x:50,y:43},{x:150,y:43},{x:250,y:43},{x:50,y:118},{x:150,y:118},{x:250,y:118}];
 function scene(bottom:boolean){return <svg viewBox="0 0 300 160" role="img" aria-label={bottom?'Alempi kuva: napauta kolmea eroa':'Ylempi vertailukuva'}><rect width="300" height="160" rx="14" fill="#b8e5f5"/><path d="M0 86Q70 64 145 89T300 82V160H0Z" fill="#86be81"/>{cells.map((p,i)=>{const changed=bottom&&d.changes.includes(i),color=changed?'#b560c9':['#ffd064','#ed8f72','#81a9f5','#dd9dca'][d.variant];return <g key={i} transform={`translate(${p.x-30} ${p.y-30})`}>
 {i===0?<><circle cx="30" cy="28" r={changed?13:23} fill="#ffe27b"/>{!changed&&<g stroke="#ffe27b" strokeWidth="3"><path d="M30 0V6M30 50V57M2 28H8M52 28H59"/></g>}</>:i===1?<><path d="M5 29L30 6 55 29V57H5Z" fill={color}/><path d="M1 28L30 3 59 28Z" fill={changed?'#536ab4':'#a5485d'}/><rect x="24" y="37" width="13" height="20" fill="#fff0c7"/></>:i===2?<><rect x="26" y="30" width="9" height="28" fill="#8c6a50"/><path d={changed?'M30 1L58 40H2Z':'M30 0L50 25H43L60 44H0L17 25H10Z'} fill="#377c58"/></>:i===3?<><path d="M0 57V29H60V57Z" fill="#eadab5"/><path d="M3 25V60M23 25V60M43 25V60" stroke={changed?'#9d5ead':'#fdf0d6'} strokeWidth="8"/></>:i===4?<><path d="M30 57V26M30 44L15 36" stroke="#408c5c" strokeWidth="5"/>{[0,1,2,3,4].map(n=><circle key={n} cx={30+Math.cos(n*6.28/5)*12} cy={20+Math.sin(n*6.28/5)*12} r="9" fill={changed?'#ffffff':'#f589a7'}/>)}<circle cx="30" cy="20" r="7" fill="#ffd167"/></>:<><ellipse cx="30" cy="49" rx="28" ry="9" fill="#6aa2dc"/><path d="M8 30H52L43 47H19Z" fill={changed?'#f8d05c':'#d97260'}/><path d="M30 4V28H47Z" fill="#fff8dd"/></>}
 {bottom&&<><rect x="-20" y="-5" width="100" height="75" fill="transparent" role="button" tabIndex={0} aria-label={`Kohta ${i+1}`} onClick={()=>{if(found.includes(i))return;if(!d.changes.includes(i)){retry();return;}const next=[...found,i];setFound(next);if(next.length===3)finish();}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.currentTarget.dispatchEvent(new MouseEvent('click',{bubbles:true}));}}}/>{found.includes(i)&&<circle cx="30" cy="30" r="29" fill="none" stroke="#54278a" strokeWidth="4" pointerEvents="none"/>}</>}
 </g>;})}</svg>;}
 return <div className="difference-scenes"><p>Löydetty <b>{found.length}/3</b> · napauta alempaa kuvaa</p>{scene(false)}{scene(true)}</div>;
}
