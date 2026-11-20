import {rail,floorY,hz} from './cascade.mjs';
const paper='#f6f1e3',ink='#302f27',muted='#716d5f',red='#ac412c',green='#596d52';
const lerp=(a,b,f)=>a+(b-a)*f;
function smooth(a,b,x){const u=Math.min(1,Math.max(0,(x-a)/(b-a)));return u*u*(3-2*u)}
function line(c,pts,color=ink,width=1){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function poly(c,pts,color){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();c.strokeStyle=ink;c.lineWidth=1.3;c.stroke()}
function txt(c,str,x,y,size=19,color=ink,serif=false){c.fillStyle=color;c.font=size+'px '+(serif?'"Noto Serif CJK SC", Georgia, serif':'"Noto Sans CJK SC", sans-serif');c.fillText(str,x,y)}
function circle(c,x,y,r,fill){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();c.lineWidth=1.1;c.strokeStyle=ink;c.stroke()}
function beam(c,x,y,w,h,a,color){
 c.save();c.translate(x,y);c.rotate(a);const u=w/2,v=h/2;
 poly(c,[[-u,-v],[-u+4,-v-3],[u+4,-v-3],[u,-v]],'#efe1bd');
 poly(c,[[u,-v],[u+4,-v-3],[u+4,v-3],[u,v]],'#ac8153');
 poly(c,[[-u,-v],[u,-v],[u,v],[-u,v]],color);
 for(let j=1;j<4;j++){const yy=-v+j*h/4;line(c,[[-u+2,yy],[-u+w*.38,yy+.8],[u-3,yy-.5]],'#987852',.55)}
 c.restore();
}
function timber(c,x,y,w,h,a){
 if(h>w)beam(c,x,y,h,w,a+Math.PI/2,'#d6bb90');else beam(c,x,y,w,h,a,'#deb77c')
}
function rod(c,x,y,u,v,width){beam(c,(x+u)/2,(y+v)/2,Math.hypot(x-u,y-v),width,Math.atan2(v-y,u-x),'#ddc898')}
function terrain(c){
 // Distant contour lines stay in world space as the camera follows the ball.
 for(let band=0;band<2;band++){
   const ridge=[];for(let x=-760;x<1700;x+=18)ridge.push([x,389+band*84+15*Math.sin(x*.007+band)+7*Math.cos(x*.016)]);
   line(c,ridge,band?'#d1cbb5':'#dfdaca',.85);
 }
 for(const [x,y,k] of [[-15,99,.8],[234,190,.67],[438,95,1.1],[609,235,.55],[849,159,.9],[1040,262,.7]]){
   c.save();c.translate(x,y);c.scale(k,k);c.beginPath();c.moveTo(-30,4);c.bezierCurveTo(-38,-3,-28,-10,-18,-8);
   c.bezierCurveTo(-15,-24,5,-24,13,-10);c.bezierCurveTo(32,-15,39,-1,29,4);c.closePath();c.strokeStyle='#d3cfbf';c.lineWidth=1;c.stroke();c.restore();
 }
 const hill=[];for(let x=-700;x<=1900;x+=23)hill.push([x,545+14*Math.sin(x*.006)+6*Math.sin(x*.018)]);
 line(c,hill,'#bdbaa7',1.1);line(c,[[-750,580],[1700,580]],'#635c47',1.6);
 for(let i=-25;i<65;i++){const x=i*23,y=592+(i*i%19)*1.1;line(c,[[x,y],[x+4,y-6],[x+4,y-1],[x+8,y-4]],'#c3bba2',.8)}
 for(const [x,y] of [[63,152],[208,276],[351,387],[475,412]]){
 rod(c,x,y+5,x,577,13);rod(c,x,Math.min(y+87,562),x+38,y+37,6);beam(c,x,577,40,5,0,'#b2aa95');circle(c,x,y+13,2,'#686255');
 }
 for(let i=1;i<rail.length;i++){const [x,y]=rail[i-1],[u,v]=rail[i];rod(c,x,y+4,u,v+4,8)}
}
function marble(c,x,y,a,r,isRed){
 c.save();c.translate(x,y);c.rotate(a);circle(c,0,0,r,isRed?'#c84b36':'#7d9471');
 c.save();c.beginPath();c.arc(0,0,r-1,0,2*Math.PI);c.clip();c.fillStyle=isRed?'#e1a083':'#bdc7a1';c.beginPath();c.ellipse(0,-r*.34,r*1.1,r*.23,-.44,0,Math.PI*2);c.fill();c.restore();c.restore();
}
const stages=[
 ['I','释放','红球从高处滚下，重力使它加速。'],
 ['II','飞越缺口','离开轨道后，球沿弧线飞向木塔。'],
 ['III','第一次碰撞','红球撞上立柱，支撑开始偏转。'],
 ['IV','连锁坍塌','横梁失去支撑，塔顶的绿球落下。']
];
export function drawFilm(c,sim,seconds,options={}){
 const w=c.canvas.width,h=c.canvas.height,portrait=h>w;
 c.save();c.scale(w/(portrait?720:1000),h/(portrait?1280:640));
 const W=portrait?720:1000,H=portrait?1280:640;
 c.fillStyle=paper;c.fillRect(0,0,W,H);
 const t=sim.timeAt(seconds),pose=sim.at(t),[bx,by]=pose[0];
 const flight=sim.frames.findIndex(f=>f[0][0]>525)/hz;
 const stage=t<flight?0:t<(sim.impact??2.5)?1:t<(sim.impact??2.5)+.3?2:3;
 const [num,title,caption]=stages[stage],top=portrait?240:101,bottom=portrait?892:477;
 const finish=smooth(12.6,17.8,seconds);
 const zoom=(portrait?1.58:1.16)+.35*smooth(5,9,seconds)-.65*finish;
 const cameraX=lerp(lerp(bx+82,690,smooth(6,9,seconds)),785,finish);
 const cameraY=lerp(lerp(by+55,435,smooth(5,9,seconds)),452,finish);
 c.save();c.beginPath();c.rect(0,top,W,bottom-top);c.clip();c.translate(W/2,(top+bottom)/2);c.scale(zoom,zoom);c.translate(-cameraX,-cameraY);
 terrain(c);
 if(stage===1||stage===2){const pts=[];for(let s=Math.max(flight,t-.38);s<t;s+=.018)pts.push(sim.frames[Math.round(s*hz)][0]);if(pts.length>1){c.setLineDash([2,4]);line(c,pts,red,1.4);c.setLineDash([])}}
 for(let i=1;i<pose.length;i++){const [x,y,a]=pose[i],p=sim.spec[i];if(p.r)marble(c,x,y,a,p.r,false);else timber(c,x,y,p.w,p.h,a)}
 marble(c,bx,by,pose[0][2],18,true);
 const i=Math.min(sim.frames.length-2,Math.floor(t*hz));const v=sim.frames[i+1][0].slice(0,2).map((x,j)=>(x-sim.frames[i][0][j])*hz);
 if(options.vector!==false&&stage<3&&Math.hypot(...v)>14){
 const dx=v[0]*.13,dy=v[1]*.13;c.save();c.translate(bx,by-24);c.rotate(Math.atan2(dy,dx));const len=Math.hypot(dx,dy);line(c,[[0,0],[len,0]],red,1.6);poly(c,[[len,0],[len-5,2],[len-5,-2]],red);c.restore();
 }
 if(stage===2){line(c,[[bx+13,by-10],[bx+42,by-45],[bx+86,by-45]],red,1);txt(c,'CONTACT',bx+43,by-50,10,red)}
 c.restore();
 const m=portrait?40:34;const head=portrait?68:35;
 txt(c,'MOTION NOTEBOOK     /     MECHANICS',m,head,portrait?19:15,green);
 txt(c,'一颗红球，如何推倒一座塔？',m,portrait?154:85,portrait?46:37,ink,true);
 if(portrait)txt(c,'木轨上的连锁反应     ·     Rigid-body study',m,207,22,muted);
 line(c,[[m,top],[W-m,top]],'#b9b29c');line(c,[[m,bottom],[W-m,bottom]],'#b9b29c');
 txt(c,num+'   '+title,m,bottom+(portrait?68:39),portrait?37:28,red,true);
 txt(c,caption,m,bottom+(portrait?115:73),portrait?25:20);
 const gx=portrait?m:580,gy=portrait?1183:580,gw=portrait?390:220,gh=portrait?98:63;
 if(options.trace!==false){
 line(c,[[gx,gy-gh],[gx,gy],[gx+gw,gy]],'#aaa48e');const pts=[];
 for(let j=0;j<=Math.floor(t*hz)&&j<sim.frames.length-1;j+=2){const p=sim.frames[j][0],q=sim.frames[j+1][0];
 pts.push([gx+gw*j/(hz*sim.run),gy-gh*Math.min(1,Math.hypot(q[0]-p[0],q[1]-p[1])*hz/820)])}
 if(pts.length>1)line(c,pts,red,2.4);txt(c,'球速随时间变化',gx,gy+28,17,muted);
 }
 const sx=portrait?492:828;txt(c,'模型时间',sx,gy-gh+10,17,muted);txt(c,t.toFixed(2)+' s',sx,gy-gh+48,32,ink,true);
 line(c,[[m,H-18],[W-m,H-18]],'#d5cfba',2);line(c,[[m,H-18],[m+(W-2*m)*seconds/20,H-18]],red,3);c.restore();
}

export { terrain, marble, timber };
