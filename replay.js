// Presentation time is independent of physical time. Holds let the viewer
// inspect a real model state at release, impact, and the first rebound apex.
export const duration = 12;
export function replayAt(seconds, height, restitution) {
  const impact = Math.sqrt(2 * height / 9.81);
  const apex = impact * (1 + restitution);
  const nextImpact = impact * (1 + 2 * restitution);
  if (seconds < 2) return { time: 0, caption: 'How high will it bounce?' };
  if (seconds < 5) return { time: impact * (seconds - 2) / 3, caption: 'Height turns into speed.' };
  if (seconds < 6.5) return { time: impact, caption: 'Impact reverses the velocity.' };
  if (seconds < 8.5) return { time: impact + (apex-impact)*(seconds-6.5)/2, caption: 'Speed turns back into height.' };
  if (seconds < 11) return { time: apex, caption: 'The next peak is lower.' };
  return { time: apex + (nextImpact-apex)*Math.min(1,seconds-11), caption: 'The ball falls again.' };
}
export function energyShares(state, height) {
  const potential = Math.max(0, Math.min(1,state.h / height));
  const kinetic = Math.min(1-potential,state.v**2 / (2*9.81*height));
  return [potential, kinetic, Math.max(0,1-potential-kinetic)];
}
