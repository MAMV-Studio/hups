'use client';

import {createClient} from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const accountClient=url&&key?createClient(url,key,{auth:{flowType:"pkce"}}):null;

export async function accountHeaders():Promise<Record<string,string>>{
 const session=(await accountClient?.auth.getSession())?.data.session;
 return session?{Authorization:'Bearer '+session.access_token}:{};
}

export function beginAccountRound(){
 const id=crypto.randomUUID();
 const owner=accountClient?.auth.getSession().then(({data})=>data.session?.user.id);
 return async ()=>{
  if(!accountClient||!owner)return;
  const userId=await owner;
  if(!userId)return;
  const {data}=await accountClient.auth.getSession();
  if(data.session?.user.id!==userId)return;
  const row={round_id:id,user_id:userId};
  for(let attempt=0;attempt<3;attempt++){
   const {error}=await accountClient.from('hups_account_rounds').upsert(row,{onConflict:'user_id,round_id',ignoreDuplicates:true});
   if(!error)return;
   if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
  }
 };
}
