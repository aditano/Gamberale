import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  addCastle,
  addChurch,
  addHouse,
  addTownHall,
  emptyBuckets,
  mergeBucket,
  streetRibbon,
} from "./build";
import { heightAt } from "./height";
import { disposeTextures, makeTextures } from "./textures";
import type { Collider, Landmark, VillageData } from "./types";

export type VillageHandle = {
  dispose: () => void;
  setWalking: (on: boolean) => void;
  goTo: (id: string) => void;
  getPlaceName: () => string;
};

type MountOpts = {
  canvas: HTMLCanvasElement;
  data: VillageData;
  onPlace?: (name: string) => void;
  walkingRef: { current: boolean };
};

const EYE = 1.68;
const WALK = 4.6;
const SPRINT = 7.8;

export function mountVillage(opts: MountOpts): VillageHandle {
  const { canvas, data } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#87a8c4");
  scene.fog = new THREE.FogExp2("#93b0c9", 0.0048);

  const camera = new THREE.PerspectiveCamera(72, 1, 0.12, 1800);
  const yawObject = new THREE.Object3D();
  const pitchObject = new THREE.Object3D();
  pitchObject.add(camera);
  yawObject.add(pitchObject);
  scene.add(yawObject);

  const spawn = data.landmarks.church.center;
  let px = spawn[0] + 6;
  let pz = spawn[1] + 11;
  let py = heightAt(px, pz) + EYE;
  let yaw = Math.atan2(px - data.landmarks.castle.center[0], pz - data.landmarks.castle.center[1]);
  let pitch = -0.12;
  yawObject.position.set(px, py, pz);
  yawObject.rotation.y = yaw;
  pitchObject.rotation.x = pitch;

  const hemi = new THREE.HemisphereLight("#d7e6f5", "#6a5a42", 0.72);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#ffe3c2", 2.15);
  sun.position.set(-80, 90, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 280;
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  scene.add(sun);
  scene.add(new THREE.AmbientLight("#b9c4ce", 0.18));

  const tex = makeTextures();
  const mats = {
    plaster: new THREE.MeshStandardMaterial({ map: tex.plaster, roughness: 0.86, metalness: 0.02 }),
    plasterWarm: new THREE.MeshStandardMaterial({ map: tex.plasterWarm, roughness: 0.88, metalness: 0.02 }),
    stone: new THREE.MeshStandardMaterial({ map: tex.stone, roughness: 0.92, metalness: 0.04 }),
    roof: new THREE.MeshStandardMaterial({ map: tex.roof, roughness: 0.78, metalness: 0.05 }),
    wood: new THREE.MeshStandardMaterial({ map: tex.wood, roughness: 0.84, metalness: 0.02 }),
    dark: new THREE.MeshStandardMaterial({ color: "#1c1916", roughness: 0.7 }),
    cobble: new THREE.MeshStandardMaterial({ map: tex.cobble, roughness: 0.95, metalness: 0.02 }),
    grass: new THREE.MeshStandardMaterial({ map: tex.grass, roughness: 0.95 }),
    dirt: new THREE.MeshStandardMaterial({ map: tex.dirt, roughness: 0.96 }),
    rock: new THREE.MeshStandardMaterial({ color: "#6e675c", roughness: 0.94 }),
  };

  const buckets = emptyBuckets();
  const colliders: Collider[] = [];
  const landmarkGroup = new THREE.Group();
  scene.add(landmarkGroup);

  for (const b of data.buildings) {
    if (b.kind === "castle") addCastle(b, buckets, colliders, landmarkGroup, tex);
    else if (b.kind === "church") addChurch(b, buckets, colliders);
    else if (b.kind === "townhall") addTownHall(b, buckets, colliders);
    else addHouse(b, buckets, colliders);
  }

  const addMerged = (geos: THREE.BufferGeometry[], mat: THREE.Material, shadows = true) => {
    const g = mergeBucket(geos);
    if (!g) return;
    const m = new THREE.Mesh(g, mat);
    m.castShadow = shadows;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  addMerged(buckets.plaster, mats.plaster);
  addMerged(buckets.plasterWarm, mats.plasterWarm);
  addMerged(buckets.stone, mats.stone);
  addMerged(buckets.roof, mats.roof);
  addMerged(buckets.wood, mats.wood);
  addMerged(buckets.dark, mats.dark, false);

  const streetGeos: THREE.BufferGeometry[] = [];
  for (const s of data.streets) {
    const w = s.highway === "tertiary" || s.highway === "secondary" ? 6.2 : s.highway === "track" ? 2.6 : s.highway === "steps" || s.highway === "footway" ? 2.2 : 3.8;
    const g = streetRibbon(s.path, w);
    if (g) streetGeos.push(g);
  }
  if (streetGeos.length) {
    const g = mergeGeometries(streetGeos, false);
    if (g) {
      const m = new THREE.Mesh(g, mats.cobble);
      m.receiveShadow = true;
      scene.add(m);
    }
    for (const s of streetGeos) s.dispose();
  }

  const piazza = new THREE.CircleGeometry(11, 32);
  piazza.rotateX(-Math.PI / 2);
  const churchC = data.landmarks.church.center;
  piazza.translate(churchC[0] - 2, heightAt(churchC[0], churchC[1]) + 0.06, churchC[1] + 6);
  const piazzaMesh = new THREE.Mesh(piazza, mats.cobble);
  piazzaMesh.receiveShadow = true;
  scene.add(piazzaMesh);

  const castleC = data.landmarks.castle.center;
  const piazza2 = new THREE.CircleGeometry(9, 28);
  piazza2.rotateX(-Math.PI / 2);
  piazza2.translate(castleC[0] - 8, heightAt(castleC[0], castleC[1]) + 0.07, castleC[1] - 6);
  const p2 = new THREE.Mesh(piazza2, mats.cobble);
  p2.receiveShadow = true;
  scene.add(p2);

  const fountain = new THREE.Group();
  const basin = new THREE.CylinderGeometry(1.6, 1.75, 0.45, 20);
  const basinM = new THREE.Mesh(basin, mats.stone);
  basinM.castShadow = true;
  fountain.add(basinM);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.5, 10), mats.stone);
  col.position.y = 0.9;
  fountain.add(col);
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1.35, 20),
    new THREE.MeshStandardMaterial({ color: "#6fa0b8", roughness: 0.12, metalness: 0.35 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.24;
  fountain.add(water);
  fountain.position.set(churchC[0] + 1.5, heightAt(churchC[0], churchC[1]) + 0.22, churchC[1] + 6.5);
  scene.add(fountain);

  const TERRAIN = 420;
  const SEG = 96;
  const terrainGeo = new THREE.PlaneGeometry(TERRAIN, TERRAIN, SEG, SEG);
  terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, heightAt(x, z) - 0.04);
    }
    pos.needsUpdate = true;
    terrainGeo.computeVertexNormals();
  }
  const terrain = new THREE.Mesh(terrainGeo, mats.grass);
  terrain.receiveShadow = true;
  scene.add(terrain);

  const cliff = new THREE.Mesh(new THREE.PlaneGeometry(160, 40, 20, 4), mats.rock);
  cliff.rotation.x = -Math.PI / 2.6;
  cliff.position.set(130, -6, 70);
  cliff.receiveShadow = true;
  scene.add(cliff);

  const treeGeo = new THREE.ConeGeometry(2.1, 7.2, 7);
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 1.6, 6);
  const treeMat = new THREE.MeshStandardMaterial({ color: "#2f4a32", roughness: 0.9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: "#4a3424", roughness: 0.9 });
  const treeCount = 220;
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  trees.castShadow = true;
  const dummy = new THREE.Object3D();
  let planted = 0;
  let guard = 0;
  while (planted < treeCount && guard < 4000) {
    guard++;
    const x = (Math.random() - 0.5) * 380;
    const z = (Math.random() - 0.5) * 380;
    if (Math.hypot(x - churchC[0], z - churchC[1]) < 28) continue;
    if (Math.hypot(x - castleC[0], z - castleC[1]) < 22) continue;
    if (Math.hypot(x, z) < 42 && Math.random() < 0.7) continue;
    const y = heightAt(x, z);
    const s = 0.7 + Math.random() * 0.9;
    dummy.position.set(x, y + 3.5 * s, z);
    dummy.scale.set(s, s, s);
    dummy.rotation.y = Math.random() * Math.PI;
    dummy.updateMatrix();
    trees.setMatrixAt(planted, dummy.matrix);
    dummy.position.set(x, y + 0.7, z);
    dummy.scale.set(s, 1, s);
    dummy.updateMatrix();
    trunks.setMatrixAt(planted, dummy.matrix);
    planted++;
  }
  scene.add(trees);
  scene.add(trunks);

  const mountain = new THREE.Mesh(
    new THREE.ConeGeometry(220, 90, 7),
    new THREE.MeshStandardMaterial({ color: "#8b9198", roughness: 1 }),
  );
  mountain.position.set(-380, 10, -520);
  scene.add(mountain);
  const mountain2 = mountain.clone();
  mountain2.scale.set(1.3, 1.15, 1.3);
  mountain2.position.set(90, 4, -640);
  scene.add(mountain2);
  const mountain3 = mountain.clone();
  mountain3.scale.set(0.8, 0.7, 0.8);
  mountain3.position.set(420, -8, -280);
  scene.add(mountain3);

  const lampMat = new THREE.MeshStandardMaterial({ color: "#2a2420", roughness: 0.6 });
  const lampLightMat = new THREE.MeshStandardMaterial({
    color: "#f0d8a8",
    emissive: "#e8c888",
    emissiveIntensity: 0.7,
  });
  for (const s of data.streets) {
    if (s.highway !== "residential" && s.highway !== "footway") continue;
    for (let i = 2; i < s.path.length - 1; i += 5) {
      const p = s.path[i];
      if (!p) continue;
      if (Math.hypot(p[0], p[1]) > 90) continue;
      const y = heightAt(p[0], p[1]);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), lampMat);
      pole.position.set(p[0] + 1.4, y + 1.6, p[1] + 0.4);
      pole.castShadow = true;
      scene.add(pole);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), lampLightMat);
      bulb.position.set(p[0] + 1.4, y + 3.15, p[1] + 0.4);
      scene.add(bulb);
    }
  }

  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6.5, 6), mats.dark);
  flagPole.position.set(castleC[0] - 11, heightAt(castleC[0], castleC[1]) + 3.4, castleC[1] - 8);
  scene.add(flagPole);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.05),
    new THREE.MeshStandardMaterial({ color: "#009246", side: THREE.DoubleSide }),
  );
  flag.position.set(castleC[0] - 10.2, heightAt(castleC[0], castleC[1]) + 6.2, castleC[1] - 8);
  scene.add(flag);
  const flagW = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.35), new THREE.MeshStandardMaterial({ color: "#ffffff", side: THREE.DoubleSide }));
  flagW.position.copy(flag.position);
  flagW.position.y += 0.35;
  scene.add(flagW);
  const flagR = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.35), new THREE.MeshStandardMaterial({ color: "#ce2b37", side: THREE.DoubleSide }));
  flagR.position.copy(flag.position);
  flagR.position.y -= 0.35;
  scene.add(flagR);

  const landmarks: Landmark[] = [
    {
      id: "castle",
      title: "Castello di Gamberale",
      body: "Pseudo-medieval keep rebuilt after WWII and the 1984 earthquake. White plaster, stone merlons, clock tower, radio antenna.",
      x: castleC[0],
      z: castleC[1],
    },
    {
      id: "church",
      title: "San Lorenzo Martire",
      body: "18th-century parish church, single nave, side campanile. Patronal feast 10 August.",
      x: churchC[0],
      z: churchC[1],
    },
    {
      id: "piazza",
      title: "Piazza San Lorenzo",
      body: "Village entry piazza. Casa Pollice stands here in the real town. Fountain is a stand-in for Kmielauskas' Atteone.",
      x: churchC[0] + 1.5,
      z: churchC[1] + 6.5,
    },
    {
      id: "ridge",
      title: "The spur",
      body: "Rocky spur of Monte Sant'Antonio, 1,343 m. Sangro valley falls away to the east.",
      x: 40,
      z: 20,
    },
  ];

  const held = new Set<string>();
  let injected: Set<string> | null = null;
  let vx = 0;
  let vz = 0;
  let speed = 0;
  let locked = false;
  let walking = false;
  let placeName = "Piazza San Lorenzo";
  let disposed = false;

  const keysOf = () => injected ?? held;

  const onKeyDown = (e: KeyboardEvent) => {
    held.add(e.code);
    if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent) => held.delete(e.code);
  const clearKeys = () => held.clear();
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearKeys();
  });

  const onMouse = (e: MouseEvent) => {
    if (!locked || !walking) return;
    yaw -= e.movementX * 0.0022;
    pitch -= e.movementY * 0.0022;
    pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, pitch));
  };
  document.addEventListener("mousemove", onMouse);

  const onLock = () => {
    locked = document.pointerLockElement === canvas;
  };
  document.addEventListener("pointerlockchange", onLock);

  const touch = { active: false, lx: 0, ly: 0, lookX: 0, lookY: 0, idMove: -1, idLook: -1 };
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.42) {
      touch.idMove = e.pointerId;
      touch.lx = 0;
      touch.ly = 0;
    } else {
      touch.idLook = e.pointerId;
      touch.lookX = e.clientX;
      touch.lookY = e.clientY;
    }
    touch.active = true;
  });
  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerId === touch.idMove) {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width * 0.18;
      const cy = rect.height * 0.72;
      const dx = e.clientX - rect.left - cx;
      const dy = e.clientY - rect.top - cy;
      const m = Math.hypot(dx, dy) || 1;
      const s = Math.min(1, m / 70);
      touch.lx = (dx / m) * s;
      touch.ly = (dy / m) * s;
    }
    if (e.pointerId === touch.idLook) {
      yaw -= (e.clientX - touch.lookX) * 0.004;
      pitch -= (e.clientY - touch.lookY) * 0.004;
      pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, pitch));
      touch.lookX = e.clientX;
      touch.lookY = e.clientY;
    }
  });
  const endPtr = (e: PointerEvent) => {
    if (e.pointerId === touch.idMove) {
      touch.idMove = -1;
      touch.lx = 0;
      touch.ly = 0;
    }
    if (e.pointerId === touch.idLook) touch.idLook = -1;
  };
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);

  const collide = (x: number, z: number, radius: number) => {
    for (const c of colliders) {
      const cx = Math.max(c.minX, Math.min(x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(z, c.maxZ));
      const dx = x - cx;
      const dz = z - cz;
      const d = Math.hypot(dx, dz);
      if (d < radius) {
        if (d < 1e-4) {
          x += radius;
        } else {
          const push = (radius - d) / d;
          x += dx * push;
          z += dz * push;
        }
      }
    }
    return { x, z };
  };

  {
    const c = collide(px, pz, 0.6);
    px = c.x;
    pz = c.z;
    py = heightAt(px, pz) + EYE;
    yawObject.position.set(px, py, pz);
  }

  const clock = new THREE.Timer();
  clock.connect(document);
  let lastPlace = "";

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w < 1 || h < 1) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const loop = () => {
    if (disposed) return;
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.1);
    walking = opts.walkingRef.current;

    const keys = keysOf();
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    let ax = 0;
    let az = 0;
    if (walking) {
      if (keys.has("KeyW") || keys.has("ArrowUp")) {
        ax += forward.x;
        az += forward.z;
      }
      if (keys.has("KeyS") || keys.has("ArrowDown")) {
        ax -= forward.x;
        az -= forward.z;
      }
      if (keys.has("KeyD") || keys.has("ArrowRight")) {
        ax += right.x;
        az += right.z;
      }
      if (keys.has("KeyA") || keys.has("ArrowLeft")) {
        ax -= right.x;
        az -= right.z;
      }
      ax += right.x * touch.lx + forward.x * -touch.ly;
      az += right.z * touch.lx + forward.z * -touch.ly;
    }
    const len = Math.hypot(ax, az);
    if (len > 1) {
      ax /= len;
      az /= len;
    }
    const sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
    const target = (sprint ? SPRINT : WALK) * (len > 0 ? 1 : 0);
    const wishX = ax * target;
    const wishZ = az * target;
    vx += (wishX - vx) * Math.min(1, dt * 10);
    vz += (wishZ - vz) * Math.min(1, dt * 10);
    speed = Math.hypot(vx, vz);

    if (walking) {
      px += vx * dt;
      pz += vz * dt;
      const c = collide(px, pz, 0.42);
      px = c.x;
      pz = c.z;
      const ground = heightAt(px, pz);
      py = ground + EYE;
      const bob = speed > 0.4 ? Math.sin(clock.getElapsed() * 8.5) * 0.035 : 0;
      yawObject.position.set(px, py + bob, pz);
      yawObject.rotation.set(0, yaw, 0);
      pitchObject.rotation.x = pitch;
    } else {
      const t = clock.getElapsed() * 0.1;
      const ox = churchC[0] + Math.sin(t) * 32;
      const oz = churchC[1] + 10 + Math.cos(t) * 30;
      const oy = heightAt(ox, oz) + 13;
      yawObject.position.set(ox, oy, oz);
      const lookX = (castleC[0] + churchC[0]) * 0.5;
      const lookZ = (castleC[1] + churchC[1]) * 0.5;
      const lx = lookX - ox;
      const lz = lookZ - oz;
      yawObject.rotation.set(0, Math.atan2(-lx, -lz), 0);
      pitchObject.rotation.x = -0.22;
    }

    let nearest = landmarks[0]!;
    let nd = Infinity;
    for (const lm of landmarks) {
      const d = Math.hypot(lm.x - px, lm.z - pz);
      if (d < nd) {
        nd = d;
        nearest = lm;
      }
    }
    placeName = nd < 28 ? nearest.title : "Gamberale ridge";
    if (placeName !== lastPlace) {
      lastPlace = placeName;
      opts.onPlace?.(placeName);
    }

    flag.position.x = castleC[0] - 10.2 + Math.sin(clock.getElapsed() * 1.4) * 0.05;
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(loop);

  window.__controlsTest = {
    getYaw: () => yaw,
    getSpeed: () => speed,
    setKeys: (codes) => {
      injected = new Set(codes);
    },
  };

  const goTo = (id: string) => {
    const lm = landmarks.find((l) => l.id === id);
    if (!lm) return;
    px = lm.x + 6;
    pz = lm.z + 10;
    py = heightAt(px, pz) + EYE;
    yaw = Math.atan2(-(lm.x - px), -(lm.z - pz));
    pitch = -0.1;
    yawObject.position.set(px, py, pz);
    yawObject.rotation.y = yaw;
    pitchObject.rotation.x = pitch;
  };

  return {
    dispose: () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      document.removeEventListener("mousemove", onMouse);
      document.removeEventListener("pointerlockchange", onLock);
      ro.disconnect();
      clock.dispose();
      disposeTextures(tex);
      renderer.dispose();
      delete window.__controlsTest;
    },
    setWalking: (on) => {
      walking = on;
      if (on) {
        canvas.requestPointerLock?.({ unadjustedMovement: true } as PointerLockOptions).catch(() => {
          canvas.requestPointerLock();
        });
      } else if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    },
    goTo,
    getPlaceName: () => placeName,
  };
}
