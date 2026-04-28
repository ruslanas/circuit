import React from 'react';

// Custom SVG icons for standard electrical symbols
export const AcSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M 7 12 Q 9.5 4 12 12 T 17 12" />
  </svg>
);

export const OscillatorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M 6 12 Q 9 6 12 12 T 18 12" />
  </svg>
);

export const OpAmpSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="4,4 20,12 4,20" fill="transparent" stroke="currentColor" strokeWidth="2" />
    <line x1="6" y1="8" x2="9" y2="8" />
    <line x1="7.5" y1="6.5" x2="7.5" y2="9.5" />
    <line x1="6" y1="16" x2="9" y2="16" />
  </svg>
);

export const ComparatorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="4,4 20,12 4,20" fill="transparent" stroke="currentColor" strokeWidth="2" />
    <line x1="6" y1="8" x2="9" y2="8" />
    <line x1="7.5" y1="6.5" x2="7.5" y2="9.5" />
    <line x1="6" y1="16" x2="9" y2="16" />
    <path d="M 11 14 L 11 10 L 15 10" strokeWidth="1.5" />
    <line x1="9" y1="14" x2="11" y2="14" strokeWidth="1.5" />
  </svg>
);

export const PlcSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="7" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="7" cy="16" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="16" r="1" fill="currentColor" stroke="none" />
    <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none" style={{fontFamily: 'monospace', fontWeight: 'bold'}}>PLC</text>
  </svg>
);

export const LatchSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none" style={{fontFamily: 'monospace', fontWeight: 'bold'}}>LATCH</text>
    <path d="M7 8h2M7 16h2" />
    <path d="M15 8h2M15 16h2" />
  </svg>
);

export const ShiftRegisterSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h4m-4 8h4m2-4h4" />
    <path d="M11 8l4 4-4 4" />
  </svg>
);

export const CcdSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M6 10h3v4H6z M10.5 10h3v4h-3z M15 10h3v4h-3z" fill="currentColor" fillOpacity="0.3" />
    <text x="12" y="18" textAnchor="middle" fontSize="4.5" fill="currentColor" stroke="none" style={{fontFamily: 'monospace', fontWeight: 'bold'}}>CCD</text>
    <line x1="3" y1="12" x2="6" y2="12" strokeWidth="1.5" />
  </svg>
);

export const SevenSegmentSymbol = ({ size, className, style, segments = {} }) => {
  const segs = {
    a: { d: "M9 7 H15", on: segments.a }, b: { d: "M16 8 V12", on: segments.b },
    c: { d: "M16 14 V18", on: segments.c }, d: { d: "M9 19 H15", on: segments.d },
    e: { d: "M8 14 V18", on: segments.e }, f: { d: "M8 8 V12", on: segments.f },
    g: { d: "M9 13 H15", on: segments.g },
  };
  const color = style?.color || 'currentColor';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      {Object.values(segs).map((seg, i) => (
        <path key={i} d={seg.d} stroke={seg.on ? color : 'rgba(128,128,128,0.15)'} strokeWidth={seg.on ? 2 : 1.5} style={seg.on ? { filter: `drop-shadow(0 0 4px ${color})` } : {}} />
      ))}
    </svg>
  );
};

export const PwmSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M 6 14 H 10 V 10 H 14 V 14 H 18" />
  </svg>
);

export const DiodeSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="24" y2="12" />
    <polygon points="7,7 15,12 7,17" fill="currentColor" stroke="none" />
    <line x1="15" y1="7" x2="15" y2="17" />
  </svg>
);

export const BatterySymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="10" y2="12" />
    <line x1="10" y1="4" x2="10" y2="20" />
    <line x1="14" y1="8" x2="14" y2="16" strokeWidth="4" />
    <line x1="14" y1="12" x2="24" y2="12" />
    <line x1="4" y1="6" x2="8" y2="6" strokeWidth="1" />
    <line x1="6" y1="4" x2="6" y2="8" strokeWidth="1" />
  </svg>
);

export const ResistorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M0 12 h4 l2 -5 l4 10 l4 -10 l4 10 l2 -5 h4" />
  </svg>
);

export const CapacitorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="10" y2="12" />
    <line x1="14" y1="12" x2="24" y2="12" />
    <line x1="10" y1="4" x2="10" y2="20" strokeWidth="3" />
    <line x1="14" y1="4" x2="14" y2="20" strokeWidth="3" />
  </svg>
);

export const InductorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 12 h3 c0 -4 4 -4 4 0 c0 -4 4 -4 4 0 c0 -4 4 -4 4 0 h3" />
  </svg>
);

export const TransformerSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M4 2 v4 c3 0 3 4 0 4 c3 0 3 4 0 4 c3 0 3 4 0 4 v4" />
    <line x1="10" y1="4" x2="10" y2="20" />
    <line x1="14" y1="4" x2="14" y2="20" />
    <path d="M20 2 v4 c-3 0 -3 4 0 4 c-3 0 -3 4 0 4 c-3 0 -3 4 0 4 v4" />
  </svg>
);

