import { Question, TraitConfig } from './types';

export const HEIGHT_TRAIT: TraitConfig = {
  name: 'Height',
  dominantLabel: 'Tall',
  recessiveLabel: 'Dwarf',
  dominantAllele: 'T',
  recessiveAllele: 't',
  color: '#10b981', // Emerald
};

export const COLOR_TRAIT: TraitConfig = {
  name: 'Seed Color',
  dominantLabel: 'Yellow',
  recessiveLabel: 'Green',
  dominantAllele: 'Y',
  recessiveAllele: 'y',
  color: '#eab308', // Yellow
};

export const EXAM_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "In a monohybrid cross between a homozygous dominant (TT) and a homozygous recessive (tt) pea plant, what is the phenotype ratio of the F1 generation?",
    options: ["3 Tall : 1 Dwarf", "1 Tall : 1 Dwarf", "All Tall", "All Dwarf"],
    correctIndex: 2,
    explanation: "All offspring in F1 will be heterozygous (Tt), which expresses the dominant Tall phenotype.",
    marks: 1
  },
  {
    id: 2,
    text: "Which law explains the separation of alleles during gamete formation?",
    options: ["Law of Dominance", "Law of Segregation", "Law of Independent Assortment", "Law of Linkage"],
    correctIndex: 1,
    explanation: "Mendel's Law of Segregation states that allele pairs separate or segregate during gamete formation.",
    marks: 1
  },
  {
    id: 3,
    text: "If you cross two heterozygous tall plants (Tt x Tt), what is the probability of getting a Dwarf plant?",
    options: ["25%", "50%", "75%", "0%"],
    correctIndex: 0,
    explanation: "The Punnett square yields: TT, Tt, Tt, tt. Only 'tt' is dwarf, which is 1 out of 4 (25%).",
    marks: 5
  }
];

export const VIVA_QUESTIONS = [
  "Define an Allele with a simple example.",
  "What is the difference between Genotype and Phenotype?",
  "Why did Mendel choose the Pea Plant (Pisum sativum)?",
  "Explain the 'Law of Independent Assortment'."
];
