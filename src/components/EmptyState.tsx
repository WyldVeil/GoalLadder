import { Plus } from "lucide-react";

export default function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty">
      <svg width="170" height="190" viewBox="0 0 170 190" aria-hidden>
        <defs>
          <radialGradient id="empty-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#88C0D0" stopOpacity="0.35" />
            <stop offset="1" stopColor="#88C0D0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="85" cy="142" rx="80" ry="28" fill="url(#empty-glow)" />
        <path d="M52 180 L68 14 M118 180 L102 14" stroke="#4C566A" strokeWidth="7" strokeLinecap="round" />
        <path d="M56 142 L114 142" stroke="#88C0D0" strokeWidth="9" strokeLinecap="round" className="empty-rung" />
        <path d="M60 106 L110 106 M63 72 L107 72 M66 40 L104 40" stroke="#434C5E" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <h2>Start with one goal</h2>
      <p>
        Write down what you are working toward. If it leads somewhere, add what comes after it. Later steps stay locked
        until you reach the one before, so only the next thing is in focus.
      </p>
      <button className="btn primary big" onClick={onAdd}>
        <Plus size={18} strokeWidth={2.5} /> Add your first goal
      </button>
    </div>
  );
}
