// The film and the interactive player sample the same fixed-step simulation.
export const floorY=580, hz=120, duration=20;
export const rail=[[40,135],[110,185],[205,266],[300,345],[355,382],[395,403],[430,412],[460,412],[492,404],[525,389]];
export function simulate(M, release=0, rows=3, supports=[656,737]){
 const {Engine,Bodies,Composite,Events,Body}=M;
 const engine=Engine.create({positionIterations:9,velocityIterations:8});
 engine.gravity.y=1;const bodies=[],spec=[],events=[];
 const add=b=>{Composite.add(engine.world,b);return b};
 const ground=add(Bodies.rectangle(520,floorY+25,2400,50,{isStatic:true}));
 for(let j=1;j<rail.length;j++){
   const [x,y]=rail[j-1],[u,v]=rail[j],angle=Math.atan2(v-y,u-x);
   add(Bodies.rectangle((x+u)/2-3*Math.sin(angle),(y+v)/2+3*Math.cos(angle),Math.hypot(u-x,v-y)+2,6,{angle,isStatic:true,friction:.22}));
 }
 function moving(body,shape){add(body);bodies.push(body);spec.push(shape);return body}
 const x0=67+release,y0=135+(x0-40)*50/70-22;
 const ball=moving(Bodies.circle(x0,y0,18,{density:.019,friction:.25,frictionAir:0,restitution:.15}),{type:'ball',r:18});
 const timber={density:.0007,friction:.46,frictionAir:.0004,restitution:.06};
 for(let level=0;level<rows;level++){
   const bottom=floorY-level*80;
   for(const x of (level===0?supports:[656,737]))moving(Bodies.rectangle(x,bottom-32,18,64,timber),{type:'post',w:18,h:64});
   moving(Bodies.rectangle(696.5,bottom-72,120,16,timber),{type:'beam',w:120,h:16});
 }
 for(const x of [672,714])moving(Bodies.circle(x,floorY-rows*80-13,13,{density:.0015,friction:.4}),{type:'orb',r:13});
 const orbs=bodies.slice(-2), landings=[null,null];
 let when=0,impact=null;
 Events.on(engine,'collisionStart',({pairs})=>{for(const {bodyA,bodyB} of pairs){
  const other=bodyA===ground?bodyB:bodyB===ground?bodyA:null;
  const orb=orbs.indexOf(other);
  if(orb>=0 && landings[orb]===null)landings[orb]=when;
  if((bodyA===ball&&bodies.indexOf(bodyB)>0)||(bodyB===ball&&bodies.indexOf(bodyA)>0)){
   if(impact===null)impact=when;
  }
  if(impact!==null && when-impact<2 && (!events.length||when-events.at(-1)>.085))events.push(when);
 }});
 const frames=[],run=7;
 for(let i=0;i<=run*hz;i++){when=i/hz;if(i)Engine.update(engine,1000/hz);
 frames.push(bodies.map(b=>[b.position.x,b.position.y,b.angle]));}
 const hit=impact??2.0;
 // Duration in presentation seconds; second coordinate in physical seconds.
 const stops=[[0,0],[1.1,0],[6,Math.max(0,hit-.28)],[9,hit],[12.8,hit+.32],[18.4,run],[20,run]];
 function timeAt(t){for(let i=1;i<stops.length;i++){
 const [a,u]=stops[i-1],[b,v]=stops[i];if(t<=b)return u+(v-u)*Math.max(0,(t-a)/(b-a));}return run}
 function at(t){const k=Math.max(0,Math.min(run*hz,t*hz)),i=Math.floor(k),f=k-i;
 return frames[i].map((p,j)=>p.map((a,d)=>a+f*(frames[Math.min(i+1,frames.length-1)][j][d]-a)))}
 Engine.clear(engine);Composite.clear(engine.world,false);
 return {spec,at,timeAt,impact,landings,events,frames,run};
}
