import React, { useState } from "react";
import { CanvasView } from "./components/CanvasView";
import { Sidebar } from "./components/Sidebar";
import type { EditorConfig } from "./types";

const initial: EditorConfig = {
  emissionRate: 120,
  lifetime: 1.2,
  speed: 520,
  size: 18,
  spread: Math.PI / 2,
  tint: "#7dd3fc",
};

export default function App() {
  const [config, setConfig] = useState<EditorConfig>(initial);

  return (
    <div className="app">
      <CanvasView config={config} />
      <Sidebar config={config} onChange={setConfig} />
    </div>
  );
}
