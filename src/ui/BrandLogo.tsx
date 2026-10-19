export function BrandLogo({ id, size = 28 }: { id: string; size?: number }) {
  if (id === 'audi')
    return (
      <svg width={size * 2} height={size} viewBox="0 0 64 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        {[12, 25, 38, 51].map((cx) => (
          <circle key={cx} cx={cx} cy="12" r="9" />
        ))}
      </svg>
    );
  if (id === 'bmw')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        <path d="M12 5 A7 7 0 0 1 19 12 L12 12Z M12 19 A7 7 0 0 1 5 12 L12 12Z" fill="currentColor" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="10.5" />
      <path d="M12 1.8 L13.2 11.2 L21 17.4 L12 13.4 L3 17.4 L10.8 11.2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
