import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LabScene } from './components/LabScene';
import { UIOverlay } from './components/UIOverlay';
import { AppMode, PunnettSquareData, TraitConfig, HighlightTarget } from './types';
import { HEIGHT_TRAIT } from './constants';
import { generateMonohybridSquare, calculateStats } from './services/geneticsEngine';

const App: React.FC = () => {
  // --- State ---
  const [mode, setMode] = useState<AppMode>(AppMode.INTRO);
  
  // Experiment State
  const [currentTrait, setTrait] = useState<TraitConfig>(HEIGHT_TRAIT);
  const [p1Genotype, setP1Genotype] = useState<string>('Tt'); 
  const [p2Genotype, setP2Genotype] = useState<string>('Tt');
  
  const [punnettData, setPunnettData] = useState<PunnettSquareData | null>(null);
  const [stats, setStats] = useState<{ genotypeData: any[]; phenotypeData: any[] } | null>(null);

  // Teacher Mode State
  const [isTeaching, setIsTeaching] = useState(false);
  const [highlightTarget, setHighlightTarget] = useState<HighlightTarget>('none');
  const [teacherText, setTeacherText] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  
  // Refs for async closures and state tracking
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isTeachingRef = useRef(false);
  const playbackSpeedRef = useRef(1); // Use Ref to access fresh value inside timeouts/callbacks

  // Update ref when state changes
  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // --- Handlers ---

  const handleCross = useCallback(() => {
    // Generate the theoretical data
    const data = generateMonohybridSquare(p1Genotype, p2Genotype);
    setPunnettData(null); // Clear first to trigger animation reset
    
    // Small delay to allow reset, then show new data
    setTimeout(() => {
        setPunnettData(data);
        const calculatedStats = calculateStats(data.grid, currentTrait);
        setStats(calculatedStats);
    }, 100);
  }, [p1Genotype, p2Genotype, currentTrait]);

  const handleReset = useCallback(() => {
    setPunnettData(null);
    setStats(null);
    setHighlightTarget('none');
    stopTeaching();
  }, []);

  const handleTraitChange = (newTrait: TraitConfig) => {
    setTrait(newTrait);
    setP1Genotype(`${newTrait.dominantAllele}${newTrait.recessiveAllele}`);
    setP2Genotype(`${newTrait.dominantAllele}${newTrait.recessiveAllele}`);
    handleReset();
  };

  // --- Teacher / TTS Logic ---

  const getSpeakableAllele = (allele: string) => {
    if (allele === allele.toUpperCase()) return `Capital ${allele}`;
    return `Small ${allele}`;
  };

  const stopTeaching = () => {
    window.speechSynthesis.cancel();
    setIsTeaching(false);
    isTeachingRef.current = false;
    setHighlightTarget('none');
    setTeacherText('');
  };

  const speak = (text: string, callback?: () => void) => {
    window.speechSynthesis.cancel(); // Stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find an Indian English voice, fallback to others
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Hindi'));
    
    if (indianVoice) {
        utterance.voice = indianVoice;
    } 

    // Apply speed multiplier (Normal ~0.9, so 2x is 1.8)
    // Base rate 0.9 for clarity
    utterance.rate = 0.9 * playbackSpeedRef.current; 
    utterance.pitch = 1.0;

    utterance.onend = () => {
        if (callback) callback();
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startTeacherMode = () => {
    if (isTeachingRef.current) {
        stopTeaching();
        return;
    }

    // Ensure we are in experiment mode
    setMode(AppMode.EXPERIMENT);
    setIsTeaching(true);
    isTeachingRef.current = true;

    // Pre-calculate data for the script to use
    // NOTE: P1 is Male (Columns/Top), P2 is Female (Rows/Side) based on LabScene implementation
    const p1Gametes = p1Genotype.split('');
    const p2Gametes = p2Genotype.split('');
    const simData = generateMonohybridSquare(p1Genotype, p2Genotype);
    const calculatedStats = calculateStats(simData.grid, currentTrait);

    // --- Helper for Detailed Explanations ---
    const explainGenotype = (genotype: string) => {
        const dom = currentTrait.dominantAllele;
        const rec = currentTrait.recessiveAllele;
        const isDom = genotype.includes(dom);
        
        // Determine genetic makeup name
        let geneticName = "";
        let reasoning = "";

        if (genotype === dom + dom) {
            geneticName = "Homozygous Dominant";
            reasoning = `It possesses two dominant ${getSpeakableAllele(dom)} alleles.`;
        } else if (genotype === rec + rec) {
            geneticName = "Homozygous Recessive";
            reasoning = `It possesses two recessive ${getSpeakableAllele(rec)} alleles.`;
        } else {
            geneticName = "Heterozygous";
            reasoning = `The dominant ${getSpeakableAllele(dom)} allele masks the expression of the recessive ${getSpeakableAllele(rec)} allele.`;
        }

        const phenotype = isDom ? currentTrait.dominantLabel : currentTrait.recessiveLabel;

        return `The resulting genotype is ${getSpeakableAllele(genotype[0])} ${getSpeakableAllele(genotype[1])}, which is ${geneticName}. ${reasoning} Therefore, the phenotype is ${phenotype}.`;
    };

    const script = [
        { 
            text: `Welcome to the Virtual Genetics Lab. We will now analyze the inheritance of ${currentTrait.name} in Pisum sativum.`,
            target: 'dna',
            delay: 1000  // Reduced from 3000
        },
        { 
            text: `Observe the parents. The Male parent genotype is ${getSpeakableAllele(p1Genotype[0])} ${getSpeakableAllele(p1Genotype[1])}. The Female genotype is ${getSpeakableAllele(p2Genotype[0])} ${getSpeakableAllele(p2Genotype[1])}.`,
            target: 'parents',
            delay: 1000 // Reduced from 5000
        },
        { 
            text: "According to Mendel's Law of Segregation, these allele pairs separate during gamete formation, so each gamete receives only one allele.",
            target: 'genotypes',
            delay: 800 // Reduced from 4000
        },
        { 
            text: "Let us simulate the fertilization process.",
            target: 'punnett_board',
            action: handleCross,
            delay: 500 // Reduced from 2000
        },
        // Detailed Analysis Step-by-Step
        { 
            text: `In the first quadrant: The Mother contributes ${getSpeakableAllele(p2Gametes[0])}, and the Father contributes ${getSpeakableAllele(p1Gametes[0])}. ${explainGenotype(simData.grid[0][0])}`,
            target: 'cell_0',
            delay: 1000 // Reduced from 9000
        },
        { 
            text: `Moving to the top-right: The Mother contributes ${getSpeakableAllele(p2Gametes[0])}, but the Father contributes ${getSpeakableAllele(p1Gametes[1])}. ${explainGenotype(simData.grid[0][1])}`,
            target: 'cell_1',
            delay: 1000 // Reduced from 9000
        },
        { 
            text: `In the bottom-left: The Mother contributes ${getSpeakableAllele(p2Gametes[1])}, and the Father contributes ${getSpeakableAllele(p1Gametes[0])}. ${explainGenotype(simData.grid[1][0])}`,
            target: 'cell_2',
            delay: 1000 // Reduced from 9000
        },
        { 
            text: `Finally, the bottom-right: The Mother contributes ${getSpeakableAllele(p2Gametes[1])}, and the Father contributes ${getSpeakableAllele(p1Gametes[1])}. ${explainGenotype(simData.grid[1][1])}`,
            target: 'cell_3',
            delay: 1000 // Reduced from 9000
        },
        // Conclusion and Stats
        { 
            text: "Now, let us examine the Analysis Results on the right panel.",
            target: 'offspring',
            delay: 500
        },
        { 
            text: `Phenotypically, the offspring ratio is: ${calculatedStats.phenotypeData.map((d: any) => `${d.value} ${d.name}`).join(', and ')}.`,
            target: 'offspring',
            delay: 500
        },
        { 
            text: `Genotypically, we observe: ${calculatedStats.genotypeData.map((d: any) => `${d.value} ${d.name}`).join(', and ')}.`,
            target: 'offspring',
            delay: 500
        },
        { 
            text: "This concludes the analysis of this generation. You may now explore freely.",
            target: 'none',
            action: stopTeaching,
            delay: 100
        }
    ];

    let stepIndex = 0;

    const runNextStep = () => {
        // Critical: Check the ref, not the state variable from the closure scope
        if (!isTeachingRef.current && stepIndex > 0) return; 

        if (stepIndex >= script.length) {
            stopTeaching();
            return;
        }

        const step = script[stepIndex];
        setHighlightTarget(step.target as HighlightTarget);
        setTeacherText(step.text);
        
        if (step.action) {
            step.action();
        }

        if (step.text) {
             speak(step.text, () => {
                stepIndex++;
                setTimeout(runNextStep, step.delay);
            });
        } else {
            stepIndex++;
            setTimeout(runNextStep, step.delay);
        }
    };

    // Initialize voices (browser quirk fix) then start
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
             // Only start if we haven't already and the user hasn't cancelled
             if (stepIndex === 0 && isTeachingRef.current) runNextStep();
        };
    } else {
        runNextStep();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
        isTeachingRef.current = false;
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden">
      
      {/* 3D Background Layer */}
      <div className="absolute inset-0 z-0">
        <LabScene 
          p1Genotype={p1Genotype} 
          p2Genotype={p2Genotype} 
          punnettData={punnettData}
          currentTrait={currentTrait}
          highlightTarget={highlightTarget}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        <UIOverlay 
          mode={mode}
          setMode={setMode}
          p1Genotype={p1Genotype}
          setP1Genotype={setP1Genotype}
          p2Genotype={p2Genotype}
          setP2Genotype={setP2Genotype}
          currentTrait={currentTrait}
          setTrait={handleTraitChange}
          onCross={handleCross}
          onReset={handleReset}
          punnettData={punnettData}
          stats={stats}
          onStartTeacher={startTeacherMode}
          isTeaching={isTeaching}
          teacherText={teacherText}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
        />
      </div>
    </div>
  );
};

export default App;