import { PunnettSquareData, TraitConfig } from '../types';

/**
 * Calculates the Phenotype label based on genotype and trait config.
 * Simple dominance logic: If dominant allele exists, show dominant trait.
 */
export const getPhenotype = (genotype: string, trait: TraitConfig): string => {
  if (genotype.includes(trait.dominantAllele)) {
    return trait.dominantLabel;
  }
  return trait.recessiveLabel;
};

/**
 * Generates data for a Monohybrid Punnett Square.
 */
export const generateMonohybridSquare = (
  p1Genotype: string,
  p2Genotype: string
): PunnettSquareData => {
  // Split genotypes into alleles (gametes)
  const p1Gametes = p1Genotype.split('');
  const p2Gametes = p2Genotype.split('');

  const grid: string[][] = [];

  // Create 2x2 grid
  // Row 0: P2_Gamete_0 mixing with P1 gametes
  // Row 1: P2_Gamete_1 mixing with P1 gametes
  // Wait, standard visualization:
  //      P1_0   P1_1
  // P2_0  x      x
  // P2_1  x      x

  for (let i = 0; i < 2; i++) {
    const row: string[] = [];
    for (let j = 0; j < 2; j++) {
      // Combine alleles. Convention: Capital first.
      const allele1 = p2Gametes[i];
      const allele2 = p1Gametes[j];
      
      // Sort so 'tT' becomes 'Tt'
      const combined = [allele1, allele2].sort().join('');
      row.push(combined);
    }
    grid.push(row);
  }

  return {
    p1Gametes,
    p2Gametes,
    grid,
  };
};

export const calculateStats = (grid: string[][], trait: TraitConfig) => {
  const flat = grid.flat();
  const total = flat.length;
  
  const genotypes: Record<string, number> = {};
  const phenotypes: Record<string, number> = {};

  flat.forEach(geno => {
    // Genotype Count
    genotypes[geno] = (genotypes[geno] || 0) + 1;

    // Phenotype Count
    const pheno = getPhenotype(geno, trait);
    phenotypes[pheno] = (phenotypes[pheno] || 0) + 1;
  });

  const genotypeData = Object.keys(genotypes).map(key => ({
    name: key,
    value: genotypes[key],
    percent: (genotypes[key] / total) * 100
  }));

  const phenotypeData = Object.keys(phenotypes).map(key => ({
    name: key,
    value: phenotypes[key],
    percent: (phenotypes[key] / total) * 100
  }));

  return { genotypeData, phenotypeData };
};