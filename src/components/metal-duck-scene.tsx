
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { useToast } from '@/hooks/use-toast'; // Kept for potential future use or audio errors
import { Button } from '@/components/ui/button'; // For click count display

const MetalDuckScene: React.FC = () => {
  const cuackSoundRef = useRef<Tone.Synth | null>(null);
  const guitarSoundRef = useRef<Tone.PluckSynth | null>(null);
  
  const [clickCount, setClickCount] = useState(0);
  const [isGuitarPlayingAnim, setIsGuitarPlayingAnim] = useState(false);
  
  const { toast } = useToast();

  // Initialize Tone.js and synths
  useEffect(() => {
    // Ensure Tone.Synth/PluckSynth is created only once
    if (!cuackSoundRef.current) {
      cuackSoundRef.current = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 },
      }).toDestination();
    }
    if (!guitarSoundRef.current) {
      guitarSoundRef.current = new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 4000,
        resonance: 0.7
      }).toDestination();
    }
    console.log("Tone.js synths initialized for cuack and guitar.");

    return () => {
      cuackSoundRef.current?.dispose();
      guitarSoundRef.current?.dispose();
      console.log("Tone.js synths disposed.");
    };
  }, []);

  const onDuckClick = useCallback(async () => {
    // Start Tone.js audio context on first user interaction
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
        console.log("Tone.js audio context started.");
      } catch (e) {
        console.error("Error starting Tone.js audio context:", e);
        toast({ variant: "destructive", title: "Audio Error", description: "Could not start audio engine."});
        return;
      }
    }

    // Play sounds
    if (cuackSoundRef.current) {
      cuackSoundRef.current.triggerAttackRelease("C5", "16n", Tone.now());
    } else {
      console.warn("Cuack synth not ready.");
    }
    if (guitarSoundRef.current) {
      // A simple "riff" - sequence of notes
      const now = Tone.now();
      guitarSoundRef.current.triggerAttackRelease("G3", "8n", now);
      guitarSoundRef.current.triggerAttackRelease("C4", "8n", now + 0.2);
      guitarSoundRef.current.triggerAttackRelease("D4", "8n", now + 0.4);
    } else {
      console.warn("Guitar synth not ready.");
    }
    
    // Trigger animation
    setIsGuitarPlayingAnim(true);
    setTimeout(() => setIsGuitarPlayingAnim(false), 500); // Duration of animation

    setClickCount(prevCount => {
      const newCount = prevCount + 1;
      console.log(`Duck clicked ${newCount} times`);
      return newCount;
    });
  }, [toast]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
      {/* CSS Duck */}
      <div 
        className={`relative cursor-pointer transition-transform duration-100 ease-in-out active:scale-95 ${isGuitarPlayingAnim ? 'animate-guitar-play' : ''}`}
        onClick={onDuckClick}
        aria-label="Metalhead Duck"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onDuckClick()}
      >
        {/* Duck Body */}
        <div className="w-48 h-36 bg-primary rounded-t-full rounded-b-lg shadow-lg">
          {/* Duck Head */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-28 h-28 bg-primary rounded-full ">
             {/* Metal Head Piece */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-10 bg-gray-400 rounded-t-full border-2 border-gray-500"></div>
            {/* Eye */}
            <div className="absolute top-1/3 right-4 w-4 h-4 bg-black rounded-full"></div>
          </div>
           {/* Beak */}
          <div className="absolute top-1/2 left-full -translate-y-1/2 -ml-2 w-10 h-6 bg-accent rounded-md transform -skew-y-6 shadow-sm"></div>
        </div>
        {/* Optional: Simple Wings */}
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/4 w-10 h-16 bg-primary rounded-l-full transform rotate-[-30deg] origin-bottom-right"></div>
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/4 w-10 h-16 bg-primary rounded-r-full transform rotate-[30deg] origin-bottom-left"></div>
      </div>

      {/* Click Counter Display */}
      <div className="absolute bottom-4 right-4">
        <Button variant="outline" className="bg-background/80 backdrop-blur-sm">
          Clicks: {clickCount}
        </Button>
      </div>
    </div>
  );
};

export default MetalDuckScene;
