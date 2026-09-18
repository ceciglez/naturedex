"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MapCanvas } from "./MapCanvas";
import { ClusterBadge, CreatureMarker, tierForZoom } from "./CreatureMarker";
import { PlaceSearch } from "./PlaceSearch";
import { SearchPill } from "./SearchPill";
import { RadarDrawer, type Range } from "@/components/radar/RadarDrawer";
import { HeadingCone, PlayerPuck } from "@/components/ui/PixelIcon";
import { LockGlyph, StateMessage } from "@/components/ui/StateMessage";
import { TabBar } from "@/components/ui/TabBar";
import { Encounter } from "@/components/encounter/Encounter";
import { useDex } from "@/hooks/useDex";
import { rememberLocalSpecies } from "@/lib/dex/store";
import { useHeading } from "@/hooks/useHeading";
import { useLocation } from "@/hooks/useLocation";
import { useNearby } from "@/hooks/useNearby";
import { useTone } from "@/hooks/useTone";
import { buildSpawns, type Spawn } from "@/lib/inat/spawns";
import { CELL_INFO } from "@/lib/map/classes";
import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, MapEngine, type Viewport } from "@/lib/map/engine";

type Vp = Viewport & { cssWidth: number; cssHeight: number };

export function MapScreen({ initialRadar = false, initialZoom = DEFAULT_ZOOM }: { initialRadar?: boolean; initialZoom?: number }) {
  const [engine] = useState(() => new MapEngine());
  const engineVersion = useSyncExternalStore(
    (fn) => engine.subscribe(fn),
    () => engine.version,
    () => 0,
  );
  const [tone, setTone] = useTone();
  const location = useLocation();
  const heading = useHeading();
  const nearby = useNearby(location.position);

  const [zoom, setZoom] = useState(() => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoom)));
  const [vp, setVp] = useState<Vp | null>(null);
  const [radarOpen, setRadarOpen] = useState(initialRadar);
  const [range, setRange] = useState<Range>(250);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const dex = useDex();
  const caught = useMemo(() => new Set(dex.entries.map((e) => String(e.taxonId))), [dex.entries]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => engine.setTone(tone), [engine, tone]);

  const position = location.position;

  // Name the place once per ~100 m.
  const nameKey = position ? `${position.lat.toFixed(3)},${position.lng.toFixed(3)}` : null;
  useEffect(() => {
    if (!position) return;
    let live = true;
    engine.placeName(position).then((n) => live && setPlaceName(n), () => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, nameKey]);

  const spawns = useMemo(() => {
    if (!position) return [];
    return buildSpawns(nearby.observations, position).map((s) => ({ ...s, at: engine.snapToSpawnable(s.at) }));
    // engineVersion: re-snap once the map under the spawns has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearby.observations, position, engine, engineVersion]);

  // The Dex total: species that can turn up around you (all spawnable species from the last sweep).
  useEffect(() => {
    if (nearby.status === "ready") rememberLocalSpecies(new Set(nearby.observations.map((o) => o.taxon.id)).size || null);
  }, [nearby.status, nearby.observations]);
  const inRange = spawns.filter((s) => s.distanceM <= range).length;
  const here = position ? engine.cellAt(position) : undefined;
  const biome = here === undefined ? "SCANNING" : CELL_INFO[here].label;

  const onViewport = useCallback((v: Vp) => setVp(v), []);
  const toggleRadar = useCallback(() => setRadarOpen((o) => !o), []);
  const select = useCallback((s: Spawn) => {
    setSelectedId(s.id);
    setEncounterId(s.id);
  }, []);
  const encounter = spawns.find((s) => s.id === encounterId) ?? null;

  if (location.status === "denied" || location.status === "unavailable") {
    return (
      <LocationOff
        denied={location.status === "denied"}
        choosing={choosing}
        setChoosing={setChoosing}
        onChoose={(p) => {
          location.choosePlace(p);
          setChoosing(false);
        }}
      />
    );
  }

  const subtitle =
    nearby.status === "error"
      ? `${biome} · OFFLINE`
      : nearby.status === "ready"
        ? `${biome} · ${inRange ? `${inRange} SPECIES NEARBY` : "NOTHING IN RANGE"}`
        : `${biome} · SWEEPING…`;

  const tier = tierForZoom(zoom);

  return (
    <div className="relative flex h-dvh flex-col">
      <div className="relative flex-1 overflow-hidden bg-[var(--map-park)]">
        {position && (
          <MapCanvas engine={engine} center={position} zoom={zoom} onZoom={setZoom} onViewport={onViewport}>
            {vp && (
              <div className="pointer-events-none absolute inset-0 [&>*]:pointer-events-auto">
                {tier === 0 ? (
                  <Clusters spawns={spawns} project={(s) => engine.project(s.at, position, zoom, vp)} />
                ) : (
                  spawns.map((s) => {
                    const p = engine.project(s.at, position, zoom, vp);
                    if (p.x < -80 || p.y < -80 || p.x > vp.cssWidth + 80 || p.y > vp.cssHeight + 80) return null;
                    return (
                      <CreatureMarker
                        key={s.id}
                        spawn={s}
                        tier={tier}
                        x={p.x}
                        y={p.y}
                        selected={s.id === selectedId}
                        caught={caught.has(s.id)}
                        onSelect={() => select(s)}
                      />
                    );
                  })
                )}
                <Player x={vp.cssWidth / 2} y={vp.cssHeight / 2} heading={heading} />
              </div>
            )}
          </MapCanvas>
        )}

        {radarOpen && <div className="absolute inset-0 z-10 bg-ink/45" onClick={toggleRadar} aria-hidden />}

        <div className="absolute inset-x-4 top-[max(12px,env(safe-area-inset-top))] z-10">
          <SearchPill
            title={location.status === "manual" ? (placeName ?? "CHOSEN PLACE") : (placeName ?? (position ? "OUT IN THE FIELD" : "LOCATING…"))}
            subtitle={position ? subtitle : "WAITING FOR GPS"}
            mono={tone === "mono"}
            onToggleTone={() => setTone(tone === "mono" ? "color" : "mono")}
          />
        </div>

        {!position && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="animate-pulse font-display text-xs text-ink">LOCATING…</p>
          </div>
        )}

        {toast && (
          <p role="status" className="absolute inset-x-4 bottom-8 z-10 border-[3px] border-ink bg-sun px-3 py-2 text-center font-display text-[11px] text-ink">
            {toast}
          </p>
        )}

        <p className="absolute bottom-1 right-1.5 z-0 font-ui text-[8px] text-ink/70">
          © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://openfreemap.org">OpenFreeMap</a>
        </p>

        {radarOpen && (
          <RadarDrawer
            spawns={spawns}
            range={range}
            onRange={setRange}
            status={nearby.status}
            onRetry={nearby.retry}
            onClose={toggleRadar}
            onSelect={select}
            selectedId={selectedId}
          />
        )}
      </div>
      <TabBar active={radarOpen ? "radar" : "map"} onRadar={toggleRadar} />

      {encounter && position && (
        <Encounter
          spawn={encounter}
          player={position}
          biome={(() => {
            const c = engine.cellAt(encounter.at);
            return c === undefined ? null : CELL_INFO[c].biome;
          })()}
          onClose={(logged) => {
            setEncounterId(null);
            if (logged && !logged.isNew) setToast(`LOGGED · SIGHTING ${logged.entry.sightings.length}`);
          }}
        />
      )}
    </div>
  );
}

function Player({ x, y, heading }: { x: number; y: number; heading: number | null }) {
  return (
    <div className="pointer-events-none absolute" style={{ left: x - 16, top: y - 16 }} aria-label="You are here" role="img">
      {heading !== null && (
        <div className="absolute left-1 top-[-18px] origin-[12px_34px]" style={{ transform: `rotate(${heading}deg)` }}>
          <HeadingCone />
        </div>
      )}
      <PlayerPuck />
    </div>
  );
}

/** z16 · District: group markers into 56px screen buckets and show counts. */
function Clusters({ spawns, project }: { spawns: Spawn[]; project: (s: Spawn) => { x: number; y: number } }) {
  const buckets = new Map<string, { x: number; y: number; n: number }>();
  for (const s of spawns) {
    const p = project(s);
    const k = `${Math.floor(p.x / 56)}:${Math.floor(p.y / 56)}`;
    const b = buckets.get(k);
    if (b) {
      b.x += p.x;
      b.y += p.y;
      b.n++;
    } else buckets.set(k, { x: p.x, y: p.y, n: 1 });
  }
  return (
    <>
      {[...buckets.entries()].map(([k, b]) => (
        <ClusterBadge key={k} count={b.n} x={b.x / b.n} y={b.y / b.n} />
      ))}
    </>
  );
}

function LocationOff({
  denied,
  choosing,
  setChoosing,
  onChoose,
}: {
  denied: boolean;
  choosing: boolean;
  setChoosing: (v: boolean) => void;
  onChoose: (p: { lat: number; lng: number }) => void;
}) {
  const [help, setHelp] = useState(false);
  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))]">
        <h1 className="font-display text-xl text-ink">MAP</h1>
        <p className="font-ui text-[10px] tracking-[2px] text-rust">NO LOCATION</p>
      </header>
      <main className="flex flex-1 items-center justify-center px-8">
        {choosing ? (
          <PlaceSearch onChoose={onChoose} onCancel={() => setChoosing(false)} />
        ) : (
          <StateMessage
            icon={<LockGlyph />}
            title={denied ? "LOCATION IS OFF" : "NO GPS SIGNAL"}
            body={
              help
                ? "Open your browser's site settings for this page and allow Location, then reload. On iPhone: Settings › Privacy › Location Services › Safari Websites."
                : "Radar needs your location to find what is nearby. Your dex still works, and you can pick a place by hand."
            }
            action={{ label: "CHOOSE A PLACE", onClick: () => setChoosing(true) }}
            alt={help ? { label: "TRY AGAIN", onClick: () => window.location.reload() } : { label: "HOW TO TURN IT ON", onClick: () => setHelp(true) }}
          />
        )}
      </main>
      <TabBar active="map" />
    </div>
  );
}
