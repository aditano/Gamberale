import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { heightAt } from "./height";
import type { VillageTextures } from "./textures";
import type { Building, Collider } from "./types";

export type Buckets = {
  plaster: THREE.BufferGeometry[];
  plasterWarm: THREE.BufferGeometry[];
  stone: THREE.BufferGeometry[];
  roof: THREE.BufferGeometry[];
  wood: THREE.BufferGeometry[];
  dark: THREE.BufferGeometry[];
  shutterGreen: THREE.BufferGeometry[];
  shutterBrown: THREE.BufferGeometry[];
  shutterBlue: THREE.BufferGeometry[];
  copper: THREE.BufferGeometry[];
};

export function emptyBuckets(): Buckets {
  return {
    plaster: [],
    plasterWarm: [],
    stone: [],
    roof: [],
    wood: [],
    dark: [],
    shutterGreen: [],
    shutterBrown: [],
    shutterBlue: [],
    copper: [],
  };
}

export function wallQuad(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  y0: number,
  y1: number,
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const n = new THREE.Vector3(az - bz, 0, bx - ax).normalize();
  const positions = new Float32Array([
    ax, y0, az, bx, y0, bz, bx, y1, bz, ax, y0, az, bx, y1, bz, ax, y1, az,
  ]);
  const normals = new Float32Array([
    n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z,
  ]);
  const len = Math.hypot(bx - ax, bz - az);
  const ht = y1 - y0;
  const uvs = new Float32Array([0, 0, len / 4, 0, len / 4, ht / 3, 0, 0, len / 4, ht / 3, 0, ht / 3]);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return geo;
}

function boxAt(
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  rotY = 0,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.rotateY(rotY);
  g.translate(x, y, z);
  return g;
}

function withUv(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (geo.getAttribute("uv")) return geo;
  const pos = geo.getAttribute("position");
  if (!pos) return geo;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + pos.getZ(i)) * 0.08;
    uv[i * 2 + 1] = pos.getY(i) * 0.08;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

