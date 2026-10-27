import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { travelLocations, type TravelLocation } from "../../data/travel/locations";

const Globe = lazy(() => import("./TravelGlobeCanvas"));

class GlobeBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { this.props.onFailure(); console.error("Travel globe could not start", error, info); }
  render() { return this.state.failed ? <div className="travel-globe-fallback" role="status">The 3D globe is unavailable here. Choose a destination from the list to explore its story.</div> : this.props.children; }
}

export default function TravelExplorer() {
  const [selected, setSelected] = useState<TravelLocation | null>(null);
  const [hovered, setHovered] = useState<TravelLocation | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const close = useCallback(() => {
    setSelected(null);
    setPhotoIndex(0);
    requestAnimationFrame(() => returnFocus.current?.focus());
  }, []);
  const select = useCallback((location: TravelLocation, trigger?: HTMLElement) => {
    if (trigger) returnFocus.current = trigger;
    setSelected(location);
    setPhotoIndex(0);
  }, []);
  const movePhoto = useCallback((direction: number) => {
    if (!selected?.photos.length) return;
    setPhotoIndex((index) => (index + direction + selected.photos.length) % selected.photos.length);
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") movePhoto(-1);
      if (event.key === "ArrowRight") movePhoto(1);
      if (event.key === "Tab") {
        const focusable = document.querySelectorAll<HTMLElement>(".travel-card button");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selected, close, movePhoto]);

  const activePhoto = selected?.photos[photoIndex];
  return <div className="travel-explorer">
    <section className="travel-copy" aria-labelledby="travel-title">
      <div className="travel-eyebrow"><span></span> Field notes / Pakistan</div>
      <h1 id="travel-title">The long way<br /><em>stays with you.</em></h1>
      <p>A growing record of roads, mountain air, and places worth returning to.</p>
      <div className="travel-copy-hint"><span aria-hidden="true">↗</span> Choose a pin or place to begin</div>
    </section>

    <div className="travel-stage" aria-label="Pakistan travel globe">
      <img className={`travel-earth-preview${ready ? " is-ready" : ""}`} src="/globe/earth-preview.webp" alt="" aria-hidden="true" />
      <GlobeBoundary onFailure={() => setFailed(true)}>
        <Suspense fallback={null}>
          <Globe selected={selected} onSelect={select} onHover={setHovered} onReady={() => setReady(true)} zoom={zoom} />
        </Suspense>
      </GlobeBoundary>
      {hovered && <div className="travel-hover-label" role="status">{hovered.name} <span>·</span> open destination</div>}
      <div className="travel-globe-controls" aria-label="Globe controls">
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(1.38, value + 0.12))}>+</button>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(0.72, value - 0.12))}>−</button>
      </div>
      <p className="travel-hint">Drag to rotate <span aria-hidden="true">·</span> scroll or pinch to zoom</p>
    </div>

    <aside className="travel-index" aria-label="Destinations">
      <div className="travel-index-heading"><span>On the map</span><span>06 places</span></div>
      <ul>
        {travelLocations.map((location, index) => <li key={location.id}>
          <button type="button" className={selected?.id === location.id ? "is-selected" : ""} onClick={(event) => select(location, event.currentTarget)}>
            <span className="travel-index-number">0{index + 1}</span>
            <span>{location.name}</span>
            <span className="travel-index-arrow" aria-hidden="true">↗</span>
          </button>
        </li>)}
      </ul>
      <p className="travel-seed-note">Approximate seed coordinates. This map grows with the journey.</p>
    </aside>

    {selected && <div className="travel-card-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <article className="travel-card" role="dialog" aria-modal="true" aria-labelledby="travel-card-title">
        <button ref={closeButton} className="travel-card-close" type="button" onClick={close} aria-label="Close destination details">×</button>
        <div className="travel-card-image">
          {activePhoto
            ? <img src={activePhoto.src} alt={activePhoto.alt} />
            : <div className="travel-photo-placeholder"><span>Photographs to add</span><small>Personal images will appear here</small></div>}
          {selected.photos.length > 1 && <div className="travel-photo-controls">
            <button type="button" onClick={() => movePhoto(-1)} aria-label="Previous photo">←</button>
            <span>{String(photoIndex + 1).padStart(2, "0")} / {String(selected.photos.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => movePhoto(1)} aria-label="Next photo">→</button>
          </div>}
        </div>
        <div className="travel-card-copy">
          <div className="travel-card-meta"><span>{selected.category}</span><span>{selected.latitude.toFixed(2)}° N · {selected.longitude.toFixed(2)}° E</span></div>
          <h2 id="travel-card-title">{selected.name}</h2>
          <p>{selected.description}</p>
          {selected.route && <small className="travel-route-note">{selected.route.label}</small>}
          <button className="travel-card-done" type="button" onClick={close}>Back to the globe <span aria-hidden="true">↗</span></button>
        </div>
      </article>
    </div>}
  </div>;
}
