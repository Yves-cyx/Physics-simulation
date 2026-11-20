# Physics-simulation
This is a program which can make physics simulation and output beautiful animation.

## Motion Notebook

An interactive browser studio with an illustrated basketball drop and a small-angle pendulum. Adjust the experiment, slow down playback, and record the canvas. Video format depends on browser codec support.

Run `python -m http.server 8000` in this directory and open http://localhost:8000. No build or installation dependencies.

The bounce uses exact ballistic segments and instantaneous impacts. Rebounds stop when their launch speed falls below 0.015 m/s. The pendulum uses the small-angle approximation up to 15 degrees. Both scenes take gravity as 9.81 m/s².

The model functions live in physics.js. The renderer, experiment controls and video recorder live in studio.js. Code and original drawings are available under the MIT License.

Portrait mode composes a 720 × 1280 scene for vertical video. The basketball's guided replay lasts 12 seconds and holds briefly at release, impact, and the first peak. Recording a guided replay starts it from release and downloads it at the end. Disable guided replay for free playback. The energy display shows gravitational, kinetic, and dissipated energy as fractions of the original drop energy.

The studio also includes elliptical binary orbits, two coupled spring carts, and a three-body rolling race on parallel inclines. Both canvas formats and video recording work for each experiment. The models are in experiments.js and the scene drawings are in scene-view.js.

Marble Cascade opens with a 20-second camera-following film. A rolling marble leaves a wooden track and strikes a stack of beams and posts. Change the tower height or release offset to rerun the fixed 120 Hz simulation. First contact sets the slow-motion cue. Matter.js 0.20.0 is bundled locally under its MIT license (vendor/matter-LICENSE).

Open tower.html for the tower workbench. Drag either lower support, run the 7-second trial, scrub individual 120 Hz frames, or jump to first contact. Dashed teal outlines replay a pinned design aligned to first ball–tower contact. Ground contacts are counted once per green ball. Share links encode both support pairs.

### 手机首次试用（建议 3 人，每人约 5 分钟）

让参与者从首页开始，在有访问权限的手机上操作。主持人只读任务：“只移动一根底柱，让两颗绿球在 7 秒内都不碰地，然后指给我看两次结果哪里不同。”不要演示入口或指认按钮。当前托管站为私有，可在站点所有者已打开的设备上当面试用。

每人记录四项：第一次停顿的位置和原话、是否独立找到实验、是否独立完成改塔和运行、能否指出触地差异对应的画面。需要提示时记录提示内容。三次结束后优先修复导致多人无法继续的同一处问题。这是试用方案，尚未收集真人结果。