export function addHouse(b: Building, buckets: Buckets, colliders: Collider[]) {
  const fp = b.footprint;
  if (fp.length < 4) return;
  const y0 = heightAt(b.center[0], b.center[1]) - 0.15;
  const floors = Math.min(3, Math.max(1, b.floors ?? 2));
  const h = 2.7 * floors + 0.35;
  const variant = b.variant ?? 0;
  const wallBucket =
    variant % 6 === 2 || variant % 6 === 3
      ? buckets.stone
      : variant % 6 === 4
        ? buckets.plasterWarm
        : buckets.plaster;
  const shutterBucket =
    variant % 3 === 0 ? buckets.shutterGreen : variant % 3 === 1 ? buckets.shutterBrown : buckets.shutterBlue;

  let minX = Infinity,
    maxX = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  const n = fp.length - 1;
  for (let i = 0; i < n; i++) {
    const a = fp[i];
    const c = fp[i + 1];
    if (!a || !c) continue;
    minX = Math.min(minX, a[0]);
    maxX = Math.max(maxX, a[0]);
    minZ = Math.min(minZ, a[1]);
    maxZ = Math.max(maxZ, a[1]);
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    wallBucket.push(wallQuad(a[0], a[1], c[0], c[1], y0, y0 + h));
    if (variant % 6 === 4) {
      buckets.stone.push(wallQuad(a[0], a[1], c[0], c[1], y0, y0 + 1.15));
    }
    if (len > 3.4) {
      const count = Math.max(1, Math.floor(len / 3.3));
      for (let k = 0; k < count; k++) {
        const t = (k + 0.5) / count;
        const mx = a[0] + (c[0] - a[0]) * t;
        const mz = a[1] + (c[1] - a[1]) * t;
        const nx = (a[1] - c[1]) / len;
        const nz = (c[0] - a[0]) / len;
        const wx = mx + nx * 0.12;
        const wz = mz + nz * 0.12;
        const yaw = Math.atan2(c[0] - a[0], c[1] - a[1]);
        const wy = y0 + 1.15 + (k % 2) * 0.05 + Math.min(floors - 1, 1) * 1.15;
        buckets.dark.push(boxAt(wx, wy + 0.55, wz, 0.72, 1.05, 0.08, yaw));
        shutterBucket.push(boxAt(wx + nx * 0.05 + (c[0] - a[0]) / len * 0.42, wy + 0.55, wz + nz * 0.05, 0.16, 1.08, 0.06, yaw));
        shutterBucket.push(boxAt(wx + nx * 0.05 - (c[0] - a[0]) / len * 0.42, wy + 0.55, wz + nz * 0.05, 0.16, 1.08, 0.06, yaw));
        if (k % 2 === 0 && floors > 1) {
          buckets.wood.push(boxAt(wx + nx * 0.18, wy - 0.15, wz + nz * 0.18, 0.7, 0.16, 0.28, yaw));
        }
      }
      if (len > 4.2 && i % 2 === 0) {
        const t = 0.22;
        const mx = a[0] + (c[0] - a[0]) * t;
        const mz = a[1] + (c[1] - a[1]) * t;
        const nx = (a[1] - c[1]) / len;
        const nz = (c[0] - a[0]) / len;
        buckets.wood.push(
          boxAt(mx + nx * 0.14, y0 + 1.15, mz + nz * 0.14, 0.95, 2.15, 0.12, Math.atan2(c[0] - a[0], c[1] - a[1])),
        );
      }
    }
  }

  let longest = 0;
  let lx = 1,
    lz = 0;
  for (let i = 0; i < n; i++) {
    const a = fp[i];
    const c = fp[i + 1];
    if (!a || !c) continue;
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
    if (len > longest) {
      longest = len;
      lx = (c[0] - a[0]) / len;
      lz = (c[1] - a[1]) / len;
    }
  }
  const px = -lz;
  const pz = lx;
  const cx = b.center[0];
  const cz = b.center[1];
  const hw = (b.width ?? 6) * 0.52 + 0.4;
  const hd = (b.depth ?? 7) * 0.52 + 0.4;
  const ridge = 1.35 + floors * 0.08;
  const yE = y0 + h;
  const roofGeo = new THREE.BufferGeometry();
  const p = [
    cx - lx * hw - px * hd, yE, cz - lz * hw - pz * hd,
    cx + lx * hw - px * hd, yE, cz + lz * hw - pz * hd,
    cx + lx * hw, yE + ridge, cz + lz * hw,
    cx - lx * hw - px * hd, yE, cz - lz * hw - pz * hd,
    cx + lx * hw, yE + ridge, cz + lz * hw,
    cx - lx * hw, yE + ridge, cz - lz * hw,
    cx + lx * hw - px * hd, yE, cz + lz * hw - pz * hd,
    cx + lx * hw + px * hd, yE, cz + lz * hw + pz * hd,
    cx + lx * hw, yE + ridge, cz + lz * hw,
    cx - lx * hw + px * hd, yE, cz - lz * hw + pz * hd,
    cx - lx * hw - px * hd, yE, cz - lz * hw - pz * hd,
    cx - lx * hw, yE + ridge, cz - lz * hw,
    cx + lx * hw + px * hd, yE, cz + lz * hw + pz * hd,
    cx - lx * hw + px * hd, yE, cz - lz * hw + pz * hd,
    cx - lx * hw, yE + ridge, cz - lz * hw,
    cx + lx * hw + px * hd, yE, cz + lz * hw + pz * hd,
    cx - lx * hw, yE + ridge, cz - lz * hw,
    cx + lx * hw, yE + ridge, cz + lz * hw,
  ];
  roofGeo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  roofGeo.computeVertexNormals();
  buckets.roof.push(withUv(roofGeo));
  buckets.stone.push(boxAt(cx + lx * hw * 0.2, yE + ridge + 0.4, cz + lz * hw * 0.2, 0.48, 0.9, 0.48));

  if (variant % 7 === 0) {
    buckets.copper.push(boxAt(cx - lx * hw * 0.3, yE + ridge * 0.35, cz - lz * hw * 0.3, 0.55, 0.08, 0.55, 0.4));
    buckets.dark.push(boxAt(cx - lx * hw * 0.3, yE + ridge * 0.35 + 0.25, cz - lz * hw * 0.3, 0.08, 0.45, 0.08));
  }

  colliders.push({
    minX: minX + 0.15,
    maxX: maxX - 0.15,
    minZ: minZ + 0.15,
    maxZ: maxZ - 0.15,
  });
}

