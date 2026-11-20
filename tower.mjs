import {simulate,hz} from './cascade.mjs';
import {terrain,marble,timber} from './cascade-art.mjs';
const el=id=>document.getElementById(id), canvas=el('world'), ctx=canvas.getContext('2d');
const original=[678,737], limit=(x,min,max)=>Math.max(min,Math.min(max,x));
function readPair(value){
 const pair=(value||'').split(',').map(Number);
 return pair.length===2 && pair.every(x=>Number.isInteger(x)&&x>=640&&x<=753)&&pair[1]-pair[0]>=20?pair:original.slice();
}
const query=new URLSearchParams(location.search);
let posts=readPair(query.get('posts')), basePosts=readPair(query.get('base'));
const rows=limit(Math.round(Number(query.get('rows'))||3),2,4);
const release=limit(Math.round(Number(query.get('release'))||0),0,40);
if(query.get('from')==='film')el('task').textContent='这是影片里的同一座木塔。挪动一根底柱，看看两颗绿球的落点会怎样变化。';
el('scope').textContent=location.hostname==='motion-notebook-yc6296.yixuan0723.chatgpt.site'?'此部署目前仅限本人访问。复制链接会保存两种摆法，访问权限沿用本站设置。':'链接保存两种摆法。对方需要能打开当前网站。';
const solve=pair=>simulate(window.Matter,release,rows,pair);
let baseline=solve(basePosts), current=null, stage='edit', frame=0, running=false, drag=null,last=0,carry=0;
const worldLeft=475,worldTop=rows===4?222:292,zoom=rows===4?1.2:1.45;
function ensure(){if(!current)current=solve(posts);return current}
function grade(sim,time){
 return sim.landings.filter(x=>x!==null && x<=time).length;
}
function body(c,s,p,i,outline){
 const [x,y,a]=p;
 if(outline){c.save();c.translate(x,y);c.rotate(a);c.strokeStyle='#087b85';c.lineWidth=1.8;c.setLineDash([4,3]);c.beginPath();
 if(s.r)c.arc(0,0,s.r+1,0,Math.PI*2);else c.rect(-s.w/2,-s.h/2,s.w,s.h);c.stroke();c.restore()}
 else if(s.r)marble(c,x,y,a,s.r,i===0);else timber(c,x,y,s.w,s.h,a);
}
function reviewEvent(sim){
 const offset=sim.impact!==null&&baseline.impact!==null?baseline.impact-sim.impact:0;
 const candidates=[];
 for(const [model,shift,name] of [[baseline,offset,'基准'],[sim,0,'当前']]){
   model.landings.forEach(time=>{
     if(time===null)return;
     const frameIndex=Math.ceil((time-shift)*hz-1e-7);
     const aligned=frameIndex/hz+offset;
     if(frameIndex>=0&&frameIndex<=840&&aligned>=0&&aligned<=baseline.run)candidates.push({frameIndex,name,aligned});
   });
 }
 candidates.sort((a,b)=>a.frameIndex-b.frameIndex);
 const different=candidates.find(x=>grade(sim,x.frameIndex/hz)!==grade(baseline,x.aligned));
 return different||candidates[0]||{frameIndex:840,name:'',aligned:7};
}
function draw(){
 ctx.fillStyle='#f6f1e3';ctx.fillRect(0,0,880,450);
 ctx.save();ctx.scale(zoom,zoom);ctx.translate(-worldLeft,-worldTop);terrain(ctx);
 const sim=current||baseline,time=frame/hz;
 const editing=stage==='edit',pose=editing?baseline.frames[0].map(p=>p.slice()):sim.frames[frame];
 if(editing){pose[1][0]=posts[0];pose[2][0]=posts[1]}
 pose.forEach((p,i)=>body(ctx,sim.spec[i],p,i,false));
 let baseTime=time;
 if(!editing && baseline.impact!==null && sim.impact!==null)baseTime+=baseline.impact-sim.impact;
 if(el('ghost').checked && baseTime>=0 && baseTime<=baseline.run){
  baseline.at(baseTime).forEach((p,i)=>body(ctx,baseline.spec[i],p,i,true));
 }
 if(drag && editing){ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle='#8d695a';ctx.strokeRect(drag.start-9,516,18,64);ctx.restore()}
 if(editing){posts.forEach(x=>{ctx.strokeStyle='#aa4633';ctx.lineWidth=2;ctx.strokeRect(x-11,514,22,66)})}
 ctx.restore();
 ctx.font='19px sans-serif';ctx.fillStyle='#424a40';ctx.fillText(editing?'搭建 · 拖动红框内的底柱':time<(sim.impact??7)?'释放 → 飞向木塔':'碰撞 → 支撑变化',20,34);
 // The overview keeps the release visible while the main camera shows the tower.
 ctx.save();ctx.translate(15,62);ctx.fillStyle='#f2eddc';ctx.fillRect(0,0,242,148);ctx.beginPath();ctx.rect(0,0,242,148);ctx.clip();ctx.scale(.235,.235);terrain(ctx);pose.forEach((p,i)=>body(ctx,sim.spec[i],p,i,false));ctx.restore();
 el('timeline').value=frame;el('readout').value=time.toFixed(3)+' s';
 el('run').textContent=running?'暂停':(stage==='edit'||frame===840?'运行实验':'继续播放');
 el('basis').textContent='实色为当前方案，青色虚线为基准。基准柱位 '+basePosts.join(' / ')+(editing?'':'，按首次碰撞对齐');
 el('result').textContent=editing?'观察目标：两颗绿球是否触地。':'已触地绿球：当前 '+grade(sim,time)+'/2，基准 '+grade(baseline,limit(baseTime,0,7))+'/2'+(frame===840?'（观察结束）':'');
 const jump=el('eventJump');jump.hidden=editing;
 if(!editing){const event=reviewEvent(sim);jump.textContent=event.name?'看'+event.name+'绿球触地的瞬间':'对比最终状态'}
 el('hit').disabled=!editing&&sim.impact===null;
}
function controls(){
 el('left').max=posts[1]-20;el('right').min=posts[0]+20;
 ['left','right'].forEach((id,i)=>{el(id).value=posts[i];el(id+'Val').value=(posts[i]-original[i])+' px'});
}
function editing(){running=false;stage='edit';frame=0;carry=0}
function move(i,x){editing();posts[i]=limit(Math.round(x),i?posts[0]+20:640,i?753:posts[1]-20);current=null;controls();draw()}
function seek(f){ensure();running=false;stage='review';frame=limit(Math.round(f),0,840);carry=0;draw()}
function point(e){const box=canvas.getBoundingClientRect();return [(e.clientX-box.left)*880/box.width/zoom+worldLeft,(e.clientY-box.top)*450/box.height/zoom+worldTop]}
canvas.onpointerdown=e=>{
 if(drag)return;
 const [x,y]=point(e),editingNow=stage==='edit';
 const pose=editingNow?posts.map(px=>[px,548,0]):ensure().frames[frame].slice(1,3);
 // Distance to each oriented post, including at least 44 CSS pixels of touch width.
 const pad=Math.max(0,22*880/canvas.getBoundingClientRect().width/zoom-9);
 const distances=pose.map(([px,py,a])=>{
   const dx=x-px,dy=y-py,co=Math.cos(a),si=Math.sin(a);
   return Math.hypot(Math.max(0,Math.abs(dx*co+dy*si)-9),Math.max(0,Math.abs(dy*co-dx*si)-32));
 });
 const i=distances[0]<=distances[1]?0:1;
 if(distances[i]>Math.max(5,pad))return;
 drag={id:e.pointerId,i,start:posts[i],offset:posts[i]-x};
 editing();canvas.setPointerCapture(e.pointerId);el('note').textContent='已选中'+(i?'右':'左')+'柱，左右拖动可调整起始位置。';draw();
};
canvas.onpointermove=e=>{if(drag?.id===e.pointerId)move(drag.i,point(e)[0]+drag.offset)};
canvas.onlostpointercapture=()=>{drag=null;draw()};
el('eventJump').onclick=()=>{const event=reviewEvent(ensure());el('ghost').checked=true;seek(event.frameIndex)};
['left','right'].forEach((id,i)=>el(id).oninput=e=>move(i,Number(e.target.value)));
el('edit').onclick=()=>{editing();draw()};
el('run').onclick=()=>{ensure();if(frame===840)frame=0;stage='review';running=!running;last=performance.now();carry=0;draw()};
el('hit').onclick=()=>{const impact=ensure().impact;if(impact!==null)seek(impact*hz)};
el('next').onclick=()=>seek(frame+1);el('back').onclick=()=>seek(frame-1);
el('timeline').oninput=e=>seek(Number(e.target.value));el('ghost').onchange=draw;
el('pin').onclick=()=>{baseline=ensure();basePosts=posts.slice();el('note').textContent='已保存基准，可以改动一根柱子。';draw()};
el('share').onclick=async()=>{const url=new URL(location.href);url.searchParams.set('posts',posts.join(','));url.searchParams.set('base',basePosts.join(','));try{await navigator.clipboard.writeText(url.href);el('note').textContent='已复制当前方案和基准方案的链接。'}catch{const field=el('shareurl');field.hidden=false;field.value=url.href;field.select();el('note').textContent='请复制上方链接。'}};
function tick(now){if(running){carry+=Math.max(0,now-last)*hz/1000;const steps=Math.floor(carry);carry-=steps;frame=Math.min(840,frame+steps);if(frame===840)running=false;if(steps)draw()}last=now;requestAnimationFrame(tick)}
controls();draw();requestAnimationFrame(tick);
