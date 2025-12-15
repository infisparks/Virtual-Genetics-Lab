export type Allele = 'T' | 't' | 'Y' | 'y'; // T=Tall, t=Short, Y=Yellow, y=Green

export interface TraitConfig {
  name: string;
  dominantLabel: string;
  recessiveLabel: string;
  dominantAllele: Allele;
  recessiveAllele: Allele;
  color: string;
}

export interface OrganismState {
  id: string;
  genotype: string; // e.g., "Tt"
  phenotype: string; // e.g., "Tall"
  color: string;
  height: number;
}

export interface PunnettSquareData {
  p1Gametes: string[];
  p2Gametes: string[];
  grid: string[][]; // 2x2 grid of genotypes
}

export enum AppMode {
  INTRO = 'INTRO',
  EXPERIMENT = 'EXPERIMENT',
  PRACTICE = 'PRACTICE',
  EXAM = 'EXAM',
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  marks: number;
}

export type HighlightTarget = 'none' | 'dna' | 'parents' | 'genotypes' | 'punnett_board' | 'offspring' | 'cell_0' | 'cell_1' | 'cell_2' | 'cell_3';
