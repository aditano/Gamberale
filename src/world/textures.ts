import * as THREE from "three";

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d");
  return { c, ctx };
}

function noise(ctx: CanvasRenderingContext2D, size: number, alpha: number) {
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * alpha;
    d[i] = clamp(d[i] + n);
    d[i + 1] = clamp(d[i + 1] + n);
    d[i + 2] = clamp(d[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);
}

function clamp(v: number) {
  return Math.max(0, Math.min(255, v));
}

export type VillageTextures = {
  plaster: THREE.CanvasTexture;
  plasterWarm: THREE.CanvasTexture;
  stone: THREE.CanvasTexture;
  cobble: THREE.CanvasTexture;
  roof: THREE.CanvasTexture;
  grass: THREE.CanvasTexture;
  wood: THREE.CanvasTexture;
  clock: THREE.CanvasTexture;
  dirt: THREE.CanvasTexture;
};

function tex(c: HTMLCanvasElement, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function makeTextures(): VillageTextures {
  const plaster = (() => {
    const { c, ctx } = canvas(256);
    ctx.fillStyle = "#efe8d8";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(180,160,130,${0.04 + Math.random() * 0.06})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 20 + Math.random() * 50, 8 + Math.random() * 18);
    }
    noise(ctx, 256, 0.08);
    return tex(c, 2, 2);
  })();

  const plasterWarm = (() => {
    const { c, ctx } = canvas(256);
    ctx.fillStyle = "#e4d4b8";
    ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 0.1);
    return tex(c, 2, 2);
  })();

  const stone = (() => {
    const { c, ctx } = canvas(512);
    ctx.fillStyle = "#6d675c";
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 28) {
      const off = (y / 28) % 2 === 0 ? 0 : 36;
      for (let x = -40; x < 512; x += 72) {
        const jx = x + off + (Math.random() - 0.5) * 4;
        const jy = y + (Math.random() - 0.5) * 3;
        const w = 64 + Math.random() * 12;
        const h = 22 + Math.random() * 6;
        const shade = 110 + Math.random() * 50;
        ctx.fillStyle = `rgb(${shade + 8},${shade},${shade - 12})`;
        ctx.fillRect(jx, jy, w, h);
        ctx.strokeStyle = "rgba(40,36,30,0.45)";
        ctx.lineWidth = 2;
        ctx.strokeRect(jx, jy, w, h);
      }
    }
    noise(ctx, 512, 0.06);
    return tex(c, 2, 2);
  })();

  const cobble = (() => {
    const { c, ctx } = canvas(512);
    ctx.fillStyle = "#8a8376";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 4 + Math.random() * 7;
      const s = 90 + Math.random() * 70;
      ctx.fillStyle = `rgb(${s},${s - 8},${s - 18})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.72, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
    noise(ctx, 512, 0.07);
    return tex(c, 8, 8);
  })();

  const roof = (() => {
    const { c, ctx } = canvas(256);
    ctx.fillStyle = "#8f3e28";
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 10) {
      ctx.fillStyle = y % 20 === 0 ? "#a24a30" : "#7a3422";
      ctx.fillRect(0, y, 256, 8);
      ctx.strokeStyle = "rgba(50,16,10,0.35)";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
      const shift = (y / 10) % 2 === 0 ? 0 : 9;
      for (let x = shift; x < 256; x += 18) {
        ctx.strokeStyle = "rgba(40,12,8,0.25)";
        ctx.strokeRect(x, y, 16, 8);
      }
    }
    noise(ctx, 256, 0.08);
    return tex(c, 3, 3);
  })();

  const grass = (() => {
    const { c, ctx } = canvas(256);
    ctx.fillStyle = "#3d5a34";
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1200; i++) {
      ctx.strokeStyle = `rgba(${40 + Math.random() * 40},${80 + Math.random() * 70},${30},0.5)`;
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 4 - Math.random() * 6);
      ctx.stroke();
    }
    noise(ctx, 256, 0.05);
    return tex(c, 14, 14);
  })();

  const wood = (() => {
    const { c, ctx } = canvas(128);
    ctx.fillStyle = "#5a3a22";
    ctx.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 8) {
      ctx.fillStyle = x % 16 === 0 ? "#4a2e1a" : "#6b4528";
      ctx.fillRect(x, 0, 7, 128);
    }
    noise(ctx, 128, 0.1);
    return tex(c, 1, 2);
  })();

  const clock = (() => {
    const { c, ctx } = canvas(256);
    ctx.fillStyle = "#f4efe4";
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2a2420";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = "#2a2420";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(128 + Math.cos(a) * 96, 128 + Math.sin(a) * 96, i % 3 === 0 ? 5 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#1c1916";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(128, 52);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 128);
    ctx.lineTo(176, 128);
    ctx.stroke();
    ctx.fillStyle = "#8f3e28";
    ctx.beginPath();
    ctx.arc(128, 128, 6, 0, Math.PI * 2);
    ctx.fill();
    return tex(c, 1, 1);
  })();

  const dirt = (() => {
    const { c, ctx } = canvas(256);
    ctx.fillStyle = "#6a5a42";
    ctx.fillRect(0, 0, 256, 256);
    noise(ctx, 256, 0.14);
    return tex(c, 6, 6);
  })();

  return { plaster, plasterWarm, stone, cobble, roof, grass, wood, clock, dirt };
}

export function disposeTextures(t: VillageTextures) {
  for (const v of Object.values(t)) v.dispose();
}
