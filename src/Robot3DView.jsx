import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box as DreiBox, Cylinder, Grid, Html, TransformControls, Edges } from '@react-three/drei';

const ServoNode = ({ node, config, angle = 0, isSelected, onSelect, onUpdateOffset, children }) => {
  const hornRef = useRef(null);
  const groupRef = useRef(null);
  const axis = config?.axis || 'Y';
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];
  
  // Map 0-180 degrees to -90 to +90 degrees in radians
  const targetRad = (angle - 90) * (Math.PI / 180);
  const targetRadRef = useRef(targetRad);
  targetRadRef.current = targetRad;
  
  const prevAxis = useRef(axis);
  
  useFrame((state, delta) => {
    if (hornRef.current) {
      if (prevAxis.current !== axis) {
        hornRef.current.rotation.set(0, 0, 0);
        prevAxis.current = axis;
      }
      const axisLower = axis.toLowerCase();
      const current = hornRef.current.rotation[axisLower];
      hornRef.current.rotation[axisLower] += (targetRadRef.current - current) * 15 * delta;
    }
  });

  const content = (
    <>
      {/* Servo Body */}
      <DreiBox 
        args={[1.2, 1.5, 1.2]} 
        position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isSelected ? "#0088aa" : "#3a3a4f"} roughness={0.7} metalness={0.2} />
        <Edges color="black" />
        {/* Small detail/accent to see orientation */}
        <DreiBox args={[1.25, 0.2, 0.2]} position={[0, 0.4, 0.6]}>
           <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} />
           <Edges color="black" />
        </DreiBox>
      </DreiBox>
      
      {isSelected && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/90 text-cyan-400 px-2 py-1 rounded border border-cyan-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            ID: {node.id.slice(0,4)}<br/>
            POS: {Math.round(angle)}°
          </div>
        </Html>
      )}

      {/* Servo Horn (Rotating part) */}
      <group ref={hornRef} position={[0, 0.75, 0]}>
        <Cylinder args={[0.4, 0.4, 0.2, 16]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#facc15" roughness={0.4} />
          <Edges color="black" />
        </Cylinder>
        {/* Pointer indicator to make rotation visible */}
        <DreiBox args={[0.1, 0.2, 0.35]} position={[0, 0.2, 0.2]}>
          <meshStandardMaterial color="#ff003c" />
          <Edges color="black" />
        </DreiBox>
        {/* Attachment point for children */}
        <group position={[0, 0.2, 0]}>
          {children}
        </group>
      </group>
    </>
  );

  if (isSelected) {
     return (
       <TransformControls 
         mode="translate" 
         size={0.6}
         onMouseUp={() => {
           if (groupRef.current) {
             const pos = groupRef.current.position;
             onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2)));
           }
         }}
       >
         <group ref={groupRef} position={offset}>
           {content}
         </group>
       </TransformControls>
     );
  }

  return (
    <group ref={groupRef} position={offset}>
      {content}
    </group>
  );
};

