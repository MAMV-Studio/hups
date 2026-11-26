export const christmasUnlocks=[{id:6,games:10},{id:7,games:25},{id:8,games:50}];
export function unlockedAvatar(id:number,games:number,signedIn:boolean){return id<6||signedIn&&games>=(christmasUnlocks.find(item=>item.id===id)?.games??Infinity);}
export function dailyKey(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Helsinki'}).format(new Date());}
export function dailySeed(day:string){return Number(day.replaceAll('-',''))+630000;}
export const rewards=[{id:'none',label:'Ilman asustetta',icon:'',games:0},{id:'crown',label:'Vino kruunu',icon:'♛',games:5},{id:'bow',label:'Jättirusetti',icon:'🎀',games:15},{id:'glasses',label:'Tähtilasit',icon:'⭐',games:30}];
