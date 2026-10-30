// Munshi mark: a scribe's pen nib whose tip is the tail of a speech bubble (the clerk who talks).
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      {/* bubble body */}
      <path d="M21 4.5c8.6 0 15 6 15 13.7S29.6 32 21 32c-2.2 0-4.3-.4-6.2-1.1L5.5 36l2.9-8.6C6.3 25 5.5 22 5.5 18.2 5.5 10.5 12.4 4.5 21 4.5Z" fill="#0D7377" />
      {/* nib slit running from the tail into the bubble, ending in the breather hole */}
      <path d="M8.6 33.2 17.4 22.6" stroke="#FBF8F3" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="19.3" cy="20.4" r="2.6" fill="#FBF8F3" />
      {/* the words: three ink strokes of different lengths, like handwriting on a line */}
      <path d="M24.5 13.2h6.2M24.5 17.6h4.2M24.5 22h5.4" stroke="#F2A44B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="font-display text-[22px] leading-none tracking-tight text-ink">Munshi</span>
    </span>
  );
}
