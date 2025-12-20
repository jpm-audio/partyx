import React, { useEffect, useMemo, useRef } from "react";
import { Application } from "pixi.js";
import type { EditorConfig } from "../types";
import { tryCreatePartyxEmitter, type PartyxHandle } from "../lib/partyxAdapter";
import { PixiFallbackPreview } from "../lib/pixiPreview";

type Props = {
  config: EditorConfig;
};

export function CanvasView({ config }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const partyxRef = useRef<PartyxHandle | null>(null);
  const fallbackRef = useRef<PixiFallbackPreview | null>(null);

  const bg = useMemo(() => ({ background: "#070b10" }), []);

  useEffect(() => {
    if (!hostRef.current) return;

    const app = new Application();
    appRef.current = app;

    let disposed = false;

    (async () => {
      await app.init({
        resizeTo: hostRef.current!,
        backgroundColor: 0x070b10,
        antialias: true,
      });

      if (disposed) return;

      hostRef.current!.appendChild(app.canvas);

      // Intenta partyx; si no, fallback.
      const partyx = await tryCreatePartyxEmitter(app, config);
      if (partyx) {
        partyxRef.current = partyx;
        app.ticker.add((dt) => partyx.update(dt / 60));
      } else {
        fallbackRef.current = new PixiFallbackPreview(app, config);
      }
    })();

    return () => {
      disposed = true;

      if (partyxRef.current) {
        partyxRef.current.destroy();
        partyxRef.current = null;
      }
      if (fallbackRef.current) {
        fallbackRef.current.destroy();
        fallbackRef.current = null;
      }

      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }

      if (hostRef.current) hostRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    partyxRef.current?.setConfig(config);
    fallbackRef.current?.setConfig(config);
  }, [config]);

  return <div ref={hostRef} className="canvasHost" style={bg} />;
}
