// Точка входа: исходный ChooseLevel + заезд с состояниями m/r/s и GDTRMenu.

import { LevelManager } from './core/LevelManager.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { createBike } from './physics/Bike.js';
import { LeanControl } from './physics/LeanControl.js';
import { RecordingInputDispatcher } from './input/RecordingInputDispatcher.js';
import { ReplayInputSource } from './input/ReplayInputSource.js';
import { KeyboardSource } from './input/KeyboardSource.js';
import { TouchControls } from './input/TouchControls.js';
import { PinchZoom } from './input/PinchZoom.js';
import { TARGET_FPS } from './core/const.js';
import { SchemeManager } from './render/SchemeManager.js';
import { Renderer } from './render/Renderer.js';
import { Camera } from './render/Camera.js';
import { MountainRenderer } from './render/MountainRenderer.js';
import { GroundRenderer } from './render/GroundRenderer.js';
import { FlagRenderer } from './render/FlagRenderer.js';
import { ChassisRenderer } from './render/ChassisRenderer.js';
import { BikeRenderer } from './render/BikeRenderer.js';
import { createRider } from './render/Rider.js';
import { TimerHud } from './render/TimerHud.js';
import { BannerHud } from './render/BannerHud.js';
import { ProgressHud } from './render/ProgressHud.js';
import { GameEngine } from './game/GameEngine.js';
import { GameController } from './game/GameController.js';
import { PlayController } from './game/PlayController.js';
import { CrashHandler } from './game/CrashHandler.js';
import { TimerVisibility } from './game/TimerVisibility.js';
import { ChooseLevel } from './ui/ChooseLevel.js';
import { Splash } from './ui/Splash.js';
import { Preferences } from './storage/Preferences.js';

const splashScreen = document.getElementById('splash');
const splashCanvas = document.getElementById('splash-view');
const chooseScreen = document.getElementById('choose-level');
const stage = document.getElementById('stage');
const listEl = document.getElementById('level-list');
const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
}
addEventListener('resize', resize);

const manager = new LevelManager();
const preferences = new Preferences();
let chooseLevel = null;
let current = null;
let drive = null;

function boot() {
  chooseLevel = new ChooseLevel(listEl, manager, play, preferences);
  const ready = manager.load().then(() => chooseLevel.refresh());
  ready.catch(e => console.error('GDTR', 'Failed to load levels.', e));

  const revealChoose = () => {
    splashScreen.hidden = true;
    chooseScreen.hidden = false;
  };
  const splash = new Splash(splashCanvas, () => {
    // Если каталог ещё загружается, дождаться его перед открытием ChooseLevel.
    ready.then(revealChoose, () => {
      chooseLevel.refresh();
      revealChoose();
    });
  });
  splash.start();
}

async function play(info, replayEvents = null) {
  stopDrive();
  if (!info.level) info.level = await manager.loadLevel(info.filename, info.packId);
  if (!info.level) {
    showChoose();
    return;
  }
  current = { info, level: info.level, replayEvents };
  chooseScreen.hidden = true;
  stage.hidden = false;
  resize();
  startDrive();
}

function showChoose() {
  stopDrive();
  splashScreen.hidden = true;
  stage.hidden = true;
  chooseScreen.hidden = false;
  chooseLevel?.refresh();
}

async function handleExit(resultCode, recordedEvents = null) {
  if (!drive) return;
  const info = drive.info;
  if (resultCode === 20) {
    const next = manager.findByName(info.nextLevelName);
    stopDrive();
    if (next) await play(next);
    else showChoose();
  } else if (resultCode === 21) {
    stopDrive();
    await play(info);
  } else if (resultCode === 22) {
    stopDrive();
    await play(info, recordedEvents);
  } else {
    showChoose();
  }
}