export function addCastle(b: Building, buckets: Buckets, colliders: Collider[], group: THREE.Group, tex: VillageTextures) {
  const cx = b.center[0];
  const cz = b.center[1];
  const y0 = heightAt(cx, cz) - 0.2;
  const yaw = Math.atan2(1.0, 0.55);

  buckets.plaster.push(boxAt(cx, y0 + 4.2, cz, 16.5, 8.4, 12.4, yaw));
  buckets.stone.push(boxAt(cx, y0 + 1.4, cz, 17.2, 2.8, 13.0, yaw));

  const apse = new THREE.CylinderGeometry(5.4, 5.6, 7.2, 14, 1, false, Math.PI * 0.15, Math.PI * 0.85);
  apse.translate(0, y0 + 4.6, 0);
  apse.rotateY(yaw + Math.PI * 0.5);
  apse.translate(cx + Math.sin(yaw) * 7.2, 0, cz + Math.cos(yaw) * 7.2);
  buckets.plaster.push(apse);
  buckets.stone.push(boxAt(cx + Math.sin(yaw) * 7.0, y0 + 1.2, cz + Math.cos(yaw) * 7.0, 10, 2.4, 6, yaw));

  const tx = cx - Math.cos(yaw) * 5.4;
  const tz = cz + Math.sin(yaw) * 5.4;
  buckets.stone.push(boxAt(tx, y0 + 8.5, tz, 5.6, 17.2, 5.6, yaw));
  buckets.plaster.push(boxAt(tx, y0 + 11.5, tz, 5.2, 12.4, 5.2, yaw));

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const mx = tx + Math.cos(a + yaw) * 2.45;
    const mz = tz + Math.sin(a + yaw) * 2.45;
    if (i % 2 === 0) buckets.stone.push(boxAt(mx, y0 + 17.7, mz, 1.1, 1.45, 1.1, yaw));
  }
  const keepTop = y0 + 8.4;
  for (let i = 0; i < 8; i++) {
    const t = (i / 8 - 0.5) * 15;
    buckets.stone.push(boxAt(cx + Math.cos(yaw) * t, keepTop + 0.55, cz + Math.sin(yaw) * t, 1.05, 1.15, 0.7, yaw));
  }

  const merlonRing = new THREE.TorusGeometry(2.55, 0.18, 6, 16);
  merlonRing.rotateX(Math.PI / 2);
  merlonRing.translate(tx, y0 + 17.05, tz);
  buckets.stone.push(merlonRing);

  const antenna = new THREE.CylinderGeometry(0.06, 0.08, 5.2, 6);
  antenna.translate(tx, y0 + 20.4, tz);
  buckets.dark.push(antenna);
  buckets.dark.push(boxAt(tx, y0 + 22.6, tz, 0.9, 0.08, 0.08));

  for (let i = 0; i < 4; i++) {
    const a = yaw + (i * Math.PI) / 2;
    const clock = new THREE.CircleGeometry(0.85, 24);
    clock.rotateY(a);
    clock.translate(tx + Math.sin(a) * 2.66, y0 + 14.6, tz + Math.cos(a) * 2.66);
    const mesh = new THREE.Mesh(
      clock,
      new THREE.MeshStandardMaterial({ map: tex.clock, roughness: 0.45, metalness: 0.05 }),
    );
    mesh.castShadow = true;
    group.add(mesh);
  }

  const doorDir = yaw + Math.PI;
  for (let i = -1.5; i <= 1.5; i += 1) {
    const px = cx + Math.sin(doorDir) * 7.4 + Math.cos(doorDir) * i * 2.1;
    const pz = cz + Math.cos(doorDir) * 7.4 - Math.sin(doorDir) * i * 2.1;
    const col = new THREE.CylinderGeometry(0.38, 0.42, 3.6, 10);
    col.translate(px, y0 + 3.0, pz);
    buckets.stone.push(col);
  }
  buckets.stone.push(
    boxAt(cx + Math.sin(doorDir) * 7.4, y0 + 4.9, cz + Math.cos(doorDir) * 7.4, 7.4, 0.35, 1.6, yaw),
  );

  for (let i = 0; i < 6; i++) {
    const u = (i % 3) - 1;
    const v = Math.floor(i / 3);
    const wx = cx + Math.cos(yaw) * u * 3.4 + Math.sin(doorDir) * 8.3;
    const wz = cz + Math.sin(yaw) * u * 3.4 + Math.cos(doorDir) * 8.3;
    buckets.dark.push(boxAt(wx, y0 + 3.6 + v * 2.6, wz, 1.1, 1.4, 0.12, yaw));
  }

  colliders.push({ minX: cx - 10, maxX: cx + 10, minZ: cz - 9, maxZ: cz + 9 });
  colliders.push({ minX: tx - 3.2, maxX: tx + 3.2, minZ: tz - 3.2, maxZ: tz + 3.2 });
}

