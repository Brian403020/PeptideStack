import { ReconstitutionInput, ReconstitutionResult } from "./types";

/**
 * Calculates peptide reconstitution variables based on inputs.
 * U-100 syringe standards: 1 Unit = 0.01 mL.
 */
export function calculateReconstitution(input: ReconstitutionInput): ReconstitutionResult {
  const { vialMg, bacWaterMl, syringeUnits, tickMarks, desiredMcg } = input;

  // Total micrograms in the vial
  const totalMcg = vialMg * 1000;

  // Concentration in mcg/mL
  const mcgPerMl = bacWaterMl > 0 ? totalMcg / bacWaterMl : 0;

  // In standard U-100 syringes, 1 Unit is always 0.01 mL (10 microliters)
  const mcgPerUnit = mcgPerMl * 0.01;

  // Tick marks calibration
  // For a 100 Unit syringe:
  // - 100 ticks means 1 unit per tick.
  // - 50 ticks means 2 units per tick.
  const unitsPerTick = tickMarks > 0 ? syringeUnits / tickMarks : 1;
  const mcgPerTick = mcgPerUnit * unitsPerTick;

  // Calculate required units and ticks for the desired dose
  const unitsNeeded = mcgPerUnit > 0 ? desiredMcg / mcgPerUnit : 0;
  const ticksNeeded = mcgPerTick > 0 ? desiredMcg / mcgPerTick : 0;

  // Safety checks
  const isDosageTooHigh = unitsNeeded > syringeUnits;

  return {
    mcgPerMl: Math.round(mcgPerMl * 100) / 100,
    mcgPerUnit: Math.round(mcgPerUnit * 100) / 100,
    mcgPerTick: Math.round(mcgPerTick * 100) / 100,
    unitsNeeded: Math.round(unitsNeeded * 100) / 100,
    ticksNeeded: Math.round(ticksNeeded * 100) / 100,
    isDosageTooHigh,
  };
}

/**
 * Renders a simple visual code or identifier for styling colors
 */
export function getTailwindColorClass(colorName: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  accent: string;
} {
  switch (colorName) {
    case "blue":
      return {
        bg: "bg-blue-50/70 dark:bg-blue-950/20",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-900/50",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
        accent: "bg-blue-600 dark:bg-blue-500",
      };
    case "emerald":
      return {
        bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-900/50",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
        accent: "bg-emerald-600 dark:bg-emerald-500",
      };
    case "violet":
      return {
        bg: "bg-violet-50/70 dark:bg-violet-950/20",
        text: "text-violet-700 dark:text-violet-300",
        border: "border-violet-200 dark:border-violet-900/50",
        badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
        accent: "bg-violet-600 dark:bg-violet-500",
      };
    case "amber":
      return {
        bg: "bg-amber-50/70 dark:bg-amber-950/20",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-900/50",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
        accent: "bg-amber-600 dark:bg-amber-500",
      };
    case "rose":
      return {
        bg: "bg-rose-50/70 dark:bg-rose-950/20",
        text: "text-rose-700 dark:text-rose-300",
        border: "border-rose-200 dark:border-rose-900/50",
        badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200",
        accent: "bg-rose-600 dark:bg-rose-500",
      };
    default:
      return {
        bg: "bg-slate-50/70 dark:bg-slate-900/40",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-slate-200 dark:border-slate-800",
        badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
        accent: "bg-slate-600 dark:bg-slate-500",
      };
  }
}
