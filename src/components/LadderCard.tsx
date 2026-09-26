import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Flag, Lock, MoreHorizontal, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import { isComplete, splitSteps, type Ladder } from "../types";

interface Props {
  ladder: Ladder;
  fresh: string | null;
  onReach: () => void;
  onUndo: () => void;
  onAddStep: (texts: string[]) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

// With a long history, only the most recent reached step stays visible until expanded.
const COLLAPSE_AFTER = 2;

export default function LadderCard(p: Props) {
  const { ladder } = p;
  const complete = isComplete(ladder);
  const total = ladder.rungs.length;
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const cancelled = useRef(false);

  const hidden = !expanded && ladder.reached > COLLAPSE_AFTER ? ladder.reached - 1 : 0;
  const visible = ladder.rungs.slice(hidden);

  const commitDraft = () => {
    const steps = splitSteps(draft);
    if (steps.length) p.onAddStep(steps);
    setDraft("");
  };

  return (
    <article className={`card ${complete ? "complete" : ""}`}>
      <header className="card-head">
        <div className="card-title">
          {complete ? (
            <span className="badge summit">
              <Flag size={13} strokeWidth={2.5} /> {total > 1 ? "Ladder complete" : "Reached"}
            </span>
          ) : total > 1 ? (
            <span className="badge">
              Step {ladder.reached + 1} of {total}
            </span>
          ) : (
            <span className="badge">Goal</span>
          )}
          {ladder.name && <h2>{ladder.name}</h2>}
        </div>
        <CardMenu {...p} />
      </header>

      {total > 1 && (
        <div className="progress" aria-hidden>
          <span style={{ width: `${(ladder.reached / total) * 100}%` }} />
        </div>
      )}

      <ol className="rungs">
        {hidden > 0 && (
          <li className="rung reached collapsed">
            <div className="rail">
              <button className="node more" onClick={() => setExpanded(true)} title="Show earlier steps">
                +{hidden}
              </button>
            </div>
            <button className="rung-body link" onClick={() => setExpanded(true)}>
              {hidden} earlier {hidden === 1 ? "step" : "steps"} reached
            </button>
          </li>
        )}
        {visible.map((r, k) => {
          const i = k + hidden;
          const state = i < ladder.reached ? "reached" : i === ladder.reached ? "current" : "locked";
          const isFresh = p.fresh === r.id;
          const lastReached = i === ladder.reached - 1;
          return (
            <li key={r.id} className={`rung ${state} ${isFresh ? "fresh" : ""}`}>
              <div className="rail">
                <span className="node">
                  {state === "reached" && <Check size={14} strokeWidth={3} />}
                  {state === "locked" && <Lock size={12} strokeWidth={2.5} />}
                </span>
              </div>
              <div className="rung-body" title={state === "locked" ? `Unlocks after: ${ladder.rungs[i - 1].text}` : undefined}>
                {state === "current" && <span className="eyebrow">{total > 1 ? "Now" : "Focus"}</span>}
                <p className="rung-text">{r.text}</p>
                {state === "current" && (
                  <button className="btn reach" onClick={p.onReach}>
                    <Check size={16} strokeWidth={3} /> Reached it
                  </button>
                )}
              </div>
              {lastReached && (
                <button className="icon-btn undo" onClick={p.onUndo} title="Not quite there yet? Step back">
                  <Undo2 size={15} />
                </button>
              )}
            </li>
          );
        })}
        {expanded && ladder.reached > COLLAPSE_AFTER && (
          <li className="collapse-link">
            <button onClick={() => setExpanded(false)}>Hide earlier steps</button>
          </li>
        )}
      </ol>

      <footer className="card-foot">
        {adding ? (
          <input
            autoFocus
            className="add-input"
            value={draft}
            placeholder={complete ? "What's next? Keep climbing..." : "Then what? (Enter to add)"}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitDraft();
              if (e.key === "Escape") {
                cancelled.current = true;
                e.currentTarget.blur();
              }
            }}
            onBlur={() => {
              if (!cancelled.current) commitDraft();
              cancelled.current = false;
              setDraft("");
              setAdding(false);
            }}
          />
        ) : (
          <button className="add-step" onClick={() => setAdding(true)}>
            <Plus size={15} /> {complete ? "Keep climbing" : "Add a step"}
          </button>
        )}
      </footer>
    </article>
  );
}

function CardMenu(p: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setConfirm(false);
  }, [open]);

  const act = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  return (
    <div className="menu-wrap" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((o) => !o)} title="Options" aria-expanded={open}>
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <button onClick={act(p.onEdit)}>
            <Pencil size={15} /> Edit steps
          </button>
          <button onClick={act(() => p.onMove(-1))} disabled={!p.canMoveUp}>
            <ArrowUp size={15} /> Move earlier
          </button>
          <button onClick={act(() => p.onMove(1))} disabled={!p.canMoveDown}>
            <ArrowDown size={15} /> Move later
          </button>
          <hr />
          {confirm ? (
            <button className="danger" onClick={act(p.onDelete)}>
              <Trash2 size={15} /> Click again to delete
            </button>
          ) : (
            <button className="danger" onClick={() => setConfirm(true)}>
              <Trash2 size={15} /> Delete ladder
            </button>
          )}
        </div>
      )}
    </div>
  );
}
