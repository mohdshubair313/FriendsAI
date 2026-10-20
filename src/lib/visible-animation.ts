/** Run canvas animation only while its element and browser tab are visible. */
export function visibleAnimation(element: Element, draw: FrameRequestCallback) {
  let frame = 0;
  let visible = false;
  let disposed = false;
  const tick = (time: number) => {
    draw(time);
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    if (!disposed && visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  observer.observe(element);
  document.addEventListener("visibilitychange", sync);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", sync);
  };
}
