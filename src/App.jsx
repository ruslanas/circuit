import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  RotateCw, 
  Sliders,
  Download, 
  Upload,
  FileCode,
  FileText,
  Play, 
  Square,
  Zap,
  MonitorSmartphone,
  RefreshCcw,
  Book,
  Maximize,
  ClipboardPaste,
  Save,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Undo,
  Redo
} from 'lucide-react';
import { simulateTick } from './engine.js';

// --- Constants & Types ---
const GRID_SIZE = 20;

// Custom SVG icons for standard electrical symbols
const AcSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M 7 12 Q 9.5 4 12 12 T 17 12" />
  </svg>
);

const OscillatorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M 6 12 Q 9 6 12 12 T 18 12" />
  </svg>
);

const OpAmpSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="4,4 20,12 4,20" fill="transparent" stroke="currentColor" strokeWidth="2" />
    <line x1="6" y1="8" x2="9" y2="8" />
    <line x1="7.5" y1="6.5" x2="7.5" y2="9.5" />
    <line x1="6" y1="16" x2="9" y2="16" />
  </svg>
);

const ComparatorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polygon points="4,4 20,12 4,20" fill="transparent" stroke="currentColor" strokeWidth="2" />
    <line x1="6" y1="8" x2="9" y2="8" />
    <line x1="7.5" y1="6.5" x2="7.5" y2="9.5" />
    <line x1="6" y1="16" x2="9" y2="16" />
    <path d="M 11 14 L 11 10 L 15 10" strokeWidth="1.5" />
    <line x1="9" y1="14" x2="11" y2="14" strokeWidth="1.5" />
  </svg>
);

const PlcSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="7" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="7" cy="16" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="17" cy="16" r="1" fill="currentColor" stroke="none" />
    <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none" style={{fontFamily: 'monospace', fontWeight: 'bold'}}>PLC</text>
  </svg>
);

const LatchSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none" style={{fontFamily: 'monospace', fontWeight: 'bold'}}>LATCH</text>
    <path d="M7 8h2M7 16h2" />
    <path d="M15 8h2M15 16h2" />
  </svg>
);

const ShiftRegisterSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h4m-4 8h4m2-4h4" />
    <path d="M11 8l4 4-4 4" />
  </svg>
);

const SevenSegmentSymbol = ({ size, className, style, segments = {} }) => {
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

const PwmSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M 6 14 H 10 V 10 H 14 V 14 H 18" />
  </svg>
);

const DiodeSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="24" y2="12" />
    <polygon points="7,7 15,12 7,17" fill="currentColor" stroke="none" />
    <line x1="15" y1="7" x2="15" y2="17" />
  </svg>
);

const BatterySymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="10" y2="12" />
    <line x1="10" y1="4" x2="10" y2="20" />
    <line x1="14" y1="8" x2="14" y2="16" strokeWidth="4" />
    <line x1="14" y1="12" x2="24" y2="12" />
    <line x1="4" y1="6" x2="8" y2="6" strokeWidth="1" />
    <line x1="6" y1="4" x2="6" y2="8" strokeWidth="1" />
  </svg>
);

const ResistorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M0 12 h4 l2 -5 l4 10 l4 -10 l4 10 l2 -5 h4" />
  </svg>
);

const CapacitorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="10" y2="12" />
    <line x1="14" y1="12" x2="24" y2="12" />
    <line x1="10" y1="4" x2="10" y2="20" strokeWidth="3" />
    <line x1="14" y1="4" x2="14" y2="20" strokeWidth="3" />
  </svg>
);

const InductorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 12 h3 c0 -4 4 -4 4 0 c0 -4 4 -4 4 0 c0 -4 4 -4 4 0 h3" />
  </svg>
);

const TransformerSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M4 2 v4 c3 0 3 4 0 4 c3 0 3 4 0 4 c3 0 3 4 0 4 v4" />
    <line x1="10" y1="4" x2="10" y2="20" />
    <line x1="14" y1="4" x2="14" y2="20" />
    <path d="M20 2 v4 c-3 0 -3 4 0 4 c-3 0 -3 4 0 4 c-3 0 -3 4 0 4 v4" />
  </svg>
);

const Timer555Symbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <path d="M5 8h-2M5 12h-2M5 16h-2M19 8h2M19 12h2M19 16h2M12 5v-2M12 19v2" />
    <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none" style={{fontFamily: 'monospace', fontWeight: 'bold'}}>555</text>
  </svg>
);

const RamSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 8h4M3 12h4M3 16h4M21 12h-4" />
    <text x="12" y="14" textAnchor="middle" fontSize="5" fill="currentColor" stroke="none" style={{fontFamily: 'monospace'}}>RAM</text>
  </svg>
);

const LedSymbol = ({ size, className, style }) => (
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

const SwitchSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="6" y2="12" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="7" y1="12" x2="16" y2="6" />
    <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="18" y1="12" x2="24" y2="12" />
  </svg>
);

const PushButtonSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="0" y1="12" x2="6" y2="12" />
    <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="12" y1="8" x2="12" y2="2" />
    <circle cx="17" cy="12" r="1.5" fill="currentColor" stroke="none"/>
    <line x1="18" y1="12" x2="24" y2="12" />
  </svg>
);

const NpnSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="8" y1="6" x2="8" y2="18" strokeWidth="3" />
    <line x1="8" y1="10" x2="16" y2="4" />
    <line x1="8" y1="14" x2="16" y2="20" />
    <polygon points="16,20 12,18 15,15" fill="currentColor" stroke="none" />
    <circle cx="10" cy="12" r="11" strokeDasharray="2 2" />
  </svg>
);

const PnpSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="8" y1="6" x2="8" y2="18" strokeWidth="3" />
    <line x1="8" y1="10" x2="16" y2="4" />
    <line x1="8" y1="14" x2="16" y2="20" />
    <polygon points="10,15 14,15 12,17.5" fill="currentColor" stroke="none" />
    <circle cx="10" cy="12" r="11" strokeDasharray="2 2" />
  </svg>
);

const HBridgeSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 8 L8 16 M8 12 L16 12 M16 8 L16 16" />
  </svg>
);

const MotorSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15 L8 9 L12 13 L16 9 L16 15" />
  </svg>
);

const ServoSymbol = ({ size, className, style, angle = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <circle cx="12" cy="13" r="4" />
    <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '12px 13px', transition: 'transform 0.1s linear' }}>
      <line x1="12" y1="13" x2="12" y2="4" strokeWidth="2" />
      <line x1="9" y1="4" x2="15" y2="4" strokeWidth="2" />
    </g>
  </svg>
);

const PotentiometerSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M0 12 h4 l2 -5 l4 10 l4 -10 l4 10 l2 -5 h4" />
    <line x1="12" y1="2" x2="12" y2="8" strokeWidth="1.5" />
    <polygon points="12,10 10,7 14,7" fill="currentColor" stroke="none" />
  </svg>
);

const CustomComponentIcon = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h4" />
  </svg>
);

const GroundSymbol = ({ size, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <line x1="12" y1="4" x2="12" y2="12" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="8" y1="16" x2="16" y2="16" />
    <line x1="10" y1="20" x2="14" y2="20" />
  </svg>
);

const COMPONENT_TYPES = {
  BATTERY: { 
    id: 'BATTERY', name: 'DC Source', desc: 'Provides a constant DC voltage.', 
    icon: BatterySymbol, color: '#ff003c', 
    terminals: [{ x: 0, y: 30, type: 'pos' }, { x: 80, y: 30, type: 'neg' }],
    defaultProps: { voltage: 9, maxCurrent: 2 }
  },
  AC_SOURCE: { 
    id: 'AC_SOURCE', name: 'AC Source', desc: 'Provides oscillating alternating current.',
    icon: AcSymbol, color: '#ff003c', 
    terminals: [{ x: 0, y: 30, type: 'pos' }, { x: 80, y: 30, type: 'neg' }],
    defaultProps: { voltage: 12, frequency: 1, maxCurrent: 2 }
  },
  PWM: { 
    id: 'PWM', name: 'PWM Source', desc: 'Generates a square wave pulse signal.', 
    icon: PwmSymbol, color: '#00f0ff', 
    terminals: [{ x: 0, y: 30, type: 'pos' }, { x: 80, y: 30, type: 'neg' }],
    defaultProps: { voltage: 5, frequency: 2, dutyCycle: 50, maxCurrent: 2 }
  },
  OSCILLATOR: {
    id: 'OSCILLATOR', name: 'Oscillator', desc: 'Function generator (Sine, Square, Triangle, Saw).',
    icon: OscillatorSymbol, color: '#00f0ff',
    terminals: [{ x: 0, y: 30, type: 'pos' }, { x: 80, y: 30, type: 'neg' }],
    defaultProps: { waveform: 'SINE', voltage: 5, frequency: 1, offset: 0, maxCurrent: 2 }
  },
  GROUND: {
    id: 'GROUND', name: 'Ground', desc: '0V reference point for the circuit.',
    icon: GroundSymbol, color: '#39ff14',
    terminals: [{ x: 40, y: 0, type: 'gnd' }],
    defaultProps: {}
  },
  RESISTOR: { 
    id: 'RESISTOR', name: 'Resistor', desc: 'Limits current flow and drops voltage.',
    icon: ResistorSymbol, color: '#facc15', 
    terminals: [{ x: 0, y: 30 }, { x: 80, y: 30 }],
    defaultProps: { resistance: 1000, maxPower: 0.25 }
  },
  CAPACITOR: {
    id: 'CAPACITOR', name: 'Capacitor', desc: 'Stores and releases electrical energy.', 
    icon: CapacitorSymbol, color: '#00f0ff',
    terminals: [{ x: 0, y: 30 }, { x: 80, y: 30 }],
    defaultProps: { capacitance: 0.0001, maxVoltage: 25 }
  },
  INDUCTOR: {
    id: 'INDUCTOR', name: 'Inductor', desc: 'Resists changes in current flow.', 
    icon: InductorSymbol, color: '#39ff14',
    terminals: [{ x: 0, y: 30 }, { x: 80, y: 30 }],
    defaultProps: { inductance: 0.01, maxCurrent: 1 }
  },
  TRANSFORMER: {
    id: 'TRANSFORMER', name: 'Transformer', desc: 'Coupled inductors for stepping AC voltage up/down.',
    icon: TransformerSymbol, color: '#facc15',
    terminals: [
      { x: 0, y: 10, type: 'p1' }, { x: 0, y: 50, type: 'p2' },
      { x: 80, y: 10, type: 's1' }, { x: 80, y: 50, type: 's2' }
    ],
    defaultProps: { primaryL: 1, secondaryL: 1, coupling: 0.99, maxCurrent: 5 }
  },
  TIMER555: {
    id: 'TIMER555', name: '555 Timer', desc: 'Generates accurate time delays or oscillation.',
    icon: Timer555Symbol, color: '#b829ea',
    terminals: [
      { x: 40, y: 60, type: 'gnd' },  { x: 0, y: 30, type: 'trig' },
      { x: 80, y: 30, type: 'out' },  { x: 0, y: 15, type: 'rst' },
      { x: 80, y: 45, type: 'ctrl' }, { x: 0, y: 45, type: 'thr' },
      { x: 80, y: 15, type: 'dis' },  { x: 40, y: 0, type: 'vcc' }
    ],
    defaultProps: { maxVoltage: 18, maxCurrent: 0.2 }
  },
  RAM: {
    id: 'RAM', name: 'RAM (4x1)', desc: '4-bit Random Access Memory (4 words x 1 bit).',
    icon: RamSymbol, color: '#00f0ff',
    terminals: [
      { x: 40, y: 0, type: 'vcc' }, { x: 40, y: 60, type: 'gnd' },
      { x: 0, y: 15, type: 'a0' }, { x: 0, y: 30, type: 'a1' },
      { x: 0, y: 45, type: 'din' }, { x: 20, y: 60, type: 'we' },
      { x: 80, y: 30, type: 'out' }
    ],
    defaultProps: { maxVoltage: 5, maxCurrent: 1 }
  },
  POTENTIOMETER: {
    id: 'POTENTIOMETER', name: 'Potentiometer', desc: 'Adjustable voltage divider.',
    icon: PotentiometerSymbol, color: '#facc15',
    terminals: [{ x: 0, y: 30, type: 'a' }, { x: 80, y: 30, type: 'b' }, { x: 40, y: 0, type: 'w' }],
    defaultProps: { resistance: 10000, position: 50, maxPower: 0.25 }
  },
  SWITCH: { 
    id: 'SWITCH', name: 'Switch', desc: 'Opens or closes the circuit path.',
    icon: SwitchSymbol, color: '#39ff14', 
    terminals: [{ x: 0, y: 30 }, { x: 80, y: 30 }],
    defaultProps: { isOpen: true, maxCurrent: 5 }
  },
  PUSH_BUTTON: { 
    id: 'PUSH_BUTTON', name: 'Push Button', desc: 'Momentary switch. Closes circuit while pressed.',
    icon: PushButtonSymbol, color: '#39ff14', 
    terminals: [{ x: 0, y: 30 }, { x: 80, y: 30 }],
    defaultProps: { isPressed: false, maxCurrent: 5 }
  },
  DIODE: { 
    id: 'DIODE', name: 'Diode', desc: 'Allows current to flow in only one direction.',
    icon: DiodeSymbol, color: '#a8a29e', 
    terminals: [{ x: 0, y: 30, type: 'anode' }, { x: 80, y: 30, type: 'cathode' }],
    defaultProps: { forwardVoltage: 0.7, maxCurrent: 1 }
  },
  NPN: {
    id: 'NPN', name: 'NPN Trans.', desc: 'NPN Bipolar Junction Transistor.',
    icon: NpnSymbol, color: '#00f0ff',
    terminals: [{ x: 0, y: 30, type: 'base' }, { x: 80, y: 10, type: 'collector' }, { x: 80, y: 50, type: 'emitter' }],
    defaultProps: { beta: 100, maxCurrent: 0.8 }
  },
  PNP: {
    id: 'PNP', name: 'PNP Trans.', desc: 'PNP Bipolar Junction Transistor.', 
    icon: PnpSymbol, color: '#ff003c',
    terminals: [{ x: 0, y: 30, type: 'base' }, { x: 80, y: 10, type: 'collector' }, { x: 80, y: 50, type: 'emitter' }],
    defaultProps: { beta: 100, maxCurrent: 0.8 }
  },
  HBRIDGE: {
    id: 'HBRIDGE', name: 'H-Bridge', desc: 'Dual half-bridge for motor reversing.',
    icon: HBridgeSymbol, color: '#b829ea',
    terminals: [
      { x: 40, y: 0, type: 'vcc' }, { x: 40, y: 60, type: 'gnd' },
      { x: 0, y: 15, type: 'in1' }, { x: 0, y: 45, type: 'in2' },
      { x: 80, y: 15, type: 'out1' }, { x: 80, y: 45, type: 'out2' }
    ],
    defaultProps: { pullupRes: 10000, driveRes: 1000, inRes: 1000, beta: 100, maxCurrent: 2 }
  },
  OPAMP: {
    id: 'OPAMP', name: 'Op-Amp', desc: 'Ideal Operational Amplifier.',
    icon: OpAmpSymbol, color: '#ff003c',
    terminals: [
      { x: 0, y: 15, type: 'in+' }, { x: 0, y: 45, type: 'in-' },
      { x: 80, y: 30, type: 'out' }, { x: 40, y: 0, type: 'vcc' }, { x: 40, y: 60, type: 'vee' }
    ],
    defaultProps: { gain: 100000, maxCurrent: 0.05 }
  },
  COMPARATOR: {
    id: 'COMPARATOR', name: 'Comparator', desc: 'Outputs HIGH if in+ > in-, else LOW.',
    icon: ComparatorSymbol, color: '#ff003c',
    terminals: [
      { x: 0, y: 15, type: 'in+' }, { x: 0, y: 45, type: 'in-' },
      { x: 80, y: 30, type: 'out' }, { x: 40, y: 0, type: 'vcc' }, { x: 40, y: 60, type: 'gnd' }
    ],
    defaultProps: { maxCurrent: 0.05 }
  },
  PLC: {
    id: 'PLC', name: 'Simple PLC', desc: 'Programmable Logic (2 IN, 2 OUT). Use I0, I1, AND, OR, NOT, XOR.',
    icon: PlcSymbol, color: '#b829ea',
    terminals: [
      { x: 40, y: 0, type: 'vcc' }, { x: 40, y: 60, type: 'gnd' },
      { x: 0, y: 15, type: 'in0' }, { x: 0, y: 45, type: 'in1' },
      { x: 80, y: 15, type: 'out0' }, { x: 80, y: 45, type: 'out1' }
    ],
    defaultProps: { maxVoltage: 24, maxCurrent: 1, prog0: 'I0 AND I1', prog1: 'NOT I0' }
  },
  SHIFT_REGISTER: {
    id: 'SHIFT_REGISTER', name: 'Shift Register', desc: '4-bit SIPO (Serial-In, Parallel-Out).',
    icon: ShiftRegisterSymbol, color: '#ff8c00',
    terminals: [
      { x: 40, y: 0, type: 'vcc' }, { x: 40, y: 60, type: 'gnd' },
      { x: 0, y: 15, type: 'data' }, { x: 0, y: 45, type: 'clk' },
      { x: 80, y: 10, type: 'q0' }, { x: 80, y: 23, type: 'q1' },
      { x: 80, y: 37, type: 'q2' }, { x: 80, y: 50, type: 'q3' }
    ],
    defaultProps: { maxVoltage: 18, maxCurrent: 0.05 }
  },
  LATCH: {
    id: 'LATCH', name: '4-Bit D-Latch', desc: 'Latches 4 data bits when CLK is high.',
    icon: LatchSymbol, color: '#ff8c00',
    terminals: [
      { x: 40, y: 0, type: 'vcc' }, { x: 40, y: 60, type: 'gnd' },
      { x: 0, y: 10, type: 'd0' }, { x: 0, y: 23, type: 'd1' },
      { x: 0, y: 37, type: 'd2' }, { x: 0, y: 50, type: 'd3' },
      { x: 20, y: 60, type: 'clk' },
      { x: 80, y: 10, type: 'q0' }, { x: 80, y: 23, type: 'q1' },
      { x: 80, y: 37, type: 'q2' }, { x: 80, y: 50, type: 'q3' }
    ],
    defaultProps: { maxVoltage: 18, maxCurrent: 0.05 }
  },
  SEVEN_SEGMENT: {
    id: 'SEVEN_SEGMENT', name: '7-Segment', desc: 'Common cathode 7-segment display.',
    icon: SevenSegmentSymbol, color: '#ff003c',
    terminals: [
      { x: 0, y: 15, type: 'a' }, { x: 0, y: 25, type: 'b' }, { x: 0, y: 35, type: 'c' },
      { x: 0, y: 45, type: 'd' }, { x: 80, y: 20, type: 'e' }, { x: 80, y: 30, type: 'f' },
      { x: 80, y: 40, type: 'g' }, { x: 40, y: 60, type: 'gnd' }
    ],
    defaultProps: { forwardVoltage: 2.0, maxCurrent: 0.02 }
  },
  LED: { 
    id: 'LED', name: 'LED', desc: 'Light Emitting Diode. Emits light.',
    icon: LedSymbol, color: '#b829ea', 
    terminals: [{ x: 0, y: 30, type: 'anode' }, { x: 80, y: 30, type: 'cathode' }],
    defaultProps: { forwardVoltage: 2, color: '#00f0ff', maxCurrent: 0.04 }
  },
  MOTOR: {
    id: 'MOTOR', name: 'DC Motor', desc: 'Converts electricity to rotation.',
    icon: MotorSymbol, color: '#facc15',
    terminals: [{ x: 0, y: 30, type: 'pos' }, { x: 80, y: 30, type: 'neg' }],
    defaultProps: { resistance: 10, maxCurrent: 3 }
  },
  SERVO: {
    id: 'SERVO', name: 'Servo Motor', desc: 'Rotates to an angle based on SIG voltage (0-5V).',
    icon: ServoSymbol, color: '#facc15',
    terminals: [{ x: 0, y: 15, type: 'vcc' }, { x: 0, y: 30, type: 'sig' }, { x: 0, y: 45, type: 'gnd' }],
    defaultProps: { resistance: 100, sigRes: 1000000, maxCurrent: 1 }
  }
};

const COMPONENT_GROUPS = {
  'Power & Sources': ['BATTERY', 'AC_SOURCE', 'PWM', 'OSCILLATOR', 'GROUND'],
  'Passives & Switches': ['RESISTOR', 'CAPACITOR', 'INDUCTOR', 'TRANSFORMER', 'POTENTIOMETER', 'SWITCH', 'PUSH_BUTTON'],
  'Semiconductors': ['DIODE', 'NPN', 'PNP', 'HBRIDGE', 'OPAMP', 'COMPARATOR', 'PLC', 'SHIFT_REGISTER', 'LATCH', 'TIMER555', 'RAM'],
  'Outputs': ['LED', 'MOTOR', 'SERVO', 'SEVEN_SEGMENT']
};

// Map compound devices to base physical components
const COMPOUND_MODELS = {
  HBRIDGE: {
    nodes: ['net_b1', 'net_b4', 'net_in1_b', 'net_q5_c', 'net_b3', 'net_b2', 'net_in2_b', 'net_q6_c'],
    components: [
      { type: 'PNP', id: 'Q1', terminals: { 0: 'net_b1', 1: 4, 2: 0 }, props: { beta: 'beta' } },
      { type: 'NPN', id: 'Q4', terminals: { 0: 'net_b4', 1: 5, 2: 1 }, props: { beta: 'beta' } },
      { type: 'NPN', id: 'Q5', terminals: { 0: 'net_in1_b', 1: 'net_q5_c', 2: 1 }, props: { beta: 'beta' } },
      { type: 'RESISTOR', id: 'R_b1_pullup', terminals: { 0: 0, 1: 'net_b1' }, props: { resistance: 'pullupRes' } },
      { type: 'RESISTOR', id: 'R_b1_drive', terminals: { 0: 'net_b1', 1: 'net_q5_c' }, props: { resistance: 'driveRes' } },
      { type: 'RESISTOR', id: 'R_in1_q5', terminals: { 0: 2, 1: 'net_in1_b' }, props: { resistance: 'inRes' } },
      { type: 'RESISTOR', id: 'R_in1_q4', terminals: { 0: 2, 1: 'net_b4' }, props: { resistance: 'inRes' } },
      
      { type: 'PNP', id: 'Q3', terminals: { 0: 'net_b3', 1: 5, 2: 0 }, props: { beta: 'beta' } },
      { type: 'NPN', id: 'Q2', terminals: { 0: 'net_b2', 1: 4, 2: 1 }, props: { beta: 'beta' } },
      { type: 'NPN', id: 'Q6', terminals: { 0: 'net_in2_b', 1: 'net_q6_c', 2: 1 }, props: { beta: 'beta' } },
      { type: 'RESISTOR', id: 'R_b3_pullup', terminals: { 0: 0, 1: 'net_b3' }, props: { resistance: 'pullupRes' } },
      { type: 'RESISTOR', id: 'R_b3_drive', terminals: { 0: 'net_b3', 1: 'net_q6_c' }, props: { resistance: 'driveRes' } },
      { type: 'RESISTOR', id: 'R_in2_q6', terminals: { 0: 3, 1: 'net_in2_b' }, props: { resistance: 'inRes' } },
      { type: 'RESISTOR', id: 'R_in2_q2', terminals: { 0: 3, 1: 'net_b2' }, props: { resistance: 'inRes' } }
    ]
  },
  SERVO: {
    nodes: [],
    components: [
      { type: 'RESISTOR', id: 'R_vcc', terminals: { 0: 0, 1: 2 }, props: { resistance: 'resistance' } },
      { type: 'RESISTOR', id: 'R_sig', terminals: { 0: 1, 1: 2 }, props: { resistance: 'sigRes' } }
    ]
  }
};

// --- Helper Functions ---
const snapToGrid = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

const formatUnit = (val, unit) => {
  if (val === undefined || val === null || isNaN(val)) return `0 ${unit}`;
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (absVal < 1e-9) return `0 ${unit}`;
  if (absVal < 1e-6) return `${sign}${(absVal * 1e9).toFixed(1)} n${unit}`;
  if (absVal < 1e-3) return `${sign}${(absVal * 1e6).toFixed(1)} µ${unit}`;
  if (absVal < 1) return `${sign}${(absVal * 1e3).toFixed(1)} m${unit}`;
  if (absVal >= 1000) return `${sign}${(absVal / 1e3).toFixed(1)} k${unit}`;
  return `${sign}${absVal.toFixed(2)} ${unit}`;
};

const getWirePath = (start, end) => {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  // If practically aligned, draw straight line
  if (dx < 5 || dy < 5) return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  const midX = start.x + (end.x - start.x) / 2;
  return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
};

const getComponentValueLabel = (comp) => {
  if (!comp || !comp.props) return '';
  if (comp.type === 'BATTERY') return formatUnit(comp.props.voltage, 'V');
  if (comp.type === 'AC_SOURCE') return `${formatUnit(comp.props.voltage, 'V')} ${formatUnit(comp.props.frequency, 'Hz')}`;
  if (comp.type === 'PWM') return `${formatUnit(comp.props.voltage, 'V')} ${formatUnit(comp.props.frequency, 'Hz')} ${Number(comp.props.dutyCycle).toFixed(0)}%`;
  if (comp.type === 'OSCILLATOR') return `${comp.props.waveform} ${formatUnit(comp.props.voltage, 'V')} ${formatUnit(comp.props.frequency, 'Hz')}`;
  if (comp.type === 'RESISTOR' || comp.type === 'MOTOR') return formatUnit(comp.props.resistance, 'Ω');
  if (comp.type === 'CAPACITOR') return formatUnit(comp.props.capacitance, 'F');
  if (comp.type === 'INDUCTOR') return formatUnit(comp.props.inductance, 'H');
  if (comp.type === 'TIMER555') return 'NE555';
  if (comp.type === 'RAM') return '4x1 RAM';
  if (comp.type === 'TRANSFORMER') return `${formatUnit(comp.props.primaryL, 'H')}:${formatUnit(comp.props.secondaryL, 'H')}`;
  if (comp.type === 'LED') return `${comp.props.forwardVoltage}V ${comp.props.color}`;
  if (comp.type === 'DIODE') return `${comp.props.forwardVoltage}V`;
  if (comp.type === 'POTENTIOMETER') return `${formatUnit(comp.props.resistance, 'Ω')} (${comp.props.position}%)`;
  if (comp.type === 'NPN' || comp.type === 'PNP') return `β=${comp.props.beta || 100}`;
  if (comp.type === 'GROUND') return '0V';
  if (comp.type === 'OPAMP') return `A=${comp.props.gain || 100000}`;
  if (comp.type === 'COMPARATOR') return 'CMP';
  if (comp.type === 'PLC') return 'PLC';
  if (comp.type === 'SHIFT_REGISTER') return '4-BIT SIPO';
  if (comp.type === 'LATCH') return '4-BIT LATCH';
  if (comp.type === 'SEVEN_SEGMENT') return '7-SEG';
  return '';
};

const parseSpiceValue = (str) => {
  if (!str) return 0;
  const match = str.match(/^(-?[\d.]+(?:e[-+]?\d+)?)(k|m|u|n|p|meg|g|t)?/i);
  if (!match) return parseFloat(str) || 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] || '').toLowerCase();
  switch (unit) {
    case 'k': return val * 1e3;
    case 'm': return val * 1e-3;
    case 'u': return val * 1e-6;
    case 'n': return val * 1e-9;
    case 'p': return val * 1e-12;
    case 'meg': return val * 1e6;
    case 'g': return val * 1e9;
    case 't': return val * 1e12;
    default: return val;
  }
};

