import React, { useState } from 'react';
import { 
  Dna, 
  FlaskConical, 
  BookOpen, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  GraduationCap,
  Microscope,
  Info,
  ChevronRight,
  ArrowRight,
  MousePointer2,
  User,
  Volume2,
  Square,
  MessageSquareQuote,
  Zap
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { AppMode, PunnettSquareData, TraitConfig } from '../types';
import { HEIGHT_TRAIT, COLOR_TRAIT, EXAM_QUESTIONS, VIVA_QUESTIONS } from '../constants';

interface UIProps {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  p1Genotype: string;
  setP1Genotype: (s: string) => void;
  p2Genotype: string;
  setP2Genotype: (s: string) => void;
  currentTrait: TraitConfig;
  setTrait: (t: TraitConfig) => void;
  onCross: () => void;
  onReset: () => void;
  punnettData: PunnettSquareData | null;
  stats: { genotypeData: any[]; phenotypeData: any[] } | null;
  onStartTeacher: () => void;
  isTeaching: boolean;
  teacherText?: string;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

// Reusable Components
const GlassPanel = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
    <div className={`bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl ${className}`}>
        {children}
    </div>
);

const GenotypeSelector = ({ 
    label, 
    value, 
    onChange, 
    options 
}: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    options: { code: string, desc: string }[] 
}) => (
    <div className="mb-4">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
            {label}
        </label>
        <div className="flex gap-2">
            {options.map((opt) => (
                <button
                    key={opt.code}
                    onClick={() => onChange(opt.code)}
                    className={`flex-1 py-3 px-2 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1
                        ${value === opt.code 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                            : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:bg-slate-700 hover:border-slate-500 hover:text-slate-300'
                        }`}
                >
                    <span className="font-mono text-lg font-bold">{opt.code}</span>
                    <span className="text-[10px] uppercase font-semibold opacity-70">{opt.desc}</span>
                </button>
            ))}
        </div>
    </div>
);

