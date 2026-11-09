// Anchor server time to a monotonic clock. Device wall-clock/timezone changes
// cannot lengthen the shared countdown. Prefer the least delayed time sample.
export function createGameClock(monotonic:()=>number=()=>performance.now()){
 let server=0,anchor=0,best=Infinity,synced=false;
 return {
  sync(serverNow:number,sent:number,received:number){
   if(!Number.isFinite(serverNow)||received<sent)return;
   const rtt=received-sent;
   if(!synced||rtt<=best||received-anchor>30000){server=serverNow+rtt/2;anchor=received;best=rtt;synced=true;}
  },
  now(){return synced?server+Math.max(0,monotonic()-anchor):0;}
 };
}
