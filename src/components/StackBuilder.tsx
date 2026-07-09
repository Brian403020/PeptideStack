import { useState, useEffect } from "react";
import { PeptideStack, StackPeptide, Peptide } from "../types";
import { PEPTIDE_DATABASE } from "../data";
import { calculateReconstitution, getTailwindColorClass } from "../utils";
import MarkdownRenderer from "./MarkdownRenderer";
import { Plus, Trash2, Save, Sparkles, AlertTriangle, RefreshCw, X, Calendar, Clock, BookOpen, Layers } from "lucide-react";

interface StackBuilderProps {
  onStackSaved: () => void;
  directAddPeptide?: {
    name: string;
    vialSizeMg: number;
    bacWaterMl: number;
    dosageMcg: number;
    syringeSize: number;
    syringeTicks: number;
  } | null;
  onClearDirectAdd?: () => void;
}

export default function StackBuilder({
  onStackSaved,
  directAddPeptide,
  onClearDirectAdd,
}: StackBuilderProps) {
  const [stacks, setStacks] = useState<PeptideStack[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingStackId, setEditingStackId] = useState<string | null>(null);

  // Form states for stack
  const [stackName, setStackName] = useState("");
  const [stackDesc, setStackDesc] = useState("");
  const [stackColor, setStackColor] = useState("blue");
  const [stackPeptides, setStackPeptides] = useState<StackPeptide[]>([]);

  // Form states for adding/editing a peptide inside the stack
  const [showPeptideForm, setShowPeptideForm] = useState(false);
  const [formPeptideId, setFormPeptideId] = useState("");
  const [formCustomName, setFormCustomName] = useState("");
  const [formVialMg, setFormVialMg] = useState(5);
  const [formBacWaterMl, setFormBacWaterMl] = useState(2);
  const [formDoseMcg, setFormDoseMcg] = useState(250);
  const [formSyringeUnits, setFormSyringeUnits] = useState(100);
  const [formTickMarks, setFormTickMarks] = useState(100);
  const [formScheduleType, setFormScheduleType] = useState<"daily" | "eod" | "weekdays" | "custom">("daily");
  const [formCustomDays, setFormCustomDays] = useState<string[]>([]);
  const [formTimes, setFormTimes] = useState<string[]>(["Morning"]);
  const [formDurationWeeks, setFormDurationWeeks] = useState(8);

  // AI Evaluation states
  const [evaluatingStackId, setEvaluatingStackId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Fetch stacks from localStorage on mount
  useEffect(() => {
    loadStacks();
  }, []);

  // Handle direct addition from catalog or calculator
  useEffect(() => {
    if (directAddPeptide) {
      setIsCreating(true);
      setStackName("My Custom Stack");
      setStackDesc("Active research protocol");
      
      // Map incoming formulations to a new StackPeptide
      const newStackPep: StackPeptide = {
        id: Math.random().toString(),
        peptideId: "custom",
        name: directAddPeptide.name,
        vialSizeMg: directAddPeptide.vialSizeMg,
        bacWaterMl: directAddPeptide.bacWaterMl,
        dosageMcg: directAddPeptide.dosageMcg,
        syringeSize: directAddPeptide.syringeSize,
        syringeTicks: directAddPeptide.syringeTicks,
        calculatedUnits: 0,
        calculatedTicks: 0,
        scheduleType: "daily",
        customDays: [],
        timesOfDay: ["Morning"],
        durationWeeks: 8,
      };

      // Perform calculations
      const results = calculateReconstitution({
        vialMg: newStackPep.vialSizeMg,
        bacWaterMl: newStackPep.bacWaterMl,
        syringeUnits: newStackPep.syringeSize,
        tickMarks: newStackPep.syringeTicks,
        desiredMcg: newStackPep.dosageMcg,
      });

      newStackPep.calculatedUnits = results.unitsNeeded;
      newStackPep.calculatedTicks = results.ticksNeeded;

      setStackPeptides([newStackPep]);
      
      // Clear direct add state so it doesn't loop
      if (onClearDirectAdd) {
        onClearDirectAdd();
      }
    }
  }, [directAddPeptide]);

  const loadStacks = () => {
    const raw = localStorage.getItem("peptidestacks");
    if (raw) {
      try {
        setStacks(JSON.parse(raw));
      } catch (e) {
        console.error("Error reading stacks", e);
      }
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingStackId(null);
    setStackName("");
    setStackDesc("");
    setStackColor("blue");
    setStackPeptides([]);
  };

  const handleEditStack = (stack: PeptideStack) => {
    setEditingStackId(stack.id);
    setIsCreating(true);
    setStackName(stack.name);
    setStackDesc(stack.description);
    setStackColor(stack.color);
    setStackPeptides(stack.peptides);
  };

  const handleDeleteStack = (stackId: string) => {
    if (window.confirm("Are you sure you want to delete this research stack?")) {
      const updated = stacks.filter((s) => s.id !== stackId);
      localStorage.setItem("peptidestacks", JSON.stringify(updated));
      setStacks(updated);
      onStackSaved();
    }
  };

  const handleSaveStack = () => {
    if (!stackName.trim()) {
      alert("Please provide a name for this research stack.");
      return;
    }

    if (stackPeptides.length === 0) {
      alert("Please add at least one formulated peptide to this stack.");
      return;
    }

    const newStack: PeptideStack = {
      id: editingStackId || Math.random().toString(),
      name: stackName,
      description: stackDesc,
      peptides: stackPeptides,
      color: stackColor,
      createdAt: new Date().toISOString(),
    };

    let updated: PeptideStack[] = [];
    if (editingStackId) {
      updated = stacks.map((s) => (s.id === editingStackId ? newStack : s));
    } else {
      updated = [newStack, ...stacks];
    }

    localStorage.setItem("peptidestacks", JSON.stringify(updated));
    setStacks(updated);
    setIsCreating(false);
    onStackSaved();
  };

  // Add peptide to form list
  const handleOpenPeptideForm = () => {
    setShowPeptideForm(true);
    setFormPeptideId(PEPTIDE_DATABASE[0]?.id || "");
    setFormCustomName("");
    setFormVialMg(5);
    setFormBacWaterMl(2);
    setFormDoseMcg(250);
    setFormSyringeUnits(100);
    setFormTickMarks(100);
    setFormScheduleType("daily");
    setFormCustomDays([]);
    setFormTimes(["Morning"]);
    setFormDurationWeeks(8);
  };

  // Sync inputs when selecting a peptide in the sub-form
  const handleFormPeptideSelect = (id: string) => {
    setFormPeptideId(id);
    if (id !== "custom") {
      const pep = PEPTIDE_DATABASE.find((p) => p.id === id);
      if (pep) {
        // Safe standard presets based on standard catalog profiles
        let parsedVial = 5;
        if (pep.id === "ghk-cu") parsedVial = 50;
        else if (pep.id === "tirzepatide") parsedVial = 10;
        else if (pep.id === "epitalon") parsedVial = 10;

        let parsedDose = 250;
        if (pep.id === "semaglutide") parsedDose = 250;
        else if (pep.id === "tirzepatide") parsedDose = 2500;
        else if (pep.id === "ghk-cu") parsedDose = 2000;
        else if (pep.id === "epitalon") parsedDose = 5000;
        else if (pep.id === "tb-500") parsedDose = 2500;

        setFormVialMg(parsedVial);
        setFormDoseMcg(parsedDose);
      }
    }
  };

  const handleAddPeptideSubmit = () => {
    let name = formCustomName;
    if (formPeptideId !== "custom") {
      const p = PEPTIDE_DATABASE.find((pep) => pep.id === formPeptideId);
      name = p ? p.name : "Custom";
    }

    if (!name.trim()) {
      alert("Please provide a name for the peptide.");
      return;
    }

    const calculatedResult = calculateReconstitution({
      vialMg: formVialMg,
      bacWaterMl: formBacWaterMl,
      syringeUnits: formSyringeUnits,
      tickMarks: formTickMarks,
      desiredMcg: formDoseMcg,
    });

    const newPep: StackPeptide = {
      id: Math.random().toString(),
      peptideId: formPeptideId,
      name,
      vialSizeMg: formVialMg,
      bacWaterMl: formBacWaterMl,
      dosageMcg: formDoseMcg,
      syringeSize: formSyringeUnits,
      syringeTicks: formTickMarks,
      calculatedUnits: calculatedResult.unitsNeeded,
      calculatedTicks: calculatedResult.ticksNeeded,
      scheduleType: formScheduleType,
      customDays: formScheduleType === "custom" ? formCustomDays : [],
      timesOfDay: formTimes,
      durationWeeks: formDurationWeeks,
    };

    setStackPeptides((prev) => [...prev, newPep]);
    setShowPeptideForm(false);
  };

  const handleRemovePeptideFromForm = (id: string) => {
    setStackPeptides((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleFormDay = (day: string) => {
    setFormCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleToggleFormTime = (time: string) => {
    setFormTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  // AI Stack Evaluation Trigger
  const triggerAiEvaluation = async (stack: PeptideStack) => {
    setEvaluatingStackId(stack.id);
    setIsReportLoading(true);
    setAiReport(null);

    try {
      const response = await fetch("/api/analyze-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stack }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze stack.");
      }

      setAiReport(data.analysis);
    } catch (e: any) {
      console.error(e);
      setAiReport(`Failed to generate scientific report: ${e.message}. Please check your Gemini API key in Secrets.`);
    } finally {
      setIsReportLoading(false);
    }
  };

  const colors = ["blue", "emerald", "violet", "amber", "rose"];
  const weekdaysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const timesList = ["Morning", "Noon", "Evening", "Before Bed"];

  return (
    <div className="space-y-4">
      {/* 1. Main View: List Stacks or Form Creator */}
      {isCreating ? (
        <div className="bg-[#0F1219] p-4 sm:p-5 rounded-xl border border-slate-800/80 shadow-sm transition-all space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse" />
              {editingStackId ? "Edit Custom Stack" : "Build New Peptide Stack"}
            </h2>
            <button
              onClick={() => setIsCreating(false)}
              className="p-1 hover:bg-[#151B26] rounded-md text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Stack Info fields */}
            <div className="md:col-span-9 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Stack Name
                </label>
                <input
                  type="text"
                  value={stackName}
                  onChange={(e) => setStackName(e.target.value)}
                  placeholder="e.g. Injury Recovery & Healing"
                  className="w-full bg-[#0A0D12] px-3 py-1.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/70 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Stack Description / Research Notes
                </label>
                <textarea
                  value={stackDesc}
                  onChange={(e) => setStackDesc(e.target.value)}
                  placeholder="Describe your research focus, weekly cycle guidelines, or general notes..."
                  rows={2}
                  className="w-full bg-[#0A0D12] px-3 py-1.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/70 text-slate-300 leading-relaxed font-mono"
                />
              </div>
            </div>

            {/* Stack Accent Color picker */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Color Accent Tag
              </label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {colors.map((col) => (
                  <button
                    key={col}
                    onClick={() => setStackColor(col)}
                    className={`w-7 h-7 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                      stackColor === col
                        ? "border-white ring-1 ring-emerald-500 scale-105"
                        : "border-slate-800 hover:scale-105"
                    }`}
                    style={{
                      backgroundColor:
                        col === "blue"
                          ? "#3b82f6"
                          : col === "emerald"
                          ? "#10b981"
                          : col === "violet"
                          ? "#8b5cf6"
                          : col === "amber"
                          ? "#f59e0b"
                          : "#f43f5e",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Formulated Peptide list in Creator */}
          <div className="space-y-3 pt-3.5 border-t border-slate-800/60">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                Formulated Compounds ({stackPeptides.length})
              </h3>
              <button
                onClick={handleOpenPeptideForm}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-all hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Formulation
              </button>
            </div>

            {stackPeptides.length === 0 ? (
              <div className="text-center py-6 bg-[#0A0D12] border border-dashed border-slate-800 rounded-lg">
                <p className="text-[11px] text-slate-500 font-semibold mb-1">
                  No peptides formulated in this stack yet.
                </p>
                <button
                  onClick={handleOpenPeptideForm}
                  className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Configure your first formulation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {stackPeptides.map((p) => {
                  return (
                    <div
                      key={p.id}
                      className="flex justify-between items-center bg-[#0A0D12] p-3 rounded-lg border border-slate-800/80 hover:border-slate-700/60 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">
                            {p.name}
                          </span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono px-1.5 py-0.5 rounded font-bold uppercase">
                            {p.durationWeeks} weeks
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 space-y-0.5">
                          <div className="text-[10px] text-slate-500 font-mono">
                            Assay: {p.vialSizeMg}mg vial + {p.bacWaterMl}mL BAC water
                          </div>
                          <div className="font-semibold text-slate-300 flex items-center gap-1 flex-wrap">
                            <span>Dose: {p.dosageMcg} mcg</span>
                            <span className="text-slate-700">•</span>
                            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/5 px-1 rounded">
                              {p.calculatedUnits.toFixed(1)} Units
                            </span>
                            <span className="text-slate-500">({p.calculatedTicks.toFixed(1)} Ticks)</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
                            <Calendar className="w-3 h-3 text-slate-600" />
                            <span className="capitalize">
                              Freq: {p.scheduleType}
                              {p.customDays.length > 0 && ` (${p.customDays.join(", ")})`}
                            </span>
                            <span className="text-slate-700">•</span>
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span>Times: {p.timesOfDay.join(", ")}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemovePeptideFromForm(p.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sub-Modal Formulation Peptide Editor inside Builder */}
          {showPeptideForm && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl p-5 sm:p-6 overflow-y-auto max-h-[90vh] space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-md font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-500" /> Formulate Peptide
                  </h4>
                  <button
                    onClick={() => setShowPeptideForm(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main sub form parameters */}
                <div className="space-y-4">
                  {/* Select Peptide from Library */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Select Peptide Profile
                      </label>
                      <select
                        value={formPeptideId}
                        onChange={(e) => handleFormPeptideSelect(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      >
                        {PEPTIDE_DATABASE.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                        <option value="custom">-- Custom Compound --</option>
                      </select>
                    </div>

                    {formPeptideId === "custom" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Peptide Custom Name
                        </label>
                        <input
                          type="text"
                          value={formCustomName}
                          onChange={(e) => setFormCustomName(e.target.value)}
                          placeholder="e.g. LL-37"
                          className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    )}
                  </div>

                  {/* Vial & Water row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Vial Size (mg)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formVialMg}
                        onChange={(e) => setFormVialMg(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        BAC Water (mL)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={formBacWaterMl}
                        onChange={(e) => setFormBacWaterMl(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Dosage (mcg)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formDoseMcg}
                        onChange={(e) => setFormDoseMcg(parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Syringe Volume inside subform */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Syringe Volume
                      </label>
                      <select
                        value={formSyringeUnits}
                        onChange={(e) => setFormSyringeUnits(parseInt(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      >
                        <option value={100}>100 Units (1.0 mL)</option>
                        <option value={50}>50 Units (0.5 mL)</option>
                        <option value={30}>30 Units (0.3 mL)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Syringe Graduation
                      </label>
                      <select
                        value={formTickMarks}
                        onChange={(e) => setFormTickMarks(parseInt(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      >
                        <option value={100}>1 Unit per Tick</option>
                        <option value={50}>2 Units per Tick</option>
                      </select>
                    </div>
                  </div>

                  {/* Scheduling block */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Injection Schedule Frequency
                      </label>
                      <select
                        value={formScheduleType}
                        onChange={(e: any) => setFormScheduleType(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
                      >
                        <option value="daily">Daily (Every Day)</option>
                        <option value="eod">Every Other Day (EOD)</option>
                        <option value="weekdays">Weekdays (Mon-Fri)</option>
                        <option value="custom">Custom Weekdays</option>
                      </select>
                    </div>

                    {/* Custom Days list */}
                    {formScheduleType === "custom" && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">
                          Select Action Days
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {weekdaysList.map((day) => {
                            const active = formCustomDays.includes(day);
                            return (
                              <button
                                key={day}
                                onClick={() => handleToggleFormDay(day)}
                                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                  active
                                    ? "bg-slate-800 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-805 dark:border-slate-800"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Time of Day list */}
                    <div className="grid grid-cols-2 gap-4 pt-1.5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          Times of Day
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {timesList.map((time) => {
                            const active = formTimes.includes(time);
                            return (
                              <button
                                key={time}
                                onClick={() => handleToggleFormTime(time)}
                                className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  active
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-805 dark:border-slate-800"
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Cycle Duration (Weeks)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={formDurationWeeks}
                          onChange={(e) => setFormDurationWeeks(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#0A0D12] px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/70 text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => setShowPeptideForm(false)}
                    className="flex-1 py-2 bg-[#0A0D12] text-slate-400 font-bold text-xs rounded-lg hover:text-slate-200 hover:bg-[#151B26] border border-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPeptideSubmit}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer"
                  >
                    Confirm Formulation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Builder Submit controls */}
          <div className="flex gap-3 pt-5 border-t border-slate-800/60">
            <button
              onClick={() => setIsCreating(false)}
              className="flex-1 py-2 px-3 bg-[#0A0D12] text-slate-400 border border-slate-800 font-bold text-xs rounded-lg hover:text-slate-200 hover:bg-[#151B26] transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStack}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Research Stack
            </button>
          </div>
        </div>
      ) : (
        /* Stacks Dashboard List view */
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[#0F1219] p-4 rounded-xl border border-slate-800/80 shadow-sm">
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                Saved Research Stacks ({stacks.length})
              </h2>
              <p className="text-[10px] text-slate-500 font-bold tracking-wide">Design, formulate, and run clinical stack models.</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Build Stack
            </button>
          </div>

          {stacks.length === 0 ? (
            <div className="text-center py-14 bg-[#0F1219] rounded-xl border border-slate-800/80 shadow-sm">
              <Layers className="w-10 h-10 text-slate-700 mx-auto mb-2.5" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 mb-1">
                No active stacks formulated yet.
              </h3>
              <p className="text-[10px] text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed font-bold">
                Combine synergistic peptides, schedule dosage timelines, and compile an AI safety analysis profile.
              </p>
              <button
                onClick={handleCreateNew}
                className="py-2 px-3.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/25 text-emerald-400 font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Create First Stack
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {stacks.map((stack) => {
                const colorsInfo = getTailwindColorClass(stack.color);
                const isEvaluating = evaluatingStackId === stack.id;

                return (
                  <div
                    key={stack.id}
                    className="bg-[#0F1219] rounded-xl border border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    {/* Upper Container */}
                    <div className="p-4 sm:p-5 space-y-3.5">
                      {/* Title & tags */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${colorsInfo.accent}`} />
                            {stack.name}
                          </h3>
                          {stack.description && (
                            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                              {stack.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditStack(stack)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-[#0A0D12] px-2 py-1 rounded border border-slate-800 cursor-pointer transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStack(stack.id)}
                            className="p-1 hover:bg-rose-500/5 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Peptide Formulations List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {stack.peptides.map((pep) => (
                          <div
                            key={pep.id}
                            className="p-3 bg-[#0A0D12] rounded-lg border border-slate-800/50 space-y-1 text-xs text-slate-300"
                          >
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-bold text-slate-200 text-xs">
                                {pep.name}
                              </span>
                              <span className="text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded uppercase">
                                {pep.durationWeeks}W Cycle
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Assay: {pep.vialSizeMg}mg vial + {pep.bacWaterMl}mL BAC water
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
                              <span className="font-semibold text-slate-400 text-[10px]">Dose: {pep.dosageMcg}mcg</span>
                              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/5 px-1 py-0.5 rounded text-[10px]">
                                {pep.calculatedUnits.toFixed(1)} Units
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1 text-[9px] text-slate-500 font-medium">
                              <Calendar className="w-3 h-3 shrink-0 text-slate-600" />
                              <span className="capitalize line-clamp-1">
                                {pep.scheduleType}
                                {pep.customDays.length > 0 && ` (${pep.customDays.join(",")})`}
                              </span>
                              <span className="text-slate-800">•</span>
                              <Clock className="w-3 h-3 shrink-0 text-slate-600" />
                              <span className="line-clamp-1">{pep.timesOfDay.join(", ")}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Analyzer Panel Block inside stack */}
                    <div className="bg-[#090C11] border-t border-slate-850 p-3.5 sm:px-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                          AI Evaluation Engine Ready
                        </span>
                      </div>
                      <button
                        onClick={() => triggerAiEvaluation(stack)}
                        disabled={isEvaluating && isReportLoading}
                        className="py-1 px-2.5 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/25 text-emerald-400 font-bold text-xs rounded-md transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        {isEvaluating && isReportLoading ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Analyze Stack
                          </>
                        )}
                      </button>
                    </div>

                    {/* Fullscreen Modal AI Report display */}
                    {isEvaluating && (
                      <div className="fixed inset-0 z-50 bg-[#0B0E14]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
                        <div className="bg-[#0F1219] w-full max-w-4xl h-[85vh] rounded-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                          {/* Modal Header */}
                          <div className="p-4 bg-[#151B26] border-b border-slate-800/80 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                                  Scientific Stack Report: {stack.name}
                                </h4>
                                <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                                  Generated by Gemini AI • Peer-Reviewed Reference Verification
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEvaluatingStackId(null);
                                setAiReport(null);
                              }}
                              className="p-1 hover:bg-[#1C2331] rounded text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Modal Scroll Content */}
                          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                            {isReportLoading ? (
                              <div className="h-full flex flex-col items-center justify-center space-y-3">
                                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                                <div className="text-center space-y-1">
                                  <p className="text-xs font-bold font-mono text-slate-300">
                                    Compiling pharmacological stack data...
                                  </p>
                                  <p className="text-[10px] text-slate-500 max-w-sm leading-relaxed font-bold">
                                    Analyzing half-life decay curves, hypothalamic-pituitary interactions, cellular healing triggers, and food intake blunting factors.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4 animate-fadeIn">
                                {/* Disclaimer banner */}
                                <div className="p-3 bg-amber-500/5 border border-amber-500/25 rounded-lg text-[11px] text-amber-500/95 leading-relaxed flex gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                  <span>
                                    <strong className="font-bold">Clinical Safety Notice:</strong> This report outlines peer-reviewed molecular research findings. Peptides discussed are classified for experimental laboratory study only. Never exceed established research concentrations.
                                  </span>
                                </div>

                                <div className="prose dark:prose-invert max-w-none text-slate-300 text-xs sm:text-sm">
                                  <MarkdownRenderer content={aiReport || ""} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Modal Footer */}
                          <div className="px-5 py-3.5 bg-[#151B26] border-t border-slate-800/80 flex items-center justify-end shrink-0 gap-3">
                            <button
                              onClick={() => {
                                setEvaluatingStackId(null);
                                setAiReport(null);
                              }}
                              className="py-1.5 px-3 bg-[#0A0D12] border border-slate-800 hover:bg-[#1C2331] text-slate-300 hover:text-white font-bold text-xs rounded-lg cursor-pointer transition-all"
                            >
                              Close Scientific Report
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
