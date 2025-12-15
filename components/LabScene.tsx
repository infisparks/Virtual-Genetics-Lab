import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars, Environment, ContactShadows, Grid, Sparkles, Line, SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { PunnettSquareData, TraitConfig, HighlightTarget } from '../types';
import { getPhenotype } from '../services/geneticsEngine';

// --- Sub-components for 3D Objects ---

// A cinematic spotlight that follows the highlight target
const CinematicSpotlight = ({ target }: { target: HighlightTarget }) => {
    const light = useRef<THREE.SpotLight>(null);
    const targetObj = useRef<THREE.Object3D>(new THREE.Object3D());
    const { scene } = useThree();

    useEffect(() => {
        scene.add(targetObj.current);
        if (light.current) {
            light.current.target = targetObj.current;
        }
        return () => {
            scene.remove(targetObj.current);
        }
    }, [scene]);

    useFrame((state, delta) => {
        let desiredPos = new THREE.Vector3(0, 20, 10);
        let desiredTarget = new THREE.Vector3(0, 0, 0);
        let intensity = 0;

        // Configuration based on target
        // Punnett Board Group is at x=4
        switch (target) {
            case 'dna':
                desiredPos.set(-8, 8, -6);
                desiredTarget.set(-7, 3, -7);
                intensity = 500;
                break;
            case 'parents':
                desiredPos.set(-5, 10, 5);
                desiredTarget.set(-5, 0, 0);
                intensity = 400;
                break;
            case 'genotypes':
                desiredPos.set(-5, 8, 2);
                desiredTarget.set(-5, 4, 0);
                intensity = 300;
                break;
            case 'punnett_board':
                desiredPos.set(4, 15, 5);
                desiredTarget.set(4, 0, 0);
                intensity = 400;
                break;
            case 'offspring':
                desiredPos.set(4, 10, 5);
                desiredTarget.set(4, 0, 0);
                intensity = 500;
                break;
            // Detailed Cell Targets
            // Cell 0 (Top Left): Group Pos [-1.5, 0, -1.5] -> World [2.5, 0, -1.5]
            case 'cell_0':
                desiredPos.set(2.5, 6, -1.5);
                desiredTarget.set(2.5, 0, -1.5);
                intensity = 600;
                break;
            // Cell 1 (Top Right): Group Pos [1.5, 0, -1.5] -> World [5.5, 0, -1.5]
            case 'cell_1':
                desiredPos.set(5.5, 6, -1.5);
                desiredTarget.set(5.5, 0, -1.5);
                intensity = 600;
                break;
            // Cell 2 (Bottom Left): Group Pos [-1.5, 0, 1.5] -> World [2.5, 0, 1.5]
            case 'cell_2':
                desiredPos.set(2.5, 6, 1.5);
                desiredTarget.set(2.5, 0, 1.5);
                intensity = 600;
                break;
            // Cell 3 (Bottom Right): Group Pos [1.5, 0, 1.5] -> World [5.5, 0, 1.5]
            case 'cell_3':
                desiredPos.set(5.5, 6, 1.5);
                desiredTarget.set(5.5, 0, 1.5);
                intensity = 600;
                break;
            case 'none':
            default:
                intensity = 0;
                break;
        }

        if (light.current) {
            light.current.position.lerp(desiredPos, delta * 2);
            light.current.intensity = THREE.MathUtils.lerp(light.current.intensity, intensity, delta * 3);
            targetObj.current.position.lerp(desiredTarget, delta * 2);
        }
    });

    return (
        <spotLight
            ref={light}
            angle={0.4}
            penumbra={0.4}
            castShadow
            shadow-bias={-0.0001}
            color="#ffffff"
        />
    );
};

const Halo = ({ visible, color = "white", scale = 1 }: { visible: boolean, color?: string, scale?: number }) => {
    const mesh = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (mesh.current && visible) {
            mesh.current.rotation.z += 0.02;
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
            mesh.current.scale.set(scale * pulse, scale * pulse, scale * pulse);
        }
    });

    if (!visible) return null;

    return (
        <mesh ref={mesh} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.1, 0]}>
            <ringGeometry args={[1 * scale, 1.1 * scale, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
    );
};

