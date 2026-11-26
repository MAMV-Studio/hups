'use client';
import {useEffect,useState} from 'react';
import {accountClient} from './account-client';
export function FriendStats({userId,refresh}:{userId?:string,refresh:string}){
 const [rows,setRows]=useState<any[]>([]);
 useEffect(()=>{if(!userId||!accountClient)return;let live=true;void accountClient.rpc('hups_my_friend_stats').then(({data})=>{if(live)setRows(data||[]);});return()=>{live=false;};},[userId,refresh]);
 if(!userId||!rows.length)return null;
 return <div className="friend-history"><h3>Keskinäiset kisat</h3>{rows.map(row=><p key={row.friend_id}>Sinä <b>{row.wins} – {row.losses}</b> {row.friend_name}<small>Tasapelit {row.draws}</small></p>)}</div>;
}
