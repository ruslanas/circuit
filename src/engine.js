export function simulateTick({
  components,
  wires,
  tick,
  prevState,
  diodeStates,
  burnedStates = {},
  COMPONENT_TYPES,
  COMPOUND_MODELS,
  dt = 0.05
}) {
  
  function compilePLC(expr) {
    try {
      let e = String(expr).toUpperCase()
        .replace(/\bAND\b/g, '&&').replace(/\bOR\b/g, '||')
        .replace(/\bNOT\b/g, '!').replace(/\bXOR\b/g, '!==')
        .replace(/[^I01&|!=()\s]/g, '');
      return new Function('I0', 'I1', `return !!(${e});`);
    } catch(err) {
      return () => false;
    }
  }
  
  let tNodes = {};
  let tCount = 0;
  
  const validComponents = components.filter(c => COMPONENT_TYPES[c.type]);
  
  // Ground node setup
  const grounds = validComponents.filter(c => c.type === 'GROUND');
  if (grounds.length > 0) {
    grounds.forEach(g => { tNodes[`${g.id}-0`] = 0; });
    tCount = 1;
  } else {
    let groundTId = null;
    const src = validComponents.find(c => c.type === 'BATTERY' || c.type === 'AC_SOURCE' || c.type === 'PWM');
    if (src) groundTId = `${src.id}-1`;
    else if (validComponents.length > 0) groundTId = `${validComponents[0].id}-0`;

    if (groundTId) {
      tNodes[groundTId] = 0;
      tCount = 1;
    }
  }

  validComponents.forEach(c => {
    const type = COMPONENT_TYPES[c.type];
    type.terminals.forEach((_, i) => {
      const tid = `${c.id}-${i}`;
      if (tNodes[tid] === undefined) tNodes[tid] = tCount++;
    });
    if (COMPOUND_MODELS[c.type]) {
      COMPOUND_MODELS[c.type].nodes.forEach(n => {
        tNodes[`${c.id}-${n}`] = tCount++;
      });
    }
  });

  const N = tCount; 
  let expandedComponents = [];

  validComponents.forEach(c => {
    if (COMPOUND_MODELS[c.type]) {
      const model = COMPOUND_MODELS[c.type];
      model.components.forEach(mc => {
        const resolvedProps = {};
        Object.keys(mc.props).forEach(k => {
          const val = mc.props[k];
          resolvedProps[k] = (typeof val === 'string' && c.props[val] !== undefined) ? c.props[val] : val;
        });
        
        const vComp = {
          id: `${c.id}_${mc.id}`,
          type: mc.type,
          props: resolvedProps, 
          virtualTerminals: {}
        };
        Object.keys(mc.terminals).forEach(termIdx => {
          const mappedTo = mc.terminals[termIdx];
          if (typeof mappedTo === 'number') {
            vComp.virtualTerminals[termIdx] = `${c.id}-${mappedTo}`;
          } else {
            vComp.virtualTerminals[termIdx] = `${c.id}-${mappedTo}`;
          }
        });
        expandedComponents.push(vComp);
      });
    } else {
      const vComp = { ...c, virtualTerminals: {} };
      COMPONENT_TYPES[c.type].terminals.forEach((_, i) => {
        vComp.virtualTerminals[i] = `${c.id}-${i}`;
      });
      expandedComponents.push(vComp);
    }
  });

  expandedComponents.forEach(vc => {
    if (diodeStates[vc.id] === undefined) {
      if (vc.type === 'LED' || vc.type === 'DIODE') diodeStates[vc.id] = false;
      if (vc.type === 'NPN' || vc.type === 'PNP') diodeStates[vc.id] = 'OFF';
    }
  });

  let nodeVoltagesMap = {};
  let branchCurrentsMap = {};
  let wireCurrentsMap = {};
  let activeMap = {};

  // Setup and evaluate logic states directly reflecting previous tick memory state
  if (!prevState.ramData) prevState.ramData = {};
  if (!prevState.ic555) prevState.ic555 = {};
  if (!prevState.plcData) prevState.plcData = {};
  if (!prevState.shiftRegisterData) prevState.shiftRegisterData = {};
  if (!prevState.latchData) prevState.latchData = {};

  expandedComponents.forEach(vc => {
    if (vc.type === 'RAM') {
      if (!prevState.ramData[vc.id]) prevState.ramData[vc.id] = [0, 0, 0, 0];
      
      const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
      const vA0 = (prevState.vNodes[vc.virtualTerminals[2]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
      const vA1 = (prevState.vNodes[vc.virtualTerminals[3]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
      const vDin = (prevState.vNodes[vc.virtualTerminals[4]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
      const vWe = (prevState.vNodes[vc.virtualTerminals[5]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);

      const logicHigh = vVcc > 2.5 ? vVcc * 0.5 : 2.5; 
      const addr = (vA1 > logicHigh ? 2 : 0) + (vA0 > logicHigh ? 1 : 0);
      
      if (vVcc > 2.0 && vWe > logicHigh) {
        prevState.ramData[vc.id][addr] = vDin > logicHigh ? 1 : 0;
      }
    } else if (vc.type === 'TIMER555') {
      if (prevState.ic555[vc.id] === undefined) prevState.ic555[vc.id] = 0;
      const vGnd = prevState.vNodes[vc.virtualTerminals[0]] || 0;
      const vVcc = (prevState.vNodes[vc.virtualTerminals[7]] || 0) - vGnd;
      const vTrig = (prevState.vNodes[vc.virtualTerminals[1]] || 0) - vGnd;
      const vReset = (prevState.vNodes[vc.virtualTerminals[3]] || 0) - vGnd;
      const vCtrl = (prevState.vNodes[vc.virtualTerminals[4]] || 0) - vGnd;
      const vThres = (prevState.vNodes[vc.virtualTerminals[5]] || 0) - vGnd;

      let q = prevState.ic555[vc.id];
      if (vVcc < 2.0 || vReset < 0.7) {
        q = 0;
      } else {
        const vTrigRef = vCtrl / 2;
        if (vTrig < vTrigRef) q = 1;
        else if (vThres > vCtrl) q = 0;
      }
      
      prevState.ic555[vc.id] = q;
    } else if (vc.type === 'PLC') {
      if (!prevState.plcData[vc.id]) prevState.plcData[vc.id] = { out0: 0, out1: 0, fn0: null, fn1: null, prog0: null, prog1: null };
      
      if (prevState.plcData[vc.id].prog0 !== vc.props.prog0) {
         prevState.plcData[vc.id].prog0 = vc.props.prog0;
         prevState.plcData[vc.id].fn0 = compilePLC(vc.props.prog0);
      }
      if (prevState.plcData[vc.id].prog1 !== vc.props.prog1) {
         prevState.plcData[vc.id].prog1 = vc.props.prog1;
         prevState.plcData[vc.id].fn1 = compilePLC(vc.props.prog1);
      }

      const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
      const logicHigh = vVcc > 2.5 ? vVcc * 0.5 : 2.5; 
      const I0 = ((prevState.vNodes[vc.virtualTerminals[2]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0)) > logicHigh;
      const I1 = ((prevState.vNodes[vc.virtualTerminals[3]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0)) > logicHigh;

      prevState.plcData[vc.id].out0 = prevState.plcData[vc.id].fn0(I0, I1) ? 1 : 0;
      prevState.plcData[vc.id].out1 = prevState.plcData[vc.id].fn1(I0, I1) ? 1 : 0;
    } else if (vc.type === 'SHIFT_REGISTER') {
      if (!prevState.shiftRegisterData[vc.id]) {
        prevState.shiftRegisterData[vc.id] = { bits: [0,0,0,0], lastClk: 0 };
      }
      
      const vGnd = prevState.vNodes[vc.virtualTerminals[1]] || 0;
      const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - vGnd;
      const vClk = (prevState.vNodes[vc.virtualTerminals[3]] || 0) - vGnd;
      const vData = (prevState.vNodes[vc.virtualTerminals[2]] || 0) - vGnd;

      const logicHigh = vVcc > 2.5 ? vVcc * 0.5 : 2.5;
      const lastClkState = prevState.shiftRegisterData[vc.id].lastClk;

      if (lastClkState < logicHigh * 0.5 && vClk >= logicHigh) {
        const currentBits = prevState.shiftRegisterData[vc.id].bits;
        prevState.shiftRegisterData[vc.id].bits = [vData >= logicHigh ? 1 : 0, ...currentBits.slice(0, 3)];
      }
      prevState.shiftRegisterData[vc.id].lastClk = vClk;
    } else if (vc.type === 'LATCH') {
      if (!prevState.latchData[vc.id]) {
        prevState.latchData[vc.id] = { bits: [0,0,0,0] };
      }
      
      const vGnd = prevState.vNodes[vc.virtualTerminals[1]] || 0;
      const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - vGnd;
      const vClk = (prevState.vNodes[vc.virtualTerminals[6]] || 0) - vGnd;

      const logicHigh = vVcc > 2.5 ? vVcc * 0.5 : 2.5;

      if (vClk >= logicHigh) { // Latch is transparent when CLK is high
        const newBits = [];
        for (let i = 0; i < 4; i++) {
          const vD = (prevState.vNodes[vc.virtualTerminals[2 + i]] || 0) - vGnd;
          newBits.push(vD >= logicHigh ? 1 : 0);
        }
        prevState.latchData[vc.id].bits = newBits;
      }
    }
  });

  // Iterative solver
  for (let iter = 0; iter < 10; iter++) {
    let resistors = [];
    let vSources = [];
    let iSources = []; 
    let cccs = [];     
    let vcvs = [];
    let transformers = [];

    wires.forEach(w => {
      const n1 = tNodes[`${w.from.compId}-${w.from.termIdx}`];
      const n2 = tNodes[`${w.to.compId}-${w.to.termIdx}`];
      if(n1 !== undefined && n2 !== undefined) {
        if (burnedStates[w.id]) {
          resistors.push({ n1, n2, R: 1e9, id: w.id, isWire: true });
        } else {
          resistors.push({ n1, n2, R: 1e-3, id: w.id, isWire: true });
        }
      }
    });

    expandedComponents.forEach(vc => {
      if (vc.type === 'GROUND') return;

      const baseId = vc.id.split('_')[0];
      const n0 = tNodes[vc.virtualTerminals[0]];
      const n1 = tNodes[vc.virtualTerminals[1]];
      const n2 = vc.virtualTerminals[2] !== undefined ? tNodes[vc.virtualTerminals[2]] : null;

      if (burnedStates[baseId]) {
        if (vc.type === 'TRANSFORMER') {
          const nS1 = tNodes[vc.virtualTerminals[2]];
          const nS2 = tNodes[vc.virtualTerminals[3]];
          if (n0 !== undefined && n1 !== undefined) resistors.push({ n1: n0, n2: n1, R: 1e9, id: vc.id + "_burnP" });
          if (nS1 !== undefined && nS2 !== undefined) resistors.push({ n1: nS1, n2: nS2, R: 1e9, id: vc.id + "_burnS" });
        } else {
          // Treat N1 as default fail-safe pin for standard 2+ pins including RAM.
          if (n0 !== undefined && n1 !== undefined) resistors.push({ n1: n0, n2: n1, R: 1e9, id: vc.id + "_burn1" });
          if (n1 !== undefined && n2 !== undefined && n2 !== null && vc.type !== 'RAM' && vc.type !== 'TIMER555') resistors.push({ n1: n1, n2: n2, R: 1e9, id: vc.id + "_burn2" });
        }
        return;
      }

      if (vc.type === 'BATTERY') {
        vSources.push({ nPos: n0, nNeg: n1, V: vc.props.voltage || 0, Rs: 0.01, id: vc.id });
      } else if (vc.type === 'CAMERA') {
        const nVcc = tNodes[vc.virtualTerminals[0]];
        const nGnd = tNodes[vc.virtualTerminals[1]];
        if(nVcc !== undefined && nGnd !== undefined) resistors.push({ n1: nVcc, n2: nGnd, R: 1000, id: vc.id });
      } else if (vc.type === 'AC_SOURCE') {
        const t = tick * dt;
        const freq = vc.props.frequency !== undefined ? vc.props.frequency : 1;
        const V = (vc.props.voltage || 12) * Math.sin(2 * Math.PI * freq * t);
        vSources.push({ nPos: n0, nNeg: n1, V: V, Rs: 0.01, id: vc.id });
      } else if (vc.type === 'PWM') {
        const freq = vc.props.frequency !== undefined ? vc.props.frequency : 1;
        const duty = vc.props.dutyCycle !== undefined ? vc.props.dutyCycle : 50;
        let V = 0;
        if (freq >= 20) {
          V = (vc.props.voltage || 5) * (duty / 100); // Analog average
        } else {
          const t = tick * dt;
          const period = 1 / Math.max(0.001, freq);
          const t_mod = t % period;
          V = (t_mod < period * (duty / 100)) ? (vc.props.voltage || 5) : 0;
        }
        vSources.push({ nPos: n0, nNeg: n1, V: V, Rs: 0.01, id: vc.id });
      } else if (vc.type === 'OSCILLATOR') {
        const t = tick * dt;
        const freq = vc.props.frequency !== undefined ? vc.props.frequency : 1;
        const amp = vc.props.voltage !== undefined ? vc.props.voltage : 5;
        const offset = vc.props.offset || 0;
        const period = 1 / Math.max(0.001, freq);
        const phase = (t % period) / period; 

        let V = offset;
        const wave = vc.props.waveform || 'SINE';
        if (wave === 'SINE') V += amp * Math.sin(2 * Math.PI * phase);
        else if (wave === 'SQUARE') V += phase < 0.5 ? amp : -amp;
        else if (wave === 'TRIANGLE') {
          if (phase < 0.25) V += amp * (phase / 0.25);
          else if (phase < 0.75) V += amp * (1 - 2 * (phase - 0.25) / 0.5);
          else V += amp * (-1 + (phase - 0.75) / 0.25);
        } else if (wave === 'SAW') V += amp * (2 * phase - 1);
        
        vSources.push({ nPos: n0, nNeg: n1, V: V, Rs: 0.01, id: vc.id });
      } else if (vc.type === 'RESISTOR' || vc.type === 'MOTOR' || vc.type === 'PROPELLER' || vc.type === 'WHEEL') {
        const rVal = vc.props.resistance !== undefined ? vc.props.resistance : (['MOTOR', 'PROPELLER', 'WHEEL'].includes(vc.type) ? 10 : 1000);
        resistors.push({ n1: n0, n2: n1, R: Math.max(1e-3, rVal), id: vc.id });
      } else if (vc.type === 'CAPACITOR') {
        const C = Math.max(1e-12, vc.props.capacitance !== undefined ? vc.props.capacitance : 0.0001);
        const req = dt / C;
        resistors.push({ n1: n0, n2: n1, R: req, id: vc.id });
        const vPrev = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
        const ieq = (C / dt) * vPrev;
        iSources.push({ nFrom: n1, nTo: n0, I: ieq });
      } else if (vc.type === 'INDUCTOR') {
        const L = Math.max(1e-9, vc.props.inductance !== undefined ? vc.props.inductance : 0.01);
        const req = L / dt;
        resistors.push({ n1: n0, n2: n1, R: req, id: vc.id });
        const ieq = prevState.branchI[vc.id] || 0;
        iSources.push({ nFrom: n0, nTo: n1, I: ieq });
      } else if (vc.type === 'POTENTIOMETER') {
        const pos = Math.max(0, Math.min(100, vc.props.position || 0)) / 100;
        const rBase = Math.max(1e-3, vc.props.resistance !== undefined ? vc.props.resistance : 10000);
        resistors.push({ n1: n0, n2: n2, R: Math.max(1e-3, rBase * pos), id: vc.id + '_R1' });
        resistors.push({ n1: n2, n2: n1, R: Math.max(1e-3, rBase * (1 - pos)), id: vc.id + '_R2' });
      } else if (vc.type === 'JOYSTICK') {
        const xPos = Math.max(0, Math.min(100, vc.props.xPos !== undefined ? vc.props.xPos : 50)) / 100;
        const yPos = Math.max(0, Math.min(100, vc.props.yPos !== undefined ? vc.props.yPos : 50)) / 100;
        const rBase = Math.max(1e-3, vc.props.resistance !== undefined ? vc.props.resistance : 10000);
        
        const nXa = tNodes[vc.virtualTerminals[0]];
        const nXw = tNodes[vc.virtualTerminals[1]];
        const nXb = tNodes[vc.virtualTerminals[2]];
        const nYa = tNodes[vc.virtualTerminals[3]];
        const nYw = tNodes[vc.virtualTerminals[4]];
        const nYb = tNodes[vc.virtualTerminals[5]];

        if (nXa !== undefined && nXw !== undefined) resistors.push({ n1: nXa, n2: nXw, R: Math.max(1e-3, rBase * xPos), id: vc.id + '_RX1' });
        if (nXw !== undefined && nXb !== undefined) resistors.push({ n1: nXw, n2: nXb, R: Math.max(1e-3, rBase * (1 - xPos)), id: vc.id + '_RX2' });
        
        if (nYa !== undefined && nYw !== undefined) resistors.push({ n1: nYa, n2: nYw, R: Math.max(1e-3, rBase * yPos), id: vc.id + '_RY1' });
        if (nYw !== undefined && nYb !== undefined) resistors.push({ n1: nYw, n2: nYb, R: Math.max(1e-3, rBase * (1 - yPos)), id: vc.id + '_RY2' });
      } else if (vc.type === 'SWITCH') {
        resistors.push({ n1: n0, n2: n1, R: vc.props.isOpen ? 1e9 : 1e-3, id: vc.id });
      } else if (vc.type === 'PUSH_BUTTON') {
        resistors.push({ n1: n0, n2: n1, R: vc.props.isPressed ? 1e-3 : 1e9, id: vc.id });
      } else if (vc.type === 'LED' || vc.type === 'DIODE') {
        if (diodeStates[vc.id]) {
          vSources.push({ nPos: n0, nNeg: n1, V: vc.props.forwardVoltage || (vc.type === 'LED' ? 2 : 0.7), Rs: 2.0, id: vc.id });
        } else {
          resistors.push({ n1: n0, n2: n1, R: 1e9, id: vc.id });
        }
      } else if (vc.type === 'TRANSFORMER') {
        transformers.push({
          nP1: n0, nP2: n1,
          nS1: tNodes[vc.virtualTerminals[2]], nS2: tNodes[vc.virtualTerminals[3]],
          L1: Math.max(1e-9, vc.props.primaryL !== undefined ? vc.props.primaryL : 1),
          L2: Math.max(1e-9, vc.props.secondaryL !== undefined ? vc.props.secondaryL : 1),
          K: Math.max(0, Math.min(0.999, vc.props.coupling !== undefined ? vc.props.coupling : 0.99)),
          id: vc.id
        });
      } else if (vc.type === 'RAM') {
        const nVcc = tNodes[vc.virtualTerminals[0]];
        const nGnd = tNodes[vc.virtualTerminals[1]];
        const nA0 = tNodes[vc.virtualTerminals[2]];
        const nA1 = tNodes[vc.virtualTerminals[3]];
        const nDin = tNodes[vc.virtualTerminals[4]];
        const nWe = tNodes[vc.virtualTerminals[5]];
        const nOut = tNodes[vc.virtualTerminals[6]];

        if(nVcc !== undefined && nGnd !== undefined) resistors.push({ n1: nVcc, n2: nGnd, R: 10000, id: vc.id + "_VCC" });
        if(nA0 !== undefined && nGnd !== undefined) resistors.push({ n1: nA0, n2: nGnd, R: 1e6, id: vc.id + "_RA0" });
        if(nA1 !== undefined && nGnd !== undefined) resistors.push({ n1: nA1, n2: nGnd, R: 1e6, id: vc.id + "_RA1" });
        if(nDin !== undefined && nGnd !== undefined) resistors.push({ n1: nDin, n2: nGnd, R: 1e6, id: vc.id + "_RDIN" });
        if(nWe !== undefined && nGnd !== undefined) resistors.push({ n1: nWe, n2: nGnd, R: 1e6, id: vc.id + "_RWE" });

        const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
        const vA0 = (prevState.vNodes[vc.virtualTerminals[2]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
        const vA1 = (prevState.vNodes[vc.virtualTerminals[3]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
        const logicHigh = vVcc > 2.5 ? vVcc * 0.5 : 2.5; 
        const addr = (vA1 > logicHigh ? 2 : 0) + (vA0 > logicHigh ? 1 : 0);
        const outBit = prevState.ramData[vc.id][addr] || 0;
        const vOutTarget = outBit === 1 ? (vVcc > 0 ? vVcc : 5) : 0;
        vSources.push({ nPos: nOut, nNeg: nGnd, V: vOutTarget, Rs: 50, id: vc.id + "_OUT" });
      } else if (vc.type === 'TIMER555') {
        const nGnd = tNodes[vc.virtualTerminals[0]];
        const nTrig = tNodes[vc.virtualTerminals[1]];
        const nOut = tNodes[vc.virtualTerminals[2]];
        const nReset = tNodes[vc.virtualTerminals[3]];
        const nCtrl = tNodes[vc.virtualTerminals[4]];
        const nThres = tNodes[vc.virtualTerminals[5]];
        const nDisch = tNodes[vc.virtualTerminals[6]];
        const nVcc = tNodes[vc.virtualTerminals[7]];

        if (nVcc !== undefined && nCtrl !== undefined) resistors.push({ n1: nVcc, n2: nCtrl, R: 5000, id: vc.id + "_R1" });
        if (nCtrl !== undefined && nGnd !== undefined) resistors.push({ n1: nCtrl, n2: nGnd, R: 10000, id: vc.id + "_R2" });

        if (nTrig !== undefined && nGnd !== undefined) resistors.push({ n1: nTrig, n2: nGnd, R: 1e7, id: vc.id + "_RTrig" });
        if (nThres !== undefined && nGnd !== undefined) resistors.push({ n1: nThres, n2: nGnd, R: 1e7, id: vc.id + "_RThres" });
        if (nReset !== undefined && nGnd !== undefined) resistors.push({ n1: nReset, n2: nGnd, R: 1e7, id: vc.id + "_RReset" });
        if (nVcc !== undefined && nGnd !== undefined) resistors.push({ n1: nVcc, n2: nGnd, R: 5000, id: vc.id + "_RVcc" });

        const q = prevState.ic555[vc.id] || 0;
        const vVccVal = Math.max(0, (prevState.vNodes[vc.virtualTerminals[7]] || 0) - (prevState.vNodes[vc.virtualTerminals[0]] || 0));
        const vOutTarget = q === 1 ? Math.max(0.1, vVccVal - 1.2) : 0.1;
        vSources.push({ nPos: nOut, nNeg: nGnd, V: vOutTarget, Rs: 20, id: vc.id + "_OUT" });

        const rDisch = q === 1 ? 1e9 : 10;
        if (nDisch !== undefined && nGnd !== undefined) resistors.push({ n1: nDisch, n2: nGnd, R: rDisch, id: vc.id + "_RDisch" });
      } else if (vc.type === 'OPAMP') {
        const nPlus = tNodes[vc.virtualTerminals[0]];
        const nMinus = tNodes[vc.virtualTerminals[1]];
        const nOut = tNodes[vc.virtualTerminals[2]];
        
        if (nPlus !== undefined) resistors.push({ n1: nPlus, n2: 0, R: 1e9, id: vc.id + "_RinP" });
        if (nMinus !== undefined) resistors.push({ n1: nMinus, n2: 0, R: 1e9, id: vc.id + "_RinM" });
        
        const vVcc = nodeVoltagesMap[vc.virtualTerminals[3]] || 15;
        const vVee = nodeVoltagesMap[vc.virtualTerminals[4]] || -15;
        const gain = vc.props.gain || 100000;
        const vPlusVal = nodeVoltagesMap[vc.virtualTerminals[0]] || 0;
        const vMinusVal = nodeVoltagesMap[vc.virtualTerminals[1]] || 0;
        const idealOut = (vPlusVal - vMinusVal) * gain;

        if (idealOut > vVcc - 1.0) vSources.push({ nPos: nOut, nNeg: undefined, V: vVcc - 1.0, Rs: 50, id: vc.id + "_OUT" });
        else if (idealOut < vVee + 1.0) vSources.push({ nPos: nOut, nNeg: undefined, V: vVee + 1.0, Rs: 50, id: vc.id + "_OUT" });
        else vcvs.push({ nPos: nOut, nNeg: undefined, nCtrlPlus: nPlus, nCtrlMinus: nMinus, gain: gain, Rs: 50, id: vc.id + "_OUT" });
      } else if (vc.type === 'COMPARATOR') {
        const nPlus = tNodes[vc.virtualTerminals[0]];
        const nMinus = tNodes[vc.virtualTerminals[1]];
        const nOut = tNodes[vc.virtualTerminals[2]];
        
        if (nPlus !== undefined) resistors.push({ n1: nPlus, n2: 0, R: 1e9, id: vc.id + "_RinP" });
        if (nMinus !== undefined) resistors.push({ n1: nMinus, n2: 0, R: 1e9, id: vc.id + "_RinM" });
        
        const vPlusVal = prevState.vNodes[vc.virtualTerminals[0]] || 0;
        const vMinusVal = prevState.vNodes[vc.virtualTerminals[1]] || 0;
        const vVccVal = prevState.vNodes[vc.virtualTerminals[3]] || 0;
        const vGndVal = prevState.vNodes[vc.virtualTerminals[4]] || 0;

        const vOutTarget = (vPlusVal > vMinusVal) ? vVccVal : vGndVal;
        vSources.push({ nPos: nOut, nNeg: undefined, V: vOutTarget, Rs: 50, id: vc.id + "_OUT" });
      } else if (vc.type === 'SEVEN_SEGMENT') {
        const nGnd = tNodes[vc.virtualTerminals[7]];
        const fv = vc.props.forwardVoltage || 2.0;

        ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach((seg, i) => {
            const nSeg = tNodes[vc.virtualTerminals[i]];
            const segId = `${vc.id}_${seg}`;
            if (diodeStates[segId] === undefined) diodeStates[segId] = false;

            if (diodeStates[segId]) {
                vSources.push({ nPos: nSeg, nNeg: nGnd, V: fv, Rs: 10.0, id: segId });
            } else {
                resistors.push({ n1: nSeg, n2: nGnd, R: 1e9, id: segId });
            }
        });
      } else if (vc.type === 'PLC') {
        const nVcc = tNodes[vc.virtualTerminals[0]];
        const nGnd = tNodes[vc.virtualTerminals[1]];
        const nIn0 = tNodes[vc.virtualTerminals[2]];
        const nIn1 = tNodes[vc.virtualTerminals[3]];
        const nOut0 = tNodes[vc.virtualTerminals[4]];
        const nOut1 = tNodes[vc.virtualTerminals[5]];

        if(nVcc !== undefined && nGnd !== undefined) resistors.push({ n1: nVcc, n2: nGnd, R: 10000, id: vc.id + "_VCC" });
        if(nIn0 !== undefined && nGnd !== undefined) resistors.push({ n1: nIn0, n2: nGnd, R: 1e6, id: vc.id + "_RIN0" });
        if(nIn1 !== undefined && nGnd !== undefined) resistors.push({ n1: nIn1, n2: nGnd, R: 1e6, id: vc.id + "_RIN1" });

        const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);

        const vOut0Target = (prevState.plcData[vc.id]?.out0 === 1) ? (vVcc > 0 ? vVcc : 5) : 0;
        const vOut1Target = (prevState.plcData[vc.id]?.out1 === 1) ? (vVcc > 0 ? vVcc : 5) : 0;

        vSources.push({ nPos: nOut0, nNeg: nGnd, V: vOut0Target, Rs: 50, id: vc.id + "_OUT0" });
        vSources.push({ nPos: nOut1, nNeg: nGnd, V: vOut1Target, Rs: 50, id: vc.id + "_OUT1" });
      } else if (vc.type === 'GYROSCOPE') {
        const nVcc = tNodes[vc.virtualTerminals[0]];
        const nGnd = tNodes[vc.virtualTerminals[1]];
        const nXp = tNodes[vc.virtualTerminals[2]];
        const nXn = tNodes[vc.virtualTerminals[3]];
        const nYp = tNodes[vc.virtualTerminals[4]];
        const nYn = tNodes[vc.virtualTerminals[5]];

        if(nVcc !== undefined && nGnd !== undefined) resistors.push({ n1: nVcc, n2: nGnd, R: 10000, id: vc.id + "_VCC" });

        const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
        const outV = vVcc > 0 ? vVcc : 5;

        const pitch = vc.props.pitch || 0;
        const roll = vc.props.roll || 0;
        const threshold = 5;

        if(nXp !== undefined && nGnd !== undefined) vSources.push({ nPos: nXp, nNeg: nGnd, V: pitch > threshold ? outV : 0, Rs: 50, id: vc.id + "_XP" });
        if(nXn !== undefined && nGnd !== undefined) vSources.push({ nPos: nXn, nNeg: nGnd, V: pitch < -threshold ? outV : 0, Rs: 50, id: vc.id + "_XN" });
        if(nYp !== undefined && nGnd !== undefined) vSources.push({ nPos: nYp, nNeg: nGnd, V: roll > threshold ? outV : 0, Rs: 50, id: vc.id + "_YP" });
        if(nYn !== undefined && nGnd !== undefined) vSources.push({ nPos: nYn, nNeg: nGnd, V: roll < -threshold ? outV : 0, Rs: 50, id: vc.id + "_YN" });
      } else if (vc.type === 'BUCK_CONVERTER') {
        const nIn = tNodes[vc.virtualTerminals[0]];
        const nGnd = tNodes[vc.virtualTerminals[1]];
        const nOut = tNodes[vc.virtualTerminals[2]];

        if(nIn !== undefined && nGnd !== undefined) resistors.push({ n1: nIn, n2: nGnd, R: 10000, id: vc.id + "_RIN" });

        const vIn = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
        const target = vc.props.targetVoltage !== undefined ? vc.props.targetVoltage : 5;
        let vOutTarget = 0;
        if (vIn > target + 0.5) {
          vOutTarget = target;
        } else if (vIn > 0.5) {
          vOutTarget = vIn - 0.5; // Dropout voltage
        }

        vSources.push({ nPos: nOut, nNeg: nGnd, V: vOutTarget, Rs: 0.1, id: vc.id + "_OUT" });
      } else if (vc.type === 'SHIFT_REGISTER') {
        const nVcc = tNodes[vc.virtualTerminals[0]];
        const nGnd = tNodes[vc.virtualTerminals[1]];
        const nData = tNodes[vc.virtualTerminals[2]];
        const nClk = tNodes[vc.virtualTerminals[3]];
        
        if(nVcc !== undefined && nGnd !== undefined) resistors.push({ n1: nVcc, n2: nGnd, R: 10000, id: vc.id + "_VCC" });
        if(nData !== undefined && nGnd !== undefined) resistors.push({ n1: nData, n2: nGnd, R: 1e6, id: vc.id + "_RDATA" });
        if(nClk !== undefined && nGnd !== undefined) resistors.push({ n1: nClk, n2: nGnd, R: 1e6, id: vc.id + "_RCLK" });

        const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
        const bits = prevState.shiftRegisterData[vc.id]?.bits || [0,0,0,0];

        bits.forEach((bit, i) => {
            const nOut = tNodes[vc.virtualTerminals[4 + i]];
            const vOutTarget = (bit === 1) ? (vVcc > 0 ? vVcc : 5) : 0;
            vSources.push({ nPos: nOut, nNeg: nGnd, V: vOutTarget, Rs: 50, id: `${vc.id}_OUT${i}` });
        });
      } else if (vc.type === 'LATCH') {
        const nVcc = tNodes[vc.virtualTerminals[0]];
        const nGnd = tNodes[vc.virtualTerminals[1]];
        const nClk = tNodes[vc.virtualTerminals[6]];
        
        if(nVcc !== undefined && nGnd !== undefined) resistors.push({ n1: nVcc, n2: nGnd, R: 10000, id: vc.id + "_VCC" });
        if(nClk !== undefined && nGnd !== undefined) resistors.push({ n1: nClk, n2: nGnd, R: 1e6, id: vc.id + "_RCLK" });

        const vVcc = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
        const bits = prevState.latchData[vc.id]?.bits || [0,0,0,0];

        for (let i = 0; i < 4; i++) {
            const nD = tNodes[vc.virtualTerminals[2 + i]];
            if(nD !== undefined && nGnd !== undefined) resistors.push({ n1: nD, n2: nGnd, R: 1e6, id: `${vc.id}_RD${i}` });
            
            const nOut = tNodes[vc.virtualTerminals[7 + i]];
            const vOutTarget = (bits[i] === 1) ? (vVcc > 0 ? vVcc : 5) : 0;
            vSources.push({ nPos: nOut, nNeg: nGnd, V: vOutTarget, Rs: 50, id: `${vc.id}_OUT${i}` });
        }
      } else if (vc.type === 'NPN') {
        const state = diodeStates[vc.id];
        const beta = vc.props.beta || 100;
        if (state === 'ACTIVE') {
          vSources.push({ nPos: n0, nNeg: n2, V: 0.7, Rs: 0.5, id: vc.id + "_VBE" }); 
          cccs.push({ nFrom: n1, nTo: n2, vSourceId: vc.id + "_VBE", beta: beta });
          resistors.push({ n1: n1, n2: n2, R: 1e6, id: vc.id + "_ROUT" }); 
        } else if (state === 'SATURATED') {
          vSources.push({ nPos: n0, nNeg: n2, V: 0.7, Rs: 0.5, id: vc.id + "_VBE" }); 
          vSources.push({ nPos: n1, nNeg: n2, V: 0.2, Rs: 0.1, id: vc.id + "_VCE" }); 
        } else { 
          resistors.push({ n1: n0, n2: n2, R: 1e9, id: vc.id + "_RBE" });
          resistors.push({ n1: n1, n2: n2, R: 1e9, id: vc.id + "_RCE" });
        }
      } else if (vc.type === 'PNP') {
        const state = diodeStates[vc.id];
        const beta = vc.props.beta || 100;
        if (state === 'ACTIVE') {
          vSources.push({ nPos: n2, nNeg: n0, V: 0.7, Rs: 0.5, id: vc.id + "_VEB" }); 
          cccs.push({ nFrom: n2, nTo: n1, vSourceId: vc.id + "_VEB", beta: beta });
          resistors.push({ n1: n2, n2: n1, R: 1e6, id: vc.id + "_ROUT" }); 
        } else if (state === 'SATURATED') {
          vSources.push({ nPos: n2, nNeg: n0, V: 0.7, Rs: 0.5, id: vc.id + "_VEB" }); 
          vSources.push({ nPos: n2, nNeg: n1, V: 0.2, Rs: 0.1, id: vc.id + "_VEC" }); 
        } else { 
          resistors.push({ n1: n2, n2: n0, R: 1e9, id: vc.id + "_REB" });
          resistors.push({ n1: n2, n2: n1, R: 1e9, id: vc.id + "_REC" });
        }
      }
    });

    const M_v = vSources.length;
    const M_vcvs = vcvs.length;
    const M_t = transformers.length;
    const size = (N - 1) + M_v + M_vcvs + 2 * M_t;
    if (size <= 0) break; 
    
    let A = Array(size).fill(0).map(() => Array(size).fill(0));
    let b = Array(size).fill(0);

    for (let i = 0; i < N - 1; i++) A[i][i] = 1e-9; 

    resistors.forEach(({n1, n2, R}) => {
      const g = 1 / Math.max(R, 1e-6);
      if (n1 !== undefined && n1 > 0) A[n1-1][n1-1] += g;
      if (n2 !== undefined && n2 > 0) A[n2-1][n2-1] += g;
      if (n1 !== undefined && n1 > 0 && n2 !== undefined && n2 > 0) {
        A[n1-1][n2-1] -= g;
        A[n2-1][n1-1] -= g;
      }
    });

    vSources.forEach((vs, m) => {
      const idx = (N - 1) + m;
      if (vs.nPos !== undefined && vs.nPos > 0) { A[vs.nPos-1][idx] += 1; A[idx][vs.nPos-1] += 1; }
      if (vs.nNeg !== undefined && vs.nNeg > 0) { A[vs.nNeg-1][idx] -= 1; A[idx][vs.nNeg-1] -= 1; }
      A[idx][idx] = -(vs.Rs || 1e-4);
      b[idx] = vs.V;
    });

    vcvs.forEach((vs, m) => {
      const idx = (N - 1) + M_v + m;
      if (vs.nPos !== undefined && vs.nPos > 0) { A[vs.nPos-1][idx] += 1; A[idx][vs.nPos-1] += 1; }
      if (vs.nNeg !== undefined && vs.nNeg > 0) { A[vs.nNeg-1][idx] -= 1; A[idx][vs.nNeg-1] -= 1; }
      if (vs.nCtrlPlus !== undefined && vs.nCtrlPlus > 0) { A[idx][vs.nCtrlPlus-1] -= vs.gain; }
      if (vs.nCtrlMinus !== undefined && vs.nCtrlMinus > 0) { A[idx][vs.nCtrlMinus-1] += vs.gain; }
      A[idx][idx] = -(vs.Rs || 1e-4);
      b[idx] = 0;
    });

    transformers.forEach((tr, t) => {
      const idx1 = (N - 1) + M_v + M_vcvs + 2 * t;
      const idx2 = (N - 1) + M_v + M_vcvs + 2 * t + 1;

      const R11 = tr.L1 / dt;
      const R22 = tr.L2 / dt;
      const M_mut = tr.K * Math.sqrt(tr.L1 * tr.L2);
      const R12 = M_mut / dt;

      const i1_prev = prevState.branchI[`${tr.id}_1`] || 0;
      const i2_prev = prevState.branchI[`${tr.id}_2`] || 0;

      const V1eq = R11 * i1_prev + R12 * i2_prev;
      const V2eq = R12 * i1_prev + R22 * i2_prev;

      if (tr.nP1 !== undefined && tr.nP1 > 0) { A[tr.nP1 - 1][idx1] += 1; A[idx1][tr.nP1 - 1] += 1; }
      if (tr.nP2 !== undefined && tr.nP2 > 0) { A[tr.nP2 - 1][idx1] -= 1; A[idx1][tr.nP2 - 1] -= 1; }
      
      if (tr.nS1 !== undefined && tr.nS1 > 0) { A[tr.nS1 - 1][idx2] += 1; A[idx2][tr.nS1 - 1] += 1; }
      if (tr.nS2 !== undefined && tr.nS2 > 0) { A[tr.nS2 - 1][idx2] -= 1; A[idx2][tr.nS2 - 1] -= 1; }

      A[idx1][idx1] = -R11;
      A[idx1][idx2] = -R12;
      b[idx1] = -V1eq;

      A[idx2][idx2] = -R22;
      A[idx2][idx1] = -R12;
      b[idx2] = -V2eq;
    });

    cccs.forEach(src => {
        const vIdx = vSources.findIndex(vs => vs.id === src.vSourceId);
        if (vIdx !== -1) {
            const col = (N - 1) + vIdx;
            if (src.nFrom !== undefined && src.nFrom > 0) A[src.nFrom - 1][col] += src.beta;
            if (src.nTo !== undefined && src.nTo > 0) A[src.nTo - 1][col] -= src.beta;
        }
    });

    iSources.forEach(is => {
      if (is.nFrom !== undefined && is.nFrom > 0) b[is.nFrom - 1] -= is.I;
      if (is.nTo !== undefined && is.nTo > 0) b[is.nTo - 1] += is.I;
    });

    const n = size;
    for (let i = 0; i < n; i++) {
      let maxEl = Math.abs(A[i][i]);
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; }
      }
      if (maxEl < 1e-12) continue; 

      let tmp = A[maxRow]; A[maxRow] = A[i]; A[i] = tmp;
      let tmpB = b[maxRow]; b[maxRow] = b[i]; b[i] = tmpB;

      for (let k = i + 1; k < n; k++) {
        let c = -A[k][i] / A[i][i];
        for (let j = i; j < n; j++) {
          if (i === j) A[k][j] = 0;
          else A[k][j] += c * A[i][j];
        }
        b[k] += c * b[i];
      }
    }

    let x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      if (Math.abs(A[i][i]) > 1e-12) {
        x[i] = b[i] / A[i][i];
        for (let k = i - 1; k >= 0; k--) b[k] -= A[k][i] * x[i];
      }
    }

    let vNode = new Array(N).fill(0);
    for (let i = 1; i < N; i++) vNode[i] = x[i-1];

    nodeVoltagesMap = {};
    Object.keys(tNodes).forEach(tid => {
      nodeVoltagesMap[tid] = vNode[tNodes[tid]];
    });

    let changed = false;
    expandedComponents.forEach(vc => {
      if (vc.type === 'LED' || vc.type === 'DIODE') {
        let currentState = diodeStates[vc.id];
        let nextState = currentState;
        
        if (!currentState) {
          const vDrop = (nodeVoltagesMap[vc.virtualTerminals[0]] || 0) - (nodeVoltagesMap[vc.virtualTerminals[1]] || 0);
          if (vDrop > (vc.props.forwardVoltage || (vc.type === 'LED' ? 2 : 0.7))) {
            nextState = true;
          }
        } else {
          const vIdx = vSources.findIndex(vs => vs.id === vc.id);
          if (vIdx !== -1) {
            const iD = x[(N - 1) + vIdx];
            if (iD < -1e-6) {
              nextState = false;
            }
          }
        }
        
        if (nextState !== currentState) { 
          diodeStates[vc.id] = nextState; 
          changed = true; 
        }
      } else if (vc.type === 'SEVEN_SEGMENT') {
        const nGnd = vc.virtualTerminals[7];
        const fv = vc.props.forwardVoltage || 2.0;
        ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach((seg, i) => {
            const segId = `${vc.id}_${seg}`;
            const nSeg = vc.virtualTerminals[i];
            let currentState = diodeStates[segId];
            let nextState = currentState;

            if (!currentState) {
                const vDrop = (nodeVoltagesMap[nSeg] || 0) - (nodeVoltagesMap[nGnd] || 0);
                if (vDrop > fv) nextState = true;
            } else {
                const vIdx = vSources.findIndex(vs => vs.id === segId);
                if (vIdx !== -1 && x[(N - 1) + vIdx] < -1e-6) nextState = false;
            }
            if (nextState !== currentState) diodeStates[segId] = nextState;
        });
        // No need to set changed=true for 7-seg as it's purely output and doesn't affect the matrix
      } else if (vc.type === 'NPN') {
        const state = diodeStates[vc.id];
        const vB = nodeVoltagesMap[vc.virtualTerminals[0]] || 0;
        const vC = nodeVoltagesMap[vc.virtualTerminals[1]] || 0;
        const vE = nodeVoltagesMap[vc.virtualTerminals[2]] || 0;
        const vBE = vB - vE;
        const vCE = vC - vE;

        let iB = 0;
        let iC = 0;
        if (state === 'ACTIVE' || state === 'SATURATED') {
            const vIdx = vSources.findIndex(vs => vs.id === vc.id + "_VBE");
            if (vIdx !== -1) iB = x[(N - 1) + vIdx];
        }
        if (state === 'SATURATED') {
            const vIdxC = vSources.findIndex(vs => vs.id === vc.id + "_VCE");
            if (vIdxC !== -1) iC = x[(N - 1) + vIdxC];
        } else if (state === 'ACTIVE') {
            iC = (vc.props.beta || 100) * iB;
        }

        let nextState = state;
        if (state === 'OFF') {
            if (vBE > 0.6) nextState = 'ACTIVE';
        } else if (state === 'ACTIVE') {
            if (iB < -1e-6) nextState = 'OFF';
            else if (vCE <= 0.2) nextState = 'SATURATED';
        } else if (state === 'SATURATED') {
            if (iB < -1e-6) nextState = 'OFF';
            else if (iC > (vc.props.beta || 100) * iB) nextState = 'ACTIVE';
        }

        if (nextState !== state) { diodeStates[vc.id] = nextState; changed = true; }
      } else if (vc.type === 'PNP') {
        const state = diodeStates[vc.id];
        const vB = nodeVoltagesMap[vc.virtualTerminals[0]] || 0;
        const vC = nodeVoltagesMap[vc.virtualTerminals[1]] || 0;
        const vE = nodeVoltagesMap[vc.virtualTerminals[2]] || 0;
        const vEB = vE - vB;
        const vEC = vE - vC;

        let iB = 0;
        let iC = 0;
        if (state === 'ACTIVE' || state === 'SATURATED') {
            const vIdx = vSources.findIndex(vs => vs.id === vc.id + "_VEB");
            if (vIdx !== -1) iB = x[(N - 1) + vIdx];
        }
        if (state === 'SATURATED') {
            const vIdxC = vSources.findIndex(vs => vs.id === vc.id + "_VEC");
            if (vIdxC !== -1) iC = x[(N - 1) + vIdxC];
        } else if (state === 'ACTIVE') {
            iC = (vc.props.beta || 100) * iB;
        }

        let nextState = state;
        if (state === 'OFF') {
            if (vEB > 0.6) nextState = 'ACTIVE';
        } else if (state === 'ACTIVE') {
            if (iB < -1e-6) nextState = 'OFF';
            else if (vEC <= 0.2) nextState = 'SATURATED';
        } else if (state === 'SATURATED') {
            if (iB < -1e-6) nextState = 'OFF';
            else if (iC > (vc.props.beta || 100) * iB) nextState = 'ACTIVE';
        }

        if (nextState !== state) { diodeStates[vc.id] = nextState; changed = true; }
      }
    });

    if (!changed || iter === 9) {
      branchCurrentsMap = {};
      wireCurrentsMap = {};
      activeMap = {};

      resistors.forEach(r => {
        const v1 = vNode[r.n1] || 0;
        const v2 = vNode[r.n2] || 0;
        const current = (v1 - v2) / r.R;
        if (r.isWire) {
          wireCurrentsMap[r.id] = current;
          if (Math.abs(current) > 1e-4) activeMap[r.id] = true;
        } else {
          branchCurrentsMap[r.id] = current;
          if (Math.abs(current) > 1e-4) activeMap[r.id.split('_')[0]] = true; 
        }
      });

      vSources.forEach((vs, m) => {
        const current = x[(N - 1) + m] || 0; 
        branchCurrentsMap[vs.id] = current;
        if (Math.abs(current) > 1e-4) activeMap[vs.id.split('_')[0]] = true;
      });
      
      vcvs.forEach((vs, m) => {
        const current = x[(N - 1) + M_v + m] || 0;
        branchCurrentsMap[vs.id] = current;
        if (Math.abs(current) > 1e-4) activeMap[vs.id.split('_')[0]] = true;
      });

      transformers.forEach((tr, t) => {
        const i1 = x[(N - 1) + M_v + M_vcvs + 2 * t] || 0;
        const i2 = x[(N - 1) + M_v + M_vcvs + 2 * t + 1] || 0;
        branchCurrentsMap[`${tr.id}_1`] = i1;
        branchCurrentsMap[`${tr.id}_2`] = i2;
        branchCurrentsMap[tr.id] = Math.max(Math.abs(i1), Math.abs(i2)); 
        prevState.branchI[`${tr.id}_1`] = i1;
        prevState.branchI[`${tr.id}_2`] = i2;
        if (Math.abs(i1) > 1e-5 || Math.abs(i2) > 1e-5) activeMap[tr.id.split('_')[0]] = true;
      });

      expandedComponents.forEach(vc => {
        if (vc.type === 'CAPACITOR') {
          const C = Math.max(1e-12, vc.props.capacitance !== undefined ? vc.props.capacitance : 0.0001);
          const req = dt / C;
          const v = (nodeVoltagesMap[vc.virtualTerminals[0]] || 0) - (nodeVoltagesMap[vc.virtualTerminals[1]] || 0);
          const vPrev = (prevState.vNodes[vc.virtualTerminals[0]] || 0) - (prevState.vNodes[vc.virtualTerminals[1]] || 0);
          const iActual = (v / req) - ((C / dt) * vPrev);
          branchCurrentsMap[vc.id] = iActual;
          prevState.branchI[vc.id] = iActual;
          if(Math.abs(iActual) > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'INDUCTOR') {
          const L = Math.max(1e-9, vc.props.inductance !== undefined ? vc.props.inductance : 0.01);
          const req = L / dt;
          const v = (nodeVoltagesMap[vc.virtualTerminals[0]] || 0) - (nodeVoltagesMap[vc.virtualTerminals[1]] || 0);
          const iActual = (v / req) + (prevState.branchI[vc.id] || 0);
          branchCurrentsMap[vc.id] = iActual;
          prevState.branchI[vc.id] = iActual;
          if(Math.abs(iActual) > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'NPN') {
          const state = diodeStates[vc.id];
          if (state === 'ACTIVE' || state === 'SATURATED') {
            const vIdx = vSources.findIndex(vs => vs.id === vc.id + "_VBE");
            const iB = vIdx !== -1 ? x[(N - 1) + vIdx] : 0;
            let iC = 0;
            if (state === 'ACTIVE') iC = iB * (vc.props.beta || 100);
            else {
              const vIdxC = vSources.findIndex(vs => vs.id === vc.id + "_VCE");
              if (vIdxC !== -1) iC = x[(N - 1) + vIdxC];
            }
            branchCurrentsMap[`${vc.id}_CE`] = iC;
            branchCurrentsMap[`${vc.id}_BE`] = iB;
            if (Math.abs(iC) > 1e-5 || Math.abs(iB) > 1e-5) activeMap[vc.id.split('_')[0]] = true;
          }
        } else if (vc.type === 'PNP') {
          const state = diodeStates[vc.id];
          if (state === 'ACTIVE' || state === 'SATURATED') {
            const vIdx = vSources.findIndex(vs => vs.id === vc.id + "_VEB");
            const iB = vIdx !== -1 ? x[(N - 1) + vIdx] : 0;
            let iC = 0;
            if (state === 'ACTIVE') iC = iB * (vc.props.beta || 100);
            else {
              const vIdxC = vSources.findIndex(vs => vs.id === vc.id + "_VEC");
              if (vIdxC !== -1) iC = x[(N - 1) + vIdxC];
            }
            branchCurrentsMap[`${vc.id}_EC`] = iC;
            branchCurrentsMap[`${vc.id}_EB`] = iB;
            if (Math.abs(iC) > 1e-5 || Math.abs(iB) > 1e-5) activeMap[vc.id.split('_')[0]] = true;
          }
        } else if (vc.type === 'RAM') {
          const vIdx = vSources.findIndex(vs => vs.id === vc.id + "_OUT");
          const iOut = vIdx !== -1 ? x[(N - 1) + vIdx] : 0;
          branchCurrentsMap[vc.id] = iOut;
          if (Math.abs(iOut) > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'TIMER555') {
          const vIdx = vSources.findIndex(vs => vs.id === vc.id + "_OUT");
          const iOut = vIdx !== -1 ? x[(N - 1) + vIdx] : 0;
          branchCurrentsMap[vc.id] = iOut;
          if (Math.abs(iOut) > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'SHIFT_REGISTER') {
            let totalCurrent = 0;
            for (let i = 0; i < 4; i++) {
                const vIdx = vSources.findIndex(vs => vs.id === `${vc.id}_OUT${i}`);
                const iOut = vIdx !== -1 ? x[(N - 1) + vIdx] : 0;
                branchCurrentsMap[`${vc.id}_OUT${i}`] = iOut;
                totalCurrent += Math.abs(iOut);
            }
            branchCurrentsMap[vc.id] = totalCurrent;
            if (totalCurrent > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'LATCH') {
            let totalCurrent = 0;
            for (let i = 0; i < 4; i++) {
                const vIdx = vSources.findIndex(vs => vs.id === `${vc.id}_OUT${i}`);
                const iOut = vIdx !== -1 ? x[(N - 1) + vIdx] : 0;
                branchCurrentsMap[`${vc.id}_OUT${i}`] = iOut;
                totalCurrent += Math.abs(iOut);
            }
            branchCurrentsMap[vc.id] = totalCurrent;
            if (totalCurrent > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'PLC') {
          const vIdx0 = vSources.findIndex(vs => vs.id === vc.id + "_OUT0");
          const vIdx1 = vSources.findIndex(vs => vs.id === vc.id + "_OUT1");
          const iOut0 = vIdx0 !== -1 ? x[(N - 1) + vIdx0] : 0;
          const iOut1 = vIdx1 !== -1 ? x[(N - 1) + vIdx1] : 0;
          branchCurrentsMap[`${vc.id}_OUT0`] = iOut0;
          branchCurrentsMap[`${vc.id}_OUT1`] = iOut1;
          branchCurrentsMap[vc.id] = Math.max(Math.abs(iOut0), Math.abs(iOut1));
          if (Math.abs(iOut0) > 1e-5 || Math.abs(iOut1) > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'GYROSCOPE') {
          let totalCurrent = 0;
          ["_XP", "_XN", "_YP", "_YN"].forEach(suf => {
             const vIdx = vSources.findIndex(vs => vs.id === vc.id + suf);
             const iOut = vIdx !== -1 ? x[(N - 1) + vIdx] : 0;
             branchCurrentsMap[vc.id + suf] = iOut;
             totalCurrent += Math.abs(iOut);
          });
          branchCurrentsMap[vc.id] = totalCurrent;
          if (totalCurrent > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'JOYSTICK') {
          const ix1 = branchCurrentsMap[`${vc.id}_RX1`] || 0;
          const ix2 = branchCurrentsMap[`${vc.id}_RX2`] || 0;
          const iy1 = branchCurrentsMap[`${vc.id}_RY1`] || 0;
          const iy2 = branchCurrentsMap[`${vc.id}_RY2`] || 0;
          branchCurrentsMap[vc.id] = Math.max(Math.abs(ix1), Math.abs(ix2), Math.abs(iy1), Math.abs(iy2));
          if (branchCurrentsMap[vc.id] > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        } else if (vc.type === 'BUCK_CONVERTER') {
          const vIdx = vSources.findIndex(vs => vs.id === vc.id + "_OUT");
          const iOut = vIdx !== -1 ? x[(N - 1) + vIdx] : 0;
          branchCurrentsMap[`${vc.id}_OUT`] = iOut;
          branchCurrentsMap[vc.id] = Math.abs(iOut);
          if (Math.abs(iOut) > 1e-5) activeMap[vc.id.split('_')[0]] = true;
        }
      });

      if (!prevState.sevenSegmentData) prevState.sevenSegmentData = {};
      validComponents.filter(c => c.type === 'SEVEN_SEGMENT').forEach(c => {
        if (!prevState.sevenSegmentData[c.id]) prevState.sevenSegmentData[c.id] = {};
        let totalCurrent = 0;
        ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(seg => {
            const segId = `${c.id}_${seg}`;
            const current = branchCurrentsMap[segId] || 0;
            totalCurrent += Math.abs(current);
            prevState.sevenSegmentData[c.id][seg] = current > 1e-4;
        });
        branchCurrentsMap[c.id] = totalCurrent;
        if (totalCurrent > 1e-5) activeMap[c.id] = true;
      });

      validComponents.forEach(c => {
        if (c.type === 'HBRIDGE') {
          const iQ1 = branchCurrentsMap[`${c.id}_Q1_EC`] || 0; 
          const iQ2 = branchCurrentsMap[`${c.id}_Q2_CE`] || 0; 
          const iQ3 = branchCurrentsMap[`${c.id}_Q3_EC`] || 0; 
          const iQ4 = branchCurrentsMap[`${c.id}_Q4_CE`] || 0; 
          
          branchCurrentsMap[`${c.id}_OUT1`] = iQ1 - iQ2;
          branchCurrentsMap[`${c.id}_OUT2`] = iQ3 - iQ4;

          if (Math.abs(iQ1 - iQ2) > 1e-5 || Math.abs(iQ3 - iQ4) > 1e-5) activeMap[c.id] = true;
        } else if (c.type === 'SERVO' || c.type === 'AERO_CONTROL_SURFACE') {
          const iVcc = branchCurrentsMap[`${c.id}_R_vcc`] || 0;
          const iSig = branchCurrentsMap[`${c.id}_R_sig`] || 0;
          branchCurrentsMap[c.id] = Math.max(Math.abs(iVcc), Math.abs(iSig));
          if (branchCurrentsMap[c.id] > 1e-5) activeMap[c.id] = true;
        }
      });

      prevState.vNodes = nodeVoltagesMap;
      break;
    }
  }

  // Burn Evaluation
  wires.forEach(w => {
    if (!burnedStates[w.id]) {
      const current = wireCurrentsMap[w.id] || 0;
      const maxI = w.props?.maxCurrent !== undefined ? w.props.maxCurrent : 5;
      if (Math.abs(current) > maxI) {
        burnedStates[w.id] = "MAX CURRENT EXCEEDED";
      }
    }
  });

  validComponents.forEach(c => {
    if (!burnedStates[c.id]) {
      const type = c.type;
      let isBurned = false;
      let burnReason = "OVERLOAD";
      let current = 0;
      if (type === 'NPN') current = branchCurrentsMap[`${c.id}_CE`] || 0;
      else if (type === 'PNP') current = branchCurrentsMap[`${c.id}_EC`] || 0;
      else if (type === 'HBRIDGE') current = Math.max(Math.abs(branchCurrentsMap[`${c.id}_OUT1`] || 0), Math.abs(branchCurrentsMap[`${c.id}_OUT2`] || 0));
      else if (type === 'SHIFT_REGISTER' || type === 'LATCH') {
        current = 0;
        for(let i=0; i<4; i++) current += Math.abs(branchCurrentsMap[`${c.id}_OUT${i}`] || 0);
      }
      else if (type === 'BUCK_CONVERTER') current = branchCurrentsMap[`${c.id}_OUT`] || 0;
      else current = branchCurrentsMap[c.id] || 0;

      const maxP = c.props?.maxPower !== undefined ? c.props.maxPower : 0.25;
      const maxI = c.props?.maxCurrent !== undefined ? c.props.maxCurrent : 1.0;
      const maxV = c.props?.maxVoltage !== undefined ? c.props.maxVoltage : 25.0;
      const rBase = Math.max(1e-3, c.props?.resistance !== undefined ? c.props.resistance : (['MOTOR', 'PROPELLER', 'WHEEL'].includes(type) ? 10 : 1000));
      
      if (type === 'RESISTOR') { if ((current * current * rBase) > maxP) { isBurned = true; burnReason = "MAX POWER EXCEEDED"; } }
      else if (type === 'LED' || type === 'DIODE') { if (Math.abs(current) > maxI) { isBurned = true; burnReason = "MAX CURRENT EXCEEDED"; } }
      else if (type === 'POTENTIOMETER') {
        const pos = Math.max(0, Math.min(100, c.props?.position || 0)) / 100;
        const i1 = branchCurrentsMap[`${c.id}_R1`] || 0;
        const i2 = branchCurrentsMap[`${c.id}_R2`] || 0;
        if ((i1 * i1 * (rBase * pos) + i2 * i2 * (rBase * (1 - pos))) > maxP) { isBurned = true; burnReason = "MAX POWER EXCEEDED"; }
      }
      else if (type === 'NPN' || type === 'PNP') {
        if (Math.abs(current) > maxI) { isBurned = true; burnReason = "MAX CURRENT EXCEEDED"; }
      }
      else if (['MOTOR', 'PROPELLER', 'WHEEL', 'HBRIDGE', 'INDUCTOR', 'BATTERY', 'AC_SOURCE', 'PWM', 'OSCILLATOR', 'OPAMP', 'COMPARATOR', 'SWITCH', 'PUSH_BUTTON', 'TRANSFORMER', 'RAM', 'TIMER555', 'PLC', 'SHIFT_REGISTER', 'LATCH', 'GYROSCOPE', 'CAMERA', 'JOYSTICK', 'SERVO', 'AERO_CONTROL_SURFACE'].includes(type)) {
        if (Math.abs(current) > maxI) { isBurned = true; burnReason = "MAX CURRENT EXCEEDED"; }
        if (type === 'CAMERA') {
            const vIn = (nodeVoltagesMap[`${c.id}-0`] || 0) - (nodeVoltagesMap[`${c.id}-1`] || 0);
            if (Math.abs(vIn) > maxV) { isBurned = true; burnReason = "MAX VOLTAGE EXCEEDED"; }
        }
      }
      else if (type === 'CAPACITOR') {
        const v = (nodeVoltagesMap[`${c.id}-0`] || 0) - (nodeVoltagesMap[`${c.id}-1`] || 0);
        if (Math.abs(v) > maxV) { isBurned = true; burnReason = "MAX VOLTAGE EXCEEDED"; }
      } else if (type === 'BUCK_CONVERTER') {
        const vIn = (nodeVoltagesMap[`${c.id}-0`] || 0) - (nodeVoltagesMap[`${c.id}-1`] || 0);
        if (Math.abs(current) > maxI) { isBurned = true; burnReason = "MAX CURRENT EXCEEDED"; }
        else if (Math.abs(vIn) > maxV) { isBurned = true; burnReason = "MAX VOLTAGE EXCEEDED"; }
      } else if (type === 'JOYSTICK') {
        const xPos = Math.max(0, Math.min(100, c.props?.xPos !== undefined ? c.props.xPos : 50)) / 100;
        const yPos = Math.max(0, Math.min(100, c.props?.yPos !== undefined ? c.props.yPos : 50)) / 100;
        const ix1 = branchCurrentsMap[`${c.id}_RX1`] || 0;
        const ix2 = branchCurrentsMap[`${c.id}_RX2`] || 0;
        const iy1 = branchCurrentsMap[`${c.id}_RY1`] || 0;
        const iy2 = branchCurrentsMap[`${c.id}_RY2`] || 0;
        const pX = ix1 * ix1 * (rBase * xPos) + ix2 * ix2 * (rBase * (1-xPos));
        const pY = iy1 * iy1 * (rBase * yPos) + iy2 * iy2 * (rBase * (1-yPos));
        if (pX + pY > maxP) {
           isBurned = true; burnReason = "MAX POWER EXCEEDED";
        }
      } else if (type === 'SEVEN_SEGMENT') {
        let segmentBurned = false;
        ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(seg => {
            const segCurrent = branchCurrentsMap[`${c.id}_${seg}`] || 0;
            if (Math.abs(segCurrent) > maxI) segmentBurned = true;
        });
        if (segmentBurned) { isBurned = true; burnReason = "MAX CURRENT EXCEEDED"; }
      }

      if (isBurned) {
        burnedStates[c.id] = burnReason;
      }
    }
  });

  return { 
    voltages: nodeVoltagesMap, 
    currents: branchCurrentsMap, 
    wireCurrents: wireCurrentsMap, 
    active: activeMap, 
    ramData: prevState.ramData || {}, 
    ic555: prevState.ic555 || {}, 
    plcData: prevState.plcData || {},
    shiftRegisterData: prevState.shiftRegisterData || {},
    latchData: prevState.latchData || {},
    sevenSegmentData: prevState.sevenSegmentData || {}
  };
}