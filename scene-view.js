import {binary,carts,race,racers,experiments} from './experiments.js';
const colors=['#ab5937','#377669','#546ba1'],ink='#2b3934',paper='#f5f1e4';
function stroke(c,pts,color=ink,width=2){
 c.beginPath();for(const [i,p] of pts.entries())i?c.lineTo(...p):c.moveTo(...p);c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function dot(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=color;c.fill()}
function words(c,s,x,y,size=18,color=ink){c.fillStyle=color;c.font=size+'px monospace';c.fillText(s,x,y)}
function arrow(c,x,y,dx,dy){
 if(Math.hypot(dx,dy)<2)return;
 c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));const d=Math.hypot(dx,dy);
 stroke(c,[[0,0],[d,0],[d-6,-3]],'#52846e');stroke(c,[[d,0],[d-6,3]],'#52846e');c.restore();
}
function orbitView(c,t,r,e,vec){
 const scale=155,xy=p=>[320+p.x*scale,210-p.y*scale];
 const tracks=[[],[]];
 for(let i=0;i<=100;i++)binary(8*i/100,r,e).forEach((p,j)=>tracks[j].push(xy(p)));
 tracks.forEach((pts,j)=>stroke(c,pts,colors[j],1));
 const bodies=binary(t,r,e);stroke(c,bodies.map(xy),'#b2b4a5',1);
 bodies.forEach((p,j)=>{const [x,y]=xy(p);
 const radius=13*Math.cbrt(j?r:1);dot(c,x,y,radius+6,colors[j]+'22');dot(c,x,y,radius,colors[j]);words(c,j?'B':'A',x-6,y+5,16,'white');
 if(vec)arrow(c,x,y,42*p.vx,-42*p.vy);
 });
 stroke(c,[[314,210],[326,210]]);stroke(c,[[320,204],[320,216]]);
 return ['Mass centre  +','Separation  '+Math.hypot(bodies[0].x-bodies[1].x,bodies[0].y-bodies[1].y).toFixed(2)];
}
function spring(c,left,right,y){
 const pts=[[left,y],[left+9,y]];
 for(let i=0;i<=24;i++)pts.push([left+11+(right-left-22)*i/24,y+(i%2?9:-9)]);
 pts.push([right-9,y],[right,y]);stroke(c,pts,'#596a5d',2);
}
function cartView(c,t,k,a,vec){
 const pair=carts(t,k,a),xx=pair.map((p,j)=>200+230*j+p.x*155);
 stroke(c,[[31,150],[31,262],[607,262],[607,150]],ink,5);
 spring(c,31,xx[0]-34,223);spring(c,xx[0]+34,xx[1]-34,223);spring(c,xx[1]+34,607,223);
 xx.forEach((x,j)=>{c.fillStyle=colors[j];c.fillRect(x-34,201,68,43);
 dot(c,x-21,251,9,ink);dot(c,x+21,251,9,ink);words(c,j?'B':'A',x-6,229,20,'white');
 if(vec)arrow(c,x,182,55*pair[j].v,0)});
 return pair.map((p,j)=>(j?'Cart B   ':'Cart A   ')+p.x.toFixed(3)+' m');
}
function raceView(c,t,degrees,length,vec){
 const theta=degrees*Math.PI/180,states=race(t,degrees,length);
 const dx=410,dy=dx*Math.tan(theta),radius=14;
 states.forEach((s,j)=>{const y=40+87*j,x=105;
 stroke(c,[[x,y],[x+dx,y+dy]],'#797d6d',3);
 const d=s.distance/length, cx=x+dx*d+radius*Math.sin(theta), cy=y+dy*d-radius*Math.cos(theta);
 dot(c,cx,cy,radius,colors[j]);if(j===2)dot(c,cx,cy,radius-4,paper);
 const rotation=s.distance/.12;
 stroke(c,[[cx,cy],[cx+radius*Math.sin(rotation),cy-radius*Math.cos(rotation)]],j===2?ink:'white',2);
 if(vec&&!s.done)arrow(c,cx,cy-18,12*s.speed*Math.cos(theta),12*s.speed*Math.sin(theta));
 words(c,racers[j],8,y+8,16,colors[j]);words(c,s.done?s.finish.toFixed(2)+' s':'│',x+dx+13,y+dy,16,colors[j]);
 });
 return ['Arrival order   Sphere → Cylinder → Hoop','Finish times appear at the end of each lane.'];
}
const views={binary:orbitView,carts:cartView,race:raceView};
function samples(mode,t,a,b){
 if(mode==='binary'){const [p,q]=binary(t,a,b);return [Math.hypot(p.x-q.x,p.y-q.y)]}
 if(mode==='carts')return carts(t,a,b).map(p=>p.x);
 return race(t,a,b).map(s=>s.distance);
}
function chart(c,mode,t,a,b,w,h){
 const range=mode==='binary'?1+b:mode==='carts'?a:b;
 const zero=mode==='carts'?h/2:h;
 const end=mode==='race'?Math.min(t,race(0,a,b)[2].finish):t;
 const span=mode==='race'?race(0,a,b)[2].finish:8,start=Math.max(0,end-span);
 words(c,experiments[mode].chart,0,-14,17);
 stroke(c,[[0,0],[0,h],[w,h]],'#abb1a4',1);stroke(c,[[0,zero],[w,zero]],'#abb1a4',1);
 const pts=[];for(let i=0;i<=90;i++){const tau=start+(end-start)*i/90;
 samples(mode,tau,a,b).forEach((v,j)=>(pts[j]??=[]).push([w*(tau-start)/span,zero-v/range*zero]))}
 pts.forEach((p,j)=>stroke(c,p,colors[j],2));words(c,start.toFixed(1)+' s',0,h+22,15);words(c,(start+span).toFixed(1)+' s',w-58,h+22,15);
}
export function drawExperiment(c,mode,t,a,b,vec,trace){
 const {width:w,height:h}=c.canvas,vertical=h>w;
 c.fillStyle=paper;c.fillRect(0,0,w,h);
 for(let x=0;x<w;x+=28)stroke(c,[[x,0],[x,h]],'#e9e6da',.8);
 for(let y=0;y<h;y+=28)stroke(c,[[0,y],[w,y]],'#e9e6da',.8);
 words(c,'MOTION NOTEBOOK',38,52,20,'#507061');words(c,t.toFixed(2)+' s',w-149,52,20);
 c.fillStyle=ink;c.font=(vertical?57:50)+'px Georgia';c.fillText(experiments[mode].title,35,140);
 c.save();c.translate(vertical?12:0,vertical?202:146);const scale=vertical?1.08:(mode==='race'?.89:1);c.scale(scale,scale);
 const notes=views[mode](c,t,a,b,vec);c.restore();
 notes.forEach((line,j)=>words(c,line,40,(vertical?745:548)+34*j,vertical?22:18));
 if(trace){c.save();c.translate(vertical?45:665,vertical?947:235);chart(c,mode,t,a,b,vertical?624:288,vertical?190:166);c.restore()}
}
