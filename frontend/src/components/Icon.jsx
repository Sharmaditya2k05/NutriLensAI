import React from 'react'

// Stroke icons drawn on a 24px grid. Replaces the emoji used throughout the old UI.
const P = {
  dashboard: <><rect x="3.5" y="3.5" width="7" height="9" rx="2" /><rect x="13.5" y="3.5" width="7" height="5" rx="2" /><rect x="13.5" y="11.5" width="7" height="9" rx="2" /><rect x="3.5" y="15.5" width="7" height="5" rx="2" /></>,
  scan: <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></>,
  swap: <><path d="M7 4 3.5 7.5 7 11" /><path d="M3.5 7.5H16a4 4 0 0 1 4 4" /><path d="m17 20 3.5-3.5L17 13" /><path d="M20.5 16.5H8a4 4 0 0 1-4-4" /></>,
  chat: <><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.4A8 8 0 1 1 20 12Z" /><path d="M8.5 11h.01M12 11h.01M15.5 11h.01" strokeWidth="2.4" /></>,
  plan: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M8 14h3M8 17h6" /></>,
  insights: <><path d="M4 19.5h16" /><path d="m5 15 4.5-4.5 3.5 3 6-6.5" /><path d="M15 7h4v4" /></>,
  about: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5" /><path d="M12 7.5h.01" strokeWidth="2.6" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  camera: <><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.5-2h5L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z" /><circle cx="12" cy="12.5" r="3.5" /></>,
  label: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8" strokeWidth="2.6" /><path d="M8 11h8M8 14h5M8 17h8" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  alert: <><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4" /><path d="M12 17h.01" strokeWidth="2.6" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5" /><path d="M12 8h.01" strokeWidth="2.6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  refresh: <><path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" /><path d="M19.5 4.5v4h-4" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></>,
  trash: <><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></>,
  send: <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
  droplet: <path d="M12 3.5s6.5 7 6.5 11a6.5 6.5 0 0 1-13 0c0-4 6.5-11 6.5-11Z" />,
  pill: <><rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" /><path d="m9.3 8.3 5.4 7.4" /></>,
  flame: <path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-3.5-2.5-5.5-3.5-9-1.5 1.5-2 3-2 4.5-1-1-2.5-2.5-2.5-5-2.5 2-5 5.5-5 9.5A6.5 6.5 0 0 0 12 21Z" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  leaf: <><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19c3-4 6-6.5 9.5-8" /></>,
  lens: <><circle cx="11" cy="11" r="7" /><path d="m20.5 20.5-4.5-4.5" /><path d="M8 11a3 3 0 0 1 3-3" /></>,
  bolt: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><rect x="9.5" y="9.5" width="5" height="5" rx="1" /><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" /></>,
  doc: <><path d="M6 3.5h8l4 4v13H6z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></>,
  bowl: <><path d="M3.5 11h17a8.5 8.5 0 0 1-17 0Z" /><path d="M8 20.5h8M9 7.5c0-1.5 1-1.5 1-3M13 7.5c0-1.5 1-1.5 1-3" /></>,
  grain: <><path d="M12 21V9" /><path d="M12 13c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4ZM12 13c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4ZM12 9c-2 0-3-1.2-3-3.2 2 0 3 1.2 3 3.2ZM12 9c2 0 3-1.2 3-3.2-2 0-3 1.2-3 3.2Z" /></>,
  shield: <><path d="M12 3.5 5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-2.5Z" /><path d="m9 12 2 2 4-4" /></>,
}

export default function Icon({ name, size = 20, stroke = 1.8, className = '', style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {P[name] || null}
    </svg>
  )
}
