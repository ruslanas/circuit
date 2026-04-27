import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box as DreiBox, Cylinder, Grid, Html, TransformControls, Edges } from '@react-three/drei';
import * as THREE from 'three';

const ServoNode = ({ node, config, angle = 0, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, children }) => {
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
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#3a3a4f")} roughness={0.7} metalness={0.2} />
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
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : `POS: ${Math.round(angle)}°`}
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

  if (isSelected && isEditMode) {
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
         <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>
           {content}
         </group>
       </TransformControls>
     );
  }

  return (
    <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>
      {content}
    </group>
  );
};

const PotentiometerNode = ({ node, config, position = 0, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, onUpdateProp, children }) => {
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
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#3a3a4f")} />
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
            {isBurned ? (
              <div className="text-center px-2 py-1 pointer-events-none flex flex-col items-center">
                 {node.id.slice(0,4)}<br/>
                 <div className="text-red-500 font-bold animate-pulse leading-tight mt-1">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div>
              </div>
            ) : (
              <>
                <button onClick={(e) => { e.stopPropagation(); onUpdateProp(node.id, 'position', Math.max(0, position - 5)); }} className="bg-yellow-900/50 hover:bg-yellow-700/50 px-1.5 py-0.5 rounded cursor-pointer">-</button>
                <div className="text-center w-12 pointer-events-none">
                    {node.id.slice(0,4)}<br/>
                    {Math.round(position)}%
                </div>
                <button onClick={(e) => { e.stopPropagation(); onUpdateProp(node.id, 'position', Math.min(100, position + 5)); }} className="bg-yellow-900/50 hover:bg-yellow-700/50 px-1.5 py-0.5 rounded cursor-pointer">+</button>
              </>
            )}
          </div>
        </Html>
      )}

      <group position={[0, 0.9, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const ButtonNode = ({ node, config, isPressed = false, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, onUpdateProp, children }) => {
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
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#3a3a4f")} />
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
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : (isPressed ? "PRESSED" : "RELEASED")}
          </div>
        </Html>
      )}

      <group position={[0, 0.5, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const SwitchNode = ({ node, config, isOpen = true, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, onUpdateProp, children }) => {
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
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#3a3a4f")} />
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
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : (isOpen ? "OPEN" : "CLOSED")}
          </div>
        </Html>
      )}

      <group position={[0, 0.6, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const SevenSegmentNode = ({ node, config, segments = {}, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, children }) => {
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
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#2a2a35")} />
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
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : "7-SEG DISPLAY"}
          </div>
        </Html>
      )}

      <group position={[0, 0.3, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const SolderingIronNode = ({ node, config, isHeated = false, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* Handle */}
        <Cylinder args={[0.15, 0.15, 0.8, 16]} position={[0, -0.4, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#1e3a8a")} />
          <Edges color="black" />
        </Cylinder>
        {/* Shield */}
        <Cylinder args={[0.18, 0.18, 0.2, 16]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#0f172a" />
        </Cylinder>
        {/* Shaft */}
        <Cylinder args={[0.05, 0.05, 0.5, 16]} position={[0, 0.45, 0]}>
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </Cylinder>
        {/* Iron Tip */}
        <Cylinder args={[0.01, 0.05, 0.3, 16]} position={[0, 0.85, 0]}>
          <meshStandardMaterial color={isHeated ? "#ff3333" : "#cbd5e1"} emissive={isHeated ? "#ff0000" : "#000"} emissiveIntensity={isHeated ? 2 : 0} metalness={0.8} roughness={0.2} />
        </Cylinder>
      </group>
      {isSelected && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black/90 text-orange-400 px-2 py-1 rounded border border-orange-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(255,140,0,0.5)]">
            ID: {node.id.slice(0,4)}<br/>
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : (isHeated ? "HEATING" : "COLD")}
          </div>
        </Html>
      )}
      <group position={[0, 0.85, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return (
       <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}>
         <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>
       </TransformControls>
     );
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const MotorNode = ({ node, config, speed = 0, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const shaftRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  useFrame((state, delta) => {
     if (shaftRef.current && speed !== 0) {
         shaftRef.current.rotation.y += speed * delta * 25;
     }
  });

  const content = (
    <>
      <Cylinder args={[0.3, 0.3, 0.8, 16]} position={[0, 0.4, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#eab308")} metalness={0.5} roughness={0.3} />
        <Edges color="black" />
      </Cylinder>
      <Cylinder ref={shaftRef} args={[0.08, 0.08, 0.3, 16]} position={[0, 0.95, 0]}>
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </Cylinder>
      {isSelected && (
        <Html position={[0, 1.3, 0]} center>
          <div className="bg-black/90 text-yellow-400 px-2 py-1 rounded border border-yellow-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            MOTOR<br/>
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : (Math.abs(speed) > 0.01 ? 'RUNNING' : 'STOPPED')}
          </div>
        </Html>
      )}
      <group position={[0, 1.0, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const PropellerNode = ({ node, config, speed = 0, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const propRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  useFrame((state, delta) => {
     if (propRef.current && speed !== 0) {
         propRef.current.rotation.y += speed * delta * 25;
     }
  });

  const content = (
    <>
      <Cylinder args={[0.2, 0.2, 0.4, 16]} position={[0, 0.2, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#475569")} />
        <Edges color="black" />
      </Cylinder>
      <group ref={propRef} position={[0, 0.45, 0]}>
         <Cylinder args={[0.08, 0.08, 0.15, 8]}><meshStandardMaterial color="#94a3b8" /></Cylinder>
         <DreiBox args={[1.8, 0.02, 0.2]} position={[0, 0.05, 0]}><meshStandardMaterial color="#00f0ff" /></DreiBox>
         <DreiBox args={[0.2, 0.02, 1.8]} position={[0, 0.05, 0]}><meshStandardMaterial color="#00f0ff" /></DreiBox>
      </group>
      {isSelected && (
        <Html position={[0, 1.0, 0]} center>
          <div className="bg-black/90 text-cyan-400 px-2 py-1 rounded border border-cyan-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            PROPELLER<br/>
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : (Math.abs(speed) > 0.01 ? 'SPINNING' : 'STOPPED')}
          </div>
        </Html>
      )}
      <group position={[0, 0.6, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const GyroscopeNode = ({ node, config, pitch = 0, roll = 0, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, onUpdateProp, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];
  const pRad = pitch * (Math.PI / 180);
  const rRad = roll * (Math.PI / 180);

  const content = (
    <>
      <DreiBox args={[1.0, 0.2, 1.0]} position={[0, 0.1, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#8b5cf6")} />
        <Edges color="black" />
      </DreiBox>
      <DreiBox args={[0.4, 0.2, 0.4]} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#1e293b" />
      </DreiBox>
      {isSelected && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black/90 text-purple-400 p-2 rounded border border-purple-500 text-[10px] font-mono pointer-events-auto shadow-[0_0_10px_rgba(139,92,246,0.5)] flex flex-col gap-2 w-36">
            <div className="text-center font-bold">GYRO TILT</div>
            {isBurned ? (
               <div className="text-center font-bold text-red-500 animate-pulse mt-1 mb-1 leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div>
            ) : (
               <>
                 <div className="flex items-center gap-1 justify-between"><span>Pitch:</span> <input type="range" min="-45" max="45" step="1" value={pitch} onChange={(e) => onUpdateProp(node.id, 'pitch', parseFloat(e.target.value))} className="w-16 accent-purple-500" /> <span className="w-6 text-right">{Math.round(pitch)}°</span></div>
                 <div className="flex items-center gap-1 justify-between"><span>Roll:</span> <input type="range" min="-45" max="45" step="1" value={roll} onChange={(e) => onUpdateProp(node.id, 'roll', parseFloat(e.target.value))} className="w-16 accent-purple-500" /> <span className="w-6 text-right">{Math.round(roll)}°</span></div>
                 <button onClick={() => { onUpdateProp(node.id, 'pitch', 0); onUpdateProp(node.id, 'roll', 0); }} className="bg-purple-900/50 hover:bg-purple-700/50 py-0.5 rounded transition-colors w-full mt-1">Reset Level</button>
               </>
            )}
          </div>
        </Html>
      )}
      {/* Apply rotation to children so any attached drone elements actually tilt! */}
      <group rotation={[pRad, 0, rRad]} position={[0, 0.35, 0]}>
         {children}
      </group>
    </>
  );

  if (isSelected && isEditMode) {
     return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const WorkBedNode = ({ node, config, isSelected, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <DreiBox args={[6, 0.2, 6]} position={[0, 0.1, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isSelected ? "#0088aa" : "#1e1e24"} roughness={0.9} />
        <Edges color="#00f0ff" />
      </DreiBox>
      <Grid infiniteGrid={false} position={[0, 0.21, 0]} args={[6, 6]} sectionColor="#555" cellColor="#222" sectionThickness={1} cellThickness={0.5} fadeDistance={10} />
      <group position={[0, 0.2, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const WheelNode = ({ node, config, speed = 0, isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const wheelRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  useFrame((state, delta) => {
     if (wheelRef.current && speed !== 0) {
         wheelRef.current.rotation.y -= speed * delta * 20;
     }
  });

  const content = (
    <>
      <group rotation={[0, 0, Math.PI / 2]}>
        <group ref={wheelRef}>
          <Cylinder args={[0.5, 0.5, 0.3, 32]}
            onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          >
            <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#111111")} roughness={0.9} />
          </Cylinder>
          <Cylinder args={[0.3, 0.3, 0.32, 16]}>
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
            <Edges color="#555" />
          </Cylinder>
          {/* Visual indicator (spokes) to make rotation noticeable */}
          <DreiBox args={[0.45, 0.33, 0.08]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#111" />
          </DreiBox>
          <DreiBox args={[0.08, 0.33, 0.45]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#111" />
          </DreiBox>
        </group>
      </group>
      {isSelected && (
        <Html position={[0, 1.0, 0]} center>
          <div className="bg-black/90 text-cyan-400 px-2 py-1 rounded border border-cyan-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            WHEEL<br/>
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : (Math.abs(speed) > 0.01 ? 'SPINNING' : 'STOPPED')}
          </div>
        </Html>
      )}
      <group position={[0, 0.6, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} name={`wheel-${node.id}`} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  }
  return <group ref={groupRef} name={`wheel-${node.id}`} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const CarChassisNode = ({ node, config, isSelected, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group position={[0, 0.25, 0]}>
        {/* Left Rail */}
        <DreiBox args={[0.5, 0.5, 4]} position={[-0.75, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <meshStandardMaterial color={isSelected ? "#0088aa" : "#b3002a"} roughness={0.5} metalness={0.3} />
          <Edges color="black" />
        </DreiBox>
        {/* Right Rail */}
        <DreiBox args={[0.5, 0.5, 4]} position={[0.75, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <meshStandardMaterial color={isSelected ? "#0088aa" : "#b3002a"} roughness={0.5} metalness={0.3} />
          <Edges color="black" />
        </DreiBox>
        {/* Center Crossbar */}
        <DreiBox args={[1.0, 0.5, 1.5]} position={[0, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <meshStandardMaterial color={isSelected ? "#00aacc" : "#ff003c"} roughness={0.5} metalness={0.3} />
          <Edges color="black" />
        </DreiBox>
      </group>
      {isSelected && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/90 text-red-400 px-2 py-1 rounded border border-red-500 text-[10px] font-mono whitespace-nowrap pointer-events-none">
            CAR CHASSIS
          </div>
        </Html>
      )}
      <group position={[0, 0.5, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const XChassisNode = ({ node, config, isSelected, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group position={[0, 0.1, 0]}>
        {/* Arm 1 */}
        <DreiBox args={[0.3, 0.2, 4]} position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <meshStandardMaterial color={isSelected ? "#0088aa" : "#333"} roughness={0.7} />
          <Edges color="#00f0ff" />
        </DreiBox>
        {/* Arm 2 */}
        <DreiBox args={[0.3, 0.2, 4]} position={[0, 0, 0]} rotation={[0, -Math.PI / 4, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <meshStandardMaterial color={isSelected ? "#0088aa" : "#333"} roughness={0.7} />
          <Edges color="#00f0ff" />
        </DreiBox>
        {/* Center Hub */}
        <Cylinder args={[0.4, 0.4, 0.25, 16]} position={[0, 0, 0]}>
           <meshStandardMaterial color={isSelected ? "#00aacc" : "#111"} />
           <Edges color="#ff003c" />
        </Cylinder>
      </group>
      {isSelected && (
        <Html position={[0, 1.0, 0]} center>
          <div className="bg-black/90 text-red-400 px-2 py-1 rounded border border-red-500 text-[10px] font-mono whitespace-nowrap pointer-events-none">
            X-CHASSIS
          </div>
        </Html>
      )}
      <group position={[0, 0.25, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const LedNode = ({ node, config, isLit = false, color = '#ff003c', isSelected, isBurned, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group position={[0, 0.1, 0]}>
        <Cylinder args={[0.2, 0.2, 0.1, 16]} position={[0, -0.05, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <meshStandardMaterial color={isBurned ? "#4a1111" : "#111"} />
          <Edges color="black" />
        </Cylinder>
        <mesh position={[0, 0.15, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
           <sphereGeometry args={[0.2, 16, 16]} />
           <meshStandardMaterial color={isBurned ? "#222" : color} emissive={isLit && !isBurned ? color : "#000"} emissiveIntensity={isLit && !isBurned ? 2 : 0} transparent={true} opacity={isLit ? 0.9 : 0.6} />
        </mesh>
        {isLit && !isBurned && <pointLight color={color} intensity={2} distance={3} decay={2} />}
      </group>
      {isSelected && (
        <Html position={[0, 0.8, 0]} center>
          <div className="bg-black/90 text-cyan-400 px-2 py-1 rounded border border-cyan-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            LED<br/>
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : (isLit ? 'ON' : 'OFF')}
          </div>
        </Html>
      )}
      <group position={[0, 0.4, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const AeroShellNode = ({ node, config, isSelected, isEditMode, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <mesh scale={[1, 0.4, 2]}>
          {/* Render a half-sphere by limiting phi/theta lengths */}
          <sphereGeometry args={[2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={isSelected ? "#0088aa" : "#00f0ff"} transparent opacity={0.6} roughness={0.1} metalness={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {isSelected && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/90 text-cyan-400 px-2 py-1 rounded border border-cyan-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            AERO SHELL
          </div>
        </Html>
      )}
      <group position={[0, 0.8, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const PhysicsRoot = ({ children, isStatic, isSimulating, isEditMode, floorLevel, rootNodeId, nodes, nodeConfig, nodeValues }) => {
  const groupRef = useRef(null);
  const velocity = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!isSimulating || isEditMode) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.set(0, 0, 0);
      velocity.current.set(0, 0, 0);
      return;
    }
    if (isStatic) return;

    const dt = Math.min(delta, 0.1); // Prevent physics explosions on lag spikes
    let driveForce = new THREE.Vector3();
    let hasTraction = false;

    groupRef.current.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(groupRef.current);
    if (!box.isEmpty() && box.min.y <= floorLevel + 0.1) {
      hasTraction = true;
    }

    if (hasTraction) {
      groupRef.current.traverse((child) => {
        if (child.name && child.name.startsWith('wheel-')) {
          const wheelId = child.name.replace('wheel-', '');
          const speed = nodeValues[wheelId] || 0;
          if (Math.abs(speed) > 0.01) {
            const wheelForward = new THREE.Vector3(0, 0, 1).applyQuaternion(child.getWorldQuaternion(new THREE.Quaternion()));
            driveForce.addScaledVector(wheelForward, speed * 5);
          }
        }
      });
    }

    velocity.current.y -= 9.81 * dt;
    velocity.current.addScaledVector(driveForce, dt);

    // Friction
    if (hasTraction) {
      velocity.current.x *= Math.pow(0.001, dt);
      velocity.current.z *= Math.pow(0.001, dt);
    } else {
      velocity.current.x *= Math.pow(0.5, dt);
      velocity.current.z *= Math.pow(0.5, dt);
    }

    groupRef.current.position.addScaledVector(velocity.current, dt);

    // Simple Steering
    const steerServo = nodes.find(n => n.type === 'SERVO' && nodeConfig[n.id]?.parentId === rootNodeId);
    if (steerServo && hasTraction) {
      const steerAngle = nodeValues[steerServo.id] !== undefined ? nodeValues[steerServo.id] : 90;
      const turnRate = (steerAngle - 90) * 0.03; 
      const forwardSpeed = new THREE.Vector3(velocity.current.x, 0, velocity.current.z).length();
      if (forwardSpeed > 0.1) {
        const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion);
        const moveDir = Math.sign(velocity.current.dot(fwd)) || 1;
        groupRef.current.rotation.y -= turnRate * forwardSpeed * dt * moveDir;
      }
    }

    groupRef.current.updateMatrixWorld(true);
    const newBox = new THREE.Box3().setFromObject(groupRef.current);
    if (!newBox.isEmpty() && newBox.min.y < floorLevel) {
      groupRef.current.position.y += (floorLevel - newBox.min.y);
      velocity.current.y = -velocity.current.y * 0.3; // Slight bounce
      if (Math.abs(velocity.current.y) < 0.5) velocity.current.y = 0;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

export default function Robot3DView({ nodes, nodeValues, nodeConfig, setNodeConfig, onUpdateProp, isEditMode, isSimulating, burnedNodes = {} }) {
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

  const hasWorkBed = nodes.some(n => n.type === 'WORK_BED');
  const floorLevel = hasWorkBed ? 0.2 : 0;

  const buildTree = (parentId) => {
    return nodes
      .filter(n => (nodeConfig[n.id]?.parentId || null) === parentId)
      .map(n => {
        const cfg = nodeConfig[n.id] || {};
        const val = nodeValues[n.id];
        const isSelected = selectedNode === n.id;
        const scale = [cfg.scaleX ?? 1, cfg.scaleY ?? 1, cfg.scaleZ ?? 1];
        
        let content = null;
        if (n.type === 'SERVO') content = <ServoNode node={n} config={cfg} angle={val} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</ServoNode>;
        else if (n.type === 'POTENTIOMETER') content = <PotentiometerNode node={n} config={cfg} position={val} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>{buildTree(n.id)}</PotentiometerNode>;
        else if (n.type === 'PUSH_BUTTON') content = <ButtonNode node={n} config={cfg} isPressed={val} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>{buildTree(n.id)}</ButtonNode>;
        else if (n.type === 'SWITCH') content = <SwitchNode node={n} config={cfg} isOpen={val} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>{buildTree(n.id)}</SwitchNode>;
        else if (n.type === 'SEVEN_SEGMENT') content = <SevenSegmentNode node={n} config={cfg} segments={val} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</SevenSegmentNode>;
        else if (n.type === 'SOLDERING_IRON') content = <SolderingIronNode node={n} config={cfg} isHeated={val} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</SolderingIronNode>;
        else if (n.type === 'MOTOR') content = <MotorNode node={n} config={cfg} speed={val} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</MotorNode>;
        else if (n.type === 'PROPELLER') content = <PropellerNode node={n} config={cfg} speed={val} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</PropellerNode>;
        else if (n.type === 'GYROSCOPE') content = <GyroscopeNode node={n} config={cfg} pitch={val?.pitch} roll={val?.roll} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>{buildTree(n.id)}</GyroscopeNode>;
        else if (n.type === 'WORK_BED') content = <WorkBedNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</WorkBedNode>;
        else if (n.type === 'WHEEL') content = <WheelNode node={n} config={cfg} speed={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</WheelNode>;
        else if (n.type === 'CAR_CHASSIS') content = <CarChassisNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</CarChassisNode>;
        else if (n.type === 'X_CHASSIS') content = <XChassisNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</XChassisNode>;
        else if (n.type === 'LED') content = <LedNode node={n} config={cfg} isLit={val?.isLit} color={val?.color} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</LedNode>;
        else if (n.type === 'AERO_SHELL') content = <AeroShellNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} onSelect={setSelectedNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</AeroShellNode>;

        const nodeElement = content ? <group key={n.id} scale={scale}>{content}</group> : null;
        
        if (parentId === null && nodeElement) {
          const isStatic = n.type === 'WORK_BED' || n.type === 'GROUND';
          return <PhysicsRoot key={n.id} isStatic={isStatic} isSimulating={isSimulating} isEditMode={isEditMode} floorLevel={floorLevel} rootNodeId={n.id} nodes={nodes} nodeConfig={nodeConfig} nodeValues={nodeValues}>{nodeElement}</PhysicsRoot>;
        }
        
        return nodeElement;
      });
  };

  return (
    <div className="flex w-full h-full text-cyan-400 font-mono">
      {/* Sidebar for 3D arrangement */}
      {isEditMode && (
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
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset X<input type="number" step="0.5" value={cfg.offsetX === undefined ? 0 : cfg.offsetX} onChange={(e) => updateConfig(n.id, 'offsetX', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset Y<input type="number" step="0.5" value={cfg.offsetY === undefined ? 0 : cfg.offsetY} onChange={(e) => updateConfig(n.id, 'offsetY', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset Z<input type="number" step="0.5" value={cfg.offsetZ === undefined ? 0 : cfg.offsetZ} onChange={(e) => updateConfig(n.id, 'offsetZ', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Pitch<input type="number" step="15" value={cfg.pitch === undefined ? 0 : cfg.pitch} onChange={(e) => updateConfig(n.id, 'pitch', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Yaw<input type="number" step="15" value={cfg.yaw === undefined ? 0 : cfg.yaw} onChange={(e) => updateConfig(n.id, 'yaw', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Roll<input type="number" step="15" value={cfg.roll === undefined ? 0 : cfg.roll} onChange={(e) => updateConfig(n.id, 'roll', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Scale X<input type="number" step="0.1" value={cfg.scaleX === undefined ? 1 : cfg.scaleX} onChange={(e) => updateConfig(n.id, 'scaleX', isNaN(e.target.valueAsNumber) ? 1 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Scale Y<input type="number" step="0.1" value={cfg.scaleY === undefined ? 1 : cfg.scaleY} onChange={(e) => updateConfig(n.id, 'scaleY', isNaN(e.target.valueAsNumber) ? 1 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Scale Z<input type="number" step="0.1" value={cfg.scaleZ === undefined ? 1 : cfg.scaleZ} onChange={(e) => updateConfig(n.id, 'scaleZ', isNaN(e.target.valueAsNumber) ? 1 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
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
      )}

      <div className="flex-1 bg-[#050507] relative">
        <Canvas camera={{ position: [5, 5, 8], fov: 50 }} onPointerMissed={() => setSelectedNode(null)}>
          <ambientLight intensity={0.5} /><directionalLight position={[10, 10, 5]} intensity={1.5} /><OrbitControls makeDefault />
          <Grid infiniteGrid fadeDistance={40} sectionColor="#00f0ff" cellColor="#003a40" sectionThickness={1} cellThickness={0.5} />
          <group position={[0, 0.6, 0]}>{buildTree(null)}</group>
        </Canvas>
      </div>
    </div>
  );
}