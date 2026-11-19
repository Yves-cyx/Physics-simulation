# Physics-simulation
This is a program which can make physics simulation and output beautiful animation.

## Motion Notebook

An interactive browser studio with an illustrated basketball drop and a small-angle pendulum. Adjust the experiment, slow down playback, and record the canvas. Video format depends on browser codec support.

Run `python -m http.server 8000` in this directory and open http://localhost:8000. No build or installation dependencies.

The bounce uses exact ballistic segments and instantaneous impacts. Rebounds stop when their launch speed falls below 0.015 m/s. The pendulum uses the small-angle approximation up to 15 degrees. Both scenes take gravity as 9.81 m/s².

The model functions live in physics.js. The renderer, experiment controls and video recorder live in studio.js. Code and original drawings are available under the MIT License.

Portrait mode composes a 720 × 1280 scene for vertical video. The basketball's guided replay lasts 12 seconds and holds briefly at release, impact, and the first peak. Recording a guided replay starts it from release and downloads it at the end. Disable guided replay for free playback. The energy display shows gravitational, kinetic, and dissipated energy as fractions of the original drop energy.
