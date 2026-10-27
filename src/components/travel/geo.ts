import * as THREE from "three";

/** Geographic coordinates to Three.js sphere coordinates (equirectangular map orientation). */
export function latLonToVector3(latitude: number, longitude: number, radius: number): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - latitude);
  const theta = THREE.MathUtils.degToRad(longitude + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export function makePakistanOutline(geojson: any, radius: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const feature = geojson.features?.find((item: any) =>
    item.properties?.ADMIN === "Pakistan" || item.properties?.NAME === "Pakistan" || item.properties?.name === "Pakistan",
  );
  if (!feature) return new THREE.BufferGeometry();

  const polygons = feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let index = 0; index < ring.length - 1; index += 1) {
        const a = latLonToVector3(ring[index][1], ring[index][0], radius);
        const b = latLonToVector3(ring[index + 1][1], ring[index + 1][0], radius);
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export function makeRouteGeometry(coordinates: [longitude: number, latitude: number][], radius: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const [lonA, latA] = coordinates[index];
    const [lonB, latB] = coordinates[index + 1];
    const from = latLonToVector3(latA, lonA, 1).normalize();
    const to = latLonToVector3(latB, lonB, 1).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(from, to);
    for (let step = 0; step < 24; step += 1) {
      const start = new THREE.Quaternion().identity().slerp(rotation, step / 24);
      const end = new THREE.Quaternion().identity().slerp(rotation, (step + 1) / 24);
      points.push(from.clone().applyQuaternion(start).multiplyScalar(radius));
      points.push(from.clone().applyQuaternion(end).multiplyScalar(radius));
    }
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

export function focusQuaternion(latitude: number, longitude: number): THREE.Quaternion {
  const direction = latLonToVector3(latitude, longitude, 1).normalize();
  return new THREE.Quaternion().setFromUnitVectors(direction, new THREE.Vector3(0, 0, 1));
}
