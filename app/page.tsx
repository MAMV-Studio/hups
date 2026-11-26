'use client';
import {useEffect,useRef,useState,useMemo} from 'react';
import {createGameClock} from '../game-clock';
import {Backdrop} from './backdrop';
import {useThemeMusic} from './theme-music';
import {WobblyText} from './wobbly-text';
import {Character,characters,ParkRace,ParkTrim} from './characters';
import {taskDeck,taskCatalog,makeTask} from '../tasks';
import Minigame from './minigame';
import type {Session} from '@supabase/supabase-js';
import {AccountPanel} from './account-panel';
import {accountClient,accountHeaders,beginAccountRound} from './account-client';
import {beginCount,countShared} from './play-counter';
import {LittleHups} from './little-hups';
import {dailyKey,dailySeed,unlockedAvatar} from './progression';
import {FriendStats} from './friend-stats';
import {taskActions} from './task-look';
import {RoomChat} from './room-chat';
import {BalloonKeypad} from './balloon-keypad';
import {LaunchScene,ResultParty,WinnerReveal} from './arcade';
const total=(a:number[])=>a.reduce((x,y)=>x+y,0);
export default function Page(){
 const [screen,setScreen]=useState('home'),[name,setName]=useState(''),[code,setCode]=useState(''),[seed,setSeed]=useState(1),[idx,setIdx]=useState(0),[stage,setStage]=useState('intro'),[scores,setScores]=useState<number[]>([]),[detail,setDetail]=useState(''),[elapsed,setElapsed]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[room,setRoom]=useState<any>(null),[saved,setSaved]=useState(false),[avatar,setAvatar]=useState(0),[count,setCount]=useState(3),[progressError,setProgressError]=useState(''),[raceDone,setRaceDone]=useState(false),[practiceId,setPracticeId]=useState<string|null>(null);
 const [account,setAccount]=useState<Session|null>(null);
 const [littlePlaying,setLittlePlaying]=useState(false);
 const [accessory,setAccessory]=useState('none');
 const [games,setGames]=useState(0),[daily,setDaily]=useState<string|null>(null),[dailyBest,setDailyBest]=useState(0),[unlockMessage,setUnlockMessage]=useState('');
 const [accountReturn,setAccountReturn]=useState(false);
 const completeAccountRound=useRef<null|(()=>Promise<void>)>(null);
 const accountId=account?.user.id;
 useEffect(()=>{
  if(!accountClient)return;
  const {data:{subscription}}=accountClient.auth.onAuthStateChange((_event,session)=>setAccount(session));
  return ()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
  if(!accountId||!accountClient)return;
  let active=true;
  void accountClient.from('hups_profiles').select('nickname,avatar,accessory').eq('user_id',accountId).maybeSingle().then(({data})=>{
   if(active&&data){setName(data.nickname);setAvatar(data.avatar);setAccessory(data.accessory||'none');try{localStorage.setItem('hups-accessory',data.accessory||'none');window.dispatchEvent(new Event('hups-accessory'));}catch{}}
  });
  void accountClient.rpc('hups_my_account_totals').then(({data})=>{if(active&&data)setGames(data.games);});
  return ()=>{active=false;};
 },[accountId]);
 useEffect(()=>{const read=()=>{try{setAccessory(localStorage.getItem('hups-accessory')||'none');}catch{}};window.addEventListener('hups-accessory',read);return()=>window.removeEventListener('hups-accessory',read);},[]);
 useEffect(()=>{if(!accountId){setGames(0);setAccessory('none');if(avatar>=6)setAvatar(0);}},[accountId]);
 function applyProfile(nickname:string,character:number){
  setName(nickname);setAvatar(character);
  try{localStorage.setItem('pt-name',nickname);localStorage.setItem('pt-avatar',String(character));}catch{}
 }
 const exitDialog=useRef<HTMLDialogElement>(null);
 const counter=useRef<ReturnType<typeof beginCount>|null>(null);
 const [showPodium,setShowPodium]=useState(false);
 const [taskResult,setTaskResult]=useState<{score:number,text:string}|null>(null);
 const [length,setLength]=useState(10);
 const [level,setLevel]=useState('normal');
 const clock=useRef(createGameClock());
 const auth=useRef<any>(null),finished=useRef(false),timer=useRef<any>(null),scoreRef=useRef<number[]>([]),epoch=useRef(0);const deck=useMemo(()=>practiceId?[makeTask(practiceId,seed)]:taskDeck(seed,length,level),[seed,practiceId,length,level]),task=deck[idx];
 useEffect(()=>{const url=new URL(window.location.href);const invite=url.searchParams.get('haaste');if(url.searchParams.has('profiili')){setScreen('account');setAccountReturn(true);url.searchParams.delete('profiili');window.history.replaceState(window.history.state,'',url);}else if(invite&&/^\d{4}$/.test(invite)){setCode(invite);setScreen('join');}try{setName(localStorage.getItem('pt-name')||'');setAvatar(Math.min(5,Math.max(0,Number(localStorage.getItem('pt-avatar'))||0)));}catch{}},[]);
 const api=async(action:string,extra:any={})=>{const identity=action==='create'||action==='join'?await accountHeaders():{};const sent=performance.now();const r=await fetch('/api/challenge',{method:'POST',headers:{'Content-Type':'application/json',...identity},cache:'no-store',body:JSON.stringify({...auth.current,action,version:32,...extra})});const v:any=await r.json();clock.current.sync(v.serverNow,sent,performance.now());if(!r.ok){if(v.updateRequired)setError(v.error);if(v.left){auth.current=null;setRoom(null);setScreen('home');setError(v.error);}throw Error(v.error);}return v;};
 useEffect(()=>{if(['results','game'].includes(screen)&&room&&room.seed!==seed){setSeed(room.seed);setScores([]);scoreRef.current=[];setSaved(false);setScreen('lobby');}},[room,screen,seed]);
 function leaveRoom(){if(!auth.current)return;const payload=JSON.stringify({...auth.current,action:'leave',version:32});void fetch('/api/challenge',{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(()=>{});}
 async function roomAction(action:string){if(busy)return;if(['join','create'].includes(action)&&!name.trim()){setError('Kirjoita pelinimi ennen liittymistä.');return;}if(['join','create'].includes(action))applyProfile(name.trim(),avatar);setBusy(true);setError('');try{const v=await api(action,{name,avatar,accessory,length,level,code:action==='create'?undefined:action==='join'?code.trim():auth.current?.code,token:action==='join'||action==='create'?undefined:auth.current?.token});if(v.token)auth.current={token:v.token,code:v.code};setRoom(v.state);setLength(v.state.length||8);setLevel(v.state.level==='easy'?'easy':'normal');if(!['rematch','accept','decline'].includes(action)){setSeed(v.state.seed);setScreen('lobby');}}catch(e:any){setError(e.message);}finally{setBusy(false);}}
 useEffect(()=>{if(!['lobby','results','game'].includes(screen))return;if(!auth.current)return;let live=true;const t=setInterval(async()=>{try{const values=scoreRef.current;const v=await api(values.length&&screen!=='lobby'?'progress':'poll',values.length&&screen!=='lobby'?{scores:values,seed}:{});if(live){setRoom(v.state);setLength(v.state.length||8);setLevel(v.state.level==='easy'?'easy':'normal');setProgressError('');if(values.length===length)setSaved(true);}}catch(e:any){if(live)setProgressError(e.message);}},1200);return()=>{live=false;clearInterval(t);};},[screen,stage,seed,length]);
 useEffect(()=>{if(screen!=='lobby'||!room?.start)return;const t=setInterval(()=>{setElapsed(clock.current.now());if(clock.current.now()>=room.start){clearInterval(t);begin(room.seed,true);}},100);return()=>clearInterval(t);},[screen,room?.start]);
 function begin(v:number,shared=false,single:string|null=null,day:string|null=null){setDaily(day);completeAccountRound.current=!shared&&!single&&accountClient?beginAccountRound():null;if(shared&&auth.current){counter.current=null;countShared({...auth.current});}else counter.current=beginCount('hups',!!single);setShowPodium(false);setPracticeId(single);if(!shared){setLevel('normal');leaveRoom();auth.current=null;setRoom(null);}try{localStorage.setItem('pt-name',name);localStorage.setItem('pt-avatar',String(avatar));}catch{}epoch.current++;setSeed(v);setIdx(0);setScores([]);scoreRef.current=[];setSaved(false);setScreen('game');setStage('intro');setError('');}
 function finish(score:number,text:string,immediate=false){if(finished.current)return;finished.current=true;clearInterval(timer.current);const value=Math.max(0,Math.min(1000,Math.round(score)));scoreRef.current=[...scoreRef.current,value];setScores(scoreRef.current);setDetail(text);setRaceDone(!room);if(task.data.puzzle||immediate)setStage('feedback');else setTaskResult({score:value,text});if(auth.current){sendProgress(scoreRef.current);}else if(scoreRef.current.length===deck.length){counter.current?.complete();void saveCompletedRound();}}
 async function refreshRewards(){if(account&&accountClient){const {data}=await accountClient.rpc('hups_my_account_totals');if(data){setGames(data.games);const unlocked=[{at:10,name:'Lumiukko'},{at:25,name:'Tonttu'},{at:50,name:'Joulupukki'}].find(item=>games<item.at&&data.games>=item.at);if(unlocked)setUnlockMessage(unlocked.name+' avautui! Valitse se Oma Hups -sivulta.');}}}
 async function saveCompletedRound(){
  await completeAccountRound.current?.();
  await refreshRewards();
  if(daily){const score=total(scoreRef.current);const key='hups-daily-'+daily;let best=score;try{best=Math.max(score,Number(localStorage.getItem(key))||0);localStorage.setItem(key,String(best));}catch{}setDailyBest(best);
   if(account&&accountClient){const {data,error}=await accountClient.rpc('hups_save_daily',{p_day:daily,p_score:score});if(data!==null&&!error)setDailyBest(data);if(error)setProgressError('Päivän tuloksen tallennus epäonnistui.');}
  }
 }
 useEffect(()=>{if(screen!=='daily')return;const day=dailyKey();try{setDailyBest(Number(localStorage.getItem('hups-daily-'+day))||0);}catch{}if(account&&accountClient)void accountClient.from('hups_daily_results').select('score').eq('user_id',account.user.id).eq('day',day).maybeSingle().then(({data})=>{if(data)setDailyBest(data.score);});},[screen,account]);
 function openTab(tab:string){if(tab==='home'){home();return;}leaveRoom();auth.current=null;setRoom(null);music.selectTheme(tab==='kids'?'pikkuhups':'hups');setScreen(tab);window.scrollTo({top:0,behavior:'instant'});}
 function play(){if(stage!=='intro')return;setCount(3);setStage('countdown');}
 useEffect(()=>{if(screen!=='game'||stage!=='countdown')return;let n=3;const t=setInterval(()=>{n--;setCount(n);if(n===0){clearInterval(t);startTask();}},1000);return()=>clearInterval(t);},[stage,screen]);
 useEffect(()=>{
  if(screen!=='game'||stage!=='play'||!taskResult)return;
  const reveal=setTimeout(()=>setStage('feedback'),1250);
  return()=>clearTimeout(reveal);
 },[screen,stage,taskResult]);
 function startTask(){setTaskResult(null);finished.current=false;setStage('play');}
 async function sendProgress(values:number[]){const turn=epoch.current;setProgressError('');try{const v=await api('progress',{scores:values,seed});if(turn!==epoch.current||!auth.current)return;setRoom(v.state);setLength(v.state.length||8);setLevel(v.state.level==='easy'?'easy':'normal');if(values.length===deck.length)countShared({...auth.current});}catch{if(turn!==epoch.current||!auth.current)return;setProgressError('Pisteiden lähetys ei onnistunut. Yritä uudelleen.');}}
 async function saveResult(){const turn=epoch.current;try{await api('finish',{scores:scoreRef.current,seed});if(turn!==epoch.current||!auth.current)return;setSaved(true);countShared({...auth.current});await refreshRewards();setError('');}catch(e:any){setError(e.message+' Voit yrittää tuloksen tallennusta uudelleen.');}}
 function next(){if(!raceDone)return;if(idx<deck.length-1){setIdx(idx+1);setStage('intro');}else{setScreen('results');if(auth.current)saveResult();}}
 function askHome(){if(screen==='game')exitDialog.current?.showModal();else home();}
 function home(){if(screen==='kids')music.selectTheme('hups');leaveRoom();epoch.current++;clearInterval(timer.current);auth.current=null;setRoom(null);setScreen('home');setStage('intro');setError('');setProgressError('');}
 useEffect(()=>{if(screen==='game')window.scrollTo({top:0,behavior:'instant'});},[idx,stage,screen]);
 function challengeUrl(challengeCode: string) {
  const url = new URL('/', window.location.origin);
  url.searchParams.set('haaste', challengeCode);
  return url.href;
 }
 async function shareChallenge(challengeCode: string) {
  const url = challengeUrl(challengeCode);
  const text = 'Tule pelaamaan Hupsia! Haastekoodi: ' + challengeCode;
  if (typeof navigator.share === 'function') {
   try {
    await navigator.share({title: 'Hups! Kaverihaaste', text, url});
    return;
   } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return;
   }
  }
  try {
   await navigator.clipboard.writeText(text + '\n' + url);
   setError('Kutsu kopioitu. Voit liittää sen viestiin.');
  } catch {
   setError('Jakaminen ei onnistunut. Kaverit voivat liittyä yllä näkyvällä koodilla.');
  }
 }
 const music=useThemeMusic(screen==='game'||screen==='results');
 return <main className={'phone scene-'+screen+' phase-'+stage}>{music.audio}<Backdrop/><header className="top">{screen!=='home'&&<button className="go-home" aria-label="Keskeytä ja palaa etusivulle" title="Etusivulle" onClick={askHome}>⌂</button>}<button className="brand" onClick={askHome}><WobblyText text="hups"/><i>!</i></button><span className="version">VERSIO 67</span></header>
 {screen==='home'&&<>
 <div className="home-welcome"><div><span className="home-kicker">PIENI HETKI. ISO HAASTE.</span><h1><WobblyText text="Pienet pelit. Iso ilo."/></h1></div><div className="home-pilot" aria-hidden="true"><span className="pilot-spark">✦</span><div className="pilot-friend friend-left"><Character id={(avatar+1)%6} happy/></div><Character id={avatar} accessory={accessory} happy/><div className="pilot-friend friend-right"><Character id={(avatar+2)%6} happy/></div><div className="pilot-ground"/></div></div>
 <section className="entry home-launch">
 <div className="pick-label">Kuka lähtee matkaan? <b>{characters[avatar]?.name}</b></div>
 <div className="character-picker">{characters.slice(0,6).map((a,i)=><button key={a.name} aria-label={`Valitse ${a.name}`} aria-pressed={avatar===i} style={{'--buddy-color':a.color} as React.CSSProperties} className={avatar===i?'picked':''} onClick={()=>{if(unlockedAvatar(i,games,!!account))setAvatar(i);else{setAccountReturn(false);setScreen('account');}}}><Character id={i}/>{i>=6&&!unlockedAvatar(i,games,!!account)&&<small>🔒</small>}</button>)}</div>
 <label htmlFor="name">Sinun pelinimesi</label><div className="name-with-music"><input id="name" maxLength={18} value={name} placeholder="Keksi nimimerkki" onChange={e=>setName(e.target.value)}/>{music.button}</div>
 <fieldset className="round-picker"><legend>Kuinka pitkä kisa?</legend><div className="round-presets">{[5,10,15,20].map((n,i)=><button key={n} aria-label={`${n} tehtävää`} aria-pressed={length===n} className={length===n?'selected':''} onClick={()=>setLength(n)}><b>{n}</b><small>{['Pikakisa','Sopiva kisa','Vielä lisää','Koko kattaus'][i]}</small></button>)}</div><p>Noin {Math.ceil(length*.4)} min · joka kerralla uusi sekoitus</p></fieldset>
 <button className="primary home-play" disabled={!name.trim()} onClick={()=>begin(Math.floor(Math.random()*1e8))}>Pelaa <span aria-hidden="true">→</span></button>
 <div className="split home-multiplayer"><button disabled={!name.trim()||busy} onClick={()=>{setCode('');setScreen('create');}}>Haasta kaverit <span aria-hidden="true">＋</span></button><button disabled={!name.trim()} onClick={()=>{leaveRoom();auth.current=null;setRoom(null);setProgressError('');setScreen('join');}}>Liity koodilla <span aria-hidden="true">→</span></button></div>
 <button className="textbutton browse-games" onClick={()=>setScreen('library')}>Löydä oma suosikkipelisi →</button>
 <a className="home-studio home-studio-bottom" href="/tilastot">MAMV Studio</a>
 <ParkTrim/>
 </section>
 </>}
 {screen==='daily'&&<section className="daily-page"><span className="tag">{dailyKey()}</span><h1>Päivän Hups</h1><p>Viisi peliä. Sama haaste kaikille tänään.</p><div className="daily-best"><small>Päivän paras tuloksesi</small><strong>{dailyBest.toLocaleString('fi-FI')} p</strong></div><button className="primary" onClick={()=>{setLength(5);begin(dailySeed(dailyKey()),false,null,dailyKey());}}>Pelaa päivän kisa →</button><p>Voit yrittää uudelleen ja parantaa tulostasi.</p></section>}
 {screen==='account'&&<AccountPanel session={account} name={name} avatar={avatar} onSave={applyProfile} onBack={home} returned={accountReturn}/>}
 {screen==='kids'&&<LittleHups onPlayingChange={setLittlePlaying} onExit={home} musicButton={music.button}/>}
 {screen==='create'&&<section className="create-challenge"><span className="tag">KAVERIEN KANSSA</span><h1>Millainen<br/><em>kisa tänään?</em></h1><fieldset className="level-choice"><legend>Valitse tehtävätaso koko porukalle</legend><div className="split"><button aria-pressed={level==='easy'} onClick={()=>setLevel('easy')}><Character id={4}/><b>Helpommat tehtävät</b></button><button aria-pressed={level==='normal'} onClick={()=>setLevel('normal')}><Character id={2}/><b>Haastavammat tehtävät</b></button></div><p className="note">{level==='easy'?'Noin 6–9-vuotiaille. Taitoa, muistia ja kujeilua — ilman lasku- tai lukutehtäviä.':'Kaikki Hupsin haasteet, myös vaativammat pulmat ja laskut.'}</p></fieldset><p className="note">{length} tehtävää · kaikille samat pelit ja sama taso.</p><button className="primary" disabled={busy} onClick={()=>roomAction('create')}>Luo haastekoodi →</button><button className="textbutton" onClick={home}>← Takaisin</button></section>}
 {screen==='library'&&<section className="game-library"><span className="tag">{taskCatalog.length} PIENTÄ HAASTETTA</span><h1>Mitä tänään<br/><em>kokeiltaisiin?</em></h1><p>Kokeile yksittäistä peliä tai löydä uusi suosikki.</p><div className="library-grid">{taskCatalog.map(t=><button key={t.id} onClick={()=>begin(Math.floor(Math.random()*1e8),false,t.id)}><span>{t.icon}</span><b>{t.title}</b><small>{t.category}</small></button>)}</div><button className="textbutton" onClick={home}>← Alkuun</button></section>}
 {screen==='join'&&<section className="panel join-panel"><span className="tag">SAMA HAASTE. OMAT TAIDOT.</span><h1>Onko sinulla<br/><em>haastekoodi?</em></h1><label htmlFor="join-name">Pelinimi</label><input id="join-name" value={name} onChange={e=>setName(e.target.value)} maxLength={18} placeholder="Kirjoita pelinimi"/><div className="character-picker">{characters.slice(0,6).map((c,i)=><button key={c.name} aria-label={c.name} aria-pressed={avatar===i} disabled={!unlockedAvatar(i,games,!!account)} onClick={()=>setAvatar(i)}><Character id={i}/></button>)}</div><BalloonKeypad value={code} onChange={setCode}/><button className="primary join-submit" disabled={code.length!==4||busy||!name.trim()} onClick={()=>roomAction('join')}>{busy?'Liitytään…':'Liity haasteeseen →'}</button><button className="textbutton" onClick={home}>← Takaisin</button></section>}
 {screen==='lobby'&&room&&<section className="panel"><span className="tag">KAVERI HAASTE</span><h1>Samat pelit.<br/><em>Kuka vie voiton?</em></h1><div className="code"><small>HAASTEKOODI</small><strong>{room.code}</strong><button type="button" className="share-challenge" onClick={()=>void shareChallenge(room.code)}>Kutsu kavereita ↗</button></div><p className="note">Kaverit liittyvät samalla pelilinkillä ja tällä koodilla. Liity mukaan ennen aloitusta. Tehtäviä: {length}. Taso: {room.level==='easy'?'Helpommat tehtävät':'Haastavammat tehtävät'}.</p><FriendStats userId={accountId} refresh={screen+':'+room.seed}/><div className="players">{room.players.map((p:any,i:number)=><div key={p.id}><i className="lobby-avatar"><Character id={p.avatar??i} accessory={p.accessory}/></i><b>{p.name}</b><span>{p.id===room.host?'LUOJA':'MUKANA'}</span></div>)}</div>{room.start?<div className="countdown">{room.start>clock.current.now()?`Alkaa ${Math.max(1,Math.ceil((room.start-clock.current.now())/1000))}…`:'Aloitetaan…'}</div>:room.host===room.me?<button className="primary" disabled={busy} onClick={()=>roomAction('start')}>Aloita yhteinen kierros →</button>:<p>Odotetaan, että haasteen luoja aloittaa.</p>}<button className="textbutton" onClick={home}>← Takaisin</button></section>}
 {screen==='game'&&<><section className={'game '+(task.id==='coderoute'&&stage==='play'?'code-round ':'')+(stage==='feedback'?'show-climb':'')}>{stage!=='feedback'&&<div className="game-toolbar"><span className="task-position">Tehtävä {idx+1} / {deck.length}</span></div>}<div className="task-heading"><span className="task-eyebrow">{task.title}</span>{(stage!=='play'||!['hidepics','picorder','syllables','peek'].includes(task.id))&&<h2><WobblyText text={taskActions[task.id]||task.title}/></h2>}</div>
 {stage==='intro'&&<p className="intro-guide">{task.instruction}</p>}
 {stage==='intro'&&<div className="task-intro"><button className="primary" onClick={play}>Olen valmis →</button><p className="note">Aika alkaa vasta lähtölaskennan jälkeen.</p><LaunchScene avatar={avatar} index={idx}/></div>}
 {stage==='countdown'&&<div className="start-countdown" aria-live="polite"><Character id={avatar} accessory={accessory} happy/><strong key={count}>{count}</strong><p>Kohta mennään!</p></div>}
 {stage==='play'&&<div className="play-stage"><Minigame key={idx+':'+task.id} task={task} avatar={avatar} onFinish={finish}/></div>}
 {stage==='feedback'&&<div className="feedback climb-feedback">{room?<><div className="earned"><span>SAIT <b>+{scores.at(-1)} P</b></span><small>{raceDone?'HIENOA! JATKETAANKO?':'VÄLITILANNE'}</small></div><ParkRace key={idx} players={room.players.map((p:any)=>p.id===room.me?{...p,scores}:p)} round={idx} length={deck.length} me={room.me} onComplete={()=>setRaceDone(true)}/><p className="round-detail">{detail}</p></>:<section className="solo-break">
 <div className="standings-title"><h2>Välitilanne!</h2><span>{idx+1} / {deck.length}</span></div>
 <div className="solo-mascot"><span aria-hidden="true">✦</span><Character id={avatar} accessory={accessory} happy={(scores.at(-1)??0)>0}/><span aria-hidden="true">✦</span></div>
 <strong className="solo-earned">+{scores.at(-1)} p</strong><p>{detail}</p>
 <div className="solo-total">Yhteensä <b>{scores.reduce((sum,score)=>sum+score,0).toLocaleString('fi-FI')} p</b></div>
 <div className="solo-progress" aria-hidden="true">{deck.map((item,i)=><i key={item.id} className={i<=idx?'completed':''}/>)}</div>
 </section>}{progressError&&<button className="retry-progress" onClick={()=>sendProgress(scores)}>{progressError}</button>}{room&&<RoomChat room={room} send={async(text,messageId)=>{const v=await api('chat',{text,messageId});setRoom(v.state);}}/>}{raceDone&&<button className="primary" onClick={next}>{idx===deck.length-1?'Katso yhteistulos →':'Seuraava tehtävä →'}</button>}</div>}

 </section></>}
 {screen==='results'&&<section className="results">{!showPodium&&(!room||room.players.every((p:any)=>p.disconnected||p.id===room.me||p.scores?.length===length))?<WinnerReveal avatar={avatar} name={name} scores={scores} players={room?.players} me={room?.me} onDone={()=>setShowPodium(true)}/>:<><ResultParty avatar={avatar} name={name} scores={scores} players={room?.players} me={room?.me}/>{room&&<RoomChat room={room} send={async(text,messageId)=>{const v=await api('chat',{text,messageId});setRoom(v.state);}}/>}{unlockMessage&&<p className="unlock-party" role="status">🎉 {unlockMessage}</p>}{daily&&<p>Päivän paras tuloksesi {dailyBest} p</p>}<div className="result-actions">{room&&!room.proposal&&<button className="primary" disabled={busy||!saved} onClick={()=>roomAction('rematch')}>Ehdota uutta peliä ↗</button>}<button className="primary" onClick={()=>begin(Math.floor(Math.random()*1e8))}>Uusi oma kierros ↗</button><button className="textbutton" onClick={home}>← Alkuun</button></div>{room&&<><FriendStats userId={accountId} refresh={screen+':'+room.seed}/><h3>Kaverien tulokset</h3><div className="leaderboard">{[...room.players].sort((a,b)=>total(b.scores||[])-total(a.scores||[])).map((p:any,i:number)=><div key={p.id}><span className="result-player"><Character id={p.avatar??i} accessory={p.accessory}/>{i+1}. {p.name}</span><b>{p.disconnected?'Keskeytti':p.scores?.length===length?total(p.scores).toLocaleString('fi-FI')+' p':`${total(p.scores||[])} p · pelaa vielä`}</b></div>)}</div><p className="note">Haaste {room.code} · {saved?'Oma tuloksesi on tallennettu.':'Tallennetaan tulosta…'}</p>{!saved&&<button onClick={saveResult}>Yritä tallennusta uudelleen</button>}</>}</>}</section>}
 {room?.proposal&&['game','results'].includes(screen)&&<div className="rematch-overlay" role="dialog" aria-label="Uusi peli"><h2>Uusi peli samalla porukalla?</h2><p>Valitse mukaan 30 sekunnin kuluessa. Uusi peli alkaa vain mukaan ilmoittautuneille.</p><div className="players">{room.players.map((p:any)=><div key={p.id}><b>{p.name}</b><span>{room.proposal.choices[p.id]===true?'Mukana!':room.proposal.choices[p.id]===false?'Jää pois':'Miettii…'}</span></div>)}</div><button className="primary" disabled={busy||room.proposal.choices[room.me]===true} onClick={()=>roomAction('accept')}>{room.proposal.choices[room.me]===true?'Olet mukana!':'Lähden mukaan'}</button><button onClick={async()=>{await roomAction('decline');home();}}>Jään pois</button></div>}
 {progressError&&room&&<p className="error" role="status">{progressError} Pisteiden lähetystä yritetään uudelleen.</p>}
 {error&&<div className="error" role="status">{error}<button aria-label="Sulje ilmoitus" onClick={()=>setError('')}>×</button></div>}
 {(['home','daily','account','library','create','join'].includes(screen)||screen==='kids'&&!littlePlaying)&&<nav className="bottom-nav" aria-label="Päävalikko">{[{id:'home',label:'Koti',icon:'⌂'},{id:'daily',label:'Päivän Hups',icon:'✦'},{id:'kids',label:'Pikkuhups',icon:'◉'},{id:'account',label:'Oma Hups',icon:'☺'}].map(tab=><button key={tab.id} aria-current={screen===tab.id?'page':undefined} onClick={()=>openTab(tab.id)}><span aria-hidden="true">{tab.icon}</span>{tab.label}</button>)}</nav>}
 <footer>{screen==='home'&&<p className="home-bottom-description">{taskCatalog.length>100?'Yli sata erilaista peliä.':'Lähes sata erilaista peliä.'} Yksin tai yhdessä.</p>}HUPS! · PIENET PELIT, ISO ILO{screen!=='home'&&<small className="studio-credit">MAMV Studio <span>• Tehty iloksi</span></small>}</footer>
 {screen==='game'&&<dialog className="exit-dialog" ref={exitDialog} aria-labelledby="exit-title"><h2 id="exit-title">Keskeytetäänkö peli?</h2><div className="exit-actions"><button className="primary" autoFocus onClick={()=>exitDialog.current?.close()}><span>Jatka peliä</span></button><button className="primary" onClick={()=>{exitDialog.current?.close();home();}}><span>Palaa etusivulle</span></button></div></dialog>}
 </main>;
}
