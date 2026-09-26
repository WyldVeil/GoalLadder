import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Lock, Plus, X } from "lucide-react";
import { splitSteps, uid, type Ladder } from "../types";

export interface EditorRow {
  id: string;
  text: string;
  reached: boolean;
  reachedAt?: string;
}

interface Props {
  initial?: Ladder;
  onSave: (name: string, rows: EditorRow[]) => void;
  onCancel: () => void;
}

const blank = (): EditorRow => ({ id: uid(), text: "", reached: false });

const EXAMPLES = ["Run 5k without stopping", "Run a 10k", "Run a half marathon", "Run a marathon"];

/** Expands any unreached row typed as "A -> B -> C" into separate rows. */
function expand(rows: EditorRow[]): EditorRow[] {
  return rows.flatMap((r) => {
    if (r.reached) return [r];
    const parts = splitSteps(r.text);
    if (parts.length < 2) return [r];
    return parts.map((text, i) => ({ id: i === 0 ? r.id : uid(), text, reached: false }));
  });
}

export default function LadderEditor({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [rows, setRows] = useState<EditorRow[]>(() =>
    initial
      ? initial.rungs.map((r, i) => ({ id: r.id, text: r.text, reached: i < initial.reached, reachedAt: r.reachedAt }))
      : [blank()],
  );
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const [focusId, setFocusId] = useState<string | null>(initial ? null : rows[0].id);

  useEffect(() => {
    if (!focusId) return;
    inputs.current.get(focusId)?.focus();
    setFocusId(null);
  }, [focusId]);

  const firstOpen = rows.findIndex((r) => !r.reached);
  const cleaned = expand(rows)
    .map((r) => ({ ...r, text: r.text.trim() }))
    .filter((r) => r.text);
  const canSave = cleaned.length > 0;

  const save = () => canSave && onSave(name.trim(), cleaned);

  const setText = (id: string, text: string) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, text } : r)));

  const addAfter = (index: number) => {
    const row = blank();
    setRows((rs) => [...rs.slice(0, index + 1), row, ...rs.slice(index + 1)]);
    setFocusId(row.id);
  };

  const removeRow = (id: string) =>
    setRows((rs) => {
      const next = rs.filter((r) => r.id !== id);
      return next.length ? next : [blank()];
    });

  const moveRow = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const out = [...rs];
      [out[i], out[i + dir]] = [out[i + dir], out[i]];
      return out;
    });

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
    } else if (e.key === "Enter") {
      e.preventDefault();
      const expanded = expand(rows);
      if (expanded.length !== rows.length) {
        setRows([...expanded, blank()]);
        return;
      }
      if (i === rows.length - 1) {
        if (rows[i].text.trim()) addAfter(i);
      } else {
        inputs.current.get(rows[i + 1].id)?.focus();
      }
    } else if (e.key === "Backspace" && !rows[i].text && rows.length > 1 && !rows[i].reached) {
      e.preventDefault();
      const prev = rows[i - 1] ?? rows[i + 1];
      removeRow(rows[i].id);
      setFocusId(prev.id);
    }
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);

  return (
    <div className="backdrop">
      <div className="dialog" role="dialog" aria-modal aria-labelledby="editor-title">
        <header>
          <h2 id="editor-title">{initial ? "Edit ladder" : "New goal"}</h2>
          <button className="icon-btn" onClick={onCancel} title="Close (Esc)">
            <X size={18} />
          </button>
        </header>

        <label className="field-label" htmlFor="ladder-name">
          Name <span>optional</span>
        </label>
        <input
          id="ladder-name"
          className="field"
          value={name}
          placeholder="e.g. Fitness, Work, Home"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (e.ctrlKey || e.metaKey) save();
              else inputs.current.get(rows[0].id)?.focus();
            }
          }}
        />

        <div className="field-label">Steps</div>
        <ol className="edit-rows">
          {rows.map((r, i) => {
            const locked = !r.reached && i > firstOpen;
            return (
              <li key={r.id} className={`edit-row ${r.reached ? "reached" : locked ? "locked" : "current"}`}>
                <span className="edit-node">
                  {r.reached ? <Check size={13} strokeWidth={3} /> : locked ? <Lock size={11} strokeWidth={2.5} /> : i + 1}
                </span>
                <input
                  ref={(el) => {
                    if (el) inputs.current.set(r.id, el);
                    else inputs.current.delete(r.id);
                  }}
                  className="field"
                  value={r.text}
                  placeholder={i === 0 ? `Your goal, e.g. ${EXAMPLES[0]}` : `Then... e.g. ${EXAMPLES[i % EXAMPLES.length]}`}
                  onChange={(e) => setText(r.id, e.target.value)}
                  onKeyDown={(e) => onKey(e, i)}
                />
                <div className="row-tools">
                  <button
                    className="icon-btn"
                    title="Move up"
                    disabled={r.reached || i === 0 || rows[i - 1].reached}
                    onClick={() => moveRow(i, -1)}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    className="icon-btn"
                    title="Move down"
                    disabled={r.reached || i === rows.length - 1}
                    onClick={() => moveRow(i, 1)}
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button className="icon-btn" title="Remove step" onClick={() => removeRow(r.id)}>
                    <X size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <button className="add-step" onClick={() => addAfter(rows.length - 1)}>
          <Plus size={15} /> Add a step that unlocks after this
        </button>

        <p className="hint">
          Only the first open step is in focus. Each step after it stays locked until you reach the one above. One step on
          its own is just a plain goal. You can also type <kbd>Run 5k -&gt; Run 10k</kbd> to add several at once.
        </p>

        <footer>
          <span className="keys">
            <kbd>Enter</kbd> next step <kbd>Ctrl</kbd>+<kbd>Enter</kbd> save
          </span>
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={save} disabled={!canSave}>
            {initial ? "Save" : "Add goal"}
          </button>
        </footer>
      </div>
    </div>
  );
}
