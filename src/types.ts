export interface Rung {
  id: string;
  text: string;
  reachedAt?: string;
}

/** A ladder is an ordered list of steps. The first `reached` steps are done,
 *  the next one is the current focus, and everything after it is locked. */
export interface Ladder {
  id: string;
  name: string;
  rungs: Rung[];
  reached: number;
  createdAt: string;
}

export interface SaveFile {
  version: 1;
  ladders: Ladder[];
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const isComplete = (l: Ladder) => l.rungs.length > 0 && l.reached >= l.rungs.length;

/** Lets people type a whole ladder in one line: "Run 5k -> Run 10k -> Half marathon". */
export const splitSteps = (text: string) =>
  text
    .split(/\s*(?:->|=>|\u2192)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
