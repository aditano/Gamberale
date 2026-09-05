import * as THREE from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { heightAt } from "./height";
import type { VillageTextures } from "./textures";
import type { VillageData } from "./types";

type Mats = {
  grass: THREE.MeshStandardMaterial;
  rock: THREE.MeshStandardMaterial;
  dirt: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  cobble: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
};

export function addSky(scene: THREE.Scene, sun: THREE.DirectionalLight) {
  const sky = new Sky();
  sky.scale.setScalar(1200);
  scene.add(sky);
  const u = sky.material.uniforms;
  u["turbidity"].value = 5.2;
  u["rayleigh"].value = 1.35;
  u["mieCoefficient"].value = 0.0045;
  u["mieDirectionalG"].value = 0.82;
  const sunPos = new THREE.Vector3();
  const elevation = 21;
  const azimuth = 208;
  sunPos.setFromSphericalCoords(
    1,
    THREE.MathUtils.degToRad(90 - elevation),
    THREE.MathUtils.degToRad(azimuth),
  );
  u["sunPosition"].value.copy(sunPos);
  sun.position.copy(sunPos).multiplyScalar(140);
  scene.background = new THREE.Color("#8eafc8");
  scene.fog = new THREE.FogExp2("#9bb4c6", 0.0036);
  return sky;
}

export function addTerrain(scene: THREE.Scene, mats: Mats) {
  const TERRAIN = 520;
  const SEG = 128;
  const geo = new THREE.PlaneGeometry(TERRAIN, TERRAIN, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = heightAt(x, z);
    pos.setY(i, y - 0.05);
    const east = Math.max(0, (x - 30) / 90);
    const steep =
      Math.abs(Math.sin(x * 0.04) * 0.4 + Math.cos(z * 0.03) * 0.3) + east * 0.7;
    if (east > 0.55) {
      color.setRGB(0.42 + east * 0.08, 0.39, 0.34);
    } else if (steep > 0.85) {
      color.setRGB(0.45, 0.42, 0.36);
    } else {
      const patch = 0.88 + Math.sin(x * 0.11) * Math.cos(z * 0.09) * 0.08;
      color.setRGB(0.28 * patch, 0.4 * patch, 0.22 * patch);
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  pos.needsUpdate = true;
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  mats.grass.vertexColors = true;
  const terrain = new THREE.Mesh(geo, mats.grass);
  terrain.receiveShadow = true;
  scene.add(terrain);

  const cliff = new THREE.Mesh(new THREE.PlaneGeometry(220, 70, 28, 6), mats.rock);
  cliff.rotation.x = -Math.PI / 2.35;
  cliff.position.set(150, -4, 55);
  cliff.receiveShadow = true;
  scene.add(cliff);

  const cliff2 = cliff.clone();
  cliff2.position.set(120, -10, 140);
  cliff2.rotation.z = 0.4;
  scene.add(cliff2);
}

export function addHorizon(scene: THREE.Scene) {
  const mat = new THREE.MeshStandardMaterial({
    color: "#8a8f93",
    roughness: 1,
    flatShading: true,
  });
  const snow = new THREE.MeshStandardMaterial({
    color: "#e8eef4",
    roughness: 0.85,
    flatShading: true,
  });
  const peaks: Array<[number, number, number, number, boolean]> = [
    [-520, -18, -780, 1.35, true],
    [80, -22, -860, 1.7, true],
    [480, -28, -620, 1.05, false],
    [-780, -30, -240, 1.2, false],
    [720, -26, -180, 0.95, false],
    [-120, -16, 820, 0.85, false],
  ];
  for (const [x, y, z, s, cap] of peaks) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(210, 110, 8), mat);
    m.position.set(x, y, z);
    m.scale.set(s, s * (0.85 + (cap ? 0.35 : 0)), s);
    scene.add(m);
    if (cap) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(70, 38, 7), snow);
      c.position.set(x, y + 58 * s, z);
      c.scale.set(s * 0.55, s * 0.5, s * 0.55);
      scene.add(c);
    }
  }
}

