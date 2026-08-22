/**
 * Line-art industrial icons for the intro experience.
 *
 * Deliberately separate from lib/iconAssets.js (the marketplace's raster
 * PNG icons): those are full-colour tiles built for listing cards, whereas
 * the intro needs single-stroke outlines that inherit currentColor so they
 * can glow amber against the poster background. Ported from the design
 * reference's own icon set so the intro matches the artwork exactly.
 */

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const wheels = (xs, y = 38, r = 5) => xs.map((x) => <circle key={x} cx={x} cy={y} r={r} />);

export function ExcavatorIcon(props) {
  return (
    <svg viewBox="0 0 64 48" {...strokeProps} {...props}>
      <path d="M6 40h30M8 34h26v6H8z" />
      <path d="M18 34v-8h12v8" />
      <path d="M30 26 44 12l6 6" />
      <path d="M50 18l4 8-8 4-4-8z" />
    </svg>
  );
}

export function DumperIcon(props) {
  return (
    <svg viewBox="0 0 64 48" {...strokeProps} {...props}>
      <path d="M6 32h26V14H6zM32 32h10l6-10h8v10" />
      <path d="M4 32h56" />
      {wheels([14, 26, 46, 54])}
    </svg>
  );
}

export function TankerIcon(props) {
  return (
    <svg viewBox="0 0 64 48" {...strokeProps} {...props}>
      <rect x="4" y="16" width="30" height="16" rx="8" />
      <path d="M34 32h10l6-10h8v10M4 32h56" />
      {wheels([12, 24, 46, 56])}
    </svg>
  );
}

export function MixerIcon(props) {
  return (
    <svg viewBox="0 0 64 48" {...strokeProps} {...props}>
      <path d="M10 32 18 14h14l6 18z" />
      <path d="M38 32h6l6-10h8v10M6 32h54" />
      {wheels([16, 28, 48, 56])}
    </svg>
  );
}

export function CraneIcon(props) {
  return (
    <svg viewBox="0 0 64 48" {...strokeProps} {...props}>
      <path d="M18 42V8M8 42h20M10 12h44M54 12v10M18 8l-4 4M18 8l4 4" />
      <path d="M54 22a3 3 0 1 0 0 6" />
    </svg>
  );
}

export function BusIcon(props) {
  return (
    <svg viewBox="0 0 64 48" {...strokeProps} {...props}>
      <rect x="6" y="12" width="52" height="20" rx="4" />
      <path d="M12 18h16v8H12zM34 18h16v8H34z" />
      {wheels([18, 46])}
    </svg>
  );
}

export function PartsIcon(props) {
  return (
    <svg viewBox="0 0 64 48" {...strokeProps} {...props}>
      <circle cx="28" cy="24" r="12" />
      <circle cx="28" cy="24" r="4" />
      <path d="M28 8v4M28 36v4M12 24h4M40 24h4M17 13l3 3M39 32l3 3M39 16l3-3M17 35l3-3" />
      <path d="M42 34l10 10" />
    </svg>
  );
}

export function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 48 48" {...strokeProps} {...props}>
      <path d="M24 6 40 12v14c0 10-8 14-16 18-8-4-16-8-16-18V12z" />
    </svg>
  );
}

export function HandshakeIcon(props) {
  return (
    <svg viewBox="0 0 48 48" {...strokeProps} {...props}>
      <path d="M4 22l8-8 8 4 4-2 4 2 8-4 8 8-8 10-6-4-6 6-6-6-6 4z" />
    </svg>
  );
}

export function BadgeCheckIcon(props) {
  return (
    <svg viewBox="0 0 48 48" {...strokeProps} {...props}>
      <circle cx="24" cy="24" r="16" />
      <path d="M17 24l5 5 9-10" />
    </svg>
  );
}

export function GlobeIcon(props) {
  return (
    <svg viewBox="0 0 48 48" {...strokeProps} {...props}>
      <circle cx="24" cy="24" r="16" />
      <path d="M8 24h32M24 8c6 5 6 27 0 32M24 8c-6 5-6 27 0 32" />
    </svg>
  );
}

export function HeadsetIcon(props) {
  return (
    <svg viewBox="0 0 48 48" {...strokeProps} {...props}>
      <path d="M10 28v-4a14 14 0 0 1 28 0v4" />
      <rect x="6" y="26" width="8" height="12" rx="3" />
      <rect x="34" y="26" width="8" height="12" rx="3" />
      <path d="M38 38a6 6 0 0 1-6 6h-4" />
    </svg>
  );
}
