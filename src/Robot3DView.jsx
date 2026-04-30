import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Box as DreiBox, Cylinder, Grid, Html, TransformControls, Edges, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { getModel } from './db.js';
import * as THREE from 'three';
import { ChevronDown, ChevronRight } from 'lucide-react';

const OBSTACLES = [
  // Outer Walls
  { pos: [0, 1, -12], size: [24, 2, 1], color: "#002b36" },
  { pos: [0, 1, 12], size: [24, 2, 1], color: "#002b36" },
  { pos: [-12, 1, 0], size: [1, 2, 24], color: "#002b36" },
  { pos: [12, 1, 0], size: [1, 2, 24], color: "#002b36" },
  // Obstacles
  { pos: [0, 0.1, -4], size: [6, 0.2, 2], color: "#eab308" }, // Speed bump
  { pos: [5, 0.5, 5], size: [4, 1, 4], color: "#0088aa" }, // Platform
  { pos: [-6, 0.25, 6], size: [4, 0.5, 4], color: "#0088aa" }, // Low platform
  { pos: [8, 0.15, -6], size: [1.5, 0.3, 6], color: "#ff003c" }, // Slalom bump
  { pos: [4, 0.15, -6], size: [1.5, 0.3, 6], color: "#ff003c" }, // Slalom bump
];

const TrackEnvironment = () => (
  <group>
    {OBSTACLES.map((obs, i) => (
      <DreiBox key={i} position={obs.pos} args={obs.size}><meshStandardMaterial color={obs.color} roughness={0.8} /><Edges color="#000" opacity={0.5} transparent /></DreiBox>
    ))}
  </group>
);

const MeshCutter = ({ isCutting, cutMode, targetRef, nodesLength }) => {
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 2));
  const groupRef = useRef(null);
  const { gl } = useThree();

  React.useEffect(() => {
    gl.localClippingEnabled = true;
    if (!targetRef.current) return;

    // Traverse and apply clipping planes to all materials
    targetRef.current.traverse((child) => {
      if (child.material) {
        const applyClipping = (mat) => {
          mat.clippingPlanes = isCutting ? [planeRef.current] : null;
          mat.clipShadows = true;
          mat.needsUpdate = true;
        };
        if (Array.isArray(child.material)) {
          child.material.forEach(applyClipping);
        } else {
          applyClipping(child.material);
        }
      }
    });

    return () => {
      if (targetRef.current) {
        targetRef.current.traverse((child) => {
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => { m.clippingPlanes = null; m.needsUpdate = true; });
            else { child.material.clippingPlanes = null; child.material.needsUpdate = true; }
          }
        });
      }
    };
  }, [isCutting, targetRef, gl, nodesLength]);

  useFrame(() => {
    if (isCutting && groupRef.current) {
      const normal = new THREE.Vector3(0, -1, 0);
      normal.applyQuaternion(groupRef.current.quaternion).normalize();
      planeRef.current.setFromNormalAndCoplanarPoint(normal, groupRef.current.position);
    }
  });

  if (!isCutting) return null;

  return (
    <TransformControls mode={cutMode} size={0.8}>
      <group ref={groupRef} position={[0, 2, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 15]} />
          <meshBasicMaterial color="#ff003c" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
          <Edges color="#ff003c" />
        </mesh>
        <mesh position={[0, -0.5, 0]}><cylinderGeometry args={[0.02, 0.02, 1]} /><meshBasicMaterial color="#ff003c" /></mesh>
        <mesh position={[0, -1, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.1, 0.2, 8]} /><meshBasicMaterial color="#ff003c" /></mesh>
      </group>
    </TransformControls>
  );
};

const CameraFeedsManager = ({ activeCameras, cameraRefs, cameraContainerRefs }) => {
  const { gl, scene, camera, size } = useThree();

  useFrame(() => {
    // 1. Render main scene
    gl.setScissorTest(false);
    gl.setViewport(0, 0, size.width, size.height);
    gl.clear();
    gl.render(scene, camera);

    // 2. Render each active camera feed
    activeCameras.forEach(n => {
      const camRef = cameraRefs[n.id];
      const container = cameraContainerRefs.current[n.id];
      if (camRef?.current && container) {
        const rect = container.getBoundingClientRect();
        const canvasRect = gl.domElement.getBoundingClientRect();
        
        // WebGLRenderer automatically multiplies by pixelRatio internally
        const x = rect.left - canvasRect.left;
        const y = canvasRect.bottom - rect.bottom; 
        const width = rect.width;
        const height = rect.height;

        if (width > 0 && height > 0) {
          gl.setViewport(x, y, width, height);
          gl.setScissor(x, y, width, height);
          gl.setScissorTest(true);
          camRef.current.aspect = width / height;
          camRef.current.updateProjectionMatrix();
          gl.render(scene, camRef.current);
        }
      }
    });

    // Restore viewport/scissor for the next frame
    gl.setScissorTest(false);
    gl.setViewport(0, 0, size.width, size.height);
  }, 1);

  return null;
};

