// Lightweight inline icon set — currentColor driven, sized via className.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

const Svg = ({ children, size = 20, className = '', viewBox = '0 0 24 24', ...rest }) => (
  <svg width={size} height={size} viewBox={viewBox} className={className} {...base} {...rest}>
    {children}
  </svg>
)

export const Menu = (p) => (
  <Svg {...p}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </Svg>
)

export const Calendar = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
  </Svg>
)

export const Bell = (p) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Svg>
)

export const Gear = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
)

export const Search = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
)

export const ChevronDown = (p) => (
  <Svg {...p}>
    <polyline points="6 9 12 15 18 9" />
  </Svg>
)

export const Close = (p) => (
  <Svg {...p}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
)

export const ArrowUp = (p) => (
  <Svg {...p}>
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </Svg>
)

export const ArrowDown = (p) => (
  <Svg {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </Svg>
)

export const DashboardIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </Svg>
)

export const RegistryIcon = (p) => (
  <Svg {...p}>
    <path d="M4 4h12l4 4v12H4z" />
    <polyline points="16 4 16 8 20 8" />
    <line x1="8" y1="13" x2="15" y2="13" />
    <line x1="8" y1="17" x2="15" y2="17" />
  </Svg>
)

export const AnalysisIcon = (p) => (
  <Svg {...p}>
    <line x1="4" y1="20" x2="20" y2="20" />
    <rect x="6" y="11" width="3" height="6" />
    <rect x="11" y="7" width="3" height="10" />
    <rect x="16" y="13" width="3" height="4" />
  </Svg>
)

export const CheckCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="8.5 12.5 11 15 16 9.5" />
  </Svg>
)

export const PauseCircle = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="10" y1="9" x2="10" y2="15" />
    <line x1="14" y1="9" x2="14" y2="15" />
  </Svg>
)