export const UIOverlay: React.FC<UIProps> = ({
  mode,
  setMode,
  p1Genotype,
  setP1Genotype,
  p2Genotype,
  setP2Genotype,
  currentTrait,
  setTrait,
  onCross,
  onReset,
  punnettData,
  stats,
  onStartTeacher,
  isTeaching,
  teacherText,
  playbackSpeed,
  setPlaybackSpeed
}) => {
  const [activeTab, setActiveTab] = useState<'genotype' | 'phenotype'>('phenotype');
  const [practiceAnswer, setPracticeAnswer] = useState<string>('');
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);

  // Exam state
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [showExamResults, setShowExamResults] = useState(false);

  const handleExamSelect = (qId: number, optionIndex: number) => {
    setExamAnswers(prev => ({ ...prev, [qId]: optionIndex }));
  };

  const getGenotypeOptions = (trait: TraitConfig) => [
      { code: `${trait.dominantAllele}${trait.dominantAllele}`, desc: 'Hom. Dom' },
      { code: `${trait.dominantAllele}${trait.recessiveAllele}`, desc: 'Hetero' },
      { code: `${trait.recessiveAllele}${trait.recessiveAllele}`, desc: 'Hom. Rec' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      
      {/* Header Navigation */}
      <header className="pointer-events-auto mx-auto max-w-5xl w-full">
         <GlassPanel className="p-2 flex justify-between items-center px-6">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-400 to-blue-500 p-2 rounded-lg shadow-lg">
                    <Dna className="text-white w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-white tracking-tight leading-none">Virtual Genetics Lab</h1>
                    <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Mendelian Simulation v1.0</p>
                </div>
            </div>

            <nav className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                {[
                    { id: AppMode.INTRO, label: 'Learn', icon: BookOpen },
                    { id: AppMode.EXPERIMENT, label: 'Lab', icon: FlaskConical },
                    { id: AppMode.PRACTICE, label: 'Practice', icon: Microscope },
                    { id: AppMode.EXAM, label: 'Exam', icon: GraduationCap },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setMode(item.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                            mode === item.id 
                            ? 'bg-slate-700 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                    >
                        <item.icon size={14} />
                        <span className="hidden sm:inline">{item.label}</span>
                    </button>
                ))}
            </nav>
         </GlassPanel>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative mt-4 flex justify-between items-start">
        
        {/* LEFT PANEL: Controls */}
        {mode === AppMode.EXPERIMENT && (
          <GlassPanel className="pointer-events-auto w-80 p-5 animate-slide-in-left backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-2 mb-6 border-b border-slate-700/50 pb-4">
               <div className="flex items-center gap-2">
                 <FlaskConical className="text-emerald-400" size={20}/>
                 <h2 className="text-lg font-bold text-white">Experiment Config</h2>
               </div>
               
               {/* Teacher Button */}
               <button 
                onClick={onStartTeacher}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 shadow-md ${
                    isTeaching 
                    ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' 
                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 hover:scale-105'
                }`}
                title={isTeaching ? "Stop Explanation" : "Start Virtual Professor Tour"}
               >
                 {isTeaching ? (
                     <>
                        <Square size={12} fill="currentColor" />
                        <span className="text-xs font-bold">Stop</span>
                     </>
                 ) : (
                     <>
                        <User size={16}/> 
                        <span className="text-xs font-bold">Professor</span>
                     </>
                 )}
               </button>
            </div>

            {/* Trait Selection Toggle */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Trait Selection</label>
              <div className="bg-slate-800/50 p-1 rounded-xl flex border border-slate-700">
                <button 
                  onClick={() => { setTrait(HEIGHT_TRAIT); onReset(); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${currentTrait.name === 'Height' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Height (T/t)
                </button>
                <button 
                  onClick={() => { setTrait(COLOR_TRAIT); onReset(); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${currentTrait.name === 'Seed Color' ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Color (Y/y)
                </button>
              </div>
            </div>

            {/* Genotype Selectors */}
            <GenotypeSelector 
                label="Parent 1 (Male)" 
                value={p1Genotype} 
                onChange={setP1Genotype}
                options={getGenotypeOptions(currentTrait)} 
            />
            
            <GenotypeSelector 
                label="Parent 2 (Female)" 
                value={p2Genotype} 
                onChange={setP2Genotype}
                options={getGenotypeOptions(currentTrait)} 
            />

            {/* Actions */}
            <div className="flex gap-2 mt-8">
              <button 
                onClick={onCross}
                disabled={isTeaching}
                className={`flex-1 group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 ${isTeaching ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {punnettData ? 'Recalculate Cross' : 'Cross Parents'} 
                    <Dna size={18} className="group-hover:rotate-180 transition-transform duration-500"/>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
              
              <button 
                onClick={onReset}
                disabled={isTeaching}
                className="p-3 bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white border border-slate-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Reset Experiment"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            
            <div className="mt-4 flex flex-col gap-2 justify-center text-[10px] text-slate-500 text-center">
               <div className="flex items-center gap-2 justify-center">
                 <MousePointer2 size={12} />
                 <span>Left Click: Rotate • Right Click: Pan</span>
               </div>
            </div>
          </GlassPanel>
        )}

        {/* RIGHT PANEL: Results */}
        {mode === AppMode.EXPERIMENT && punnettData && stats && (
          <GlassPanel className="pointer-events-auto w-80 p-5 animate-slide-in-right relative">
             <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-4">
                <h2 className="text-lg font-bold text-white">Analysis Results</h2>
                <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-400 font-mono">
                    F1 Gen
                </div>
             </div>
             
             <div className="flex bg-slate-800/50 rounded-lg p-1 mb-4 border border-slate-700">
               <button 
                 className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${activeTab === 'genotype' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
                 onClick={() => setActiveTab('genotype')}
               >
                 Genotype
               </button>
               <button 
                 className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${activeTab === 'phenotype' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-slate-300'}`}
                 onClick={() => setActiveTab('phenotype')}
               >
                 Phenotype
               </button>
             </div>

             <div className="h-48 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={activeTab === 'genotype' ? stats.genotypeData : stats.phenotypeData}
                     cx="50%"
                     cy="50%"
                     innerRadius={45}
                     outerRadius={70}
                     paddingAngle={4}
                     dataKey="value"
                     stroke="none"
                   >
                     {(activeTab === 'genotype' ? stats.genotypeData : stats.phenotypeData).map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <ReTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               {/* Center Text overlay */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-2xl font-bold text-white">4</span>
                    <span className="text-[10px] text-slate-400 uppercase">Offspring</span>
                  </div>
               </div>
             </div>

             <div className="space-y-3 mt-2">
                {(activeTab === 'genotype' ? stats.genotypeData : stats.phenotypeData).map((item, idx) => (
                   <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-8 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length]}}></span>
                        <div>
                            <span className="text-sm font-bold text-slate-200 block">{item.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{activeTab}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-mono font-bold text-emerald-400 text-lg">{Math.round(item.percent)}%</span>
                        <span className="text-[10px] text-slate-500">{item.value} of 4</span>
                      </div>
                   </div>
                ))}
             </div>
          </GlassPanel>
        )}
      </main>

      {/* Teacher Overlay Instructions & Subtitles */}
      {isTeaching && (
          <div className="pointer-events-auto fixed bottom-8 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-6 shadow-2xl animate-fade-in z-50 flex flex-col gap-4">
              <div className="flex items-start gap-5">
                  <div className="relative shrink-0 mt-1">
                      <div className="absolute inset-0 bg-emerald-500/30 blur-xl rounded-full"></div>
                      <User size={40} className="relative z-10 text-emerald-400 bg-slate-800 p-2 rounded-full border border-emerald-500/50" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping z-20"></div>
                  </div>
                  <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                          <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                              <Volume2 size={14} /> Professor Speaking
                          </h3>
                          <button onClick={onStartTeacher} className="text-slate-500 hover:text-white transition-colors">
                              <XCircle size={18} />
                          </button>
                      </div>
                      <p className="text-white text-lg font-medium leading-relaxed font-serif italic">
                          "{teacherText}"
                      </p>
                  </div>
              </div>

              {/* Speed Controls */}
              <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mr-2 flex items-center gap-1">
                    <Zap size={12}/> Playback Speed
                  </span>
                  {[1, 1.5, 2, 3].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setPlaybackSpeed(rate)}
                        className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                            playbackSpeed === rate 
                            ? 'bg-emerald-500 text-white shadow-lg' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {rate}x
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* FULL SCREEN MODALS (INTRO, PRACTICE, EXAM) */}
      
      {/* INTRO MODE */}
      {mode === AppMode.INTRO && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
           <GlassPanel className="max-w-4xl w-full p-8 relative overflow-hidden">
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
             <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

             <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 text-center md:text-left">
                    <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                        Interactive Module
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                        Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Mendelian Genetics</span>
                    </h2>
                    <p className="text-slate-300 text-lg leading-relaxed mb-8">
                        Step into a virtual laboratory. Simulate crosses, visualize Punnett Squares in 3D, and understand the laws of inheritance that define life itself.
                    </p>
                    
                    <button 
                        onClick={() => setMode(AppMode.EXPERIMENT)}
                        className="group bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto md:mx-0"
                    >
                        Start Experiment <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>

                <div className="flex-1 w-full grid gap-4">
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Info size={20}/></div>
                             <h3 className="text-white font-bold">The Law of Dominance</h3>
                        </div>
                        <p className="text-slate-400 text-sm">
                            In a heterozygote (Tt), the dominant allele (T) conceals the presence of the recessive allele (t).
                        </p>
                    </div>
                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Dna size={20}/></div>
                             <h3 className="text-white font-bold">Law of Segregation</h3>
                        </div>
                        <p className="text-slate-400 text-sm">
                           During gamete formation, allele pairs separate so that each gamete carries only one allele for each gene.
                        </p>
                    </div>
                </div>
             </div>
           </GlassPanel>
        </div>
      )}

      {/* PRACTICE MODE */}
      {mode === AppMode.PRACTICE && (
         <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <GlassPanel className="max-w-xl w-full p-8 text-center relative border-t-4 border-purple-500">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 p-2 rounded-full border border-slate-700">
                <div className="bg-purple-500 p-3 rounded-full text-white shadow-lg shadow-purple-500/30">
                    <Microscope size={24} />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mt-6 mb-2">Quick Quiz</h2>
              <p className="text-slate-400 mb-8 text-sm">Test your knowledge before the final exam.</p>

              <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mb-8">
                  <p className="text-lg text-slate-200 font-medium mb-2">
                    Cross: <span className="text-emerald-400 font-mono font-bold">TT</span> × <span className="text-emerald-400 font-mono font-bold">tt</span>
                  </p>
                  <p className="text-slate-400">What is the genotype of the offspring?</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                 {['TT', 'Tt', 'tt'].map((opt) => (
                     <button 
                        key={opt}
                        onClick={() => { 
                            setPracticeAnswer(opt); 
                            setPracticeFeedback(opt === 'Tt' ? 'correct' : 'wrong'); 
                        }} 
                        className={`py-4 rounded-xl border-2 font-mono text-xl font-bold transition-all
                            ${practiceAnswer === opt 
                                ? (opt === 'Tt' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-red-500/20 border-red-500 text-red-300')
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                            }`}
                     >
                         {opt}
                     </button>
                 ))}
              </div>

              {practiceFeedback === 'correct' && (
                <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl flex items-center justify-center gap-3 animate-bounce-short border border-emerald-500/20">
                  <CheckCircle2 /> 
                  <span className="font-semibold">Correct! Heterozygous (Tt) is the only outcome.</span>
                </div>
              )}
              {practiceFeedback === 'wrong' && (
                <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center justify-center gap-3 border border-red-500/20">
                  <XCircle /> 
                  <span className="font-semibold">Try again! Hint: P1 gives T, P2 gives t.</span>
                </div>
              )}
              
              <button onClick={() => { setPracticeFeedback(null); setPracticeAnswer(''); }} className="mt-6 text-slate-500 hover:text-white text-sm underline underline-offset-4">Skip Question</button>
           </GlassPanel>
         </div>
      )}

      {/* EXAM MODE */}
      {mode === AppMode.EXAM && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
           <GlassPanel className="max-w-6xl w-full h-[90vh] flex flex-col md:flex-row overflow-hidden bg-white/5 border-slate-700">
             
             {/* Question Area */}
             <div className="flex-1 p-8 overflow-y-auto bg-slate-900/50">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                            <GraduationCap className="text-emerald-500"/> Final Assessment
                        </h2>
                        <p className="text-slate-400 mt-1">Mumbai University • B.Sc. Zoology</p>
                    </div>
                    <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 font-mono text-sm">
                        Total Marks: {EXAM_QUESTIONS.reduce((acc, q) => acc + q.marks, 0)}
                    </div>
                </div>
                
                <div className="space-y-8">
                  {EXAM_QUESTIONS.map((q, idx) => (
                    <div key={q.id} className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-slate-200">
                              <span className="text-emerald-500 mr-2">Q{idx+1}.</span> {q.text}
                          </h3>
                          <span className="bg-slate-700 text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{q.marks} Marks</span>
                      </div>
                      
                      <div className="space-y-2 pl-4">
                        {q.options.map((opt, optIdx) => (
                           <label key={optIdx} className={`group flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${examAnswers[q.id] === optIdx ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900/30 border-slate-700 hover:bg-slate-800'}`}>
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${examAnswers[q.id] === optIdx ? 'border-emerald-500' : 'border-slate-500 group-hover:border-slate-400'}`}>
                                {examAnswers[q.id] === optIdx && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                             </div>
                             <input 
                               type="radio" 
                               name={`q-${q.id}`} 
                               checked={examAnswers[q.id] === optIdx}
                               onChange={() => handleExamSelect(q.id, optIdx)}
                               className="hidden"
                             />
                             <span className={examAnswers[q.id] === optIdx ? 'text-emerald-300 font-medium' : 'text-slate-400 group-hover:text-slate-200'}>{opt}</span>
                           </label>
                        ))}
                      </div>
                      
                      {showExamResults && (
                         <div className={`mt-4 p-4 rounded-xl text-sm flex gap-3 items-start animate-fade-in ${examAnswers[q.id] === q.correctIndex ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                            {examAnswers[q.id] === q.correctIndex ? <CheckCircle2 className="shrink-0"/> : <XCircle className="shrink-0"/>}
                            <div>
                                <strong className="block mb-1">{examAnswers[q.id] === q.correctIndex ? 'Correct Answer' : 'Incorrect'}</strong>
                                {q.explanation}
                            </div>
                         </div>
                      )}
                    </div>
                  ))}
                </div>

                {!showExamResults && (
                    <button 
                        onClick={() => setShowExamResults(true)}
                        className="mt-8 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        Submit & Check Results <ChevronRight />
                    </button>
                )}
             </div>

             {/* Viva Sidebar */}
             <div className="w-full md:w-80 bg-slate-950/80 p-6 border-l border-slate-700 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Oral Exam (Viva)</h3>
                <ul className="space-y-4">
                   {VIVA_QUESTIONS.map((vq, idx) => (
                      <li key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                         <div className="text-emerald-500 font-mono text-xs mb-2">Question {idx+1}</div>
                         <p className="text-slate-300 text-sm leading-relaxed">{vq}</p>
                      </li>
                   ))}
                </ul>
                <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                   <h4 className="text-blue-400 text-xs font-bold uppercase mb-2">Professor's Note</h4>
                   <p className="text-slate-400 text-xs">Remember to distinguish between Phenotype (physical appearance) and Genotype (genetic makeup) during your viva.</p>
                </div>
             </div>
           </GlassPanel>
        </div>
      )}

    </div>
  );
};