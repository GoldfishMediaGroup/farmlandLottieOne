// ============================
// КОНФИГУРАЦИЯ
// ============================
const config = {
  wrapperSelector: "body",
  animationSize: {
    desktop: { width: 456, height: 344 },
    mobile: { width: 292, height: 208 },
  },
  speeds: {
    desktop: { horizontal: 230, vertical: 50 },
    mobile: { horizontal: 100, vertical: 50 },
  },
  movement: {
    edgeOverflow: 65,
    flipDuration: 300,
    bottomThreshold: -40,
    triggerThreshold: 100,
    fadeOutTime: 500, // Время плавного появления/исчезновения
    delayWrapAnim: 2000, // Задержка ПЕРЕД ПОЛЕТОМ после того, как персонаж проявился
  },
  mainAnim: "https://storage.yandexcloud.net/external-assets/tantum/animations/lottie/jump.json",
  snowAnim: "https://storage.yandexcloud.net/external-assets/tantum/animations/lottie/snow.json",
  handAnim: "sani.json",
};

const animInstances = {
  main: null,
  snow: null,
  hand: null,
  handTriggered: false, 
};

// ============================
// УТИЛИТЫ
// ============================

function getCurrentParams() {
  const isMobile = window.innerWidth <= 768;
  return {
    size: isMobile ? config.animationSize.mobile : config.animationSize.desktop,
    speeds: isMobile ? config.speeds.mobile : config.speeds.desktop,
  };
}

function initLottie() {
  return new Promise((resolve) => {
    if (typeof lottie !== "undefined") return resolve();
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

// ============================
// ЛОГИКА ДВИЖЕНИЯ
// ============================
const Mover = {
  x: 0, y: 0, scaleX: 1,
  dirH: "right", dirV: "down",
  lastTimestamp: 0,
  isFlipping: false,
  flipStartTime: 0,
  isRestarting: false,

  reset(element) {
    this.x = 0; this.y = 0;
    this.dirV = "down"; this.dirH = "right";
    this.scaleX = 1;
    this.isRestarting = false;
    this.lastTimestamp = 0;
    animInstances.handTriggered = false; 

    const handLayer = element.querySelector(".lottie-layer-hand");
    if (handLayer) handLayer.style.opacity = "0";

    // ШАГ 1: Начинаем плавное проявление (Fade In)
    element.style.opacity = "1";
  },

  update(timestamp, element, size, speeds) {
    if (this.isRestarting) return;
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    this.x += (this.dirH === "right" ? speeds.horizontal : -speeds.horizontal) * dt;
    this.y += (this.dirV === "down" ? speeds.vertical : -speeds.vertical) * dt;

    const vw = window.innerWidth, vh = window.innerHeight;
    const distanceFromBottom = vh - (this.y + size.height);

    if (!animInstances.handTriggered && distanceFromBottom <= config.movement.triggerThreshold) {
      this.triggerHandAnimation(element);
    }

    if (this.isFlipping) {
      const progress = Math.min((timestamp - this.flipStartTime) / config.movement.flipDuration, 1);
      const targetScale = this.dirH === "right" ? 1 : -1;
      const easing = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      this.scaleX = this.scaleX + (targetScale - this.scaleX) * easing;
      if (progress >= 1) this.isFlipping = false;
    }

    if (!this.isFlipping) {
      const off = config.movement.edgeOverflow;
      if (this.dirH === "right" && this.x >= vw - size.width + off) {
        this.dirH = "left"; this.isFlipping = true; this.flipStartTime = timestamp;
      } else if (this.dirH === "left" && this.x <= -off) {
        this.dirH = "right"; this.isFlipping = true; this.flipStartTime = timestamp;
      }
    }

    if (this.y >= vh - size.height - config.movement.bottomThreshold) {
      this.startRestartCycle(element);
      return;
    }
    if (this.y < 0) this.dirV = "down";

    element.style.transform = `translate(${this.x}px, ${this.y}px) scaleX(${this.scaleX})`;
  },

  triggerHandAnimation(element) {
    animInstances.handTriggered = true;
    const handLayer = element.querySelector(".lottie-layer-hand");
    if (handLayer && animInstances.hand) {
      handLayer.style.transition = "opacity 0.3s ease-in";
      handLayer.style.opacity = "1";
      animInstances.hand.goToAndPlay(0, true);
    }
  },

  startRestartCycle(element) {
    this.isRestarting = true;
    element.style.transition = `opacity ${config.movement.fadeOutTime}ms ease-out`;
    element.style.opacity = "0";
  },
};

// ============================
// СТИЛИ И СОЗДАНИЕ
// ============================
function addResponsiveStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .lottie-wrap {
      width: ${config.animationSize.desktop.width}px;
      height: ${config.animationSize.desktop.height}px;
      position: fixed; z-index: 1000000;
      top: 0px; left: 0; pointer-events: none;
      will-change: transform, opacity;
      opacity: 0; 
      transition: opacity ${config.movement.fadeOutTime}ms ease-in;
    }
    .lottie-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    @media (max-width: 768px) {
      .lottie-wrap { width: ${config.animationSize.mobile.width}px; height: ${config.animationSize.mobile.height}px; }
    }
  `;
  document.head.appendChild(style);
}

function createWrap() {
  const parent = document.querySelector(config.wrapperSelector);
  if (!parent) return;

  const wrap = document.createElement("div");
  wrap.className = "lottie-wrap";

  ["snow", "main", "hand"].forEach((name) => {
    const layer = document.createElement("div");
    layer.className = `lottie-layer lottie-layer-${name}`;
    wrap.appendChild(layer);

    if (name === "main") {
      animInstances.main = lottie.loadAnimation({
        container: layer, renderer: "svg", loop: false, autoplay: false, path: config.mainAnim,
      });
    }
    if (name === "snow") {
      layer.style.opacity = "0";
      layer.style.transition = "opacity 1s ease-in";
      animInstances.snow = lottie.loadAnimation({
        container: layer, renderer: "svg", loop: true, autoplay: false, path: config.snowAnim,
      });
    }
    if (name === "hand") {
      layer.style.opacity = "0";
      animInstances.hand = lottie.loadAnimation({
        container: layer, renderer: "svg", loop: false, autoplay: false, path: config.handAnim,
      });
    }
  });

  parent.appendChild(wrap);

  // СЛУШАТЕЛЬ ОКОНЧАНИЯ FADE IN
  const onFadeInComplete = (e) => {
    if (e.propertyName !== 'opacity' || wrap.style.opacity !== '1') return;
    wrap.removeEventListener('transitionend', onFadeInComplete);

    // ШАГ 2: Контейнер полностью виден, запускаем анимацию персонажа
    if (animInstances.main) animInstances.main.play();
    if (animInstances.snow) {
      animInstances.snow.play();
      wrap.querySelector('.lottie-layer-snow').style.opacity = '1';
    }

    // ШАГ 3: Ждем задержку и начинаем полет
    setTimeout(() => {
      startWrapAnim(wrap);
    }, config.movement.delayWrapAnim);
  };

  wrap.addEventListener('transitionend', onFadeInComplete);

  // ЗАПУСК ЦЕПОЧКИ
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
       Mover.reset(wrap);
    });
  });
}

function startWrapAnim(wrap) {
  function loop(timestamp) {
    const params = getCurrentParams();
    Mover.update(timestamp, wrap, params.size, params.speeds);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

async function init() {
  await initLottie(); 
  addResponsiveStyles(); 
  createWrap(); 
}

document.addEventListener("DOMContentLoaded", init);