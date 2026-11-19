// Relative Kepler ellipse with semimajor axis 1 and period 8 model seconds.
// The mass ratio changes the barycentric split at fixed total mass.
export function binary(t, ratio, e) {
  const n = 2*Math.PI/8, mean = n*(t%8);
  let E = mean;
  for(let i=0;i<8;i++) E -= (E-e*Math.sin(E)-mean)/(1-e*Math.cos(E));
  const f = Math.sqrt(1-e*e), rate = n/(1-e*Math.cos(E));
  const factors = [-ratio/(1+ratio), 1/(1+ratio)];
  return factors.map(k=>({x:k*(Math.cos(E)-e), y:k*f*Math.sin(E),
    vx:-k*Math.sin(E)*rate, vy:k*f*Math.cos(E)*rate}));
}

// Equal 1 kg carts with two 4 N/m wall springs and a coupling spring.
export function carts(t, coupling, amplitude) {
  const slow=2, fast=Math.sqrt(4+2*coupling);
  return [1,-1].map(sign=>({
    x:amplitude*(Math.cos(slow*t)+sign*Math.cos(fast*t))/2,
    v:-amplitude*(slow*Math.sin(slow*t)+sign*fast*Math.sin(fast*t))/2
  }));
}
export const racers=['Sphere','Cylinder','Hoop'];
export function race(t, angle, length) {
  return [2/5,1/2,1].map(inertia=>{
    const acceleration=9.81*Math.sin(angle*Math.PI/180)/(1+inertia);
    const finish=Math.sqrt(2*length/acceleration), elapsed=Math.min(t,finish);
    return {distance:acceleration*elapsed**2/2,finish,speed:acceleration*elapsed,done:t>=finish};
  });
}

export const experiments={
 binary:{title:'Binary stars',intro:'Which star moves farther when both orbit the same centre of mass?',
 model:'Two point masses follow a Newtonian ellipse in their centre-of-mass frame. Total mass and relative semimajor axis are fixed. Distances use the semimajor axis as one unit. Star sizes are illustrative.',
 params:[['Mass ratio B / A',0.2,3,.1,1.5,''],['Eccentricity',0,.75,.05,.45,'']],chart:'Separation / relative semimajor axis'},
 carts:{title:'Coupled spring carts',intro:'Displace one cart and watch the second pick up the oscillation.',
 model:'Two 1 kg carts slide on a frictionless track. Each outer spring has stiffness 4 N/m. Initially cart A is displaced and both carts are at rest. The animation sums the in-phase and out-of-phase normal modes.',
 params:[['Middle spring',.5,6,.25,2,'N/m'],['Initial displacement',.1,.5,.05,.4,'m']],chart:'Displacement / m'},
 race:{title:'Rolling race',intro:'Same radius, same start. Which shape reaches the foot of the ramp first?',
 model:'A uniform solid sphere, solid cylinder and thin hoop roll without slipping from rest. Their moments of inertia differ. Each lane freezes its racer at the finish and reports its arrival time. The drawing enlarges the bodies for visibility.',
 params:[['Incline',8,27,1,18,'°'],['Ramp length',2,6,.25,4,'m']],chart:'Distance along ramp / m'}
};
