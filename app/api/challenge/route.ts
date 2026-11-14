import {validProgress} from '../../../libgame';
import {challengeStore} from '../../../server/challenge-store';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const reply=(d:any,status=200)=>Response.json({...d,serverNow:Date.now()},{status,headers:{'Cache-Control':'no-store'}});
function away(s:any,p:any){return (p.scores?.length||0)<s.length&&(p.left===true||(typeof p.lastSeen==='number'&&Date.now()-p.lastSeen>45000));}
function view(s:any,token:string){return {...s,host:s.players.find((p:any)=>!away(s,p))?.id,me:s.players.find((p:any)=>p.token===token)?.id,players:s.players.map(({token,...p}:any)=>({...p,disconnected:away(s,p)}))};}
export async function POST(req:Request){try{
 const b:any=await req.json(),db=challengeStore();
 b.code=String(b.code??'').normalize('NFKC').replace(/\s/g,'');
 if(b.version!==26)return reply({error:'Pelin versio on vanhentunut. Päivitä sivu ja liity uudelleen.',updateRequired:true},426);
 if(!db)return reply({error:'Haastepalvelu ei ole käytettävissä.'},503);
 if(b.action==='create'){
  for(let attempt=0;attempt<30;attempt++){
   const code=String(1000+crypto.getRandomValues(new Uint32Array(1))[0]%9000),token=crypto.randomUUID();
   const s={code,version:26,level:b.level==='easy'?'easy':'normal',length:Number.isInteger(b.length)&&b.length>=5&&b.length<=20?b.length:8,seed:Math.floor(Math.random()*1e8),created:Date.now(),start:0,players:[{id:crypto.randomUUID(),token,name:String(b.name||'Pelaaja').slice(0,18),lastSeen:Date.now(),avatar:Number.isInteger(b.avatar)&&b.avatar>=0&&b.avatar<6?b.avatar:0,scores:[]}]};
   if(await db.create(code,s,Date.now()-86400000)){const saved=await db.read(code);if(!saved||saved.data.code!==code)return reply({error:'Haasteen tallennusta ei voitu vahvistaa. Kokeile luoda uusi haaste.'},503);return reply({token,code,state:view(saved.data,token)});}
  }return reply({error:'Koodeissa on ruuhkaa. Yritä uudelleen.'},503);
 }
 for(let n=0;n<12;n++){
  const row=await db.read(String(b.code).toUpperCase());
  if(!row)return reply({error:`Haastekoodia ${b.code} ei löytynyt. Pyydä luojalta uusi koodi tai Kopioi pelilinkki -linkki. Avaa sama peliosoite kuin luoja.`},404);
  let s=row.data,token=b.token;
  if(s.version!==26)return reply({error:'Luo uusi nelinumeroinen peli. Tämä haaste on vanhasta versiosta.'},409);
  if(Date.now()-s.created>86400000)return reply({error:'Haaste vanheni. Luo uusi kierros.'},410);
  let p=s.players.find((p:any)=>p.token===token);
  if(b.action==='join'&&!p){
   if(s.players.length>=12)return reply({error:'Haaste on täynnä.'},409);
   if(s.start||s.proposal)return reply({error:'Peli on käynnissä. Odota seuraavaa kierrosta.'},409);
   token=crypto.randomUUID();p={id:crypto.randomUUID(),token,name:String(b.name||'Pelaaja').slice(0,18),lastSeen:Date.now(),avatar:Number.isInteger(b.avatar)&&b.avatar>=0&&b.avatar<6?b.avatar:0,scores:[]};s.players.push(p);
  }else if(!p)return reply({error:'Et ole mukana tällä kierroksella. Voit liittyä uudelleen koodilla.',left:true},403);
  if(b.action==='leave')p.left=true;else p.lastSeen=Date.now();
  if(b.action==='chat'){
   const text=String(b.text||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,160);
   if(!s.start||!p.scores?.length)return reply({error:'Viestejä voi lähettää tehtävien välissä.'},409);
   if(!text)return reply({error:'Kirjoita viesti ensin.'},400);
   s.messages=s.messages||[];
   if(!s.messages.some((m:any)=>m.playerId===p.id&&m.clientId===b.messageId)){
    if(Date.now()-(p.lastMessage||0)<900)return reply({error:'Pieni hengähdys — lähetä hetken päästä uudelleen.'},429);
    s.messages.push({id:crypto.randomUUID(),clientId:String(b.messageId||'').slice(0,60),playerId:p.id,name:p.name,avatar:p.avatar,text,at:Date.now()});s.messages=s.messages.slice(-40);p.lastMessage=Date.now();
   }
  }
  if(b.action==='rematch'){
   if(p.scores?.length!==s.length)return reply({error:'Pelaa ensin kierros loppuun.'},409);
   if(!s.proposal)s.proposal={deadline:Date.now()+30000,choices:{[p.id]:true}};
  }
  if(b.action==='accept'||b.action==='decline'){
   if(!s.proposal)return reply({error:'Uutta kierrosta ei ole vielä ehdotettu.'},409);
   s.proposal.choices[p.id]=b.action==='accept';
  }
  if(b.action==='start'){
   if(p.id!==s.players.find((v:any)=>!away(s,v))?.id)return reply({error:'Vain luoja voi aloittaa ensimmäisen kierroksen.'},403);
   if(!s.start)s.start=Date.now()+5000;
  }
  if(b.action==='progress'||b.action==='finish'){
   if(b.seed!==s.seed)return reply({state:view(s,token)});
   if(!s.start||Date.now()<s.start)return reply({error:'Haaste ei ole alkanut.'},400);
   const old=p.scores||[];
   // A delayed request containing an earlier prefix is an idempotent no-op.
   const prefix=Array.isArray(b.scores)&&b.scores.length<old.length&&b.scores.every((v:any,i:number)=>v===old[i]);
   if(!prefix){if(!validProgress(old,b.scores,b.action==='finish',s.length))return reply({error:'Virheellinen tulos tai aiempaa pistettä muutettiin.'},400);p.scores=b.scores;}
  }
  if(s.proposal&&(Date.now()>=s.proposal.deadline||s.players.filter((v:any)=>!away(s,v)&&!v.left).every((v:any)=>typeof s.proposal.choices[v.id]==='boolean'))){
   const selected=s.players.filter((v:any)=>!v.left&&s.proposal.choices[v.id]===true);
   if(selected.length){s.players=selected;s.seed=(s.seed+1+Math.floor(Math.random()*999999))%100000000;s.start=Date.now()+5000;s.created=Date.now();s.messages=[];s.players.forEach((v:any)=>{v.scores=[];v.left=false;v.lastSeen=Date.now();});}
   delete s.proposal;
  }
  if(await db.save(s.code,s,row.revision)){if(!s.players.some((v:any)=>v.token===token))return reply({error:'Jäit pois uudelta kierrokselta. Voit aloittaa oman pelin.',left:true},403);return reply({token,code:s.code,state:view(s,token)});}
 }
 return reply({error:'Hetkellinen ruuhka. Pisteet lähetetään uudelleen.'},409);
}catch{console.error('Hups: challenge request failed');return reply({error:'Yhteys haastepalveluun epäonnistui.'},500);}}
