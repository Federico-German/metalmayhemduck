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
    // if (group.current && obj) {
    //   if (isPlaying) {
    //     group.current.rotation.x = Math.PI * 0.1;
    //     setTimeout(() => {
    //       if (group.current) {
    //         group.current.rotation.x = 0;
    //       }
    //     }, 200);
    //   } else {
    //     if (group.current) group.current.rotation.x = 0;
    //   }
    // }
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
  const cuackSoundRef = useRef<Tone.Player | null>(null);
  const guitarSoundRef = useRef<Tone.Player | null>(null);
  
  const [clickCount, setClickCount] = useState(0);
  const [isGuitarPlayingAnim, setIsGuitarPlayingAnim] = useState(false);
  const [isGuitarActive, setIsGuitarActive] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    console.log("Attempting to initialize Tone.js sounds...");
    let playerDisposed = false;

    const initAudio = async () => {
      try {
        if (!cuackSoundRef.current) {
          cuackSoundRef.current = new Tone.Player({
            url: "/assets/sounds/duck-quack.mp3",
            autostart: false,
          }).toDestination();
          console.log("Duck quack player initialized.");
        }

        if (!guitarSoundRef.current) {
          guitarSoundRef.current = new Tone.Player({
            url: "/assets/sounds/guitar.mp3",
            autostart: false,
          }).toDestination();
          console.log("Guitar sound player initialized.");
        }

        await Tone.loaded();
        if (playerDisposed) return; 
        console.log("All sounds loaded and ready.");

        if (Tone.context.state !== 'running') {
          try {
            Tone.start(); 
            console.log("Attempted to start Tone.js audio context after sounds loaded.");
          } catch (e) {
            console.warn("Could not auto-start audio context after load:", e);
          }
        }
      } catch (error) {
        if (playerDisposed) return;
        console.error("Error initializing Tone.js players or loading sounds:", error);
        toast({
          variant: "destructive",
          title: "Audio Initialization Error",
          description: "Could not create audio players or load sounds. Please check the console.",
        });
      }
    };

    initAudio();

    return () => {
      playerDisposed = true;
      cuackSoundRef.current?.dispose();
      guitarSoundRef.current?.dispose();
      console.log("Tone.js players disposed.");
    };
  }, [toast]);

  const onDuckClick = useCallback(async () => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log("Tone.js audio context started on click.");
      }

      const newClickCount = clickCount + 1;
      setClickCount(newClickCount);

      const shouldBeGuitarActive = newClickCount > 0 && newClickCount % 5 === 0;
      setIsGuitarActive(shouldBeGuitarActive);

      const clickTime = Tone.now();

      if (shouldBeGuitarActive) {
        if (guitarSoundRef.current && guitarSoundRef.current.loaded) {
          guitarSoundRef.current.start(clickTime);
        } else {
          console.warn("Guitar sound player not ready or sound not loaded yet.");
          toast({ variant: "destructive", title: "Sound Error", description: "Guitar sound not available."});
        }
      } else {
        if (cuackSoundRef.current && cuackSoundRef.current.loaded) {
          cuackSoundRef.current.start(clickTime);
        } else {
          console.warn("Duck quack player not ready or sound not loaded yet.");
          toast({ variant: "destructive", title: "Sound Error", description: "Duck sound not available."});
        }
      }
      
      setIsGuitarPlayingAnim(true);
      setTimeout(() => setIsGuitarPlayingAnim(false), 500); 

    } catch (e) {
      console.error("Error in onDuckClick (starting context or playing sound):", e);
      toast({ variant: "destructive", title: "Audio Playback Error", description: "Could not play sound. Please check console."});
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
