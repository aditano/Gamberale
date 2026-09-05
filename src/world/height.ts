/** Relative metres. Local 0 ≈ village plateau (~1,335 m). */
export function heightAt(x: number, z: number): number {
  const cx = 87.5;
  const cz = 84.1;
  const dc = Math.hypot(x - cx, z - cz);
  let h = 1.6;
  h += 5.4 * Math.exp((-dc * dc) / 620);
  if (x > 40) h -= (x - 40) * 0.14;
  if (z > 55) h -= (z - 55) * 0.1;
  if (x < -100) h -= (-100 - x) * 0.06;
  if (z < -120) h -= (-120 - z) * 0.045;
  const core = Math.hypot(x + 6, z - 8);
  const flatten = Math.max(0, 1 - core / 48);
  const noise =
    Math.sin(x * 0.055) * Math.cos(z * 0.048) * 0.85 + Math.sin(x * 0.13 + z * 0.09) * 0.35;
  h += noise * (1 - flatten * 0.85);
  h = h * (1 - flatten * 0.45) + 1.7 * flatten * 0.45;
  return h;
}