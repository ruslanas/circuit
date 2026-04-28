export const EXAMPLES = [
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
      ],
      servoConfig: {
        "bat": { offsetX: 0, offsetY: 0.5, offsetZ: 0, parentId: null },
        "sw1": { offsetX: -1.5, offsetY: 0, offsetZ: -0.8, parentId: "bat" },
        "sw2": { offsetX: -1.5, offsetY: 0, offsetZ: 0.8, parentId: "bat" },
        "mot": { offsetX: 2, offsetY: 0, offsetZ: 0, parentId: "bat" }
      }
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
  },
  {
    name: "3D Robot Arm Linkage",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 60, y: 100, rotation: 0, props: { voltage: 5 } },
        { id: "gnd", type: "GROUND", x: 60, y: 280, rotation: 0, props: {} },
        { id: "sw1", type: "SWITCH", x: 180, y: 100, rotation: 0, props: { isOpen: false } },
        { id: "pot1", type: "POTENTIOMETER", x: 300, y: 100, rotation: 0, props: { resistance: 10000, position: 50 } },
        { id: "pot2", type: "POTENTIOMETER", x: 420, y: 100, rotation: 0, props: { resistance: 10000, position: 30 } },
        { id: "pot3", type: "POTENTIOMETER", x: 540, y: 100, rotation: 0, props: { resistance: 10000, position: 70 } },
        { id: "srv1", type: "SERVO", x: 300, y: 280, rotation: 0, props: {} },
        { id: "srv2", type: "SERVO", x: 420, y: 280, rotation: 0, props: {} },
        { id: "srv3", type: "SERVO", x: 540, y: 280, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w_bat_sw", from: { compId: "bat", termIdx: 0 }, to: { compId: "sw1", termIdx: 0 } },
        { id: "w_vcc1", from: { compId: "sw1", termIdx: 1 }, to: { compId: "pot1", termIdx: 0 } },
        { id: "w_vcc2", from: { compId: "sw1", termIdx: 1 }, to: { compId: "pot2", termIdx: 0 } },
        { id: "w_vcc3", from: { compId: "sw1", termIdx: 1 }, to: { compId: "pot3", termIdx: 0 } },
        { id: "w_vcc4", from: { compId: "sw1", termIdx: 1 }, to: { compId: "srv1", termIdx: 0 } },
        { id: "w_vcc5", from: { compId: "sw1", termIdx: 1 }, to: { compId: "srv2", termIdx: 0 } },
        { id: "w_vcc6", from: { compId: "sw1", termIdx: 1 }, to: { compId: "srv3", termIdx: 0 } },
        { id: "w_gnd_bat", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w_gnd1", from: { compId: "gnd", termIdx: 0 }, to: { compId: "pot1", termIdx: 1 } },
        { id: "w_gnd2", from: { compId: "gnd", termIdx: 0 }, to: { compId: "pot2", termIdx: 1 } },
        { id: "w_gnd3", from: { compId: "gnd", termIdx: 0 }, to: { compId: "pot3", termIdx: 1 } },
        { id: "w_gnd4", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv1", termIdx: 2 } },
        { id: "w_gnd5", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv2", termIdx: 2 } },
        { id: "w_gnd6", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv3", termIdx: 2 } },
        { id: "w_sig1", from: { compId: "pot1", termIdx: 2 }, to: { compId: "srv1", termIdx: 1 } },
        { id: "w_sig2", from: { compId: "pot2", termIdx: 2 }, to: { compId: "srv2", termIdx: 1 } },
        { id: "w_sig3", from: { compId: "pot3", termIdx: 2 }, to: { compId: "srv3", termIdx: 1 } }
      ],
      servoConfig: {
        "sw1": { offsetX: -2, offsetY: 0, offsetZ: 2, parentId: null },
        "pot1": { offsetX: 0, offsetY: 0, offsetZ: 2, parentId: null },
        "pot2": { offsetX: 2, offsetY: 0, offsetZ: 2, parentId: null },
        "pot3": { offsetX: 4, offsetY: 0, offsetZ: 2, parentId: null },
        "srv1": { axis: "Y", offsetX: 0, offsetY: 0, offsetZ: 0, parentId: null },
        "srv2": { axis: "Z", offsetX: 0, offsetY: 1, offsetZ: 0, parentId: "srv1" },
        "srv3": { axis: "Z", offsetX: 2.5, offsetY: 0, offsetZ: 0, parentId: "srv2" }
      }
    }
  },
  {
    name: "3D Soldering Robot Arm",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 60, y: 60, rotation: 0, props: { voltage: 5, maxCurrent: 5 } },
        { id: "gnd", type: "GROUND", x: 60, y: 240, rotation: 0, props: {} },
        { id: "sw", type: "SWITCH", x: 180, y: 60, rotation: 0, props: { isOpen: false, maxCurrent: 5 } },
        { id: "iron", type: "SOLDERING_IRON", x: 300, y: 60, rotation: 0, props: { resistance: 10, maxPower: 50, maxCurrent: 5 } },
        { id: "pot1", type: "POTENTIOMETER", x: 180, y: 140, rotation: 0, props: { resistance: 10000, position: 50, maxPower: 0.25 } },
        { id: "pot2", type: "POTENTIOMETER", x: 300, y: 140, rotation: 0, props: { resistance: 10000, position: 30, maxPower: 0.25 } },
        { id: "pot3", type: "POTENTIOMETER", x: 420, y: 140, rotation: 0, props: { resistance: 10000, position: 60, maxPower: 0.25 } },
        { id: "pot4", type: "POTENTIOMETER", x: 540, y: 140, rotation: 0, props: { resistance: 10000, position: 50, maxPower: 0.25 } },
        { id: "srv1", type: "SERVO", x: 180, y: 240, rotation: 0, props: { resistance: 100, sigRes: 1000000, maxCurrent: 1 } },
        { id: "srv2", type: "SERVO", x: 300, y: 240, rotation: 0, props: { resistance: 100, sigRes: 1000000, maxCurrent: 1 } },
        { id: "srv3", type: "SERVO", x: 420, y: 240, rotation: 0, props: { resistance: 100, sigRes: 1000000, maxCurrent: 1 } },
        { id: "srv4", type: "SERVO", x: 540, y: 240, rotation: 0, props: { resistance: 100, sigRes: 1000000, maxCurrent: 1 } },
        { id: "bed", type: "WORK_BED", x: 660, y: 60, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "sw", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w2", from: { compId: "sw", termIdx: 1 }, to: { compId: "iron", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w3", from: { compId: "iron", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w4", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w5", from: { compId: "bat", termIdx: 0 }, to: { compId: "pot1", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w6", from: { compId: "bat", termIdx: 0 }, to: { compId: "pot2", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w7", from: { compId: "bat", termIdx: 0 }, to: { compId: "pot3", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w8", from: { compId: "bat", termIdx: 0 }, to: { compId: "pot4", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w9", from: { compId: "bat", termIdx: 0 }, to: { compId: "srv1", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w10", from: { compId: "bat", termIdx: 0 }, to: { compId: "srv2", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w11", from: { compId: "bat", termIdx: 0 }, to: { compId: "srv3", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w12", from: { compId: "bat", termIdx: 0 }, to: { compId: "srv4", termIdx: 0 }, props: { maxCurrent: 5 } },
        { id: "w13", from: { compId: "gnd", termIdx: 0 }, to: { compId: "pot1", termIdx: 1 }, props: { maxCurrent: 5 } },
        { id: "w14", from: { compId: "gnd", termIdx: 0 }, to: { compId: "pot2", termIdx: 1 }, props: { maxCurrent: 5 } },
        { id: "w15", from: { compId: "gnd", termIdx: 0 }, to: { compId: "pot3", termIdx: 1 }, props: { maxCurrent: 5 } },
        { id: "w16", from: { compId: "gnd", termIdx: 0 }, to: { compId: "pot4", termIdx: 1 }, props: { maxCurrent: 5 } },
        { id: "w17", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv1", termIdx: 2 }, props: { maxCurrent: 5 } },
        { id: "w18", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv2", termIdx: 2 }, props: { maxCurrent: 5 } },
        { id: "w19", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv3", termIdx: 2 }, props: { maxCurrent: 5 } },
        { id: "w20", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv4", termIdx: 2 }, props: { maxCurrent: 5 } },
        { id: "w21", from: { compId: "pot1", termIdx: 2 }, to: { compId: "srv1", termIdx: 1 }, props: { maxCurrent: 5 } },
        { id: "w22", from: { compId: "pot2", termIdx: 2 }, to: { compId: "srv2", termIdx: 1 }, props: { maxCurrent: 5 } },
        { id: "w23", from: { compId: "pot3", termIdx: 2 }, to: { compId: "srv3", termIdx: 1 }, props: { maxCurrent: 5 } },
        { id: "w24", from: { compId: "pot4", termIdx: 2 }, to: { compId: "srv4", termIdx: 1 }, props: { maxCurrent: 5 } }
      ],
      servoConfig: {
        "srv1": { axis: "Y", offsetX: 0, offsetY: 0, offsetZ: 0, parentId: null },
        "srv2": { axis: "X", offsetX: 0, offsetY: 1.5, offsetZ: 0, parentId: "srv1" },
        "srv3": { axis: "X", offsetX: 0, offsetY: 1.5, offsetZ: 0, parentId: "srv2" },
        "srv4": { axis: "X", offsetX: 0, offsetY: 1.5, offsetZ: 0, parentId: "srv3" },
        "iron": { offsetX: 0, offsetY: 1, offsetZ: 0, parentId: "srv4" },
        "bed": { offsetX: 0, offsetY: -0.2, offsetZ: 3, parentId: null }
      }
    }
  },
  {
    name: "Auto-Soldering: Corner Sweep",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 60, y: 60, rotation: 0, props: { voltage: 5, maxCurrent: 5 } },
        { id: "gnd", type: "GROUND", x: 60, y: 240, rotation: 0, props: {} },
        { id: "iron", type: "SOLDERING_IRON", x: 180, y: 60, rotation: 0, props: { resistance: 10, maxPower: 50, maxCurrent: 5 } },
        { id: "bed", type: "WORK_BED", x: 300, y: 60, rotation: 0, props: {} },
        { id: "osc1", type: "OSCILLATOR", x: 180, y: 140, rotation: 0, props: { waveform: "SQUARE", voltage: 1.25, offset: 2.5, frequency: 0.5 } },
        { id: "osc2", type: "OSCILLATOR", x: 300, y: 140, rotation: 0, props: { waveform: "SQUARE", voltage: 1.25, offset: 2.5, frequency: 0.25 } },
        { id: "osc3", type: "OSCILLATOR", x: 420, y: 140, rotation: 0, props: { waveform: "SQUARE", voltage: 1.0, offset: 2.5, frequency: 1 } },
        { id: "srv1", type: "SERVO", x: 180, y: 240, rotation: 0, props: { resistance: 100, sigRes: 1000000, maxCurrent: 1 } },
        { id: "srv2", type: "SERVO", x: 300, y: 240, rotation: 0, props: { resistance: 100, sigRes: 1000000, maxCurrent: 1 } },
        { id: "srv3", type: "SERVO", x: 420, y: 240, rotation: 0, props: { resistance: 100, sigRes: 1000000, maxCurrent: 1 } }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "iron", termIdx: 0 } },
        { id: "w2", from: { compId: "iron", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w3", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w4", from: { compId: "bat", termIdx: 0 }, to: { compId: "srv1", termIdx: 0 } },
        { id: "w5", from: { compId: "bat", termIdx: 0 }, to: { compId: "srv2", termIdx: 0 } },
        { id: "w6", from: { compId: "bat", termIdx: 0 }, to: { compId: "srv3", termIdx: 0 } },
        { id: "w7", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv1", termIdx: 2 } },
        { id: "w8", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv2", termIdx: 2 } },
        { id: "w9", from: { compId: "gnd", termIdx: 0 }, to: { compId: "srv3", termIdx: 2 } },
        { id: "w10", from: { compId: "osc1", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w11", from: { compId: "osc2", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w12", from: { compId: "osc3", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w13", from: { compId: "osc1", termIdx: 0 }, to: { compId: "srv1", termIdx: 1 } },
        { id: "w14", from: { compId: "osc2", termIdx: 0 }, to: { compId: "srv2", termIdx: 1 } },
        { id: "w15", from: { compId: "osc3", termIdx: 0 }, to: { compId: "srv3", termIdx: 1 } }
      ],
      servoConfig: {
        "srv1": { axis: "Y", offsetX: 0, offsetY: 0, offsetZ: 0, parentId: null },
        "srv2": { axis: "X", offsetX: 0, offsetY: 1.5, offsetZ: 0, parentId: "srv1" },
        "srv3": { axis: "X", offsetX: 0, offsetY: 1.5, offsetZ: 0, parentId: "srv2" },
        "iron": { offsetX: 0, offsetY: 1.5, offsetZ: 0, parentId: "srv3" },
        "bed": { offsetX: 0, offsetY: -0.2, offsetZ: 3, parentId: null }
      }
    }
  },
  {
    name: "Quadrocopter Auto-Leveling",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 60, y: 160, rotation: 0, props: { voltage: 5, maxCurrent: 10 } },
        { id: "gnd", type: "GROUND", x: 60, y: 260, rotation: 0, props: {} },
        { id: "gyro", type: "GYROSCOPE", x: 200, y: 160, rotation: 0, props: { pitch: 0, roll: 0, maxCurrent: 2 } },
        { id: "propF", type: "PROPELLER", x: 520, y: 40, rotation: 0, props: { resistance: 5, maxCurrent: 5 } },
        { id: "npnF", type: "NPN", x: 380, y: 40, rotation: 0, props: { beta: 100 } },
        { id: "dioF", type: "DIODE", x: 520, y: -20, rotation: 180, props: { forwardVoltage: 0.7, maxCurrent: 5 } },
        { id: "rbF", type: "RESISTOR", x: 280, y: 20, rotation: 0, props: { resistance: 1000 } },
        { id: "rgF", type: "RESISTOR", x: 280, y: 60, rotation: 0, props: { resistance: 470 } },
        { id: "propB", type: "PROPELLER", x: 520, y: 160, rotation: 0, props: { resistance: 5, maxCurrent: 5 } },
        { id: "npnB", type: "NPN", x: 380, y: 160, rotation: 0, props: { beta: 100, maxCurrent: 2 } },
        { id: "dioB", type: "DIODE", x: 520, y: 100, rotation: 180, props: { forwardVoltage: 0.7, maxCurrent: 5 } },
        { id: "rbB", type: "RESISTOR", x: 280, y: 140, rotation: 0, props: { resistance: 1000 } },
        { id: "rgB", type: "RESISTOR", x: 280, y: 180, rotation: 0, props: { resistance: 470 } },
        { id: "propR", type: "PROPELLER", x: 520, y: 280, rotation: 0, props: { resistance: 5, maxCurrent: 5 } },
        { id: "npnR", type: "NPN", x: 380, y: 280, rotation: 0, props: { beta: 100, maxCurrent: 2 } },
        { id: "dioR", type: "DIODE", x: 520, y: 220, rotation: 180, props: { forwardVoltage: 0.7, maxCurrent: 5 } },
        { id: "rbR", type: "RESISTOR", x: 280, y: 260, rotation: 0, props: { resistance: 1000 } },
        { id: "rgR", type: "RESISTOR", x: 280, y: 300, rotation: 0, props: { resistance: 470 } },
        { id: "propL", type: "PROPELLER", x: 520, y: 400, rotation: 0, props: { resistance: 5, maxCurrent: 5 } },
        { id: "npnL", type: "NPN", x: 380, y: 400, rotation: 0, props: { beta: 100, maxCurrent: 2 } },
        { id: "dioL", type: "DIODE", x: 520, y: 340, rotation: 180, props: { forwardVoltage: 0.7, maxCurrent: 5 } },
        { id: "rbL", type: "RESISTOR", x: 280, y: 380, rotation: 0, props: { resistance: 1000 } },
        { id: "rgL", type: "RESISTOR", x: 280, y: 420, rotation: 0, props: { resistance: 470 } },
        { id: "bed", type: "WORK_BED", x: 680, y: 220, rotation: 0, props: {} }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "gyro", termIdx: 0 }, props: { maxCurrent: 10 } },
        { id: "w4", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 10 } },
        { id: "w5", from: { compId: "gyro", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 }, props: { maxCurrent: 10 } },
        { id: "w_vcc_rbF", from: { compId: "bat", termIdx: 0 }, to: { compId: "rbF", termIdx: 0 } },
        { id: "w_vcc_rbB", from: { compId: "bat", termIdx: 0 }, to: { compId: "rbB", termIdx: 0 } },
        { id: "w_vcc_rbR", from: { compId: "bat", termIdx: 0 }, to: { compId: "rbR", termIdx: 0 } },
        { id: "w_vcc_rbL", from: { compId: "bat", termIdx: 0 }, to: { compId: "rbL", termIdx: 0 } },
        { id: "w_vcc_pF", from: { compId: "bat", termIdx: 0 }, to: { compId: "propF", termIdx: 0 } },
        { id: "w_vcc_pB", from: { compId: "bat", termIdx: 0 }, to: { compId: "propB", termIdx: 0 } },
        { id: "w_vcc_pR", from: { compId: "bat", termIdx: 0 }, to: { compId: "propR", termIdx: 0 } },
        { id: "w_vcc_pL", from: { compId: "bat", termIdx: 0 }, to: { compId: "propL", termIdx: 0 } },
        { id: "w_vcc_dF", from: { compId: "bat", termIdx: 0 }, to: { compId: "dioF", termIdx: 1 } },
        { id: "w_vcc_dB", from: { compId: "bat", termIdx: 0 }, to: { compId: "dioB", termIdx: 1 } },
        { id: "w_vcc_dR", from: { compId: "bat", termIdx: 0 }, to: { compId: "dioR", termIdx: 1 } },
        { id: "w_vcc_dL", from: { compId: "bat", termIdx: 0 }, to: { compId: "dioL", termIdx: 1 } },
        { id: "w_gnd_nF", from: { compId: "npnF", termIdx: 2 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w_gnd_nB", from: { compId: "npnB", termIdx: 2 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w_gnd_nR", from: { compId: "npnR", termIdx: 2 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w_gnd_nL", from: { compId: "npnL", termIdx: 2 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w_cF_pF", from: { compId: "npnF", termIdx: 1 }, to: { compId: "propF", termIdx: 1 } },
        { id: "w_cF_dF", from: { compId: "npnF", termIdx: 1 }, to: { compId: "dioF", termIdx: 0 } },
        { id: "w_cB_pB", from: { compId: "npnB", termIdx: 1 }, to: { compId: "propB", termIdx: 1 } },
        { id: "w_cB_dB", from: { compId: "npnB", termIdx: 1 }, to: { compId: "dioB", termIdx: 0 } },
        { id: "w_cR_pR", from: { compId: "npnR", termIdx: 1 }, to: { compId: "propR", termIdx: 1 } },
        { id: "w_cR_dR", from: { compId: "npnR", termIdx: 1 }, to: { compId: "dioR", termIdx: 0 } },
        { id: "w_cL_pL", from: { compId: "npnL", termIdx: 1 }, to: { compId: "propL", termIdx: 1 } },
        { id: "w_cL_dL", from: { compId: "npnL", termIdx: 1 }, to: { compId: "dioL", termIdx: 0 } },
        { id: "w_bF_rbF", from: { compId: "npnF", termIdx: 0 }, to: { compId: "rbF", termIdx: 1 } },
        { id: "w_bF_rgF", from: { compId: "npnF", termIdx: 0 }, to: { compId: "rgF", termIdx: 1 } },
        { id: "w_bB_rbB", from: { compId: "npnB", termIdx: 0 }, to: { compId: "rbB", termIdx: 1 } },
        { id: "w_bB_rgB", from: { compId: "npnB", termIdx: 0 }, to: { compId: "rgB", termIdx: 1 } },
        { id: "w_bR_rbR", from: { compId: "npnR", termIdx: 0 }, to: { compId: "rbR", termIdx: 1 } },
        { id: "w_bR_rgR", from: { compId: "npnR", termIdx: 0 }, to: { compId: "rgR", termIdx: 1 } },
        { id: "w_bL_rbL", from: { compId: "npnL", termIdx: 0 }, to: { compId: "rbL", termIdx: 1 } },
        { id: "w_bL_rgL", from: { compId: "npnL", termIdx: 0 }, to: { compId: "rgL", termIdx: 1 } },
        { id: "w_gXp_rgF", from: { compId: "gyro", termIdx: 2 }, to: { compId: "rgF", termIdx: 0 } },
        { id: "w_gXn_rgB", from: { compId: "gyro", termIdx: 3 }, to: { compId: "rgB", termIdx: 0 } },
        { id: "w_gYp_rgR", from: { compId: "gyro", termIdx: 4 }, to: { compId: "rgR", termIdx: 0 } },
        { id: "w_gYn_rgL", from: { compId: "gyro", termIdx: 5 }, to: { compId: "rgL", termIdx: 0 } }
      ],
      servoConfig: {
        "bed": { offsetX: 0, offsetY: -0.2, offsetZ: 0, parentId: null },
        "bat": { offsetX: 0, offsetY: 0.5, offsetZ: 0, parentId: "bed" },
        "gyro": { offsetX: 0, offsetY: 0.8, offsetZ: 0, parentId: "bat" },
        "propF": { offsetX: 0, offsetY: 0, offsetZ: -2, parentId: "gyro" },
        "propB": { offsetX: 0, offsetY: 0, offsetZ: 2, parentId: "gyro" },
        "propL": { offsetX: -2, offsetY: 0, offsetZ: 0, parentId: "gyro" },
        "propR": { offsetX: 2, offsetY: 0, offsetZ: 0, parentId: "gyro" }
      }
    }
  },
  {
    name: "Simple 4WD",
    data: {
      components: [
        { id: "bat", type: "BATTERY", x: 60, y: 160, rotation: 0, props: { voltage: 9, maxCurrent: 10 } },
        { id: "gnd", type: "GROUND", x: 60, y: 260, rotation: 0, props: {} },
        { id: "btnFwd", type: "PUSH_BUTTON", x: 200, y: 100, rotation: 0, props: { isPressed: false, maxCurrent: 5 } },
        { id: "btnRev", type: "PUSH_BUTTON", x: 200, y: 180, rotation: 0, props: { isPressed: false, maxCurrent: 5 } },
        { id: "hb", type: "HBRIDGE", x: 340, y: 140, rotation: 0, props: { pullupRes: 10000, driveRes: 1000, inRes: 1000, beta: 100, maxCurrent: 15 } },
        { id: "wFL", type: "WHEEL", x: 500, y: 40, rotation: 0, props: { resistance: 50, maxCurrent: 5 } },
        { id: "wFR", type: "WHEEL", x: 500, y: 120, rotation: 0, props: { resistance: 50, maxCurrent: 5 } },
        { id: "wBL", type: "WHEEL", x: 500, y: 200, rotation: 0, props: { resistance: 50, maxCurrent: 5 } },
        { id: "wBR", type: "WHEEL", x: 500, y: 280, rotation: 0, props: { resistance: 50, maxCurrent: 5 } },
        { id: "chassis", type: "CAR_CHASSIS", x: 640, y: 160, rotation: 0, props: {} },
        { id: "rFwd", type: "RESISTOR", x: 640, y: 40, rotation: 0, props: { resistance: 330, maxPower: 2 } },
        { id: "ledFwd", type: "LED", x: 760, y: 40, rotation: 0, props: { color: "#ffffff" } },
        { id: "rRev", type: "RESISTOR", x: 640, y: 280, rotation: 0, props: { resistance: 330, maxPower: 2 } },
        { id: "ledRev", type: "LED", x: 760, y: 280, rotation: 0, props: { color: "#ff003c" } }
      ],
      wires: [
        { id: "w1", from: { compId: "bat", termIdx: 0 }, to: { compId: "btnFwd", termIdx: 0 } },
        { id: "w2", from: { compId: "bat", termIdx: 0 }, to: { compId: "btnRev", termIdx: 0 } },
        { id: "w3", from: { compId: "bat", termIdx: 0 }, to: { compId: "hb", termIdx: 0 } },
        { id: "w4", from: { compId: "bat", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w5", from: { compId: "hb", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w6", from: { compId: "btnFwd", termIdx: 1 }, to: { compId: "hb", termIdx: 2 } },
        { id: "w7", from: { compId: "btnRev", termIdx: 1 }, to: { compId: "hb", termIdx: 3 } },
        { id: "w8", from: { compId: "hb", termIdx: 4 }, to: { compId: "wFL", termIdx: 1 } },
        { id: "w9", from: { compId: "hb", termIdx: 5 }, to: { compId: "wFL", termIdx: 0 } },
        { id: "w10", from: { compId: "hb", termIdx: 4 }, to: { compId: "wBL", termIdx: 1 } },
        { id: "w11", from: { compId: "hb", termIdx: 5 }, to: { compId: "wBL", termIdx: 0 } },
        { id: "w12", from: { compId: "hb", termIdx: 5 }, to: { compId: "wFR", termIdx: 1 } },
        { id: "w13", from: { compId: "hb", termIdx: 4 }, to: { compId: "wFR", termIdx: 0 } },
        { id: "w14", from: { compId: "hb", termIdx: 5 }, to: { compId: "wBR", termIdx: 1 } },
        { id: "w15", from: { compId: "hb", termIdx: 4 }, to: { compId: "wBR", termIdx: 0 } },
        { id: "w16", from: { compId: "btnFwd", termIdx: 1 }, to: { compId: "rFwd", termIdx: 0 } },
        { id: "w16b", from: { compId: "rFwd", termIdx: 1 }, to: { compId: "ledFwd", termIdx: 0 } },
        { id: "w17", from: { compId: "ledFwd", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } },
        { id: "w18", from: { compId: "btnRev", termIdx: 1 }, to: { compId: "rRev", termIdx: 0 } },
        { id: "w18b", from: { compId: "rRev", termIdx: 1 }, to: { compId: "ledRev", termIdx: 0 } },
        { id: "w19", from: { compId: "ledRev", termIdx: 1 }, to: { compId: "gnd", termIdx: 0 } }
      ],
      servoConfig: {
        "chassis": { offsetX: 0, offsetY: 0.5, offsetZ: 0, parentId: null },
        "bat": { offsetX: 0, offsetY: 0.3, offsetZ: 0, parentId: "chassis", scaleX: 0.6, scaleY: 0.6, scaleZ: 0.6 },
        "wFL": { offsetX: -1.3, offsetY: -0.2, offsetZ: -1.8, parentId: "chassis" },
        "wFR": { offsetX: 1.3, offsetY: -0.2, offsetZ: -1.8, yaw: 180, parentId: "chassis" },
        "wBL": { offsetX: -1.3, offsetY: -0.2, offsetZ: 1.8, parentId: "chassis", scaleX: 1, scaleY: 1, scaleZ: 1 },
        "wBR": { offsetX: 1.3, offsetY: -0.2, offsetZ: 1.8, yaw: 180, parentId: "chassis", scaleX: 1, scaleY: 1, scaleZ: 1 },
        "btnFwd": { offsetX: 0, offsetY: 0.6, offsetZ: -0.8, parentId: "bat", scaleX: 0.8, scaleY: 0.8, scaleZ: 0.8 },
        "btnRev": { offsetX: 0, offsetY: 0.6, offsetZ: 0.8, parentId: "bat", scaleX: 0.8, scaleY: 0.8, scaleZ: 0.8 },
        "ledFwd": { offsetX: 0, offsetY: 0.3, offsetZ: -2.0, parentId: "chassis" },
        "ledRev": { offsetX: 0, offsetY: 0.3, offsetZ: 2.0, yaw: 180, parentId: "chassis" }
      }
    }
  }
];