export function addChurch(b: Building, buckets: Buckets, colliders: Collider[]) {
  const cx = b.center[0];
  const cz = b.center[1];
  const y0 = heightAt(cx, cz) - 0.12;
  const yaw = -0.55;
  buckets.plasterWarm.push(boxAt(cx, y0 + 4.1, cz, 18.4, 8.2, 11.2, yaw));
  buckets.stone.push(boxAt(cx, y0 + 0.9, cz, 18.8, 1.8, 11.6, yaw));
  const ridge = 3.1;
  const roof = new THREE.BufferGeometry();
  const lx = Math.cos(yaw);
  const lz = Math.sin(yaw);
  const px = -lz;
  const pz = lx;
  const yE = y0 + 8.2;
  const hw = 9.4;
  const hd = 6.0;
  const p = [
    cx - lx * hw - px * hd, yE, cz - lz * hw - pz * hd,
    cx + lx * hw - px * hd, yE, cz + lz * hw - pz * hd,
    cx, yE + ridge, cz,
    cx + lx * hw + px * hd, yE, cz + lz * hw + pz * hd,
    cx - lx * hw + px * hd, yE, cz - lz * hw + pz * hd,
    cx, yE + ridge, cz,
    cx - lx * hw - px * hd, yE, cz - lz * hw - pz * hd,
    cx - lx * hw + px * hd, yE, cz - lz * hw + pz * hd,
    cx, yE + ridge, cz,
    cx + lx * hw - px * hd, yE, cz + lz * hw - pz * hd,
    cx + lx * hw + px * hd, yE, cz + lz * hw + pz * hd,
    cx, yE + ridge, cz,
  ];
  roof.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  roof.computeVertexNormals();
  buckets.roof.push(withUv(roof));

  const bx = cx + px * 7.4;
  const bz = cz + pz * 7.4;
  buckets.stone.push(boxAt(bx, y0 + 7.4, bz, 3.6, 14.8, 3.6, yaw));
  buckets.plasterWarm.push(boxAt(bx, y0 + 8.2, bz, 3.2, 12.6, 3.2, yaw));
  buckets.stone.push(boxAt(bx, y0 + 15.2, bz, 4.0, 0.5, 4.0, yaw));
  buckets.dark.push(boxAt(bx, y0 + 11.4, bz + 0.1, 1.2, 1.8, 0.2, yaw));
  buckets.dark.push(boxAt(bx, y0 + 13.2, bz + 0.1, 1.2, 1.8, 0.2, yaw));
  const bell = new THREE.SphereGeometry(0.28, 10, 8);
  bell.translate(bx, y0 + 12.4, bz);
  buckets.copper.push(bell);

  buckets.dark.push(boxAt(bx, y0 + 16.5, bz, 0.12, 1.8, 0.12, yaw));
  buckets.dark.push(boxAt(bx, y0 + 16.9, bz, 0.9, 0.12, 0.12, yaw));

  buckets.wood.push(boxAt(cx - lx * 9.1, y0 + 2.2, cz - lz * 9.1, 1.6, 3.4, 0.22, yaw));
  const occ = new THREE.CircleGeometry(0.7, 16);
  occ.rotateY(yaw);
  occ.translate(cx - lx * 9.22, y0 + 6.4, cz - lz * 9.22);
  buckets.dark.push(occ);
  buckets.stone.push(boxAt(cx - lx * 9.05, y0 + 4.2, cz - lz * 9.05, 0.45, 8.4, 0.45, yaw));
  buckets.stone.push(boxAt(cx - lx * 9.05 + px * 4.8, y0 + 4.2, cz - lz * 9.05 + pz * 4.8, 0.45, 8.4, 0.45, yaw));

  colliders.push({ minX: cx - 10, maxX: cx + 10, minZ: cz - 8, maxZ: cz + 8 });
  colliders.push({ minX: bx - 2.2, maxX: bx + 2.2, minZ: bz - 2.2, maxZ: bz + 2.2 });
}

