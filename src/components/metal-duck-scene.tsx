
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as Tone from 'tone';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // Optional: for dev camera control

// NOTE: Please create these directories and add your assets:
// - public/assets/models/duck.glb (Your 3D duck model)
// - public/assets/sounds/cuack.mp3
// - public/assets/sounds/guitar_riff.mp3

const MetalDuckScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const duckModelRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const guitarAnimActionRef = useRef<THREE.AnimationAction | null>(null);
  
  const cuackSoundRef = useRef<Tone.Player | null>(null);
  const guitarSoundRef = useRef<Tone.Player | null>(null);
  
  const [clickCount, setClickCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initializing scene...");
  const [isAnimatingGuitar, setIsAnimatingGuitar] = useState(false);
  const animationClock = useRef(new THREE.Clock());

  const placeholderCubeRef = useRef<THREE.Mesh | null>(null);

  // Initialize Tone.js and audio players
  useEffect(() => {
    setLoadingMessage("Loading sounds...");
    cuackSoundRef.current = new Tone.Player();
    guitarSoundRef.current = new Tone.Player();

    Promise.all([
      cuackSoundRef.current.load("/assets/sounds/cuack.mp3")
        .then(() => console.log("Cuack sound loaded successfully from /public/assets/sounds/cuack.mp3"))
        .catch(err => console.error("Error loading cuack.mp3. Ensure /public/assets/sounds/cuack.mp3 exists.", err)),
      guitarSoundRef.current.load("/assets/sounds/guitar_riff.mp3")
        .then(() => console.log("Guitar riff sound loaded successfully from /public/assets/sounds/guitar_riff.mp3"))
        .catch(err => console.error("Error loading guitar_riff.mp3. Ensure /public/assets/sounds/guitar_riff.mp3 exists.", err))
    ])
    .then(() => {
      console.log("All sounds preloading attempted.");
      cuackSoundRef.current?.toDestination();
      guitarSoundRef.current?.toDestination();
    })
    .catch(err => console.error("Error during sound preloading setup:", err));
  }, []);

  const onDuckClick = useCallback(async () => {
    if (isLoading || !duckModelRef.current || placeholderCubeRef.current) {
      console.warn('Duck model not fully loaded or placeholder is active, click action aborted.');
      return;
    }

    // Start Tone.js audio context on first user interaction
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
        console.log("Tone.js audio context started.");
      } catch (e) {
        console.error("Error starting Tone.js audio context:", e);
        return;
      }
    }

    // Play sounds
    if (cuackSoundRef.current?.loaded) {
      cuackSoundRef.current?.stop().start();
    } else {
      console.warn("Cuack sound not loaded, cannot play.");
    }
    if (guitarSoundRef.current?.loaded) {
      guitarSoundRef.current?.stop().start();
    } else {
      console.warn("Guitar sound not loaded, cannot play.");
    }
    

    // Trigger animation
    if (guitarAnimActionRef.current) {
      console.log("Playing GLTF animation.");
      guitarAnimActionRef.current.reset().play();
    } else {
      // Fallback programmatic animation
      console.log("Playing fallback programmatic animation.");
      setIsAnimatingGuitar(true);
      setTimeout(() => setIsAnimatingGuitar(false), 500); // Animate for 0.5 seconds
    }

    setClickCount(prevCount => {
      const newCount = prevCount + 1;
      console.log(`Duck clicked ${newCount} times`);
      return newCount;
    });
  }, [isLoading]);

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    setIsLoading(true);
    setLoadingMessage("Initializing 3D scene...");

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 4); 
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Load 3D Model
    setLoadingMessage("Loading 3D model (duck.glb)...");
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/assets/models/duck.glb', 
      (gltf) => {
        console.log('Duck model GLTF loaded successfully:', gltf);
        setLoadingMessage("Processing 3D model...");
        const model = gltf.scene;
        duckModelRef.current = model;
        model.scale.set(1, 1, 1); 
        model.position.set(0, 0, 0); 
        
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        camera.lookAt(model.position);

        if (gltf.animations && gltf.animations.length) {
          mixerRef.current = new THREE.AnimationMixer(model);
          const clip = THREE.AnimationClip.findByName(gltf.animations, 'guitar_play') || 
                       THREE.AnimationClip.findByName(gltf.animations, 'animation_0') || 
                       gltf.animations[0];
          if (clip) {
            console.log(`Using animation clip: ${clip.name}`);
            guitarAnimActionRef.current = mixerRef.current.clipAction(clip);
            guitarAnimActionRef.current.setLoop(THREE.LoopOnce, 1);
            guitarAnimActionRef.current.clampWhenFinished = true;
          } else {
            console.warn("No suitable 'guitar_play' (or fallback) animation found in model. Click will use programmatic animation.");
          }
        } else {
          console.warn("Model has no animations. Click will use programmatic animation.");
        }
        
        if (placeholderCubeRef.current) {
            scene.remove(placeholderCubeRef.current);
            placeholderCubeRef.current.geometry.dispose();
            (placeholderCubeRef.current.material as THREE.Material).dispose();
            placeholderCubeRef.current = null;
            console.log("Placeholder cube removed.");
        }
        setIsLoading(false);
        setLoadingMessage(""); 
      },
      (xhr) => { // onProgress callback
        const percentLoaded = (xhr.loaded / xhr.total) * 100;
        // console.log(`Model loading progress: ${percentLoaded.toFixed(2)}%`);
        if (percentLoaded < 100) {
          setLoadingMessage(`Loading 3D model: ${percentLoaded.toFixed(0)}%`);
        } else {
          setLoadingMessage("Processing 3D model...");
        }
      },
      (error) => {
        console.error('Error loading duck model. Please ensure /public/assets/models/duck.glb exists and is a valid GLB file. Check browser console for more details.', error);
        setLoadingMessage("Error loading model. Showing placeholder.");
        // Add a placeholder cube if model fails to load
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xffcc00 }); // Yellow cube
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0,0.5,0);
        scene.add(cube);
        placeholderCubeRef.current = cube;
        camera.lookAt(cube.position);
        setIsLoading(false); // Still set loading to false to remove general loading message
      }
    );

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!currentMount || !cameraRef.current || !sceneRef.current || isLoading) return;

      // Only proceed if the actual duck model is loaded, not the placeholder
      if (!duckModelRef.current || placeholderCubeRef.current) {
        console.log("Actual duck model not loaded or placeholder is active, click on canvas ignored for duck interaction.");
        return;
      }

      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Check intersection with the actual duck model
      const intersects = raycaster.intersectObject(duckModelRef.current, true);
      if (intersects.length > 0) {
        onDuckClick();
      }
    };
    currentMount.addEventListener('click', handleCanvasClick);
    
    // Handle window resize
    const handleResize = () => {
      if (!currentMount || !rendererRef.current || !cameraRef.current) return;
      cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = animationClock.current.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      if (isAnimatingGuitar && duckModelRef.current) {
        const time = animationClock.current.elapsedTime;
        duckModelRef.current.rotation.y = Math.sin(time * 10) * 0.2; 
      } else if (duckModelRef.current && !isAnimatingGuitar && !guitarAnimActionRef.current?.isRunning()) {
         if (duckModelRef.current.rotation.y !== 0) duckModelRef.current.rotation.y = 0;
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeEventListener('click', handleCanvasClick);
      if (rendererRef.current && rendererRef.current.domElement.parentNode === currentMount) {
         currentMount.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      sceneRef.current?.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          }
        }
      });
      cuackSoundRef.current?.dispose();
      guitarSoundRef.current?.dispose();
      console.log("MetalDuckScene cleaned up.");
    };
  }, [onDuckClick, isAnimatingGuitar]);

  return (
    <div ref={mountRef} className="w-full h-full relative">
      {isLoading && loadingMessage && (
        <div 
          style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)', 
            color: '#333', 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            padding: '10px 20px', 
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 10 
          }}
          aria-live="polite"
        >
          {loadingMessage}
        </div>
      )}
    </div>
  );
};

export default MetalDuckScene;

    