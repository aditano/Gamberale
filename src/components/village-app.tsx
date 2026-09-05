import { BookOpen, Compass, Footprints, MapPinned, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { VillageHandle } from "@/world/village";
import type { VillageData } from "@/world/types";

const PRESETS = [
  { id: "church", label: "San Lorenzo" },
  { id: "castle", label: "Castle" },
  { id: "piazza", label: "Piazza" },
  { id: "ridge", label: "Ridge" },
] as const;

export function VillageApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<VillageHandle | null>(null);
  const walkingRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walking, setWalking] = useState(false);
  const [place, setPlace] = useState("Gamberale");
  const [research, setResearch] = useState(false);
  const [yaw, setYaw] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let handle: VillageHandle | null = null;

    (async () => {
      try {
        const base = import.meta.env.BASE_URL || "/";
        const res = await fetch(`${base}data/gamberale.json`);
        if (!res.ok) throw new Error("Could not load village data");
        const data = (await res.json()) as VillageData;
        const { mountVillage } = await import("@/world/village");
        if (cancelled || !canvasRef.current) return;
        handle = mountVillage({
          canvas: canvasRef.current,
          data,
          walkingRef,
          onPlace: setPlace,
        });
        handleRef.current = handle;
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load the village");
      }
    })();

    return () => {
      cancelled = true;
      handle?.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    let id = 0;
    const tick = () => {
      setYaw(window.__controlsTest?.getYaw() ?? 0);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const enter = () => {
    walkingRef.current = true;
    setWalking(true);
    handleRef.current?.setWalking(true);
  };

  const leave = () => {
    walkingRef.current = false;
    setWalking(false);
    handleRef.current?.setWalking(false);
  };

  return (
    <div className="village-root">
      <canvas
        ref={canvasRef}
        className="village-canvas"
        aria-label="Gamberale 3D village"
      />

      {!ready && !error ? (
        <div className="village-boot">
          <p className="village-kicker">Abruzzo · 1,343 m</p>
          <h1>Gamberale</h1>
          <p className="village-muted">Building the spur…</p>
        </div>
      ) : null}

      {error ? (
        <div className="village-boot">
          <h1>Gamberale</h1>
          <p className="village-muted">{error}</p>
        </div>
      ) : null}

      {ready && !walking ? (
        <div className="village-start">
          <div className="village-start-inner">
            <p className="village-kicker">Highest village in the Province of Chieti</p>
            <h1>Gamberale</h1>
            <p className="village-lede">
              A first-draft 3D walk through the historic borgo: Castello, San Lorenzo
              Martire, and the stone houses on Monte Sant'Antonio.
            </p>
            <button type="button" className="village-primary" onClick={enter}>
              <Footprints size={18} strokeWidth={1.75} />
              Walk the village
            </button>
            <p className="village-hint">
              Click to look · WASD to walk · Shift to hurry · Esc to release
            </p>
            <div className="village-facts">
              <span>1,343 m</span>
              <span>Maiella National Park</span>
              <span>~280 gamberalesi</span>
            </div>
          </div>
        </div>
      ) : null}

      {walking ? (
        <div className="village-hud">
          <div className="village-chip village-place">
            <MapPinned size={14} strokeWidth={1.75} />
            <span>{place}</span>
          </div>
          <div className="village-chip village-compass" aria-hidden="true">
            <Compass size={14} strokeWidth={1.75} style={{ transform: `rotate(${-yaw}rad)` }} />
            <span>N</span>
          </div>
          <div className="village-presets">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => handleRef.current?.goTo(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" className="village-chip village-icon" onClick={() => setResearch(true)} aria-label="Research">
            <BookOpen size={16} strokeWidth={1.75} />
          </button>
          <button type="button" className="village-chip" onClick={leave}>
            Leave walk
          </button>
          <div className="village-touch" aria-hidden="true">
            <div className="village-stick" />
            <p>Move</p>
            <p className="village-look-hint">Look</p>
          </div>
        </div>
      ) : null}

      {research ? (
        <aside className="village-research">
          <header>
            <h2>Research, first draft</h2>
            <button type="button" className="village-icon-btn" onClick={() => setResearch(false)} aria-label="Close">
              <X size={18} />
            </button>
          </header>
          <div className="village-research-body">
            <p>
              Gamberale is the highest comune in the Province of Chieti, 1,343 m on a
              spur of Monte Sant'Antonio in Maiella National Park. The castle,
              parish church, and town hall sit on OpenStreetMap footprints. Streets
              are OSM centrelines. Extra houses fill the historic core because OSM
              only maps 34 buildings.
            </p>
            <p>
              The white clock-tower with battlements and a radio antenna is the
              post-1984 pseudo-medieval rebuild, not a medieval ruin. San Lorenzo is
              an 18th-century single-nave church with a side campanile. Coat of arms:
              silver field, red crayfish.
            </p>
            <p>
              Sources and method notes live in the GitHub repo under{" "}
              <code>research/</code>. This is a walkable sketch, not photogrammetry.
            </p>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
