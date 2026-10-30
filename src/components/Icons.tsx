// Small line icons (Lucide-style geometry), drawn inline so nothing extra loads.
type P = { className?: string };
const S = ({ className = "w-5 h-5", children }: P & { children: React.ReactNode }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
);
export const Mic = (p: P) => <S {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></S>;
export const Keyboard = (p: P) => <S {...p}><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></S>;
export const Play = (p: P) => <S {...p}><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" /></S>;
export const Check = (p: P) => <S {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></S>;
export const X = (p: P) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const Arrow = (p: P) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>;
export const Calendar = (p: P) => <S {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></S>;
export const Shield = (p: P) => <S {...p}><path d="M12 3 5 6v6c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z" /><path d="m9 12 2 2 4-4" /></S>;
export const Bot = (p: P) => <S {...p}><rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 4v4M9 13h.01M15 13h.01" /></S>;
export const Languages = (p: P) => <S {...p}><path d="M4 5h9M8.5 3v2M6 5c.5 3 2.5 5.5 5.5 7M11 5c-.5 3-2.6 6-6.5 8" /><path d="m12.5 21 4-9 4 9M14 18h5" /></S>;
export const Flag = (p: P) => <S {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></S>;
export const Phone = (p: P) => <S {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" /></S>;
export const Sparkle = (p: P) => <S {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></S>;
export const Store = (p: P) => <S {...p}><path d="M4 9.5 5.5 4h13L20 9.5M4 9.5V20h16V9.5M4 9.5c0 1.5 1.3 2.5 2.7 2.5S9.3 11 9.3 9.5c0 1.5 1.3 2.5 2.7 2.5s2.7-1 2.7-2.5c0 1.5 1.3 2.5 2.7 2.5S20 11 20 9.5" /><path d="M10 20v-5h4v5" /></S>;
export const Tooth = (p: P) => <S {...p}><path d="M7 4c2 0 3 1 5 1s3-1 5-1c2.5 0 3.5 2.5 3 5-.6 3-1.5 4.5-2 8-.3 2-1.3 3-2.2 3-1.3 0-1.5-2-1.8-4-.2-1.2-.6-2-2-2s-1.8.8-2 2c-.3 2-.5 4-1.8 4-.9 0-1.9-1-2.2-3-.5-3.5-1.4-5-2-8-.5-2.5.5-5 3-5z" /></S>;
export const Scissors = (p: P) => <S {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" /></S>;
export const Utensils = (p: P) => <S {...p}><path d="M5 3v8a2 2 0 0 0 2 2v8M9 3v8M7 3v6M17 21V3c-2 1-3 3.5-3 7 0 2 1 3 3 3" /></S>;
export const Building = (p: P) => <S {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3" /></S>;
export const Book = (p: P) => <S {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5zM4 21.5V5.5M8 7h8" /></S>;
export const Bag = (p: P) => <S {...p}><path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2" /></S>;
export const Volume = (p: P) => <S {...p}><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></S>;
