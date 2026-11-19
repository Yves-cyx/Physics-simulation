// Heights are clearances above contact. Time is measured in seconds.
export function bounce(t, height, e, g = 9.81) {
  const fall = Math.sqrt(2 * height / g);
  if (t < fall) return { h: height - g*t*t/2, v: -g*t, count: 0 };
  let elapsed = t - fall, launch = e*g*fall, count = 1;
  while (launch > 0.015) {
    const flight = 2*launch/g;
    if (elapsed < flight) return { h: elapsed*(launch-g*elapsed/2), v: launch-g*elapsed, count };
    elapsed -= flight;
    launch *= e;
    count++;
  }
  return { h: 0, v: 0, count };
}
export function pendulum(t, length, degrees) {
  const omega = Math.sqrt(9.81/length), amplitude = degrees*Math.PI/180;
  return { angle: amplitude*Math.cos(omega*t), v: -length*omega*amplitude*Math.sin(omega*t) };
}
