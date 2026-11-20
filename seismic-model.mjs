// SI units. Coordinates are relative to the translating ground.
export const floors = 18, height = 3.4, g = 9.81, fps = 60, duration = 30;
export const defaults = { pga: 0.28, frequency: 0.72, period: 3.2 };
const tau = 2 * Math.PI;
const masses = Array.from({length: floors}, (_, i) => 390000 - 5000 * i);
const stiffness = masses.map((_, i) => 7.3e8 * (1 - 0.49 * i / (floors - 1)));
const baseMass = 590000;
const totalMass = baseMass + masses.reduce((sum, m) => sum + m, 0);
const clip = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// Finite displacement wave packets. Differentiating the window as well as
// the carrier gives acceleration and exactly quiet endpoints in both records.
function packet(t, start, span, f, amp, phase) {
  const u = t - start;
  if (u <= 0 || u >= span) return [0, 0];
  const b = Math.PI / span, s = Math.sin(b*u), c = Math.cos(b*u);
  const w = tau*f, a = w*u+phase, sn = Math.sin(a), cs = Math.cos(a);
  const e = s**4, de = 4*b*s**3*c, dde = 4*b*b*(3*s*s*c*c - s**4);
  return [amp*e*sn, amp*((dde-e*w*w)*sn+2*de*w*cs)];
}
function input(t, frequency) {
  const packets = [[0,7,2.4,.018,.3],[1,14,frequency,1.0,0],
    [4,12,1.7*frequency,.18,1.4],[9,11,.86*frequency,.78,1.9],[13,8,2.3*frequency,.075,.7]];
  let x=0, a=0;
  for (const [start,span,f,amp,phase] of packets) {
    const [dx,da]=packet(t,start,span,f,amp,phase); x+=dx; a+=da;
  }
  return [x,a];
}
function building(isolated, period) {
  const first = isolated ? 1 : 0, m = isolated ? [baseMass,...masses] : masses;
  const n=m.length, x=new Float64Array(n), v=new Float64Array(n), a=new Float64Array(n);
  const w=tau/period, post=totalMass*w*w, yieldForce=.022*totalMass*g;
  const elastic=yieldForce/.012, dashpot=2*.10*totalMass*w;
  let plastic=0, energy=0, bearingForce=0;
  function forces(groundA, commit) {
    for (let j=0;j<n;j++) a[j]=-groundA;
    for (let i=0;i<floors;i++) {
      const j=i+first, d=x[j]-(j?x[j-1]:0), dv=v[j]-(j?v[j-1]:0);
      const f=stiffness[i]*(d+.013*dv);
      a[j]-=f/m[j];
      if(j) a[j-1]+=f/m[j-1];
    }
    if(isolated) {
      const branch=clip(elastic*(x[0]-plastic),-yieldForce,yieldForce);
      if(commit) {
        const next=x[0]-branch/elastic;
        energy+=yieldForce*Math.abs(next-plastic); plastic=next;
      }
      bearingForce=post*x[0]+branch;
      a[0]-=(bearingForce+dashpot*v[0])/m[0];
    }
  }
  function advance(dt, groundA) {
    for(let j=0;j<n;j++) {v[j]+=.5*dt*a[j]; x[j]+=dt*v[j];}
    forces(groundA,true);
    for(let j=0;j<n;j++) v[j]+=.5*dt*a[j];
    forces(groundA,false);
  }
  function snapshot(groundA) {
    const u=[isolated?x[0]:0,...x.slice(first)];
    let drift=0, story=1;
    for(let j=1;j<=floors;j++) {
      const value=Math.abs(u[j]-u[j-1])/height;
      if(value>drift) {drift=value;story=j;}
    }
    return {u,roofA:(a[n-1]+groundA)/g,drift,story,force:bearingForce/1e6,energy:energy/1e6};
  }
  return {advance,snapshot};
}
export function simulate(options={}, substeps=5) {
  const params={...defaults,...options}, rate=fps*substeps, dt=1/rate;
  const count=duration*rate, accel=new Float64Array(count+1), ground=new Float64Array(count+1);
  let maxA=0;
  for(let k=0;k<=count;k++) {
    [ground[k],accel[k]]=input(k*dt,params.frequency);maxA=Math.max(maxA,Math.abs(accel[k]));
  }
  const scale=params.pga*g/maxA;
  const fixed=building(false,params.period), isolated=building(true,params.period);
  const frames=[], peaks={fixed:{a:0,drift:0},isolated:{a:0,drift:0},base:0,roof:0,ground:0,force:0};
  for(let k=0;k<=count;k++) {
    const ag=scale*accel[k];
    if(k) {fixed.advance(dt,ag);isolated.advance(dt,ag);}
    if(k%substeps) continue;
    const t=k*dt, f={t,ag:ag/g,xg:scale*ground[k],fixed:fixed.snapshot(ag),isolated:isolated.snapshot(ag)};
    frames.push(f);
    for(const key of ['fixed','isolated']) {
      const b=f[key], p=peaks[key];
      if(Math.abs(b.roofA)>p.a){p.a=Math.abs(b.roofA);p.aTime=t;}
      if(b.drift>p.drift){p.drift=b.drift;p.driftTime=t;p.story=b.story;}
      for(const u of b.u) peaks.roof=Math.max(peaks.roof,Math.abs(u));
    }
    if(Math.abs(f.isolated.u[0])>peaks.base){peaks.base=Math.abs(f.isolated.u[0]);peaks.baseTime=t;}
    peaks.ground=Math.max(peaks.ground,Math.abs(f.xg));peaks.force=Math.max(peaks.force,Math.abs(f.isolated.force));
  }
  return {params,frames,peaks,at:t=>frames[clip(Math.round(t*fps),0,frames.length-1)]};
}