const PotentiometerNode = ({ node, config, position = 0, isSelected, onSelect, onUpdateOffset, onUpdateProp, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  // Map 0-100% position to -135 to 135 degrees (270deg sweep)
  const angle = -135 + (position / 100) * 270;
  const angleRad = angle * (Math.PI / 180);

  const content = (
    <>
      {/* Potentiometer Base */}
      <DreiBox args={[1.2, 0.6, 1.2]} position={[0, 0.3, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isSelected ? "#0088aa" : "#3a3a4f"} />
        <Edges color="black" />
      </DreiBox>

      {/* Rotating Knob */}
      <group position={[0, 0.7, 0]} rotation={[0, -angleRad, 0]}>
         <Cylinder args={[0.4, 0.4, 0.4, 16]}>
           <meshStandardMaterial color="#facc15" />
           <Edges color="black" />
         </Cylinder>
         <DreiBox args={[0.05, 0.42, 0.4]} position={[0, 0, 0.1]}>
           <meshStandardMaterial color="#111" />
           <Edges color="#666" />
         </DreiBox>
      </group>

      {isSelected && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/90 text-yellow-400 p-1 rounded border border-yellow-500 text-[10px] font-mono whitespace-nowrap pointer-events-auto flex items-center gap-2 shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            <button onClick={(e) => { e.stopPropagation(); onUpdateProp(node.id, 'position', Math.max(0, position - 5)); }} className="bg-yellow-900/50 hover:bg-yellow-700/50 px-1.5 py-0.5 rounded cursor-pointer">-</button>
            <div className="text-center w-12 pointer-events-none">
                {node.id.slice(0,4)}<br/>
                {Math.round(position)}%
            </div>
            <button onClick={(e) => { e.stopPropagation(); onUpdateProp(node.id, 'position', Math.min(100, position + 5)); }} className="bg-yellow-900/50 hover:bg-yellow-700/50 px-1.5 py-0.5 rounded cursor-pointer">+</button>
          </div>
        </Html>
      )}

      <group position={[0, 0.9, 0]}>{children}</group>
    </>
  );

  if (isSelected) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset}>{content}</group>;
};

const ButtonNode = ({ node, config, isPressed = false, isSelected, onSelect, onUpdateOffset, onUpdateProp, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      {/* Button Base */}
      <DreiBox args={[1.0, 0.5, 1.0]} position={[0, 0.25, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isSelected ? "#0088aa" : "#3a3a4f"} />
        <Edges color="black" />
      </DreiBox>

      {/* Button Cap */}
      <group position={[0, isPressed ? 0.40 : 0.55, 0]}>
         <Cylinder args={[0.3, 0.3, 0.2, 16]}
           onPointerDown={(e) => { e.stopPropagation(); e.target.setPointerCapture(e.pointerId); onUpdateProp(node.id, 'isPressed', true); }}
           onPointerUp={(e) => { e.stopPropagation(); try{ e.target.releasePointerCapture(e.pointerId); }catch(err){} onUpdateProp(node.id, 'isPressed', false); }}
           onPointerOut={(e) => { e.stopPropagation(); onUpdateProp(node.id, 'isPressed', false); }}
         >
           <meshStandardMaterial color={isPressed ? "#ff003c" : "#b3002a"} />
           <Edges color="black" />
         </Cylinder>
      </group>

      {isSelected && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black/90 text-pink-400 px-2 py-1 rounded border border-pink-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(255,0,60,0.5)]">
            ID: {node.id.slice(0,4)}<br/>
            {isPressed ? "PRESSED" : "RELEASED"}
          </div>
        </Html>
      )}

      <group position={[0, 0.5, 0]}>{children}</group>
    </>
  );

  if (isSelected) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset}>{content}</group>;
};

const SwitchNode = ({ node, config, isOpen = true, isSelected, onSelect, onUpdateOffset, onUpdateProp, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      {/* Switch Base */}
      <DreiBox args={[1.0, 0.4, 1.2]} position={[0, 0.2, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isSelected ? "#0088aa" : "#3a3a4f"} />
        <Edges color="black" />
      </DreiBox>

      {/* Switch Toggle Lever */}
      <group position={[0, 0.5, 0]} rotation={[isOpen ? 0.4 : -0.4, 0, 0]}>
         <DreiBox args={[0.2, 0.6, 0.2]} position={[0, 0.3, 0]}
           onClick={(e) => { e.stopPropagation(); onUpdateProp(node.id, 'isOpen', !isOpen); }}
           onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
           onPointerOut={() => { document.body.style.cursor = 'auto'; }}
         >
           <meshStandardMaterial color={isOpen ? "#b3002a" : "#39ff14"} />
           <Edges color="black" />
         </DreiBox>
      </group>

      {isSelected && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black/90 text-green-400 px-2 py-1 rounded border border-green-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(57,255,20,0.5)]">
            ID: {node.id.slice(0,4)}<br/>
            {isOpen ? "OPEN" : "CLOSED"}
          </div>
        </Html>
      )}

      <group position={[0, 0.6, 0]}>{children}</group>
    </>
  );

  if (isSelected) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset}>{content}</group>;
};

