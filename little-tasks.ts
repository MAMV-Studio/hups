import {random,shuffle} from './libgame';
export const kidCatalog=[
 {id:'popall',title:'Kaikki pallot poks!',group:'pop'},
 {id:'popblue',title:'Siniset pallot poks!',group:'pop'},
 {id:'peek',title:'Kukkuu! Kuka siellä?',group:'pop'},
 {id:'color',title:'Etsi sama väri!',group:'colors'},
 {id:'shape',title:'Etsi sama muoto!',group:'colors'},
 {id:'spray',title:'Suihki väriä!',group:'colors'},
 {id:'scratch',title:'Kuka piilossa?',group:'find'},
 {id:'strawberry',title:'Missä on mansikka?',group:'find'},
 {id:'cat',title:'Missä on kissa?',group:'find'},
 {id:'fox',title:'Missä on kettu?',group:'find'},
 {id:'food',title:'Minkä voi syödä?',group:'find'},
 {id:'match',title:'Etsi samanlainen!',group:'find'},
 {id:'big',title:'Missä on isoin?',group:'colors'},
 {id:'small',title:'Missä on pienin?',group:'colors'}
];
export function kidDeck(seed:number,group='all'){const r=random(seed);return shuffle(kidCatalog.filter(t=>group==='all'||t.group===group).map(t=>t.id),r);}
const palette=[{color:'#79c6ff',label:'Sininen'},{color:'#f7a1b5',label:'Vaaleanpunainen'},{color:'#c9ef83',label:'Vihreä'},{color:'#f8d478',label:'Keltainen'}];
export function kidChallenge(id:string,seed:number):{sample:string,sampleColor?:string,items:{icon?:string,label:string,color?:string,size?:string,correct:boolean}[]}{
 const r=random(seed),mix=(a:any[])=>shuffle(a,r);let sample='',sampleColor:string|undefined,items:any[]=[];
 if(id==='popall'||id==='popblue'){sample=id==='popblue'?'🔵':'🎈';items=mix(Array.from({length:6},(_,i)=>({...palette[i%4],correct:id==='popall'||i%4===0})));}
 else if(id==='color'){const target=Math.floor(r()*4);sample='●';sampleColor=palette[target].color;items=mix(palette.map((p,i)=>({...p,correct:i===target})));}
 else if(id==='shape'){const a=['●','▲','■','★'],n=Math.floor(r()*4);sample=a[n];items=mix(a.map((icon,i)=>({icon,label:['Ympyrä','Kolmio','Neliö','Tähti'][i],color:'#b79ae6',correct:i===n})));}
 else if(id==='big'||id==='small'){sample=id==='big'?'🐘':'🐭';items=mix([45,62,82,102].map((n,i)=>({icon:'●',label:`${['Pienin','Pieni','Iso','Isoin'][i]} pallo`,size:n+'px',correct:i===(id==='big'?3:0),color:'#a6dae5'})));}
 else if(['strawberry','cat','fox','food','match'].includes(id)){const groups:any={strawberry:[['🍓','Mansikka'],['⚽','Pallo'],['🦋','Perhonen'],['🌼','Kukka']],cat:[['🐱','Kissa'],['🐶','Koira'],['🦊','Kettu'],['🐸','Sammakko']],fox:[['🦊','Kettu'],['🐱','Kissa'],['🐻','Karhu'],['🐰','Pupu']],food:[['🍎','Omena'],['👟','Kenkä'],['🚗','Auto'],['🧸','Nalle']],match:[['🦋','Perhonen'],['🍌','Banaani'],['🐶','Koira'],['⚽','Pallo']]};const a=groups[id],target=id==='match'?Math.floor(r()*4):0;sample=id==='food'?'🍽️':a[target][0];items=mix(a.map(([icon,label]:string[],i:number)=>({icon,label,correct:i===target})));}
 return {sample,sampleColor,items};
}
