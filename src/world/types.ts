export type Footprint = number[][];

export type BuildingKind = "castle" | "church" | "townhall" | "house";

export type Building = {
  id: number;
  kind: BuildingKind;
  source: string;
  footprint: Footprint;
  center: [number, number];
  area: number;
  floors?: number;
  variant?: number;
  width?: number;
  depth?: number;
  yaw?: number;
  tags: Record<string, string>;
};

export type Street = {
  id: number;
  name: string | null;
  highway: string;
  path: Footprint;
};

export type VillageData = {
  meta: {
    origin: { lat: number; lon: number };
    projection: string;
    source: string;
    note: string;
  };
  landmarks: {
    castle: { center: [number, number]; id: number };
    church: { center: [number, number]; id: number };
    village: { center: [number, number] };
    monteSantAntonio: { center: [number, number]; ele: number };
  };
  buildings: Building[];
  streets: Street[];
  woods: { id: number; footprint: Footprint }[];
  landuse: { id: number; kind: string; footprint: Footprint }[];
  pois: {
    id: number;
    pos: [number, number];
    lat: number;
    lon: number;
    tags: Record<string, string>;
  }[];
};

export type Collider = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type Landmark = {
  id: string;
  title: string;
  body: string;
  x: number;
  z: number;
};

export type ControlsProbe = {
  getYaw: () => number;
  getSpeed: () => number;
  getX?: () => number;
  getZ?: () => number;
  setKeys: (codes: string[]) => void;
  setSteer?: (v: number) => void;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
    __gamberale?: { mode: string };
  }
}
