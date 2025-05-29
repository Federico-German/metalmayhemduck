"use client";

import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import * as Tone from 'tone';
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
      console.log("Loaded object structure:", obj);
      console.log("MTL MaterialCreator:", materials);
    }
  }, [obj, materials]);

  useEffect(() => {
    if (group.current && obj) {
      if (isPlaying) {
        group.current.rotation.x = Math.PI * 0.1;
        setTimeout(() => {
          if (group.current) {
            group.current.rotation.x = 0;
          }
        }, 200);
      } else {
        if (group.current) group.current.rotation.x = 0;
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

const MetalDuckScene: React.FC = () => {
  const cuackSoundRef = useRef<Tone.Synth | null>(null);
  const guitarSoundRef = useRef<Tone.PluckSynth | null>(null);
  
  const [clickCount, setClickCount] = useState(0);
  const [isGuitarPlayingAnim, setIsGuitarPlayingAnim] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    console.log("Attempting to initialize Tone.js synths...");
    try {
      if (!cuackSoundRef.current) {
        cuackSoundRef.current = new Tone.Synth({
          oscillator: { type: 'square' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 },
        }).toDestination();
        console.log("Cuack synth initialized.");
      }
      if (!guitarSoundRef.current) {
        guitarSoundRef.current = new Tone.PluckSynth({
          attackNoise: 1,
          dampening: 4000,
          resonance: 0.7
        }).toDestination();
        console.log("Guitar synth initialized.");
      }
    } catch (error) {
      console.error("Error initializing Tone.js synths:", error);
      toast({
        variant: "destructive",
        title: "Audio Initialization Error",
        description: "Could not create sound synthesizers. Please check the console.",
      });
    }

    return () => {
      cuackSoundRef.current?.dispose();
      guitarSoundRef.current?.dispose();
      console.log("Tone.js synths disposed.");
    };
  }, [toast]);

  const onDuckClick = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
        console.log("Tone.js audio context started.");
      } catch (e) {
        console.error("Error starting Tone.js audio context:", e);
        toast({ variant: "destructive", title: "Audio Error", description: "Could not start audio engine. Please check console."});
        return;
      }
    }

    if (cuackSoundRef.current) {
      cuackSoundRef.current.triggerAttackRelease("C5", "16n", Tone.now());
    } else {
      console.warn("Cuack synth not ready or failed to initialize.");
      toast({ variant: "destructive", title: "Sound Error", description: "Cuack sound not available."});
    }
    if (guitarSoundRef.current) {
      const now = Tone.now();
      guitarSoundRef.current.triggerAttackRelease("E2", "8n", now);
      guitarSoundRef.current.triggerAttackRelease("A2", "8n", now + 0.25);
      guitarSoundRef.current.triggerAttackRelease("D3", "8n", now + 0.5);
    } else {
      console.warn("Guitar synth not ready or failed to initialize.");
      toast({ variant: "destructive", title: "Sound Error", description: "Guitar sound not available."});
    }
    
    setIsGuitarPlayingAnim(true);
    setTimeout(() => setIsGuitarPlayingAnim(false), 500); 

    setClickCount(prevCount => prevCount + 1);
  }, [toast]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none p-4">
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 1, 10], fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 10, 5]} intensity={1.0} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <DuckModel onClick={onDuckClick} isPlaying={isGuitarPlayingAnim} />
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
