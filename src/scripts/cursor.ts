const cursor = document.querySelector<HTMLElement>("#cursor");
const finePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
);

if (cursor) {
  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('a[href], button, [role="button"]'),
  );
  const attractDistance = 56;
  const releaseDistance = 88;

  let pointerX = 0;
  let pointerY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let activeTarget: HTMLElement | null = null;
  let frame = 0;
  let previousTime = 0;
  let hasPointer = false;

  const distanceToRect = (rect: DOMRect) =>
    Math.hypot(
      Math.max(rect.left - pointerX, 0, pointerX - rect.right),
      Math.max(rect.top - pointerY, 0, pointerY - rect.bottom),
    );

  const isAvailable = (target: HTMLElement, rect: DOMRect) => {
    if (
      !target.isConnected ||
      target.closest("[inert]") ||
      target.matches(":disabled") ||
      rect.width < 2 ||
      rect.height < 2 ||
      rect.right < 0 ||
      rect.left > innerWidth ||
      rect.bottom < 0 ||
      rect.top > innerHeight
    ) return false;

    const style = getComputedStyle(target);
    return style.visibility !== "hidden" && style.pointerEvents !== "none" && Number(style.opacity) > 0.1;
  };

  const ping = () => {
    cursor.classList.remove("is-pinging");
    void cursor.offsetWidth;
    cursor.classList.add("is-pinging");
  };

  const chooseTarget = () => {
    let nearest: HTMLElement | null = null;
    let nearestDistance = attractDistance;
    for (const target of targets) {
      const rect = target.getBoundingClientRect();
      if (!isAvailable(target, rect)) continue;
      const distance = distanceToRect(rect);
      if (distance <= nearestDistance) {
        nearest = target;
        nearestDistance = distance;
      }
    }

    if (activeTarget) {
      const rect = activeTarget.getBoundingClientRect();
      const activeDistance = isAvailable(activeTarget, rect) ? distanceToRect(rect) : Infinity;
      if (activeDistance <= releaseDistance && (!nearest || nearest === activeTarget || nearestDistance + 12 >= activeDistance)) return;
    }

    if (nearest !== activeTarget) {
      activeTarget = nearest;
      cursor.classList.toggle("is-magnetized", Boolean(nearest));
    }
    if (nearest) {
      ping();
    } else {
      cursor.classList.remove("is-pinging");
    }
  };

  const render = (time: number) => {
    frame = 0;
    if (!hasPointer || !finePointer.matches) return;

    chooseTarget();
    let destinationX = pointerX;
    let destinationY = pointerY;

    if (activeTarget) {
      const rect = activeTarget.getBoundingClientRect();
      const background = getComputedStyle(activeTarget).backgroundColor.match(/[\d.]+/g)?.map(Number);
      const brightness = background ? .2126 * background[0] + .7152 * background[1] + .0722 * background[2] : 0;
      cursor.classList.toggle("is-on-light", Boolean(background && (background[3] ?? 1) > .2 && brightness > 160));
      // Small controls hold the dot at their centre. Larger links pull it just
      // inside their edge so the dot never jumps across an entire card.
      if (rect.width <= 220 && rect.height <= 120) {
        destinationX = rect.left + rect.width / 2;
        destinationY = rect.top + rect.height / 2;
      } else {
        const insetX = Math.min(28, rect.width / 2);
        const insetY = Math.min(28, rect.height / 2);
        destinationX = Math.max(rect.left + insetX, Math.min(pointerX, rect.right - insetX));
        destinationY = Math.max(rect.top + insetY, Math.min(pointerY, rect.bottom - insetY));
      }
    } else {
      cursor.classList.remove("is-on-light");
    }

    const elapsed = Math.min(time - (previousTime || time), 50);
    previousTime = time;
    const ease = 1 - Math.exp(-elapsed / (activeTarget ? 75 : 42));
    cursorX += (destinationX - cursorX) * ease;
    cursorY += (destinationY - cursorY) * ease;
    cursor.style.transform = `translate3d(${cursorX - 6}px, ${cursorY - 6}px, 0)`;

    if (Math.hypot(destinationX - cursorX, destinationY - cursorY) > 0.2) {
      frame = requestAnimationFrame(render);
    }
  };

  const schedule = () => {
    if (!frame && hasPointer && finePointer.matches) frame = requestAnimationFrame(render);
  };

  const reset = () => {
    activeTarget = null;
    hasPointer = false;
    previousTime = 0;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    cursor.classList.remove("is-visible", "is-magnetized", "is-pinging", "is-on-light");
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || !finePointer.matches) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!hasPointer) {
      cursorX = pointerX;
      cursorY = pointerY;
      hasPointer = true;
      cursor.classList.add("is-visible");
    }
    schedule();
  }, { passive: true });

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("blur", reset);
  document.addEventListener("pointerleave", reset);
  finePointer.addEventListener("change", reset);
  cursor.addEventListener("animationend", (event) => {
    if (event.animationName === "cursor-ping") cursor.classList.remove("is-pinging");
  });
}
