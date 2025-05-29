
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const MetalDuckScene: React.FC = () => {
  const cuackSoundRef = useRef<Tone.Synth | null>(null);
  const guitarSoundRef = useRef<Tone.PluckSynth | null>(null);
  
  const [clickCount, setClickCount] = useState(0);
  const [isGuitarPlayingAnim, setIsGuitarPlayingAnim] = useState(false);
  
  const { toast } = useToast();

  // Initialize Tone.js and synths
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
  }, [toast]); // Added toast to dependency array as it's used in the effect's error handling

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
      guitarSoundRef.current.triggerAttackRelease("E2", "8n", now); // Changed to a lower note for a more 'metal' feel
      guitarSoundRef.current.triggerAttackRelease("A2", "8n", now + 0.25);
      guitarSoundRef.current.triggerAttackRelease("D3", "8n", now + 0.5);
    } else {
      console.warn("Guitar synth not ready or failed to initialize.");
      toast({ variant: "destructive", title: "Sound Error", description: "Guitar sound not available."});
    }
    
    setIsGuitarPlayingAnim(true);
    setTimeout(() => setIsGuitarPlayingAnim(false), 500); 

    setClickCount(prevCount => {
      const newCount = prevCount + 1;
      // console.log(`Duck clicked ${newCount} times`); // Logging can be verbose, optionally remove
      return newCount;
    });
  }, [toast]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative select-none p-4">
      {/* CSS Duck */}
      <div 
        className={`relative cursor-pointer transition-transform duration-100 ease-in-out active:scale-95 ${isGuitarPlayingAnim ? 'animate-guitar-play' : ''}`}
        onClick={onDuckClick}
        aria-label="Metalhead CSS Duck"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDuckClick()}
      >
        {/* Duck Body */}
        <div className="w-48 h-36 bg-primary rounded-t-full rounded-b-lg shadow-lg relative">
          {/* Duck Head */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-28 h-28 bg-primary rounded-full border-2 border-primary-foreground/20">
             {/* Metal Head Piece (Hair/Helmet) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-12 bg-muted rounded-t-xl border-2 border-foreground/30 shadow-inner"></div>
            {/* Eye (simple version) */}
            <div className="absolute top-1/2 -translate-y-1/2 right-5 w-4 h-4 bg-foreground rounded-full"></div>
          </div>
           {/* Beak */}
          <div className="absolute top-3/4 left-full -translate-y-full -ml-1 w-10 h-6 bg-accent rounded-md transform -skew-y-6 shadow-sm border-2 border-accent-foreground/20"></div>
        
          {/* Simple Wings (relative to body) */}
          <div className="absolute top-1/4 -left-4 w-10 h-16 bg-primary rounded-l-full transform -rotate-12 origin-bottom-right border-2 border-primary-foreground/10"></div>
          <div className="absolute top-1/4 -right-4 w-10 h-16 bg-primary rounded-r-full transform rotate-12 origin-bottom-left border-2 border-primary-foreground/10"></div>
        </div>
      </div>

      {/* Click Counter Display */}
      <div className="absolute bottom-4 right-4">
        <Button variant="outline" className="bg-background/80 backdrop-blur-sm text-sm">
          Shred Count: {clickCount}
        </Button>
      </div>
    </div>
  );
};

export default MetalDuckScene;
