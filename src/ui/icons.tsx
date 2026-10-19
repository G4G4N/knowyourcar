// Small line icons (1.6px stroke, 16px grid) so controls don't rely on emoji.
const base = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export const IconPlay = () => (
  <svg {...base}>
    <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconStop = () => (
  <svg {...base}>
    <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" />
  </svg>
);
export const IconPower = () => (
  <svg {...base}>
    <path d="M8 2.5v5" />
    <path d="M4.7 4.6a5 5 0 1 0 6.6 0" />
  </svg>
);
export const IconSound = ({ on }: { on: boolean }) => (
  <svg {...base}>
    <path d="M2.5 6v4h2.5l3.5 3V3L5 6H2.5Z" />
    {on ? (
      <>
        <path d="M10.5 5.8a3 3 0 0 1 0 4.4" />
        <path d="M12.3 4a5.5 5.5 0 0 1 0 8" />
      </>
    ) : (
      <path d="M11 6l3 4M14 6l-3 4" />
    )}
  </svg>
);
export const IconClose = () => (
  <svg {...base}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
);
export const IconMenu = () => (
  <svg {...base}>
    <path d="M2.5 5h11M2.5 11h11" />
  </svg>
);
export const IconChevron = () => (
  <svg {...base}>
    <path d="M4 6l4 4 4-4" />
  </svg>
);
export const IconArrow = ({ dir = 'right' }: { dir?: 'left' | 'right' }) => (
  <svg {...base} style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);
