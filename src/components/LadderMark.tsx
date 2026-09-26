/** The app icon's ladder, drawn inline so it stays crisp at any size. */
export default function LadderMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 1024 1024" aria-hidden>
      <rect x="48" y="48" width="928" height="928" rx="208" fill="#3B4252" />
      <path d="M330 860 L408 170 M694 860 L616 170" stroke="#D8DEE9" strokeWidth="44" strokeLinecap="round" fill="none" />
      <path d="M348 720 L676 720 M370 568 L654 568" stroke="#A3BE8C" strokeWidth="52" strokeLinecap="round" />
      <path d="M388 418 L636 418" stroke="#88C0D0" strokeWidth="58" strokeLinecap="round" />
      <path d="M404 272 L620 272" stroke="#4C566A" strokeWidth="48" strokeLinecap="round" />
    </svg>
  );
}