function startDrive() {
  if (!current || drive) return;
  const { info, level, replayEvents } = current;
  const replayMode = replayEvents !== null;
  const countdown = preferences.getBoolean('development_countdown', true);
  const accelBrakeBottom = preferences.getBoolean('accel_brake_bottom', false);
  const pinchWhilePlay = preferences.getBoolean('pinch_while_play', false);

  if (info.scheme != null) SchemeManager.applyScheme(info.scheme);
  else SchemeManager.applyRandom();

  const engine = new PhysicsEngine();
  engine.loadLevel(level);
  const bike = createBike(level.startX, level.startY);
  const rider = createRider();
  engine.addBody(bike);
  engine.addBody(rider);

  let keyboard = null;
  let touchControls = null;
  let replaySource = null;
  let replayPinch = null;
  let dispatcher;
  if (replayMode) {
    replaySource = new ReplayInputSource(replayEvents);
    replayPinch = new PinchZoom();
    dispatcher = new RecordingInputDispatcher(replaySource);
  } else {
    touchControls = new TouchControls(pinchWhilePlay);
    touchControls.setBottom(accelBrakeBottom);
    if (countdown) touchControls.setEngine(engine);
    keyboard = new KeyboardSource(window);
    keyboard.setEngine(engine);
    dispatcher = new RecordingInputDispatcher(touchControls);
    dispatcher.addSource(keyboard);
  }
  dispatcher.addThrottleListener(bike.getThrottle());
  const lean = new LeanControl(bike.frontWheel, bike.rearWheel, bike.head, bike.getLeanStrength());
  dispatcher.addLeanListener(lean);
  const bikeRenderer = new BikeRenderer(bike, rider);
  dispatcher.addLeanListener(bikeRenderer);

  const renderer = new Renderer();
  renderer.setBackground(SchemeManager.a);
  renderer.addWorld(new MountainRenderer(level, rider.getG(), canvas));
  renderer.addWorld(new GroundRenderer(level, canvas));
  renderer.addWorld(new FlagRenderer(level));
  const chassis = new ChassisRenderer(bike);
  chassis.initShadows();
  renderer.addWorld(chassis);
  renderer.addWorld(bikeRenderer);
  renderer.setCamera(new Camera(rider.getE()));
  if (replaySource) renderer.addHud(replaySource);

  const timeSource = new GameController(engine, info.name);
  const timerHud = new TimerHud(timeSource);
  renderer.addHud(timerHud);
  const banner = new BannerHud(info.name, replayMode ? null : info.getBestTimeText());
  banner.setBottom(accelBrakeBottom);
  renderer.addHud(banner);
  renderer.addHud(new ProgressHud(
    level.startX,
    level.getGoalPoint().x,
    bike.frontWheel,
    bike.frontWheel.pos.x - bike.head.pos.x
  ));
  if (touchControls) renderer.addHud(touchControls);

  const controller = new PlayController(canvas, handleExit);
  controller.setPhysicsEngine(engine);
  controller.setRenderer(renderer);
  controller.setReplayMode(replayMode);
  controller.setHasNext(info.nextLevelName !== null);
  controller.setTouchListener(replayMode ? replayPinch : touchControls);
  controller.setTouchHud(touchControls);
  controller.addInput(dispatcher);

  const game = new GameEngine();
  if (countdown) game.setPhysicsEngine(engine);
  game.setLevel(level);
  game.setBody(bike);
  game.setBike(bike);
  game.setHead(rider.getHead());
  game.addListener(timeSource);
  game.addListener(bikeRenderer);
  game.addListener(controller);
  game.addListener(new CrashHandler(rider, bike));
  game.addListener(new TimerVisibility(timerHud));
  controller.setGame(game);

  drive = { info, engine, bike, rider, renderer, dispatcher, keyboard, touchControls,
            replaySource, replayPinch, game, controller,
            lastT: performance.now(), acc: 0, rafId: 0 };
  drive.rafId = requestAnimationFrame(tick);
}

function stopDrive() {
  if (!drive) return;
  const old = drive;
  old.controller.stop();
  cancelAnimationFrame(old.rafId);
  old.keyboard?.release();
  old.replayPinch?.release();
  old.game.release();
  old.renderer.release();
  old.engine.dispose();
  old.controller.release();
  drive = null;
}

function tick(t) {
  if (!drive) return;
  const frame = 1000 / TARGET_FPS;
  drive.acc += t - drive.lastT;
  drive.lastT = t;
  if (drive.acc > 200) drive.acc = 200;
  while (drive.acc >= frame) {
    drive.controller.stepFrame();
    drive.acc -= frame;
    // s.run() обновляет позу райдера после каждого игрового кадра,
    // включая несколько кадров catch-up за один RAF.
    drawDrive();
  }
  drive.rafId = requestAnimationFrame(tick);
}

function drawDrive() {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  drive.renderer.draw(ctx, W, H);
}

function gamePointer(e) {
  const controller = drive?.controller;
  const listener = controller?.activeTouch;
  if (!listener) return;
  if (e.type === 'pointermove' && listener === controller.menu && e.buttons === 0) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * canvas.clientWidth / rect.width;
  const y = (e.clientY - rect.top) * canvas.clientHeight / rect.height;
  let action = 2;
  if (e.type === 'pointerdown') action = listener.pointers?.size > 0 ? 5 : 0;
  else if (e.type === 'pointerup') action = listener.pointers?.size > 1 ? 6 : 1;
  else if (e.type === 'pointercancel') action = 3;

  let handled;
  if (listener === controller.menu) handled = listener.onTouch(action, x, y);
  else handled = listener.onTouch(canvas, { action, pointerId: e.pointerId, x, y });
  if (handled) {
    if (e.type === 'pointerdown') canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
}

canvas.addEventListener('pointerdown', gamePointer);
canvas.addEventListener('pointermove', gamePointer);
canvas.addEventListener('pointerup', gamePointer);
canvas.addEventListener('pointercancel', gamePointer);
addEventListener('keydown', e => {
  if (!drive) return;
  if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
    e.preventDefault();
    Camera.zoomOut();
  } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
    e.preventDefault();
    Camera.zoomIn();
  } else if (e.code === 'KeyR' && !e.repeat) {
    e.preventDefault();
    handleExit(21);
  } else if (e.code === 'Escape' && !e.repeat) {
    e.preventDefault();
    drive.controller.toggleMenu();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && drive && !drive.controller.paused) drive.controller.toggleMenu();
});

boot();
