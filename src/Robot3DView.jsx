import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box as DreiBox, Cylinder, Grid, Html, TransformControls } from '@react-three/drei';

const ServoNode = ({ servo, config, angle = 0, isSelected, onSelect, onUpdateOffset, children }) => {
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
        onClick={(e) => { e.stopPropagation(); onSelect(servo.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isSelected ? "#0088aa" : "#1a1a24"} roughness={0.7} metalness={0.2} />
        {/* Small detail/accent to see orientation */}
        <DreiBox args={[1.25, 0.2, 0.2]} position={[0, 0.4, 0.6]}>
           <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} />
        </DreiBox>
      </DreiBox>
      
      {isSelected && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/90 text-cyan-400 px-2 py-1 rounded border border-cyan-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            ID: {servo.id.slice(0,4)}<br/>
            POS: {Math.round(angle)}°
          </div>
        </Html>
      )}

      {/* Servo Horn (Rotating part) */}
      <group ref={hornRef} position={[0, 0.75, 0]}>
        <Cylinder args={[0.4, 0.4, 0.2, 16]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </Cylinder>
        {/* Pointer indicator to make rotation visible */}
        <DreiBox args={[0.1, 0.2, 0.35]} position={[0, 0.2, 0.2]}>
          <meshStandardMaterial color="#ff003c" />
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
             onUpdateOffset(servo.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2)));
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

export default function Robot3DView({ servos, servoAngles, servoConfig, setServoConfig }) {
  const [selectedServo, setSelectedServo] = useState(null);

  const checkCycle = (id, targetParentId) => {
    let curr = targetParentId;
    while (curr) {
      if (curr === id) return true; // Cycle detected
      curr = servoConfig[curr]?.parentId;
    }
    return false;
  };

  const updateConfig = (id, key, val) => {
    if (key === 'parentId' && val && checkCycle(id, val)) {
      alert("Cannot set parent: creates a circular dependency.");
      return;
    }
    setServoConfig(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [key]: val }
    }));
  };

  const updateOffsets = (id, x, y, z) => {
    setServoConfig(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), offsetX: x, offsetY: y, offsetZ: z }
    }));
  };

  const buildTree = (parentId) => {
    return servos
      .filter(s => (servoConfig[s.id]?.parentId || null) === parentId)
      .map(s => (
        <ServoNode 
          key={s.id} 
          servo={s} 
          config={servoConfig[s.id]} 
          angle={servoAngles[s.id]}
          isSelected={selectedServo === s.id}
          onSelect={setSelectedServo}
          onUpdateOffset={updateOffsets}
        >
          {buildTree(s.id)}
        </ServoNode>
      ));
  };

  return (
    <div className="flex w-full h-full text-cyan-400 font-mono">
      {/* Sidebar for 3D arrangement */}
      <div className="w-64 bg-[#0b0b10] border-r border-cyan-900/50 p-4 flex flex-col gap-4 overflow-y-auto hide-scrollbar z-10 shrink-0">
        <h2 className="text-[11px] font-bold cyber-text tracking-widest uppercase border-b border-cyan-900/50 pb-2">Kinematic Linkage</h2>
        {servos.length === 0 && <p className="text-[10px] text-cyan-600/70">No SERVO components in the 2D circuit.</p>}
        
        {servos.map((s, idx) => {
          const cfg = servoConfig[s.id] || {};
          const isSelected = selectedServo === s.id;
          return (
            <div 
              key={s.id} 
              className={`p-2.5 border rounded-sm flex flex-col gap-2.5 cursor-pointer transition-colors ${isSelected ? 'border-cyan-400 bg-cyan-900/30' : 'border-cyan-900/30 bg-black/60'}`}
              onClick={() => setSelectedServo(s.id)}
            >
              <div className="text-[11px] font-bold text-cyan-300">Servo {idx + 1} <span className="text-[9px] opacity-50">({s.id.slice(0,4)})</span></div>
              <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Parent Link
                <select value={cfg.parentId || ''} onChange={(e) => updateConfig(s.id, 'parentId', e.target.value || null)} className="cyber-input p-1.5 rounded-sm">
                  <option value="">World Base (Origin)</option>
                  {servos.filter(other => other.id !== s.id).map((other, oIdx) => <option key={other.id} value={other.id}>Servo {oIdx + 1}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset X<input type="number" step="0.5" value={cfg.offsetX || 0} onChange={(e) => updateConfig(s.id, 'offsetX', parseFloat(e.target.value)||0)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset Y<input type="number" step="0.5" value={cfg.offsetY || 0} onChange={(e) => updateConfig(s.id, 'offsetY', parseFloat(e.target.value)||0)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset Z<input type="number" step="0.5" value={cfg.offsetZ || 0} onChange={(e) => updateConfig(s.id, 'offsetZ', parseFloat(e.target.value)||0)} className="cyber-input p-1 text-center rounded-sm" /></label>
              </div>
              <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Rotation Axis
                <select value={cfg.axis || 'Y'} onChange={(e) => updateConfig(s.id, 'axis', e.target.value)} className="cyber-input p-1.5 rounded-sm">
                  <option value="X">Pitch (X-Axis)</option><option value="Y">Yaw (Y-Axis)</option><option value="Z">Roll (Z-Axis)</option>
                </select>
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex-1 bg-[#050507] relative">
        <Canvas camera={{ position: [5, 5, 8], fov: 50 }} onPointerMissed={() => setSelectedServo(null)}>
          <ambientLight intensity={0.5} /><directionalLight position={[10, 10, 5]} intensity={1.5} /><OrbitControls makeDefault />
          <Grid infiniteGrid fadeDistance={40} sectionColor="#00f0ff" cellColor="rgba(0,240,255,0.2)" sectionThickness={1} cellThickness={0.5} />
          <group position={[0, 0.6, 0]}>{buildTree(null)}</group>
        </Canvas>
      </div>
    </div>
  );
}