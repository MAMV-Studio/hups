import {roundUuid,statsRpc} from './play-stats';

type Player={name?:string;accountId?:string;scores?:number[];left?:boolean;lastSeen?:number};
export type AccountRoom={code:string;seed:number;created:number;start:number;length:number;players:Player[]};

export async function roomAccountId(req:Request){
 const bearer=req.headers.get('authorization');
 const url=process.env.SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!bearer||!url||!key)return undefined;
 try{
  const response=await fetch(url.replace(/\/$/,'')+'/auth/v1/user',{headers:{apikey:key,Authorization:bearer},cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(response.ok)return (await response.json()).id as string;
 }catch{}
}

export async function recordRoomAccounts(room:AccountRoom){
 if(!room.start||!room.players.some(player=>player.accountId))return;
 const completed=room.players.filter(player=>player.scores?.length===room.length);
 const settled=room.players.every(player=>completed.includes(player)||player.left);
 const points=(player:Player)=>player.scores!.reduce((sum,score)=>sum+score,0);
 const best=Math.max(...completed.map(points));
 const round=roundUuid(`account:${room.code}:${room.seed}:${room.created}:${room.start}`);
 const rows=completed.filter(player=>player.accountId).map(player=>({
  user_id:player.accountId,round_id:round,won:settled&&room.players.length>1&&points(player)===best&&completed.filter(other=>points(other)===best).length===1,
 }));
 if(!rows.length)return;
 if(settled){
  const pairs=completed.filter(player=>player.accountId).flatMap(player=>completed.filter(other=>other.accountId&&other.accountId!==player.accountId).map(other=>({round_id:round,user_id:player.accountId,friend_id:other.accountId,friend_name:other.name||'Kaveri',outcome:points(player)>points(other)?'win':points(player)<points(other)?'loss':'draw'})));
  if(pairs.length)try{await statsRpc('hups_record_friend_results',{p_entries:pairs});}catch{console.error('Hups: friend results could not be recorded');}
 }

 try{await statsRpc('hups_record_account_rounds',{p_entries:rows});}
 catch{console.error('Hups: account round could not be recorded');}
}

export async function roomAppearance(req:Request,accountId:string|undefined,avatar:unknown,accessory:unknown){
 let games=0;
 if(accountId&&(Number(avatar)>=6||accessory&&accessory!=='none')){
  try{
   const url=process.env.SUPABASE_URL?.replace(/\/$/,'');
   const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(url&&key){const response=await fetch(url+'/rest/v1/rpc/hups_my_account_totals',{method:'POST',headers:{apikey:key,Authorization:req.headers.get('authorization')!,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal:AbortSignal.timeout(5000)});if(response.ok)games=(await response.json()).games||0;}
  }catch{}
 }
 const candidate=Number.isInteger(avatar)&&Number(avatar)>=0&&Number(avatar)<9?Number(avatar):0;
 const required=[0,0,0,0,0,0,10,25,50][candidate];
 const item=String(accessory||'none');
 const unlocks:Record<string,number>={none:0,crown:5,bow:15,glasses:30};
 return {avatar:games>=required?candidate:0,accessory:accountId&&Object.hasOwn(unlocks,item)&&games>=unlocks[item]?item:'none'};
}
