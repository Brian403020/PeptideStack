import { useState, useEffect } from "react";
import { ReconstitutionInput, Peptide } from "../types";
import { calculateReconstitution } from "../utils";
import SyringeVisualizer from "./SyringeVisualizer";
import { Info, HelpCircle, AlertTriangle, Plus, Trash2, Calendar, Sparkles } from "lucide-react";

interface ReconstitutionCalculatorProps {
  initialPeptide?: Peptide | null;
  onAddToStack?: (data: {
    name: string;
    vialSizeMg: number;
    bacWaterMl: number;
    dosageMcg: number;
    syringeSize: number;
    syringeTicks: number;
  }) => void;
}

interface TitrationPhase {
  id: string;
  dose: number;
  unit: "mcg" | "mg";
  frequency: "daily" | "eod" | "3x_week" | "weekly";
  duration: number;
  durationUnit: "weeks" | "days";
}

export default function ReconstitutionCalculator({
  initialPeptide,
  onAddToStack,
}: ReconstitutionCalculatorProps) {
  // Toggle between Peptide Dosage Calculator (reconstitution) and Cycle & Vial Calculator
  const [activeSubTab, setActiveSubTab] = useState<"dose" | "cycle">("dose");

  // --- 1. PEPTIDE DOSAGE CALCULATOR STATE ---
  const [inputs, setInputs] = useState<ReconstitutionInput>({
    vialMg: 5,
    bacWaterMl: 2,
    syringeUnits: 100,
    tickMarks: 100,
    desiredMcg: 250,
  });

  // Handle preset filling when a peptide is passed
  useEffect(() => {
    if (initialPeptide) {
      let parsedVial = 5;
      if (initialPeptide.id === "ghk-cu") parsedVial = 50;
      else if (initialPeptide.id === "tirzepatide") parsedVial = 10;
      else if (initialPeptide.id === "epitalon") parsedVial = 10;

      let parsedDose = 250;
      if (initialPeptide.id === "semaglutide") parsedDose = 250;
      else if (initialPeptide.id === "tirzepatide") parsedDose = 2500;
      else if (initialPeptide.id === "ghk-cu") parsedDose = 2000;
      else if (initialPeptide.id === "epitalon") parsedDose = 5000;
      else if (initialPeptide.id === "tb-500") parsedDose = 2500;

      setInputs({
        vialMg: parsedVial,
        bacWaterMl: 2,
        syringeUnits: 100,
        tickMarks: 100,
        desiredMcg: parsedDose,
      });
      // Automatically switch to dosage tab if initial peptide selected
      setActiveSubTab("dose");
    }
  }, [initialPeptide]);

  const results = calculateReconstitution(inputs);

  const handleInputChange = (field: keyof ReconstitutionInput, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [field]: isNaN(value) ? 0 : value,
    }));
  };

  const handlePlungerChange = (newUnits: number) => {
    const { vialMg, bacWaterMl } = inputs;
    const totalMcg = vialMg * 1000;
    const mcgPerMl = bacWaterMl > 0 ? totalMcg / bacWaterMl : 0;
    const mcgPerUnit = mcgPerMl * 0.01;

    const calculatedDose = Math.round(newUnits * mcgPerUnit);
    setInputs((prev) => ({
      ...prev,
      desiredMcg: calculatedDose,
    }));
  };

  const setVialPreset = (mg: number) => handleInputChange("vialMg", mg);
  const setBacPreset = (ml: number) => handleInputChange("bacWaterMl", ml);
  const setDosePreset = (mcg: number) => handleInputChange("desiredMcg", mcg);

  const calculatedDosesPerVial = inputs.desiredMcg > 0 ? Math.floor((inputs.vialMg * 1000) / inputs.desiredMcg) : 0;

  // --- 2. CYCLE & VIAL CALCULATOR STATE ---
  const [cycleVialSize, setCycleVialSize] = useState<number>(5);
  const [cycleDiluent, setCycleDiluent] = useState<number>(2);
  const [phases, setPhases] = useState<TitrationPhase[]>([
    {
      id: "phase-1",
      dose: 250,
      unit: "mcg",
      frequency: "daily",
      duration: 4,
      durationUnit: "weeks",
    }
  ]);

  // Suggested Cycle Presets
  const handleApplyCyclePreset = (preset: string) => {
    switch (preset) {
      case "glp1_titration":
        setCycleVialSize(5);
        setCycleDiluent(2);
        setPhases([
          { id: "p1", dose: 250, unit: "mcg", frequency: "weekly", duration: 4, durationUnit: "weeks" },
          { id: "p2", dose: 500, unit: "mcg", frequency: "weekly", duration: 4, durationUnit: "weeks" },
          { id: "p3", dose: 1000, unit: "mcg", frequency: "weekly", duration: 4, durationUnit: "weeks" },
        ]);
        break;
      case "glp1_micro":
        setCycleVialSize(5);
        setCycleDiluent(2);
        setPhases([
          { id: "p1", dose: 125, unit: "mcg", frequency: "eod", duration: 8, durationUnit: "weeks" },
        ]);
        break;
      case "healing_daily":
        setCycleVialSize(5);
        setCycleDiluent(2);
        setPhases([
          { id: "p1", dose: 250, unit: "mcg", frequency: "daily", duration: 4, durationUnit: "weeks" },
        ]);
        break;
      case "gh_pulse":
        setCycleVialSize(5);
        setCycleDiluent(2);
        setPhases([
          { id: "p1", dose: 100, unit: "mcg", frequency: "daily", duration: 12, durationUnit: "weeks" },
        ]);
        break;
      case "cosmetic_ghk":
        setCycleVialSize(50);
        setCycleDiluent(3);
        setPhases([
          { id: "p1", dose: 2000, unit: "mcg", frequency: "daily", duration: 4, durationUnit: "weeks" },
        ]);
        break;
      case "fat_loss_aod":
        setCycleVialSize(5);
        setCycleDiluent(2);
        setPhases([
          { id: "p1", dose: 300, unit: "mcg", frequency: "daily", duration: 6, durationUnit: "weeks" },
        ]);
        break;
      case "mots_weekly":
        setCycleVialSize(10);
        setCycleDiluent(2);
        setPhases([
          { id: "p1", dose: 5000, unit: "mcg", frequency: "weekly", duration: 4, durationUnit: "weeks" },
        ]);
        break;
      default:
        break;
    }
  };

  const handleAddPhase = () => {
    const newPhase: TitrationPhase = {
      id: Math.random().toString(),
      dose: 250,
      unit: "mcg",
      frequency: "daily",
      duration: 4,
      durationUnit: "weeks",
    };
    setPhases([...phases, newPhase]);
  };

  const handleRemovePhase = (id: string) => {
    if (phases.length > 1) {
      setPhases(phases.filter(p => p.id !== id));
    }
  };

  const handleUpdatePhase = (id: string, updates: Partial<TitrationPhase>) => {
    setPhases(phases.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // --- MATHEMATICAL MATH FOR CYCLE VIALS ---
  const calculateCycleRequirements = () => {
    let totalPeptideNeededMg = 0;
    let totalDays = 0;

    phases.forEach((p) => {
      let freqMultiplier = 1;
      if (p.frequency === "daily") freqMultiplier = 1;
      else if (p.frequency === "eod") freqMultiplier = 0.5;
      else if (p.frequency === "3x_week") freqMultiplier = 3 / 7;
      else if (p.frequency === "weekly") freqMultiplier = 1 / 7;

      const phaseDays = p.durationUnit === "weeks" ? p.duration * 7 : p.duration;
      totalDays += phaseDays;

      const injectionsCount = Math.ceil(phaseDays * freqMultiplier);
      const doseInMg = p.unit === "mcg" ? p.dose / 1000 : p.dose;
      totalPeptideNeededMg += injectionsCount * doseInMg;
    });

    const vialsNeeded = cycleVialSize > 0 ? Math.ceil(totalPeptideNeededMg / cycleVialSize) : 0;
    const totalPeptideInVialsMg = vialsNeeded * cycleVialSize;
    const totalDiluentNeededMl = vialsNeeded * cycleDiluent;

    return {
      totalDays,
      totalPeptideNeededMg,
      vialsNeeded,
      totalPeptideInVialsMg,
      totalDiluentNeededMl,
    };
  };

  const cycleResults = calculateCycleRequirements();

  return (
    <div className="space-y-4">
      
      {/* Subtab Segmented Control */}
      <div className="flex justify-center mb-1">
        <div className="bg-[#0A0D12] p-1 border border-slate-800/80 rounded-xl flex gap-1.5 w-full max-w-lg shadow-inner">
          <button
            onClick={() => setActiveSubTab("dose")}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "dose"
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Peptide Dosage Calculator
          </button>
          <button
            onClick={() => setActiveSubTab("cycle")}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "cycle"
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Cycle &amp; Vial Calculator
          </button>
        </div>
      </div>

      {activeSubTab === "dose" ? (
        // ==========================================
        // TABS: PEPTIDE DOSAGE CALCULATOR (DOSE CALC)
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#0F1219] p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 block animate-pulse" />
                PEPTIDE DOSAGE CALCULATOR
              </h2>

              <div className="space-y-4">
                
                {/* Syringe Volume */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1.5">
                    Syringe Size
                  </label>
                  <select
                    value={inputs.syringeUnits}
                    onChange={(e) => handleInputChange("syringeUnits", parseInt(e.target.value))}
                    className="w-full bg-[#0A0D12] px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500/70 text-slate-200 font-mono"
                  >
                    <option value={100}>1ml (100 units)</option>
                    <option value={50}>0.5ml (50 units)</option>
                    <option value={30}>0.3ml (30 units)</option>
                  </select>
                </div>

                {/* Peptide Vial Quantity (inputs.vialMg) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1">
                      Peptide Amount (mg)
                    </label>
                    <div className="flex gap-1">
                      {[2, 5, 10, 50].map((val) => (
                        <button
                          key={`vial-${val}`}
                          type="button"
                          onClick={() => setVialPreset(val)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                            inputs.vialMg === val
                              ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-bold"
                              : "bg-[#0A0D12] text-slate-500 border-slate-800 hover:bg-[#151B26] hover:text-slate-300"
                          }`}
                        >
                          {val}mg
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={inputs.vialMg || ""}
                      onChange={(e) => handleInputChange("vialMg", parseFloat(e.target.value))}
                      className="w-full bg-[#0A0D12] px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500/70 font-mono text-slate-200"
                    />
                  </div>
                </div>

                {/* Bacteriostatic Water Added (inputs.bacWaterMl) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1">
                      Diluent (mL)
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((val) => (
                        <button
                          key={`bac-${val}`}
                          type="button"
                          onClick={() => setBacPreset(val)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                            inputs.bacWaterMl === val
                              ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-bold"
                              : "bg-[#0A0D12] text-slate-500 border-slate-800 hover:bg-[#151B26] hover:text-slate-300"
                          }`}
                        >
                          {val}mL
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={inputs.bacWaterMl || ""}
                      onChange={(e) => handleInputChange("bacWaterMl", parseFloat(e.target.value))}
                      className="w-full bg-[#0A0D12] px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500/70 font-mono text-slate-200"
                    />
                  </div>
                </div>

                {/* Desired Dosage */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1">
                      Desired Dose (mcg)
                    </label>
                    <div className="flex gap-1">
                      {[100, 250, 500, 1000].map((val) => (
                        <button
                          key={`dose-${val}`}
                          type="button"
                          onClick={() => setDosePreset(val)}
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                            inputs.desiredMcg === val
                              ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-bold"
                              : "bg-[#0A0D12] text-slate-500 border-slate-800 hover:bg-[#151B26] hover:text-slate-300"
                          }`}
                        >
                          {val >= 1000 ? `${val / 1000}mg` : `${val}mcg`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="5"
                      step="any"
                      value={inputs.desiredMcg || ""}
                      onChange={(e) => handleInputChange("desiredMcg", parseInt(e.target.value))}
                      className="w-full bg-[#0A0D12] px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500/70 font-mono text-slate-200"
                    />
                  </div>
                </div>

              </div>

              {onAddToStack && (
                <div className="pt-4 border-t border-slate-800/80">
                  <button
                    onClick={() =>
                      onAddToStack({
                        name: initialPeptide?.name || "Custom Peptide",
                        vialSizeMg: inputs.vialMg,
                        bacWaterMl: inputs.bacWaterMl,
                        dosageMcg: inputs.desiredMcg,
                        syringeSize: inputs.syringeUnits,
                        syringeTicks: inputs.tickMarks,
                      })
                    }
                    className="w-full py-2.5 px-3 bg-[#151B26] hover:bg-[#1E2738] text-slate-200 border border-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider"
                  >
                    Add to Active Stack Builder
                  </button>
                </div>
              )}
            </div>

            {/* Safety Panel */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-500/90 leading-relaxed font-semibold">
                <strong className="font-bold block mb-0.5 font-sans">Lab Calibration Notice</strong>
                Make sure you draw water slowly to avoid negative pressure or air bubbles. Standard insulin needles have non-removable hubs where a small dead-space volume is physically calibrated.
              </div>
            </div>
          </div>

          {/* Right Column: Pull guides and syringe */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* PULL TO THIS LINE Card */}
            <div className="bg-[#0A0D12] p-5 rounded-xl border border-indigo-500/20 shadow-md space-y-4 text-center">
              <div>
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-indigo-400">
                  Pull To This Line
                </span>
                <div className="text-4xl font-black text-slate-200 font-mono mt-1">
                  {results.isDosageTooHigh ? "N/A" : results.unitsNeeded.toFixed(1)}
                </div>
                <span className="text-xs text-slate-400 font-bold font-mono tracking-wider uppercase">units</span>
              </div>

              <div className="space-y-1 text-[11px] font-bold text-slate-400 leading-relaxed max-w-xs mx-auto">
                <p>
                  Pull to the <span className="text-indigo-400 font-mono font-black">{results.isDosageTooHigh ? "N/A" : results.unitsNeeded.toFixed(1)}</span> mark on your syringe or <span className="text-slate-200 font-mono">{(results.unitsNeeded * 0.01).toFixed(3)} ml</span>
                </p>
                <p className="text-[10px] text-slate-500 font-bold">
                  {calculatedDosesPerVial} full doses per vial
                </p>
              </div>
            </div>

            {/* Live interactive syringe */}
            <SyringeVisualizer
              units={results.unitsNeeded}
              syringeSize={inputs.syringeUnits}
              tickMarks={inputs.tickMarks}
              onPlungerChange={handlePlungerChange}
            />

          </div>

        </div>
      ) : (
        // ==========================================
        // TABS: CYCLE & VIAL CALCULATOR
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Area: Inputs & Presets */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#0F1219] p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500 block animate-pulse" />
                Cycle &amp; Vial Calculator
              </h2>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1.5">
                    Vial Size (mg)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={cycleVialSize || ""}
                    onChange={(e) => setCycleVialSize(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0A0D12] px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-violet-500/70 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1.5">
                    Diluent (ml)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={cycleDiluent || ""}
                    onChange={(e) => setCycleDiluent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0A0D12] px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-violet-500/70 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Suggested Presets buttons */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 font-mono tracking-wider uppercase mb-2">
                  Suggested Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "glp1_titration", label: "GLP-1 Titration" },
                    { id: "glp1_micro", label: "GLP-1 Micro-dosing" },
                    { id: "healing_daily", label: "Healing (Daily)" },
                    { id: "gh_pulse", label: "GH Pulse (5/2)" },
                    { id: "cosmetic_ghk", label: "Cosmetic (GHK-Cu)" },
                    { id: "fat_loss_aod", label: "Fat Loss (AOD-9604)" },
                    { id: "mots_weekly", label: "Mots-C (Weekly)" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyCyclePreset(preset.id)}
                      className="text-[9px] font-bold font-mono bg-[#0A0D12] text-slate-400 border border-slate-800 hover:border-indigo-500/40 hover:text-white px-2 py-1.5 rounded transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Titration Phases */}
              <div className="space-y-3.5 pt-2 border-t border-slate-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                    Titration Phases
                  </span>
                  <button
                    onClick={handleAddPhase}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Phase
                  </button>
                </div>

                <div className="space-y-3">
                  {phases.map((phase, index) => (
                    <div
                      key={phase.id}
                      className="p-3 bg-[#0A0D12]/60 rounded-lg border border-slate-800 flex flex-col gap-3 relative"
                    >
                      <div className="absolute top-2.5 right-2 flex items-center gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-slate-500">
                          Phase {index + 1}
                        </span>
                        {phases.length > 1 && (
                          <button
                            onClick={() => handleRemovePhase(phase.id)}
                            className="p-1 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete phase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                        {/* Dose input */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase mb-1">
                            Dose
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="1"
                              value={phase.dose}
                              onChange={(e) => handleUpdatePhase(phase.id, { dose: parseInt(e.target.value) || 0 })}
                              className="w-full bg-[#0F1219] px-2.5 py-1.5 text-xs font-mono rounded border border-slate-800 focus:outline-none focus:border-indigo-500/60 text-slate-200"
                            />
                            <select
                              value={phase.unit}
                              onChange={(e) => handleUpdatePhase(phase.id, { unit: e.target.value as any })}
                              className="bg-[#0F1219] px-1.5 py-1.5 text-xs font-mono rounded border border-slate-800 focus:outline-none text-slate-300"
                            >
                              <option value="mcg">mcg</option>
                              <option value="mg">mg</option>
                            </select>
                          </div>
                        </div>

                        {/* Frequency dropdown */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase mb-1">
                            Frequency
                          </label>
                          <select
                            value={phase.frequency}
                            onChange={(e) => handleUpdatePhase(phase.id, { frequency: e.target.value as any })}
                            className="w-full bg-[#0F1219] px-2.5 py-1.5 text-xs font-mono rounded border border-slate-800 focus:outline-none text-slate-300"
                          >
                            <option value="daily">Daily</option>
                            <option value="eod">EOD</option>
                            <option value="3x_week">3x/Week</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </div>

                        {/* Duration input */}
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase mb-1">
                            Duration
                          </label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min="1"
                              value={phase.duration}
                              onChange={(e) => handleUpdatePhase(phase.id, { duration: parseInt(e.target.value) || 0 })}
                              className="w-full bg-[#0F1219] px-2.5 py-1.5 text-xs font-mono rounded border border-slate-800 focus:outline-none focus:border-indigo-500/60 text-slate-200"
                            />
                            <select
                              value={phase.durationUnit}
                              onChange={(e) => handleUpdatePhase(phase.id, { durationUnit: e.target.value as any })}
                              className="bg-[#0F1219] px-1.5 py-1.5 text-xs font-mono rounded border border-slate-800 focus:outline-none text-slate-300"
                            >
                              <option value="weeks">Weeks</option>
                              <option value="days">Days</option>
                            </select>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Right Area: Vials requirement Display Card */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* TOTAL VIALS NEEDED Big Display Card */}
            <div className="bg-[#0F1219] p-5 rounded-xl border border-emerald-500/20 shadow-md space-y-4">
              
              <div className="text-center py-2">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-400">
                  Total Vials Needed
                </span>
                <div className="text-6xl font-black text-emerald-400 font-mono mt-1.5 mb-1">
                  {cycleResults.vialsNeeded}
                </div>
                <span className="text-[11px] text-slate-400 font-bold block">
                  for a {cycleResults.totalDays} day cycle ({Math.ceil(cycleResults.totalDays / 7)} weeks)
                </span>
              </div>

              {/* Details table */}
              <div className="bg-[#0A0D12] p-4 rounded-lg border border-slate-850 space-y-3 font-mono text-[11px]">
                
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold">Total Peptide Needed:</span>
                  <span className="font-bold text-slate-200">{cycleResults.totalPeptideNeededMg.toFixed(2)} mg</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold">Total Peptide in {cycleResults.vialsNeeded} Vials:</span>
                  <span className="font-bold text-slate-200">{cycleResults.totalPeptideInVialsMg.toFixed(2)} mg</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold">Total Diluent Needed:</span>
                  <span className="font-bold text-emerald-400">{cycleResults.totalDiluentNeededMl.toFixed(2)} ml</span>
                </div>

              </div>

            </div>

            {/* Informational Guidelines Card */}
            <div className="bg-[#0F1219] p-4 rounded-xl border border-slate-800/80 text-[11px] leading-relaxed text-slate-400 space-y-2 font-semibold">
              <span className="text-xs text-white block uppercase tracking-wider font-mono">
                Assay Calculation Formulas
              </span>
              <p>
                1. <span className="text-slate-300">Vials Count</span> is computed as standard upper ceiling: <code className="text-indigo-400 font-mono">ceil(total_dose / vial_size)</code>.
              </p>
              <p>
                2. Overfill padding of approximately 5-10% dry weight is commonly pre-loaded in laboratory vials to accommodate hub-loss.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
