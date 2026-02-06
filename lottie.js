// ============================
// КОНФИГУРАЦИЯ
// ============================
const config = {
  wrapperSelector: ".wrapper",
  animationPath:
    // "https://storage.yandexcloud.net/external-assets/tantum/animations/lottie/jump.json",
    "sani.json",

  animationSize: {
    desktop: { width: 456, height: 344 },
    mobile: { width: 292, height: 208 },
  },

  snowTrails: {
    enabled: true,
    lottiePath:
      "https://storage.yandexcloud.net/external-assets/tantum/animations/lottie/snow.json",
    size: {
      desktop: { width: 456, height: 344 },
      mobile: { width: 292, height: 208 },
    },
    opacity: 1,
    zIndex: "1001",
    showOnMovement: true,
    fadeInDuration: 500,
    fadeOutDuration: 1000,
    trailDelay: 300,
    reflectWithMain: true,
  },

  movement: {
    enabled: true,
    speeds: {
      desktop: { horizontal: 230, vertical: 50 },
      mobile: { horizontal: 100, vertical: 50 },
    },
    moveInViewport: true,
    startDelay: 1000,
    startPosition: { x: "left", y: "top" },
    bounceAtEdges: true,
    edgeMargin: 0,
    edgeOverflow: 65, // Глубина ухода за край при движении
    flipAnimation: true,
    flipDuration: 300,
    pauseOnHover: true,
    oneTime: false,
    restartOnBottom: true,
    restartDelay: 10000,
    bottomThreshold: 10,
  },

  delays: {
    containerAppearance: 500,
    animationStart: 500,
    movementStart: 2300,
  },

  animationStyles: {
    pointerEvents: "none",
    zIndex: "1001",
    transformOrigin: "center center",
    willChange: "transform",
  },
};

// ============================
// УТИЛИТЫ ДЛЯ ОПРЕДЕЛЕНИЯ УСТРОЙСТВА
// ============================

// Функция для определения типа устройства
function getDeviceType() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const isTablet = window.matchMedia(
    "(min-width: 769px) and (max-width: 1024px)",
  ).matches;
  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}
// Функция для получения размеров анимации
function getAnimationSize() {
  const device = getDeviceType();
  return config.animationSize[device] || config.animationSize.desktop;
}
// Функция для получения размеров следов снега
function getSnowTrailsSize() {
  const device = getDeviceType();
  return config.snowTrails.size[device] || config.snowTrails.size.desktop;
}
// Функция для получения скоростей движения
function getMovementSpeeds() {
  const device = getDeviceType();
  const speeds =
    config.movement.speeds[device] || config.movement.speeds.desktop;
  return {
    horizontalSpeed: speeds.horizontal,
    verticalSpeed: speeds.vertical,
  };
}

// ============================
// ОСНОВНОЙ СКРИПТ
// ============================

