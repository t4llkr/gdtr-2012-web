// Порт activity.Splash + activity.d/e: 3000 мс, обновление каждые 20 мс,
// исходный логотип в 60% ширины и высоты экрана, выход по ACTION_DOWN.

export const SPLASH_DURATION = 3000;
export const SPLASH_INTERVAL = 20;

export class Splash {
  constructor(canvas, onFinish) {
    this.canvas = canvas;
    this.onFinish = onFinish;
    this.ctx = canvas.getContext('2d');
    this.elapsed = 0;
    this.alpha = 0;
    this.timer = 0;
    this.finished = false;
    this.image = new Image();
    this.image.src = 'assets/feature_image_phone2.png';
    this.image.addEventListener('load', () => this.draw());
    this.onPointerDown = event => {
      event.preventDefault();
      this.finish();
    };
    this.onKeyDown = event => {
      if (event.repeat) return;
      event.preventDefault();
      this.finish();
    };
    this.onResize = () => {
      this.resize();
      this.draw();
    };
  }

  start() {
    this.resize();
    this.draw();
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    addEventListener('keydown', this.onKeyDown);
    addEventListener('resize', this.onResize);
    this.timer = setInterval(() => {
      this.draw();
      this.elapsed += SPLASH_INTERVAL;
      if (this.elapsed >= SPLASH_DURATION) this.finish();
    }, SPLASH_INTERVAL);
  }

  resize() {
    this.canvas.width = Math.floor(this.canvas.clientWidth * devicePixelRatio);
    this.canvas.height = Math.floor(this.canvas.clientHeight * devicePixelRatio);
  }

  draw() {
    if (this.finished) return;
    const { width, height } = this.canvas;
    this.ctx.globalAlpha = this.alpha / 255;
    this.ctx.clearRect(0, 0, width, height);
    if (this.image.complete && this.image.naturalWidth > 0) {
      const imageWidth = Math.floor(width * 0.6);
      const imageHeight = Math.floor(height * 0.6);
      const x = Math.floor(width / 2) - Math.floor(imageWidth / 2);
      const y = Math.floor(height / 2) - Math.floor(imageHeight / 2);
      this.ctx.drawImage(this.image, x, y, imageWidth, imageHeight);
    }
    this.ctx.globalAlpha = 1;
    this.alpha = 255;
  }

  stop() {
    clearInterval(this.timer);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    removeEventListener('keydown', this.onKeyDown);
    removeEventListener('resize', this.onResize);
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.stop();
    this.onFinish?.();
  }
}