export const Timer555Symbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <path d="M5 8h-2M5 12h-2M5 16h-2M19 8h2M19 12h2M19 16h2M12 5v-2M12 19v2" />
    <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none" style={{fontFamily: 'monospace', fontWeight: 'bold'}}>555</text>
  </svg>
);

export const RamSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 8h4M3 12h4M3 16h4M21 12h-4" />
    <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none" style={{fontFamily: 'monospace'}}>RAM</text>
  </svg>
);

export const LedSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="24" y2="12" />
    <polygon points="7,7 15,12 7,17" fill="currentColor" stroke="none" />
    <line x1="15" y1="7" x2="15" y2="17" />
    <line x1="12" y1="5" x2="16" y2="1" />
    <polyline points="16,4 16,1 13,1" strokeWidth="1.5" />
    <line x1="16" y1="5" x2="20" y2="1" />
    <polyline points="20,4 20,1 17,1" strokeWidth="1.5" />
  </svg>
);

export const SwitchSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="6" y2="12" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="7" y1="12" x2="16" y2="6" />
    <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="18" y1="12" x2="24" y2="12" />
  </svg>
);

export const PushButtonSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="6" y2="12" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="12" y1="8" x2="12" y2="2" />
    <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="18" y1="12" x2="24" y2="12" />
  </svg>
);

export const NpnSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="8" y1="6" x2="8" y2="18" strokeWidth="3" />
    <line x1="8" y1="10" x2="16" y2="4" />
    <line x1="8" y1="14" x2="16" y2="20" />
    <polygon points="16,20 12,18 15,15" fill="currentColor" stroke="none" />
    <circle cx="10" cy="12" r="11" strokeDasharray="2 2" />
  </svg>
);

export const PnpSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="8" y1="6" x2="8" y2="18" strokeWidth="3" />
    <line x1="8" y1="10" x2="16" y2="4" />
    <line x1="8" y1="14" x2="16" y2="20" />
    <polygon points="10,15 14,15 12,17.5" fill="currentColor" stroke="none" />
    <circle cx="10" cy="12" r="11" strokeDasharray="2 2" />
  </svg>
);

export const HBridgeSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 8 L8 16 M8 12 L16 12 M16 8 L16 16" />
  </svg>
);

export const MotorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15 L8 9 L12 13 L16 9 L16 15" />
  </svg>
);

export const ServoSymbol = ({ size, className, style, angle = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <circle cx="12" cy="13" r="4" />
    <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '12px 13px', transition: 'transform 0.1s linear' }}>
      <line x1="12" y1="13" x2="12" y2="4" strokeWidth="2" />
      <line x1="9" y1="4" x2="15" y2="4" strokeWidth="2" />
    </g>
  </svg>
);

export const PotentiometerSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M0 12 h4 l2 -5 l4 10 l4 -10 l4 10 l2 -5 h4" />
    <line x1="12" y1="2" x2="12" y2="8" strokeWidth="1.5" />
    <polygon points="12,10 10,7 14,7" fill="currentColor" stroke="none" />
  </svg>
);

export const CustomComponentIcon = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h4" />
  </svg>
);

export const PropellerSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 10 L16 4 L14 12 L20 16 L12 14 L8 20 L10 12 L4 8 Z" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

export const GyroscopeSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 2v5 M12 17v5 M2 12h5 M17 12h5" />
  </svg>
);

export const GroundSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="4" x2="12" y2="12" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="8" y1="16" x2="16" y2="16" />
    <line x1="10" y1="20" x2="14" y2="20" />
  </svg>
);

export const SolderingIronSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="4" y1="20" x2="12" y2="12" />
    <line x1="12" y1="12" x2="16" y2="8" strokeWidth="4" />
    <path d="M16 8 L22 2 L18 6 Z" fill="currentColor" stroke="none" />
    <polygon points="16,8 22,2 18,6" fill="transparent" stroke="currentColor" />
  </svg>
);

export const BedSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="2" y="14" width="20" height="4" rx="1" />
    <line x1="4" y1="18" x2="4" y2="22" />
    <line x1="20" y1="18" x2="20" y2="22" />
    <path d="M2 14 L6 8 H18 L22 14" strokeDasharray="2 2" />
  </svg>
);

export const WheelSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="22" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="16" y1="12" x2="22" y2="12" />
  </svg>
);

export const CarChassisSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="2" y="10" width="20" height="8" rx="2" />
    <path d="M5 10 L8 4 L16 4 L19 10" />
    <circle cx="6" cy="18" r="2" fill="currentColor" stroke="none" />
    <circle cx="18" cy="18" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export const BuckConverterSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M6 9h3l1.5 3 1.5 -3 1.5 3 1.5 -3h3" strokeWidth="1.5" opacity="0.6" />
    <text x="12" y="17" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none" style={{fontFamily: 'monospace', fontWeight: 'bold'}}>BUCK</text>
  </svg>
);

export const AeroShellSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M3 16 Q 12 4 21 16" fill="currentColor" fillOpacity="0.2" />
    <line x1="3" y1="16" x2="21" y2="16" />
  </svg>
);

export const XChassisSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="4" y1="4" x2="20" y2="20" />
    <line x1="20" y1="4" x2="4" y2="20" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
);