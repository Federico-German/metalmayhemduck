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
  const [isAnimatingGuitar, setIsAnimatingGuitar] = useState(false);
  const animationClock = useRef(new THREE.Clock());

  const placeholderCubeRef = useRef<THREE.Mesh | null>(null);

  // Initialize Tone.js and audio players
  useEffect(() => {
    cuackSoundRef.current = new Tone.Player("/assets/sounds/cuack.mp3").toDestination();
    guitarSoundRef.current = new Tone.Player("/assets/sounds/guitar_riff.mp3").toDestination();
    // It's good practice to load sounds before playing
    Promise.all([cuackSoundRef.current.load("/assets/sounds/cuack.mp3"), guitarSoundRef.current.load("/assets/sounds/guitar_riff.mp3")])
      .catch(err => console.error("Error loading sounds:", err));
  }, []);

  const onDuckClick = useCallback(async () => {
    if (isLoading || !duckModelRef.current) return;

    // Start Tone.js audio context on first user interaction
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    // Play sounds
    cuackSoundRef.current?.stop().start();
    guitarSoundRef.current?.stop().start();

    // Trigger animation
    if (guitarAnimActionRef.current) {
      guitarAnimActionRef.current.reset().play();
    } else {
      // Fallback programmatic animation
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

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    // scene.background = new THREE.Color(0xf5f5dc); // Set by globals.css on parent

    // Camera
    const camera = new THREE.PerspectiveCamera(50, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 4); // Adjusted camera position
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Increased intensity
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5); // Increased intensity
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Optional: OrbitControls for development
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;

    // Load 3D Model
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'); // CDN for Draco decoder
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/assets/models/duck.glb', // Ensure this path is correct
      (gltf) => {
        const model = gltf.scene;
        duckModelRef.current = model;
        model.scale.set(1, 1, 1); // Adjust scale as needed
        model.position.set(0, 0, 0); // Center the duck
        
        // Enable shadows for all meshes in the model
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        camera.lookAt(model.position); // Ensure camera looks at the model

        // Setup animation
        if (gltf.animations && gltf.animations.length) {
          mixerRef.current = new THREE.AnimationMixer(model);
          // Try to find an animation named 'guitar_play' or similar
          const clip = THREE.AnimationClip.findByName(gltf.animations, 'guitar_play') || 
                       THREE.AnimationClip.findByName(gltf.animations, 'animation_0') || // Common default names
                       gltf.animations[0]; // Fallback to the first animation
          if (clip) {
            guitarAnimActionRef.current = mixerRef.current.clipAction(clip);
            guitarAnimActionRef.current.setLoop(THREE.LoopOnce, 1);
            guitarAnimActionRef.current.clampWhenFinished = true;
          } else {
            console.warn("No suitable 'guitar_play' animation found in model.");
          }
        } else {
          console.warn("Model has no animations.");
        }
        setIsLoading(false);
        if (placeholderCubeRef.current) {
            scene.remove(placeholderCubeRef.current);
            placeholderCubeRef.current.geometry.dispose();
            (placeholderCubeRef.current.material as THREE.Material).dispose();
            placeholderCubeRef.current = null;
        }
      },
      undefined, // onProgress callback (optional)
      (error) => {
        console.error('Error loading duck model:', error);
        setIsLoading(false);
        // Add a placeholder cube if model fails to load
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0,0.5,0);
        scene.add(cube);
        placeholderCubeRef.current = cube;
        camera.lookAt(cube.position);
      }
    );

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!currentMount || !duckModelRef.current) return;
      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(duckModelRef.current, true);
      if (intersects.length > 0) {
        onDuckClick();
      }
    };
    currentMount.addEventListener('click', handleCanvasClick);
    
    // Handle window resize
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
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
        // Simple programmatic animation: slight rotation
        const time = animationClock.current.elapsedTime;
        duckModelRef.current.rotation.y = Math.sin(time * 10) * 0.2; // Quick shake
      } else if (duckModelRef.current && !isAnimatingGuitar && !guitarAnimActionRef.current?.isRunning()) {
         // Reset rotation if programmatic animation finished
         if (duckModelRef.current.rotation.y !== 0) duckModelRef.current.rotation.y = 0;
      }
      // controls?.update(); // If using OrbitControls
      renderer.render(scene, camera);
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
          (object.material as THREE.Material)?.dispose();
        }
      });
      cuackSoundRef.current?.dispose();
      guitarSoundRef.current?.dispose();
    };
  }, [onDuckClick, isAnimatingGuitar]); // Added isAnimatingGuitar to dependencies

  return <div ref={mountRef} className="w-full h-full" />;
};

export default MetalDuckScene;
