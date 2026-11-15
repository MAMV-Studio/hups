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
};

export function AccountPanel({session,name,avatar,onSave,onBack}:Props){
 const [email,setEmail]=useState('');
 const [sentTo,setSentTo]=useState('');
 const [code,setCode]=useState('');
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

 async function submit(event:FormEvent){
  event.preventDefault();
  if(!accountClient||busy)return;
  setBusy(true);
  setMessage('');
  try{
   if(userId){
    const trimmed=nickname.trim();
    if(!trimmed){setMessage('Kirjoita nimimerkki.');return;}
    const {error}=await accountClient.from('hups_profiles').upsert({user_id:userId,nickname:trimmed,avatar:character});
    if(error)throw error;
    onSave(trimmed,character);
    setMessage('Profiili tallennettu.');
   }else if(sentTo){
    const {error}=await accountClient.auth.verifyOtp({email:sentTo,token:code,type:'email'});
    if(error)throw error;
    setCode('');
    setSentTo('');
   }else{
    const address=email.trim();
    const {error}=await accountClient.auth.signInWithOtp({email:address,options:{shouldCreateUser:true}});
    if(error)throw error;
    setSentTo(address);
   }
  }catch{
   setMessage(userId?'Profiilin tallennus epäonnistui.':sentTo?'Koodi on virheellinen tai vanhentunut. Tarkista koodi tai pyydä uusi.':'Koodia ei voitu lähettää. Tarkista osoite ja yritä hetken päästä uudelleen.');
  }finally{setBusy(false);}
 }

 return <section className="hups-account">
  <h1>{session?'Oma profiili':'Kirjaudu tai luo tili'}</h1>
  {!accountClient?<p>Tilitoimintoa ei ole vielä otettu käyttöön.</p>:<form onSubmit={submit}>
   {session?<><div className="account-totals"><span><strong>{counts?.games??'–'}</strong> Pelatut pelit</span><span><strong>{counts?.wins??'–'}</strong> Voitot</span></div>
    <label htmlFor="account-nickname">Nimimerkki</label><input id="account-nickname" value={nickname} onChange={event=>setNickname(event.target.value)} maxLength={18} required/>
    <div className="character-picker" aria-label="Valitse hahmo">{characters.map((item,index)=><button type="button" key={item.name} aria-label={item.name} aria-pressed={character===index} className={character===index?'picked':''} onClick={()=>setCharacter(index)}><Character id={index}/></button>)}</div>
   </>:sentTo?<><p>Koodi lähetettiin osoitteeseen <strong>{sentTo}</strong>.</p><label htmlFor="account-code">Kertakoodi</label><input id="account-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,'').slice(0,10))} required/></>:<><p>Pelatut kierrokset ja moninpelivoitot tallentuvat tilillesi.</p><label htmlFor="account-email">Sähköposti</label><input id="account-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={event=>setEmail(event.target.value)} required/></>}
   <button className="primary" disabled={busy}>{session?'Tallenna profiili':sentTo?'Kirjaudu':'Lähetä kertakoodi'}</button>
   {sentTo&&!session&&<button type="button" className="textbutton" disabled={busy} onClick={()=>{setSentTo('');setCode('');setMessage('');}}>Vaihda osoite tai pyydä uusi koodi</button>}
  </form>}
  {message&&<p role="status">{message}</p>}
  {session&&<button className="textbutton" onClick={async()=>{const result=await accountClient?.auth.signOut({scope:'local'});if(result?.error)setMessage('Uloskirjautuminen epäonnistui.');}}>Kirjaudu ulos</button>}
  <button className="textbutton" onClick={onBack}>← Etusivulle</button>
 </section>;
}
