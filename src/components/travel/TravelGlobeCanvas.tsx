import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { travelLocations, type TravelLocation } from "../../data/travel/locations";
import { focusQuaternion, latLonToVector3, makePakistanOutline, makeRouteGeometry } from "./geo";

type Props = {
  selected: TravelLocation | null;
  onSelect: (location: TravelLocation) => void;
  onHover: (location: TravelLocation | null) => void;
  onReady: () => void;
  zoom: number;
};

function Markers({ onSelect, onHover }: Pick<Props, "onSelect" | "onHover">) {
  const hovered = useRef<TravelLocation | null>(null);
  return <>
    {travelLocations.map((location) => {
      const point = latLonToVector3(location.latitude, location.longitude, 1.018);
      return <group key={location.id} position={point}>
        <mesh
          onClick={(event) => { event.stopPropagation(); onSelect(hovered.current ?? location); }}
          onPointerOver={(event) => { event.stopPropagation(); hovered.current = location; document.body.style.cursor = "pointer"; onHover(location); }}
          onPointerOut={(event) => { event.stopPropagation(); if (hovered.current?.id === location.id) { hovered.current = null; onHover(null); } document.body.style.cursor = ""; }}
        >
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.014, 12, 12]} />
          <meshBasicMaterial color="#b9ff4d" />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshBasicMaterial color="#b9ff4d" transparent opacity={0.12} depthWrite={false} />
        </mesh>
      </group>;
    })}
  </>;
}

function EarthScene({ selected, onSelect, onHover, onReady, zoom }: Props) {
  const earth = useRef<THREE.Group>(null);
  const map = useLoader(THREE.TextureLoader, "/globe/earth-blue-marble.jpg");
  const data = useLoader(THREE.FileLoader, "/globe/pakistan.geojson");
  const { camera, gl, size } = useThree();
  const target = useRef(focusQuaternion(30.5, 69.5));
  const desiredZoom = useRef(3.15);
  const activePointers = useRef(new Map<number, [number, number]>());
  const dragging = useRef(false);
  const hoveringPin = useRef(false);
  const last = useRef<[number, number] | null>(null);
  const idle = useRef(0);
  const outline = useMemo(() => makePakistanOutline(JSON.parse(data as string), 1.008), [data]);
  const route = useMemo(() => {
    const routeData = travelLocations.find((location) => location.route)?.route;
    return routeData ? makeRouteGeometry(routeData.coordinates, 1.012) : null;
  }, []);
  const idleAllowed = useMemo(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; }, [map]);
  useEffect(() => {
    if (selected) target.current.copy(focusQuaternion(selected.latitude, selected.longitude));
    else target.current.copy(focusQuaternion(30.5, 69.5));
  }, [selected]);
  useEffect(() => {
    const fitDistance = Math.max(3.4, 1.08 / (Math.tan(THREE.MathUtils.degToRad(36 / 2)) * size.width / size.height));
    desiredZoom.current = fitDistance * (selected ? 0.84 : 1) / zoom;
  }, [zoom, selected, size.width, size.height]);
  useEffect(() => {
    const element = gl.domElement;
    element.style.touchAction = "none";
    const pointerDown = (event: PointerEvent) => {
      activePointers.current.set(event.pointerId, [event.clientX, event.clientY]);
      element.setPointerCapture(event.pointerId);
      dragging.current = true;
      last.current = [event.clientX, event.clientY];
      idle.current = 0;
    };
    const pointerMove = (event: PointerEvent) => {
      const prior = activePointers.current.get(event.pointerId);
      if (!prior) return;
      if (activePointers.current.size >= 2) {
        const points = [...activePointers.current.values()];
        const oldOther = points.find((point) => point !== prior) ?? points[0];
        const oldDist = Math.hypot(prior[0] - oldOther[0], prior[1] - oldOther[1]);
        const newDist = Math.hypot(event.clientX - oldOther[0], event.clientY - oldOther[1]);
        if (oldDist > 0 && newDist > 0) desiredZoom.current = THREE.MathUtils.clamp(desiredZoom.current * oldDist / newDist, 2.2, 5.2);
      } else if (last.current && earth.current) {
        const dx = event.clientX - last.current[0];
        const dy = event.clientY - last.current[1];
        const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.005);
        const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.005);
        target.current.premultiply(yaw).multiply(pitch);
      }
      activePointers.current.set(event.pointerId, [event.clientX, event.clientY]);
      last.current = [event.clientX, event.clientY];
    };
    const pointerUp = (event: PointerEvent) => {
      activePointers.current.delete(event.pointerId);
      if (!activePointers.current.size) { dragging.current = false; last.current = null; }
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      desiredZoom.current = THREE.MathUtils.clamp(desiredZoom.current + event.deltaY * 0.002, 2.2, 5.2);
    };
    element.addEventListener("pointerdown", pointerDown);
    element.addEventListener("pointermove", pointerMove);
    element.addEventListener("pointerup", pointerUp);
    element.addEventListener("pointercancel", pointerUp);
    element.addEventListener("wheel", wheel, { passive: false });
    return () => {
      element.removeEventListener("pointerdown", pointerDown);
      element.removeEventListener("pointermove", pointerMove);
      element.removeEventListener("pointerup", pointerUp);
      element.removeEventListener("pointercancel", pointerUp);
      element.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useEffect(() => { onReady(); }, [onReady]);
  useFrame((_, delta) => {
    if (earth.current) {
      idle.current += delta;
      if (!dragging.current && !hoveringPin.current && !selected && idleAllowed) {
        const drift = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), delta * 0.014);
        target.current.premultiply(drift);
      }
      if (idleAllowed) earth.current.quaternion.slerp(target.current, 1 - Math.exp(-delta * (dragging.current ? 14 : 2.5)));
      else earth.current.quaternion.copy(target.current);
    }
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredZoom.current, 3.5, delta);
  });

  return <>
    <ambientLight intensity={0.72} />
    <directionalLight position={[4, 2, 5]} intensity={2.2} />
    <group ref={earth}>
      <mesh onClick={(event) => event.stopPropagation()}>
        <sphereGeometry args={[1, 96, 64]} />
        <meshStandardMaterial map={map} roughness={1} metalness={0} />
      </mesh>
      <mesh scale={1.04}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial color="#55d99b" side={THREE.BackSide} transparent opacity={0.09} />
      </mesh>
      <lineSegments geometry={outline}>
        <lineBasicMaterial color="#b9ff4d" transparent opacity={0.95} />
      </lineSegments>
      {route && <lineSegments geometry={route}>
        <lineBasicMaterial color="#b9ff4d" transparent opacity={0.55} />
      </lineSegments>}
      <Markers onSelect={onSelect} onHover={(location) => { hoveringPin.current = !!location; onHover(location); }} />
    </group>
  </>;
}

export default function TravelGlobeCanvas(props: Props) {
  return <Canvas
    camera={{ position: [0, 0, 3.4], fov: 36, near: 0.1, far: 50 }}
    dpr={[1, 1.5]}
    gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    onCreated={({ gl }) => { gl.setClearColor("#080a09", 0); }}
    aria-label="Interactive globe showing travel locations in Pakistan"
  >
    <Suspense fallback={null}><EarthScene {...props} /></Suspense>
  </Canvas>;
}
