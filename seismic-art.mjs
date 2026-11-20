import {duration, floors, fps, height} from './seismic-model.mjs';

const paper='#f5f0e2', ink='#293d38', grey='#647069', fine='#aaa99a';
const red='#a5412e', teal='#226a61', cream='#f8f4e9', mono='"DejaVu Sans Mono", monospace';
const serif='"Noto Serif CJK SC","Songti SC",Georgia,serif', sans='"Noto Sans CJK SC","Microsoft YaHei",sans-serif';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function smooth(a,b,x){const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u);}
function path(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function polygon(c,points,fill,edge=ink,width=1){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();
  if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}
}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function label(c,text,x,y,size,color=ink,font=sans,align='left'){
  c.font=size+'px '+font;c.textAlign=align;c.fillStyle=color;c.fillText(text,x,y);c.textAlign='left';
}
function dot(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=color;c.fill();}
function clipBox(c,x,y,w,h){c.beginPath();c.rect(x,y,w,h);c.clip();}
function prism(c,x,y,w,h,dx,dy,colors){
  polygon(c,[[x,y],[x+dx,y+dy],[x+w+dx,y+dy],[x+w,y]],colors[0]);
  polygon(c,[[x+w,y],[x+w+dx,y+dy],[x+w+dx,y+dy+h],[x+w,y+h]],colors[2]);
  polygon(c,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],colors[1]);
}
function skyline(c){
  for(let b=0;b<3;b++){
    const pts=[];
    for(let x=-100;x<=840;x+=8)pts.push([x,253+b*28-18*Math.cos(x*.012+b)-9*Math.sin(x*.033+b*.5)-5*Math.cos(x*.064)]);
    path(c,pts,['#d3d1be','#cacbb7','#bdc1b1'][b],1.2);
  }
  for(let j=-3;j<52;j++){
    const x=j*17, h=8+Math.abs(Math.sin(j*4.7)*38), y=389;
    polygon(c,[[x,y],[x,y-h],[x+12,y-h],[x+12,y]],'#e5e3d5','#c6c8b7',.7);
  }
}
function strata(c){
  const colors=['#d4c5a6','#c9b594','#b4aa8b','#948f78'];
  let top=431;
  for(let j=0;j<4;j++){
    const r=[];
    for(let x=-260;x<=960;x+=12)r.push([x,top+(j?Math.sin(x*.022+j)*3+Math.sin(x*.05)*1.4:0)]);
    polygon(c,[...r,[960,552],[-260,552]],colors[j],'#8c8974',.7);
    top+=[14,19,23,19][j];
    for(let k=-10;k<100;k++){const x=k*11+(j%2)*6;
      const y=top-7+2*Math.sin(k*13.5+j);path(c,[[x,y],[x+3+j,y-2]],'#9d947c',.7);}
  }
  path(c,[[-240,431],[960,431]],'#655e4d',1.1);
}
function pad(c,x,y,off,w=23,h=11){
  for(let i=0;i<6;i++){
    const top=off*(1-(i+1)/6),btm=off*(1-i/6);
    polygon(c,[[x+top-w/2,y-i*h/6],[x+btm-w/2,y-(i-1)*h/6],
      [x+btm+w/2,y-(i-1)*h/6],[x+top+w/2,y-i*h/6]],i%2?'#d7bf87':'#385a53','#43574c',.55);
  }
}
function tower(c,f,key,cx,gain,groundOffset){
  const b=f[key], iso=key==='isolated', w=104, dy=18.2, bottom=407;
  const deck=['#eee4c7','#d5c299','#8e8b72'];
  const accent=iso?teal:red;
  const centers=b.u.map(v=>cx+groundOffset+v*gain);
  const wall=iso?['#c0d3c4','#b7cbbb','#ccdbc9']:['#dbc9b3','#d6c2aa','#e1d2be'];
  const shadow=iso?'#8fa99a':'#b29d86';
  prism(c,cx+groundOffset-w*.66,424,w*1.32,12,13,-6,['#d8d2b9','#b7af97','#918e76']);
  if(iso){
    for(const dx of [-38,0,38])pad(c,cx+groundOffset+dx,421,b.u[0]*gain);
  }else prism(c,cx+groundOffset-w*.52,412,w*1.04,12,13,-6,['#dfd6c2','#bfb7a2','#979480']);
  for(let i=0;i<floors;i++){
    const l=centers[i]-w/2,u=centers[i+1]-w/2,y=bottom-i*dy,yt=y-dy+2;
    polygon(c,[[l,y],[l+w,y],[u+w,yt],[u,yt]],wall[i%3],ink,.9);
    polygon(c,[[l+w,y],[l+w+17,y-8],[u+w+17,yt-8],[u+w,yt]],shadow,ink,.85);
    for(let j=0;j<5;j++){
      const offset=4+j*20, wid=15;
      polygon(c,[[l+offset,y-3],[l+offset+wid,y-3],[u+offset+wid,yt+3],[u+offset,yt+3]],
       (i*17+j*7)%11===0?'#efe4b9':(i+j)%4===0?'#82948a':'#a0b1a3','#68786d',.55);
      path(c,[[l+offset+wid*.5,y-3],[u+offset+wid*.5,yt+3]],'#d5d6bf',.7);
    }
    for(const dx of [1,42,82])path(c,[[l+dx,y-2],[u+dx,yt]],'#485e53',2.25);
    const z=i%4;
    for(const dx of [2,62]){
      const br=z%2?[[l+dx+38,y-1],[u+dx,yt+1]]:[[l+dx,y-1],[u+dx+38,yt+1]];
      path(c,br,'#f0ead7',3.4);path(c,br,'#6e7865',1.3);
    }
    path(c,[[l+w+7,y-4],[u+w+7,yt-3]],'#626f60',1.2);
    prism(c,l-2,y-1,w+4,3.3,17,-8,deck);
  }
  const x=centers[floors],y=bottom-dy*floors;
  prism(c,x-w/2-3,y,w+6,4,17,-8,deck);
  prism(c,x-30,y-9,43,8,9,-5,['#ece4c9','#ceccb5','#949e8e']);
  path(c,[[x+28,y-2],[x+28,y-18]],ink,1.4);dot(c,x+28,y-19,2,accent);
  c.setLineDash([3,6]);path(c,[[cx-63,77],[cx-63,407]],'#7f877a',.85);c.setLineDash([]);
}
function mainScene(c,sim,t,x,y,w,h,focus,track=true){
  const f=sim.at(t);c.save();clipBox(c,x,y,w,h);c.translate(x,y);c.scale(w/720,h/516);
  rect(c,0,0,720,516,'#eae9d9');
  // Contours, foundations and buildings share a ground-frame origin. Upper air is paper toned.
  const wash=c.createLinearGradient(0,0,0,430);wash.addColorStop(0,'#f4f1e7');wash.addColorStop(1,'#dedfca');
  c.fillStyle=wash;c.fillRect(0,0,720,431);skyline(c);
  const lens=track?.56*smooth(10.6,12.6,t)*(1-smooth(15.3,17.3,t)):0;
  c.save();c.translate(360,258);c.scale(1+lens,1+lens);c.translate(-360-125*lens,-258-134*lens);
  const gain=Math.min(220,73/Math.max(.06,sim.peaks.roof+sim.peaks.ground));
  const go=f.xg*gain;
  c.save();c.translate(go,0);strata(c);c.restore();
  tower(c,f,'fixed',192,gain,go);tower(c,f,'isolated',506,gain,go);
  if(focus){
    const story=f.fixed.story, a=f.fixed.u[story]*gain+go, py=407-story*18.2+8;
    path(c,[[192+a-53,py],[192+a-70,py],[192+a-78,py+8]],red,1.7);dot(c,192+a-53,py,2.6,red);
  }
  c.restore();
  // Labels stay in the matte when the virtual camera moves.
  for(const [tx,title,col] of [[22,'A   固定基础',red],[405,'B   基底隔震',teal]]){
    rect(c,tx,15,134,30,'#f5f0e2');rect(c,tx,15,3,30,col);label(c,title,tx+10,37,18,col);
  }
  if(lens>.24){
    const px=360+(506+go+f.isolated.u[0]*gain-360-125*lens)*(1+lens);
    const py=258+(418-258-134*lens)*(1+lens);
    path(c,[[px+25,py],[px+63,py-30],[px+110,py-30]],teal,1.35);
    rect(c,px+59,py-59,91,27,cream);label(c,'隔震支座',px+66,py-39,16,teal);
  }
  rect(c,0,485,720,31,'#434b40');
  label(c,'水平位移放大 ×'+(gain/(18.2/height)).toFixed(0)+'    ·    两塔同尺度',19,506,15,'#f3f0df');
  label(c,'t  '+t.toFixed(2)+' s',700,506,15,'#f3f0df',mono,'right');
  c.restore();
}

