import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { isComplete, uid, type Ladder, type Rung } from "./types";
import { dataLocation, loadLadders, saveLadders } from "./storage";
import LadderCard from "./components/LadderCard";
import LadderEditor, { type EditorRow } from "./components/LadderEditor";
import EmptyState from "./components/EmptyState";
import LadderMark from "./components/LadderMark";

interface Toast {
  key: number;
  title: string;
  body: string;
  complete: boolean;
  undo?: () => void;
}

type EditorTarget = { id: string | null } | null;

export default function App() {
  const [ladders, setLadders] = useState<Ladder[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<EditorTarget>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const skipSave = useRef(true);
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadLadders()
      .then((l) => {
        setLadders(l);
        setStatus("ready");
      })
      .catch(async (e) => {
        setError(`${e}. Your file was left untouched: ${await dataLocation().catch(() => "")}`);
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveLadders(ladders).catch((e) => setError(`Could not save: ${e}`));
  }, [ladders, status]);

  const showToast = useCallback((t: Omit<Toast, "key">) => {
    window.clearTimeout(toastTimer.current);
    setToast({ ...t, key: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), 6000);
  }, []);

  const openEditor = (id: string | null) => {
    setToast(null);
    setEditor({ id });
  };

  const update = (id: string, fn: (l: Ladder) => Ladder) =>
    setLadders((ls) => ls.map((l) => (l.id === id ? fn(l) : l)));

  const undo = (id: string) => {
    update(id, (l) => {
      if (l.reached === 0) return l;
      const i = l.reached - 1;
      return { ...l, reached: i, rungs: l.rungs.map((r, j) => (j === i ? { ...r, reachedAt: undefined } : r)) };
    });
    setFresh(null);
    setToast(null);
  };

  const reach = (ladder: Ladder) => {
    if (isComplete(ladder)) return;
    const i = ladder.reached;
    const done = ladder.rungs[i];
    const next = ladder.rungs[i + 1];
    update(ladder.id, (l) => ({
      ...l,
      reached: i + 1,
      rungs: l.rungs.map((r, j) => (j === i ? { ...r, reachedAt: new Date().toISOString() } : r)),
    }));
    setFresh(next?.id ?? done.id);
    showToast(
      next
        ? { title: "Step reached", body: `Unlocked: ${next.text}`, complete: false, undo: () => undo(ladder.id) }
        : {
            title: ladder.rungs.length > 1 ? "Ladder complete" : "Goal reached",
            body: done.text,
            complete: true,
            undo: () => undo(ladder.id),
          },
    );
  };

  const addStep = (id: string, texts: string[]) =>
    update(id, (l) => ({ ...l, rungs: [...l.rungs, ...texts.map((text) => ({ id: uid(), text }))] }));

  const remove = (id: string) => setLadders((ls) => ls.filter((l) => l.id !== id));

  // Moves a ladder past its nearest neighbour in the same section (climbing or completed).
  const move = (id: string, dir: -1 | 1) =>
    setLadders((ls) => {
      const from = ls.findIndex((l) => l.id === id);
      const group = isComplete(ls[from]);
      let to = from + dir;
      while (to >= 0 && to < ls.length && isComplete(ls[to]) !== group) to += dir;
      if (to < 0 || to >= ls.length) return ls;
      const out = [...ls];
      [out[from], out[to]] = [out[to], out[from]];
      return out;
    });

  const saveEditor = (name: string, rows: EditorRow[]) => {
    const rungs: Rung[] = rows.map((r) => ({ id: r.id, text: r.text, reachedAt: r.reachedAt }));
    const reached = rows.filter((r) => r.reached).length;
    const id = editor?.id;
    if (id) update(id, (l) => ({ ...l, name, rungs, reached }));
    else setLadders((ls) => [{ id: uid(), name, rungs, reached: 0, createdAt: new Date().toISOString() }, ...ls]);
    setEditor(null);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n" && !editor && status === "ready") {
        e.preventDefault();
        openEditor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, status]);

  const climbing = ladders.filter((l) => !isComplete(l));
  const completed = ladders.filter(isComplete);
  const stepsReached = ladders.reduce((n, l) => n + l.reached, 0);

  const card = (l: Ladder, group: Ladder[]) => (
    <LadderCard
      key={l.id}
      ladder={l}
      fresh={fresh}
      onReach={() => reach(l)}
      onUndo={() => undo(l.id)}
      onAddStep={(t) => addStep(l.id, t)}
      onEdit={() => openEditor(l.id)}
      onDelete={() => remove(l.id)}
      onMove={(d) => move(l.id, d)}
      canMoveUp={group[0]?.id !== l.id}
      canMoveDown={group[group.length - 1]?.id !== l.id}
    />
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <LadderMark size={38} />
          <div>
            <h1>Goal Ladder</h1>
            {status === "ready" && ladders.length > 0 && (
              <p>
                {climbing.length} {climbing.length === 1 ? "goal" : "goals"} in focus
                {stepsReached > 0 && (
                  <>
                    <span className="dot" />
                    {stepsReached} {stepsReached === 1 ? "step" : "steps"} reached
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        {status === "ready" && (
          <button className="btn primary" onClick={() => openEditor(null)} title="New goal (Ctrl+N)">
            <Plus size={18} strokeWidth={2.5} /> New goal
          </button>
        )}
      </header>

      <main>
        {error && <div className="banner">{error}</div>}

        {status === "ready" && ladders.length === 0 && <EmptyState onAdd={() => openEditor(null)} />}

        {status === "ready" && ladders.length > 0 && (
          <>
            {climbing.length > 0 ? (
              <div className="grid">{climbing.map((l) => card(l, climbing))}</div>
            ) : (
              <div className="all-done">
                Every ladder is climbed. <button onClick={() => openEditor(null)}>Add a new goal</button>
              </div>
            )}

            {completed.length > 0 && (
              <section className="done-section">
                <button className={`section-toggle ${showDone ? "open" : ""}`} onClick={() => setShowDone((v) => !v)}>
                  <ChevronDown size={16} />
                  Completed <span className="count">{completed.length}</span>
                </button>
                {showDone && <div className="grid">{completed.map((l) => card(l, completed))}</div>}
              </section>
            )}
          </>
        )}
      </main>

      {editor && (
        <LadderEditor
          initial={editor.id ? ladders.find((l) => l.id === editor.id) : undefined}
          onSave={saveEditor}
          onCancel={() => setEditor(null)}
        />
      )}

      {toast && (
        <div key={toast.key} className={`toast ${toast.complete ? "complete" : ""}`} role="status">
          <div>
            <strong>{toast.title}</strong>
            <span>{toast.body}</span>
          </div>
          {toast.undo && <button onClick={toast.undo}>Undo</button>}
        </div>
      )}
    </div>
  );
}