// --- Library Examples ---
const EXAMPLES = [
  {
    name: "Bridge Rectifier",
    data: {
      components: [
        { id: "ac", type: "AC_SOURCE", x: 60, y: 220, rotation: 0, props: { voltage: 12, frequency: 1 } },
        { id: "d1", type: "DIODE", x: 200, y: 160, rotation: 0, props: { forwardVoltage: 0.7 } },
        { id: "d2", type: "DIODE", x: 200, y: 280, rotation: 180, props: { forwardVoltage: 0.7 } },
        { id: "d3", type: "DIODE", x: 340, y: 160, rotation: 0, props: { forwardVoltage: 0.7 } },
        { id: "d4", type: "DIODE", x: 340, y: 280, rotation: 180, props: { forwardVoltage: 0.7 } },
        { id: "res", type: "RESISTOR", x: 480, y: 220, rotation: 90, props: { resistance: 100 } },
        { id: "cap", type: "CAPACITOR", x: 580, y: 220, rotation: 90, props: { capacitance: 0.01 } },
        { id: "gnd", type: "GROUND", x: 480, y: 340, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "ac", termIdx: 0 }, to: { compId: "d1", termIdx: 0 } },
        { id: "w2", from: { compId: "ac", termIdx: 0 }, to: { compId: "d2", termIdx: 1 } },
        { id: "w3", from: { compId: "ac", termIdx: 1 }, to: { compId: "d3", termIdx: 0 } },
        { id: "w4", from: { compId: "ac", termIdx: 1 }, to: { compId: "d4", termIdx: 1 } },
        { id: "w5", from: { compId: "d1", termIdx: 1 }, to: { compId: "d3", termIdx: 1 } },
        { id: "w6", from: { compId: "d3", termIdx: 1 }, to: { compId: "res", termIdx: 0 } },
        { id: "w7", from: { compId: "res", termIdx: 0 }, to: { compId: "cap", termIdx: 0 } },
        { id: "w8", from: { compId: "d2", termIdx: 0 }, to: { compId: "d4", termIdx: 0 } },
        { id: "w9", from: { compId: "d4", termIdx: 0 }, to: { compId: "res", termIdx: 1 } },
        { id: "w10", from: { compId: "res", termIdx: 1 }, to: { compId: "cap", termIdx: 1 } },
        { id: "w11", from: { compId: "res", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } }
      ]
    }
  },
  {
    name: "LED PWM Flasher",
    data: {
      components: [
        { id: "src", type: "PWM", x: 100, y: 150, rotation: 0, props: { voltage: 5, frequency: 2, dutyCycle: 50, maxCurrent: 2 } },
        { id: "res", type: "RESISTOR", x: 250, y: 150, rotation: 0, props: { resistance: 330, maxPower: 0.25 } },
        { id: "led", type: "LED", x: 400, y: 150, rotation: 0, props: { forwardVoltage: 2, color: "#00f0ff", maxCurrent: 0.04 } },
      ],
      wires: [
        { id: "w1", from: { compId: "src", termIdx: 0 }, to: { compId: "res", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w2", from: { compId: "res", termIdx: 1 }, to: { compId: "led", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w3", from: { compId: "led", termIdx: 1 }, to: { compId: "src", termIdx: 1 }, props: { maxCurrent: 5 } }
      ]
    }
  },
  {
    name: "H-Bridge Motor Drive",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 100, y: 50, rotation: 0, props: { voltage: 12, maxCurrent: 5 } },
        { id: "sw1", type: "SWITCH", x: 100, y: 150, rotation: 0, props: { isOpen: false, maxCurrent: 5 } },
        { id: "sw2", type: "SWITCH", x: 100, y: 250, rotation: 0, props: { isOpen: true, maxCurrent: 5 } },
        { id: "hb", type: "HBRIDGE", x: 250, y: 150, rotation: 0, props: { pullupRes: 10000, driveRes: 1000, inRes: 1000, beta: 100, maxCurrent: 2 } },
        { id: "mot", type: "MOTOR", x: 400, y: 150, rotation: 0, props: { resistance: 10, maxCurrent: 3 } },
        { id: "gnd", type: "GROUND", x: 250, y: 300, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "hb", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w2", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w3", from: { compId: "hb", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w4", from: { compId: "bat", termIdx: 0 }, to: { compId: "sw1", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w5", from: { compId: "bat", termIdx: 0 }, to: { compId: "sw2", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w6", from: { compId: "sw1", termIdx: 1 }, to: { compId: "hb", termIdx: 2 }, props: { maxCurrent: 5 } },
        { id: "w7", from: { compId: "sw2", termIdx: 1 }, to: { compId: "hb", termIdx: 3 }, props: { maxCurrent: 5 } },
        { id: "w8", from: { compId: "hb", termIdx: 4 }, to: { compId: "mot", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w9", from: { compId: "hb", termIdx: 5 }, to: { compId: "mot", termIdx: 1 }, props: { maxCurrent: 5 } }
      ]
    }
  },
  {
    name: "Analog RC Filter",
    data: {
      components: [
        { id: "pwm", type: "PWM", x: 100, y: 150, rotation: 0, props: { voltage: 5, frequency: 10, dutyCycle: 50, maxCurrent: 2 } },
        { id: "res", type: "RESISTOR", x: 250, y: 150, rotation: 0, props: { resistance: 100, maxPower: 0.25 } },
        { id: "cap", type: "CAPACITOR", x: 400, y: 150, rotation: 90, props: { capacitance: 0.01, maxVoltage: 25 } },
        { id: "gnd", type: "GROUND", x: 400, y: 250, rotation: 0, props: {} },
        { id: "gnd2", type: "GROUND", x: 100, y: 250, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "pwm", termIdx: 0 }, to: { compId: "res", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w2", from: { compId: "res", termIdx: 1 }, to: { compId: "cap", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w3", from: { compId: "cap", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w4", from: { compId: "pwm", termIdx: 1 }, to: { compId: "gnd2", termIdx: 0 }, props: { maxCurrent: 5 } }
      ]
    }
  },
  {
    name: "Logic: AND Gate (NPN)",
    data: {
      components: [
        { id: "vcc", type: "BATTERY", x: 60, y: 60, rotation: 0, props: { voltage: 5 } },
        { id: "gnd", type: "GROUND", x: 340, y: 340, rotation: 0, props: {} },
        { id: "sw_a", type: "SWITCH", x: 100, y: 180, rotation: 0, props: { isOpen: true } },
        { id: "sw_b", type: "SWITCH", x: 100, y: 260, rotation: 0, props: { isOpen: true } },
        { id: "r_a", type: "RESISTOR", x: 200, y: 180, rotation: 0, props: { resistance: 1000 } },
        { id: "r_b", type: "RESISTOR", x: 200, y: 260, rotation: 0, props: { resistance: 1000 } },
        { id: "q1", type: "NPN", x: 300, y: 180, rotation: 0, props: { beta: 100 } },
        { id: "q2", type: "NPN", x: 300, y: 260, rotation: 0, props: { beta: 100 } },
        { id: "r_led", type: "RESISTOR", x: 340, y: 120, rotation: 90, props: { resistance: 330 } },
        { id: "led", type: "LED", x: 340, y: 40, rotation: 90, props: { forwardVoltage: 2, color: "#00f0ff" } }
      ],
      wires: [
        { id: "w1", from: { compId: "vcc", termIdx: 0 }, to: { compId: "sw_a", termIdx: 0 } },
        { id: "w2", from: { compId: "vcc", termIdx: 0 }, to: { compId: "sw_b", termIdx: 0 } },
        { id: "w3", from: { compId: "vcc", termIdx: 0 }, to: { compId: "led", termIdx: 0 } },
        { id: "w4", from: { compId: "sw_a", termIdx: 1 }, to: { compId: "r_a", termIdx: 0 } },
        { id: "w5", from: { compId: "sw_b", termIdx: 1 }, to: { compId: "r_b", termIdx: 0 } },
        { id: "w6", from: { compId: "r_a", termIdx: 1 }, to: { compId: "q1", termIdx: 0 } },
        { id: "w7", from: { compId: "r_b", termIdx: 1 }, to: { compId: "q2", termIdx: 0 } },
        { id: "w8", from: { compId: "led", termIdx: 1 }, to: { compId: "r_led", termIdx: 0 } },
        { id: "w9", from: { compId: "r_led", termIdx: 1 }, to: { compId: "q1", termIdx: 1 } },
        { id: "w10", from: { compId: "q1", termIdx: 2 }, to: { compId: "q2", termIdx: 1 } },
        { id: "w11", from: { compId: "q2", termIdx: 2 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w12", from: { compId: "vcc", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } }
      ]
    }
  },
  {
    name: "Logic: OR Gate (NPN)",
    data: {
      components: [
        { id: "vcc", type: "BATTERY", x: 60, y: 60, rotation: 0, props: { voltage: 5 } },
        { id: "gnd", type: "GROUND", x: 420, y: 340, rotation: 0, props: {} },
        { id: "sw_a", type: "SWITCH", x: 100, y: 180, rotation: 0, props: { isOpen: true } },
        { id: "sw_b", type: "SWITCH", x: 100, y: 260, rotation: 0, props: { isOpen: true } },
        { id: "r_a", type: "RESISTOR", x: 200, y: 180, rotation: 0, props: { resistance: 1000 } },
        { id: "r_b", type: "RESISTOR", x: 200, y: 260, rotation: 0, props: { resistance: 1000 } },
        { id: "q1", type: "NPN", x: 300, y: 180, rotation: 0, props: { beta: 100 } },
        { id: "q2", type: "NPN", x: 300, y: 260, rotation: 0, props: { beta: 100 } },
        { id: "r_led", type: "RESISTOR", x: 420, y: 160, rotation: 90, props: { resistance: 330 } },
        { id: "led", type: "LED", x: 420, y: 260, rotation: 90, props: { forwardVoltage: 2, color: "#00f0ff" } }
      ],
      wires: [
        { id: "w1", from: { compId: "vcc", termIdx: 0 }, to: { compId: "sw_a", termIdx: 0 } },
        { id: "w2", from: { compId: "vcc", termIdx: 0 }, to: { compId: "sw_b", termIdx: 0 } },
        { id: "w3", from: { compId: "vcc", termIdx: 0 }, to: { compId: "q1", termIdx: 1 } },
        { id: "w3b", from: { compId: "vcc", termIdx: 0 }, to: { compId: "q2", termIdx: 1 } },
        { id: "w4", from: { compId: "sw_a", termIdx: 1 }, to: { compId: "r_a", termIdx: 0 } },
        { id: "w5", from: { compId: "sw_b", termIdx: 1 }, to: { compId: "r_b", termIdx: 0 } },
        { id: "w6", from: { compId: "r_a", termIdx: 1 }, to: { compId: "q1", termIdx: 0 } },
        { id: "w7", from: { compId: "r_b", termIdx: 1 }, to: { compId: "q2", termIdx: 0 } },
        { id: "w8", from: { compId: "q1", termIdx: 2 }, to: { compId: "r_led", termIdx: 0 } },
        { id: "w9", from: { compId: "q2", termIdx: 2 }, to: { compId: "r_led", termIdx: 0 } },
        { id: "w10", from: { compId: "r_led", termIdx: 1 }, to: { compId: "led", termIdx: 0 } },
        { id: "w11", from: { compId: "led", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w12", from: { compId: "vcc", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } }
      ]
    }
  },
  {
    name: "Logic: NOT Gate (Inverter)",
    data: {
      components: [
        { id: "vcc", type: "BATTERY", x: 60, y: 60, rotation: 0, props: { voltage: 5 } },
        { id: "gnd", type: "GROUND", x: 420, y: 340, rotation: 0, props: {} },
        { id: "sw_a", type: "SWITCH", x: 100, y: 220, rotation: 0, props: { isOpen: true } },
        { id: "r_a", type: "RESISTOR", x: 200, y: 220, rotation: 0, props: { resistance: 1000 } },
        { id: "q1", type: "NPN", x: 300, y: 220, rotation: 0, props: { beta: 100 } },
        { id: "r_pullup", type: "RESISTOR", x: 300, y: 120, rotation: 90, props: { resistance: 330 } },
        { id: "led", type: "LED", x: 420, y: 220, rotation: 90, props: { forwardVoltage: 2, color: "#ff003c" } }
      ],
      wires: [
        { id: "w1", from: { compId: "vcc", termIdx: 0 }, to: { compId: "sw_a", termIdx: 0 } },
        { id: "w2", from: { compId: "vcc", termIdx: 0 }, to: { compId: "r_pullup", termIdx: 0 } },
        { id: "w4", from: { compId: "sw_a", termIdx: 1 }, to: { compId: "r_a", termIdx: 0 } },
        { id: "w6", from: { compId: "r_a", termIdx: 1 }, to: { compId: "q1", termIdx: 0 } },
        { id: "w3", from: { compId: "r_pullup", termIdx: 1 }, to: { compId: "q1", termIdx: 1 } },
        { id: "w7", from: { compId: "q1", termIdx: 1 }, to: { compId: "led", termIdx: 0 } },
        { id: "w8", from: { compId: "q1", termIdx: 2 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w11", from: { compId: "led", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w12", from: { compId: "vcc", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } }
      ]
    }
  },
  {
    name: "PNP Motor Controller",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 100, y: 100, rotation: 0, props: { voltage: 9, maxCurrent: 5 } },
        { id: "pot", type: "POTENTIOMETER", x: 100, y: 220, rotation: 0, props: { resistance: 10000, position: 50, maxPower: 0.25 } },
        { id: "pnp", type: "PNP", x: 260, y: 220, rotation: 0, props: { beta: 100, maxCurrent: 2 } },
        { id: "mot", type: "MOTOR", x: 420, y: 220, rotation: 0, props: { resistance: 10, maxCurrent: 3 } },
        { id: "gnd", type: "GROUND", x: 260, y: 340, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "pot", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w2", from: { compId: "bat", termIdx: 1 }, to: { compId: "pot", termIdx: 1 }, props: { maxCurrent: 5 } },
        { id: "w3", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w4", from: { compId: "pot", termIdx: 2 }, to: { compId: "pnp", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w5", from: { compId: "bat", termIdx: 0 }, to: { compId: "pnp", termIdx: 2 }, props: { maxCurrent: 5 } },
        { id: "w6", from: { compId: "pnp", termIdx: 1 }, to: { compId: "mot", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w7", from: { compId: "mot", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } }
      ]
    }
  },
  {
    name: "PWM Controlled H-Bridge",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 80, y: 80, rotation: 0, props: { voltage: 12, maxCurrent: 5 } },
        { id: "pwm", type: "PWM", x: 80, y: 180, rotation: 0, props: { voltage: 5, frequency: 5, dutyCycle: 40, maxCurrent: 2 } },
        { id: "hb", type: "HBRIDGE", x: 260, y: 140, rotation: 0, props: { pullupRes: 10000, driveRes: 1000, inRes: 1000, beta: 100, maxCurrent: 5 } },
        { id: "mot", type: "MOTOR", x: 440, y: 155, rotation: 0, props: { resistance: 10, maxCurrent: 5 } },
        { id: "gnd", type: "GROUND", x: 260, y: 280, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "hb", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w2", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w3", from: { compId: "pwm", termIdx: 0 }, to: { compId: "hb", termIdx: 2 }, props: { maxCurrent: 5 } },
        { id: "w4", from: { compId: "pwm", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w5", from: { compId: "hb", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w6", from: { compId: "hb", termIdx: 3 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w7", from: { compId: "hb", termIdx: 4 }, to: { compId: "mot", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w8", from: { compId: "hb", termIdx: 5 }, to: { compId: "mot", termIdx: 1 }, props: { maxCurrent: 5 } }
      ]
    }
  },
  {
    name: "AC Transformer Step-Down",
    data: {
      components: [
        { id: "ac", type: "AC_SOURCE", x: 100, y: 150, rotation: 0, props: { voltage: 120, frequency: 2 } },
        { id: "tr", type: "TRANSFORMER", x: 260, y: 130, rotation: 0, props: { primaryL: 20, secondaryL: 0.2, coupling: 0.99 } },
        { id: "res", type: "RESISTOR", x: 420, y: 150, rotation: 90, props: { resistance: 10 } },
        { id: "gnd1", type: "GROUND", x: 100, y: 250, rotation: 0, props: {} },
        { id: "gnd2", type: "GROUND", x: 420, y: 250, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "ac", termIdx: 0 }, to: { compId: "tr", termIdx: 0 } },
        { id: "w2", from: { compId: "ac", termIdx: 1 }, to: { compId: "gnd1", termIdx: 0 } },
        { id: "w3", from: { compId: "tr", termIdx: 1 }, to: { compId: "gnd1", termIdx: 0 } },
        { id: "w4", from: { compId: "tr", termIdx: 2 }, to: { compId: "res", termIdx: 0 } },
        { id: "w5", from: { compId: "tr", termIdx: 3 }, to: { compId: "gnd2", termIdx: 0 } },
        { id: "w6", from: { compId: "res", termIdx: 1 }, to: { compId: "gnd2", termIdx: 0 } }
      ]
    }
  },
  {
    name: "555 Astable Oscillator",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 60, y: 160, rotation: 0, props: { voltage: 9, maxCurrent: 2 } },
        { id: "gnd1", type: "GROUND", x: 60, y: 260, rotation: 0, props: {} },
        { id: "ic", type: "TIMER555", x: 260, y: 160, rotation: 0, props: {} },
        { id: "r1", type: "RESISTOR", x: 200, y: 80, rotation: 0, props: { resistance: 1000 } },
        { id: "r2", type: "RESISTOR", x: 160, y: 160, rotation: 90, props: { resistance: 10000 } },
        { id: "c1", type: "CAPACITOR", x: 160, y: 260, rotation: 90, props: { capacitance: 0.00001 } },
        { id: "gnd2", type: "GROUND", x: 160, y: 340, rotation: 0, props: {} },
        { id: "r_led", type: "RESISTOR", x: 400, y: 190, rotation: 90, props: { resistance: 330 } },
        { id: "led", type: "LED", x: 400, y: 270, rotation: 90, props: { forwardVoltage: 2, color: "#ff003c" } },
        { id: "gnd3", type: "GROUND", x: 400, y: 340, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "ic", termIdx: 7 } },
        { id: "w2", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd1", termIdx: 0 } },
        { id: "w3", from: { compId: "bat", termIdx: 0 }, to: { compId: "ic", termIdx: 3 } },
        { id: "w4", from: { compId: "bat", termIdx: 0 }, to: { compId: "r1", termIdx: 0 } },
        { id: "w5", from: { compId: "r1", termIdx: 1 }, to: { compId: "ic", termIdx: 6 } },
        { id: "w6", from: { compId: "r1", termIdx: 1 }, to: { compId: "r2", termIdx: 0 } },
        { id: "w7", from: { compId: "r2", termIdx: 1 }, to: { compId: "ic", termIdx: 5 } },
        { id: "w8", from: { compId: "ic", termIdx: 5 }, to: { compId: "ic", termIdx: 1 } },
        { id: "w9", from: { compId: "ic", termIdx: 5 }, to: { compId: "c1", termIdx: 0 } },
        { id: "w10", from: { compId: "c1", termIdx: 1 }, to: { compId: "gnd2", termIdx: 0 } },
        { id: "w11", from: { compId: "ic", termIdx: 2 }, to: { compId: "r_led", termIdx: 0 } },
        { id: "w12", from: { compId: "r_led", termIdx: 1 }, to: { compId: "led", termIdx: 0 } },
        { id: "w13", from: { compId: "led", termIdx: 1 }, to: { compId: "gnd3", termIdx: 0 } },
        { id: "w14", from: { compId: "ic", termIdx: 0 }, to: { compId: "gnd1", termIdx: 0 } }
      ]
    }
  },
  {
    name: "Op-Amp Oscillator",
    data: {
      components: [
        { id: "op", type: "OPAMP", x: 260, y: 160, rotation: 0, props: { gain: 100000, maxCurrent: 0.05 } },
        { id: "vcc", type: "BATTERY", x: 260, y: 60, rotation: 0, props: { voltage: 15 } },
        { id: "vee", type: "BATTERY", x: 260, y: 260, rotation: 180, props: { voltage: 15 } },
        { id: "gnd1", type: "GROUND", x: 380, y: 60, rotation: 0, props: {} },
        { id: "gnd2", type: "GROUND", x: 380, y: 260, rotation: 0, props: {} },
        { id: "r1", type: "RESISTOR", x: 120, y: 100, rotation: 0, props: { resistance: 10000 } },
        { id: "c1", type: "CAPACITOR", x: 120, y: 200, rotation: 90, props: { capacitance: 0.0001 } },
        { id: "gnd3", type: "GROUND", x: 120, y: 300, rotation: 0, props: {} },
        { id: "r2", type: "RESISTOR", x: 120, y: 160, rotation: 0, props: { resistance: 10000 } },
        { id: "r3", type: "RESISTOR", x: 260, y: 220, rotation: 90, props: { resistance: 10000 } },
        { id: "gnd4", type: "GROUND", x: 260, y: 300, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "vcc", termIdx: 0 }, to: { compId: "op", termIdx: 3 } },
        { id: "w2", from: { compId: "vcc", termIdx: 1 }, to: { compId: "gnd1", termIdx: 0 } },
        { id: "w3", from: { compId: "vee", termIdx: 1 }, to: { compId: "op", termIdx: 4 } },
        { id: "w4", from: { compId: "vee", termIdx: 0 }, to: { compId: "gnd2", termIdx: 0 } },
        { id: "w5", from: { compId: "op", termIdx: 2 }, to: { compId: "r1", termIdx: 0 } },
        { id: "w6", from: { compId: "r1", termIdx: 1 }, to: { compId: "op", termIdx: 1 } },
        { id: "w7", from: { compId: "r1", termIdx: 1 }, to: { compId: "c1", termIdx: 0 } },
        { id: "w8", from: { compId: "c1", termIdx: 1 }, to: { compId: "gnd3", termIdx: 0 } },
        { id: "w9", from: { compId: "op", termIdx: 2 }, to: { compId: "r2", termIdx: 0 } },
        { id: "w10", from: { compId: "r2", termIdx: 1 }, to: { compId: "op", termIdx: 0 } },
        { id: "w11", from: { compId: "r2", termIdx: 1 }, to: { compId: "r3", termIdx: 0 } },
        { id: "w12", from: { compId: "r3", termIdx: 1 }, to: { compId: "gnd4", termIdx: 0 } }
      ]
    }
  },
  {
    name: "Shift Register with Clock",
    data: {
      components: [
        { id: "clk", type: "PWM", x: 80, y: 260, rotation: 0, props: { voltage: 5, frequency: 2, dutyCycle: 50 } },
        { id: "vcc", type: "BATTERY", x: 80, y: 100, rotation: 0, props: { voltage: 5 } },
        { id: "gnd", type: "GROUND", x: 260, y: 340, rotation: 0, props: {} },
        { id: "sw_data", type: "SWITCH", x: 80, y: 180, rotation: 0, props: { isOpen: true } },
        { id: "sr", type: "SHIFT_REGISTER", x: 260, y: 180, rotation: 0, props: {} },
        { id: "r0", type: "RESISTOR", x: 360, y: 130, rotation: 0, props: { resistance: 330 } },
        { id: "r1", type: "RESISTOR", x: 360, y: 180, rotation: 0, props: { resistance: 330 } },
        { id: "r2", type: "RESISTOR", x: 360, y: 230, rotation: 0, props: { resistance: 330 } },
        { id: "r3", type: "RESISTOR", x: 360, y: 280, rotation: 0, props: { resistance: 330 } },
        { id: "led0", type: "LED", x: 480, y: 130, rotation: 0, props: { color: "#ff003c" } },
        { id: "led1", type: "LED", x: 480, y: 180, rotation: 0, props: { color: "#facc15" } },
        { id: "led2", type: "LED", x: 480, y: 230, rotation: 0, props: { color: "#39ff14" } },
        { id: "led3", type: "LED", x: 480, y: 280, rotation: 0, props: { color: "#00f0ff" } }
      ],
      wires: [
        { id: "w1", from: { compId: "vcc", termIdx: 0 }, to: { compId: "sr", termIdx: 0 } },
        { id: "w2", from: { compId: "vcc", termIdx: 0 }, to: { compId: "sw_data", termIdx: 0 } },
        { id: "w3", from: { compId: "vcc", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w4", from: { compId: "clk", termIdx: 0 }, to: { compId: "sr", termIdx: 3 } },
        { id: "w5", from: { compId: "clk", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w6", from: { compId: "sw_data", termIdx: 1 }, to: { compId: "sr", termIdx: 2 } },
        { id: "w7", from: { compId: "sr", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w8", from: { compId: "sr", termIdx: 4 }, to: { compId: "r0", termIdx: 0 } },
        { id: "w9", from: { compId: "sr", termIdx: 5 }, to: { compId: "r1", termIdx: 0 } },
        { id: "w10", from: { compId: "sr", termIdx: 6 }, to: { compId: "r2", termIdx: 0 } },
        { id: "w11", from: { compId: "sr", termIdx: 7 }, to: { compId: "r3", termIdx: 0 } },
        { id: "w12", from: { compId: "led0", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w13", from: { compId: "led1", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w14", from: { compId: "led2", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w15", from: { compId: "led3", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w16", from: { compId: "r0", termIdx: 1 }, to: { compId: "led0", termIdx: 0 } },
        { id: "w17", from: { compId: "r1", termIdx: 1 }, to: { compId: "led1", termIdx: 0 } },
        { id: "w18", from: { compId: "r2", termIdx: 1 }, to: { compId: "led2", termIdx: 0 } },
        { id: "w19", from: { compId: "r3", termIdx: 1 }, to: { compId: "led3", termIdx: 0 } }
      ]
    }
  },
  {
    name: "RAM Memory Cell (4x1)",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 60, y: 100, rotation: 0, props: { voltage: 5, maxCurrent: 2 } },
        { id: "gnd1", type: "GROUND", x: 60, y: 200, rotation: 0, props: {} },
        { id: "sw_a0", type: "SWITCH", x: 100, y: 160, rotation: 0, props: { isOpen: true, maxCurrent: 5 } },
        { id: "sw_din", type: "SWITCH", x: 100, y: 220, rotation: 0, props: { isOpen: true, maxCurrent: 5 } },
        { id: "sw_we", type: "SWITCH", x: 100, y: 280, rotation: 0, props: { isOpen: true, maxCurrent: 5 } },
        { id: "ram", type: "RAM", x: 300, y: 160, rotation: 0, props: { maxVoltage: 5, maxCurrent: 1 } },
        { id: "led", type: "LED", x: 440, y: 190, rotation: 0, props: { forwardVoltage: 2, color: "#00f0ff", maxCurrent: 0.04 } },
        { id: "r_led", type: "RESISTOR", x: 540, y: 190, rotation: 90, props: { resistance: 220, maxPower: 0.25 } },
        { id: "gnd2", type: "GROUND", x: 540, y: 280, rotation: 0, props: {} },
        { id: "gnd3", type: "GROUND", x: 340, y: 280, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "ram", termIdx: 0 } },
        { id: "w2", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd1", termIdx: 0 } },
        { id: "w3", from: { compId: "bat", termIdx: 0 }, to: { compId: "sw_a0", termIdx: 0 } },
        { id: "w4", from: { compId: "bat", termIdx: 0 }, to: { compId: "sw_din", termIdx: 0 } },
        { id: "w5", from: { compId: "bat", termIdx: 0 }, to: { compId: "sw_we", termIdx: 0 } },
        { id: "w6", from: { compId: "sw_a0", termIdx: 1 }, to: { compId: "ram", termIdx: 2 } },
        { id: "w7", from: { compId: "sw_din", termIdx: 1 }, to: { compId: "ram", termIdx: 4 } },
        { id: "w8", from: { compId: "sw_we", termIdx: 1 }, to: { compId: "ram", termIdx: 5 } },
        { id: "w9", from: { compId: "ram", termIdx: 6 }, to: { compId: "led", termIdx: 0 } },
        { id: "w10", from: { compId: "led", termIdx: 1 }, to: { compId: "r_led", termIdx: 0 } },
        { id: "w11", from: { compId: "r_led", termIdx: 1 }, to: { compId: "gnd2", termIdx: 0 } },
        { id: "w12", from: { compId: "ram", termIdx: 1 }, to: { compId: "gnd3", termIdx: 0 } }
      ]
    }
  }
];

const App = () => {
  // --- State ---
  const [components, setComponents] = useState(() => {
    try {
      const saved = localStorage.getItem('circuit_components');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [wires, setWires] = useState(() => {
    try {
      const saved = localStorage.getItem('circuit_wires');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [pan, setPan] = useState(() => {
    try {
      const saved = localStorage.getItem('circuit_pan');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch (e) { return { x: 0, y: 0 }; }
  });
  const [zoom, setZoom] = useState(() => {
    try {
      const saved = localStorage.getItem('circuit_zoom');
      return saved ? parseFloat(saved) : 1;
    } catch (e) { return 1; }
  });

  const [customComponents, setCustomComponents] = useState(() => {
    try {
      const saved = localStorage.getItem('circuit_custom_components');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedWireId, setSelectedWireId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPropDialogOpen, setIsPropDialogOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [loadedExampleTitle, setLoadedExampleTitle] = useState("");
  const [spiceViewerCode, setSpiceViewerCode] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const lastClickRef = useRef({ id: null, time: 0 });

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const dragSnapshotRef = useRef(null);
  
  // physics engine data
  const [tick, setTick] = useState(0);
  const [simData, setSimData] = useState({ voltages: {}, currents: {}, wireCurrents: {}, active: {}, ramData: {}, ic555: {}, plcData: {}, shiftRegisterData: {}, latchData: {}, sevenSegmentData: {} });
  const [simSpeed, setSimSpeed] = useState(0.05); // 50ms default dt
  const prevState = useRef({ vNodes: {}, branchI: {} });
  const diodeStatesRef = useRef({});
  const burnedStatesRef = useRef({});
  
  const [activeTerminal, setActiveTerminal] = useState(null);
  const [draggedComp, setDraggedComp] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const svgRef = useRef(null);
  const fileInputRef = useRef(null);
  const activePointers = useRef(new Map());
  const panState = useRef({ isPanning: false, startX: 0, startY: 0, initialPanX: 0, initialPanY: 0 });
  const pinchState = useRef({ isPinching: false, initialDistance: 0, initialZoom: 1, initialPanX: 0, initialPanY: 0, midPointX: 0, midPointY: 0 });
  const handleZoomToFitRef = useRef(null);

  const MAX_WAVEFORM_POINTS = 300;
  const waveformHistory = useRef({ id: null, data: [], pausedData: [] });
  const [wavePaused, setWavePaused] = useState(false);
  const [waveTime, setWaveTime] = useState(60);
  const [waveZoom, setWaveZoom] = useState(1);

  const currentSelectionId = (selectedIds.length === 1 ? selectedIds[0] : null) || selectedWireId;

  // Reset waveform when selection changes
  useEffect(() => {
    setWavePaused(false);
    setWaveTime(60);
    setWaveZoom(1);
  }, [currentSelectionId]);

  // --- Local Storage Auto-Save ---
  useEffect(() => {
    try {
      localStorage.setItem('circuit_components', JSON.stringify(components));
      localStorage.setItem('circuit_wires', JSON.stringify(wires));
      localStorage.setItem('circuit_pan', JSON.stringify(pan));
      localStorage.setItem('circuit_zoom', zoom.toString());
      localStorage.setItem('circuit_custom_components', JSON.stringify(customComponents));
    } catch (e) { console.warn("Failed to save state to localStorage", e); }
  }, [components, wires, pan, zoom, customComponents]);

  // --- Undo / Redo ---
  const pushStateToHistory = (comps, wrs) => {
    setPast(prev => {
       const newPast = [...prev, { components: comps, wires: wrs }];
       if (newPast.length > 50) return newPast.slice(newPast.length - 50);
       return newPast;
    });
    setFuture([]);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture(prev => [{ components, wires }, ...prev]);
    setPast(newPast);
    setComponents(previous.components);
    setWires(previous.wires);
    setSelectedIds([]);
    setSelectedWireId(null);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prev => [...prev, { components, wires }]);
    setFuture(newFuture);
    setComponents(next.components);
    setWires(next.wires);
    setSelectedIds([]);
    setSelectedWireId(null);
  };

  // --- PWA Setup ---
  useEffect(() => {
    const manifest = {
      name: "Circuit Design Pro",
      short_name: "CircuitPro",
      display: "standalone",
      background_color: "#050507",
      theme_color: "#050507",
      icons: [{
        src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZTRlNGU3IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlnb24gcG9pbnRzPSIxMyAyIDMgMTQgMTIgMTQgMTEgMjIgMjEgMTAgMTIgMTAgMTMgMiIvPjwvc3ZnPg==",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }]
    };
    const blob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
    const manifestURL = URL.createObjectURL(blob);
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestURL;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  useEffect(() => {
    const componentIds = new Set(components.map(c => c.id));
    const validWires = wires.filter(w => componentIds.has(w.from.compId) && componentIds.has(w.to.compId));
    if (validWires.length !== wires.length) {
      setWires(validWires);
    }
  }, [components, wires]);

  // --- Simulation Timer ---
  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => setTick(t => t + 1), 50); // 50ms transient ticks
    } else {
      prevState.current = { vNodes: {}, branchI: {} };
      diodeStatesRef.current = {};
      burnedStatesRef.current = {};
      setSimData({ voltages: {}, currents: {}, wireCurrents: {}, active: {}, ramData: {}, ic555: {}, plcData: {}, shiftRegisterData: {}, latchData: {}, sevenSegmentData: {} });
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // --- Waveform Data Tracker ---
  useEffect(() => {
    if (!isSimulating) return;
    const currentId = (selectedIds.length === 1 ? selectedIds[0] : null) || selectedWireId;
    if (!currentId) return;

    if (waveformHistory.current.id !== currentId) {
      waveformHistory.current = { id: currentId, data: [], pausedData: [] };
    }

    let val = 0;
    let unit = 'A';
    if (selectedWireId) {
      val = simData.wireCurrents[selectedWireId] || 0;
    } else if (selectedIds.length === 1) {
      const comp = components.find(c => c.id === selectedIds[0]);
      if (comp) {
        if (comp.type === 'NPN') val = simData.currents[`${comp.id}_CE`] || 0;
        else if (comp.type === 'PNP') val = simData.currents[`${comp.id}_EC`] || 0;
        else if (comp.type === 'HBRIDGE') val = simData.currents[`${comp.id}_OUT1`] || 0;
        else if (comp.type === 'POTENTIOMETER') val = Math.abs((simData.currents[`${comp.id}_R1`] || 0) - (simData.currents[`${comp.id}_R2`] || 0));
        else if (comp.type === 'SERVO') {
            val = (simData.voltages[`${comp.id}-1`] || 0) - (simData.voltages[`${comp.id}-2`] || 0);
            unit = 'V';
        }
        else if (['BATTERY', 'AC_SOURCE', 'PWM', 'OSCILLATOR', 'CAPACITOR'].includes(comp.type)) {
            val = (simData.voltages[`${comp.id}-0`] || 0) - (simData.voltages[`${comp.id}-1`] || 0);
            unit = 'V';
        }
        else if (['TIMER555', 'OPAMP', 'COMPARATOR'].includes(comp.type)) {
            val = simData.voltages[`${comp.id}-2`] || 0;
            unit = 'V';
        }
        else if (comp.type === 'PLC') {
            val = simData.voltages[`${comp.id}-4`] || 0; // OUT0
            unit = 'V';
        }
        else if (comp.type === 'SHIFT_REGISTER') {
            val = simData.voltages[`${comp.id}-4`] || 0; // Q0
            unit = 'V';
        }
        else if (comp.type === 'LATCH') {
            val = simData.voltages[`${comp.id}-7`] || 0; // Q0
            unit = 'V';
        }
        else if (comp.type === 'TRANSFORMER') val = simData.currents[`${comp.id}_1`] || 0;
        else val = simData.currents[comp.id] || 0;
      }
    }

    waveformHistory.current.data.push({ val, unit });
    if (waveformHistory.current.data.length > MAX_WAVEFORM_POINTS) {
      waveformHistory.current.data.shift();
    }
  }, [tick, simData, selectedIds, selectedWireId, components, isSimulating]);

  // --- Real Physics (MNA Engine) ---
  useEffect(() => {
    if (!isSimulating) {
      return;
    }

    const newSimData = simulateTick({
      components,
      wires,
      tick,
      prevState: prevState.current,
      diodeStates: diodeStatesRef.current,
      burnedStates: burnedStatesRef.current,
      COMPONENT_TYPES,
      COMPOUND_MODELS
    });

    setSimData(newSimData);

  }, [isSimulating, components, wires, tick]);

  // --- Handlers ---
  const addComponent = (typeKey) => {
    const type = COMPONENT_TYPES[typeKey] || customComponents[typeKey];
    if(!type) return;
    
    pushStateToHistory(components, wires);

    const isCustom = !COMPONENT_TYPES[typeKey];

    if (isCustom) {
      const newIdPrefix = crypto.randomUUID().substring(0, 8);
      const customComps = type.components.map(c => ({
        ...c,
        id: `${newIdPrefix}-${c.id}`,
        x: snapToGrid(150 / zoom - pan.x) + c.x,
        y: snapToGrid(150 / zoom - pan.y) + c.y,
      }));
      const customWires = type.wires.map(w => ({
        ...w,
        id: crypto.randomUUID(),
        from: { ...w.from, compId: `${newIdPrefix}-${w.from.compId}` },
        to: { ...w.to, compId: `${newIdPrefix}-${w.to.compId}` },
      }));
      setComponents(prev => [...prev, ...customComps]);
      setWires(prev => [...prev, ...customWires]);
      setSelectedIds(customComps.map(c => c.id));
      setSelectedWireId(null);
      setIsLibraryOpen(false);
      setLoadedExampleTitle("");
      return;
    }
    
    const newComp = {
      id: crypto.randomUUID(),
      type: typeKey,
      x: snapToGrid(150 / zoom - pan.x),
      y: snapToGrid(150 / zoom - pan.y),
      rotation: 0,
      props: { ...type.defaultProps }
    };
    setComponents([...components, newComp]);
    setSelectedIds([newComp.id]);
    setSelectedWireId(null);
    setIsPropDialogOpen(false);
    setIsLibraryOpen(false);
    setLoadedExampleTitle("");
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const typeKey = e.dataTransfer.getData('circuit/component');
    const type = COMPONENT_TYPES[typeKey] || customComponents[typeKey];
    if (type && svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (!CTM) return;
      const svgX = (e.clientX - CTM.e) / CTM.a;
      const svgY = (e.clientY - CTM.f) / CTM.d;
      const dropX = svgX / zoom - pan.x;
      const dropY = svgY / zoom - pan.y;

      pushStateToHistory(components, wires);

      const isCustom = !COMPONENT_TYPES[typeKey];

      if (isCustom) {
        const newIdPrefix = crypto.randomUUID().substring(0, 8);
        const customComps = type.components.map(c => ({
          ...c,
          id: `${newIdPrefix}-${c.id}`,
          x: snapToGrid(dropX - 40) + c.x,
          y: snapToGrid(dropY - 30) + c.y,
        }));
        const customWires = type.wires.map(w => ({
          ...w,
          id: crypto.randomUUID(),
          from: { ...w.from, compId: `${newIdPrefix}-${w.from.compId}` },
          to: { ...w.to, compId: `${newIdPrefix}-${w.to.compId}` },
        }));
        setComponents(prev => [...prev, ...customComps]);
        setWires(prev => [...prev, ...customWires]);
        setSelectedIds(customComps.map(c => c.id));
        setSelectedWireId(null);
        setIsLibraryOpen(false);
        setLoadedExampleTitle("");
        return;
      }

      const newComp = {
        id: crypto.randomUUID(),
        type: typeKey,
        x: snapToGrid(dropX - 40),
        y: snapToGrid(dropY - 30),
        rotation: 0,
        props: { ...type.defaultProps }
      };
      setComponents(prev => [...prev, newComp]);
      setSelectedIds([newComp.id]);
      setSelectedWireId(null);
      setIsPropDialogOpen(false);
      setIsLibraryOpen(false);
      setLoadedExampleTitle("");
    }
  };

  const handlePointerDown = (e) => {
    if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (e.target.tagName === 'svg' || e.target.id === 'canvas-bg') {
      if (!e.shiftKey) {
        setSelectedIds([]);
      }
      setSelectedWireId(null);
      setActiveTerminal(null);
      setIsPropDialogOpen(false);
      setIsLibraryOpen(false);

      if (activePointers.current.size === 1) {
        panState.current = {
          isPanning: true,
          startX: e.clientX,
          startY: e.clientY,
          initialPanX: pan.x,
          initialPanY: pan.y
        };
      }
    }

    if (activePointers.current.size === 2) {
      panState.current.isPanning = false;
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchState.current = {
        isPinching: true,
        initialDistance: dist,
        initialZoom: zoom,
        initialPanX: pan.x,
        initialPanY: pan.y,
        midPointX: (pts[0].x + pts[1].x) / 2,
        midPointY: (pts[0].y + pts[1].y) / 2
      };
    }
  };

  const handleComponentPointerDown = (e, id) => {
    e.stopPropagation();
    if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (e.shiftKey) {
      setSelectedIds(prev => {
        const set = new Set(prev);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        return Array.from(set);
      });
    } else {
      if (!selectedIds.includes(id)) {
        setSelectedIds([id]);
      }
    }
    setSelectedWireId(null);
    setIsLibraryOpen(false);
    
    const comp = components.find(c => c.id === id);
    if (!comp) return;

    dragSnapshotRef.current = { components, wires };
    setDraggedComp({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: comp.x,
      initialY: comp.y
    });
  };

  const handleWirePointerDown = (e, id) => {
    e.stopPropagation();
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setSelectedWireId(id);
    setSelectedIds([]);
    setIsLibraryOpen(false);

    const now = Date.now();
    if (lastClickRef.current.id === id && now - lastClickRef.current.time < 300) {
        setIsPropDialogOpen(true);
    }
    lastClickRef.current = { id, time: now };
  };

  const handleTerminalPointerDown = (e, compId, termIdx) => {
    e.stopPropagation();
    e.preventDefault();
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activeTerminal) {
      if (activeTerminal.compId !== compId) {
        pushStateToHistory(components, wires);
        const newWire = { id: crypto.randomUUID(), from: activeTerminal, to: { compId, termIdx }, props: { maxCurrent: 5 } };
        setWires([...wires, newWire]);
        setLoadedExampleTitle("");
      }
      setActiveTerminal(null);
    } else {
      setActiveTerminal({ compId, termIdx });
    }
    setIsLibraryOpen(false);
  };

  const handlePointerMove = (e) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointers.current.size === 2 && pinchState.current.isPinching) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const zoomFactor = dist / pinchState.current.initialDistance;
      const newZoom = Math.min(Math.max(0.2, pinchState.current.initialZoom * zoomFactor), 4);

      if (svgRef.current) {
         const rect = svgRef.current.getBoundingClientRect();
         const sx = pinchState.current.midPointX - rect.left;
         const sy = pinchState.current.midPointY - rect.top;
         const newPanX = pinchState.current.initialPanX + sx * (1/newZoom - 1/pinchState.current.initialZoom);
         const newPanY = pinchState.current.initialPanY + sy * (1/newZoom - 1/pinchState.current.initialZoom);
         setPan({ x: newPanX, y: newPanY });
      }
      setZoom(newZoom);
      return;
    }

    if (panState.current.isPanning && activePointers.current.size === 1) {
      const dx = (e.clientX - panState.current.startX) / zoom;
      const dy = (e.clientY - panState.current.startY) / zoom;
      setPan({
        x: panState.current.initialPanX + dx,
        y: panState.current.initialPanY + dy
      });
      return;
    }

    if (svgRef.current) {
      const CTM = svgRef.current.getScreenCTM();
      if (CTM) {
        setMousePos({
          x: (e.clientX - CTM.e) / (CTM.a * zoom) - pan.x,
          y: (e.clientY - CTM.f) / (CTM.d * zoom) - pan.y
        });
      }
    }

    if (draggedComp && activePointers.current.size === 1 && !pinchState.current.isPinching) {
      const dx = (e.clientX - draggedComp.startX) / zoom;
      const dy = (e.clientY - draggedComp.startY) / zoom;
      setComponents(prev => prev.map(c => 
        c.id === draggedComp.id ? { ...c, x: snapToGrid(draggedComp.initialX + dx), y: snapToGrid(draggedComp.initialY + dy) } : c
      ));
    }
  };

  const handlePointerUp = (e) => {
    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size < 2) {
      pinchState.current.isPinching = false;
    }
    if (activePointers.current.size === 0) {
      panState.current.isPanning = false;
    }

    if (draggedComp) {
      const dx = e.clientX - draggedComp.startX;
      const dy = e.clientY - draggedComp.startY;
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
         const now = Date.now();
         const isDoubleClick = (lastClickRef.current.id === draggedComp.id && now - lastClickRef.current.time < 300);

         if (isDoubleClick && selectedIds.length === 1) {
             setIsPropDialogOpen(true);
         } else {
             const comp = components.find(c => c.id === draggedComp.id);
             if (comp && comp.type === 'SWITCH') {
               pushStateToHistory(dragSnapshotRef.current.components, dragSnapshotRef.current.wires);
               setComponents(prev => prev.map(c => 
                 c.id === comp.id ? { ...c, props: { ...c.props, isOpen: !c.props.isOpen } } : c
               ));
             }
         }
         lastClickRef.current = { id: draggedComp.id, time: now };
      } else {
         pushStateToHistory(dragSnapshotRef.current.components, dragSnapshotRef.current.wires);
      }
      if (e.target.releasePointerCapture) {
        try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
      }
    }
    setDraggedComp(null);
  };

  const deleteSelected = () => {
    if (selectedIds.length > 0) {
      pushStateToHistory(components, wires);
      setComponents(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setWires(prev => prev.filter(w => !selectedIds.includes(w.from.compId) && !selectedIds.includes(w.to.compId)));
      setSelectedIds([]);
      setIsPropDialogOpen(false);
      setLoadedExampleTitle("");
    } else if (selectedWireId) {
      pushStateToHistory(components, wires);
      setWires(prev => prev.filter(w => w.id !== selectedWireId));
      setSelectedWireId(null);
      setIsPropDialogOpen(false);
      setLoadedExampleTitle("");
    }
  };

  const loadExample = (data, name) => {
    setComponents(data.components.map(c => {
      const typeInfo = COMPONENT_TYPES[c.type];
      return { ...c, props: { ...(typeInfo ? typeInfo.defaultProps : {}), ...(c.props || {}) } };
    }));
    setWires(data.wires.map(w => ({ ...w, props: { maxCurrent: 5, ...(w.props || {}) } })));
    setPan({x: 0, y: 0});
    setZoom(1);
    setSelectedIds([]);
    setSelectedWireId(null);
    setIsPropDialogOpen(false);
    setIsLibraryOpen(false);
    setLoadedExampleTitle(name);
    setSimData({ voltages: {}, currents: {}, wireCurrents: {}, active: {}, ramData: {}, ic555: {}, plcData: {}, shiftRegisterData: {}, latchData: {}, sevenSegmentData: {} });
    setPast([]);
    setFuture([]);
    prevState.current = { vNodes: {}, branchI: {} };
    diodeStatesRef.current = {};
    burnedStatesRef.current = {};
    setTick(0);
  };

  const rotateSelected = () => {
    if (selectedIds.length > 0) {
      pushStateToHistory(components, wires);
      setComponents(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, rotation: (c.rotation + 90) % 360 } : c));
    }
  };

  const clearWorkspace = () => {
    if (confirmClear) {
      pushStateToHistory(components, wires);
      setComponents([]);
      setWires([]);
      setPan({ x: 0, y: 0 });
      setZoom(1);
      setSelectedIds([]);
      setSelectedWireId(null);
      setActiveTerminal(null);
      setConfirmClear(false);
      setLoadedExampleTitle("");
      setSimData({ voltages: {}, currents: {}, wireCurrents: {}, active: {}, ramData: {}, ic555: {}, plcData: {}, shiftRegisterData: {}, latchData: {}, sevenSegmentData: {} });
      prevState.current = { vNodes: {}, branchI: {} };
      diodeStatesRef.current = {};
      burnedStatesRef.current = {};
      setTick(0);
      localStorage.removeItem('circuit_components');
      localStorage.removeItem('circuit_wires');
      localStorage.removeItem('circuit_pan');
      localStorage.removeItem('circuit_zoom');
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000); 
    }
  };

  const handleExport = () => {
    const json = JSON.stringify({ components, wires }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "circuit-design.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const importSpice = (text, name) => {
    let normalizedText = text;
    if (normalizedText.split(/\r\n|\n|\r/).length <= 2) {
      normalizedText = normalizedText.replace(/\s+(?=(?:[VvRrCcLlDdQq]\d+\b\s+[^\s]+\s+[^\s]+)|(?:\.[a-zA-Z]+\b))/gi, '\n');
    }

    const lines = normalizedText.split(/\r\n|\n|\r/)
      .map(l => l.split(';')[0].trim())
      .filter(l => l && !l.startsWith('*') && !l.startsWith('.'));
    const newComps = [];
    const nodes = {};

    const addNode = (nodeName, compId, termIdx) => {
      if (!nodes[nodeName]) nodes[nodeName] = [];
      nodes[nodeName].push({ compId, termIdx });
    };

    lines.forEach((line) => {
      const parts = line.split(/\s+/);
      const compName = parts[0].toUpperCase();
      let type, props = {}, terminals = [];
      
      if (compName.startsWith('V')) {
         terminals = [parts[1], parts[2]];
         const upperLine = line.toUpperCase();
         if (upperLine.includes('SINE') || upperLine.includes('SIN(') || upperLine.includes('SIN ')) {
           type = 'AC_SOURCE';
           const sineMatch = upperLine.match(/SIN(?:E)?\s*\(?\s*[^\s,]+[\s,]+([^\s,]+)[\s,]+([^\s,)]+)/);
           props.voltage = sineMatch ? parseSpiceValue(sineMatch[1]) : 12;
           props.frequency = sineMatch ? parseSpiceValue(sineMatch[2]) : 1;
         } else if (upperLine.includes('PULSE')) {
           type = 'PWM';
           const pulseMatch = upperLine.match(/PULSE\s*\(?\s*[^\s,]+[\s,]+([^\s,]+)[\s,]+[^\s,]+[\s,]+[^\s,]+[\s,]+[^\s,]+[\s,]+([^\s,]+)[\s,]+([^\s,)]+)/);
           if (pulseMatch) {
             props.voltage = parseSpiceValue(pulseMatch[1]);
             const pw = parseSpiceValue(pulseMatch[2]);
             const per = parseSpiceValue(pulseMatch[3]);
             props.frequency = per > 0 ? 1 / per : 1;
             props.dutyCycle = per > 0 ? (pw / per) * 100 : 50;
           } else {
             props.voltage = 5;
           }
         } else {
           type = 'BATTERY';
           const dcIdx = parts.findIndex(p => p.toUpperCase() === 'DC');
           if (dcIdx !== -1 && parts.length > dcIdx + 1) {
             props.voltage = parseSpiceValue(parts[dcIdx + 1]);
           } else {
             props.voltage = parseSpiceValue(parts[3]);
           }
         }
      } else if (compName.startsWith('R')) {
         type = 'RESISTOR';
         terminals = [parts[1], parts[2]];
         props.resistance = parseSpiceValue(parts[3]);
      } else if (compName.startsWith('C')) {
         type = 'CAPACITOR';
         terminals = [parts[1], parts[2]];
         props.capacitance = parseSpiceValue(parts[3]);
      } else if (compName.startsWith('L')) {
         type = 'INDUCTOR';
         terminals = [parts[1], parts[2]];
         props.inductance = parseSpiceValue(parts[3]);
      } else if (compName.startsWith('D')) {
         type = 'DIODE';
         terminals = [parts[1], parts[2]];
         props.forwardVoltage = 0.7;
      } else if (compName.startsWith('Q')) {
         type = 'NPN'; 
         terminals = [parts[2], parts[1], parts[3]];
         props.beta = 100;
      } else {
         return;
      }

      const compId = crypto.randomUUID();
      const typeDef = COMPONENT_TYPES[type];
      newComps.push({
         id: compId,
         type: type,
         x: 100 + (newComps.length % 5) * 120,
         y: 100 + Math.floor(newComps.length / 5) * 120,
         rotation: 0,
         props: { ...typeDef.defaultProps, ...props }
      });

      terminals.forEach((n, idx) => {
         if (n) addNode(n, compId, idx);
      });
    });

    if (nodes['0']) {
       const gndId = crypto.randomUUID();
       newComps.push({
          id: gndId,
          type: 'GROUND',
          x: 100 + (newComps.length % 5) * 120,
          y: 100 + Math.floor(newComps.length / 5) * 120,
          rotation: 0,
          props: {}
       });
       addNode('0', gndId, 0);
    }

    const newWires = [];
    Object.keys(nodes).forEach(nodeName => {
       const terms = nodes[nodeName];
       for (let i = 0; i < terms.length - 1; i++) {
          newWires.push({
             id: crypto.randomUUID(),
             from: terms[i],
             to: terms[i+1],
             props: { maxCurrent: 5 }
          });
       }
    });

    loadExample({ components: newComps, wires: newWires }, name || "SPICE Import");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const data = JSON.parse(text);
          if (data.components && data.wires) {
            loadExample(data, file.name.split('.')[0]);
          } else {
            alert("Invalid circuit file format.");
          }
        } catch (err) {
          alert("Error parsing JSON file.");
        }
      } else {
        importSpice(text, file.name.split('.')[0]);
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const handlePasteSpice = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        importSpice(text, "Pasted SPICE");
      } else {
        alert("Clipboard is empty or does not contain text.");
      }
    } catch (err) {
      const text = prompt("Clipboard access denied. Please paste your SPICE netlist here:");
      if (text && text.trim().length > 0) {
        importSpice(text, "Pasted SPICE");
      }
    }
  };

  const handleSaveToLibrary = () => {
    if (selectedIds.length === 0) return;

    const name = prompt("Enter a name for the new library component:", "My Custom Chip");
    if (!name) return;

    const selectionSet = new Set(selectedIds);
    const selectedComps = components.filter(c => selectionSet.has(c.id));

    if (selectedComps.length === 0) return;

    // Find bounds and normalize coordinates
    let minX = Infinity, minY = Infinity;
    selectedComps.forEach(c => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
    });

    const normalizedComps = selectedComps.map(c => ({
      ...c,
      x: c.x - minX,
      y: c.y - minY,
    }));

    // Find internal wires
    const internalWires = wires.filter(w => 
      selectionSet.has(w.from.compId) && selectionSet.has(w.to.compId)
    );

    // NOTE: For simplicity, this version doesn't create external terminals for the new component.
    // It saves the selection as a macro that can be placed and then wired up manually.

    const newCustomComponent = {
      id: `custom_${crypto.randomUUID()}`,
      name: name,
      desc: `Custom component with ${selectedComps.length} parts.`,
      components: normalizedComps,
      wires: internalWires,
      terminals: []
    };

    setCustomComponents(prev => ({ ...prev, [newCustomComponent.id]: newCustomComponent }));
    alert(`Saved "${name}" to your custom library!`);
  };

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const deleteCustomComponent = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this custom component from library?")) {
      setCustomComponents(prev => {
        const newComps = { ...prev };
        delete newComps[id];
        return newComps;
      });
    }
  };

  const generateSpiceNetlist = () => {
    let spice = "* Circuit Design Pro SPICE Netlist\n\n";

    const parent = {};
    const find = (i) => {
      if (parent[i] === undefined) parent[i] = i;
      if (parent[i] !== i) parent[i] = find(parent[i]);
      return parent[i];
    };
    const union = (i, j) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent[rootI] = rootJ;
    };

    wires.forEach(w => {
      union(`${w.from.compId}_${w.from.termIdx}`, `${w.to.compId}_${w.to.termIdx}`);
    });

    let groundNet = null;
    components.forEach(c => {
       if (c.type === 'GROUND') {
          groundNet = find(`${c.id}_0`);
       }
    });

    if (!groundNet) {
       const src = components.find(c => c.type === 'BATTERY' || c.type === 'AC_SOURCE' || c.type === 'PWM');
       if (src) groundNet = find(`${src.id}_1`);
       else if (components.length > 0) groundNet = find(`${components[0].id}_0`);
    }

    const getNetName = (compId, termIdx) => {
       const root = find(`${compId}_${termIdx}`);
       if (root === groundNet) return "0";
       return "N_" + root.replace(/[^a-zA-Z0-9]/g, '');
    };

    let hasHBridge = components.some(c => c.type === 'HBRIDGE');
    if (hasHBridge) {
        spice += `.subckt HBRIDGE vcc gnd in1 in2 out1 out2\n`;
        spice += `Q1 out1 net_b1 vcc PNP_MOD\n`;
        spice += `Q4 out2 net_b4 gnd NPN_MOD\n`;
        spice += `Q5 net_q5_c net_in1_b gnd NPN_MOD\n`;
        spice += `R_b1_pullup vcc net_b1 10k\n`;
        spice += `R_b1_drive net_b1 net_q5_c 1k\n`;
        spice += `R_in1_q5 in1 net_in1_b 1k\n`;
        spice += `R_in1_q4 in1 net_b4 1k\n`;
        spice += `Q3 out2 net_b3 vcc PNP_MOD\n`;
        spice += `Q2 out1 net_b2 gnd NPN_MOD\n`;
        spice += `Q6 net_q6_c net_in2_b gnd NPN_MOD\n`;
        spice += `R_b3_pullup vcc net_b3 10k\n`;
        spice += `R_b3_drive net_b3 net_q6_c 1k\n`;
        spice += `R_in2_q6 in2 net_in2_b 1k\n`;
        spice += `R_in2_q2 in2 net_b2 1k\n`;
        spice += `.model NPN_MOD NPN(Bf=100)\n`;
        spice += `.model PNP_MOD PNP(Bf=100)\n`;
        spice += `.ends\n\n`;
    }

    components.forEach((c, idx) => {
        if (c.type === 'GROUND') return;

        const n0 = getNetName(c.id, 0);
        const n1 = getNetName(c.id, 1);
        const n2 = (c.type === 'NPN' || c.type === 'PNP' || c.type === 'POTENTIOMETER' || c.type === 'SERVO') ? getNetName(c.id, 2) : null;
        const name = `${idx}`;
        
        if (c.type === 'BATTERY') spice += `V${name} ${n0} ${n1} DC ${c.props.voltage || 0}\n`;
        else if (c.type === 'AC_SOURCE') {
            const freq = c.props.frequency || 1;
            const vol = c.props.voltage || 12;
            spice += `V${name} ${n0} ${n1} SINE(0 ${vol} ${freq})\n`;
        }
        else if (c.type === 'PWM') {
            const freq = c.props.frequency || 1;
            const duty = Math.max(0, Math.min(100, c.props.dutyCycle || 50));
            const vol = c.props.voltage || 5;
            const per = 1 / Math.max(0.001, freq);
            const pw = per * (duty / 100);
            spice += `V${name} ${n0} ${n1} PULSE(0 ${vol} 0 1n 1n ${pw} ${per})\n`;
        }
        else if (c.type === 'OSCILLATOR') {
            const freq = c.props.frequency || 1;
            const amp = c.props.voltage || 5;
            const offset = c.props.offset || 0;
            const wave = c.props.waveform || 'SINE';
            if (wave === 'SINE') {
                spice += `V${name} ${n0} ${n1} SINE(${offset} ${amp} ${freq})\n`;
            } else if (wave === 'SQUARE') {
                const per = 1 / Math.max(0.001, freq);
                spice += `V${name} ${n0} ${n1} PULSE(${offset - amp} ${offset + amp} 0 1n 1n ${per/2} ${per})\n`;
            } else if (wave === 'TRIANGLE') {
                const per = 1 / Math.max(0.001, freq);
                spice += `V${name} ${n0} ${n1} PULSE(${offset - amp} ${offset + amp} 0 ${per/2} ${per/2} 1n ${per})\n`;
            } else if (wave === 'SAW') {
                const per = 1 / Math.max(0.001, freq);
                spice += `V${name} ${n0} ${n1} PULSE(${offset - amp} ${offset + amp} 0 ${per} 1n 1n ${per})\n`;
            }
        }
        else if (c.type === 'RESISTOR') spice += `R${name} ${n0} ${n1} ${Math.max(1e-3, c.props.resistance !== undefined ? c.props.resistance : 1000)}\n`;
        else if (c.type === 'CAPACITOR') spice += `C${name} ${n0} ${n1} ${Math.max(1e-12, c.props.capacitance !== undefined ? c.props.capacitance : 0.0001)}\n`;
        else if (c.type === 'INDUCTOR') spice += `L${name} ${n0} ${n1} ${Math.max(1e-9, c.props.inductance !== undefined ? c.props.inductance : 0.01)}\n`;
        else if (c.type === 'MOTOR') spice += `R${name}_motor ${n0} ${n1} ${Math.max(1e-3, c.props.resistance !== undefined ? c.props.resistance : 10)}\n`;
        else if (c.type === 'SWITCH') spice += `R${name}_sw ${n0} ${n1} ${c.props.isOpen ? '1G' : '0.001'}\n`;
        else if (c.type === 'PUSH_BUTTON') spice += `R${name}_pb ${n0} ${n1} ${c.props.isPressed ? '0.001' : '1G'}\n`;
        else if (c.type === 'LED') spice += `D${name} ${n0} ${n1} DLED\n`;
        else if (c.type === 'DIODE') spice += `D${name} ${n0} ${n1} DGEN\n`;
        else if (c.type === 'POTENTIOMETER') {
            const pos = Math.max(0, Math.min(100, c.props.position || 0)) / 100;
            const rBase = Math.max(1e-3, c.props.resistance !== undefined ? c.props.resistance : 10000);
            spice += `R${name}_1 ${n0} ${n2} ${Math.max(0.001, rBase * pos)}\n`;
            spice += `R${name}_2 ${n2} ${n1} ${Math.max(0.001, rBase * (1 - pos))}\n`;
        }
        else if (c.type === 'SERVO') {
            const rBase = Math.max(1e-3, c.props.resistance !== undefined ? c.props.resistance : 100);
            const rSig = Math.max(1e-3, c.props.sigRes !== undefined ? c.props.sigRes : 1000000);
            spice += `R${name}_vcc ${n0} ${n2} ${rBase}\n`;
            spice += `R${name}_sig ${n1} ${n2} ${rSig}\n`;
        }
        else if (c.type === 'NPN') {
            spice += `Q${name} ${n1} ${n0} ${n2} NPN_MOD_${idx}\n`;
            spice += `.model NPN_MOD_${idx} NPN(Bf=${c.props.beta || 100})\n`;
        }
        else if (c.type === 'PNP') {
            spice += `Q${name} ${n1} ${n0} ${n2} PNP_MOD_${idx}\n`;
            spice += `.model PNP_MOD_${idx} PNP(Bf=${c.props.beta || 100})\n`;
        }
        else if (c.type === 'HBRIDGE') {
            const nVcc = getNetName(c.id, 0);
            const nGnd = getNetName(c.id, 1);
            const nIn1 = getNetName(c.id, 2);
            const nIn2 = getNetName(c.id, 3);
            const nOut1 = getNetName(c.id, 4);
            const nOut2 = getNetName(c.id, 5);
            spice += `X${name} ${nVcc} ${nGnd} ${nIn1} ${nIn2} ${nOut1} ${nOut2} HBRIDGE\n`;
        }
        else if (c.type === 'TRANSFORMER') {
            const lp = Math.max(1e-9, c.props.primaryL !== undefined ? c.props.primaryL : 1);
            const ls = Math.max(1e-9, c.props.secondaryL !== undefined ? c.props.secondaryL : 1);
            const k = Math.max(0, Math.min(0.999, c.props.coupling !== undefined ? c.props.coupling : 0.99));
            spice += `L${name}_P ${n0} ${n1} ${lp}\n`;
            spice += `L${name}_S ${getNetName(c.id, 2)} ${getNetName(c.id, 3)} ${ls}\n`;
            spice += `K${name} L${name}_P L${name}_S ${k}\n`;
        }
        else if (c.type === 'TIMER555') {
            spice += `* 555 Timer component ${name} omitted (macro block required)\n`;
        }
        else if (c.type === 'RAM') {
            spice += `* RAM component ${name} omitted (digital behavioral block)\n`;
        }
        else if (c.type === 'OPAMP') {
            spice += `E${name} ${getNetName(c.id, 2)} 0 ${getNetName(c.id, 0)} ${getNetName(c.id, 1)} ${c.props.gain || 100000}\n`;
        }
        else if (c.type === 'COMPARATOR') {
            spice += `B${name} ${getNetName(c.id, 2)} 0 V=V(${getNetName(c.id, 0)}) > V(${getNetName(c.id, 1)}) ? V(${getNetName(c.id, 3)}) : V(${getNetName(c.id, 4)})\n`;
        }
        else if (c.type === 'PLC') {
            spice += `* PLC component ${name} omitted (digital behavioral block)\n`;
        }
        else if (c.type === 'LATCH') {
            spice += `* Latch component ${name} omitted (digital behavioral block)\n`;
        }
        else if (c.type === 'SHIFT_REGISTER') {
            spice += `* Shift Register component ${name} omitted (digital behavioral block)\n`;
        }
        else if (c.type === 'SEVEN_SEGMENT') {
            spice += `* 7-Segment Display component ${name} omitted (macro block required)\n`;
        }
    });

    spice += `\n.model DLED D(Is=1e-14 n=1.8 Rs=2)\n`;
    spice += `.model DGEN D(Is=1e-14 n=1 Rs=0.1)\n`;
    spice += ".end\n";

    return spice;
  };

  const handleSpiceExport = () => {
    const spiceNetlist = generateSpiceNetlist();
    const blob = new Blob([spiceNetlist], { type: "text/plain" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "circuit.cir";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleWheel = (e) => {
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newZoom = Math.min(Math.max(0.2, zoom * (1 + delta)), 4);

    if (svgRef.current) {
       const rect = svgRef.current.getBoundingClientRect();
       const sx = e.clientX - rect.left;
       const sy = e.clientY - rect.top;
       const newPanX = pan.x + sx * (1/newZoom - 1/zoom);
       const newPanY = pan.y + sy * (1/newZoom - 1/zoom);
       setPan({ x: newPanX, y: newPanY });
    }
    setZoom(newZoom);
  };

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
         e.preventDefault();
         if (e.shiftKey) redo();
         else undo();
         return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
         e.preventDefault();
         redo();
         return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key.toLowerCase() === 'r') {
        rotateSelected();
      } else if (e.key === 'Escape') {
        setSelectedIds([]);
        setSelectedWireId(null);
        setIsPropDialogOpen(false);
        setIsLibraryOpen(false);
        setSpiceViewerCode(null);
        setShowHelp(false);
        setActiveTerminal(null);
      } else if (e.key.toLowerCase() === 's') {
        setIsSimulating(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, selectedWireId, components, wires, past, future]);

  // --- Render Helpers ---
  const getTerminalCoords = (comp, termIdx) => {
    if (!comp) return { x: 0, y: 0 };
    const type = COMPONENT_TYPES[comp.type];
    const term = type.terminals[termIdx];
    const cx = 40; const cy = 30;
    const rad = (comp.rotation * Math.PI) / 180;
    const rx = Math.cos(rad) * (term.x - cx) - Math.sin(rad) * (term.y - cy) + cx;
    const ry = Math.sin(rad) * (term.x - cx) + Math.cos(rad) * (term.y - cy) + cy;
    return { x: comp.x + rx, y: comp.y + ry };
  };

  const handleZoomToFit = () => {
    if (components.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1);
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    components.forEach(comp => {
      minX = Math.min(minX, comp.x - 20);
      maxX = Math.max(maxX, comp.x + 100);
      minY = Math.min(minY, comp.y - 20);
      maxY = Math.max(maxY, comp.y + 80);
    });

    wires.forEach(wire => {
      const compFrom = components.find(c => c.id === wire.from.compId);
      const compTo = components.find(c => c.id === wire.to.compId);
      if (compFrom) {
        const pt = getTerminalCoords(compFrom, wire.from.termIdx);
        minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
      }
      if (compTo) {
        const pt = getTerminalCoords(compTo, wire.to.termIdx);
        minX = Math.min(minX, pt.x); maxX = Math.max(maxX, pt.x);
        minY = Math.min(minY, pt.y); maxY = Math.max(maxY, pt.y);
      }
    });

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const padding = 0.8; // Leave 20% margin
    let newZoom = Math.min((rect.width / (maxX - minX)) * padding, (rect.height / (maxY - minY)) * padding);
    newZoom = Math.max(0.2, Math.min(newZoom, 4)); // Clamp to bounds

    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;
    setPan({ x: (rect.width / 2) - (bboxCenterX * newZoom), y: (rect.height / 2) - (bboxCenterY * newZoom) });
    setZoom(newZoom);
  };

  handleZoomToFitRef.current = handleZoomToFit;

  useEffect(() => {
    // Zoom to fit on initial load
    const initTimer = setTimeout(() => {
      if (handleZoomToFitRef.current) handleZoomToFitRef.current();
    }, 100);

    // Debounced zoom to fit on window resize
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (handleZoomToFitRef.current) handleZoomToFitRef.current();
      }, 100);
    };

    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(initTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const toggleWavePause = () => {
      if (!wavePaused) {
          waveformHistory.current.pausedData = waveformHistory.current.data.slice(-waveTime);
      }
      setWavePaused(!wavePaused);
  };

  const renderWaveform = () => {
    const rawHist = wavePaused ? waveformHistory.current.pausedData : waveformHistory.current.data.slice(-waveTime);
    if (rawHist.length < 2) return null;

    const hist = rawHist.map(d => typeof d === 'object' ? d.val : d);
    const unit = rawHist[0] && typeof rawHist[0] === 'object' ? rawHist[0].unit : 'A';

    const W = 200, H = 60;
    let maxV = Math.max(...hist);
    let minV = Math.min(...hist);
    
    if (Math.abs(maxV - minV) < 1e-6) { maxV += 0.1; minV -= 0.1; }
    const pad = (maxV - minV) * 0.1;
    const pMaxRaw = maxV + pad, pMinRaw = minV - pad;
    const midV = (pMaxRaw + pMinRaw) / 2;
    const range = (pMaxRaw - pMinRaw) / waveZoom;
    const pMax = midV + range / 2;
    const pMin = midV - range / 2;
    const pRange = pMax - pMin;

    const dStr = hist.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (hist.length - 1)) * W} ${H - ((v - pMin) / pRange) * H}`).join(' ');
    const zeroY = H - ((0 - pMin) / pRange) * H;
    const color = wavePaused ? "#facc15" : "#00f0ff";

    // Generate Grid Lines
    const gridLines = [];
    const numHGrid = 4;
    const numVGrid = 6;
    for (let i = 1; i < numHGrid; i++) {
       const y = (H / numHGrid) * i;
       gridLines.push(<line key={`h${i}`} x1="0" y1={y} x2={W} y2={y} stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" vectorEffect="non-scaling-stroke" />);
    }
    for (let i = 1; i < numVGrid; i++) {
       const x = (W / numVGrid) * i;
       gridLines.push(<line key={`v${i}`} x1={x} y1="0" x2={x} y2={H} stroke="rgba(0, 240, 255, 0.1)" strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />);
    }

    return (
        <div className="mt-2 border-t border-cyan-900/50 pt-2 shrink-0">
            <div className="flex justify-between items-center text-[8px] text-cyan-600 mb-1 cyber-text">
                <div className="flex gap-0.5 items-center">
                    <button onClick={toggleWavePause} className="px-1.5 py-0.5 bg-cyan-900/30 hover:bg-cyan-800/50 rounded transition-colors" title={wavePaused ? "Resume" : "Pause"}>{wavePaused ? '▶' : '⏸'}</button>
                    <button onClick={() => setWaveTime(t => Math.min(MAX_WAVEFORM_POINTS, t + 20))} className="px-1 bg-cyan-900/30 hover:bg-cyan-800/50 rounded" title="Zoom Out Time">T+</button>
                    <button onClick={() => setWaveTime(t => Math.max(20, t - 20))} className="px-1 bg-cyan-900/30 hover:bg-cyan-800/50 rounded" title="Zoom In Time">T-</button>
                    <button onClick={() => setWaveZoom(z => z * 1.5)} className="px-1 bg-cyan-900/30 hover:bg-cyan-800/50 rounded" title="Zoom In Amplitude">V+</button>
                    <button onClick={() => setWaveZoom(z => Math.max(0.1, z / 1.5))} className="px-1 bg-cyan-900/30 hover:bg-cyan-800/50 rounded" title="Zoom Out Amplitude">V-</button>
                </div>
                <span title="Peak" className="ml-1 text-right">PK: {formatUnit(Math.max(Math.abs(maxV), Math.abs(minV)), unit)}</span>
            </div>
            <div className="relative w-full h-[60px] bg-black/50 border border-cyan-900/30 rounded-sm mt-1 overflow-hidden">
                <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0">
                    {gridLines}
                    {zeroY >= 0 && zeroY <= H && <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="rgba(0, 240, 255, 0.3)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />}
                    <path d={dStr} fill="none" stroke={color} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 2px ${color})` }} vectorEffect="non-scaling-stroke" />
                </svg>
                <div className="absolute inset-0 pointer-events-none p-0.5 flex flex-col justify-between text-[7px] text-cyan-600/80 font-mono">
                    <span className="leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">{formatUnit(pMax, unit)}</span>
                    {zeroY > H * 0.15 && zeroY < H * 0.85 && (
                        <span className="absolute left-0.5 leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,1)]" style={{ top: `${(zeroY / H) * 100}%`, transform: 'translateY(-50%)' }}>0 {unit}</span>
                    )}
                    <span className="leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">{formatUnit(pMin, unit)}</span>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden relative" style={{ backgroundColor: '#050507', color: '#00f0ff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&family=Share+Tech+Mono&display=swap');
        
        :root {
          --neon-cyan: #00f0ff;
          --neon-pink: #ff003c;
          --dark-bg: #050507;
          --panel-bg: #0b0b10;
        }
        * { font-family: 'Share Tech Mono', monospace; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes flow-dash {
          to { stroke-dashoffset: -10; }
        }
        .cyber-panel {
          background-color: rgba(11, 11, 16, 0.85);
          border: 1px solid rgba(0, 240, 255, 0.2);
          box-shadow: 0 0 10px rgba(0, 240, 255, 0.05) inset, 0 0 20px rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
        }
        .cyber-button {
          background: rgba(0, 240, 255, 0.05);
          border: 1px solid rgba(0, 240, 255, 0.3);
          color: var(--neon-cyan);
          transition: all 0.2s;
          cursor: pointer;
        }
        .cyber-button:hover:not(:disabled) {
          background: rgba(0, 240, 255, 0.15);
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
          color: #fff;
        }
        .cyber-button:disabled { opacity: 0.3; border-color: #333; color: #555; cursor: not-allowed; }
        .cyber-button-danger { border-color: rgba(255, 0, 60, 0.3); color: var(--neon-pink); }
        .cyber-button-danger:hover:not(:disabled) {
          background: rgba(255, 0, 60, 0.15); box-shadow: 0 0 8px rgba(255, 0, 60, 0.4); color: #fff;
        }
        .cyber-text { font-family: 'Orbitron', sans-serif; letter-spacing: 1px; }
        .cyber-input {
          background: rgba(0, 240, 255, 0.05);
          border: 1px solid rgba(0, 240, 255, 0.3);
          color: var(--neon-cyan);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cyber-input:focus { outline: none; border-color: var(--neon-cyan); box-shadow: 0 0 8px rgba(0, 240, 255, 0.4); }
        .cyber-glow { text-shadow: 0 0 4px currentColor; }
      `}</style>
      
      {/* Sidebar - Component Library */}
      <div className="w-full md:w-48 h-auto md:h-full cyber-panel border-t md:border-t-0 md:border-r border-cyan-500/20 p-2 flex flex-col z-30 shrink-0 order-last md:order-first shadow-lg">
        <h2 className="hidden md:flex text-[10px] font-bold text-cyan-500/70 uppercase tracking-widest mb-3 items-center gap-1.5 px-1 cyber-text">
          Components
        </h2>
        
        {/* Component Groups */}
        <div className="flex-1 flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-y-auto w-full pb-1 md:pb-0 hide-scrollbar items-center md:items-stretch">
           {Object.entries(COMPONENT_GROUPS).map(([groupName, keys]) => (
               <div key={groupName} className="flex flex-row md:flex-col gap-1.5 items-center md:items-stretch border-r md:border-r-0 md:border-b border-cyan-900/30 pr-4 md:pr-0 md:pb-3 last:border-0">
                  <div 
                    className="hidden md:flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <h3 className="text-[8px] font-bold text-cyan-700 uppercase tracking-widest px-1 cyber-text group-hover:text-cyan-500 transition-colors">{groupName}</h3>
                    {collapsedGroups[groupName] ? <ChevronRight size={12} className="text-cyan-700" /> : <ChevronDown size={12} className="text-cyan-700" />}
                  </div>
                  {keys.map(key => {
                    const info = COMPONENT_TYPES[key];
                    const Icon = info.icon;
                    return (
                      <button
                        key={key}
                        draggable
                        title={info.desc}
                        onDragStart={(e) => e.dataTransfer.setData('circuit/component', key)}
                        onClick={() => addComponent(key)}
                        className={`flex items-center gap-2 p-1.5 cyber-button rounded-sm shrink-0 ${collapsedGroups[groupName] ? 'md:hidden' : ''}`}
                      >
                        <div className="flex items-center justify-center w-5 h-5" style={{ color: info.color, filter: `drop-shadow(0 0 2px ${info.color})` }}>
                          <Icon size={14} />
                        </div>
                        <span className="text-[10px] font-medium whitespace-nowrap pr-1">{info.name}</span>
                      </button>
                    );
                  })}
               </div>
           ))}
           {Object.keys(customComponents).length > 0 && (
             <div className="flex flex-row md:flex-col gap-1.5 items-center md:items-stretch border-r md:border-r-0 md:border-b border-cyan-900/30 pr-4 md:pr-0 md:pb-3 last:border-0">
               <div 
                 className="hidden md:flex items-center justify-between cursor-pointer group"
                 onClick={() => toggleGroup('Custom Library')}
               >
                 <h3 className="text-[8px] font-bold text-cyan-700 uppercase tracking-widest px-1 cyber-text group-hover:text-cyan-500 transition-colors">Custom Library</h3>
                 {collapsedGroups['Custom Library'] ? <ChevronRight size={12} className="text-cyan-700" /> : <ChevronDown size={12} className="text-cyan-700" />}
               </div>
               {Object.values(customComponents).map(info => (
                 <div key={info.id} className={`flex items-stretch gap-1 shrink-0 ${collapsedGroups['Custom Library'] ? 'md:hidden' : ''}`}>
                   <button
                     draggable
                     title={info.desc}
                     onDragStart={(e) => e.dataTransfer.setData('circuit/component', info.id)}
                     onClick={() => addComponent(info.id)}
                     className="flex-1 flex items-center gap-2 p-1.5 cyber-button rounded-sm truncate"
                   >
                     <div className="flex items-center justify-center w-5 h-5 shrink-0" style={{ color: '#b829ea', filter: `drop-shadow(0 0 2px #b829ea)` }}>
                       <CustomComponentIcon size={14} />
                     </div>
                     <span className="text-[10px] font-medium whitespace-nowrap pr-1 truncate">{info.name}</span>
                   </button>
                   <button 
                     onClick={(e) => deleteCustomComponent(e, info.id)}
                     className="flex items-center justify-center px-1.5 cyber-button cyber-button-danger rounded-sm shrink-0"
                     title="Delete Custom Component"
                   >
                     <Trash2 size={12} />
                   </button>
                 </div>
               ))}
             </div>
           )}
        </div>

        <div className="hidden md:flex mt-0 md:mt-auto pt-0 md:pt-4 border-t border-cyan-500/20 flex-col justify-center">
          <p className="text-[9px] text-cyan-600/50 text-center uppercase tracking-widest cyber-text">Drag to place</p>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 relative flex flex-col min-w-0 min-h-0 touch-none">
        
        {/* Hidden File Input for Import */}
        <input type="file" accept=".json,.cir,.net,.txt" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />

        {/* Toolbar */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[95%] md:w-auto cyber-panel px-1.5 py-1 rounded-sm flex items-center justify-between md:justify-center gap-1 shadow-lg z-20">
          <div className="flex items-center gap-0.5 border-r border-cyan-500/20 pr-1.5">
            <button 
              onClick={undo}
              disabled={past.length === 0}
              className="p-1.5 cyber-button rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={14} />
            </button>
            <button 
              onClick={redo}
              disabled={future.length === 0}
              className="p-1.5 cyber-button rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={14} />
            </button>
          </div>
          <div className="flex items-center gap-0.5 border-r border-cyan-500/20 pr-1.5 pl-1">
            <button 
              onClick={rotateSelected}
              disabled={selectedIds.length === 0}
              className="p-1.5 cyber-button rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              title="Rotate Component (R)"
            >
              <RotateCw size={14} />
            </button>
            <button 
              onClick={handleSaveToLibrary}
              disabled={selectedIds.length === 0}
              className="p-1.5 cyber-button rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              title="Save Selection to Library"
            >
              <Save size={14} />
            </button>
            <button 
              onClick={() => setIsPropDialogOpen(!isPropDialogOpen)}
              disabled={selectedIds.length !== 1 && !selectedWireId}
              className={`p-1.5 cyber-button rounded-sm ${isPropDialogOpen ? 'bg-cyan-500/20' : ''} disabled:opacity-30 disabled:cursor-not-allowed`}
              title="Properties (Double-tap item)"
            >
              <Sliders size={14} />
            </button>
            <button 
              onClick={deleteSelected}
              disabled={selectedIds.length === 0 && !selectedWireId}
              className="p-1.5 cyber-button cyber-button-danger rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
              title="Delete Selected (Del)"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-1.5">
            <span className="hidden md:inline text-[9px] font-mono text-cyan-600 cyber-text">ZOOM</span>
            <button 
              onClick={handleZoomToFit}
              className="p-1 cyber-button rounded-sm"
              title="Zoom to Fit"
            >
              <Maximize size={12} />
            </button>
            <input 
              type="range" min="0.5" max="2" step="0.1" value={zoom} 
              onChange={(e) => {
                if (svgRef.current) {
                  const newZoom = parseFloat(e.target.value);
                  const rect = svgRef.current.getBoundingClientRect();
                  const sx = rect.width / 2;
                  const sy = rect.height / 2;
                  const newPanX = pan.x + sx * (1/newZoom - 1/zoom);
                  const newPanY = pan.y + sy * (1/newZoom - 1/zoom);
                  setPan({ x: newPanX, y: newPanY });
                  setZoom(newZoom);
                } else {
                  setZoom(parseFloat(e.target.value));
                }
              }}
              className="w-12 md:w-16 accent-cyan-400"
            />
          </div>
          <div className="flex items-center gap-1.5 px-1.5 border-l border-cyan-500/20">
            <span className="hidden md:inline text-[9px] font-mono text-cyan-600 cyber-text" title="Simulation Timestep">SPEED</span>
            <input 
              type="range" min="0.001" max="0.1" step="0.001" value={simSpeed} 
              onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
              className="w-12 md:w-16 accent-cyan-400"
              title={`Timestep: ${simSpeed}s`}
            />
          </div>
          <div className="pl-1.5 border-l border-cyan-500/20 flex items-center gap-1">
             <button 
               onClick={() => setIsSimulating(!isSimulating)}
               className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-sm cyber-text text-[10px] whitespace-nowrap ${
                 isSimulating ? 'cyber-button cyber-button-danger' : 'cyber-button'
               }`}
               style={!isSimulating ? { borderColor: 'rgba(57,255,20,0.4)', color: '#39ff14' } : {}}
             >
               {isSimulating ? <><Square size={10} fill="currentColor" /> Stop</> : <><Play size={10} fill="currentColor" /> Sim</>}
             </button>
             <button 
               onClick={clearWorkspace} 
               className={`p-1.5 rounded-sm ${confirmClear ? 'cyber-button cyber-button-danger' : 'cyber-button'}`} 
               title={confirmClear ? "Click again to confirm clear" : "Clear Workspace"}
             >
               <RefreshCcw size={14} />
             </button>

             {/* Examples Library Dropdown */}
             <div className="relative">
                 <button onClick={() => setIsLibraryOpen(!isLibraryOpen)} className={`p-1.5 rounded-sm ${isLibraryOpen ? 'cyber-button cyber-button-danger' : 'cyber-button'}`} title="Library / Examples">
                   <Book size={14} />
                 </button>
                 {isLibraryOpen && (
                     <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 cyber-panel rounded-sm p-1 flex flex-col gap-1 shadow-xl z-50">
                         <div className="text-[9px] text-cyan-600 px-2 py-1 cyber-text font-bold border-b border-cyan-900/50 mb-1">LOAD.EXAMPLE_</div>
                         {EXAMPLES.map((ex, i) => (
                             <button key={i} onClick={() => loadExample(ex.data, ex.name)} className="text-left px-2 py-1.5 text-[10px] cyber-button rounded-sm w-full truncate">
                                 {ex.name}
                             </button>
                         ))}
                     </div>
                 )}
             </div>

             <button onClick={() => fileInputRef.current?.click()} className="p-1.5 cyber-button rounded-sm" title="Import JSON/SPICE">
               <Upload size={14} />
             </button>
             <button onClick={handlePasteSpice} className="p-1.5 cyber-button rounded-sm" title="Paste SPICE">
               <ClipboardPaste size={14} />
             </button>
             <button onClick={handleExport} className="p-1.5 cyber-button rounded-sm" title="Export JSON">
               <Download size={14} />
             </button>
             <button onClick={() => setSpiceViewerCode(generateSpiceNetlist())} className="p-1.5 cyber-button rounded-sm" title="View SPICE Netlist">
               <FileText size={14} />
             </button>
             <button onClick={handleSpiceExport} className="p-1.5 cyber-button rounded-sm" title="Export to SPICE (.cir)">
               <FileCode size={14} />
             </button>
             <button onClick={() => setShowHelp(true)} className="p-1.5 cyber-button rounded-sm" title="Help / Shortcuts">
               <HelpCircle size={14} />
             </button>
             {deferredPrompt && (
               <button onClick={handleInstallClick} className="p-1.5 cyber-button rounded-sm" title="Install App">
                 <MonitorSmartphone size={14} />
               </button>
             )}
          </div>
        </div>

        {/* Canvas Area */}
        <div 
          className="flex-1 overflow-hidden cursor-crosshair relative touch-none" 
          onPointerDown={handlePointerDown}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <svg
            ref={svgRef}
            className="w-full h-full block touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="grid" width={GRID_SIZE * zoom} height={GRID_SIZE * zoom} patternUnits="userSpaceOnUse">
                <circle cx={1} cy={1} r={1} fill="rgba(0, 240, 255, 0.15)" />
              </pattern>
              <filter id="neonGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect id="canvas-bg" width="100%" height="100%" fill="url(#grid)" />

            <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
              
              {/* Wires */}
              {wires.map(wire => {
                const compFrom = components.find(c => c.id === wire.from.compId);
                const compTo = components.find(c => c.id === wire.to.compId);
                if (!compFrom || !compTo) return null;

                const start = getTerminalCoords(compFrom, wire.from.termIdx);
                const end = getTerminalCoords(compTo, wire.to.termIdx);
                const current = simData.wireCurrents[wire.id] || 0;
                const isActive = isSimulating && simData.active[wire.id];
                const isSelected = selectedWireId === wire.id;
                
                const isBurnedWire = isSimulating && burnedStatesRef.current[wire.id];
                const pathString = getWirePath(start, end);

                let strokeColor = isSelected ? "#fff" : "rgba(0, 240, 255, 0.3)";
                let wireGlow = "none";
                
                if (isBurnedWire) {
                   strokeColor = "#ff003c";
                   wireGlow = "url(#neonGlow)";
                } else if (isSimulating && isActive) {
                   const absI = Math.abs(current);
                   const intensity = Math.min(1, absI / 1.0);
                   const hue = 180 + (intensity * 150);
                   strokeColor = `hsl(${hue}, 100%, 60%)`;
                   wireGlow = "url(#neonGlow)";
                }

                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;

                return (
                  <g key={wire.id} className="cursor-pointer" onPointerDown={(e) => handleWirePointerDown(e, wire.id)}>
                    <path d={pathString} stroke="transparent" strokeWidth="20" fill="none" />
                    <path
                      d={pathString}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? "3" : "2"}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-colors"
                      filter={wireGlow}
                    />
                    {isActive && !isBurnedWire && Math.abs(current) > 1e-5 && (
                      <path
                        d={pathString}
                        stroke="#ffffff"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray="4 6"
                        strokeLinecap="round"
                        className="pointer-events-none opacity-75"
                        style={{
                          animation: `flow-dash ${Math.max(0.1, Math.min(2, 0.5 / Math.abs(current)))}s linear infinite ${current < 0 ? 'reverse' : 'normal'}`
                        }}
                      />
                    )}
                    {isActive && !isBurnedWire && (
                      <>
                        <text x={midX} y={midY - 14} textAnchor="middle" fontSize="7" className="fill-cyan-500 font-mono pointer-events-none cyber-glow">
                          {formatUnit(simData.voltages[`${compFrom.id}-${wire.from.termIdx}`], 'V')}
                        </text>
                        <text x={midX} y={midY - 4} textAnchor="middle" fontSize="9" className="font-mono pointer-events-none cyber-glow" fill={strokeColor}>
                          {formatUnit(current, 'A')}
                        </text>
                      </>
                    )}
                    {isBurnedWire && (
                        <text x={midX} y={midY + 12} textAnchor="middle" fontSize="6" fill="#ff003c" className="font-bold cyber-glow animate-pulse pointer-events-none">
                          ⚠️ MELTED
                        </text>
                    )}
                  </g>
                );
              })}

              {/* Ghost Wire */}
              {activeTerminal && (() => {
                const comp = components.find(c => c.id === activeTerminal.compId);
                if (!comp) return null;
                const start = getTerminalCoords(comp, activeTerminal.termIdx);
                return (
                  <line 
                    x1={start.x} y1={start.y} x2={mousePos.x} y2={mousePos.y}
                    stroke="#00f0ff" strokeWidth="1.5" strokeDasharray="4 4"
                    className="opacity-60 pointer-events-none"
                  />
                );
              })()}

              {/* Components */}
              {components.map(comp => {
                const type = COMPONENT_TYPES[comp.type];
                if (!type) return null;
                const CompIcon = type.icon;
                const isSelected = selectedIds.includes(comp.id);
                
                let current = 0;
                if (comp.type === 'NPN') current = simData.currents[`${comp.id}_CE`] || 0;
                else if (comp.type === 'PNP') current = simData.currents[`${comp.id}_EC`] || 0;
                else if (comp.type === 'HBRIDGE') current = Math.max(Math.abs(simData.currents[`${comp.id}_OUT1`] || 0), Math.abs(simData.currents[`${comp.id}_OUT2`] || 0));
                else if (comp.type === 'OPAMP' || comp.type === 'COMPARATOR') current = simData.currents[`${comp.id}_OUT`] || 0;
                else if (comp.type === 'PLC' || comp.type === 'SHIFT_REGISTER') current = Math.max(Math.abs(simData.currents[`${comp.id}_OUT0`] || 0), Math.abs(simData.currents[`${comp.id}_OUT1`] || 0));
                else if (comp.type === 'SEVEN_SEGMENT') current = simData.currents[comp.id] || 0;
                else if (comp.type === 'PLC') current = Math.max(Math.abs(simData.currents[`${comp.id}_OUT0`] || 0), Math.abs(simData.currents[`${comp.id}_OUT1`] || 0));
                else current = simData.currents[comp.id] || 0;
                
                // Check Damage/Burn Limits
                const isBurned = isSimulating && burnedStatesRef.current[comp.id];
                
                const isLit = comp.type === 'LED' && isSimulating && simData.active[comp.id] && !isBurned;
                const isMotorRunning = comp.type === 'MOTOR' && isSimulating && simData.active[comp.id] && !isBurned;
                const motorSpeed = isMotorRunning ? Math.max(0.2, 1 / Math.max(0.01, Math.abs(current))) : 0;
                const motorDir = current < -1e-3 ? 'reverse' : 'normal';
                const rpm = isMotorRunning ? Math.round(60 / motorSpeed) : 0;
                
                let servoAngle = 0;
                if (comp.type === 'SERVO' && isSimulating) {
                    let overrideDuty = null;
                    const sigWire = wires.find(w => 
                        (w.to.compId === comp.id && w.to.termIdx === 1) ||
                        (w.from.compId === comp.id && w.from.termIdx === 1)
                    );
                    if (sigWire) {
                        const sourceId = sigWire.from.compId === comp.id ? sigWire.to.compId : sigWire.from.compId;
                        const sourceComp = components.find(c => c.id === sourceId);
                        if (sourceComp && sourceComp.type === 'PWM') {
                            overrideDuty = sourceComp.props.dutyCycle !== undefined ? sourceComp.props.dutyCycle : 50;
                        }
                    }
                    servoAngle = overrideDuty !== null ? (overrideDuty / 100) * 180 : Math.min(180, Math.max(0, (((simData.voltages[`${comp.id}-1`] || 0) - (simData.voltages[`${comp.id}-2`] || 0)) / 5) * 180));
                }
                
                const compColor = isBurned ? '#ff003c' : ((comp.type === 'LED' && isLit) ? (comp.props?.color || type.color) : type.color);
                const glowFilter = (isSelected || isLit || isBurned) ? 'url(#neonGlow)' : 'none';
                const boxColor = isBurned ? 'rgba(255, 0, 60, 0.15)' : 'rgba(5, 5, 7, 0.9)';
                const boxStroke = isBurned ? '#ff003c' : (isSelected ? '#00f0ff' : 'rgba(0, 240, 255, 0.2)');

                return (
                  <g 
                    key={comp.id} 
                    transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation}, 40, 30)`}
                    onPointerDown={(e) => handleComponentPointerDown(e, comp.id)}
                    className="cursor-move select-none touch-none"
                  >
                    <rect
                      x="16" y="6" width="48" height="48" rx="8"
                      fill={boxColor}
                      stroke={boxStroke}
                      strokeWidth={isSelected || isBurned ? "1.5" : "1"}
                      className="transition-colors"
                      filter={glowFilter}
                    />
                    
                    {comp.type === 'SEVEN_SEGMENT' ? (
                      <g transform="translate(40, 30)" className="pointer-events-none">
                        <SevenSegmentSymbol size={30} style={{ color: compColor, transform: 'translate(-15px, -15px)' }} segments={simData.sevenSegmentData?.[comp.id]} />
                      </g>
                    ) : (
                      <g transform="translate(40, 30)" className="pointer-events-none">
                      {isLit && !isBurned && (
                        <circle cx="0" cy="0" r="14" fill={compColor} opacity="0.4" style={{ filter: 'blur(4px)' }} />
                      )}
                      
                      <g style={comp.type === 'MOTOR' ? { 
                        animationName: 'spin',
                        animationDuration: `${motorSpeed || 100}s`,
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                        animationDirection: motorDir,
                        animationPlayState: isMotorRunning ? 'running' : 'paused',
                        transformOrigin: '0px 0px' 
                      } : { transformOrigin: '0px 0px' }}>
                         <CompIcon size={24} angle={comp.type === 'SERVO' ? servoAngle : undefined} style={{ color: compColor, transform: 'translate(-12px, -12px)', filter: glowFilter }} />
                      </g>
                      </g>
                    )}

                    {/* Terminals */}
                    {type.terminals.map((term, idx) => {
                      const isActive = activeTerminal?.compId === comp.id && activeTerminal?.termIdx === idx;
                      const labelX = term.x + (term.x < 40 ? 8 : (term.x > 40 ? -8 : 0));
                      let labelY = term.y + 2;
                      if (term.x > 0 && term.x < 80) {
                        labelY = term.y + (term.y < 30 ? 8 : -3);
                      }
                      
                      return (
                        <g key={idx}>
                          <circle
                            cx={term.x} cy={term.y} r={isActive ? "3.5" : "2.5"}
                            fill={isActive ? '#00f0ff' : '#050507'}
                            stroke={isActive ? '#00f0ff' : 'rgba(0, 240, 255, 0.5)'} strokeWidth="1.5"
                            className="pointer-events-none transition-all"
                            filter={isActive ? 'url(#neonGlow)' : 'none'}
                          />
                          <circle
                            cx={term.x} cy={term.y} r="12"
                            fill="transparent"
                            className="cursor-crosshair touch-none"
                            onPointerDown={(e) => handleTerminalPointerDown(e, comp.id, idx)}
                          />
                          {/* Label for special pins */}
                          {(comp.type === 'NPN' || comp.type === 'PNP' || comp.type === 'HBRIDGE' || comp.type === 'POTENTIOMETER' || comp.type === 'GROUND' || comp.type === 'SERVO' || comp.type === 'TRANSFORMER' || comp.type === 'RAM' || comp.type === 'TIMER555' || comp.type === 'OPAMP' || comp.type === 'COMPARATOR' || comp.type === 'PLC' || comp.type === 'SHIFT_REGISTER' || comp.type === 'LATCH' || comp.type === 'SEVEN_SEGMENT') && (
                             <text 
                               x={labelX} 
                               y={labelY} 
                               transform={`rotate(${-comp.rotation}, ${labelX}, ${labelY})`}
                               fontSize="6" fill="rgba(0, 240, 255, 0.6)" 
                               textAnchor={term.x === 40 ? "middle" : (term.x < 40 ? "start" : "end")} 
                               className="pointer-events-none font-bold uppercase"
                             >
                               {['NPN', 'PNP'].includes(comp.type) ? term.type.charAt(0) : term.type}
                             </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Damage Indicator */}
                    {isBurned && (
                      <g transform="translate(40, 0)" className="pointer-events-none">
                         <text y="0" textAnchor="middle" fontSize="9" fill="#ff003c" className="font-bold cyber-text cyber-glow animate-pulse uppercase tracking-widest">
                           ⚠️ OVERLOAD
                         </text>
                      </g>
                    )}

                    {/* Static text/UI group (Placed OUTSIDE the footprint and upright) */}
                    <g transform={`translate(40, ${comp.type === 'POTENTIOMETER' ? 80 : comp.type === 'PUSH_BUTTON' ? 78 : 64}) rotate(${-comp.rotation})`} className="pointer-events-none">
                      <text y="0" textAnchor="middle" fontSize="7" fill={compColor} className="cyber-text">
                        {type.name} {comp.type === 'SWITCH' ? (comp.props?.isOpen ? '(OPEN)' : '(CLOSED)') : (comp.type === 'PUSH_BUTTON' ? (comp.props?.isPressed ? '(CLOSED)' : '(OPEN)') : '')}
                      </text>
                      <text y="10" textAnchor="middle" fontSize="8" className="fill-cyan-100 font-mono">
                        {getComponentValueLabel(comp)}
                      </text>
                      {isSimulating && simData.active[comp.id] && !isBurned && !['SERVO', 'HBRIDGE'].includes(comp.type) && (
                        <text y="20" textAnchor="middle" fontSize="8" fill={compColor} className="font-mono pointer-events-none cyber-glow">
                          {formatUnit(current, 'A')}
                        </text>
                      )}
                      {comp.type === 'MOTOR' && isSimulating && simData.active[comp.id] && !isBurned && (
                        <text y="30" textAnchor="middle" fontSize="8" fill={compColor} className="font-mono pointer-events-none cyber-glow">
                          {rpm} RPM
                        </text>
                      )}
                      {comp.type === 'SERVO' && isSimulating && !isBurned && (
                        <text y="30" textAnchor="middle" fontSize="8" fill={compColor} className="font-mono pointer-events-none cyber-glow">
                          {Math.round(servoAngle)}°
                        </text>
                      )}
                    </g>

                    {/* Static Potentiometer slider */}
                    {comp.type === 'POTENTIOMETER' && (
                      <foreignObject x="-40" y="60" width="80" height="15" transform={`rotate(${-comp.rotation}, 40, 30)`} className="pointer-events-auto">
                        <input 
                          type="range" min="0" max="100" step="0.1"
                          value={comp.props?.position || 0}
                          onChange={(e) => {
                            const newVal = parseFloat(e.target.value);
                            setComponents(prev => prev.map(c => c.id === comp.id ? { ...c, props: { ...c.props, position: newVal } } : c));
                          }}
                          onPointerDown={(e) => {
                             e.stopPropagation();
                             dragSnapshotRef.current = { components, wires };
                          }}
                          onPointerUp={(e) => {
                             e.stopPropagation();
                             if (dragSnapshotRef.current) {
                                const oldComp = dragSnapshotRef.current.components.find(c => c.id === comp.id);
                                if (oldComp && oldComp.props.position !== comp.props.position) {
                                   pushStateToHistory(dragSnapshotRef.current.components, dragSnapshotRef.current.wires);
                                }
                                dragSnapshotRef.current = null;
                             }
                          }}
                          className="w-full h-full m-0 cursor-pointer touch-auto accent-cyan-400"
                          title="Adjust Wiper Position"
                        />
                      </foreignObject>
                    )}

                    {/* Static Push Button overlay */}
                    {comp.type === 'PUSH_BUTTON' && (
                      <foreignObject x="20" y="55" width="40" height="20" transform={`rotate(${-comp.rotation}, 40, 30)`} className="pointer-events-auto">
                        <button
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
                            setComponents(prev => prev.map(c => c.id === comp.id ? { ...c, props: { ...c.props, isPressed: true } } : c));
                          }}
                          onPointerUp={(e) => {
                            e.stopPropagation();
                            if (e.target.releasePointerCapture) try { e.target.releasePointerCapture(e.pointerId); } catch(err){}
                            setComponents(prev => prev.map(c => c.id === comp.id ? { ...c, props: { ...c.props, isPressed: false } } : c));
                          }}
                          onPointerCancel={(e) => {
                            e.stopPropagation();
                            setComponents(prev => prev.map(c => c.id === comp.id ? { ...c, props: { ...c.props, isPressed: false } } : c));
                          }}
                          className={`w-full h-full m-0 cursor-pointer touch-none border rounded text-[10px] font-bold transition-colors ${comp.props.isPressed ? 'bg-cyan-500 text-black border-cyan-300' : 'bg-cyan-900/50 text-cyan-100 border-cyan-500 hover:bg-cyan-700/50'}`}
                          title="Press and hold"
                        >
                          PUSH
                        </button>
                      </foreignObject>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Footer Info */}
        <div className="hidden md:flex cyber-panel border-x-0 border-b-0 border-t p-1 px-3 justify-between items-center text-[9px] font-mono text-cyan-600/70 uppercase tracking-widest z-10 cyber-text">
          <div className="flex gap-3 items-center">
            <span>Elements: {components.length}</span>
            <span>Wires: {wires.length}</span>
            {loadedExampleTitle && <span className="text-cyan-400 border-l border-cyan-700/50 pl-3 py-0.5">{loadedExampleTitle}</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {isSimulating && <span className="w-1.5 h-1.5 rounded-full bg-[#39ff14] animate-pulse" style={{ boxShadow: '0 0 5px #39ff14' }} />}
            {isSimulating ? 'SIM RUNNING' : 'SYSTEM READY'}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {((selectedIds.length === 1 && !selectedWireId) || selectedWireId) && isPropDialogOpen && (
        <div className="absolute md:relative bottom-0 md:bottom-auto md:inset-y-0 right-0 w-full md:w-56 max-h-[50vh] md:max-h-none cyber-panel border-r-0 md:border-r-0 border-b-0 border-t md:border-t-0 md:border-l p-3 flex flex-col gap-3 shadow-2xl md:shadow-none z-40 shrink-0 overflow-y-auto rounded-t-sm md:rounded-none">
          
          <div className="w-8 h-1 bg-cyan-900/50 rounded-sm mx-auto md:hidden shrink-0" />

          <button 
            onClick={() => setIsPropDialogOpen(false)}
            className="md:hidden absolute top-2 right-2 p-1.5 cyber-button rounded-sm"
          >✕</button>

          <div className="pt-1 md:pt-0 shrink-0">
            <h3 className="text-[10px] font-bold text-cyan-500/80 mb-2 tracking-widest uppercase cyber-text">
              {selectedIds.length === 1 ? "Component" : "Wire"}
            </h3>

            {/* If Component Selected */}
            {selectedIds.length === 1 && components.find(c => c.id === selectedIds[0]) && (() => {
              const comp = components.find(c => c.id === selectedIds[0]);
              const typeInfo = COMPONENT_TYPES[comp.type];
              if (!typeInfo) return null;
              const Icon = typeInfo.icon;

              return (
                <>
                  <div className="flex items-center gap-3 mb-2 p-2 bg-black/40 border border-cyan-900/30 rounded-sm">
                    <div style={{ color: typeInfo.color, filter: `drop-shadow(0 0 3px ${typeInfo.color})` }}>
                      <Icon size={20} />
                    </div>
                    <div>
                        <span className="font-bold text-cyan-100 text-xs block cyber-text">{typeInfo.name}</span>
                        <p className="text-[8px] text-cyan-600/70 mt-0.5 leading-tight tracking-wide">{typeInfo.desc}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {Object.entries(comp.props).map(([key, val]) => (
                      <div key={key}>
                        <label className="block text-[9px] font-semibold text-cyan-600 mb-1 uppercase tracking-wider cyber-text">{key}</label>
                        {typeof val === 'boolean' ? (
                          <button 
                            onClick={() => {
                              pushStateToHistory(components, wires);
                              setComponents(prev => prev.map(c => c.id === selectedIds[0] ? { ...c, props: { ...c.props, [key]: !val } } : c))
                            }}
                            className={`w-full py-1.5 rounded-sm text-[10px] font-medium transition-colors border ${val ? 'bg-cyan-900/30 text-cyan-300 border-cyan-700/50' : 'bg-black text-cyan-700 border-cyan-900/50'}`}
                          >
                          {val ? (key === 'isPressed' ? 'TRUE (PRESSED)' : 'TRUE (OPEN)') : (key === 'isPressed' ? 'FALSE (RELEASED)' : 'FALSE (CLOSED)')}
                          </button>
                        ) : key === 'waveform' ? (
                          <select 
                            value={val}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setComponents(prev => prev.map(c => c.id === selectedIds[0] ? { ...c, props: { ...c.props, [key]: newVal } } : c));
                            }}
                            className="w-full cyber-input rounded-sm p-1.5 text-[10px] bg-[#050507]"
                          >
                            <option value="SINE">SINE</option>
                            <option value="SQUARE">SQUARE</option>
                            <option value="TRIANGLE">TRIANGLE</option>
                            <option value="SAW">SAW</option>
                          </select>
                        ) : key === 'position' ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" min="0" max="100" step="0.1" value={val}
                              onChange={(e) => setComponents(prev => prev.map(c => c.id === selectedIds[0] ? { ...c, props: { ...c.props, [key]: parseFloat(e.target.value) } } : c))}
                              onPointerDown={(e) => { dragSnapshotRef.current = { components, wires }; }}
                              onPointerUp={(e) => {
                                 if (dragSnapshotRef.current) {
                                    const oldComp = dragSnapshotRef.current.components.find(c => c.id === selectedIds[0]);
                                    if (oldComp && oldComp.props[key] !== val) {
                                       pushStateToHistory(dragSnapshotRef.current.components, dragSnapshotRef.current.wires);
                                    }
                                    dragSnapshotRef.current = null;
                                 }
                              }}
                              className="w-full accent-cyan-500"
                            />
                            <span className="text-[9px] font-mono w-8 text-right text-cyan-400">{Number(val).toFixed(1)}%</span>
                          </div>
                        ) : (
                          <input 
                            type={typeof val === 'number' ? 'number' : 'text'} value={val}
                            onFocus={() => { dragSnapshotRef.current = { components, wires }; }}
                            onChange={(e) => {
                              let raw = e.target.value;
                              let newVal = typeof val === 'number' ? (raw === '' ? '' : parseFloat(raw)) : raw;
                              setComponents(prev => prev.map(c => c.id === selectedIds[0] ? { ...c, props: { ...c.props, [key]: newVal } } : c));
                            }}
                            onBlur={(e) => {
                              let finalVal = val;
                              if (['resistance', 'pullupRes', 'driveRes', 'inRes', 'sigRes'].includes(key) && (val === '' || val < 0.001)) finalVal = 0.001;
                              if (key === 'beta' && (val === '' || val < 1)) finalVal = 1;
                              if (key === 'capacitance' && (val === '' || val < 1e-12)) finalVal = 1e-12;
                              if (['inductance', 'primaryL', 'secondaryL'].includes(key) && (val === '' || val < 1e-9)) finalVal = 1e-9;
                              if (key === 'dutyCycle') finalVal = Math.max(0, Math.min(100, val === '' ? 50 : val));
                              if (key === 'frequency' && (val === '' || val <= 0)) finalVal = 1;
                              if (key === 'coupling') finalVal = Math.max(0, Math.min(0.999, val === '' ? 0.99 : val));
                              if (finalVal !== val) {
                                setComponents(prev => prev.map(c => c.id === selectedIds[0] ? { ...c, props: { ...c.props, [key]: finalVal } } : c));
                              }

                              if (dragSnapshotRef.current) {
                                 const oldComp = dragSnapshotRef.current.components.find(c => c.id === selectedIds[0]);
                                 if (oldComp && oldComp.props[key] !== finalVal) {
                                    pushStateToHistory(dragSnapshotRef.current.components, dragSnapshotRef.current.wires);
                                 }
                                 dragSnapshotRef.current = null;
                              }
                            }}
                            className="w-full cyber-input rounded-sm p-1.5 text-[10px]"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Physics Readout */}
                  {isSimulating && (
                    <div className="p-2 bg-black/40 border border-cyan-900/50 rounded-sm mb-3 flex flex-col shrink-0">
                       <div className="space-y-1.5">
                           <h4 className="text-[8px] font-bold text-cyan-500/80 uppercase tracking-widest border-b border-cyan-900/50 pb-1 mb-1.5 cyber-text">Live Sim</h4>
                           {comp.type === 'NPN' ? (
                              <>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_be</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-2`]||0), 'V')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_ce</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-1`]||0) - (simData.voltages[`${comp.id}-2`]||0), 'V')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_col</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[`${comp.id}_CE`], 'A')}</span></div>
                              </>
                           ) : ['OPAMP', 'COMPARATOR'].includes(comp.type) ? (
                              <>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_eb</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-2`]||0) - (simData.voltages[`${comp.id}-0`]||0), 'V')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_ec</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-2`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_col</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[`${comp.id}_EC`], 'A')}</span></div>
                              </>
                           ) : comp.type === 'HBRIDGE' ? (
                              <>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_OUT1</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[`${comp.id}_OUT1`], 'A')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_OUT2</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[`${comp.id}_OUT2`], 'A')}</span></div>
                              </>
                           ) : comp.type === 'POTENTIOMETER' ? (
                              <>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Wiper V.</span> <span className="font-mono text-cyan-300">{formatUnit(simData.voltages[`${comp.id}-2`], 'V')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Wiper I.</span> <span className="font-mono text-cyan-300">{formatUnit(Math.abs((simData.currents[`${comp.id}_R1`] || 0) - (simData.currents[`${comp.id}_R2`] || 0)), 'A')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">R_AW</span> <span className="font-mono text-cyan-300">{formatUnit(Math.max(1e-3, (comp.props.resistance !== undefined ? comp.props.resistance : 10000) * (comp.props.position || 0) / 100), 'Ω')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">R_WB</span> <span className="font-mono text-cyan-300">{formatUnit(Math.max(1e-3, (comp.props.resistance !== undefined ? comp.props.resistance : 10000) * (1 - (comp.props.position || 0) / 100)), 'Ω')}</span></div>
                              </>
                           ) : comp.type === 'CAPACITOR' ? (
                              <>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Voltage</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Charge I.</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[comp.id], 'A')}</span></div>
                              </>
                           ) : comp.type === 'GROUND' ? (
                              <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Voltage</span> <span className="font-mono text-cyan-300">0.00 V</span></div>
                           ) : comp.type === 'MOTOR' ? (
                              <>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V Drop</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Current</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[comp.id], 'A')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Speed</span> <span className="font-mono text-cyan-300">{Math.round(60 / Math.max(0.2, 1 / Math.max(0.01, Math.abs(simData.currents[comp.id] || 0))))} RPM</span></div>
                              </>
                           ) : comp.type === 'SERVO' ? (() => {
                              let angle = Math.min(180, Math.max(0, (((simData.voltages[`${comp.id}-1`] || 0) - (simData.voltages[`${comp.id}-2`] || 0)) / 5) * 180));
                              const sigWire = wires.find(w => 
                                  (w.to.compId === comp.id && w.to.termIdx === 1) ||
                                  (w.from.compId === comp.id && w.from.termIdx === 1)
                              );
                              if (sigWire) {
                                  const sourceId = sigWire.from.compId === comp.id ? sigWire.to.compId : sigWire.from.compId;
                                  const sourceComp = components.find(c => c.id === sourceId);
                                  if (sourceComp && sourceComp.type === 'PWM') {
                                      const duty = sourceComp.props.dutyCycle !== undefined ? sourceComp.props.dutyCycle : 50;
                                      angle = (duty / 100) * 180;
                                  }
                              }
                              return (
                                <>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">SIG V.</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-1`]||0) - (simData.voltages[`${comp.id}-2`]||0), 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Angle</span> <span className="font-mono text-cyan-300">{Math.round(angle)}°</span></div>
                                </>
                              );
                           })() : comp.type === 'TIMER555' ? (
                                <>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_cc</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-7`]||0) - (simData.voltages[`${comp.id}-0`]||0), 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">OUT state</span> <span className="font-mono text-cyan-300">{simData.ic555?.[comp.id] ? 'HIGH' : 'LOW'}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_out</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[comp.id], 'A')}</span></div>
                                </>
                              ) : comp.type === 'RAM' ? (
                                <>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_cc</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_out</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[comp.id], 'A')}</span></div>
                                  <div className="mt-2 text-[10px] text-cyan-500 font-bold border-t border-cyan-900/50 pt-1">MEMORY STATE</div>
                                  <div className="grid grid-cols-2 gap-1 mt-1">
                                    {[0, 1, 2, 3].map(addr => (
                                      <div key={addr} className="bg-cyan-900/30 px-1 py-0.5 rounded flex justify-between">
                                        <span className="text-cyan-700">0x{addr}</span>
                                        <span className="font-mono text-cyan-300">{simData.ramData?.[comp.id]?.[addr] || 0}</span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : comp.type === 'PLC' ? (
                                <>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_cc</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">IN0 / IN1</span> <span className="font-mono text-cyan-300">{((simData.voltages[`${comp.id}-2`]||0) - (simData.voltages[`${comp.id}-1`]||0)) > 2.5 ? 'HI' : 'LO'} / {((simData.voltages[`${comp.id}-3`]||0) - (simData.voltages[`${comp.id}-1`]||0)) > 2.5 ? 'HI' : 'LO'}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">OUT0 / OUT1</span> <span className="font-mono text-cyan-300">{simData.plcData?.[comp.id]?.out0 ? 'HI' : 'LO'} / {simData.plcData?.[comp.id]?.out1 ? 'HI' : 'LO'}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_out0</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[`${comp.id}_OUT0`], 'A')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_out1</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[`${comp.id}_OUT1`], 'A')}</span></div>
                                </>
                              ) : comp.type === 'SHIFT_REGISTER' ? (
                                <>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_cc</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">CLK</span> <span className="font-mono text-cyan-300">{((simData.voltages[`${comp.id}-3`]||0) - (simData.voltages[`${comp.id}-1`]||0)) > 2.5 ? 'HI' : 'LO'}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">DATA</span> <span className="font-mono text-cyan-300">{((simData.voltages[`${comp.id}-2`]||0) - (simData.voltages[`${comp.id}-1`]||0)) > 2.5 ? 'HI' : 'LO'}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">BITS [3-0]</span> <span className="font-mono text-cyan-300">{(simData.shiftRegisterData?.[comp.id]?.bits || [0,0,0,0]).slice().reverse().join('')}</span></div>
                                </>
                              ) : comp.type === 'LATCH' ? (
                                <>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_cc</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">CLK</span> <span className="font-mono text-cyan-300">{((simData.voltages[`${comp.id}-6`]||0) - (simData.voltages[`${comp.id}-1`]||0)) > 2.5 ? 'HI (Open)' : 'LO (Latched)'}</span></div>
                                  <div className="mt-2 text-[10px] text-cyan-500 font-bold border-t border-cyan-900/50 pt-1">DATA IN</div>
                                  <div className="grid grid-cols-2 gap-1 mt-1">
                                    {[0, 1, 2, 3].map(i => (
                                      <div key={i} className="bg-cyan-900/30 px-1 py-0.5 rounded flex justify-between">
                                        <span className="text-cyan-700">D{i}</span>
                                        <span className="font-mono text-cyan-300">{((simData.voltages[`${comp.id}-${2+i}`]||0) - (simData.voltages[`${comp.id}-1`]||0)) > 2.5 ? '1' : '0'}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 text-[10px] text-cyan-500 font-bold border-t border-cyan-900/50 pt-1">LATCHED OUT</div>
                                  <div className="grid grid-cols-2 gap-1 mt-1">
                                    {[0, 1, 2, 3].map(i => (
                                      <div key={i} className="bg-cyan-900/30 px-1 py-0.5 rounded flex justify-between">
                                        <span className="text-cyan-700">Q{i}</span>
                                        <span className="font-mono text-cyan-300">{simData.latchData?.[comp.id]?.bits?.[i] || 0}</span>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : comp.type === 'SEVEN_SEGMENT' ? (
                                <>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_gnd</span> <span className="font-mono text-cyan-300">{formatUnit(simData.voltages[`${comp.id}-7`]||0, 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">ON</span> <span className="font-mono text-cyan-300">{(Object.keys(simData.sevenSegmentData?.[comp.id] || {}).filter(k => simData.sevenSegmentData[comp.id][k]).join('') || '-').toUpperCase()}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_total</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[comp.id], 'A')}</span></div>
                                </>
                              ) : comp.type === 'TRANSFORMER' ? (
                                <>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_pri</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_pri</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[`${comp.id}_1`], 'A')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V_sec</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-2`]||0) - (simData.voltages[`${comp.id}-3`]||0), 'V')}</span></div>
                                  <div className="flex justify-between text-[10px]"><span className="text-cyan-700">I_sec</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[`${comp.id}_2`], 'A')}</span></div>
                                </>
                              ) : (
                              <>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">V Drop</span> <span className="font-mono text-cyan-300">{formatUnit((simData.voltages[`${comp.id}-0`]||0) - (simData.voltages[`${comp.id}-1`]||0), 'V')}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Current</span> <span className="font-mono text-cyan-300">{formatUnit(simData.currents[comp.id], 'A')}</span></div>
                              </>
                           )}
                       </div>
                       {renderWaveform()}
                    </div>
                  )}

                  {COMPOUND_MODELS[comp.type] && (
                    <div className="p-2 bg-black/40 border border-cyan-900/50 rounded-sm mb-3 flex flex-col shrink-0">
                      <h4 className="text-[8px] font-bold text-cyan-500/80 uppercase tracking-widest border-b border-cyan-900/50 pb-1 mb-1.5 cyber-text">Internal Schematic</h4>
                      
                      {isSimulating && COMPOUND_MODELS[comp.type].nodes.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[7px] text-cyan-700 mb-1 font-bold">INTERNAL NODES</div>
                          <div className="flex flex-wrap gap-1">
                            {COMPOUND_MODELS[comp.type].nodes.map(n => (
                              <span key={n} className="text-[8px] bg-black/50 px-1 rounded border border-cyan-900/30 text-cyan-300 font-mono">
                                {n}: {formatUnit(simData.voltages[`${comp.id}-${n}`] || 0, 'V')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[7px] text-cyan-700 mb-1 font-bold">COMPONENTS</div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto hide-scrollbar">
                        {COMPOUND_MODELS[comp.type].components.map((mc, idx) => {
                          const internalId = `${comp.id}_${mc.id}`;
                          let internalCurrent = 0;
                          if (isSimulating) {
                              if (mc.type === 'NPN') internalCurrent = simData.currents[`${internalId}_CE`] || 0;
                              else if (mc.type === 'PNP') internalCurrent = simData.currents[`${internalId}_EC`] || 0;
                              else internalCurrent = simData.currents[internalId] || 0;
                          }
                          return (
                          <div key={idx} className="text-[9px] text-cyan-600 bg-black/30 p-1.5 rounded-sm border border-cyan-900/30">
                            <div className="flex justify-between items-center">
                              <div><span className="font-bold text-cyan-400">{mc.id}</span> <span className="opacity-70">({mc.type})</span></div>
                              {isSimulating && <span className="font-mono text-cyan-300">{formatUnit(internalCurrent, 'A')}</span>}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(mc.terminals).map(([term, net]) => (
                                <span key={term} className="text-[8px] bg-cyan-900/30 px-1 rounded border border-cyan-900/50">T{term}: {net}</span>
                              ))}
                            </div>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto space-y-1.5">
                    <button onClick={rotateSelected} className="w-full py-1.5 cyber-button rounded-sm text-[10px] font-medium transition-colors">Rotate 90°</button>
                    <button onClick={deleteSelected} className="w-full py-1.5 cyber-button cyber-button-danger rounded-sm text-[10px] font-medium transition-colors">Delete</button>
                  </div>
                </>
              );
            })()}

            {/* If Wire Selected */}
            {selectedWireId && wires.find(w => w.id === selectedWireId) && (() => {
              const wire = wires.find(w => w.id === selectedWireId);
              const compFrom = components.find(c => c.id === wire.from.compId);
              const compTo = components.find(c => c.id === wire.to.compId);
              const nameFrom = compFrom && COMPONENT_TYPES[compFrom.type] ? COMPONENT_TYPES[compFrom.type].name : 'Unknown';
              const nameTo = compTo && COMPONENT_TYPES[compTo.type] ? COMPONENT_TYPES[compTo.type].name : 'Unknown';
              
              return (
                <>
                  <div className="p-2 bg-black/40 rounded-sm border border-cyan-900/50 mb-4">
                    <p className="text-[8px] text-cyan-700 font-mono break-all mb-1.5">ID: {wire.id}</p>
                    <p className="text-[10px] text-cyan-500 leading-relaxed">Connects <b className="text-cyan-300">{nameFrom}</b> to <b className="text-cyan-300">{nameTo}</b>.</p>
                  </div>

                  <div className="space-y-3 mb-4">
                    {Object.entries(wire.props || { maxCurrent: 5 }).map(([key, val]) => (
                      <div key={key}>
                        <label className="block text-[9px] font-semibold text-cyan-600 mb-1 uppercase tracking-wider cyber-text">{key}</label>
                        <input 
                          type="number" value={val}
                          onFocus={() => { dragSnapshotRef.current = { components, wires }; }}
                          onChange={(e) => {
                            let newVal = parseFloat(e.target.value);
                            setWires(prev => prev.map(w => w.id === selectedWireId ? { ...w, props: { ...w.props, [key]: newVal } } : w));
                          }}
                          onBlur={(e) => {
                            let finalVal = val;
                            if (key === 'maxCurrent' && (val === '' || val <= 0)) finalVal = 0.1;
                            if (finalVal !== val) {
                              setWires(prev => prev.map(w => w.id === selectedWireId ? { ...w, props: { ...w.props, [key]: finalVal } } : w));
                            }

                            if (dragSnapshotRef.current) {
                               const oldWire = dragSnapshotRef.current.wires.find(w => w.id === selectedWireId);
                               if (oldWire && oldWire.props[key] !== finalVal) {
                                  pushStateToHistory(dragSnapshotRef.current.components, dragSnapshotRef.current.wires);
                               }
                               dragSnapshotRef.current = null;
                            }
                          }}
                          className="w-full cyber-input rounded-sm p-1.5 text-[10px]"
                        />
                      </div>
                    ))}
                  </div>

                  {isSimulating && (
                    <div className="p-2 bg-black/40 border border-cyan-900/50 rounded-sm mb-4 flex flex-col shrink-0">
                       <div className="space-y-1.5">
                           <h4 className="text-[8px] font-bold text-cyan-500/80 uppercase tracking-widest border-b border-cyan-900/50 pb-1 mb-1.5 cyber-text">Live Sim</h4>
                           <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Node V.</span> <span className="font-mono text-cyan-300">{formatUnit(simData.voltages[`${wire.from.compId}-${wire.from.termIdx}`], 'V')}</span></div>
                           <div className="flex justify-between text-[10px]"><span className="text-cyan-700">Current</span> <span className="font-mono text-cyan-300">{formatUnit(simData.wireCurrents[wire.id], 'A')}</span></div>
                       </div>
                       {renderWaveform()}
                    </div>
                  )}

                  <div className="mt-auto">
                    <button onClick={deleteSelected} className="w-full py-1.5 cyber-button cyber-button-danger rounded-sm text-[10px] font-medium transition-colors">Delete Wire</button>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

      {/* SPICE Viewer Modal */}
      {spiceViewerCode !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="cyber-panel flex flex-col w-full max-w-3xl h-full max-h-[80vh] rounded-sm border border-cyan-500/50 shadow-2xl">
            <div className="flex justify-between items-center p-3 border-b border-cyan-900/50">
              <h3 className="text-cyan-400 font-bold cyber-text text-sm tracking-wider flex items-center gap-2">
                <FileText size={16} /> SPICE Netlist Viewer
              </h3>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(spiceViewerCode); }} className="px-3 py-1 cyber-button rounded-sm text-[10px] font-bold uppercase tracking-wider">Copy</button>
                <button onClick={() => {
                  const blob = new Blob([spiceViewerCode], { type: "text/plain" });
                  const href = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = href;
                  link.download = "circuit.cir";
                  link.click();
                  URL.revokeObjectURL(href);
                }} className="px-3 py-1 cyber-button rounded-sm text-[10px] font-bold uppercase tracking-wider">Download</button>
                <button onClick={() => setSpiceViewerCode(null)} className="p-1.5 cyber-button cyber-button-danger rounded-sm">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#050507]">
              <pre className="text-[11px] md:text-xs font-mono whitespace-pre-wrap select-text">
                {spiceViewerCode.split('\n').map((line, i) => {
                  if (!line.trim() && line === '') return <div key={i} className="h-4"></div>;
                  if (line.trim().startsWith('*')) return <div key={i} className="text-green-500/80 italic">{line}</div>;
                  if (line.trim().startsWith('.')) {
                    const parts = line.split(/(\s+)/);
                    return (
                      <div key={i}>
                        <span className="text-pink-500 font-bold">{parts[0]}</span>
                        <span className="text-cyan-300">{parts.slice(1).join('')}</span>
                      </div>
                    );
                  }
                  const tokens = line.match(/(\s+)|([()=])|([^\s()=]+)/g) || [];
                  let isFirst = true;
                  return (
                    <div key={i}>
                      {tokens.map((tok, j) => {
                        if (!tok.trim()) return <span key={j}>{tok}</span>;
                        if (['(', ')', '='].includes(tok)) return <span key={j} className="text-cyan-500/70">{tok}</span>;
                        if (isFirst) { isFirst = false; return <span key={j} className="text-yellow-400 font-bold">{tok}</span>; }
                        const uTok = tok.toUpperCase();
                        if (['DC','AC','SINE','PULSE'].includes(uTok)) return <span key={j} className="text-purple-400 font-bold">{tok}</span>;
                        if (/^-?\d+(\.\d+)?(e[-+]?\d+)?(K|M|U|N|P|MEG|G|T)?$/i.test(tok)) return <span key={j} className="text-orange-400">{tok}</span>;
                        if (tok === '0' || tok.startsWith('N_') || tok.startsWith('net_') || ['vcc', 'gnd', 'in1', 'in2', 'out1', 'out2'].includes(tok)) return <span key={j} className="text-cyan-300">{tok}</span>;
                        return <span key={j} className="text-cyan-100">{tok}</span>;
                      })}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="cyber-panel flex flex-col w-full max-w-2xl h-auto max-h-[80vh] rounded-sm border border-cyan-500/50 shadow-2xl">
            <div className="flex justify-between items-center p-3 border-b border-cyan-900/50">
              <h3 className="text-cyan-400 font-bold cyber-text text-sm tracking-wider flex items-center gap-2">
                <HelpCircle size={16} /> Help & Shortcuts
              </h3>
              <button onClick={() => setShowHelp(false)} className="p-1.5 cyber-button cyber-button-danger rounded-sm">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[#050507] text-cyan-300 text-xs leading-relaxed space-y-4">
              <div>
                <h4 className="text-cyan-500 font-bold cyber-text mb-2 border-b border-cyan-900/30 pb-1">Controls</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-cyan-400">Pan:</strong> Click and drag empty space.</li>
                  <li><strong className="text-cyan-400">Zoom:</strong> Scroll wheel or use toolbar slider.</li>
                  <li><strong className="text-cyan-400">Select:</strong> Click a component or wire.</li>
                  <li><strong className="text-cyan-400">Multi-Select:</strong> Hold <kbd className="bg-cyan-900/30 px-1 rounded font-mono">Shift</kbd> and click components.</li>
                  <li><strong className="text-cyan-400">Properties:</strong> Double-click a component/wire or use the Sliders button.</li>
                </ul>
              </div>
              <div>
                <h4 className="text-cyan-500 font-bold cyber-text mb-2 border-b border-cyan-900/30 pb-1">Wiring</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Click on one component terminal (small circle), then click on another to connect them.</li>
                </ul>
              </div>
              <div>
                <h4 className="text-cyan-500 font-bold cyber-text mb-2 border-b border-cyan-900/30 pb-1">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div><kbd className="bg-cyan-900/30 px-1 rounded font-mono text-[10px]">R</kbd> - Rotate selected component</div>
                  <div><kbd className="bg-cyan-900/30 px-1 rounded font-mono text-[10px]">Del / Backspace</kbd> - Delete selected</div>
                  <div><kbd className="bg-cyan-900/30 px-1 rounded font-mono text-[10px]">Ctrl+Z</kbd> - Undo</div>
                  <div><kbd className="bg-cyan-900/30 px-1 rounded font-mono text-[10px]">Ctrl+Y</kbd> - Redo</div>
                  <div><kbd className="bg-cyan-900/30 px-1 rounded font-mono text-[10px]">S</kbd> - Toggle Simulation</div>
                  <div><kbd className="bg-cyan-900/30 px-1 rounded font-mono text-[10px]">Esc</kbd> - Deselect all / Close dialogs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;