function stage(t){
  if(t<4.2)return ['地面开始运动','同一段地震动，从两座相同的楼底输入。'];
  if(t<10.8)return ['楼层错开','看左楼的外柱：相邻楼层开始水平错动。'];
  if(t<16.3)return ['支座发生剪切','右楼底部的叠层支座随往复剪切而耗能。'];
  if(t<21)return ['追踪楼顶','地面与两侧楼顶的加速度峰值出现在不同时刻。'];
  return ['震后余振','地面已停，两座楼仍按各自的节奏振动。'];
}
function graph(c,sim,t,x,y,w,h){
  label(c,'楼顶绝对加速度',x,y,19,ink);label(c,'A 固定',x+w-128,y,15,red);label(c,'B 隔震',x+w-60,y,15,teal);
  const top=y+24, mid=top+h*.5, end=y+24+h, max=Math.max(.1,sim.peaks.fixed.a,sim.peaks.isolated.a);
  rect(c,x,top,w,h,'#eeeadd');
  for(let i=0;i<=6;i++)path(c,[[x+w*i/6,top],[x+w*i/6,end]],'#d1cfbf',.7);
  path(c,[[x,mid],[x+w,mid]],'#a3a799',.8);
  const last=Math.round(t*fps);
  for(const [key,color] of [['fixed',red],['isolated',teal]]){
    const pts=[];
    for(let i=0;i<=last;i+=3)pts.push([x+w*i/(duration*fps),mid-sim.frames[i][key].roofA/max*h*.44]);
    pts.push([x+w*t/duration,mid-sim.at(t)[key].roofA/max*h*.44]);path(c,pts,color,1.9);dot(c,...pts.at(-1),2.5,color);
  }
  const now=x+w*t/duration;path(c,[[now,top],[now,end]],'#646e61',.85);
  label(c,'±'+max.toFixed(2)+' g',x+5,top+14,12,grey,mono);
  label(c,'0 s',x,end+16,12,grey,mono);label(c,'30 s',x+w,end+16,12,grey,mono,'right');
}
function bearing(c,sim,t,x,y,w,h){
  const f=sim.at(t).isolated,d=f.u[0], dx=d/Math.max(.01,sim.peaks.base)*Math.min(w*.17,40);
  label(c,'隔震支座剖面',x,y,19,ink);label(c,(100*d).toFixed(1)+' cm',x+w,y,16,teal,mono,'right');
  const cx=x+w*.5, by=y+h-5,top=by-48;
  rect(c,x,y+13,w,h-11,'#e8e9da');
  c.setLineDash([3,4]);path(c,[[cx,top-6],[cx,by+4]],'#838e7c',1);c.setLineDash([]);
  for(let j=0;j<8;j++){
    const a=dx*(1-j/8),b=dx*(1-(j+1)/8), yy=top+6*j;
    polygon(c,[[cx-41+a,yy],[cx+41+a,yy],[cx+41+b,yy+6],[cx-41+b,yy+6]],j%2?'#bda876':'#3d655a','#344f47',.8);
  }
  prism(c,cx+dx-52,top-6,104,6,7,-3,['#e2ddc6','#aaa994','#7b8274']);
  prism(c,cx-54,by,108,6,7,-3,['#e2ddc6','#aaa994','#7b8274']);
}
function groundTrace(c,sim,t,x,y,w,h){
  const f=sim.at(t),mid=y+h/2, amp=Math.max(.01,sim.params.pga);
  path(c,[[x,mid],[x+w,mid]],fine,.7);
  const pts=[];for(let i=0;i<sim.frames.length;i+=4)pts.push([x+i/(fps*duration)*w,mid-sim.frames[i].ag/amp*h*.47]);
  path(c,pts,'#788274',1.1);const u=x+t/duration*w;path(c,[[u,y],[u,y+h]],red,1);dot(c,u,mid-f.ag/amp*h*.47,2.5,red);
}
export function draw(c,sim,t,{portrait=true,track=true}={}){
  const W=portrait?720:1100,H=portrait?1280:635;
  c.save();c.scale(c.canvas.width/W,c.canvas.height/H);rect(c,0,0,W,H,paper);
  const [name,caption]=stage(t);
  if(portrait){
    label(c,'MOTION NOTEBOOK    /    STRUCTURAL DYNAMICS',36,54,17,teal,mono);
    label(c,'地震中的双塔',34,139,60,ink,serif);
    label(c,'十八层剪切楼模型   ·   固定基础与基底隔震',37,184,24,grey);
    path(c,[[36,209],[684,209]],ink,1);
    mainScene(c,sim,t,0,222,720,553,(t>4&&t<10.8)||Math.abs(t-sim.peaks.fixed.driftTime)<.17,track);
    if(t<25){
      label(c,name,36,844,43,red,serif);label(c,caption,38,891,24,ink);
    }else{
      label(c,'同一次地震，两种结果',36,840,38,ink,serif);
      label(c,'屋顶峰值',38,892,23,grey);
      label(c,'固定  '+sim.peaks.fixed.a.toFixed(2)+' g',175,892,26,red);
      label(c,'隔震  '+sim.peaks.isolated.a.toFixed(2)+' g',422,892,26,teal);
    }
    path(c,[[36,919],[684,919]],fine,.8);
    bearing(c,sim,t,38,966,246,110);graph(c,sim,t,310,966,372,81);
    label(c,'地面加速度',38,1152,21,ink);label(c,'PGA  '+sim.params.pga.toFixed(2)+' g',682,1152,17,grey,mono,'right');
    groundTrace(c,sim,t,38,1171,644,48);
    path(c,[[36,1238],[684,1238]],fine,.8);label(c,'合成地震动   /   水平单向输入',38,1265,16,grey);
  }else{
    mainScene(c,sim,t,0,0,720,530,(t>4&&t<10.8)||Math.abs(t-sim.peaks.fixed.driftTime)<.17,track);
    path(c,[[720,0],[720,635]],fine,1);
    bearing(c,sim,t,747,49,324,142);graph(c,sim,t,747,248,324,100);
    label(c,'地面加速度',747,438,19,ink);label(c,'PGA '+sim.params.pga.toFixed(2)+' g',1071,438,15,grey,mono,'right');
    groundTrace(c,sim,t,747,462,324,73);
    label(c,name,24,574,29,red,serif);label(c,caption,24,610,20);
    label(c,'支座塑性耗能',747,589,17,ink);label(c,sim.at(t).isolated.energy.toFixed(2)+' MJ',1070,589,18,teal,mono,'right');
  }c.restore();
}