export function addTrees(
  scene: THREE.Scene,
  data: VillageData,
  churchC: [number, number],
  castleC: [number, number],
) {
  const firGeo = new THREE.ConeGeometry(2.05, 8.4, 7);
  const beechGeo = new THREE.SphereGeometry(2.6, 8, 6);
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.34, 1.7, 6);
  const firMat = new THREE.MeshStandardMaterial({ color: "#243d2c", roughness: 0.92 });
  const beechMat = new THREE.MeshStandardMaterial({ color: "#3d5a36", roughness: 0.9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: "#4a3424", roughness: 0.92 });
  const FIR = 260;
  const BEECH = 180;
  const firs = new THREE.InstancedMesh(firGeo, firMat, FIR);
  const beeches = new THREE.InstancedMesh(beechGeo, beechMat, BEECH);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, FIR + BEECH);
  firs.castShadow = true;
  beeches.castShadow = true;
  const dummy = new THREE.Object3D();
  const rng = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };

  const tooClose = (x: number, z: number) => {
    if (Math.hypot(x - churchC[0], z - churchC[1]) < 26) return true;
    if (Math.hypot(x - castleC[0], z - castleC[1]) < 20) return true;
    if (Math.hypot(x + 6, z - 8) < 38 && rng(x * 3 + z) < 0.72) return true;
    return false;
  };

  let planted = 0;
  let t = 0;
  for (let i = 0; i < FIR; i++) {
    let x = (rng(i + 2.1) - 0.5) * 480;
    let z = (rng(i + 8.7) - 0.5) * 480;
    if (tooClose(x, z)) {
      x += 70;
      z -= 50;
    }
    const y = heightAt(x, z);
    const s = 0.75 + rng(i + 0.3) * 1.05;
    dummy.position.set(x, y + 4.1 * s, z);
    dummy.scale.set(s * (0.8 + rng(i) * 0.4), s, s * (0.8 + rng(i + 1) * 0.4));
    dummy.rotation.y = rng(i + 4) * Math.PI;
    dummy.updateMatrix();
    firs.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, y + 0.75, z);
    dummy.scale.set(s, 1, s);
    dummy.updateMatrix();
    trunks.setMatrixAt(planted++, dummy.matrix);
  }

  const woodsBoxes = data.woods.map((w) => {
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (const p of w.footprint) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minZ = Math.min(minZ, p[1]);
      maxZ = Math.max(maxZ, p[1]);
    }
    return { minX, maxX, minZ, maxZ };
  });

  for (let i = 0; i < BEECH; i++) {
    let x: number;
    let z: number;
    if (i < woodsBoxes.length * 8 && woodsBoxes.length) {
      const box = woodsBoxes[i % woodsBoxes.length]!;
      x = box.minX + rng(i + 11) * (box.maxX - box.minX || 8);
      z = box.minZ + rng(i + 17) * (box.maxZ - box.minZ || 8);
    } else {
      x = (rng(i + 21.4) - 0.5) * 420;
      z = (rng(i + 33.1) - 0.5) * 420;
    }
    if (tooClose(x, z)) continue;
    const y = heightAt(x, z);
    const s = 0.7 + rng(i + 9) * 0.9;
    dummy.position.set(x, y + 2.4 * s, z);
    dummy.scale.set(s * 1.15, s * 0.85, s * 1.1);
    dummy.rotation.y = rng(i + 6) * Math.PI;
    dummy.updateMatrix();
    beeches.setMatrixAt(t, dummy.matrix);
    dummy.position.set(x, y + 0.7, z);
    dummy.scale.set(s * 1.1, 1, s * 1.1);
    dummy.updateMatrix();
    trunks.setMatrixAt(planted++, dummy.matrix);
    t++;
  }
  beeches.count = t;
  trunks.count = planted;
  scene.add(firs);
  scene.add(beeches);
  scene.add(trunks);
}

export function addCemetery(scene: THREE.Scene, data: VillageData, mats: Mats) {
  const cem = data.landuse.find((l) => l.kind === "cemetery");
  if (!cem || cem.footprint.length < 3) return;
  const xs = cem.footprint.map((p) => p[0]);
  const zs = cem.footprint.map((p) => p[1]);
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cz = zs.reduce((a, b) => a + b, 0) / zs.length;
  const y = heightAt(cx, cz);
  const ground = new THREE.CircleGeometry(16, 20);
  ground.rotateX(-Math.PI / 2);
  const g = new THREE.Mesh(
    ground,
    new THREE.MeshStandardMaterial({ color: "#4a5540", roughness: 0.95 }),
  );
  g.position.set(cx, y + 0.04, cz);
  g.receiveShadow = true;
  scene.add(g);
  for (let i = 0; i < 14; i++) {
    const ox = ((i % 7) - 3) * 2.4;
    const oz = (Math.floor(i / 7) - 0.5) * 4.2;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.9, 0.12), mats.stone);
    slab.position.set(cx + ox, y + 0.5, cz + oz);
    slab.castShadow = true;
    scene.add(slab);
  }
  const cypress = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 7.5, 7),
    new THREE.MeshStandardMaterial({ color: "#1e3324", roughness: 0.9 }),
  );
  cypress.position.set(cx + 11, y + 3.7, cz - 4);
  cypress.castShadow = true;
  scene.add(cypress);
}

export function addClouds(scene: THREE.Scene) {
  const mat = new THREE.MeshLambertMaterial({
    color: "#f4f7fb",
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const geo = new THREE.SphereGeometry(28, 8, 6);
  const n = 12;
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    dummy.position.set((i - 6) * 70 + 20, 95 + (i % 3) * 12, -280 - (i % 4) * 40);
    dummy.scale.set(1.8 + (i % 3) * 0.5, 0.35, 1.1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  scene.add(mesh);
}

export function disposeEnvTextures(_tex: VillageTextures) {
  // textures disposed by village
}
