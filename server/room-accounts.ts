import {roundUuid,statsRpc} from './play-stats';

type Player={accountId?:string;scores?:number[];left?:boolean;lastSeen?:number};
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
 try{await statsRpc('hups_record_account_rounds',{p_entries:rows});}
 catch{console.error('Hups: account round could not be recorded');}
}
