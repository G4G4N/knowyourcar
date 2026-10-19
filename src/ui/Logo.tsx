/**
 * KnowYourCar mark: a car's side profile drawn as one line, cut by a vertical scan line —
 * the moment the X-ray passes through it.
 */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className="logo-mark">
      <rect x="1" y="1" width="30" height="30" rx="8" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5" />
      <path
        d="M5.5 19.5h2.2a2.6 2.6 0 0 1 5.1 0h6.4a2.6 2.6 0 0 1 5.1 0h2.2v-2.4c0-.8-.5-1.4-1.3-1.6l-3.4-.8-3.2-2.9a3 3 0 0 0-2-.8H12a3 3 0 0 0-2.3 1.1L8 14.2l-1.4.4c-.7.2-1.1.8-1.1 1.5v3.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10.25" cy="19.75" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="21.75" cy="19.75" r="1.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18.5 6.5v19" stroke="var(--ice)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <a className="logo" href="/" aria-label="KnowYourCar home" onClick={(e) => e.preventDefault()}>
      <LogoMark />
      <span className="wordmark">
        know<span>your</span>car
      </span>
    </a>
  );
}
