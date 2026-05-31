/*
  SPRK shared touch and pointer controls for canvas missions.

  Goals:
  - Tap / second finger -> action (Space)
  - Drag -> directional keys (arrows + WASD) or magnetic tracking on the player
  - Triple-tap play surface -> fullscreen toggle
  - Optional split zones for two-keyboard missions (WASD vs arrows)
*/

const SPRK_TOUCH = (() => {
  const DEFAULT_MOVEMENT = {
    left: ["arrowleft", "a"],
    right: ["arrowright", "d"],
    up: ["arrowup", "w"],
    down: ["arrowdown", "s"],
  };

  function isCoarsePointer() {
    return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
  }

  function flattenMovement(movement) {
    return {
      left: movement.left || DEFAULT_MOVEMENT.left,
      right: movement.right || DEFAULT_MOVEMENT.right,
      up: movement.up || DEFAULT_MOVEMENT.up,
      down: movement.down || DEFAULT_MOVEMENT.down,
    };
  }

  function allMovementKeys(movement) {
    const flat = flattenMovement(movement);
    return [...flat.left, ...flat.right, ...flat.up, ...flat.down];
  }

  function canvasPoint(target, event) {
    const rect = target.getBoundingClientRect();
    const scaleX = target.width / rect.width || 1;
    const scaleY = target.height / rect.height || 1;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      clientX: event.clientX,
      clientY: event.clientY,
    };
  }

  function showToast(message) {
    let toast = document.querySelector(".sprk-touch-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "sprk-touch-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");
    window.clearTimeout(showToast.hideTimer);
    showToast.hideTimer = window.setTimeout(() => toast.classList.remove("visible"), 1800);
  }

  function attach(config) {
    const target = config.target;
    if (!target) {
      throw new Error("SPRK_TOUCH.attach requires a target canvas or element.");
    }

    const keys = config.keys || null;
    const movement = flattenMovement(config.movement || DEFAULT_MOVEMENT);
    const actionKeys = config.actionKeys || [" "];
    const actionThresholdPx = config.actionThresholdPx ?? 14;
    const directionThresholdPx = config.directionThresholdPx ?? 10;
    const magnetic = config.magnetic || null;
    const onAction = typeof config.onAction === "function" ? config.onAction : null;
    const onDirection = typeof config.onDirection === "function" ? config.onDirection : null;
    const splitZones = Array.isArray(config.splitZones) ? config.splitZones : null;
    const fullscreenElement = config.fullscreenElement || target.closest(".sprk-play-surface") || target.parentElement;
    const coarsePointer = isCoarsePointer();
    const enableFullscreenTripleTap = config.enableFullscreenTripleTap === true
      || (config.enableFullscreenTripleTap !== false && !coarsePointer);
    const enableLongPressFullscreen = config.enableLongPressFullscreen !== false && coarsePointer;
    const longPressMs = config.longPressMs ?? 1200;
    const unlockSound = typeof config.unlockSound === "function" ? config.unlockSound : () => {};

    const moveKeyList = allMovementKeys(movement);
    const pointers = new Map();
    let primaryPointerId = null;
    let tripleTapTimes = [];
    let longPressTimer = null;

    target.classList.add("sprk-touch-target");
    const playSurface = target.closest(".sprk-play-surface");
    if (playSurface) {
      playSurface.classList.add("sprk-play-surface");
    }

    function clearMovement() {
      if (!keys) return;
      moveKeyList.forEach((key) => keys.delete(key));
    }

    function pressDirection(dx, dy, activeMovement) {
      if (onDirection) {
        if (Math.abs(dx) < directionThresholdPx && Math.abs(dy) < directionThresholdPx) {
          return;
        }
        if (Math.abs(dx) >= Math.abs(dy)) {
          onDirection(dx < 0 ? -1 : 1, 0);
        } else {
          onDirection(0, dy < 0 ? -1 : 1);
        }
        return;
      }
      if (!keys) return;
      clearMovement();
      if (Math.abs(dx) < directionThresholdPx && Math.abs(dy) < directionThresholdPx) {
        return;
      }
      const m = flattenMovement(activeMovement || movement);
      if (Math.abs(dx) >= Math.abs(dy)) {
        (dx < 0 ? m.left : m.right).forEach((key) => keys.add(key));
      } else {
        (dy < 0 ? m.up : m.down).forEach((key) => keys.add(key));
      }
    }

    function pulseAction() {
      unlockSound();
      if (onAction) {
        onAction();
        return;
      }
      if (!keys) return;
      actionKeys.forEach((key) => keys.add(key));
      window.setTimeout(() => actionKeys.forEach((key) => keys.delete(key)), 90);
    }

    function zoneMovement(clientX) {
      if (!splitZones || splitZones.length < 2) {
        return movement;
      }
      const rect = target.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      return ratio < 0.5 ? splitZones[0].movement : splitZones[1].movement;
    }

    function magneticActive() {
      if (!magnetic || typeof magnetic.isEnabled === "function" && !magnetic.isEnabled()) {
        return false;
      }
      return true;
    }

    function tryMagnetic(point, pointerState) {
      if (!magneticActive() || !pointerState) return false;
      const focus = magnetic.getFocusPoint();
      if (!focus) return false;
      const radius = magnetic.radius ?? 64;
      const distance = Math.hypot(point.x - focus.x, point.y - focus.y);
      if (distance > radius && !pointerState.magneticGrab) {
        return false;
      }
      pointerState.magneticGrab = true;
      magnetic.applyFocusPoint(point.x, point.y, pointerState);
      clearMovement();
      return true;
    }

    function pointerRole(pointerId) {
      if (primaryPointerId === null || primaryPointerId === pointerId) {
        return "move";
      }
      return "action";
    }

    function onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      if (event.target.closest("button, input, select, textarea, a, label")) {
        return;
      }
      event.preventDefault();
      target.setPointerCapture(event.pointerId);
      unlockSound();

      if (primaryPointerId === null) {
        primaryPointerId = event.pointerId;
      }

      const point = canvasPoint(target, event);
      const pointerState = {
        id: event.pointerId,
        startX: point.x,
        startY: point.y,
        lastX: point.x,
        lastY: point.y,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTime: performance.now(),
        magneticGrab: false,
        zoneMovement: zoneMovement(event.clientX),
        role: pointerRole(event.pointerId),
      };
      pointers.set(event.pointerId, pointerState);
      scheduleLongPress(pointerState);

      if (pointerState.role === "action") {
        pulseAction();
        return;
      }

      if (tryMagnetic(point, pointerState)) {
        return;
      }
      pressDirection(0, 0, pointerState.zoneMovement);
    }

    function onPointerMove(event) {
      const pointerState = pointers.get(event.pointerId);
      if (!pointerState) return;
      event.preventDefault();
      clearLongPressTimer();

      if (pointerState.role === "action") {
        return;
      }

      const point = canvasPoint(target, event);
      pointerState.lastX = point.x;
      pointerState.lastY = point.y;

      if (tryMagnetic(point, pointerState)) {
        return;
      }

      const dx = point.x - pointerState.startX;
      const dy = point.y - pointerState.startY;
      pressDirection(dx, dy, pointerState.zoneMovement);
    }

    function onPointerUp(event) {
      const pointerState = pointers.get(event.pointerId);
      if (!pointerState) return;
      event.preventDefault();
      clearLongPressTimer();

      if (pointerState.role !== "action") {
        const point = canvasPoint(target, event);
        const dx = point.x - pointerState.startX;
        const dy = point.y - pointerState.startY;
        const elapsed = performance.now() - pointerState.startTime;
        const isTap = elapsed < 260
          && Math.hypot(dx, dy) < actionThresholdPx
          && !pointerState.magneticGrab;
        if (isTap) {
          pulseAction();
        }
      }

      pointers.delete(event.pointerId);
      if (primaryPointerId === event.pointerId) {
        primaryPointerId = pointers.size ? [...pointers.keys()][0] : null;
      }
      if (pointers.size === 0) {
        clearMovement();
      }
      try {
        target.releasePointerCapture(event.pointerId);
      } catch (error) {
        /* ignore */
      }
    }

    function onPointerCancel(event) {
      onPointerUp(event);
    }

    function isExpanded() {
      const element = fullscreenElement || document.documentElement;
      return element.classList.contains("sprk-touch-expanded")
        || Boolean(document.fullscreenElement);
    }

    function setExpanded(on) {
      const element = fullscreenElement || document.documentElement;
      element.classList.toggle("sprk-touch-expanded", on);
      document.documentElement.classList.toggle("sprk-touch-fullscreen-active", on);
    }

    function toggleFullscreen() {
      const element = fullscreenElement || document.documentElement;
      const expanded = isExpanded();

      if (expanded) {
        setExpanded(false);
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        if (document.fullscreenElement && exit) {
          Promise.resolve(exit.call(document)).catch(() => {});
        }
        showToast("Fullscreen off");
        return;
      }

      if (coarsePointer) {
        setExpanded(true);
        showToast("Fullscreen on — tap Fullscreen again to exit");
        return;
      }

      const request = element.requestFullscreen || element.webkitRequestFullscreen;
      if (request) {
        Promise.resolve(request.call(element)).then(() => {
          document.documentElement.classList.add("sprk-touch-fullscreen-active");
          showToast("Fullscreen on — tap Fullscreen again to exit");
        }).catch(() => {
          setExpanded(true);
          showToast("Using expanded play area (browser fullscreen blocked)");
        });
        return;
      }

      setExpanded(true);
      showToast("Fullscreen on — tap Fullscreen again to exit");
    }

    function clearLongPressTimer() {
      if (longPressTimer) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    function scheduleLongPress(pointerState) {
      if (!enableLongPressFullscreen || pointerState.role === "action") {
        return;
      }
      clearLongPressTimer();
      longPressTimer = window.setTimeout(() => {
        longPressTimer = null;
        if (!pointers.has(pointerState.id)) {
          return;
        }
        const point = { x: pointerState.lastX, y: pointerState.lastY };
        const dx = point.x - pointerState.startX;
        const dy = point.y - pointerState.startY;
        if (Math.hypot(dx, dy) < actionThresholdPx * 2) {
          toggleFullscreen();
        }
      }, longPressMs);
    }

    function onTripleTap(event) {
      if (!enableFullscreenTripleTap) return;
      if (event.target.closest("button, input, select, textarea, a, label")) return;
      const now = performance.now();
      tripleTapTimes = tripleTapTimes.filter((time) => now - time < 650);
      tripleTapTimes.push(now);
      if (tripleTapTimes.length >= 3) {
        tripleTapTimes = [];
        event.preventDefault();
        toggleFullscreen();
      }
    }

    target.addEventListener("pointerdown", onPointerDown, { passive: false });
    target.addEventListener("pointermove", onPointerMove, { passive: false });
    target.addEventListener("pointerup", onPointerUp, { passive: false });
    target.addEventListener("pointercancel", onPointerCancel, { passive: false });
    target.addEventListener("pointerdown", onTripleTap, { passive: false });

    window.addEventListener("blur", () => {
      pointers.clear();
      primaryPointerId = null;
      clearMovement();
    });

    if (config.fullscreenButton) {
      config.fullscreenButton.addEventListener("click", (event) => {
        event.preventDefault();
        unlockSound();
        toggleFullscreen();
      });
    }

    return {
      toggleFullscreen,
      destroy() {
        clearLongPressTimer();
        target.removeEventListener("pointerdown", onPointerDown);
        target.removeEventListener("pointermove", onPointerMove);
        target.removeEventListener("pointerup", onPointerUp);
        target.removeEventListener("pointercancel", onPointerCancel);
        target.removeEventListener("pointerdown", onTripleTap);
      },
    };
  }

  return {
    attach,
    isCoarsePointer,
  };
})();