export function addTownHall(b: Building, buckets: Buckets, colliders: Collider[]) {
  const cx = b.center[0];
  const cz = b.center[1];
  const y0 = heightAt(cx, cz);
  buckets.plaster.push(boxAt(cx, y0 + 4.4, cz, 12.5, 8.6, 9.5, 0.3));
  buckets.stone.push(boxAt(cx, y0 + 1.0, cz, 12.9, 2.0, 9.9, 0.3));
  buckets.roof.push(boxAt(cx, y0 + 9.1, cz, 13.4, 0.45, 10.2, 0.3));
  buckets.wood.push(boxAt(cx, y0 + 1.7, cz + 4.8, 1.5, 2.8, 0.2, 0.3));
  colliders.push({ minX: cx - 7, maxX: cx + 7, minZ: cz - 6, maxZ: cz + 6 });
}

export function mergeBucket(list: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  const usable = list.filter((g) => g.getAttribute("position")).map(withUv);
  if (!usable.length) return null;
  const merged = mergeGeometries(usable, false);
  for (const g of usable) g.dispose();
  return merged;
}

export function streetRibbon(path: number[][], width: number): THREE.BufferGeometry | null {
  if (path.length < 2) return null;
  const left: number[] = [];
  const right: number[] = [];
  const uvsL: number[] = [];
  const uvsR: number[] = [];
  let dist = 0;
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    if (!p) continue;
    const prev = path[Math.max(0, i - 1)] ?? p;
    const next = path[Math.min(path.length - 1, i + 1)] ?? p;
    const dx = next[0] - prev[0];
    const dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * (width * 0.5);
    const nz = (dx / len) * (width * 0.5);
    const y = heightAt(p[0], p[1]) + 0.05;
    left.push(p[0] + nx, y, p[1] + nz);
    right.push(p[0] - nx, y, p[1] - nz);
    if (i > 0) dist += Math.hypot(p[0] - (path[i - 1]?.[0] ?? p[0]), p[1] - (path[i - 1]?.[1] ?? p[1]));
    uvsL.push(0, dist / 8);
    uvsR.push(1, dist / 8);
  }
  const pos: number[] = [];
  const uv: number[] = [];
  const nPts = left.length / 3;
  for (let i = 0; i < nPts - 1; i++) {
    const l0 = i * 3;
    const l1 = (i + 1) * 3;
    pos.push(
      left[l0]!, left[l0 + 1]!, left[l0 + 2]!,
      right[l0]!, right[l0 + 1]!, right[l0 + 2]!,
      right[l1]!, right[l1 + 1]!, right[l1 + 2]!,
      left[l0]!, left[l0 + 1]!, left[l0 + 2]!,
      right[l1]!, right[l1 + 1]!, right[l1 + 2]!,
      left[l1]!, left[l1 + 1]!, left[l1 + 2]!,
    );
    uv.push(
      uvsL[i * 2]!, uvsL[i * 2 + 1]!,
      uvsR[i * 2]!, uvsR[i * 2 + 1]!,
      uvsR[(i + 1) * 2]!, uvsR[(i + 1) * 2 + 1]!,
      uvsL[i * 2]!, uvsL[i * 2 + 1]!,
      uvsR[(i + 1) * 2]!, uvsR[(i + 1) * 2 + 1]!,
      uvsL[(i + 1) * 2]!, uvsL[(i + 1) * 2 + 1]!,
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}
