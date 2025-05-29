"use client";

import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
// import * as Tone from 'tone'; // Removed Tone.js
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const DuckModel = ({ onClick, isPlaying }: { onClick: () => void, isPlaying: boolean }) => {
  const group = useRef<THREE.Group>(null);

  const materials = useLoader(MTLLoader, '/assets/models/RubberDuck_LOD0.mtl');
  const obj = useLoader(OBJLoader, '/assets/models/RubberDuck_LOD0.obj', (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  useEffect(() => {
    if (obj && group.current) {
      group.current.rotation.y = Math.PI; 
      console.log("OBJ loaded with MTL materials. BaseColor texture should be applied if found by MTLLoader.");
      // console.log("Loaded object structure:", obj);
      // console.log("MTL MaterialCreator:", materials);
    }
  }, [obj, materials]);

  // Simplified animation effect, can be expanded
  useEffect(() => {
    if (group.current && obj) {
      if (isPlaying) {
        group.current.rotation.x = Math.PI * 0.05; // Subtle tilt
        setTimeout(() => {
          if (group.current) {
            group.current.rotation.x = 0;
          }
        }, 200); // Duration of tilt
      } else {
        // Ensure it returns to 0 if not playing (or was playing and stopped)
        // group.current.rotation.x = 0; // This might fight the timed reset, consider carefully
      }
    }
  }, [isPlaying, obj]);


  if (!obj) {
    return <mesh><boxGeometry args={[0.1,0.1,0.1]}/><meshBasicMaterial color="red" wireframe/></mesh>;
  }

  return (
    obj ? (
      <group ref={group} onClick={onClick}>
        <primitive 
          object={obj} 
          scale={0.1}
          position={[0, -0.5, 0]}
        />
      </group>
    ) : null
  );
};

const GuitarModel = () => {
  const group = useRef<THREE.Group>(null);
  const guitarMtl = useLoader(MTLLoader, '/assets/models/guitar/talor 514ce.mtl');
  const guitarObj = useLoader(OBJLoader, '/assets/models/guitar/talor 514ce.obj', (loader) => {
    guitarMtl.preload();
    loader.setMaterials(guitarMtl);
  });

  useEffect(() => {
    if (guitarObj && group.current) {
      console.log("Guitar OBJ loaded with MTL materials.");
    }
  }, [guitarObj, guitarMtl]);

  if (!guitarObj) {
    return <mesh position={[0,0,1]}><boxGeometry args={[0.2,0.2,0.2]}/><meshBasicMaterial color="red" /></mesh>;
  }

  return (
    guitarObj ? (
      <group ref={group} position={[-2.25, -0.45, 1]} rotation={[0, -Math.PI / 2, 0]}>
        <primitive 
          object={guitarObj} 
          scale={0.12}
        />
      </group>
    ) : null
  );
};

const MetalDuckScene: React.FC = () => {
  const cuackAudioRef = useRef<HTMLAudioElement | null>(null); // Using HTMLAudioElement
  const guitarAudioRef = useRef<HTMLAudioElement | null>(null); // Using HTMLAudioElement
  
  const [clickCount, setClickCount] = useState(0);
  const [isGuitarPlayingAnim, setIsGuitarPlayingAnim] = useState(false);
  const [isGuitarActive, setIsGuitarActive] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    console.log("Initializing native HTML Audio elements...");
    
    // Initialize Duck Sound
    const duckSound = new Audio("/assets/sounds/duck-quack.mp3");
    duckSound.preload = "auto";
    duckSound.oncanplaythrough = () => console.log("Duck quack audio can play through.");
    duckSound.onerror = (e) => {
        console.error("Error loading duck quack audio:", e);
        toast({ variant: "destructive", title: "Audio Load Error", description: "Could not load duck sound."});
    };
    cuackAudioRef.current = duckSound;

    // Initialize Guitar Sound
    const guitarSound = new Audio("/assets/sounds/guitar.mp3");
    guitarSound.preload = "auto";
    guitarSound.oncanplaythrough = () => console.log("Guitar audio can play through.");
    guitarSound.onerror = (e) => {
        console.error("Error loading guitar audio:", e);
        toast({ variant: "destructive", title: "Audio Load Error", description: "Could not load guitar sound."});
    };
    guitarAudioRef.current = guitarSound;

    console.log("Native HTML Audio elements initialized.");

    return () => {
      // Optional: Clean up audio elements if needed, e.g., pause, remove src
      if (cuackAudioRef.current) {
        cuackAudioRef.current.pause();
        cuackAudioRef.current.src = ""; // Release resource
      }
      if (guitarAudioRef.current) {
        guitarAudioRef.current.pause();
        guitarAudioRef.current.src = ""; // Release resource
      }
      console.log("Native HTML Audio elements cleaned up.");
    };
  }, [toast]);

  const onDuckClick = useCallback(async () => {
    console.log("[onDuckClick] Entered. Current clickCount:", clickCount);
    
    const newClickCount = clickCount + 1;
    const shouldBeGuitarActive = newClickCount > 0 && newClickCount % 5 === 0;
    console.log(`[onDuckClick] newClickCount: ${newClickCount}, shouldBeGuitarActive: ${shouldBeGuitarActive}`);

    try {
      if (shouldBeGuitarActive) {
        console.log("[onDuckClick] Attempting to play GUITAR sound.");
        if (guitarAudioRef.current) {
          guitarAudioRef.current.currentTime = 0; // Play from start
          await guitarAudioRef.current.play();
          console.log("[onDuckClick] Guitar sound played via HTMLAudioElement.");
        } else {
          console.warn("[onDuckClick] Guitar audio element not ready.");
          toast({ variant: "destructive", title: "Sound Error", description: "Guitar sound not initialized."});
        }
      } else {
        console.log("[onDuckClick] Attempting to play DUCK sound.");
        if (cuackAudioRef.current) {
          cuackAudioRef.current.currentTime = 0; // Play from start
          await cuackAudioRef.current.play();
          console.log("[onDuckClick] Duck sound played via HTMLAudioElement.");
        } else {
          console.warn("[onDuckClick] Duck audio element not ready.");
          toast({ variant: "destructive", title: "Sound Error", description: "Duck sound not initialized."});
        }
      }
      
      setClickCount(newClickCount);
      setIsGuitarActive(shouldBeGuitarActive);

      setIsGuitarPlayingAnim(true);
      setTimeout(() => setIsGuitarPlayingAnim(false), 500); 

    } catch (e) {
      console.error("[onDuckClick] Error playing sound via HTMLAudioElement:", e);
      toast({ variant: "destructive", title: "Audio Playback Error", description: "Could not play sound. Browser might have blocked it or file issue."});
    }
  }, [clickCount, toast]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none p-4">
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 1, 10], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 10, 5]} intensity={10.5} />
            <pointLight position={[-10, -10, -10]} intensity={1.7} />
            <DuckModel onClick={onDuckClick} isPlaying={isGuitarPlayingAnim} />
            {isGuitarActive && <GuitarModel />}
            <Environment preset="city" />
            <OrbitControls enableZoom={true} />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute bottom-4 right-4">
        <Button variant="outline" className="bg-background/80 backdrop-blur-sm text-sm">
          Shred Count: {clickCount}
        </Button>
      </div>
    </div>
  );
};

export default MetalDuckScene;
