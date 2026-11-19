import { bounce, pendulum } from './physics.js';
const el = id => document.getElementById(id);
const canvas = el('field'), ctx = canvas.getContext('2d');
const ink='#303c35', green='#427765', muted='#788577', rust='#a44d2e';
let mode='bounce', t=0, playing=true, last=performance.now(), recorder=null;
const settings={
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
  const update=()=>{spec[4]=Number(input.value);output.value=spec[4]+' '+spec[5];t=0;last=performance.now()};
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
 el('clock').value=t.toFixed(2)+' s';
}
function sync(){el('play').textContent=playing?'Pause':'Play'}
function select(modeName){
 mode=modeName;t=0;last=performance.now();playing=true;sync();parameters();
 document.querySelectorAll('.tab').forEach(btn=>{const on=btn.dataset.mode===mode;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',on)});
 el('title').textContent=mode==='bounce'?'The bouncing ball.':'The pendulum.';
 el('intro').textContent=mode==='bounce'?'Drop a basketball onto hardwood and follow the energy through each rebound.':'Release a suspended weight and watch its angle oscillate around equilibrium.';
 el('model').textContent=mode==='bounce'?'The ball falls under gravity (9.81 m/s²). At each impact, restitution e gives the fraction of vertical speed retained. The next peak reaches e² times the previous height. The ruler measures clearance beneath the ball.':'For small angles, the pendulum follows a cosine wave. Increasing the string length increases the period. This model assumes a massless string and negligible air resistance.';
 render();
}
document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>select(btn.dataset.mode));
el('play').onclick=()=>{playing=!playing;last=performance.now();sync()};el('reset').onclick=()=>{t=0;last=performance.now();playing=false;sync();render()};
function frame(now){if(playing)t+=Math.min((now-last)/1000,.1)*Number(el('rate').value);last=now;render();requestAnimationFrame(frame)}
select('bounce');requestAnimationFrame(frame);
const rec=el('record'),status=el('status');
if(!canvas.captureStream||!window.MediaRecorder){rec.disabled=true;status.textContent='Video recording is unavailable in this browser.'}
rec.onclick=()=>{
 if(recorder?.state==='recording'){recorder.stop();return}
 let stream;
 try{
 stream=canvas.captureStream(30);const mime=['video/mp4','video/webm;codecs=vp9','video/webm'].find(type=>MediaRecorder.isTypeSupported(type));
 recorder=new MediaRecorder(stream,mime?{mimeType:mime}:{});const chunks=[],scene=mode;
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=()=>{stream.getTracks().forEach(track=>track.stop());const url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));const link=document.createElement('a');link.href=url;link.download=scene+(recorder.mimeType.includes('mp4')?'.mp4':'.webm');link.textContent='Download recording';status.replaceChildren(link);link.click();setTimeout(()=>URL.revokeObjectURL(url),300000);rec.textContent='●  Record experiment'};
 t=0;last=performance.now();playing=true;sync();render();recorder.start();rec.textContent='■  Finish recording';status.textContent='Recording from the start. Finish to download.';
 }catch(error){stream?.getTracks().forEach(track=>track.stop());status.textContent='Recording could not start in this browser.'}
};
