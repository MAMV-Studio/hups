import {extraCatalog,makeExtra} from './extra-tasks';
import {random,shuffle,pictureCards,colorCards} from './libgame';
export type Task={id:string,title:string,icon:string,category:string,instruction:string,data:any};
export const taskCatalog=[
['scratch','Raaputa esiin','✦','RAAPUTUS'],['spray','Suihki väriä','▰','MAALAUS'],['peek','Kukkuu - nappaa','◉','NOPEUS'],
['movinghunt','Liikkuva värijahti','◉','NOPEUS'],['movingcenter','Liikkuva napakymppi','◎','TARKKUUS'],['movingspot','Katoava karkulainen','⌖','PAIKKAMUISTI'],
['timer','Ajantaju','◷','AJOITUS'],['circle','Täydellinen ympyrä','◯','PIIRTÄMINEN'],['pictures','Kuvamuisti','▧','MUISTI'],['odd','Etsi erilainen','★','TARKKA SILMÄ'],['colors','Värijono','▰','MUISTI'],['line','Viivamuisti','〰','TARKKUUS'],['reaction','Reaktio','ϟ','NOPEUS'],['dots','Pistelaskuri','⠿','HAVAINNOINTI'],['center','Täsmälleen keskelle','⊙','TARKKUUS'],['target','Nappiosuma','◎','TARKKUUS'],['sort','Numeropolku','123','JÄRJESTYS'],['biggest','Suurin luku','↗','NUMEROT'],['smallest','Pienin luku','↘','NUMEROT'],['more','Kummassa on enemmän?','••','ARVIOINTI'],['missing','Puuttuva numero','?','NUMEROT'],['add','Pieni pluslasku','＋','LASKEMINEN'],['subtract','Pieni miinuslasku','−','LASKEMINEN'],['shape','Muista muoto','△','MUISTI'],['spot','Missä piste oli?','⌖','PAIKKAMUISTI'],['longest','Pisin palkki','━','VERTAILU'],['shortest','Lyhin palkki','╸','VERTAILU'],['stars','Laske tähdet','★','HAVAINNOINTI'],['same','Sama muoto','◇','TARKKA SILMÄ'],['opposite','Vastakkainen suunta','↔','SUUNNAT'],['gone','Mikä kuva katosi?','▢','MUISTI'],['picorder','Kuvajono','▧','MUISTI'],['stop','Pysäytä keskelle','⏸','AJOITUS'],['bubbles','Poksahtavat kuplat','◌','NOPEUS'],['pair','Etsi oikea pari','♧','TARKKA SILMÄ'],['digits','Muista numero','42','MUISTI'],['taps','Kuusi napautusta','☝','NOPEUS'],['alternate','Vasen–oikea','↔','NOPEUS'],['descend','Numerot takaperin','321','JÄRJESTYS'],['middle','Keskimmäinen luku','↕','NUMEROT'],['near10','Lähimpänä kymppiä','10','NUMEROT'],['numsequence','Numerojono','123','MUISTI'],['shortword','Lyhin sana','Aa','VERTAILU'],['longword','Pisin sana','Aa','VERTAILU'],['triangles','Laske kolmiot','▲','HAVAINNOINTI'],['colorword','Värisana','▰','TARKKA SILMÄ'],['duplicate','Kuva kahdesti','♧','TARKKA SILMÄ'],['equal','Yhtä monta','＝','LUKUMÄÄRÄT'],['redcount','Laske punaiset','●','HAVAINNOINTI'],['sides','Montako kulmaa?','⬡','MUODOT'],['aimchain','Osumaputki','◎','TARKKUUS'],['smallball','Pienin pallo','◦','VERTAILU'],['bigball','Suurin pallo','●','VERTAILU'],['gridmemory','Muista ruudut','▦','MUISTI'],['flashes','Laske välähdykset','✦','KESKITTYMINEN'],['lettergap','Puuttuva kirjain','ABC','JÄRJESTYS'],
['hidepics','Missä kuva oli?','▧','MUISTI'],['ink','Musteen väri','▰','KESKITTYMINEN'],['even','Parillinen luku','2','NUMEROT'],['double','Tuplaa luku','×2','LASKEMINEN'],['half','Puolet luvusta','½','LASKEMINEN'],['nextpattern','Jatka kuviota','◆','PÄÄTTELY'],['alphabet','Aakkosten ensimmäinen','ABC','JÄRJESTYS'],['animal','Etsi eläin','🐱','HAVAINNOINTI'],['fruit','Etsi hedelmä','🍎','HAVAINNOINTI'],['reversepics','Kuvat takaperin','↶','MUISTI'],['differences','Kolme eroa','⌕','TARKKA SILMÄ']
].map(([id,title,icon,category])=>({id,title,icon,category})).concat(extraCatalog);
export const shapes=[{symbol:'●',name:'ympyrä'},{symbol:'■',name:'neliö'},{symbol:'▲',name:'kolmio'},{symbol:'★',name:'tähti'}];
export const arrows=['↑','→','↓','←'];
function choices(correct:number,r:()=>number,min=0,max=Infinity){const set=new Set([correct]);while(set.size<4)set.add(Math.min(max,Math.max(min,correct+Math.floor(r()*11)-5)));return shuffle([...set],r);}
export function makeTask(id:string,seed:number):Task{
 const meta=taskCatalog.find(t=>t.id===id)!;if(!meta)throw Error('Unknown task');if(extraCatalog.some(t=>t.id===id))return {...meta,...makeExtra(id,seed)};const r=random(seed),int=(a:number,b:number)=>a+Math.floor(r()*(b-a+1));let d:any={},instruction='';const pics=shuffle(pictureCards,r);
 switch(id){
 case 'scratch':d.seed=seed;instruction='Raaputa sormella yllätyskuva esiin. Kun noin 90 % pinnasta on poissa, tehtävä on valmis.';break;
 case 'spray':d.seed=seed;instruction='Valitse mallin värinen maali ja suihki sormella taulu täyteen. Noin 90 % riittää!';break;
 case 'peek':d.seed=seed;instruction='Nappaa neljä koloista kurkistavaa hahmoa. Älä napauta naamiohuijaria! Huijarin osumasta vähennetään pisteitä.';break;
 case 'movinghunt':d={...makeTask('colorhunt',seed).data};instruction='Pallot liikkuvat! Poksauta vain siniset ja jätä muut ehjiksi.';break;
 case 'movingcenter':case 'movingspot':d.point={x:150,y:150};d.phase=r()*Math.PI*2;d.speed=int(850,1250);instruction=id==='movingcenter'?'Kohde liikkuu. Napauta sen keskelle mahdollisimman tarkasti!':'Seuraa liikkuvaa pistettä 3 sekuntia. Kun piste katoaa, napauta sen viimeistä paikkaa.';break;
 case 'timer':d.seconds=int(3,5);instruction=`Pysäytä ajastin mahdollisimman tarkasti ${d.seconds} sekunnin kohdalla. Kello ei näy.`;break;
 case 'circle':instruction='Piirrä yhdellä vedolla mahdollisimman pyöreä ympyrä. Yhdistä viivan päät ja käytä reilusti tilaa. Nosta sormi, kun olet piirtänyt — vastaus tarkistetaan heti.';break;
 case 'pictures':d.first=pics.slice(0,4);d.second=shuffle([...shuffle(d.first,r).slice(0,3),pics[4]],r);instruction='Katso neljää kuvaa 3 sekuntia. Valitse sitten ne kolme kuvaa, jotka näit äsken.';break;
 case 'odd':d.pair=shuffle([['🍎','🍐'],['🐱','🐶'],['⚽','🏀'],['🌼','🌻']],r)[0];d.answer=int(0,8);instruction='Yksi yhdeksästä kuvasta on erilainen. Löydä ja napauta sitä.';break;
 case 'colors':d.order=Array.from({length:4},()=>int(0,3));instruction='Näet 4 väriä peräkkäin, yhden sekunnin kutakin. Muista järjestys ja napauta sitten värit samassa järjestyksessä. Sama väri voi toistua.';break;
 case 'line':d.length=int(110,200);instruction='Katso malliviivaa 3 sekuntia. Se katoaa. Piirrä sen jälkeen yhtä pitkä viiva. Nosta sormi lopuksi — vastaus tarkistetaan heti.';break;
 case 'reaction':d.delay=int(1800,4000);instruction='Odota, että alue muuttuu vihreäksi. Paina sitten mahdollisimman nopeasti. Älä ennakoi!';break;
 case 'dots':d.count=int(6,12);d.options=choices(d.count,r,1);d.positions=positions(12,r);instruction='Pisteet näkyvät 3 sekuntia ja katoavat. Montako niitä oli? Napauta oikeaa vaihtoehtoa.';break;
 case 'center':d.point={x:150,y:150};instruction='Napauta neliön keskelle niin tarkasti kuin osaat. Keskikohta paljastuu vasta napautuksen jälkeen.';break;
 case 'target':d.point={x:int(45,255),y:int(45,255)};instruction='Napauta maalitaulun keskelle mahdollisimman tarkasti. Yksi napautus riittää.';break;
 case 'sort':case 'descend':d.numbers=shuffle(Array.from({length:9},(_,i)=>i+1),r).slice(0,5);d.order=[...d.numbers].sort((a,b)=>id==='sort'?a-b:b-a);instruction=id==='sort'?'Napauta kaikki viisi numeroa pienimmästä suurimpaan.':'Napauta kaikki viisi numeroa suurimmasta pienimpään.';break;
 case 'biggest':case 'smallest':case 'middle':d.numbers=shuffle(Array.from({length:30},(_,i)=>i+1),r).slice(0,4);if(id==='middle')d.numbers=d.numbers.slice(0,3);d.answer=id==='biggest'?Math.max(...d.numbers):id==='middle'?[...d.numbers].sort((a,b)=>a-b)[1]:Math.min(...d.numbers);instruction=id==='middle'?'Mikä kolmesta luvusta on suuruudeltaan keskimmäinen? Napauta sitä.':`Napauta ${id==='biggest'?'suurinta':'pienintä'} lukua.`;break;
 case 'more':d.counts=[int(3,10),int(3,10)];if(d.counts[0]===d.counts[1])d.counts[1]++;d.answer=d.counts[0]>d.counts[1]?0:1;instruction='Kummassa ruudussa on enemmän palloja? Napauta sitä ruutua.';break;
 case 'missing':d.start=int(1,5);d.numbers=Array.from({length:5},(_,i)=>d.start+i);d.hole=int(0,4);d.answer=d.numbers[d.hole];d.options=choices(d.answer,r,1);instruction='Yksi numero puuttuu järjestyksestä. Valitse puuttuva numero.';break;
 case 'add':case 'subtract':d.a=int(3,10);d.b=int(1,id==='add'?10:d.a);d.answer=id==='add'?d.a+d.b:d.a-d.b;d.options=choices(d.answer,r);instruction='Laske pieni lasku ja napauta oikeaa vastausta. Nopea ja oikea vastaus tuo enemmän pisteitä.';break;
 case 'shape':case 'same':d.answer=int(0,3);d.options=shuffle([0,1,2,3],r);instruction=id==='shape'?'Katso muotoa 3 sekuntia. Valitse sen jälkeen sama muoto.':'Katso mallia ja napauta alhaalta täsmälleen samaa muotoa.';break;
 case 'spot':d.point={x:int(50,250),y:int(50,250)};instruction='Muista, missä piste näkyy. Se katoaa 3 sekunnissa. Napauta sitten samaan kohtaan.';break;
 case 'longest':case 'shortest':d.lengths=shuffle([65,110,165,220],r);d.answer=d.lengths.indexOf(id==='longest'?220:65);instruction=`Napauta ${id==='longest'?'pisintä':'lyhintä'} palkkia.`;break;
 case 'stars':case 'triangles':d.count=int(3,7);d.symbols=shuffle([...Array(d.count).fill(id==='stars'?'★':'▲'),...Array(12-d.count).fill('●')],r);d.options=choices(d.count,r,1);instruction=id==='stars'?'Laske vain tähdet. Ympyröitä ei lasketa.':'Laske vain kolmiot. Ympyröitä ei lasketa.';break;
 case 'opposite':d.direction=int(0,3);d.answer=(d.direction+2)%4;instruction='Katso isoa nuolta. Napauta nuolta, joka osoittaa vastakkaiseen suuntaan.';break;
 case 'gone':d.first=pics.slice(0,4);d.answer=int(0,3);d.remaining=d.first.filter((_:any,i:number)=>i!==d.answer);d.options=shuffle(d.first,r);instruction='Muista neljä kuvaa. Kolmen sekunnin jälkeen yksi katoaa. Valitse alhaalta kadonnut kuva.';break;
 case 'picorder':d.order=shuffle([0,1,2,3],r).slice(0,3);d.pictures=pics.slice(0,4);instruction='Näet kolme kuvaa peräkkäin. Muista järjestys ja napauta sitten kuvat samassa järjestyksessä.';break;
 case 'stop':d.speed=1400;instruction='Merkki liikkuu edestakaisin. Paina STOP, kun se on mahdollisimman keskellä vihreää aluetta.';break;
 case 'bubbles':d.positions=shuffle(positions(9,r),r).slice(0,6);instruction='Poksauta iso yllätyspallo! Sen sisältä vapautuu kuusi liikkuvaa pikkupalloa. Puhkaise ne kaikki.';break;
 case 'pair':d.answer=int(0,3);d.pairs=Array.from({length:4},(_,i)=>i===d.answer?[pics[i],pics[i]]:[pics[i],pics[i+4]]);instruction='Missä parissa on kaksi samaa kuvaa? Napauta oikeaa paria.';break;
 case 'digits':d.answer=int(100,999);d.options=choices(d.answer,r,100,999);instruction='Katso kolminumeroista lukua 3 sekuntia. Se katoaa. Valitse sitten sama luku.';break;
 case 'taps':instruction='Napauta isoa aluetta 6 kertaa niin nopeasti kuin pystyt. Jokainen napautus lasketaan!';break;
 case 'alternate':instruction='Napauta vasenta ja oikeaa painiketta vuorotellen. Aloita vasemmalta. Yhteensä 6 napautusta.';break;
 case 'near10':d.numbers=[];for(const n of shuffle(Array.from({length:20},(_,i)=>i+1).filter(n=>n!==10),r))if(d.numbers.length<4&&!d.numbers.some((v:number)=>Math.abs(v-10)===Math.abs(n-10)))d.numbers.push(n);d.answer=[...d.numbers].sort((a,b)=>Math.abs(a-10)-Math.abs(b-10))[0];instruction='Mikä luku on lähimpänä lukua 10? Napauta sitä.';break;
 case 'numsequence':d.order=shuffle([1,2,3,4,5,6],r).slice(0,3);instruction='Näet 3 numeroa peräkkäin, sekunnin kutakin. Napauta lopuksi samat numerot samassa järjestyksessä.';break;
 case 'shortword':case 'longword':d.options=shuffle(shuffle([['kuu','talo','omena','sateenkaari'],['puu','pallo','ikkuna','hiekkalaatikko'],['suu','kissa','aurinko','lentokone']],r)[0],r);d.answer=[...d.options].sort((a,b)=>id==='shortword'?a.length-b.length:b.length-a.length)[0];instruction=id==='shortword'?'Missä sanassa on vähiten kirjaimia? Napauta lyhintä sanaa.':'Missä sanassa on eniten kirjaimia? Napauta pisintä sanaa.';break;
 case 'colorword':d.answer=int(0,3);d.ink=(d.answer+int(1,3))%4;instruction='Lue sana. Napauta sanan tarkoittamaa väriä, älä tekstin väriä!';break;
 case 'duplicate':d.answer=pics[0].name;d.images=shuffle([pics[0],pics[0],...pics.slice(1,5)],r);instruction='Yksi kuva näkyy kahdesti. Etsi se ja napauta kumpaa tahansa samanlaista kuvaa.';break;
 case 'equal':d.count=int(3,8);d.options=choices(d.count,r,1);instruction='Katso mallin palloja. Missä vaihtoehdossa on yhtä monta? Napauta oikeaa ruutua.';break;
 case 'redcount':d.count=int(3,8);d.colors=shuffle([...Array(d.count).fill(0),...Array(12-d.count).fill(1)],r);d.options=choices(d.count,r,1);instruction='Laske vain punaiset pallot. Sinisiä ei lasketa. Valitse oikea määrä.';break;
 case 'sides':d.answer=int(3,6);d.options=shuffle([3,4,5,6],r);instruction='Montako kulmaa kuviossa on? Laske ja napauta oikeaa määrää.';break;
 case 'aimchain':d.positions=Array.from({length:6},()=>({x:int(40,260),y:int(40,260)}));instruction='Osu 6 maalitaulun keskelle. Maalitaulu vaihtaa paikkaa joka osuman jälkeen. Tarkkuus ja nopeus ratkaisevat!';break;
 case 'smallball':case 'bigball':d.sizes=shuffle([14,22,31,40],r);d.answer=d.sizes.indexOf(id==='smallball'?14:40);instruction=id==='smallball'?'Napauta kaikkein pienintä palloa.':'Napauta kaikkein suurinta palloa.';break;
 case 'gridmemory':d.cells=shuffle(Array.from({length:9},(_,i)=>i),r).slice(0,3);instruction='Muista 3 vihreää ruutua. Ne katoavat 3 sekunnissa. Napauta sitten samoja ruutuja.';break;
 case 'flashes':d.count=int(4,7);d.options=choices(d.count,r,1);instruction='Tähti välähtää muutaman kerran. Laske välähdykset ja valitse lopuksi oikea määrä.';break;
 case 'lettergap':d.letters='ABCDEFGHIJKLMNOPQRSTUV'.slice(int(0,12)).slice(0,5).split('');d.hole=int(1,3);d.answer=d.letters[d.hole];d.options=shuffle([d.answer,...shuffle('ABCDEFGHIJKLMNOPQRSTUV'.split('').filter(v=>v!==d.answer),r).slice(0,3)],r);instruction='Mikä kirjain puuttuu aakkosjärjestyksestä? Valitse puuttuva kirjain.';break;

 case 'hidepics':d.pictures=pics.slice(0,6);d.answer=int(0,5);instruction='Muista kuuden kuvan paikat 3 sekunnissa. Kuvat kääntyvät piiloon. Napauta paikkaa, jossa kysytty kuva oli.';break;
 case 'ink':d.answer=int(0,3);d.word=(d.answer+int(1,3))%4;instruction='Katso tekstin väriä. Valitse musteen väri, vaikka sana tarkoittaisi eri väriä.';break;
 case 'even':d.options=shuffle([int(1,9)*2,...shuffle([1,3,5,7,9,11,13,15,17,19],r).slice(0,3)],r);d.answer=d.options.find((n:number)=>n%2===0);instruction='Mikä luvuista on parillinen? Sen voi jakaa kahteen yhtä suureen osaan ilman jakojäännöstä.';break;
 case 'double':case 'half':d.n=int(2,10);if(id==='half')d.n*=2;d.answer=id==='double'?d.n*2:d.n/2;d.options=choices(d.answer,r,1);instruction=id==='double'?'Mikä on kaksi kertaa näytetty luku? Valitse oikea vastaus.':'Mikä on puolet näytetystä luvusta? Valitse oikea vastaus.';break;
 case 'nextpattern':d.a=int(0,3);d.b=(d.a+int(1,3))%4;d.answer=d.b;d.options=shuffle([0,1,2,3],r);instruction='Kuviot vuorottelevat. Mikä kuvio kuuluu kysymysmerkin kohdalle?';break;
 case 'alphabet':d.options=shuffle('ABCDEFGHIJKLMNOPRST'.split(''),r).slice(0,4);d.answer=[...d.options].sort()[0];instruction='Mikä näistä kirjaimista tulee aakkosissa ensimmäisenä? Napauta sitä.';break;
 case 'animal':case 'fruit':d.answer=(id==='animal'?shuffle(['🐱','🐟','🐸','🦋'],r):shuffle(['🍎','🍌','🍓','🍐'],r))[0];d.options=shuffle([d.answer,...shuffle(['🚗','🚀','⚽','🎈','🎸','⏰'],r).slice(0,3)],r);instruction=id==='animal'?'Mikä kuvista on eläin? Napauta eläintä mahdollisimman nopeasti.':'Mikä kuvista on hedelmä tai marja? Napauta sitä mahdollisimman nopeasti.';break;
 case 'reversepics':d.order=shuffle([0,1,2,3],r).slice(0,3);d.pictures=pics.slice(0,4);instruction='Muista kolme kuvaa. Napauta ne sitten TAKAPERIN: viimeksi näytetty ensin.';break;
 case 'shadow':d.answer=int(0,5);d.options=shuffle([0,1,2,3,4,5],r).slice(0,3);if(!d.options.includes(d.answer))d.options[int(0,2)]=d.answer;instruction='Vedä varjon päälle kuva, josta varjo syntyy. Voit myös napauttaa kuvaa ja sitten varjoa. Väärän kuvan jälkeen saat yrittää uudelleen.';break;
 case 'differences':d.changes=shuffle([0,1,2,3,4,5],r).slice(0,3);d.variant=int(0,3);instruction='Etsi kahdesta kuvasta kolme eroa. Napauta eroavia kohtia alemmasta kuvasta. Aika jatkuu, kunnes löydät kaikki kolme.';break;
 }
 return {...meta,instruction,data:d};
}
export function positions(n:number,r:()=>number){return Array.from({length:n},(_,i)=>({x:35+(i%4)*75+r()*12,y:35+Math.floor(i/4)*75+r()*12}));}
export const calculationTasks=['add','subtract','double','half'];
export const handsOnTasks=['scratch','spray','peek','movinghunt','movingcenter','movingspot','timer','circle','line','reaction','center','target','spot','stop','bubbles','taps','alternate','aimchain','differences','colorhunt'];
export function taskDeck(seed:number,length=8):Task[]{
 const r=random(seed),count=Math.max(5,Math.min(20,Math.round(length)));
 const active=shuffle(handsOnTasks,r).slice(0,Math.ceil(count*.6));
 const regular=shuffle(taskCatalog.filter(t=>!calculationTasks.includes(t.id)&&!handsOnTasks.includes(t.id)).map(t=>t.id),r);
 const remainder=count-active.length,occasionalCalculation=r()<.2;
 const rest=occasionalCalculation?[...regular.slice(0,remainder-1),shuffle(calculationTasks,r)[0]]:regular.slice(0,remainder);
 return shuffle([...active,...rest],r).map((id,i)=>makeTask(id,seed+i*7919+413));
}

