'use client';
import {useEffect,useRef,useState} from 'react';
import {TactileGame} from './tactile-games';
import {kidChallenge,kidDeck,kidCatalog} from '../little-tasks';
export const littleFriends=[{name:'Kuje',color:'#ffac71'},{name:'Kieppi',color:'#c5a0ee'},{name:'Hupsu',color:'#98e1b2'},{name:'Pomppu',color:'#f6a9cf'},{name:'Tassu',color:'#8edeea'},{name:'Hauva',color:'#f5d37d'}];
export function LittleCharacter({id=0}:{id?:number}){return <span className="little-character" role="img" aria-label={littleFriends[id%6].name} style={{backgroundImage:`url('/little-friend-${id%6}.png')`}}/>;}
export function LittleHups({onExit}:{onExit:()=>void}){
 const [friend,setFriend]=useState(0),[group,setGroup]=useState('all'),[playing,setPlaying]=useState(false),[seed,setSeed]=useState(1),[turn,setTurn]=useState(0),[celebrate,setCelebrate]=useState(false),[hint,setHint]=useState(''),[popped,setPopped]=useState<number[]>([]);
 const completed=useRef(false),poppedRef=useRef<number[]>([]);
 useEffect(()=>{try{const n=Number(localStorage.getItem('little-friend'));if(n>=0&&n<6)setFriend(n);}catch{}},[]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});},[playing,turn,celebrate]);
 const deck=kidDeck(seed,group),id=deck[turn%deck.length],task=kidChallenge(id,seed+turn*73),meta=kidCatalog.find(t=>t.id===id)!;
 function win(){if(completed.current)return;completed.current=true;setCelebrate(true);setHint('');}
 function next(){completed.current=false;poppedRef.current=[];setPopped([]);setHint('');setCelebrate(false);setTurn(t=>t+1);}
 function start(){completed.current=false;poppedRef.current=[];setPopped([]);setSeed(Math.floor(Math.random()*1e8));setTurn(0);setHint('');setCelebrate(false);setPlaying(true);}
 const mascot=<LittleCharacter id={friend}/>;
 return <div className="little-hups"><div className="little-nav"><button onClick={()=>{setPlaying(false);setCelebrate(false);}}>⌂ Pikkuhups</button><button onClick={onExit}>Hupsiin →</button></div>
 {!playing?<><div className="little-welcome"><h1>Pikkuhups</h1><p>Pienille pelaajille</p><div className="little-hero"><LittleCharacter id={(friend+5)%6}/>{mascot}<LittleCharacter id={(friend+1)%6}/></div></div><h2>Kuka leikkii mukana?</h2><div className="little-picker">{littleFriends.map((f,i)=><button key={f.name} aria-label={`Valitse ${f.name}`} aria-pressed={friend===i} style={{'--friend-color':f.color} as React.CSSProperties} onClick={()=>{setFriend(i);try{localStorage.setItem('little-friend',String(i));}catch{}}}><LittleCharacter id={i}/><span>{f.name}</span></button>)}</div><h2>Mitä leikitään?</h2><div className="little-packs">{[{id:'all',icon:'✨',label:'Kaikkea kivaa'},{id:'pop',icon:'🎈',label:'Poksautellaan'},{id:'colors',icon:'🎨',label:'Värit ja muodot'},{id:'find',icon:'🍓',label:'Etsi ja löydä'}].map(g=><button key={g.id} className={'pack-'+g.id} aria-pressed={group===g.id} onClick={()=>setGroup(g.id)}><span>{g.icon}</span>{g.label}{group===g.id&&<b>✓</b>}</button>)}</div><button className="primary" onClick={start}>Leikitään! →</button><p className="little-parent-note">Ei kiirettä. Aikuinen voi lukea lyhyen ohjeen.<br/>Hahmojen nimet ovat vielä työnimiä.</p></>:
 <><div className="little-dots" aria-label={`Leikki ${(turn%5)+1} / 5`}>{Array.from({length:5},(_,i)=><i key={i} className={i<=turn%5?'lit':''}/>)}</div>
 {celebrate?<div className="little-celebrate"><h1>{turn%5===4?'Hienosti leikitty!':'Löysit sen!'} </h1><div className="little-success-splash">{mascot}<span>✦</span><span>✦</span></div><p>{id==='spray'?'Hupsista, maalia tassuissa!':id==='scratch'?'Kukkuu! Minähän se täällä!':id==='peek'?'Kujeilija löytyi!':'Jes! Taitavasti tehty!'}</p><button className="primary" onClick={next}>{turn%5===4?'Leikitään lisää!':'Seuraava leikki →'}</button><button className="textbutton" onClick={()=>setPlaying(false)}>Valitse toinen leikki</button></div>:
 <div className={'little-task little-task-'+id} key={seed+':'+turn}><h1>{meta.title}</h1>{!['scratch','spray','peek'].includes(id)&&<div className="little-example" aria-label="Etsittävä malli" style={task.sampleColor?{color:task.sampleColor}:undefined}>{task.sample}</div>}
 {['scratch','spray','peek'].includes(id)?<TactileGame kind={id as 'scratch'|'spray'|'peek'} easy seed={seed+turn} mascot={mascot} onComplete={win}/>:
 id==='popall'||id==='popblue'?<><div className="little-balloon-mat">{task.items.map((it:any,i:number)=><button key={i} aria-label={it.label+' pallo'} disabled={popped.includes(i)} className={popped.includes(i)?'popped':''} style={{'--balloon-color':it.color,'--float-delay':i*-.3+'s'} as React.CSSProperties} onClick={()=>{if(completed.current||poppedRef.current.includes(i))return;if(!it.correct){setHint('Vain siniset poks!');return;}poppedRef.current=[...poppedRef.current,i];setPopped(poppedRef.current);setHint('Poks!');if(task.items.every((v:any,j:number)=>!v.correct||poppedRef.current.includes(j)))win();}}><span>✦</span></button>)}</div><p className="little-hint" role="status">{hint||'Napauta palloja!'}</p></>:
 <><div className="little-choices">{task.items.map((it:any,i:number)=><button key={i} aria-label={it.label} style={it.color?{background:it.color}:undefined} onClick={()=>{if(completed.current)return;if(it.correct)win();else setHint('Kokeile uudelleen 😊');}}><span style={it.size?{fontSize:it.size}:undefined}>{it.icon}</span></button>)}</div><p className="little-hint" role="status">{hint||'Napauta oikeaa kuvaa!'}</p></>}
 <div className="little-buddy">{mascot}<p>Minä kannustan!</p></div></div>}
 </>}
 </div>;
}
