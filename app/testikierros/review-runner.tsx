'use client';
import {Component,useEffect,useRef,useState,type ReactNode} from 'react';
import {taskCatalog,makeTask} from '../../tasks';
import {kidCatalog} from '../../little-tasks';
import Minigame from '../minigame';
import {LittleHups} from '../little-hups';
import {taskActions} from '../task-look';
import {WobblyText} from '../wobbly-text';

type Mode='hups'|'pikkuhups';
type Entry={note:string,status?:'played'|'skipped',result?:string,updated?:string};
type Review={mode:Mode,cursors:Record<Mode,number>,entries:Record<string,Entry>};
class ReviewBoundary extends Component<{children:ReactNode,onError:(message:string)=>void},{error:string}>{
 state={error:''};
 static getDerivedStateFromError(error:Error){return {error:error.message};}
 componentDidCatch(error:Error){this.props.onError(error.message);}
 render(){return this.state.error?<p role="alert">Peli pysähtyi virheeseen. Kirjaa huomiot alle tai ohita peli.</p>:this.props.children;}
}
const storageKey='hups-game-review-v68';
const blank:Review={mode:'hups',cursors:{hups:0,pikkuhups:0},entries:{}};
function catalog(mode:Mode){return mode==='hups'?taskCatalog:kidCatalog;}
export function ReviewRunner(){
 const [review,setReview]=useState<Review>(blank),[ready,setReady]=useState(false),[stage,setStage]=useState<'intro'|'countdown'|'play'|'notes'>('intro'),[attempt,setAttempt]=useState(0),[count,setCount]=useState(3),[storageMessage,setStorageMessage]=useState('');
 const latest=useRef(review),finished=useRef(false);
 const games=catalog(review.mode),cursor=Math.min(review.cursors[review.mode],games.length),meta=games[cursor],key=review.mode+':'+(meta?.id||'complete'),entry=review.entries[key]||{note:''};
 const seed=68000+cursor*7919,task=meta&&review.mode==='hups'?makeTask(meta.id,seed):null;
 function save(next:Review){latest.current=next;setReview(next);try{localStorage.setItem(storageKey,JSON.stringify(next));setStorageMessage('Tallennettu tähän selaimeen.');}catch{setStorageMessage('Tallennus selaimeen epäonnistui. Lataa muistiinpanot talteen ennen poistumista.');}}
 useEffect(()=>{
  try{
   const raw=localStorage.getItem(storageKey);
   if(raw){const data=JSON.parse(raw);if(data&&['hups','pikkuhups'].includes(data.mode)&&data.cursors&&data.entries){
    const entries:Record<string,Entry>={};
    for(const [id,value] of Object.entries(data.entries)){const item=value as Entry;if(item&&typeof item.note==='string')entries[id]=item;}
    const loaded:Review={mode:data.mode,cursors:{hups:Math.max(0,Math.min(taskCatalog.length,Math.floor(Number(data.cursors.hups)||0))),pikkuhups:Math.max(0,Math.min(kidCatalog.length,Math.floor(Number(data.cursors.pikkuhups)||0)))},entries};
    latest.current=loaded;setReview(loaded);
   }}
  }catch{setStorageMessage('Aiemman kierroksen lataus ei onnistunut.');}
  setReady(true);
 },[]);
 useEffect(()=>{if(stage!=='countdown')return;let n=3;setCount(n);const timer=setInterval(()=>{n--;setCount(n);if(n===0){clearInterval(timer);setStage('play');}},1000);return()=>clearInterval(timer);},[stage]);
 function open(mode:Mode,index:number){finished.current=false;setStage('intro');setAttempt(n=>n+1);save({...latest.current,mode,cursors:{...latest.current.cursors,[mode]:index}});window.scrollTo({top:0,behavior:'instant'});}
 function play(){finished.current=false;setAttempt(n=>n+1);setStage('countdown');}
 function finish(score:number,text:string){if(finished.current)return;finished.current=true;const now=latest.current;save({...now,entries:{...now.entries,[key]:{...now.entries[key],note:now.entries[key]?.note||'',result:`${score} p · ${text}`,status:'played',updated:new Date().toISOString()}}});setStage('notes');}
 function advance(status:'played'|'skipped'){
  const now=latest.current;
  finished.current=true;
  save({...now,cursors:{...now.cursors,[now.mode]:cursor+1},entries:{...now.entries,[key]:{...now.entries[key],note:now.entries[key]?.note||'',status,updated:new Date().toISOString()}}});
  setStage('intro');setAttempt(n=>n+1);window.scrollTo({top:0,behavior:'instant'});
 }
 function exportNotes(){
  const lines=['HUPS – PELIEN TESTIKIERROS','Versio 68',new Date().toLocaleString('fi-FI'),''];
  for(const mode of ['hups','pikkuhups'] as Mode[]){lines.push(mode==='hups'?'HUPS':'PIKKUHUPS','');for(const [i,game] of catalog(mode).entries()){
   const item=latest.current.entries[mode+':'+game.id];
   lines.push(`${i+1}. ${game.title} (${game.id})`,`Tila: ${item?.status==='played'?'Pelattu':item?.status==='skipped'?'Ohitettu':'Kesken / testaamatta'}`,`Testisiemen: ${68000+i*7919}`);
   if(item?.result)lines.push('Tulos: '+item.result);
   lines.push('Korjattavaa: '+(item?.note||'—'),'');
  }}
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Hups-testihuomiot.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }
 if(!ready)return <main className="phone"><p>Ladataan testikierrosta…</p></main>;
 return <main className={'phone review-page scene-game'+(review.mode==='pikkuhups'?' review-kids':'')}>
 <header className="top"><a href="/tilastot">← Ylläpitoon</a><span>TESTIKIERROS · 68</span></header>
 <nav className="review-modes" aria-label="Testattava peli">{(['hups','pikkuhups'] as Mode[]).map(mode=><button key={mode} aria-pressed={review.mode===mode} onClick={()=>open(mode,review.cursors[mode])}>{mode==='hups'?'Hups':'Pikkuhups'} · {Object.keys(review.entries).filter(k=>k.startsWith(mode+':')&&review.entries[k].status).length}/{catalog(mode).length}</button>)}</nav>
 <button className="textbutton" onClick={exportNotes}>Lataa kaikki muistiinpanot ↓</button>
 <p className="review-storage" role="status">{storageMessage||'Muistiinpanot ja eteneminen tallentuvat tähän selaimeen.'}</p>
 <label htmlFor="review-jump">Siirry peliin</label><select id="review-jump" value={cursor} onChange={e=>open(review.mode,Number(e.target.value))}>{games.map((game,i)=><option key={game.id} value={i}>{i+1}. {game.title}</option>)}<option value={games.length}>Kierros valmis</option></select>
 {meta?<><section className="game"><div className="task-position">Peli {cursor+1} / {games.length}</div><div className="task-heading"><span className="task-eyebrow">{meta.title}</span><h2><WobblyText text={taskActions[meta.id]||meta.title}/></h2></div>
 {stage==='intro'&&<><p className="intro-guide">{task?.instruction||'Pelaa leikki ja kirjaa huomiot sen alle.'}</p><button className="primary" onClick={play}>Aloita peli →</button></>}
 {stage==='countdown'&&<div className="start-countdown"><strong>{count}</strong></div>}
 {stage==='play'&&<div className="play-stage"><ReviewBoundary key={key+':'+attempt} onError={message=>finish(0,'Pelin virhe: '+message)}>{review.mode==='hups'&&task?<Minigame key={key+':'+attempt} task={task} onFinish={finish}/>:<LittleHups key={key+':'+attempt} reviewId={meta.id} reviewSeed={seed} onReviewFinish={()=>finish(1000,'Leikki suoritettu.')} onExit={()=>setStage('intro')}/>}</ReviewBoundary></div>}
 {stage==='notes'&&<p className="review-result" role="status">{entry.result}</p>}
 </section><section className="review-editor"><h2>Korjaushuomiot · {meta.title}</h2><textarea aria-label="Korjattavat kohdat" rows={5} value={entry.note} placeholder="Mikä kaipaa muutosta? Voit kirjata huomion myös pelin aikana." onChange={e=>{const now=latest.current;save({...now,entries:{...now.entries,[key]:{...now.entries[key],note:e.target.value,updated:new Date().toISOString()}}});}}/>
 <div className="review-buttons"><button onClick={play}>Pelaa uudelleen</button><button onClick={()=>advance('skipped')}>Ohita peli →</button></div>
 <button className="primary" onClick={()=>advance(entry.status==='played'?'played':'skipped')}>Tallenna ja jatka →</button>
 {cursor>0&&<button className="textbutton" onClick={()=>open(review.mode,cursor-1)}>← Edellinen peli</button>}
 </section></>:<section><h1>Kierros käyty läpi!</h1><p>Voit palata peleihin yllä olevasta valikosta tai jatkaa toisen pelitilan testaamista.</p><button className="primary" onClick={exportNotes}>Lataa muistiinpanot ↓</button></section>}
 </main>;
}