export function tapScore(p:{x:number,y:number},target:{x:number,y:number}){return Math.round(1000*Math.max(0,1-Math.hypot(p.x-target.x,p.y-target.y)/100));}
export function sequenceScore(given:number[],expected:number[]){return Math.round(1000*expected.filter((v,i)=>v===given[i]).length/expected.length);}
export {pictureCards,colorCards};
export function sequencePhase(elapsed:number,length:number){return {showing:elapsed<length*1000,index:Math.min(length-1,Math.floor(Math.max(0,elapsed)/1000))};}

export function motionPoint(data:any,ms:number){const t=Math.max(0,ms)/(data.speed||1000),p=data.phase||0;return {x:150+86*Math.sin(t+p),y:150+80*Math.sin(t*.73+p*.7)};}
export const ANSWER_LIMIT_MS=10000;
export function revealTimeMs(id:string,data:any={}){return data.extra?Math.max(0,Number(data.wait)||0):id==='reaction'?Number(data.delay)||0:id==='colors'?4000:['pictures','shape','spot','movingspot','gone','dots','digits','line','gridmemory','picorder','numsequence','hidepics','reversepics'].includes(id)?3000:id==='flashes'?Math.max(0,Number(data.count)||0)*700:0;}
export function answerTimeMs(id:string,elapsed:number,data:any={}){return Math.max(0,elapsed-revealTimeMs(id,data));}
export function speedAdjustedScore(base:number,id:string,elapsed:number,data:any={}){const quality=Math.max(0,Math.min(1000,Number.isFinite(base)?base:0));if(['timer','reaction','bubbles'].includes(id))return Math.round(quality);const time=answerTimeMs(id,Number.isFinite(elapsed)?elapsed:30000,data);return Math.round(quality/(1+time/12000));}
