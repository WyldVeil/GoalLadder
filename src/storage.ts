import { invoke } from "@tauri-apps/api/core";
import type { Ladder, SaveFile } from "./types";

const inTauri = "__TAURI_INTERNALS__" in window;
const LS_KEY = "goalladder.preview";

export async function loadLadders(): Promise<Ladder[]> {
  const raw = inTauri ? await invoke<string | null>("load_goals") : localStorage.getItem(LS_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as SaveFile;
  if (!parsed || !Array.isArray(parsed.ladders)) throw new Error("goals.json is not in the expected format");
  return parsed.ladders.map((l) => ({
    ...l,
    name: l.name ?? "",
    reached: Math.max(0, Math.min(l.reached ?? 0, l.rungs.length)),
  }));
}

export async function saveLadders(ladders: Ladder[]): Promise<void> {
  const data = JSON.stringify({ version: 1, ladders } satisfies SaveFile, null, 2);
  if (inTauri) await invoke("save_goals", { data });
  else localStorage.setItem(LS_KEY, data);
}

export async function dataLocation(): Promise<string> {
  return inTauri ? invoke<string>("data_location") : "browser localStorage (preview mode)";
}
