// Server-only database access. Never import this file from a client component.
type Room = Record<string, any>;
type Row = {data: Room; revision: number};
export function challengeStore() {
 const url=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)return null;
 const headers:Record<string,string>={'apikey':key,'Content-Type':'application/json'};
 // Legacy service_role JWTs also require a bearer header. New sb_secret keys
 // are sent only in apikey, as required by Supabase's Data API.
 if(!key.startsWith('sb_secret_'))headers.Authorization=`Bearer ${key}`;
 const request=async(path:string,init:RequestInit={})=>{
  const response=await fetch(`${url}/rest/v1/${path}`,{...init,headers:{...headers,...init.headers},cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error(`Challenge database returned ${response.status}`);
  return response.json();
 };
 return {
  async create(code:string,data:Room,expiredBefore:number):Promise<boolean>{
   return (await request('rpc/hups_create_challenge',{method:'POST',body:JSON.stringify({p_code:code,p_data:data,p_expired_before:expiredBefore})}))===true;
  },
  async read(code:string):Promise<Row|null>{
   const rows=await request(`hups_challenges?code=eq.${encodeURIComponent(code)}&select=data,revision`);
   return rows[0]??null;
  },
  async save(code:string,data:Room,revision:number):Promise<boolean>{
   const rows=await request(`hups_challenges?code=eq.${encodeURIComponent(code)}&revision=eq.${revision}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({data,revision:revision+1})});
   return rows.length===1;
  }
 };
}
