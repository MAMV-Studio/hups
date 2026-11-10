export type PaintPoint={x:number,y:number};
export function paintStroke(cells:Set<number>,from:PaintPoint,to:PaintPoint){const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(distance/8));for(let n=0;n<=steps;n++){const x=from.x+(to.x-from.x)*n/steps,y=from.y+(to.y-from.y)*n/steps;for(let row=0;row<16;row++)for(let col=0;col<20;col++)if(Math.hypot(col*16+8-x,row*15+7.5-y)<=31)cells.add(row*20+col);}return cells;}
export function paintCoverage(cells:Set<number>){return cells.size/320;}
export function holeAt(seed:number,slot:number,count:number){let n=(Math.imul((seed|0)^Math.imul(slot+1,2654435761),1597334677)>>>0);return n%count;}