const ServoNode = ({ node, config, angle = 0, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
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
        visible={isVisible}
        args={[1.2, 1.5, 1.2]} 
        position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#3a3a4f")} roughness={0.7} metalness={0.2} />
        <Edges color="black" />
        {/* Small detail/accent to see orientation */}
        <DreiBox visible={isVisible} args={[1.25, 0.2, 0.2]} position={[0, 0.4, 0.6]}>
           <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.5} />
           <Edges color="black" />
        </DreiBox>
      </DreiBox>
      
      {isSelected && isVisible && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/90 text-cyan-400 px-2 py-1 rounded border border-cyan-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            ID: {node.id.slice(0,4)}<br/>
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : `POS: ${Math.round(angle)}°`}
          </div>
        </Html>
      )}

      {/* Servo Horn (Rotating part) */}
      <group ref={hornRef} position={[0, 0.75, 0]}>
        <Cylinder visible={isVisible} args={[0.4, 0.4, 0.2, 16]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#facc15" roughness={0.4} />
          <Edges color="black" />
        </Cylinder>
        {/* Pointer indicator to make rotation visible */}
        <DreiBox visible={isVisible} args={[0.1, 0.2, 0.35]} position={[0, 0.2, 0.2]}>
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

const PotentiometerNode = ({ node, config, position = 0, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, onUpdateProp, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  // Map 0-100% position to -135 to 135 degrees (270deg sweep)
  const angle = -135 + (position / 100) * 270;
  const angleRad = angle * (Math.PI / 180);

  const content = (
    <>
      {/* Potentiometer Base */}
      <DreiBox visible={isVisible} args={[1.2, 0.6, 1.2]} position={[0, 0.3, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#3a3a4f")} />
        <Edges color="black" />
      </DreiBox>

      {/* Rotating Knob */}
      <group visible={isVisible} position={[0, 0.7, 0]} rotation={[0, -angleRad, 0]}>
         <Cylinder args={[0.4, 0.4, 0.4, 16]}>
           <meshStandardMaterial color="#facc15" />
           <Edges color="black" />
         </Cylinder>
         <DreiBox args={[0.05, 0.42, 0.4]} position={[0, 0, 0.1]}>
           <meshStandardMaterial color="#111" />
           <Edges color="#666" />
         </DreiBox>
      </group>

      {isSelected && isVisible && (
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

const ButtonNode = ({ node, config, isPressed = false, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, onUpdateProp, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      {/* Button Base */}
      <DreiBox visible={isVisible} args={[1.0, 0.5, 1.0]} position={[0, 0.25, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#3a3a4f")} />
        <Edges color="black" />
      </DreiBox>

      {/* Button Cap */}
      <group visible={isVisible} position={[0, isPressed ? 0.40 : 0.55, 0]}>
         <Cylinder args={[0.3, 0.3, 0.2, 16]}
           onPointerDown={(e) => { e.stopPropagation(); e.target.setPointerCapture(e.pointerId); onUpdateProp(node.id, 'isPressed', true); }}
           onPointerUp={(e) => { e.stopPropagation(); try{ e.target.releasePointerCapture(e.pointerId); }catch(err){} onUpdateProp(node.id, 'isPressed', false); }}
           onPointerOut={(e) => { e.stopPropagation(); onUpdateProp(node.id, 'isPressed', false); }}
         >
           <meshStandardMaterial color={isPressed ? "#ff003c" : "#b3002a"} />
           <Edges color="black" />
         </Cylinder>
      </group>

      {isSelected && isVisible && (
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

const SwitchNode = ({ node, config, isOpen = true, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, onUpdateProp, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      {/* Switch Base */}
      <DreiBox visible={isVisible} args={[1.0, 0.4, 1.2]} position={[0, 0.2, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#3a3a4f")} />
        <Edges color="black" />
      </DreiBox>

      {/* Switch Toggle Lever */}
      <group visible={isVisible} position={[0, 0.5, 0]} rotation={[isOpen ? 0.4 : -0.4, 0, 0]}>
         <DreiBox args={[0.2, 0.6, 0.2]} position={[0, 0.3, 0]}
           onClick={(e) => { e.stopPropagation(); onUpdateProp(node.id, 'isOpen', !isOpen); }}
           onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
           onPointerOut={() => { document.body.style.cursor = 'auto'; }}
         >
           <meshStandardMaterial color={isOpen ? "#b3002a" : "#39ff14"} />
           <Edges color="black" />
         </DreiBox>
      </group>

      {isSelected && isVisible && (
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

const SevenSegmentNode = ({ node, config, segments = {}, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const Seg = ({ on, pos, size }) => (
     <DreiBox visible={isVisible} args={size} position={pos}>
       <meshStandardMaterial color={on ? "#ff003c" : "#330011"} emissive={on ? "#ff003c" : "#000"} emissiveIntensity={on ? 2 : 0} />
     </DreiBox>
  );

  const content = (
    <>
      {/* 7-Segment Base */}
      <DreiBox visible={isVisible} args={[1.2, 0.2, 1.8]} position={[0, 0.1, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#2a2a35")} />
        <Edges color="black" />
      </DreiBox>

      {/* The 7 Segments (a-g) */}
      <group position={[0, 0.2, 0]} visible={isVisible}>
         <Seg on={segments.a} pos={[0, 0.05, -0.6]} size={[0.5, 0.05, 0.15]} />
         <Seg on={segments.b} pos={[0.3, 0.05, -0.3]} size={[0.15, 0.05, 0.5]} />
         <Seg on={segments.c} pos={[0.3, 0.05, 0.3]} size={[0.15, 0.05, 0.5]} />
         <Seg on={segments.d} pos={[0, 0.05, 0.6]} size={[0.5, 0.05, 0.15]} />
         <Seg on={segments.e} pos={[-0.3, 0.05, 0.3]} size={[0.15, 0.05, 0.5]} />
         <Seg on={segments.f} pos={[-0.3, 0.05, -0.3]} size={[0.15, 0.05, 0.5]} />
         <Seg on={segments.g} pos={[0, 0.05, 0]} size={[0.5, 0.05, 0.15]} />
      </group>

      {isSelected && isVisible && (
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

const SolderingIronNode = ({ node, config, isHeated = false, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group visible={isVisible} rotation={[Math.PI / 2, 0, 0]}>
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
      {isSelected && isVisible && (
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

const MotorNode = ({ node, config, speed = 0, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
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
      <Cylinder visible={isVisible} args={[0.3, 0.3, 0.8, 16]} position={[0, 0.4, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#eab308")} metalness={0.5} roughness={0.3} />
        <Edges color="black" />
      </Cylinder>
      <group visible={isVisible} ref={shaftRef} position={[0, 0.95, 0]}>
        <Cylinder args={[0.08, 0.08, 0.3, 16]}>
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </Cylinder>
        <Cylinder args={[0.2, 0.2, 0.1, 8]} position={[0, 0.1, 0]}>
          <meshStandardMaterial color="#71717a" metalness={0.8} roughness={0.4} />
          <Edges color="#222" />
        </Cylinder>
      </group>
      {isSelected && isVisible && (
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

const PropellerNode = ({ node, config, speed = 0, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
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
      <Cylinder visible={isVisible} args={[0.2, 0.2, 0.4, 16]} position={[0, 0.2, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#475569")} />
        <Edges color="black" />
      </Cylinder>
      <group visible={isVisible} ref={propRef} position={[0, 0.45, 0]}>
         <Cylinder args={[0.08, 0.08, 0.15, 8]}><meshStandardMaterial color="#94a3b8" /></Cylinder>
         <DreiBox args={[1.8, 0.02, 0.2]} position={[0, 0.05, 0]}><meshStandardMaterial color="#00f0ff" /></DreiBox>
         <DreiBox args={[0.2, 0.02, 1.8]} position={[0, 0.05, 0]}><meshStandardMaterial color="#00f0ff" /></DreiBox>
      </group>
      {isSelected && isVisible && (
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

const GyroscopeNode = ({ node, config, pitch = 0, roll = 0, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, onUpdateProp, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];
  const pRad = pitch * (Math.PI / 180);
  const rRad = roll * (Math.PI / 180);

  const content = (
    <>
      <DreiBox visible={isVisible} args={[1.0, 0.2, 1.0]} position={[0, 0.1, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#8b5cf6")} />
        <Edges color="black" />
      </DreiBox>
      <DreiBox visible={isVisible} args={[0.4, 0.2, 0.4]} position={[0, 0.25, 0]}>
        <meshStandardMaterial color="#1e293b" />
      </DreiBox>
      {isSelected && isVisible && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black/90 text-purple-400 p-2 rounded border border-purple-500 text-[10px] font-mono pointer-events-auto shadow-[0_0_10px_rgba(139,92,246,0.5)] flex flex-col gap-2 w-36">
            <div className="text-center font-bold">GYRO TILT</div>
            {isBurned ? (
               <div className="text-center font-bold text-red-500 animate-pulse mt-1 mb-1 leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div>
            ) : (
               <>
                 <div className="flex items-center justify-between text-cyan-300"><span>Pitch:</span> <span className="font-mono">{Math.round(pitch)}°</span></div>
                 <div className="flex items-center justify-between text-cyan-300"><span>Roll:</span> <span className="font-mono">{Math.round(roll)}°</span></div>
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

const WorkBedNode = ({ node, config, isSelected, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <DreiBox visible={isVisible} args={[6, 0.2, 6]} position={[0, 0.1, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial color={isSelected ? "#0088aa" : "#1e1e24"} roughness={0.9} />
        <Edges color="#00f0ff" />
      </DreiBox>
      {isVisible && <Grid infiniteGrid={false} position={[0, 0.21, 0]} args={[6, 6]} sectionColor="#555" cellColor="#222" sectionThickness={1} cellThickness={0.5} fadeDistance={10} />}
      <group position={[0, 0.2, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) {
     return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  }
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const WheelNode = ({ node, config, speed = 0, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const wheelRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  useFrame((state, delta) => {
     if (wheelRef.current && speed !== 0) {
         wheelRef.current.rotation.y -= speed * delta * 10;
     }
  });

  const content = (
    <>
      <group rotation={[0, 0, Math.PI / 2]}>
        <group visible={isVisible} ref={wheelRef}>
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
      {isSelected && isVisible && (
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

const CarChassisNode = ({ node, config, isSelected, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group visible={isVisible} position={[0, 0.25, 0]}>
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
      {isSelected && isVisible && (
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

const XChassisNode = ({ node, config, isSelected, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group visible={isVisible} position={[0, 0.1, 0]}>
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
      {isSelected && isVisible && (
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

const LedNode = ({ node, config, isLit = false, color = '#ff003c', isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group visible={isVisible} position={[0, 0.1, 0]}>
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
      {isSelected && isVisible && (
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

const AeroShellNode = ({ node, config, isSelected, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];
  const shellColor = (node.props && node.props.color) ? node.props.color : '#00f0ff';

  const content = (
    <>
      <group visible={isVisible} position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <group scale={[1, 0.4, 2]}>
          <mesh>
            {/* Base opaque shell */}
            <sphereGeometry args={[2.0, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={isSelected ? "#0088aa" : shellColor} roughness={0.3} metalness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh>
            {/* Futuristic wireframe mesh overlay */}
            <sphereGeometry args={[2.01, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshBasicMaterial color={isSelected ? "#ffffff" : "#00f0ff"} wireframe={true} transparent opacity={0.25} />
          </mesh>
        </group>
      </group>
      {isSelected && isVisible && (
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

const BatteryNode = ({ node, config, voltage = 9, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  const content = (
    <>
      <group visible={isVisible} position={[0, 0.4, 0]}>
        {/* Battery Body */}
        <DreiBox args={[1.2, 0.8, 1.8]} position={[0, 0, 0]}
          onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
          onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        >
          <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#111")} roughness={0.7} metalness={0.5} />
          <Edges color={isBurned ? "#ff003c" : "#ff003c"} />
        </DreiBox>
        
        {/* Wrap/Label Overlay */}
        <DreiBox args={[1.22, 0.6, 1.4]} position={[0, 0, 0]} className="pointer-events-none">
          <meshStandardMaterial color={isBurned ? "#2a0000" : "#ff003c"} roughness={0.4} />
        </DreiBox>

        {/* Terminals */}
        <Cylinder args={[0.15, 0.15, 0.2, 16]} position={[-0.3, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#cbd5e1" metalness={0.8} /></Cylinder>
        <Cylinder args={[0.15, 0.15, 0.2, 16]} position={[0.3, 0, 0.95]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#cbd5e1" metalness={0.8} /></Cylinder>
      </group>
      {isSelected && isVisible && (
        <Html position={[0, 1.2, 0]} center>
          <div className="bg-black/90 text-red-400 px-2 py-1 rounded border border-red-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(255,0,60,0.5)]">
            POWER CELL<br/>
            {isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : `${voltage}V`}
          </div>
        </Html>
      )}
      <group position={[0, 0.8, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const CameraNode = ({ node, config, isActive = false, isSelected, isBurned, isEditMode, isVisible = true, onSelect, onUpdateOffset, children, registerCamera }) => {
  const groupRef = useRef(null);
  const cameraRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];

  React.useEffect(() => {
    if (cameraRef.current) {
      registerCamera(node.id, cameraRef);
    }
    return () => registerCamera(node.id, null);
  }, [node.id, registerCamera]);

  const content = (
    <>
      <group visible={isVisible} position={[0, 0.2, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <DreiBox args={[0.6, 0.4, 0.6]}>
          <meshStandardMaterial color={isBurned ? "#4a1111" : (isSelected ? "#0088aa" : "#eab308")} />
          <Edges color="black" />
        </DreiBox>
        <Cylinder args={[0.15, 0.15, 0.3, 16]} position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#111" /></Cylinder>
        <Cylinder args={[0.1, 0.1, 0.32, 16]} position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}><meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={isActive ? 0.5 : 0} /></Cylinder>
        <PerspectiveCamera ref={cameraRef} position={[0, 0, 0.6]} rotation={[0, Math.PI, 0]} fov={60} near={0.1} far={100} />
      </group>
      {isSelected && isVisible && (
        <Html position={[0, 0.8, 0]} center>
          <div className="bg-black/90 text-yellow-400 px-2 py-1 rounded border border-yellow-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            CAMERA<br/>{isBurned ? <div className="text-red-500 font-bold animate-pulse text-center leading-tight">OVERLOAD<br/><span className="text-[8px] font-normal">{typeof isBurned === 'string' ? isBurned : 'LIMIT EXCEEDED'}</span></div> : (isActive ? 'RECORDING' : 'STANDBY')}
          </div>
        </Html>
      )}
      <group position={[0, 0.5, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const ModelContent = ({ url, color, wireframe, opacity }) => {
  const { scene } = useGLTF(url, true);
  const clonedScene = React.useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        if (color && color !== '#ffffff') child.material.color.set(color);
        if (wireframe !== undefined) child.material.wireframe = wireframe;
        if (opacity !== undefined && opacity < 1) { child.material.transparent = true; child.material.opacity = opacity; }
      }
    });
    return clone;
  }, [scene, color, wireframe, opacity]);

  if (!clonedScene) return null;
  return <primitive object={clonedScene} />;
}

const ModelLoader = ({ url, color, wireframe, opacity }) => {
  const [localUrl, setLocalUrl] = useState(null);

  React.useEffect(() => {
    let objectUrl;
    const loadModel = async () => {
      if (url && url.startsWith('idb://')) {
        const id = url.substring(6);
        const blob = await getModel(id);
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setLocalUrl(objectUrl);
        } else {
          setLocalUrl(null); // Model not found
        }
      } else {
        setLocalUrl(url);
      }
    };
    loadModel();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [url]);

  if (!localUrl) return null;

  return <ModelContent url={localUrl} color={color} wireframe={wireframe} opacity={opacity} />;
};

const Model3DNode = ({ node, config, isSelected, isEditMode, isVisible = true, onSelect, onUpdateOffset, children }) => {
  const groupRef = useRef(null);
  const offset = [config?.offsetX || 0, config?.offsetY || 0, config?.offsetZ || 0];
  const { modelUrl, color = '#ffffff', wireframe = false, opacity = 1 } = node.props || {};

  const content = (
    <>
      <group visible={isVisible} position={[0, 0, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <React.Suspense fallback={<DreiBox args={[1,1,1]}><meshBasicMaterial color="#333" wireframe /></DreiBox>}>
          {modelUrl ? <ModelLoader url={modelUrl} color={color} wireframe={wireframe} opacity={opacity} /> : <DreiBox args={[1,1,1]}><meshStandardMaterial color="#0088aa" /><Edges color="black" /></DreiBox>}
        </React.Suspense>
      </group>
      {isSelected && isVisible && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-black/90 text-cyan-400 px-2 py-1 rounded border border-cyan-500 text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-[0_0_10px_rgba(0,240,255,0.5)]">
            3D MODEL
          </div>
        </Html>
      )}
      <group position={[0, 0, 0]}>{children}</group>
    </>
  );

  if (isSelected && isEditMode) return <TransformControls mode="translate" size={0.6} onMouseUp={() => { if (groupRef.current) { const pos = groupRef.current.position; onUpdateOffset(node.id, parseFloat(pos.x.toFixed(2)), parseFloat(pos.y.toFixed(2)), parseFloat(pos.z.toFixed(2))); }}}><group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group></TransformControls>;
  return <group ref={groupRef} position={offset} rotation={[(config?.pitch || 0) * (Math.PI / 180), (config?.yaw || 0) * (Math.PI / 180), (config?.roll || 0) * (Math.PI / 180)]}>{content}</group>;
};

const PhysicsRoot = ({ children, isStatic, isSimulating, isEditMode, floorLevel, rootNodeId, nodes, nodeConfig, nodeValues, showTrack }) => {
  const groupRef = useRef(null);
  const velocity = useRef(new THREE.Vector3());
  const yOffsetRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!isSimulating || isEditMode) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.set(0, 0, 0);
      velocity.current.set(0, 0, 0);
      yOffsetRef.current = null;
      return;
    }
    if (isStatic) return;

    const dt = Math.min(delta, 0.1); // Prevent physics explosions on lag spikes
    const activeObstacles = showTrack ? OBSTACLES : [];
    let driveForce = new THREE.Vector3();
    let hasTraction = false;

    groupRef.current.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(groupRef.current);
    
    // Calculate the distance from the group's origin to the bottom of the bounding box.
    const currentOffset = box.isEmpty() ? 0 : (groupRef.current.position.y - box.min.y);
    if (yOffsetRef.current === null) {
      yOffsetRef.current = currentOffset;
    } else if (!box.isEmpty()) {
      // Smooth out the vertical jitter caused by rotating polygonal wheel meshes
      yOffsetRef.current = THREE.MathUtils.lerp(yOffsetRef.current, currentOffset, dt * 1);
    }

    const currentMinY = groupRef.current.position.y - yOffsetRef.current;
    if (!box.isEmpty() && currentMinY <= floorLevel + 0.1) {
      hasTraction = true;
    }
    
    for (const obs of activeObstacles) {
      const obsMinX = obs.pos[0] - obs.size[0]/2;
      const obsMaxX = obs.pos[0] + obs.size[0]/2;
      const obsMaxY = obs.pos[1] + obs.size[1]/2;
      const obsMinZ = obs.pos[2] - obs.size[2]/2;
      const obsMaxZ = obs.pos[2] + obs.size[2]/2;
      
      if (box.max.x > obsMinX && box.min.x < obsMaxX && box.max.z > obsMinZ && box.min.z < obsMaxZ) {
          // If we are slightly above the obstacle, we have traction
          if (currentMinY >= obsMaxY - 0.1 && currentMinY <= obsMaxY + 0.1) hasTraction = true;
      }
    }

    if (hasTraction) {
      groupRef.current.traverse((child) => {
        if (child.name && child.name.startsWith('wheel-')) {
          const wheelId = child.name.replace('wheel-', '');
          const speed = nodeValues[wheelId] || 0;
          if (Math.abs(speed) > 0.01) {
            const wheelForward = new THREE.Vector3(0, 0, 1).applyQuaternion(child.getWorldQuaternion(new THREE.Quaternion()));
            wheelForward.y = 0;
            wheelForward.normalize();
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
        groupRef.current.rotation.y += turnRate * forwardSpeed * dt * moveDir;
      }
    }

    // Obstacle AABB Collision
    for (const obs of activeObstacles) {
      groupRef.current.updateMatrixWorld(true);
      const currBox = new THREE.Box3().setFromObject(groupRef.current);
      if (currBox.isEmpty()) continue;
      
      const obsMinX = obs.pos[0] - obs.size[0]/2; const obsMaxX = obs.pos[0] + obs.size[0]/2;
      const obsMinY = obs.pos[1] - obs.size[1]/2; const obsMaxY = obs.pos[1] + obs.size[1]/2;
      const obsMinZ = obs.pos[2] - obs.size[2]/2; const obsMaxZ = obs.pos[2] + obs.size[2]/2;

      const rMinX = currBox.min.x; const rMaxX = currBox.max.x;
      const rMinY = groupRef.current.position.y - yOffsetRef.current; const rMaxY = currBox.max.y;
      const rMinZ = currBox.min.z; const rMaxZ = currBox.max.z;

      if (rMaxX > obsMinX && rMinX < obsMaxX && rMaxY > obsMinY && rMinY < obsMaxY && rMaxZ > obsMinZ && rMinZ < obsMaxZ) {
          const overlapX1 = rMaxX - obsMinX; const overlapX2 = obsMaxX - rMinX;
          const overlapY1 = rMaxY - obsMinY; const overlapY2 = obsMaxY - rMinY;
          const overlapZ1 = rMaxZ - obsMinZ; const overlapZ2 = obsMaxZ - rMinZ;

          const minOverlap = Math.min(overlapX1, overlapX2, overlapY1, overlapY2, overlapZ1, overlapZ2);

          if (minOverlap === overlapY2) {
              groupRef.current.position.y += overlapY2;
              if (velocity.current.y < 0) { velocity.current.y = -velocity.current.y * 0.2; if (Math.abs(velocity.current.y) < 1.0) velocity.current.y = 0; }
          } else if (minOverlap === overlapY1) {
              groupRef.current.position.y -= overlapY1;
              if (velocity.current.y > 0) velocity.current.y = 0;
          } else if (minOverlap === overlapX1) {
              groupRef.current.position.x -= overlapX1; velocity.current.x *= -0.2;
          } else if (minOverlap === overlapX2) {
              groupRef.current.position.x += overlapX2; velocity.current.x *= -0.2;
          } else if (minOverlap === overlapZ1) {
              groupRef.current.position.z -= overlapZ1; velocity.current.z *= -0.2;
          } else if (minOverlap === overlapZ2) {
              groupRef.current.position.z += overlapZ2; velocity.current.z *= -0.2;
          }
      }
    }

    // Floor collision
    const newMinY = groupRef.current.position.y - yOffsetRef.current;
    if (!box.isEmpty() && newMinY < floorLevel) {
      groupRef.current.position.y += (floorLevel - newMinY);
      if (velocity.current.y < 0) {
        velocity.current.y = -velocity.current.y * 0.2; // Slight bounce
        if (Math.abs(velocity.current.y) < 1.0) velocity.current.y = 0;
      }
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

export default function Robot3DView({
  nodes,
  nodeValues,
  nodeConfig,
  setNodeConfig,
  onUpdateProp,
  isEditMode,
  isSimulating,
  burnedNodes = {},
  onDeleteNode,
  selectedNodeId,
  onSelectNode
}) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const [showTrack, setShowTrack] = useState(false);
  const [isCutting, setIsCutting] = useState(false);
  const [cutMode, setCutMode] = useState('translate'); // 'translate' | 'rotate'
  const sceneGroupRef = useRef(null);

  const [cameraRefs, setCameraRefs] = useState({});
  const registerCamera = React.useCallback((id, ref) => {
    setCameraRefs(prev => {
      if (ref === null) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: ref };
    });
  }, []);

  const cameraContainerRefs = useRef({});
  const setCameraContainerRef = (id, el) => { cameraContainerRefs.current[id] = el; };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        setIsCutting(false);
      } else if (selectedNodeId && isEditMode) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) {
          e.preventDefault(); // Prevent camera panning/scrolling
          const step = e.shiftKey ? 0.5 : 0.1;
          setNodeConfig(prev => {
            const cfg = prev[selectedNodeId] || {};
            let { offsetX: x = 0, offsetY: y = 0, offsetZ: z = 0 } = cfg;
            
            if (e.key === 'ArrowLeft') x -= step;
            if (e.key === 'ArrowRight') x += step;
            if (e.key === 'ArrowUp') {
              if (e.altKey) y += step;
              else z -= step;
            }
            if (e.key === 'ArrowDown') {
              if (e.altKey) y -= step;
              else z += step;
            }
            if (e.key === 'PageUp') y += step;
            if (e.key === 'PageDown') y -= step;
            
            return {
              ...prev,
              [selectedNodeId]: {
                ...cfg,
                offsetX: parseFloat(x.toFixed(2)),
                offsetY: parseFloat(y.toFixed(2)),
                offsetZ: parseFloat(z.toFixed(2))
              }
            };
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCutting, selectedNodeId, isEditMode, setNodeConfig]);

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
  const interactiveNodes = nodes.filter(n => ['SWITCH', 'PUSH_BUTTON', 'POTENTIOMETER', 'GYROSCOPE'].includes(n.type));
  const activeCameras = nodes.filter(n => n.type === 'CAMERA' && nodeValues[n.id]?.isActive && !burnedNodes[n.id]);

  const buildTree = (parentId) => {
    return nodes
      .filter(n => (nodeConfig[n.id]?.parentId || null) === parentId)
      .map(n => {
        const cfg = nodeConfig[n.id] || {};
        const val = nodeValues[n.id];
        const isSelected = selectedNodeId === n.id;
        const scale = [cfg.scaleX ?? 1, cfg.scaleY ?? 1, cfg.scaleZ ?? 1];
        const isVisible = cfg.visible !== false;
        
        let content = null;
        if (n.props?.modelUrl) {
            content = <Model3DNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</Model3DNode>;
        }
        else if (n.type === 'SERVO') content = <ServoNode node={n} config={cfg} angle={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</ServoNode>;
        else if (n.type === 'POTENTIOMETER') content = <PotentiometerNode node={n} config={cfg} position={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>{buildTree(n.id)}</PotentiometerNode>;
        else if (n.type === 'PUSH_BUTTON') content = <ButtonNode node={n} config={cfg} isPressed={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>{buildTree(n.id)}</ButtonNode>;
        else if (n.type === 'SWITCH') content = <SwitchNode node={n} config={cfg} isOpen={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>{buildTree(n.id)}</SwitchNode>;
        else if (n.type === 'SEVEN_SEGMENT') content = <SevenSegmentNode node={n} config={cfg} segments={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</SevenSegmentNode>;
        else if (n.type === 'SOLDERING_IRON') content = <SolderingIronNode node={n} config={cfg} isHeated={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</SolderingIronNode>;
        else if (n.type === 'MOTOR') content = <MotorNode node={n} config={cfg} speed={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</MotorNode>;
        else if (n.type === 'PROPELLER') content = <PropellerNode node={n} config={cfg} speed={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</PropellerNode>;
        else if (n.type === 'GYROSCOPE') content = <GyroscopeNode node={n} config={cfg} pitch={val?.pitch} roll={val?.roll} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets} onUpdateProp={onUpdateProp}>{buildTree(n.id)}</GyroscopeNode>;
        else if (n.type === 'WORK_BED') content = <WorkBedNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</WorkBedNode>;
        else if (n.type === 'WHEEL') content = <WheelNode node={n} config={cfg} speed={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</WheelNode>;
        else if (n.type === 'CAR_CHASSIS') content = <CarChassisNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</CarChassisNode>;
        else if (n.type === 'X_CHASSIS') content = <XChassisNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</XChassisNode>;
        else if (n.type === 'LED') content = <LedNode node={n} config={cfg} isLit={val?.isLit} color={val?.color} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</LedNode>;
        else if (n.type === 'AERO_SHELL') content = <AeroShellNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</AeroShellNode>;
        else if (n.type === 'BATTERY') content = <BatteryNode node={n} config={cfg} voltage={val} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</BatteryNode>;
        else if (n.type === 'CAMERA') content = <CameraNode node={n} config={cfg} isActive={val?.isActive} isSelected={isSelected} isBurned={burnedNodes[n.id]} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets} registerCamera={registerCamera}>{buildTree(n.id)}</CameraNode>;
        else if (n.type === 'MODEL_3D') content = <Model3DNode node={n} config={cfg} isSelected={isSelected} isEditMode={isEditMode} isVisible={isVisible} onSelect={onSelectNode} onUpdateOffset={updateOffsets}>{buildTree(n.id)}</Model3DNode>;

        const nodeElement = content ? <group key={n.id} scale={scale}>{content}</group> : null;
        
        if (parentId === null && nodeElement) {
          const isStatic = n.type === 'WORK_BED' || n.type === 'GROUND';
          return <PhysicsRoot key={n.id} isStatic={isStatic} isSimulating={isSimulating} isEditMode={isEditMode} floorLevel={floorLevel} rootNodeId={n.id} nodes={nodes} nodeConfig={nodeConfig} nodeValues={nodeValues} showTrack={showTrack}>{nodeElement}</PhysicsRoot>;
        }
        
        return nodeElement;
      });
  };

  return (
    <div className="flex w-full h-full text-cyan-400 font-mono">
      {/* Sidebar for 3D arrangement */}
      {isEditMode && (
      <div className="w-64 bg-[#0b0b10] border-r border-cyan-900/50 p-4 flex flex-col gap-4 overflow-y-auto hide-scrollbar z-10 shrink-0">
        <div className="flex flex-col gap-2 border-b border-cyan-900/50 pb-3">
          <h2 className="text-[11px] font-bold cyber-text tracking-widest uppercase">Kinematic Linkage</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsCutting(!isCutting)} className={`flex-1 p-1.5 text-[10px] cyber-button rounded-sm font-bold flex justify-center items-center gap-1 ${isCutting ? 'bg-pink-500/20 text-pink-400 border-pink-500/50 shadow-[0_0_8px_rgba(255,0,60,0.4)]' : ''}`}>
                {isCutting ? 'EXIT CUT MODE' : '✂ CUT MESH'}
              </button>
              {isCutting && (
                <button onClick={() => setCutMode(m => m === 'translate' ? 'rotate' : 'translate')} className="p-1.5 text-[10px] cyber-button rounded-sm w-16">
                  {cutMode === 'translate' ? 'MOVE' : 'ROTATE'}
                </button>
              )}
            </div>
            <button onClick={() => setShowTrack(!showTrack)} className={`p-1.5 text-[10px] cyber-button rounded-sm font-bold flex justify-center items-center gap-1 ${showTrack ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_8px_rgba(250,204,21,0.4)]' : ''}`}>
              {showTrack ? 'HIDE OBSTACLE TRACK' : 'SHOW OBSTACLE TRACK'}
            </button>
          </div>
        </div>
        {nodes.length === 0 && <p className="text-[10px] text-cyan-600/70">No 3D components in the circuit.</p>}
        
        {nodes.map((n, idx) => {
          const cfg = nodeConfig[n.id] || {};
          const isSelected = selectedNodeId === n.id;
          const isCollapsed = collapsedNodes[n.id] !== undefined ? collapsedNodes[n.id] : !isSelected;
          
          return (
            <div 
              key={n.id} 
              className={`p-2.5 border rounded-sm flex flex-col gap-2.5 cursor-pointer transition-colors ${isSelected ? 'border-cyan-400 bg-cyan-900/30' : 'border-cyan-900/30 bg-black/60'}`}
              onClick={() => {
                if (isSelected) {
                  setCollapsedNodes(prev => ({ ...prev, [n.id]: !isCollapsed }));
                } else {
                  onSelectNode(n.id);
                  setCollapsedNodes(prev => ({ ...prev, [n.id]: false }));
                }
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  {isCollapsed ? <ChevronRight size={12} className="text-cyan-600" /> : <ChevronDown size={12} className="text-cyan-600" />}
                  <div className="text-[11px] font-bold text-cyan-300">{n.type} {idx + 1} <span className="text-[9px] opacity-50">({n.id.slice(0,4)})</span></div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); updateConfig(n.id, 'visible', cfg.visible === false); }} className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold border transition-colors ${cfg.visible !== false ? 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50 hover:bg-cyan-800/50' : 'bg-red-900/50 text-red-300 border-red-500/50 hover:bg-red-800/50'}`} title="Toggle Visibility">{cfg.visible !== false ? 'VISIBLE' : 'HIDDEN'}</button>
                <button onClick={(e) => { e.stopPropagation(); if(onDeleteNode) onDeleteNode(n.id); if(selectedNodeId === n.id) onSelectNode(null); }} className="px-1.5 py-0.5 rounded-sm text-[8px] font-bold border transition-colors bg-red-900/50 text-red-300 border-red-500/50 hover:bg-red-800/50" title="Delete Component">DEL</button>
                </div>
              </div>
              
              {!isCollapsed && (
                <>
                  <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Parent Link
                    <select value={cfg.parentId || ''} onChange={(e) => updateConfig(n.id, 'parentId', e.target.value || null)} className="cyber-input p-1.5 rounded-sm" onClick={(e) => e.stopPropagation()}>
                      <option value="">World Base (Origin)</option>
                      {nodes.filter(other => other.id !== n.id).map((other, oIdx) => <option key={other.id} value={other.id}>{other.type} {oIdx + 1}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset X<input type="number" step="0.5" value={cfg.offsetX === undefined ? 0 : cfg.offsetX} onChange={(e) => updateConfig(n.id, 'offsetX', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset Y<input type="number" step="0.5" value={cfg.offsetY === undefined ? 0 : cfg.offsetY} onChange={(e) => updateConfig(n.id, 'offsetY', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Offset Z<input type="number" step="0.5" value={cfg.offsetZ === undefined ? 0 : cfg.offsetZ} onChange={(e) => updateConfig(n.id, 'offsetZ', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Pitch<input type="number" step="15" value={cfg.pitch === undefined ? 0 : cfg.pitch} onChange={(e) => updateConfig(n.id, 'pitch', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Yaw<input type="number" step="15" value={cfg.yaw === undefined ? 0 : cfg.yaw} onChange={(e) => updateConfig(n.id, 'yaw', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Roll<input type="number" step="15" value={cfg.roll === undefined ? 0 : cfg.roll} onChange={(e) => updateConfig(n.id, 'roll', isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5" onClick={(e) => e.stopPropagation()}>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Scale X<input type="number" step="0.1" value={cfg.scaleX === undefined ? 1 : cfg.scaleX} onChange={(e) => updateConfig(n.id, 'scaleX', isNaN(e.target.valueAsNumber) ? 1 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Scale Y<input type="number" step="0.1" value={cfg.scaleY === undefined ? 1 : cfg.scaleY} onChange={(e) => updateConfig(n.id, 'scaleY', isNaN(e.target.valueAsNumber) ? 1 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider">Scale Z<input type="number" step="0.1" value={cfg.scaleZ === undefined ? 1 : cfg.scaleZ} onChange={(e) => updateConfig(n.id, 'scaleZ', isNaN(e.target.valueAsNumber) ? 1 : e.target.valueAsNumber)} className="cyber-input p-1 text-center rounded-sm" /></label>
                  </div>
                  {n.type === 'SERVO' && (
                    <label className="text-[9px] flex flex-col gap-1 uppercase tracking-wider" onClick={(e) => e.stopPropagation()}>Rotation Axis
                      <select value={cfg.axis || 'Y'} onChange={(e) => updateConfig(n.id, 'axis', e.target.value)} className="cyber-input p-1.5 rounded-sm">
                        <option value="X">Pitch (X-Axis)</option><option value="Y">Yaw (Y-Axis)</option><option value="Z">Roll (Z-Axis)</option>
                      </select>
                    </label>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      )}

      <div className="flex-1 bg-[#050507] relative">
        <Canvas camera={{ position: [5, 5, 8], fov: 50 }} onPointerMissed={() => onSelectNode(null)}>
          <ambientLight intensity={0.5} /><directionalLight position={[10, 10, 5]} intensity={1.5} /><OrbitControls makeDefault />
          <MeshCutter isCutting={isCutting} cutMode={cutMode} targetRef={sceneGroupRef} nodesLength={nodes.length} />
          <Grid infiniteGrid fadeDistance={40} sectionColor="#00f0ff" cellColor="#003a40" sectionThickness={1} cellThickness={0.5} />
          {showTrack && <TrackEnvironment />}
          <group ref={sceneGroupRef} position={[0, 0.6, 0]}>{buildTree(null)}</group>
          {activeCameras.length > 0 && (
             <CameraFeedsManager activeCameras={activeCameras} cameraRefs={cameraRefs} cameraContainerRefs={cameraContainerRefs} />
          )}
        </Canvas>

        {/* Live Controls Dashboard */}
        {interactiveNodes.length > 0 && (
          <div 
            className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-[95%] overflow-x-auto hide-scrollbar bg-black/80 border border-cyan-900/50 rounded-sm p-3 flex gap-6 backdrop-blur-sm shadow-[0_0_20px_rgba(0,240,255,0.15)] z-20 pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {(() => {
              let bRenderIdx = 0;
              let aRenderIdx = 0;
              const btnKeys = ['1','2','3','4','5','6','7','8','9','0'];
              const axisKeys = [{up: 'W', down: 'S'}, {up: 'E', down: 'D'}, {up: 'R', down: 'F'}, {up: 'T', down: 'G'}, {up: 'Y', down: 'H'}];
              
              return interactiveNodes.map(n => {
                const val = nodeValues[n.id];
                if (n.type === 'SWITCH') {
                  const bKey = btnKeys[bRenderIdx++];
                  return (
                    <div key={n.id} className="flex flex-col items-center justify-center gap-2 min-w-[50px] shrink-0">
                      <span className="text-[9px] text-cyan-600 font-bold uppercase tracking-wider">SW {n.id.slice(0,4)}</span>
                      <button 
                        onClick={() => onUpdateProp(n.id, 'isOpen', !val)}
                        className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border transition-colors w-full ${val ? 'bg-black text-cyan-700 border-cyan-900/50' : 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(0,240,255,0.3)]'}`}
                      >
                        {val ? 'OPEN' : 'CLOSED'}
                      </button>
                      <kbd className="text-[8px] text-cyan-500 bg-cyan-900/30 px-1.5 rounded font-mono border border-cyan-800/50">[{bKey}]</kbd>
                    </div>
                  );
                }
                if (n.type === 'PUSH_BUTTON') {
                  const bKey = btnKeys[bRenderIdx++];
                  return (
                    <div key={n.id} className="flex flex-col items-center justify-center gap-2 min-w-[50px] shrink-0">
                      <span className="text-[9px] text-pink-600 font-bold uppercase tracking-wider">BTN {n.id.slice(0,4)}</span>
                      <button 
                        onPointerDown={(e) => { e.target.setPointerCapture(e.pointerId); onUpdateProp(n.id, 'isPressed', true); }}
                        onPointerUp={(e) => { try{ e.target.releasePointerCapture(e.pointerId); }catch(err){} onUpdateProp(n.id, 'isPressed', false); }}
                        onPointerCancel={() => onUpdateProp(n.id, 'isPressed', false)}
                        className={`px-3 py-1.5 rounded-sm text-[10px] font-bold border transition-colors w-full ${val ? 'bg-pink-900/50 text-pink-300 border-pink-500/50 shadow-[0_0_8px_rgba(255,0,60,0.4)]' : 'bg-black text-pink-700 border-pink-900/50 hover:bg-pink-900/30'}`}
                      >
                        PUSH
                      </button>
                      <kbd className="text-[8px] text-pink-500 bg-pink-900/30 px-1.5 rounded font-mono border border-pink-800/50">[{bKey}]</kbd>
                    </div>
                  );
                }
                if (n.type === 'POTENTIOMETER') {
                  const aKey = axisKeys[aRenderIdx++] || {up:'?', down:'?'};
                  const pos = val !== undefined ? val : 50;
                  return (
                    <div key={n.id} className="flex flex-col items-center justify-center gap-2 min-w-[40px] shrink-0">
                      <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-wider">POT {n.id.slice(0,4)}</span>
                      <kbd className="text-[8px] text-yellow-500 bg-yellow-900/30 px-1 rounded font-mono border border-yellow-800/50">{aKey.up}</kbd>
                      <input 
                        type="range" orient="vertical" min="0" max="100" step="1" value={pos} 
                        onChange={(e) => onUpdateProp(n.id, 'position', parseFloat(e.target.value))}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="accent-yellow-500 cursor-pointer"
                        style={{ WebkitAppearance: 'slider-vertical', appearance: 'slider-vertical', width: '12px', height: '60px' }}
                      />
                      <kbd className="text-[8px] text-yellow-500 bg-yellow-900/30 px-1 rounded font-mono border border-yellow-800/50">{aKey.down}</kbd>
                      <span className="text-[9px] text-yellow-500 font-mono">{Math.round(pos)}%</span>
                    </div>
                  );
                }
                if (n.type === 'GYROSCOPE') {
                  const pKey = axisKeys[aRenderIdx++] || {up:'?', down:'?'};
                  const rKey = axisKeys[aRenderIdx++] || {up:'?', down:'?'};
                  const pitch = val?.pitch || 0;
                  const roll = val?.roll || 0;
                  return (
                    <div key={n.id} className="flex gap-4 items-center justify-center border-l border-r border-purple-900/30 px-4 shrink-0">
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-[9px] text-purple-500 font-bold uppercase tracking-wider">PITCH</span>
                         <kbd className="text-[8px] text-purple-400 bg-purple-900/30 px-1 rounded font-mono border border-purple-800/50">{pKey.up}</kbd>
                         <input type="range" orient="vertical" min="-45" max="45" step="1" value={pitch} onChange={(e) => onUpdateProp(n.id, 'pitch', parseFloat(e.target.value))} onPointerDown={(e) => e.stopPropagation()} className="accent-purple-500 cursor-pointer" style={{ WebkitAppearance: 'slider-vertical', appearance: 'slider-vertical', width: '12px', height: '60px' }} />
                         <kbd className="text-[8px] text-purple-400 bg-purple-900/30 px-1 rounded font-mono border border-purple-800/50">{pKey.down}</kbd>
                         <span className="text-[9px] text-purple-400 font-mono">{Math.round(pitch)}°</span>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-[9px] text-purple-500 font-bold uppercase tracking-wider">ROLL</span>
                         <kbd className="text-[8px] text-purple-400 bg-purple-900/30 px-1 rounded font-mono border border-purple-800/50">{rKey.up}</kbd>
                         <input type="range" orient="vertical" min="-45" max="45" step="1" value={roll} onChange={(e) => onUpdateProp(n.id, 'roll', parseFloat(e.target.value))} onPointerDown={(e) => e.stopPropagation()} className="accent-purple-500 cursor-pointer" style={{ WebkitAppearance: 'slider-vertical', appearance: 'slider-vertical', width: '12px', height: '60px' }} />
                         <kbd className="text-[8px] text-purple-400 bg-purple-900/30 px-1 rounded font-mono border border-purple-800/50">{rKey.down}</kbd>
                         <span className="text-[9px] text-purple-400 font-mono">{Math.round(roll)}°</span>
                      </div>
                    </div>
                  );
                }
                return null;
              });
            })()}
          </div>
        )}
        
        {/* Camera Feeds Overlay */}
        {activeCameras.length > 0 && (
          <div className="absolute top-4 right-4 flex flex-col gap-4 pointer-events-none z-10">
            {activeCameras.map(n => (
              <div key={`cam-${n.id}`} className="flex flex-col items-end gap-1 shrink-0">
                <div 
                  ref={el => setCameraContainerRef(n.id, el)}
                  className="bg-transparent border border-yellow-500/80 rounded-sm relative overflow-hidden shadow-[0_0_15px_rgba(250,204,21,0.2)]"
                  style={{ width: '160px', height: '120px' }}
                >
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_15px_rgba(0,0,0,0.9)] z-10" />
                  <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_4px_#ff0000] z-10" />
                  <span className="absolute bottom-1 right-2 text-[9px] text-yellow-500 font-bold uppercase tracking-wider drop-shadow-[0_1px_1px_rgba(0,0,0,1)] z-10">CAM {n.id.slice(0,4)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}