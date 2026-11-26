'use client';
import {useEffect,useState,type FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {accountClient} from './account-client';
import {Character,characters} from './characters';
import {rewards,unlockedAvatar,christmasUnlocks} from './progression';
type Props={session:Session|null;name:string;avatar:number;onSave:(name:string,avatar:number)=>void;onBack:()=>void;returned:boolean};
export function AccountPanel({session,name,avatar,onSave,onBack,returned}:Props){
 const [nickname,setNickname]=useState(name),[character,setCharacter]=useState(avatar),[counts,setCounts]=useState({games:0,wins:0}),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[accessory,setAccessory]=useState('none'),[friends,setFriends]=useState<any[]>([]);
 useEffect(()=>{
  if(!session||!accountClient){setCounts({games:0,wins:0});setAccessory('none');setFriends([]);return;}
  let live=true;
  void Promise.all([accountClient.rpc('hups_my_account_totals'),accountClient.from('hups_profiles').select('accessory').eq('user_id',session.user.id).maybeSingle(),accountClient.rpc('hups_my_friend_stats')]).then(([totals,profile,history])=>{
   if(!live)return;
   if(totals.data)setCounts(totals.data);
   if(profile.data)setAccessory(profile.data.accessory);
   if(history.data)setFriends(history.data);
   if(totals.error||profile.error||history.error)setMessage('Kaikkia tietoja ei saatu ladattua. Tarkista yhteys tai käyttöönotto.');
  });
  return()=>{live=false;};
 },[session]);
 useEffect(()=>{setNickname(name);setCharacter(avatar);},[name,avatar]);
 async function signIn(){if(!accountClient)return;setBusy(true);const {error}=await accountClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('/?profiili=1',window.location.origin).href}});if(error){setMessage('Kirjautuminen epäonnistui.');setBusy(false);}}
 async function submit(event:FormEvent){
  event.preventDefault();if(!nickname.trim()||busy)return;setBusy(true);
  try{
   if(session&&accountClient){const {error}=await accountClient.from('hups_profiles').upsert({user_id:session.user.id,nickname:nickname.trim(),avatar:character,accessory});if(error)throw error;}
   onSave(nickname.trim(),character);localStorage.setItem('hups-accessory',session?accessory:'none');window.dispatchEvent(new Event('hups-accessory'));setMessage('Valinnat tallennettu.');
  }catch{setMessage('Tallennus epäonnistui. Yritä uudelleen.');}finally{setBusy(false);}
 }
 const next=christmasUnlocks.find(item=>item.games>counts.games);
 return <section className="hups-account"><h1>Oma Hups</h1>
 <form onSubmit={submit}><div className="profile-preview"><Character id={character} happy accessory={accessory}/></div>
 {session?<><div className="account-totals"><span><strong>{counts.games}</strong> Pelatut kisat</span><span><strong>{counts.wins}</strong> Voitot</span></div>{next&&<p className="reward-progress">{characters[next.id]?.name} avautuu · vielä {next.games-counts.games} kisaa</p>}</>:<p>Voit pelata kaikkia pelejä vieraana. Kirjaudu tallentamaan palkinnot ja kaveritilastot.</p>}
 <label htmlFor="account-nickname">Pelinimi</label><input id="account-nickname" value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={18} required placeholder="Kirjoita pelinimi"/>
 <div className="character-picker account-characters">{characters.map((item,index)=>{const open=unlockedAvatar(index,counts.games,!!session);return <button type="button" key={item.name} aria-pressed={character===index} aria-label={item.name+(open?'':' · lukittu')} className={character===index?'picked':''} onClick={()=>{if(open)setCharacter(index);else setMessage(session?`${item.name} avautuu ${christmasUnlocks.find(x=>x.id===index)?.games} pelatun kisan jälkeen.`:'Kirjaudu ja pelaa kisoja avataksesi jouluhahmoja.');}}><Character id={index}/><small>{item.name}{!open&&' 🔒'}</small></button>;})}</div>
 <h2>Asusteet</h2><div className="reward-list">{rewards.map(item=><button type="button" key={item.id} aria-pressed={accessory===item.id} disabled={item.games>0&&(!session||counts.games<item.games)} onClick={()=>setAccessory(item.id)}><span>{item.id==='bow'?<img className="reward-bow" src="/hups-bow.png" alt=""/>:item.icon||'—'}</span>{item.label}<small>{item.games>0?`${item.games} kisaa`:''}</small></button>)}</div><button className="primary" disabled={busy}>Tallenna valinnat</button></form>
 {!session&&<button className="primary" disabled={busy||!accountClient} onClick={()=>void signIn()}>Kirjaudu Googlella</button>}
 <h2>Kaverikisat</h2>{friends.length?friends.map(row=><article className="friend-stat" key={row.friend_id}><b>{name||'Sinä'} – {row.friend_name}</b><strong>{row.wins} – {row.losses}</strong><small>Tasapelit {row.draws} · Viimeksi {row.last_outcome==='win'?'sinä voitit':row.last_outcome==='loss'?'kaveri voitti':'tasapeli'}</small></article>):<p>{session?'Tilastot kertyvät, kun molemmat pelaajat ovat kirjautuneet ja kisa on päättynyt.':'Kirjautumalla saat keskinäiset tulokset talteen.'}</p>}
 {message&&<p role="status">{message}</p>}{returned&&!session&&<p>Voit yrittää kirjautumista uudelleen.</p>}
 {session&&<button className="textbutton" onClick={async()=>{const result=await accountClient?.auth.signOut({scope:'local'});if(result?.error)setMessage('Uloskirjautuminen epäonnistui.');}}>Kirjaudu ulos</button>}<button className="textbutton" onClick={onBack}>← Etusivulle</button></section>;
}
