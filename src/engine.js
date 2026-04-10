export function simulateTick({
  components,
  wires,
  tick,
  prevState,
  diodeStates,
  burnedStates = {},
  COMPONENT_TYPES,
  COMPOUND_MODELS
}) {
  const dt = 0.05; // 50ms simulation step
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

  // Iterative solver
  for (let iter = 0; iter < 10; iter++) {
    let resistors = [];
    let vSources = [];
    let iSources = []; 
    let cccs = [];     

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
        if (n0 !== undefined && n1 !== undefined) resistors.push({ n1: n0, n2: n1, R: 1e9, id: vc.id + "_burn1" });
        if (n1 !== undefined && n2 !== undefined && n2 !== null) resistors.push({ n1: n1, n2: n2, R: 1e9, id: vc.id + "_burn2" });
        return;
      }

      if (vc.type === 'BATTERY') {
        vSources.push({ nPos: n0, nNeg: n1, V: vc.props.voltage || 0, Rs: 0.01, id: vc.id });
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
      } else if (vc.type === 'RESISTOR' || vc.type === 'MOTOR') {
        const rVal = vc.props.resistance !== undefined ? vc.props.resistance : (vc.type === 'MOTOR' ? 10 : 1000);
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
      } else if (vc.type === 'SWITCH') {
        resistors.push({ n1: n0, n2: n1, R: vc.props.isOpen ? 1e9 : 1e-3, id: vc.id });
      } else if (vc.type === 'LED' || vc.type === 'DIODE') {
        if (diodeStates[vc.id]) {
          vSources.push({ nPos: n0, nNeg: n1, V: vc.props.forwardVoltage || (vc.type === 'LED' ? 2 : 0.7), Rs: 2.0, id: vc.id });
        } else {
          resistors.push({ n1: n0, n2: n1, R: 1e9, id: vc.id });
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

    const M = vSources.length;
    const size = (N - 1) + M;
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
        }
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
        burnedStates[w.id] = true;
      }
    }
  });

  validComponents.forEach(c => {
    if (!burnedStates[c.id]) {
      const type = c.type;
      let isBurned = false;
      let current = 0;
      if (type === 'NPN') current = branchCurrentsMap[`${c.id}_CE`] || 0;
      else if (type === 'PNP') current = branchCurrentsMap[`${c.id}_EC`] || 0;
      else if (type === 'HBRIDGE') current = Math.max(Math.abs(branchCurrentsMap[`${c.id}_OUT1`] || 0), Math.abs(branchCurrentsMap[`${c.id}_OUT2`] || 0));
      else current = branchCurrentsMap[c.id] || 0;

      const maxP = c.props?.maxPower !== undefined ? c.props.maxPower : 0.25;
      const maxI = c.props?.maxCurrent !== undefined ? c.props.maxCurrent : 1.0;
      const maxV = c.props?.maxVoltage !== undefined ? c.props.maxVoltage : 25.0;
      const rBase = Math.max(1e-3, c.props?.resistance !== undefined ? c.props.resistance : (type === 'MOTOR' ? 10 : 1000));
      
      if (type === 'RESISTOR') isBurned = (current * current * rBase) > maxP;
      else if (type === 'LED' || type === 'DIODE') isBurned = Math.abs(current) > maxI;
      else if (type === 'POTENTIOMETER') {
        const pos = Math.max(0, Math.min(100, c.props?.position || 0)) / 100;
        const i1 = branchCurrentsMap[`${c.id}_R1`] || 0;
        const i2 = branchCurrentsMap[`${c.id}_R2`] || 0;
        isBurned = (i1 * i1 * (rBase * pos) + i2 * i2 * (rBase * (1 - pos))) > maxP;
      }
      else if (type === 'NPN' || type === 'PNP') {
        isBurned = Math.abs(current) > maxI;
      }
      else if (['MOTOR', 'HBRIDGE', 'INDUCTOR', 'BATTERY', 'AC_SOURCE', 'PWM', 'SWITCH'].includes(type)) {
        isBurned = Math.abs(current) > maxI;
      }
      else if (type === 'CAPACITOR') {
        const v = (nodeVoltagesMap[`${c.id}-0`] || 0) - (nodeVoltagesMap[`${c.id}-1`] || 0);
        isBurned = Math.abs(v) > maxV;
      }

      if (isBurned) {
        burnedStates[c.id] = true;
      }
    }
  });

  return { voltages: nodeVoltagesMap, currents: branchCurrentsMap, wireCurrents: wireCurrentsMap, active: activeMap };
}