export function drawMobile(c,sim,t,track=true){
  c.save();c.scale(c.canvas.width/720,c.canvas.height/588);
  rect(c,0,0,720,588,paper);mainScene(c,sim,t,0,0,720,516,(t>4&&t<10.8)||Math.abs(t-sim.peaks.fixed.driftTime)<.17,track);
  const [name,caption]=stage(t);label(c,name,18,560,27,red,serif);
  label(c,caption,175,558,18);c.restore();
}
export function drawLoop(c,sim,t){
  const w=520,h=189; c.save();c.scale(c.canvas.width/w,c.canvas.height/h);
  rect(c,0,0,w,h,cream);
  const cx=245,cy=92,sx=178/Math.max(.01,sim.peaks.base),sy=66/Math.max(.1,sim.peaks.force);
  path(c,[[37,cy],[450,cy]],fine,1);path(c,[[cx,12],[cx,174]],fine,1);
  label(c,'恢复力 / MN',9,23,14,grey);label(c,'位移 / cm',508,112,14,grey,sans,'right');
  const pts=[];const idx=Math.round(t*fps);
  for(let i=0;i<=idx;i++){const b=sim.frames[i].isolated;pts.push([cx+b.u[0]*sx,cy-b.force*sy]);}
  path(c,pts,teal,1.5);dot(c,...pts.at(-1),4,red);
  label(c,(100*sim.peaks.base).toFixed(1),cx+178,cy-5,12,grey,mono,'center');
  label(c,sim.peaks.force.toFixed(2),cx+6,cy-65,12,grey,mono);c.restore();
}
