'use client';

import {useEffect,useState,type FormEvent} from 'react';
import type {Session} from '@supabase/supabase-js';
import {accountClient} from './account-client';
import {Character,characters} from './characters';

type Props={
 session:Session|null;
 name:string;
 avatar:number;
 onSave:(name:string,avatar:number)=>void;
 onBack:()=>void;
 returned:boolean;
};

export function AccountPanel({session,name,avatar,onSave,onBack,returned}:Props){
 const [nickname,setNickname]=useState(name);
 const [character,setCharacter]=useState(avatar);
 const [counts,setCounts]=useState<{games:number,wins:number}|null>(null);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const userId=session?.user.id;

 useEffect(()=>{
  if(!userId||!accountClient)return;
  let active=true;
  setMessage('');
  setCounts(null);
  void accountClient.rpc('hups_my_account_totals').then(({data,error})=>{
   if(!active)return;
   if(error)setMessage('Pelitilastoja ei saatu ladattua.');
   else setCounts(data);
  });
  return ()=>{active=false;};
 },[userId]);

 useEffect(()=>{setNickname(name);setCharacter(avatar);},[name,avatar]);

 async function signIn(){
  if(!accountClient||busy)return;
  setBusy(true);
  setMessage('');
  try{
   const redirectTo=new URL('/?profiili=1',window.location.origin).href;
   const {error}=await accountClient.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
   if(error)throw error;
  }catch{
   setMessage('Google-kirjautumista ei voitu avata. Yritä uudelleen.');
   setBusy(false);
  }
 }

 async function submit(event:FormEvent){
  event.preventDefault();
  if(!accountClient||!userId||busy)return;
  const trimmed=nickname.trim();
  if(!trimmed){setMessage('Kirjoita nimimerkki.');return;}
  setBusy(true);
  setMessage('');
  try{
   const {error}=await accountClient.from('hups_profiles').upsert({user_id:userId,nickname:trimmed,avatar:character});
   if(error)throw error;
   onSave(trimmed,character);
   setMessage('Profiili tallennettu.');
  }catch{setMessage('Profiilin tallennus epäonnistui.');}
  finally{setBusy(false);}
 }

 return <section className="hups-account">
  <h1>{session?'Oma profiili':'Kirjaudu tai luo tili'}</h1>
  {!accountClient?<p>Tilitoimintoa ei ole vielä otettu käyttöön.</p>:session?<form onSubmit={submit}>
   <div className="account-totals"><span><strong>{counts?.games??'–'}</strong> Pelatut pelit</span><span><strong>{counts?.wins??'–'}</strong> Voitot</span></div>
    <label htmlFor="account-nickname">Nimimerkki</label><input id="account-nickname" value={nickname} onChange={event=>setNickname(event.target.value)} maxLength={18} required/>
    <div className="character-picker" aria-label="Valitse hahmo">{characters.map((item,index)=><button type="button" key={item.name} aria-label={item.name} aria-pressed={character===index} className={character===index?'picked':''} onClick={()=>setCharacter(index)}><Character id={index}/></button>)}</div>
   <button className="primary" disabled={busy}>Tallenna profiili</button>
  </form>:<>
   {returned&&<p role="status">Jos kirjautuminen keskeytyi, voit yrittää uudelleen.</p>}
   <p>Pelatut kierrokset ja moninpelivoitot tallentuvat tilillesi.</p>
   <button type="button" className="primary" onClick={signIn} disabled={busy}>Kirjaudu Googlella</button>
  </>}
  {message&&<p role="status">{message}</p>}
  {session&&<button className="textbutton" onClick={async()=>{const result=await accountClient?.auth.signOut({scope:'local'});if(result?.error)setMessage('Uloskirjautuminen epäonnistui.');}}>Kirjaudu ulos</button>}
  <button className="textbutton" onClick={onBack}>← Etusivulle</button>
 </section>;
}