const SevenSegmentNode = ({ node, config, segments = {}, isSelected, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const Seg = ({ on, pos, size }) => (
     <DreiBox args={size} position={pos}>
       <meshStandardMaterial color={on ? "#ff003c" : "#330011"} emissive={on ? "#ff003c" : "#000"} emissiveIntensity={on ? 2 : 0} />
     </DreiBox>
  );

  const content = (
    <>
      {/* 7-Segment Base */}
      <DreiBox args={[1.2, 0.2, 1.8]} position={[0, 0.1, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isSelected ? "#0088aa" : "#2a2a35"} />
        <Edges color="black" />
      </DreiBox>

      {/* The 7 Segments (a-g) */}
      <group position={[0, 0.2, 0]}>
         <Seg on={segments.a} pos={[0, 0.05, -0.6]} size={[0.5, 0.05, 0.15]} />
         <Seg on={segments.b} pos={[0.3, 0.05, -0.3]} size={[0.15, 0.05, 0.5]} />
         <Seg on={segments.c} pos={[0.3, 0.05, 0.3]} size={[0.15, 0.05, 0.5]} />
         <Seg on={segments.d} pos={[0, 0.05, 0.6]} size={[0.5, 0.05, 0.15]} />
         <Seg on={segments.e} pos={[-0.3, 0.05, 0.3]} size={[0.15, 0.05, 0.5]} />
         <Seg on={segments.f} pos={[-0.3, 0.05, -0.3]} size={[0.15, 0.05, 0.5]} />
         <Seg on={segments.g} pos={[0, 0.05, 0]} size={[0.5, 0.05, 0.15]} />
      </group>

      {isSelected && (
        <Html position={[0, 1.0, 0]} center>
          <div className="bg-black/90 text-red-400 px-2 py-1 rounded border border-red-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(255,0,60,0.5)]">
            ID: {node.id.slice(0,4)}<br/>
            7-SEG DISPLAY
          </div>
        </Html>
      )}

      <group position={[0, 0.3, 0]}>{children}</group>
    </>
  );

  if (isSelected) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset}>{content}</group>;
};

export default function Robot3DView({ nodes, nodeValues, nodeConfig, setNodeConfig, onUpdateProp }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const checkCycle = (id, targetParentId) => {
    let curr = targetParentId;
    while (curr) {
      if (curr === id) return true; // Cycle detected
      curr = nodeConfig[curr]?.parentId;
    }
    return false;
  };

  const updateConfig = (id, key, val) => {
    if (key === 'parentId' && val && checkCycle(id, val)) {
      alert("Cannot set parent: creates a circular dependency.");
      return;
    }
    setNodeConfig(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: val }
    }));
  };

  const updateOffsets = (id, x, y, z) => {
    setNodeConfig(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), offsetX: x, offsetY: y, offsetZ: z }
    }));
  };

  const buildTree = (parentId) => {
    return nodes
      .filter(n => (nodeConfig[n.id]?.parentId || null) === parentId)
      .map(n => {
        const cfg = nodeConfig[n.id];
        const val = nodeValues[n.id];
        const isSelected = selectedNode === n.id;
        
        if (n.type === 'SERVO') {
          return (
            <ServoNode key={n.id} node={n} config={cfg} angle={val} isSelected={isSelected} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>
              {buildTree(n.id)}
            </ServoNode>
          );
        }
        if (n.type === 'POTENTIOMETER') {
          return (
            <PotentiometerNode key={n.id} node={n} config={cfg} position={val} isSelected={isSelected} onSelect={setSelectedNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>
              {buildTree(n.id)}
            </PotentiometerNode>
          );
        }
        if (n.type === 'PUSH_BUTTON') {
          return (
            <ButtonNode key={n.id} node={n} config={cfg} isPressed={val} isSelected={isSelected} onSelect={setSelectedNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>
              {buildTree(n.id)}
            </ButtonNode>
          );
        }
        if (n.type === 'SWITCH') {
          return (
            <SwitchNode key={n.id} node={n} config={cfg} isOpen={val} isSelected={isSelected} onSelect={setSelectedNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>
              {buildTree(n.id)}
            </SwitchNode>
          );
        }
        if (n.type === 'SEVEN_SEGMENT') {
          return (
            <SevenSegmentNode key={n.id} node={n} config={cfg} segments={val} isSelected={isSelected} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>
              {buildTree(n.id)}
            </SevenSegmentNode>
          );
        }
        return null;
      });
  };

  return (
    <div className="flex w-full h-full text-cyan-400 font-mono">
      {/* Sidebar for 3D arrangement */}
      <div className="w-64 bg-[#0b0b10] border-r border-cyan-900/50 p-4 flex flex-col gap-4 overflow-y-auto hide-scrollbar z-10 shrink-0">
        <h2 className="text-[11px] font-bold cyber-text tracking-widest uppercase border-b border-cyan-900/50 pb-2">Kinematic Linkage</h2>
        {nodes.length === 0 && <p className="text-[10px] text-cyan-600/70">No 3D components in the circuit.</p>}
        
        {nodes.map((n, idx) => {
          const cfg = nodeConfig[n.id] || {};
          const isSelected = selectedNode === n.id;
          return (
            <div 
              key={n.id} 
              className={`p-2.5 border rounded-sm flex flex-col gap-2.5 cursor-pointer transition-colors ${isSelected ? 'border-cyan-400 bg-cyan-900/30' : 'border-cyan-900/30 bg-black/60'}`}
              onClick={() => setSelectedNode(n.id)}
            >
              <div className="text-[11px] font-bold text-cyan-300">{n.type} {idx + 1} <span className="text-[9px] opacity-50">({n.id.slice(0,4)})</span></div>
              <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Parent Link
                <select value={cfg.parentId || ''} onChange={(e) => updateConfig(n.id, 'parentId', e.target.value || null)} className="cyber-input p-1.5 rounded-sm">
                  <option value="">World Base (Origin)</option>
                  {nodes.filter(other => other.id !== n.id).map((other, oIdx) => <option key={other.id} value={other.id}>{other.type} {oIdx + 1}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset X<input type="number" step="0.5" value={cfg.offsetX || 0} onChange={(e) => updateConfig(n.id, 'offsetX', parseFloat(e.target.value)||0)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset Y<input type="number" step="0.5" value={cfg.offsetY || 0} onChange={(e) => updateConfig(n.id, 'offsetY', parseFloat(e.target.value)||0)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset Z<input type="number" step="0.5" value={cfg.offsetZ || 0} onChange={(e) => updateConfig(n.id, 'offsetZ', parseFloat(e.target.value)||0)} className="cyber-input p-1 text-center rounded-sm" /></label>
              </div>
              {n.type === 'SERVO' && (
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Rotation Axis
                  <select value={cfg.axis || 'Y'} onChange={(e) => updateConfig(n.id, 'axis', e.target.value)} className="cyber-input p-1.5 rounded-sm">
                    <option value="X">Pitch (X-Axis)</option><option value="Y">Yaw (Y-Axis)</option><option value="Z">Roll (Z-Axis)</option>
                  </select>
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 bg-[#050507] relative">
        <Canvas camera={{ position: [5, 5, 8], fov: 50 }} onPointerMissed={() => setSelectedNode(null)}>
          <ambientLight intensity={0.5} /><directionalLight position={[10, 10, 5]} intensity={1.5} /><OrbitControls makeDefault />
          <Grid infiniteGrid fadeDistance={40} sectionColor="#00f0ff" cellColor="rgba(0,240,255,0.2)" sectionThickness={1} cellThickness={0.5} />
          <group position={[0, 0.6, 0]}>{buildTree(null)}</group>
        </Canvas>
      </div>
    </div>
  );
}