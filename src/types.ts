export interface Peptide {
  id: string;
  name: string;
  fullName: string;
  category: "healing" | "weight" | "gh" | "cosmetic" | "cognitive" | "other";
  class: string;
  description: string;
  halfLife: string;
  molecularWeight?: string;
  sequence?: string;
  standardReconstitution: string; // e.g. "2mL BAC Water"
  dosageRange: string; // e.g. "250 - 500 mcg daily"
  protocols: string; // Typical research cycle and schedule
}

export interface ReconstitutionInput {
  vialMg: number;       // e.g. 5 (for 5mg)
  bacWaterMl: number;   // e.g. 2 (for 2mL)
  syringeUnits: number; // 100 (for 1mL/100U), 50 (for 0.5mL/50U), 30 (for 0.3mL/30U)
  tickMarks: number;    // 100 (1 unit per mark) or 50 (2 units per mark)
  desiredMcg: number;   // e.g. 250 (for 250mcg)
}

export interface ReconstitutionResult {
  mcgPerMl: number;
  mcgPerUnit: number;
  mcgPerTick: number;
  unitsNeeded: number;
  ticksNeeded: number;
  isDosageTooHigh: boolean;
}

export interface StackPeptide {
  id: string; // Unique instance ID in this stack
  peptideId: string; // ID of the reference peptide (or "custom")
  name: string;
  vialSizeMg: number;
  bacWaterMl: number;
  dosageMcg: number;
  syringeSize: number; // 100 | 50 | 30
  syringeTicks: number; // 100 | 50
  calculatedUnits: number;
  calculatedTicks: number;
  scheduleType: "daily" | "eod" | "weekdays" | "custom";
  customDays: string[]; // ['Mon', 'Wed', 'Fri'] etc.
  timesOfDay: string[]; // ['Morning', 'Noon', 'Evening', 'Before Bed']
  durationWeeks: number;
}

export interface PeptideStack {
  id: string;
  name: string;
  description: string;
  peptides: StackPeptide[];
  createdAt: string;
  color: string; // Tailwind color class like 'blue', 'emerald', 'violet', 'amber'
}

export interface HistoryLog {
  id: string;
  stackId: string;
  stackName: string;
  peptideName: string;
  dosageMcg: number;
  takenAt: string; // ISO date string
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  peptideId: string; // reference to peptide id or "custom"
  name: string;
  vialSizeMg: number;
  quantity: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}
