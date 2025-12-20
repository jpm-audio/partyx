import React, { useMemo, useState } from "react";
import type { EditorConfig } from "../types";

type Props = {
  config: EditorConfig;
  onChange(next: EditorConfig): void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function Sidebar({ config, onChange }: Props) {
  const [copied, setCopied] = useState(false);

  const json = useMemo(() => JSON.stringify(config, null, 2), [config]);

  async function copy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  }

  return (
    <aside className="sidebar">
      <div className="h1">Partyx Editor</div>

      <div className="group">
        <div className="row">
          <label>Emission rate (p/s)</label>
          <input
            type="number"
            value={config.emissionRate}
            min={0}
            step={1}
            onChange={(e) =>
              onChange({ ...config, emissionRate: clamp(Number(e.target.value), 0, 5000) })
            }
          />
        </div>

        <div className="row">
          <label>Lifetime (s)</label>
          <input
            type="number"
            value={config.lifetime}
            min={0.05}
            step={0.05}
            onChange={(e) =>
              onChange({ ...config, lifetime: clamp(Number(e.target.value), 0.05, 20) })
            }
          />
        </div>

        <div className="row">
          <label>Speed (px/s)</label>
          <input
            type="number"
            value={config.speed}
            min={0}
            step={10}
            onChange={(e) =>
              onChange({ ...config, speed: clamp(Number(e.target.value), 0, 5000) })
            }
          />
        </div>

        <div className="row">
          <label>Size (px)</label>
          <input
            type="number"
            value={config.size}
            min={1}
            step={1}
            onChange={(e) =>
              onChange({ ...config, size: clamp(Number(e.target.value), 1, 256) })
            }
          />
        </div>

        <div className="row">
          <label>Spread (rad)</label>
          <input
            type="number"
            value={config.spread}
            min={0}
            step={0.05}
            onChange={(e) =>
              onChange({ ...config, spread: clamp(Number(e.target.value), 0, Math.PI * 2) })
            }
          />
        </div>

        <div className="row">
          <label>Tint (#RRGGBB)</label>
          <input
            type="text"
            value={config.tint}
            onChange={(e) => onChange({ ...config, tint: e.target.value })}
          />
        </div>

        <small>
          Exporta este JSON como configuración base. La integración real con <code>partyx</code>{" "}
          queda en <code>src/lib/partyxAdapter.ts</code>.
        </small>
      </div>

      <div className="group">
        <div className="row" style={{ gridTemplateColumns: "1fr" }}>
          <button className="primary" onClick={copy}>
            {copied ? "Copiado" : "Copiar JSON"}
          </button>
        </div>
        <textarea readOnly value={json} />
      </div>
    </aside>
  );
}
