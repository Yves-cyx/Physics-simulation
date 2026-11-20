import {defaults,duration,simulate} from './seismic-model.mjs';
import {draw,drawMobile,drawLoop} from './seismic-art.mjs';
const el=id=>document.getElementById(id), scene=el('scene'), ctx=scene.getContext('2d'), loop=el('loop').getContext('2d');
const compact=matchMedia('(max-width:760px)'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
const keys=Object.keys(defaults), params={...defaults};
let sim, t=0, playing=!reduced.matches, last, token=0, cinema=false;
el('follow').checked=!reduced.matches;
function paint(){
  if(cinema)draw(ctx,sim,t,{portrait:true,track:el('follow').checked});
  else if(compact.matches)drawMobile(ctx,sim,t,el('follow').checked);
  else draw(ctx,sim,t,{portrait:false,track:el('follow').checked});
  drawLoop(loop,sim,t);
  el('energy').value=sim.at(t).isolated.energy.toFixed(2)+' MJ';
  el('clock').value=t.toFixed(2)+' / 30 s';el('time').value=t;
  el('play').textContent=playing?'暂停':t>=duration?'重播':'播放';
}
function resize(){
  [scene.width,scene.height]=cinema?[720,1280]:compact.matches?[720,588]:[1320,762];paint();
}
function tick(now){
  token=0;
  if(playing&&!document.hidden){
    if(last!=null)t=Math.min(duration,t+(now-last)/1000*Number(el('speed').value));
    last=now;if(t>=duration)playing=false;paint();schedule();
  }
}
function schedule(){if(playing&&!document.hidden&&!token)token=requestAnimationFrame(tick);}
function seek(value,play=false){
  t=value;playing=play;last=null;paint();schedule();
}
function rebuild(reset=false){
  for(const key of keys){params[key]=Number(el(key).value);}
  sim=simulate(params);
  const p=sim.peaks;
  el('fa').textContent=p.fixed.a.toFixed(2)+' g';el('ia').textContent=p.isolated.a.toFixed(2)+' g';
  el('fd').textContent=(100*p.fixed.drift).toFixed(2)+'%';el('idrift').textContent=(100*p.isolated.drift).toFixed(2)+'%';
  el('ib').textContent=(100*p.base).toFixed(1)+' cm';
  el('eventNote').textContent='';
  for(const [key,unit] of [['pga',' g'],['frequency',' Hz'],['period',' s']])el(key+'Value').value=params[key].toFixed(key==='period'?1:2)+unit;
  for(const [button,freq] of [['reference',defaults.frequency],['resonant',.58]])el(button).setAttribute('aria-pressed',params.pga===defaults.pga&&params.frequency===freq&&params.period===defaults.period);
  seek(reset?0:t,playing);
}
for(const key of keys)el(key).addEventListener('input',()=>rebuild());
for(const [button,f] of [['reference',defaults.frequency],['resonant',.58]])el(button).onclick=()=>{
  for(const key of keys)el(key).value=key==='frequency'?f:defaults[key];
  rebuild(true);
};
el('time').oninput=()=>{el('eventNote').textContent='';seek(Number(el('time').value));};
el('play').onclick=()=>seek(t>=duration?0:t,!playing);
el('restart').onclick=()=>{el('eventNote').textContent='';seek(0,true);};
el('follow').onchange=paint;
el('cinema').onclick=()=>{
  cinema=!cinema;el('cinema').setAttribute('aria-pressed',cinema);
  scene.classList.toggle('cinema',cinema);resize();
};
function jump(time,note){seek(time);el('eventNote').textContent=note;}
el('jumpDrift').onclick=()=>jump(sim.peaks.fixed.driftTime,'固定基础楼的第 '+sim.peaks.fixed.story+' 层出现全程最大层间位移角。');
el('jumpBase').onclick=()=>jump(sim.peaks.baseTime,'隔震基底相对地面的水平位移绝对值达到峰值。');
el('jumpTail').onclick=()=>jump(21,'地面输入已结束，可继续播放，观察自由衰减。');
document.addEventListener('visibilitychange',()=>{last=null;schedule();});
compact.addEventListener('change',resize);rebuild(true);resize();
