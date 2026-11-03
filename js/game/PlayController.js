// Порт se.codebrew.gdtr.s — контроллер заезда, пауза, итог и меню.
// Android SurfaceHolder/Thread заменены вызовами stepFrame() из RAF в main.js.

import { GDTRMenu } from '../render/GDTRMenu.js';
import { ResultBannerHud } from '../render/ResultBannerHud.js';
import { STEPS_PER_FRAME } from '../core/const.js';

export class PlayController {
  constructor(canvas, onExit) {
    this.canvas = canvas;
    this.onExit = onExit;
    this.paused = false;
    this.stopped = false;
    this.renderer = null;
    this.engine = null;
    this.game = null;
    this.inputs = [];
    this.replayMode = false;
    this.menuVisible = false;
    this.menuAt = 0;
    this.hasNext = false;
    this.touchListener = null;
    this.touchHud = null;
    this.activeTouch = null;
    this.success = false;
    this.crashed = false;
    this.everCrashed = false;
    this.banner = null;
    this.menu = null;
  }

  setRenderer(renderer) { this.renderer = renderer; }
  setPhysicsEngine(engine) { this.engine = engine; }
  setGame(game) { this.game = game; }
  setReplayMode(value) { this.replayMode = value; }
  setHasNext(value) { this.hasNext = value; }
  setTouchListener(listener) {
    this.touchListener = listener;
    this.activeTouch = listener;
  }
  setTouchHud(hud) { this.touchHud = hud; }
  addInput(input) { this.inputs.push(input); }

  resetInput() {
    if (this.touchListener) this.touchListener.onTouch?.(this.canvas, null);
    for (const input of this.inputs) input.reset();
  }

  showBanner(text, success) {
    this.banner = new ResultBannerHud(success, text);
    if (this.renderer) this.renderer.addHud(this.banner);
  }

  onEvent(event) {
    if (event === 2) return;
    if (event === 1) {
      this.everCrashed = true;
      if (!this.crashed) {
        this.resetInput();
        this.renderer.removeHud(this.touchHud);
        if (!this.success) {
          this.crashed = true;
          if (this.replayMode) {
            this.menuAt = Date.now() + 3000;
          } else {
            this.showBanner('Crashed', false);
            this.menuAt = Date.now() + 1000;
          }
        }
      }
    } else if (event === 4) {
      if (!this.success) {
        this.resetInput();
        this.renderer.removeHud(this.touchHud);
        if (!this.crashed) this.success = true;
        if (this.replayMode) {
          this.menuAt = Date.now() + 3000;
        } else {
          this.showBanner('Success', true);
          this.menuAt = Date.now() + 1000;
        }
      }
    }
  }

  showMenu() {
    if (this.menuVisible) return;
    if (this.menuAt !== 0 && this.menuAt < Date.now()) this.menuAt = 0;
    if (this.banner && this.renderer) this.renderer.removeHud(this.banner);

    this.menu = new GDTRMenu(this);
    this.menu.setHasNextLevel(this.hasNext && this.success && !this.crashed);
    this.menu.setCanContinue(this.paused);
    this.menu.setReplayMode(this.replayMode);
    const events = this.inputs.length > 0 ? this.inputs[0].getRecordedEvents() : null;
    this.menu.setRecordedEvents(events);
    this.menu.initialize();

    this.activeTouch = this.menu;
    if (this.renderer) {
      this.renderer.removeHud(this.touchHud);
      this.renderer.addHud(this.menu);
    }
    this.menuVisible = true;
  }

  hideMenu() {
    if (!this.menuVisible) return;
    this.menuVisible = false;
    this.touchListener?.resume?.();
    if (this.renderer) this.renderer.removeHud(this.menu);
    this.menu = null;
    if (!this.success && !this.crashed) {
      this.activeTouch = this.touchListener;
      if (this.touchHud && this.renderer) this.renderer.addHud(this.touchHud);
    } else {
      this.activeTouch = null;
    }
  }

  toggleMenu() {
    if (!this.replayMode) this.resetInput();
    if (this.menuVisible) {
      this.hideMenu();
      this.paused = false;
    } else {
      if (!this.success && !this.crashed) this.paused = true;
      this.showMenu();
      this.menuVisible = true;
    }
  }

  finish(resultCode, recordedEvents = null) {
    this.onExit?.(resultCode, recordedEvents);
    this.stop();
  }

  stop() {
    this.stopped = true;
    this.paused = false;
  }

  stepFrame() {
    if (this.paused) return;
    if (!this.success && !this.crashed) {
      for (const input of this.inputs) input.poll();
    }
    for (let i = 0; i < STEPS_PER_FRAME; i++) {
      this.engine.step();
      this.game.update();
    }
    if (this.menuAt !== 0 && this.menuAt < Date.now()) {
      this.menuAt = 0;
      this.showMenu();
    }
  }

  release() {
    this.renderer = null;
    this.engine = null;
  }
}
