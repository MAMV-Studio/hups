import {sign,equal,statsRpc,sameOrigin,roundUuid,adminReady} from '../../../server/play-stats';
import {challengeStore} from '../../../server/challenge-store';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const uuid=(v:unknown)=>typeof v==='string'&&/^[a-f0-9-]{36}$/i.test(v);
export async function POST(req:Request){try{
 if(!sameOrigin(req))return reply({error:'Virheellinen alkuperä.'},403);
 if(!adminReady())return reply({error:'Laskuria ei ole vielä otettu käyttöön.'},503);
 const b=await req.json();
 if(b.kind==='shared'){
  if(!/^\d{4}$/.test(b.code)||typeof b.token!=='string')return reply({},400);
  const row=await challengeStore()?.read(b.code),s=row?.data,p=s?.players.find((v:any)=>v.token===b.token);
  if(!s||!p||!s.start||Date.now()<s.start)return reply({},403);
  const round=roundUuid(`hups:${s.code}:${s.seed}:${s.created}:${s.start}`);
  // Every initial participant has a row, so a room counts once, even on multiple phones.
  await statsRpc('hups_record_plays',{p_entries:s.players.map((v:any)=>({round_id:round,player_id:v.id,app:'hups',mode:'shared',finished:v.scores?.length===s.length}))});
  return reply({ok:true});
 }
 if(!uuid(b.round)||!['hups','pikkuhups'].includes(b.app)||!['start','complete'].includes(b.action))return reply({},400);
 const key=`play:${b.app}:${b.round}`;
 if(b.action==='complete'&&(!b.ticket||!equal(String(b.ticket),sign(key))))return reply({},403);
 if(!process.env.HUPS_ADMIN_PASSWORD)return reply({error:'Laskuria ei ole vielä otettu käyttöön.'},503);
 await statsRpc('hups_record_plays',{p_entries:[{round_id:b.round,player_id:b.round,app:b.app,mode:b.practice?'practice':'solo',finished:b.action==='complete'}]});
 return reply({ok:true,ticket:sign(key)});
 }catch{return reply({error:'Laskuri ei ole käytettävissä.'},503);}}