const DNAHelix = ({ highlighted }: { highlighted: boolean }) => {
  const points = useMemo(() => {
    const p = [];
    for (let i = 0; i < 40; i++) {
      const t = i * 0.4;
      p.push(new THREE.Vector3(Math.cos(t), t * 0.4 - 6, Math.sin(t)));
      p.push(new THREE.Vector3(Math.cos(t + Math.PI), t * 0.4 - 6, Math.sin(t + Math.PI)));
    }
    return p;
  }, []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5 + 2;
    }
  });

  return (
    <group ref={groupRef} position={[-7, 3, -7]} scale={0.7}>
      {points.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#6366f1" : "#10b981"} 
            emissive={highlighted ? "#ffffff" : (i % 2 === 0 ? "#312e81" : "#064e3b")} 
            emissiveIntensity={highlighted ? 0.5 : 2} 
          />
        </mesh>
      ))}
      <mesh position={[0,0,0]}>
         <cylinderGeometry args={[0.05, 0.05, 16, 8]} />
         <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
      </mesh>
    </group>
  );
};

const PeaPlant = ({ genotype, trait, position, isGhost = false, highlighted = false }: { genotype: string, trait: TraitConfig, position: [number, number, number], isGhost?: boolean, highlighted?: boolean }) => {
  const phenotype = getPhenotype(genotype, trait);
  const isTall = phenotype === trait.dominantLabel && trait.name === 'Height';
  
  const stemHeight = trait.name === 'Height' ? (isTall ? 3.5 : 1.2) : 2.5; 
  const podColor = trait.name === 'Seed Color' ? (phenotype === 'Yellow' ? '#fbbf24' : '#22c55e') : '#22c55e';
  const leafColor = isGhost ? "#64748b" : "#15803d";
  const actualPodColor = isGhost ? "#94a3b8" : podColor;

  return (
    <group position={position}>
      <Float speed={3} rotationIntensity={0} floatIntensity={0.2} floatingRange={[-0.1, 0.1]}>
        <Text 
          position={[0, stemHeight + 1.2, 0]} 
          fontSize={0.6} 
          color={highlighted ? "#fbbf24" : (isGhost ? "#94a3b8" : "white")} 
          anchorX="center" 
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor={highlighted ? "#b45309" : "#0f172a"}
        >
          {genotype}
        </Text>
      </Float>

      <mesh position={[0, stemHeight / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, stemHeight, 8]} />
        <meshStandardMaterial 
            color={leafColor} 
            transparent opacity={isGhost ? 0.5 : 1} 
            emissive={highlighted ? "#ffffff" : "#000000"}
            emissiveIntensity={highlighted ? 0.3 : 0}
        />
      </mesh>

      <group position={[0, stemHeight, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial 
            color={actualPodColor} roughness={0.3} metalness={0.1} transparent opacity={isGhost ? 0.5 : 1} 
            emissive={highlighted ? actualPodColor : "#000000"}
            emissiveIntensity={highlighted ? 0.5 : 0}
          />
        </mesh>
        <mesh position={[0.4, -0.2, 0]} rotation={[0, 0, -0.5]} scale={[0.3, 0.1, 0.1]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshStandardMaterial color={leafColor} emissive={highlighted ? "#ffffff" : "#000000"} emissiveIntensity={highlighted ? 0.3 : 0} />
        </mesh>
        <mesh position={[-0.4, -0.2, 0]} rotation={[0, 0, 0.5]} scale={[0.3, 0.1, 0.1]}>
           <sphereGeometry args={[1, 16, 16]} />
           <meshStandardMaterial color={leafColor} emissive={highlighted ? "#ffffff" : "#000000"} emissiveIntensity={highlighted ? 0.3 : 0} />
        </mesh>
      </group>

      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.45, 0.35, 0.5, 16]} />
        <meshStandardMaterial color={isGhost ? "#475569" : "#78350f"} />
      </mesh>
      
      <mesh position={[0, 0.24, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#3f2e20" />
      </mesh>

      <Halo visible={highlighted} color="#fbbf24" scale={0.6} />
    </group>
  );
};

const GridBox = ({ 
    genotype, 
    position, 
    trait, 
    delay = 0,
    highlighted = false
}: { 
    genotype: string, 
    position: [number, number, number], 
    trait: TraitConfig, 
    delay: number,
    highlighted?: boolean
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const allele1Ref = useRef<THREE.Mesh>(null);
  const allele2Ref = useRef<THREE.Mesh>(null);
  const [showPlant, setShowPlant] = useState(false);
  
  // Animation Logic
  useFrame((state) => {
    if(!groupRef.current) return;
  });

  // Local animation state using a simple counter/timer effect for the drop
  const [animState, setAnimState] = useState(0); // 0 to 1 progress

  useEffect(() => {
    let start = performance.now();
    const animate = () => {
        const now = performance.now();
        const progress = Math.min((now - start) / 1500, 1); // 1.5s duration
        setAnimState(progress);
        if (progress < 1) requestAnimationFrame(animate);
        else setShowPlant(true);
    };
    
    // We only animate if we are mounting for the first time or genotype changes
    const timer = setTimeout(() => {
        requestAnimationFrame(animate);
    }, delay * 500);

    return () => clearTimeout(timer);
  }, [genotype, delay]);

  // Calculate positions based on animState (Physics bounce)
  const getDropY = (progress: number) => {
      // Bounce easing: https://easings.net/#easeOutBounce
      const n1 = 7.5625;
      const d1 = 2.75;
      let val = progress;
      if (val < 1 / d1) {
          return 1 - (n1 * val * val);
      } else if (val < 2 / d1) {
          return 1 - (n1 * (val -= 1.5 / d1) * val + 0.75);
      } else if (val < 2.5 / d1) {
          return 1 - (n1 * (val -= 2.25 / d1) * val + 0.9375);
      } else {
          return 1 - (n1 * (val -= 2.625 / d1) * val + 0.984375);
      }
  };
  
  // Inverse the bounce for dropping from sky (Start at Y=10, End at Y=0.2)
  const dropHeight = 8;
  const currentY = (1 - getDropY(animState)) * dropHeight;
  const scale = Math.min(animState * 2, 1); // Scale up alleles as they appear

  return (
    <group position={position}>
      {/* Base Plate */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
         <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
         <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.2} emissive={highlighted ? "#059669" : "#000000"} />
      </mesh>
      
      {!showPlant && (
          <>
             {/* Dropping Allele 1 */}
             <mesh ref={allele1Ref} position={[-0.2, 0.2 + currentY, 0]} scale={scale}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1} />
             </mesh>
             {/* Dropping Allele 2 */}
             <mesh ref={allele2Ref} position={[0.2, 0.2 + currentY + 0.5, 0]} scale={scale}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#f472b6" emissive="#db2777" emissiveIntensity={1} />
             </mesh>
             {/* Trails */}
             <Sparkles position={[0, currentY/2, 0]} scale={[0.5, currentY, 0.5]} count={10} color="white" opacity={0.5} size={2} />
          </>
      )}

      {/* Explosion/Poof effect when plant appears could be added here */}

      {showPlant && (
        <group scale={[0,0,0]} ref={(ref) => ref && (ref.scale.setScalar(1))}>
            <Sparkles count={20} scale={2} size={3} speed={0.4} opacity={1} color="#10b981" />
            <PeaPlant genotype={genotype} trait={trait} position={[0, 0.1, 0]} highlighted={highlighted} />
        </group>
      )}
      
      <Halo visible={highlighted} color="#10b981" />
    </group>
  );
};

interface SceneProps {
  p1Genotype: string;
  p2Genotype: string;
  punnettData: PunnettSquareData | null;
  currentTrait: TraitConfig;
  highlightTarget: HighlightTarget;
}

export const LabScene: React.FC<SceneProps> = ({ p1Genotype, p2Genotype, punnettData, currentTrait, highlightTarget }) => {
  return (
    <Canvas shadows camera={{ position: [0, 8, 14], fov: 45 }}>
      <color attach="background" args={['#020617']} />
      
      {/* Environment */}
      <fog attach="fog" args={['#020617', 15, 50]} />
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={50} scale={15} size={2} speed={0.4} opacity={0.3} color="#emerald" />
      <Environment preset="night" />
      
      {/* Cinematic Spotlight for Teacher Mode */}
      <CinematicSpotlight target={highlightTarget} />

      {/* Base Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[-10, 10, -10]} intensity={0.6} color="#3b82f6" />
      <pointLight position={[10, 10, 10]} intensity={0.6} color="#10b981" />
      
      {/* Static Spotlight on center */}
      {highlightTarget === 'none' && (
          <spotLight position={[0, 20, 5]} angle={0.4} penumbra={1} intensity={150} castShadow shadow-bias={-0.0001} />
      )}

      <OrbitControls 
        makeDefault 
        enablePan={true} 
        panSpeed={1}
        enableZoom={true}
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={5}
        maxDistance={30}
        dampingFactor={0.05}
      />

      {/* Floor Grid */}
      <group position={[0, -0.5, 0]}>
        <Grid infiniteGrid fadeDistance={40} fadeStrength={5} cellColor="#1e293b" sectionColor="#334155" sectionSize={4} cellSize={1} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      <DNAHelix highlighted={highlightTarget === 'dna'} />

      {/* --- Parents Section (Left Side) --- */}
      <group position={[-5, 0, 0]}>
        <Text position={[0, 4.5, -2]} fontSize={0.3} color="#94a3b8">Parent 1 (Male)</Text>
        <PeaPlant genotype={p1Genotype} trait={currentTrait} position={[0, 0, -2]} highlighted={highlightTarget === 'parents' || highlightTarget === 'genotypes'} />
        
        <Text position={[0, 4.5, 2]} fontSize={0.3} color="#94a3b8">Parent 2 (Female)</Text>
        <PeaPlant genotype={p2Genotype} trait={currentTrait} position={[0, 0, 2]} highlighted={highlightTarget === 'parents' || highlightTarget === 'genotypes'} />
        
        <Halo visible={highlightTarget === 'parents'} scale={4} />

        {/* Table under parents */}
        <mesh position={[0, -0.25, 0]} receiveShadow>
            <cylinderGeometry args={[2.5, 2.5, 0.5, 32]} />
            <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <ringGeometry args={[2.4, 2.5, 32]} />
             <meshBasicMaterial color="#3b82f6" />
        </mesh>
      </group>

      {/* --- Connection Path --- */}
      <group position={[-2.5, 0.1, 0]}>
         <Line points={[[-0.5, 0, -2], [3, 0, -2], [3, 0, -1.5]]} color="#334155" lineWidth={2} dashed dashScale={1} />
         <Line points={[[-0.5, 0, 2], [1, 0, 2], [1, 0, 0], [4.5, 0, 0]]} color="#334155" lineWidth={2} dashed dashScale={1} />
      </group>

      {/* --- Punnett Square Board (Center/Right) --- */}
      <group position={[4, 0, 0]}>
         {/* Board Base */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
            <boxGeometry args={[6, 0.2, 6]} />
            <meshStandardMaterial 
                color={highlightTarget === 'punnett_board' ? "#3b82f6" : "#334155"} 
                emissive={highlightTarget === 'punnett_board' ? "#1e40af" : "#000000"}
                metalness={0.6} roughness={0.2} 
            />
        </mesh>
        
        {/* Grid Lines */}
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[0.1, 5.5]} />
            <meshBasicMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI/2, 0, Math.PI/2]}>
            <planeGeometry args={[0.1, 5.5]} />
            <meshBasicMaterial color="#64748b" />
        </mesh>

        {punnettData ? (
          <>
            {/* Gametes Labels P1 (Top) */}
            <group position={[0, 0, -3.5]}>
                <Text position={[-1.5, 0.2, 0]} fontSize={0.6} color="#38bdf8" rotation={[-Math.PI/2,0,0]} outlineWidth={0.02}>{punnettData.p1Gametes[0]}</Text>
                <Text position={[1.5, 0.2, 0]} fontSize={0.6} color="#38bdf8" rotation={[-Math.PI/2,0,0]} outlineWidth={0.02}>{punnettData.p1Gametes[1]}</Text>
            </group>
            
             {/* Gametes Labels P2 (Left) */}
            <group position={[-3.5, 0, 0]}>
                <Text position={[0, 0.2, -1.5]} fontSize={0.6} color="#f472b6" rotation={[-Math.PI/2,0,0]} outlineWidth={0.02}>{punnettData.p2Gametes[0]}</Text>
                <Text position={[0, 0.2, 1.5]} fontSize={0.6} color="#f472b6" rotation={[-Math.PI/2,0,0]} outlineWidth={0.02}>{punnettData.p2Gametes[1]}</Text>
            </group>

            {/* Offspring Grid */}
            <GridBox genotype={punnettData.grid[0][0]} position={[-1.5, 0, -1.5]} trait={currentTrait} delay={0} highlighted={highlightTarget === 'offspring' || highlightTarget === 'cell_0'} />
            <GridBox genotype={punnettData.grid[0][1]} position={[1.5, 0, -1.5]} trait={currentTrait} delay={1} highlighted={highlightTarget === 'offspring' || highlightTarget === 'cell_1'} />
            <GridBox genotype={punnettData.grid[1][0]} position={[-1.5, 0, 1.5]} trait={currentTrait} delay={2} highlighted={highlightTarget === 'offspring' || highlightTarget === 'cell_2'} />
            <GridBox genotype={punnettData.grid[1][1]} position={[1.5, 0, 1.5]} trait={currentTrait} delay={3} highlighted={highlightTarget === 'offspring' || highlightTarget === 'cell_3'} />
          </>
        ) : (
             <group>
                <Float speed={2} floatIntensity={0.5}>
                    <Text position={[0, 1.5, 0]} fontSize={0.4} color="#94a3b8" textAlign="center" anchorY="middle">
                        Ready for Analysis
                    </Text>
                </Float>
                <mesh position={[0, 0.16, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <planeGeometry args={[5, 5]} />
                    <meshBasicMaterial color="#0f172a" opacity={0.3} transparent wireframe />
                </mesh>
            </group>
        )}
      </group>

      <ContactShadows opacity={0.6} scale={40} blur={2.5} far={4} resolution={512} color="#000000" />
    </Canvas>
  );
};