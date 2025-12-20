import type { Application } from "pixi.js";
import type { EditorConfig } from "../types";

export type PartyxHandle = {
  update(dtSeconds: number): void;
  destroy(): void;
  setConfig(next: EditorConfig): void;
};

export async function tryCreatePartyxEmitter(app: Application, config: EditorConfig): Promise<PartyxHandle | null> {
  // Nota: esto está deliberadamente “blando” para no bloquear el scaffold si la API de partyx difiere.
  const mod: any = await import("partyx");

  // Ejemplo de “detección” (ajústalo a tu API real de partyx):
  const factory = mod?.createEmitter ?? mod?.Emitter ?? mod?.default;
  if (!factory) return null;

  // Si tu partyx requiere un contenedor Pixi, aquí lo enganchas.
  // En este scaffold devolvemos null para usar el fallback hasta que completes la integración.
  void app;
  void config;
  return null;
}
