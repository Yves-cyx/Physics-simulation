import { simulate, duration as filmDuration } from './cascade.mjs';
import { drawFilm } from './cascade-art.mjs';
let filmRun, filmKey;
import { experiments } from './experiments.js';
import { drawExperiment } from './scene-view.js';
import { bounce, pendulum } from './physics.js';
const el = id => document.getElementById(id);
import { replayAt, duration, energyShares } from './replay.js';
const canvas = el('field'), screen = canvas.getContext('2d');
const illustration = document.createElement('canvas');
illustration.width=1000; illustration.height=640;
const ctx=illustration.getContext('2d');
let reelTime=0, caption='';
const guided=()=>mode==='bounce' && el('guide').checked;
function restart(){reelTime=0;t=0;last=performance.now();caption=replayAt(0,1,1).caption}
function resize(){
 const vertical=el('format').value==='portrait';
 canvas.width=vertical?720:1000;canvas.height=vertical?1280:640;
 canvas.classList.toggle('portrait',vertical);
}
const ink='#303c35', green='#427765', muted='#788577', rust='#a44d2e';
let mode='bounce', t=0, playing=true, last=performance.now(), recorder=null;
const settings={
 cascade:[['Release offset',0,40,5,0,'px'],['Tower height',2,4,1,3,'levels']],
 ...Object.fromEntries(Object.entries(experiments).map(([id,scene])=>[id,scene.params])),
 bounce:[['Release height',1,3,.1,2,'m'],['Restitution',.25,.9,.05,.75,'']],
 pendulum:[['String length',.5,2,.05,1.5,'m'],['Release angle',3,15,1,14,'°']]
};
function parameters(){
 el('params').replaceChildren();
 for(const spec of settings[mode]){
  const label=document.createElement('label');label.className='param';
  const row=document.createElement('span'), output=document.createElement('output'), input=document.createElement('input');
  row.append(spec[0],output); input.type='range';
  [input.min,input.max,input.step,input.value]=spec.slice(1,5);
  const update=()=>{spec[4]=Number(input.value);output.value=spec[4]+' '+spec[5];restart()};
  input.oninput=update;update();label.append(row,input);el('params').append(label);
 }
}
function line(points,color=ink,width=2,dash=[]){
 ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=width;
 points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);
}
function poly(points,fill,stroke=ink){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function oval(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,2*Math.PI);ctx.fillStyle=fill;ctx.fill()}
function label(str,x,y,size=17,color=ink,font='monospace'){ctx.fillStyle=color;ctx.font=size+'px '+font;ctx.fillText(str,x,y)}
function arrow(x,y,dx,dy){const len=Math.hypot(dx,dy);if(len<4)return;const a=Math.atan2(dy,dx);line([[x,y],[x+dx,y+dy]],green,3);ctx.save();ctx.translate(x+dx,y+dy);ctx.rotate(a);poly([[0,0],[-9,-4],[-9,4]],green,null);ctx.restore()}
function paper(){
 ctx.fillStyle='#f5f1e4';ctx.fillRect(0,0,1000,640);
 for(let x=0;x<1000;x+=24)line([[x,0],[x,640]],'#e8e6d9',.8);
 for(let y=0;y<640;y+=24)line([[0,y],[1000,y]],'#e8e6d9',.8);
 label(mode==='bounce'?'FIG. 01   /   IMPACT STUDY':'FIG. 02   /   HARMONIC MOTION',32,42,16,green);
 label('t = '+t.toFixed(2)+' s',770,42,18);
}
function platform(){
 poly([[112,495],[483,495],[591,449],[219,449]],'#ded1af');
 poly([[112,495],[483,495],[483,511],[112,511]],'#bca888');
 poly([[483,495],[591,449],[591,465],[483,511]],'#ad997a');
 for(let i=1;i<8;i++)line([[112+i*47,494],[219+i*47,449]],'#b5a487',1);
}
function ball(x,y,r){
 ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);
 const paint=ctx.createRadialGradient(-r*.4,-r*.5,2,0,0,r*1.2);paint.addColorStop(0,'#ffad67');paint.addColorStop(.75,'#d8733d');paint.addColorStop(1,'#a4472b');ctx.fillStyle=paint;ctx.fill();ctx.clip();
 for(const bend of [-1,1]){ctx.beginPath();ctx.moveTo(-r,bend*r*.75);ctx.bezierCurveTo(-r*.15,bend*r*.94,r*.02,bend*r*.1,r,bend*r*.28);ctx.strokeStyle='#743b27';ctx.lineWidth=2.4;ctx.stroke()}
 line([[-r,-6],[r,6]],'#743b27',2);ctx.beginPath();ctx.ellipse(0,0,r*.35,r*1.15,-.2,0,Math.PI*2);ctx.stroke();ctx.restore();
 ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.strokeStyle=ink;ctx.lineWidth=2.6;ctx.stroke();
}
function graph(sample,max,centered,unit){
 const x=656,y=318,w=296,h=119;
 label((centered?'Angle':'Height')+' / '+unit,x,y-18,16,muted);
 const bottom=y+h;for(let i=0;i<4;i++)line([[x,y+h*i/3],[x+w,y+h*i/3]],'#d3d7c8',1);
 const base=centered?y+h/2:bottom;
 line([[x,y],[x,bottom],[x+w,bottom]],muted,1.5);
 if(centered)line([[x,base],[x+w,base]],muted,1,[4,4]);
 const start=Math.max(0,t-3),span=3,end=Math.min(t-start,span);
 const pts=[];for(let i=0;i<=150;i++){const dt=i*end/150;pts.push([x+w*dt/span,base-sample(start+dt)/max*(centered?h*.46:h)])}
 line(pts,green,3);oval(...pts.at(-1),4,4,green);label(start.toFixed(1)+' s',x,bottom+23,15,muted);label((start+span).toFixed(1)+' s',x+w-48,bottom+23,15,muted);
}
function render(){
 if(mode==='cascade'){
   const [release,rows]=settings.cascade.map(s=>s[4]), key=release+'-'+rows;
   if(key!==filmKey){el('buildTower').href='./tower.html?from=film&posts=656,737&base=656,737&release='+release+'&rows='+rows;filmRun=simulate(window.Matter,release,rows);filmKey=key}
   drawFilm(screen,filmRun,reelTime,{vector:el('vector').checked,trace:el('trace').checked});
   el('clock').value=reelTime.toFixed(2)+' s';return;
 }
 if(experiments[mode]){
   const [a,b]=settings[mode].map(s=>s[4]);
   drawExperiment(screen,mode,t,a,b,el('vector').checked,el('trace').checked);
   el('clock').value=t.toFixed(2)+' s';return;
 }
 paper();platform();const [a,b]=settings[mode].map(s=>s[4]);
 if(mode==='bounce'){
 const s=bounce(t,a,b),floor=471,scale=109,r=27,x=377,y=floor-r-s.h*scale;
 poly([[167,114],[180,109],[180,466],[167,471]],'#d5c7a5');poly([[167,114],[180,109],[200,109],[187,114]],'#eee4c8');
 poly([[160,115],[187,115],[187,471],[160,471]],'#e6d9b9');
 for(let i=0;i<=30;i++){let yy=floor-i*scale/10;line([[187-(i%5?7:16),yy],[187,yy]],ink,1);if(i%10===0)label(i/10+' m',109,yy+5,16)}
 line([[192,floor-a*scale],[440,floor-a*scale]],'#ad7756',1,[5,6]);
 oval(x,floor+1,Math.max(12,30-4*s.h),5,'#998d756f');ball(x,y,r);
 if(el('vector').checked)arrow(x+44,y,0,-s.v*10);
 label('Vertical speed',656,131,20,muted,'Georgia');label(Math.abs(s.v).toFixed(2)+' m/s',656,188,45,ink,'Georgia');label('Impacts   '+s.count,656,226,17,rust);
 if(el('trace').checked)graph(time=>bounce(time,a,b).h,a,false,'m');
 label('h₁ = e² h₀',45,574,36,ink,'Georgia');label('First rebound  '+(a*b*b).toFixed(2)+' m',45,609,17,green);
 }else{
 const s=pendulum(t,a,b),px=340,py=122,L=a*145,x=px+L*Math.sin(s.angle),y=py+L*Math.cos(s.angle);
 poly([[211,469],[226,468],[226,99],[211,103]],'#c9b790');poly([[211,103],[226,96],[369,96],[355,103]],'#e8d7af');poly([[211,103],[355,103],[355,121],[211,121]],'#d6c29a');
 line([[px,py],[px,py+L+32]],muted,1,[5,6]);line([[px,py],[x,y]],ink,3);oval(px,py,5,5,ink);oval(x,y,23,23,ink);oval(x-1,y-2,20,20,'#63927d');oval(x-7,y-9,5,4,'#aad0b5');
 if(el('vector').checked)arrow(x,y+28,60*s.v*Math.cos(s.angle),-60*s.v*Math.sin(s.angle));
 label('Angle from vertical',656,131,20,muted,'Georgia');label((s.angle*180/Math.PI).toFixed(1)+'°',656,188,45,ink,'Georgia');label('Period   '+(2*Math.PI*Math.sqrt(a/9.81)).toFixed(2)+' s',656,226,17,rust);
 if(el('trace').checked)graph(time=>pendulum(time,a,b).angle*180/Math.PI,b,true,'deg');
 label('T ≈ 2π √(L/g)',45,574,36,ink,'Georgia');label('Small-angle pendulum',45,609,17,green);
 }
 compose(a,b);
 el('clock').value=(guided()?reelTime:t).toFixed(2)+' s';
}
function print(text,x,y,size,color=ink,font='Georgia'){
 screen.fillStyle=color;screen.font=size+'px '+font;screen.fillText(text,x,y);
}
function energy(x,y,width,height,e){
 const shares=energyShares(bounce(t,height,e),height);
 const colors=['#638e78','#d98046','#a8a79b'];
 let left=x;
 shares.forEach((part,i)=>{screen.fillStyle=colors[i];screen.fillRect(left,y,width*part,12);left+=width*part});
 const names=['Height','Motion','Dissipated'];
 shares.forEach((part,i)=>print(names[i]+' '+Math.round(100*part)+'%',x+i*width/3,y+39,width<430?13:20,ink,'monospace'));
}
function compose(a,b){
 if(canvas.width===1000){
   screen.drawImage(illustration,0,0);
   if(mode==='bounce')energy(625,540,350,a,b);
   if(guided())print(caption,44,84,22,green);
   return;
 }
 screen.fillStyle='#f5f1e4';screen.fillRect(0,0,720,1280);
 print('MOTION NOTEBOOK',48,64,22,green,'monospace');
 print(mode==='bounce'?'The bouncing ball.':'The pendulum.',46,161,65);
 print(guided()?caption:mode==='bounce'?'A study of successive impacts.':'A study of periodic motion.',49,218,29,green);
 screen.drawImage(illustration,70,86,550,444,6,265,706,570);
 const isBall=mode==='bounce';
 const measurement=isBall?bounce(t,a,b).h.toFixed(2)+' m':(pendulum(t,a,b).angle*180/Math.PI).toFixed(1)+'°';
 print(measurement,48,927,52);
 print(isBall?'Clearance':'Angle',50,963,22,muted,'monospace');
 if(el('trace').checked)screen.drawImage(illustration,647,279,320,196,357,835,320,196);
 if(isBall){
   print('Energy from the original drop',48,1081,29);
   energy(48,1104,624,a,b);
   print('First rebound  '+(a*b*b).toFixed(2)+' m',48,1215,27,green,'monospace');
 }else{
   print('Period of one swing',48,1090,29);
   print((2*Math.PI*Math.sqrt(a/9.81)).toFixed(2)+' s',48,1158,49,green);
 }
}
function sync(){el('play').textContent=playing?'Pause':'Play'}
function select(modeName){
 el("towerEntry").hidden=modeName!=="cascade";
 mode=modeName;restart();el('guideLabel').hidden=mode!=='bounce';el('rate').disabled=guided();playing=true;sync();parameters();
 document.querySelectorAll('.tab').forEach(btn=>{const on=btn.dataset.mode===mode;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',on)});
 if(mode==='cascade'){
   el('title').textContent='木轨连锁反应';
   el('intro').textContent='一颗红球沿轨道滚下，越过缺口，击中木塔。改变释放位置或层数，再看它怎样倒下。';
   el('model').textContent='红球、木梁和塔顶球体按二维刚体求解，每秒计算 120 步。镜头在第一次碰撞前后放慢；球速曲线使用物理时间。';
   el('rate').disabled=true;render();return;
 }
 if(experiments[mode]){
   for(const key of ['title','intro','model'])el(key).textContent=experiments[mode][key];
   render();return;
 }
 el('title').textContent=mode==='bounce'?'The bouncing ball.':'The pendulum.';
 el('intro').textContent=mode==='bounce'?'Drop a basketball onto hardwood and follow the energy through each rebound.':'Release a suspended weight and watch its angle oscillate around equilibrium.';
 el('model').textContent=mode==='bounce'?'The ball falls under gravity (9.81 m/s²). At each impact, restitution e gives the fraction of vertical speed retained. The next peak reaches e² times the previous height. The ruler measures clearance beneath the ball.':'For small angles, the pendulum follows a cosine wave. Increasing the string length increases the period. This model assumes a massless string and negligible air resistance.';
 render();
}
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>select(btn.dataset.mode));
el('play').onclick=()=>{if((guided() || mode==="cascade") && reelTime>= (mode==="cascade"?filmDuration:duration))restart();playing=!playing;last=performance.now();sync()};el('reset').onclick=()=>{restart();playing=false;sync();render()};
function frame(now){
 const elapsed=Math.max(0,(now-last)/1000);last=now;
 if(playing && mode==='cascade'){
   reelTime=Math.min(filmDuration,reelTime+elapsed);
   if(reelTime===filmDuration){playing=false;sync();render();if(recorder?.state==='recording')recorder.stop()}
 }else if(playing && guided()){
   reelTime=Math.min(duration,reelTime+elapsed);
   const sample=replayAt(reelTime,...settings.bounce.map(s=>s[4]));
   t=sample.time;caption=sample.caption;
   if(reelTime===duration){
     playing=false;sync();render();
     if(recorder?.state==='recording')recorder.stop();
   }
 }else if(playing)t+=Math.min(elapsed,.1)*Number(el('rate').value);
 render();requestAnimationFrame(frame);
}
el('format').onchange=()=>{resize();render()};
el('guide').onchange=()=>select(mode);
resize();select('cascade');requestAnimationFrame(frame);
const rec=el('record'),status=el('status');
if(!canvas.captureStream||!window.MediaRecorder){rec.disabled=true;status.textContent='Video recording is unavailable in this browser.'}
rec.onclick=()=>{
 if(recorder?.state==='recording'){recorder.stop();return}
 let stream;
 try{
 stream=canvas.captureStream(30);const mime=['video/mp4','video/webm;codecs=vp9','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
 recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});const chunks=[],scene=mode;
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=()=>{lockControls(false);stream.getTracks().forEach(track=>track.stop());const url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));const link=document.createElement('a');link.href=url;link.download=scene+(recorder.mimeType.includes('mp4')?'.mp4':'.webm');link.textContent='Download recording';status.replaceChildren(link);link.click();setTimeout(()=>URL.revokeObjectURL(url),300000);rec.textContent='●  Record experiment'};
 restart();playing=true;sync();render();recorder.start();lockControls(true);rec.textContent='■  Finish recording';status.textContent=mode==='cascade'?'Recording the 20-second film.':guided()?'Recording the 12-second replay. Download starts automatically.':'Recording from the start. Finish to download.';
 }catch(error){stream?.getTracks().forEach(track=>track.stop());status.textContent='Recording could not start in this browser.'}
};

function lockControls(locked){
 document.querySelectorAll('.tab, #params input, #guide, #format, #reset, #play, #rate').forEach(control=>control.disabled=locked);
 el('rate').disabled=locked||guided()||mode==='cascade';
}