document.addEventListener("DOMContentLoaded", function () {
  const wrapper = document.querySelector(config.wrapperSelector);
  if (!wrapper) return;

  // Установка относительного позиционирования для обертки, если оно не задано
  if (window.getComputedStyle(wrapper).position === "static") {
    wrapper.style.position = "relative";
  }

  // Получение актуальных параметров из конфига в зависимости от устройства
  const animationSize = getAnimationSize();
  const snowTrailsSize = getSnowTrailsSize();
  const movementSpeeds = getMovementSpeeds();

  // Создание DOM-элементов для маскота и эффекта снега
  const lottieContainer = createLottieContainer(animationSize);
  const snowTrailsContainer = createSnowTrailsContainer(snowTrailsSize);

  // Цепочка таймаутов для плавного появления маскота на странице
  setTimeout(() => {
    wrapper.appendChild(snowTrailsContainer);
    wrapper.appendChild(lottieContainer);

    // Фиксация элементов относительно вьюпорта (экрана), если включено в конфиге
    if (config.movement.moveInViewport) {
      makeFixedToViewport(lottieContainer);
      makeFixedToViewport(snowTrailsContainer);
    }

    setTimeout(() => {
      // Инициализация Lottie-анимаций (загрузка JSON и запуск плеера)
      const mainAnimation = initLottie(lottieContainer, config.animationPath);
      const snowAnimation = initLottie(
        snowTrailsContainer,
        config.snowTrails.lottiePath,
        true,
      );

      // Запуск логики перемещения по экрану после задержки
      if (config.movement.enabled) {
        const movementDelay =
          config.delays?.movementStart || config.movement.startDelay;
        setTimeout(() => {
          startMovementAnimation(
            lottieContainer,
            snowTrailsContainer,
            mainAnimation,
            snowAnimation,
            animationSize,
            snowTrailsSize,
            movementSpeeds,
          );
        }, movementDelay);
      }
    }, config.delays.animationStart);
  }, config.delays.containerAppearance);

  /**
   * Создает основной контейнер для Lottie маскота.
   */
  function createLottieContainer(size) {
    const container = document.createElement("div");
    container.className = "lottie-mascot-main";
    Object.assign(container.style, {
      position: "fixed",
      width: `${size.width}px`,
      height: `${size.height}px`,
      opacity: "0",
      transition: "opacity 0.5s ease-in",
      pointerEvents: "none",
      ...config.animationStyles,
    });
    return container;
  }

  /**
   * Создает контейнер для снежного шлейфа, который следует за маскотом.
   */
  function createSnowTrailsContainer(size) {
    if (!config.snowTrails.enabled) return null;
    const container = document.createElement("div");
    container.className = "snow-trails-container";
    Object.assign(container.style, {
      position: "fixed",
      width: `${size.width}px`,
      height: `${size.height}px`,
      opacity: "0",
      pointerEvents: "none",
      zIndex: config.snowTrails.zIndex,
      transformOrigin: "center center",
      transition: `opacity ${config.snowTrails.fadeInDuration}ms ease-in`,
      display: "block",
    });
    return container;
  }

  /**
   * Устанавливает начальные CSS свойства для фиксации элемента в окне браузера.
   */
  function makeFixedToViewport(container) {
    if (!container) return;
    container.style.position = "fixed";
    container.style.left = "0px";
    container.style.top = "70px";
  }

  /**
   * Инициализирует библиотеку Lottie. Если библиотека не загружена, подгружает её через CDN.
   */
  function initLottie(container, path, isSnowTrails = false) {
    if (!container) return null;
    if (typeof lottie === "undefined") {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
      script.onload = () => loadAnimation(container, path, isSnowTrails);
      document.head.appendChild(script);
      return null;
    }
    return loadAnimation(container, path, isSnowTrails);
  }

  /**
   * Вызывает метод загрузки анимации Lottie и вешает обработчик на появление.
   */
  function loadAnimation(container, path, isSnowTrails = false) {
    const animation = lottie.loadAnimation({
      container: container,
      renderer: "svg",
      loop: isSnowTrails,
      autoplay: true,
      path: path,
    });
    animation.addEventListener("DOMLoaded", () => {
      if (!isSnowTrails) container.style.opacity = "1";
    });
    return animation;
  }

  /**
   * ГЛАВНАЯ ФУНКЦИЯ ДВИЖЕНИЯ
   * Содержит в себе логику перемещения, отскоков, разворотов и рестарта.
   */
  function startMovementAnimation(
    mainContainer,
    snowContainer,
    mainAnimation,
    snowAnimation,
    animationSize,
    snowTrailsSize,
    movementSpeeds,
  ) {
    // Внутренние переменные состояния анимации
    let animationId = null;
    let lastTimestamp = null; // Для расчета deltaTime (плавность)
    let isPaused = false;
    let isFlipping = false; // Состояние разворота маскота
    let flipStartTime = null;
    let currentDirection = "right"; // Горизонтальное направление
    let verticalDirection = "down"; // Вертикальное направление
    let flipProgress = 0;
    let animationCompleted = false;
    let isRestarting = false; // Флаг процесса перезагрузки
    let restartTimeoutId = null;
    let initialPosition = null; // Сохранение точки старта
    let initialDirection = null;
    let initialScaleX = null;
    let initialMovementDelay = null;
    let isFirstPlay = true;
    let snowTrailsVisible = false;
    let snowTrailsShown = false;
    let movementStarted = false;
    let currentX = 0;
    let currentY = 0;
    let scaleX = 1; // 1 - смотрит вправо, -1 - смотрит влево
    let lastFlipTime = 0; // Для предотвращения слишком частых разворотов
    const flipCooldown = 300;

    let horizontalSpeed = movementSpeeds.horizontalSpeed;
    let verticalSpeed = movementSpeeds.verticalSpeed;
    let currentWindowWidth = window.innerWidth;

    /**
     * Проверяет, коснулся ли маскот нижней границы экрана.
     */
    function isAtBottom() {
      const viewportHeight = window.innerHeight;
      const elementHeight = animationSize.height;
      return (
        currentY + elementHeight >=
        viewportHeight - (config.movement.bottomThreshold || 10)
      );
    }

    /**
     * Сохраняет текущие параметры в начальные для будущего рестарта.
     */
    function saveInitialPosition() {
      initialPosition = { x: currentX, y: currentY };
      initialDirection = currentDirection;
      initialScaleX = scaleX;
      initialMovementDelay =
        config.delays?.movementStart || config.movement.startDelay;
    }

    /**
     * Возвращает маскота в точку старта.
     */
    function restoreInitialPosition() {
      if (!initialPosition) return;
      currentX = initialPosition.x;
      currentY = initialPosition.y;
      currentDirection = initialDirection;
      scaleX = initialScaleX;
      mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
    }

    /**
     * Останавливает текущее движение, скрывает маскота и запускает его снова через задержку.
     */
    function restartAnimation() {
      if (isRestarting || animationCompleted) return;
      isRestarting = true;
      isFirstPlay = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (snowContainer && snowTrailsVisible) hideSnowTrails();

      mainContainer.style.transition = "opacity 1s ease-out";
      mainContainer.style.opacity = "0";
      if (mainAnimation) mainAnimation.pause();
      if (snowAnimation) snowAnimation.pause();

      // restartTimeoutId = setTimeout(() => {
      //   movementStarted = false;
      //   snowTrailsShown = false;
      //   snowTrailsVisible = false;
      //   lastTimestamp = null;
      //   isFlipping = false;
      //   restoreInitialPosition();
      //   verticalDirection = "down";
      //   mainContainer.style.transition = "opacity 0.8s ease-in";
      //   mainContainer.style.opacity = "1";
      //   if (mainAnimation) mainAnimation.goToAndPlay(0);
      //   if (snowAnimation) snowAnimation.goToAndPlay(0);

      //   setTimeout(() => {
      //     isRestarting = false;
      //     animationId = requestAnimationFrame(animate);
      //   }, initialMovementDelay);
      // }, config.movement.restartDelay);
    }

    /**
     * Плавно проявляет снежный шлейф при начале движения.
     */
    function showSnowTrails() {
      if (
        !snowContainer ||
        snowTrailsShown ||
        !config.snowTrails.showOnMovement
      )
        return;
      snowTrailsShown = true;
      snowContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
      setTimeout(() => {
        if (snowContainer && !animationCompleted && !isRestarting) {
          snowContainer.style.transition = `opacity ${config.snowTrails.fadeInDuration}ms ease-in`;
          snowContainer.style.opacity = config.snowTrails.opacity;
          snowTrailsVisible = true;
        }
      }, config.snowTrails.trailDelay);
    }

    /**
     * Плавно скрывает снежный шлейф (например, при паузе или рестарте).
     */
    function hideSnowTrails() {
      if (!snowContainer || !snowTrailsVisible) return;
      snowTrailsVisible = false;
      snowContainer.style.transition = `opacity ${config.snowTrails.fadeOutDuration}ms ease-out`;
      snowContainer.style.opacity = "0";
      setTimeout(() => {
        if (
          snowContainer &&
          !animationCompleted &&
          !snowTrailsVisible &&
          !isRestarting
        ) {
          snowTrailsShown = false;
        }
      }, config.snowTrails.fadeOutDuration + 100);
    }

    /**
     * Устанавливает координаты X и Y в зависимости от настроек старта (слева/справа).
     */
    function setInitialPosition() {
      const vw = window.innerWidth;
      const ew = animationSize.width;

      if (config.movement.startPosition.x === "left") {
        currentX = 0;
        currentDirection = "right";
        scaleX = 1;
      } else if (config.movement.startPosition.x === "right") {
        currentX = vw - ew;
        currentDirection = "left";
        scaleX = -1;
      } else {
        currentX = 0;
      }

      currentY = 0;
      verticalDirection = "down";
      mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
      saveInitialPosition();
    }

    setInitialPosition();

    /**
     * Детектор столкновения с левой и правой границей экрана.
     */
    function shouldBounceHorizontal(x, vw, ew) {
      if (!config.movement.bounceAtEdges) return false;
      const overflow = config.movement.edgeOverflow;
      if (currentDirection === "left" && x <= -overflow) return true;
      if (currentDirection === "right" && x >= vw - ew + overflow) return true;
      return false;
    }

    /**
     * Детектор столкновения с верхней и нижней границей экрана.
     */
    function shouldBounceVertical(y, vh, eh) {
      if (!config.movement.bounceAtEdges) return false;
      if (verticalDirection === "down" && y >= vh - eh) {
        return !config.movement.restartOnBottom;
      }
      if (verticalDirection === "up" && y <= 0) return true;
      return false;
    }

    /**
     * Анимация разворота (flip) маскота по горизонтали.
     * Использует математику плавности (easing).
     */
    function updateFlip(timestamp) {
      if (!flipStartTime) return false;
      flipProgress = Math.min(
        (timestamp - flipStartTime) / config.movement.flipDuration,
        1,
      );
      const targetScaleX = currentDirection === "right" ? 1 : -1;
      const easing =
        flipProgress < 0.5
          ? 2 * flipProgress * flipProgress
          : 1 - Math.pow(-2 * flipProgress + 2, 2) / 2;
      scaleX = scaleX + (targetScaleX - scaleX) * easing;
      mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
      if (flipProgress >= 1) {
        isFlipping = false;
        flipStartTime = null;
        scaleX = targetScaleX;
        return false;
      }
      return true;
    }

    /**
     * Основной расчет координат на каждом кадре.
     */
    function updatePosition(timestamp) {
      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        return;
      }
      // Рассчитываем время между кадрами для одинаковой скорости на любых мониторах
      const deltaTime = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      // Приращение координат
      currentX +=
        (currentDirection === "right" ? horizontalSpeed : -horizontalSpeed) *
        deltaTime;
      currentY +=
        (verticalDirection === "down" ? verticalSpeed : -verticalSpeed) *
        deltaTime;

      if (!movementStarted) {
        movementStarted = true;
        showSnowTrails();
      }

      // Если маскот упал вниз — запускаем рестарт
      if (config.movement.restartOnBottom && isAtBottom() && !isRestarting) {
        restartAnimation();
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ew = animationSize.width;
      const eh = animationSize.height;
      const overflow = config.movement.edgeOverflow;

      // Обработка горизонтального отскока и запуска разворота
      if (
        shouldBounceHorizontal(currentX, vw, ew) &&
        !isFlipping &&
        timestamp - lastFlipTime > flipCooldown
      ) {
        isFlipping = true;
        flipStartTime = timestamp;
        lastFlipTime = timestamp;
        currentDirection = currentDirection === "right" ? "left" : "right";
      }

      // Обработка вертикального отскока
      if (shouldBounceVertical(currentY, vh, eh)) {
        verticalDirection = verticalDirection === "down" ? "up" : "down";
      }

      // Ограничение координат, чтобы маскот не улетал в бесконечность
      currentX = Math.max(-overflow, Math.min(currentX, vw - ew + overflow));
      currentY = Math.max(0, Math.min(currentY, vh - eh));

      // Применение трансформации к DOM
      mainContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
      if (snowContainer && snowTrailsVisible) {
        snowContainer.style.transform = `translate(${currentX}px, ${currentY}px) scaleX(${scaleX})`;
      }
    }

    /**
     * Цикл анимации через RequestAnimationFrame.
     */
    function animate(timestamp) {
      if (isPaused || animationCompleted || isRestarting) {
        if (!animationCompleted && !isRestarting)
          animationId = requestAnimationFrame(animate);
        return;
      }
      if (isFlipping) updateFlip(timestamp);
      updatePosition(timestamp);
      if (!animationCompleted && !isRestarting)
        animationId = requestAnimationFrame(animate);
    }

    // Первый запуск цикла
    if (isFirstPlay) animationId = requestAnimationFrame(animate);

    // Слушатели событий для паузы при наведении
    if (config.movement.pauseOnHover) {
      mainContainer.addEventListener("mouseenter", () => {
        isPaused = true;
        hideSnowTrails();
      });
      mainContainer.addEventListener("mouseleave", () => {
        isPaused = false;
        showSnowTrails();
      });
    }

    /**
     * Пересчет параметров при изменении размера окна (Resize).
     */
    window.addEventListener("resize", () => {
      if (animationCompleted) return;
      const newWidth = window.innerWidth;
      if (newWidth === currentWindowWidth) return;
      currentWindowWidth = newWidth;

      if (restartTimeoutId) clearTimeout(restartTimeoutId);
      const newSize = getAnimationSize();
      const newSpeeds = getMovementSpeeds();

      // Обновляем размеры контейнеров
      mainContainer.style.width = `${newSize.width}px`;
      mainContainer.style.height = `${newSize.height}px`;
      if (snowContainer) {
        snowContainer.style.width = `${newSize.width}px`;
        snowContainer.style.height = `${newSize.height}px`;
      }

      horizontalSpeed = newSpeeds.horizontalSpeed;
      verticalSpeed = newSpeeds.verticalSpeed;
      isRestarting = false;
      if (animationId) cancelAnimationFrame(animationId);
      lastTimestamp = null;
      animationId = requestAnimationFrame(animate);
    });
  }
});
