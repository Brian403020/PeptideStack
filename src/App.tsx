import { useState, useEffect } from "react";
import { Peptide } from "./types";
import ReconstitutionCalculator from "./components/ReconstitutionCalculator";
import PeptideCatalog from "./components/PeptideCatalog";
import StackBuilder from "./components/StackBuilder";
import ScheduleTracker from "./components/ScheduleTracker";
import VialInventory from "./components/VialInventory";
import AiAssistant from "./components/AiAssistant";
import { motion, AnimatePresence } from "motion/react";
import { Beaker, BookOpen, Layers, Calendar, Sparkles, Shield, FlaskConical, GraduationCap, Package, Heart, Sun, Moon, Sliders, LogOut, Maximize2, Minimize2, Smartphone, Monitor, Wifi, Battery, Clock, Check, Info } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"calculator" | "catalog" | "builder" | "schedule" | "inventory" | "assistant">("calculator");
  const [selectedCatalogPeptide, setSelectedCatalogPeptide] = useState<Peptide | null>(null);
  
  // Layout mode state: 'mobile' shows the beautiful phone mockup on desktop; 'wide' shows traditional full-width layout
  const [layoutMode, setLayoutMode] = useState<"mobile" | "wide">("mobile");
  
  // Simulated state for top header controls
  const [activeThemeMode, setActiveThemeMode] = useState<"dark" | "light" | "calibration">("dark");
  const [showStatusToast, setShowStatusToast] = useState<string | null>(null);

  // Dynamic time state for mobile status bar
  const [phoneTime, setPhoneTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setPhoneTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Bridge parameters to add directly to stack builder
  const [directAddPeptide, setDirectAddPeptide] = useState<{
    name: string;
    vialSizeMg: number;
    bacWaterMl: number;
    dosageMcg: number;
    syringeSize: number;
    syringeTicks: number;
  } | null>(null);

  // Trigger to update schedule logs when stack list changes
  const [trackerUpdateTrigger, setTrackerUpdateTrigger] = useState(0);

  // Handler for transition from Catalog to Reconstitution Calculator
  const handleSelectCatalogPeptide = (peptide: Peptide) => {
    setSelectedCatalogPeptide(peptide);
    setActiveTab("calculator");
  };

  // Handler for formulation addition to active builder stack
  const handleAddToStack = (formulation: {
    name: string;
    vialSizeMg: number;
    bacWaterMl: number;
    dosageMcg: number;
    syringeSize: number;
    syringeTicks: number;
  }) => {
    setDirectAddPeptide(formulation);
    setActiveTab("builder");
    triggerToast("Peptide configuration added to active stack!");
  };

  // Handler for direct peptide addition from Catalog (bypasses custom tuning)
  const handleAddToStackDirectly = (peptide: Peptide) => {
    let defaultVial = 5;
    if (peptide.id === "ghk-cu") defaultVial = 50;
    else if (peptide.id === "tirzepatide" || peptide.id === "epitalon") defaultVial = 10;

    let defaultDose = 250;
    if (peptide.id === "semaglutide") defaultDose = 250;
    else if (peptide.id === "tirzepatide") defaultDose = 2500;
    else if (peptide.id === "ghk-cu") defaultDose = 2000;
    else if (peptide.id === "epitalon") defaultDose = 5000;
    else if (peptide.id === "tb-500") defaultDose = 2500;

    setDirectAddPeptide({
      name: peptide.name,
      vialSizeMg: defaultVial,
      bacWaterMl: 2,
      dosageMcg: defaultDose,
      syringeSize: 100,
      syringeTicks: 100,
    });
    setActiveTab("builder");
    triggerToast(`${peptide.name} added to stack!`);
  };

  const triggerToast = (msg: string) => {
    setShowStatusToast(msg);
    setTimeout(() => {
      setShowStatusToast(null);
    }, 3000);
  };

  const tabs = [
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "calculator", label: "Calculator", icon: Beaker },
    { id: "catalog", label: "Catalog", icon: BookOpen },
    { id: "builder", label: "Stacker", icon: Heart },
    { id: "inventory", label: "Vial Stock", icon: Package },
    { id: "assistant", label: "Assistant", icon: Sparkles },
  ] as const;

  // The main workspace content inside the smartphone container (or wide wrapper)
  const renderWorkspace = () => {
    return (
      <div className="flex flex-col h-full bg-[#06080C] text-slate-300">
        
        {/* Dynamic Interactive Toast Notification */}
        <AnimatePresence>
          {showStatusToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-16 left-4 right-4 z-50 bg-[#161F30]/95 backdrop-blur-md border border-violet-500/35 text-violet-300 text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-violet-400 block animate-ping" />
              <span>{showStatusToast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Screenshot-Matched Top Header Bar */}
        <header className="sticky top-0 z-40 bg-[#0B0E14] border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Screenshot [ ➔ ] exit/logout button */}
            <button 
              onClick={() => triggerToast("Calibration system logged out securely (Simulated).")}
              className="w-8 h-8 rounded-full bg-[#151B26] border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Sign Out"
              id="logout-btn"
            >
              <LogOut className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            
            {/* Brand Logo & Title with Syringe / Purple block */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/15">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black tracking-widest text-white block">
                  PEPTIDESTACK
                </span>
                <span className="text-[8px] font-bold font-mono text-indigo-400/90 tracking-wide block">
                  CALIBRATION ENGINE
                </span>
              </div>
            </div>
          </div>

          {/* Screenshot-Matched Segmented Control Capsule [ ☀️ | 🎛️ | 🌙 ] */}
          <div className="bg-[#0F1219] border border-slate-800/85 rounded-full p-1 flex items-center gap-1 shadow-inner">
            <button
              onClick={() => {
                setActiveThemeMode("light");
                triggerToast("Theme Mode: Solar Slate Warm Active");
              }}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                activeThemeMode === "light"
                  ? "bg-[#1E2530] text-amber-400 scale-105"
                  : "text-slate-500 hover:text-slate-350"
              }`}
              title="Light Theme"
              id="theme-light-btn"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-3.5 bg-slate-800/70" />
            <button
              onClick={() => {
                setActiveThemeMode("calibration");
                triggerToast("System State: Live Calibration Tuning");
              }}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                activeThemeMode === "calibration"
                  ? "bg-[#1E2530] text-indigo-400 scale-105"
                  : "text-slate-500 hover:text-slate-350"
              }`}
              title="System Control"
              id="theme-calib-btn"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-3.5 bg-slate-800/70" />
            <button
              onClick={() => {
                setActiveThemeMode("dark");
                triggerToast("Theme Mode: Midnight Obsidian Active");
              }}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                activeThemeMode === "dark"
                  ? "bg-[#1E2530] text-indigo-400 scale-105"
                  : "text-slate-500 hover:text-slate-350"
              }`}
              title="Dark Theme"
              id="theme-dark-btn"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Screenshot-Matched Premium Navigation Tabs Block */}
        <div className="bg-[#0B0E14] px-4 py-2 border-b border-slate-800/50">
          <nav className="grid grid-cols-6 gap-1 p-1 bg-[#07090D] border border-slate-800/65 rounded-xl overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "calculator") setSelectedCatalogPeptide(null);
                  }}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md shadow-violet-600/20"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                  id={`tab-${tab.id}`}
                >
                  <Icon className={`w-4 h-4 ${
                    isActive ? "text-white" : "text-slate-500"
                  }`} />
                  <span className="text-[8px] font-bold font-mono mt-1 tracking-tighter block truncate w-full text-center">
                    {tab.label.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workspace Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 select-none pb-24">
          
          {/* Research Standard Notice */}
          <div className="bg-[#0F1219] text-slate-300 rounded-xl p-3 border border-slate-800/80 flex flex-col gap-2 shadow-md">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#151B26] flex items-center justify-center text-violet-400 shrink-0 border border-slate-800">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-black tracking-tight text-white uppercase font-mono">
                  Reconstitution Safety Standards
                </h4>
                <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                  Calibrated on U-100 syringe assays (0.01mL = 1 Unit). Built-in safety guards minimize concentration errors.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[8px] font-mono font-bold text-slate-500">
              <div className="flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-violet-500" />
                <span>ACADEMIC LABORATORY REFERENCE</span>
              </div>
              <span className="text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20">SECURE CALIBRATION</span>
            </div>
          </div>

          {/* Active Workspace View Routing */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12, ease: "easeInOut" }}
              >
                {activeTab === "calculator" && (
                  <ReconstitutionCalculator
                    initialPeptide={selectedCatalogPeptide}
                    onAddToStack={handleAddToStack}
                  />
                )}

                {activeTab === "catalog" && (
                  <PeptideCatalog
                    onSelectPeptide={handleSelectCatalogPeptide}
                    onAddToStackDirectly={handleAddToStackDirectly}
                  />
                )}

                {activeTab === "builder" && (
                  <StackBuilder
                    onStackSaved={() => setTrackerUpdateTrigger((p) => p + 1)}
                    directAddPeptide={directAddPeptide}
                    onClearDirectAdd={() => setDirectAddPeptide(null)}
                  />
                )}

                {activeTab === "schedule" && (
                  <ScheduleTracker lastUpdated={trackerUpdateTrigger} />
                )}

                {activeTab === "inventory" && (
                  <VialInventory />
                )}

                {activeTab === "assistant" && (
                  <AiAssistant />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Micro Footer inside mobile body */}
          <footer className="pt-6 pb-2 text-center text-[8px] text-slate-600 font-bold font-mono tracking-widest uppercase">
            <p>PEPTIDESTACK INC. • STUDY REFERENCE ONLY</p>
          </footer>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#05070B] text-slate-300 flex flex-col font-sans antialiased selection:bg-violet-500/30 selection:text-violet-300 relative overflow-x-hidden">
      
      {/* Premium Desktop Floating Layout Controller Grid (hidden on native mobile) */}
      <div className="hidden md:flex w-full bg-[#0A0D15] border-b border-slate-800/80 px-6 py-2.5 items-center justify-between text-xs z-50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 block animate-pulse" />
          <span className="font-mono text-slate-400 font-bold">PEPTIDESTACK WORKSPACE LAB PORTAL</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-[11px] font-semibold">Workspace View Mode:</span>
          <div className="bg-[#121620] border border-slate-800 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setLayoutMode("mobile")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                layoutMode === "mobile"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="layout-mobile-toggle"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Interactive Phone Mockup</span>
            </button>
            <button
              onClick={() => setLayoutMode("wide")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                layoutMode === "wide"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              id="layout-wide-toggle"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>🖥️ Wide Responsive View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 flex flex-col items-center justify-center p-0 md:p-6 w-full h-full">
        {layoutMode === "mobile" ? (
          
          /* SMARTPHONE DEVICE INTERACTIVE FRAME MOCKUP (DESKTOP) / NATIVE RESPONSIVE (MOBILE) */
          <div className="relative w-full md:w-[395px] md:h-[844px] md:rounded-[48px] md:border-[10px] md:border-slate-800/90 md:shadow-[0_0_80px_rgba(0,0,0,0.85)] md:overflow-hidden md:ring-2 md:ring-slate-700/50 flex flex-col bg-[#06080C] transition-all">
            
            {/* Simulated Phone Side Hardware Controls (Only visible on desktop) */}
            <div className="hidden md:block absolute -left-[12px] top-[140px] w-[2px] h-[40px] bg-slate-700/80 rounded-r" />
            <div className="hidden md:block absolute -left-[12px] top-[190px] w-[2px] h-[55px] bg-slate-700/80 rounded-r" />
            <div className="hidden md:block absolute -left-[12px] top-[255px] w-[2px] h-[55px] bg-slate-700/80 rounded-r" />
            <div className="hidden md:block absolute -right-[12px] top-[210px] w-[2px] h-[75px] bg-slate-700/80 rounded-l" />

            {/* Simulated Status Bar (Visible on Desktop Mockup & Mobile devices for deep immersion) */}
            <div className="bg-[#0B0E14] px-5 py-2.5 flex items-center justify-between text-white font-mono text-[10.5px] font-bold shrink-0 select-none">
              <span className="flex items-center gap-1 font-sans">
                {phoneTime || "07:00"}
              </span>
              
              {/* Central Dynamic Notch Pill */}
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-2.5 w-24 h-4.5 bg-[#000] rounded-full z-50 border border-slate-900/40" />

              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[9px] tracking-wider text-indigo-400">5G</span>
                <Battery className="w-4 h-4 text-emerald-400 rotate-0" />
                <span className="text-[9px]">98%</span>
              </div>
            </div>

            {/* Inner Content Workspace */}
            <div className="flex-1 relative overflow-hidden flex flex-col h-full">
              {renderWorkspace()}
            </div>

            {/* Simulated Phone Home Indicator Swipe Bar */}
            <div className="bg-[#06080C] py-2 flex justify-center shrink-0 border-t border-slate-900 select-none">
              <div className="w-28 h-1 bg-slate-800 rounded-full" />
            </div>

          </div>
        ) : (
          /* TRADITIONAL FULL WIDTH RESPONSIVE WORKSPACE WRAPPER */
          <div className="w-full max-w-7xl mx-auto bg-[#06080C] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[85vh] relative animate-fadeIn">
            {renderWorkspace()}
          </div>
        )}
      </div>

    </div>
  );
}
