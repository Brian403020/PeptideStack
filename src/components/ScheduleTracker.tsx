import { useState, useEffect } from "react";
import { PeptideStack, StackPeptide, HistoryLog } from "../types";
import { Calendar as CalendarIcon, CheckCircle2, Clock, Award, History, AlertCircle, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface ScheduleTrackerProps {
  lastUpdated: number; // Trigger reload when stacks change
}

export default function ScheduleTracker({ lastUpdated }: ScheduleTrackerProps) {
  const [stacks, setStacks] = useState<PeptideStack[]>([]);
  const [selectedStackId, setSelectedStackId] = useState<string>("");
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [streak, setStreak] = useState(0);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date()); // Month pointer
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Selected day for checklist
  const [adherenceFilter, setAdherenceFilter] = useState<"previous" | "today" | "upcoming">("today");

  // Load stacks and history
  useEffect(() => {
    loadStacksAndHistory();
  }, [lastUpdated]);

  const loadStacksAndHistory = () => {
    const savedStacks = localStorage.getItem("peptidestacks");
    const savedHistory = localStorage.getItem("peptidehistory");
    const savedStreak = localStorage.getItem("peptidestreak");

    if (savedStacks) {
      try {
        const parsedStacks: PeptideStack[] = JSON.parse(savedStacks);
        setStacks(parsedStacks);
        if (parsedStacks.length > 0 && !selectedStackId) {
          setSelectedStackId(parsedStacks[0].id);
        }
      } catch (e) {
        console.error("Error reading stacks", e);
      }
    }

    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error reading history", e);
      }
    }

    if (savedStreak) {
      setStreak(parseInt(savedStreak) || 0);
    }
  };

  const selectedStack = stacks.find((s) => s.id === selectedStackId);

  // Check if a peptide is scheduled on a given Date
  const isPeptideActiveOnDate = (pep: StackPeptide, date: Date): boolean => {
    const dayNameShort = date.toLocaleDateString("en-US", { weekday: "short" }); // 'Mon', 'Tue'
    const isWkday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(dayNameShort);
    const daysSinceEpoch = Math.floor(date.getTime() / 86400000);

    if (pep.scheduleType === "daily") {
      return true;
    } else if (pep.scheduleType === "weekdays") {
      return isWkday;
    } else if (pep.scheduleType === "eod") {
      return daysSinceEpoch % 2 === 0;
    } else if (pep.scheduleType === "custom") {
      return pep.customDays.includes(dayNameShort);
    }
    return false;
  };

  // Generate checklist items for a chosen Date
  const getChecklistItemsForDate = (date: Date): {
    id: string;
    peptide: StackPeptide;
    time: string;
    completed: boolean;
  }[] => {
    if (!selectedStack) return [];

    const items: { id: string; peptide: StackPeptide; time: string; completed: boolean }[] = [];
    const dateStr = date.toISOString().split("T")[0];

    selectedStack.peptides.forEach((pep) => {
      if (isPeptideActiveOnDate(pep, date)) {
        pep.timesOfDay.forEach((time) => {
          // Check if this injection is logged in history
          const completed = history.some(
            (log) =>
              log.stackId === selectedStack.id &&
              log.peptideName === pep.name &&
              log.takenAt.startsWith(dateStr) &&
              log.takenAt.includes(time)
          );

          items.push({
            id: `${pep.id}-${time}-${dateStr}`,
            peptide: pep,
            time,
            completed,
          });
        });
      }
    });

    const timeOrder: Record<string, number> = {
      "Morning": 0,
      "Noon": 1,
      "Evening": 2,
      "Before Bed": 3,
    };
    return items.sort((a, b) => timeOrder[a.time] - timeOrder[b.time]);
  };

  const checklistItems = getChecklistItemsForDate(selectedDate);
  const completedCount = checklistItems.filter((i) => i.completed).length;
  const complianceRate = checklistItems.length > 0 ? Math.round((completedCount / checklistItems.length) * 100) : 0;

  // Toggle adherence logs
  const handleToggleCheck = (itemId: string, peptideName: string, dosageMcg: number, timeOfDay: string) => {
    if (!selectedStack) return;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const isCompletedNow = checklistItems.find((i) => i.id === itemId)?.completed;

    let updatedHistory: HistoryLog[] = [];

    if (isCompletedNow) {
      // Remove from history
      updatedHistory = history.filter(
        (log) =>
          !(
            log.stackId === selectedStack.id &&
            log.peptideName === peptideName &&
            log.takenAt.startsWith(dateStr) &&
            log.takenAt.includes(timeOfDay)
          )
      );
    } else {
      // Create new injection log matching selectedDate
      const logTime = new Date(selectedDate);
      // Give it current local hours so it sorts reasonably
      const now = new Date();
      logTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const newLog: HistoryLog = {
        id: Math.random().toString(),
        stackId: selectedStack.id,
        stackName: selectedStack.name,
        peptideName,
        dosageMcg,
        takenAt: `${logTime.toISOString()} (${timeOfDay})`,
      };
      updatedHistory = [newLog, ...history];
    }

    localStorage.setItem("peptidehistory", JSON.stringify(updatedHistory));
    setHistory(updatedHistory);
    calculateAndSaveStreak(updatedHistory);
  };

  const calculateAndSaveStreak = (hist: HistoryLog[]) => {
    if (hist.length === 0) {
      setStreak(0);
      localStorage.setItem("peptidestreak", "0");
      return;
    }

    const loggedDates = Array.from(
      new Set(hist.map((log) => log.takenAt.split("T")[0]))
    ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (loggedDates.length === 0) {
      setStreak(0);
      localStorage.setItem("peptidestreak", "0");
      return;
    }

    let calculatedStreak = 0;
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const newestLogDate = loggedDates[0];
    if (newestLogDate !== todayStr && newestLogDate !== yesterdayStr) {
      setStreak(0);
      localStorage.setItem("peptidestreak", "0");
      return;
    }

    let checkDate = new Date();
    while (true) {
      const checkStr = checkDate.toISOString().split("T")[0];
      if (loggedDates.includes(checkStr)) {
        calculatedStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(calculatedStreak);
    localStorage.setItem("peptidestreak", calculatedStreak.toString());
  };

  const handleResetHistory = () => {
    if (window.confirm("Are you sure you want to clear your study adherence logs and streaks? This is permanent.")) {
      localStorage.removeItem("peptidehistory");
      localStorage.removeItem("peptidestreak");
      setHistory([]);
      setStreak(0);
    }
  };

  // --- CALENDAR GENERATION MATH (Mon -> Sun) ---
  const getMonthDaysGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Day of week (0 = Sun, 1 = Mon ... 6 = Sat)
    let firstDayIndex = firstDay.getDay();
    // Adjust so Mon is 0, Sun is 6
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Days in current month
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // 1. Previous month padding days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      cells.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // 3. Next month padding days to make full 6 rows (42 cells)
    const remainingCells = 42 - cells.length;
    for (let n = 1; n <= remainingCells; n++) {
      cells.push({
        date: new Date(year, month + 1, n),
        isCurrentMonth: false,
      });
    }

    return cells;
  };

  const calendarGrid = getMonthDaysGrid();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Color mapping for peptide pills
  const getPeptidePillColor = (pepId: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      "ss-31": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/25" },
      "bpc-157": { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/25" },
      "tb-500": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/25" },
      "semaglutide": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/25" },
      "tirzepatide": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/25" },
      "ghk-cu": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/25" },
      "ipamorelin": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/25" },
      "cjc-1295-no-dac": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/25" },
    };
    return colors[pepId] || { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/25" };
  };

  // Compute stats
  const activeProtocolsCount = selectedStack ? selectedStack.peptides.length : 0;
  
  // Weekly compliance rate (last 7 days logs)
  const getWeeklyCompliance = () => {
    if (history.length === 0) return 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Check total scheduled injections in the last 7 days
    let totalScheduledInPastWeek = 0;
    let completedInPastWeek = 0;
    
    for (let i = 0; i < 7; i++) {
      const dayToCheck = new Date();
      dayToCheck.setDate(dayToCheck.getDate() - i);
      const dayStr = dayToCheck.toISOString().split("T")[0];
      
      const dayPlanned = getChecklistItemsForDate(dayToCheck);
      totalScheduledInPastWeek += dayPlanned.length;
      completedInPastWeek += dayPlanned.filter(item => item.completed).length;
    }
    
    if (totalScheduledInPastWeek === 0) return 100; // default to perfect if nothing planned
    return Math.round((completedInPastWeek / totalScheduledInPastWeek) * 100);
  };

  const weeklyCompliance = getWeeklyCompliance();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1">
      
      {/* Upper Stats Banner / Header - high fidelity to screenshot 8 */}
      <div className="lg:col-span-12 bg-[#0F1219] p-4 rounded-xl border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Research Protocols
            </h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-wide">
              Manage assays and verify calendar titration timelines
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-center md:text-right">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Active Protocols</span>
            <div className="text-lg font-black text-white font-mono">{activeProtocolsCount}</div>
          </div>
          <div className="h-8 w-px bg-slate-800/80 hidden md:block" />
          <div className="text-center md:text-right">
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">This Week Adherence</span>
            <div className="text-lg font-black text-emerald-400 font-mono">{weeklyCompliance}%</div>
          </div>
          
          {stacks.length > 0 && (
            <select
              value={selectedStackId}
              onChange={(e) => setSelectedStackId(e.target.value)}
              className="bg-[#0A0D12] px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500/70 text-slate-200 font-mono"
            >
              {stacks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Left Column: Selected Day Checklist & Filter */}
      <div className="lg:col-span-5 space-y-4">
        
        {/* Filtering buttons matching screenshot */}
        <div className="bg-[#0F1219] p-1 border border-slate-800/80 rounded-xl flex gap-1 shadow-inner">
          <button
            onClick={() => {
              setAdherenceFilter("previous");
              const prev = new Date();
              prev.setDate(prev.getDate() - 1);
              setSelectedDate(prev);
            }}
            className={`flex-1 text-center py-2 text-[10px] font-mono uppercase font-bold rounded-lg transition-all cursor-pointer ${
              adherenceFilter === "previous"
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => {
              setAdherenceFilter("today");
              setSelectedDate(new Date());
            }}
            className={`flex-1 text-center py-2 text-[10px] font-mono uppercase font-bold rounded-lg transition-all cursor-pointer ${
              adherenceFilter === "today"
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Today ({getChecklistItemsForDate(new Date()).length})
          </button>
          <button
            onClick={() => {
              setAdherenceFilter("upcoming");
              const upc = new Date();
              upc.setDate(upc.getDate() + 1);
              setSelectedDate(upc);
            }}
            className={`flex-1 text-center py-2 text-[10px] font-mono uppercase font-bold rounded-lg transition-all cursor-pointer ${
              adherenceFilter === "upcoming"
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Adherence / Dose Checklist Panel */}
        <div className="bg-[#0F1219] p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/60">
            <div>
              <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} Checklist
              </h2>
              <p className="text-[9px] text-slate-500 font-bold tracking-wide">
                Adherence Rate: {complianceRate}%
              </p>
            </div>
            
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
              {completedCount}/{checklistItems.length}
            </div>
          </div>

          {stacks.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-xs font-semibold">
                No active stacks found. Create a stack in the Stack Builder first.
              </p>
            </div>
          ) : checklistItems.length === 0 ? (
            <div className="text-center py-10 bg-[#0A0D12]/50 border border-dashed border-slate-800/60 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/80 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-300 uppercase">Off-Schedule Research Day</h4>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed mt-1 font-bold">
                No doses are planned for this date under the current protocol.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    handleToggleCheck(
                      item.id,
                      item.peptide.name,
                      item.peptide.dosageMcg,
                      item.time
                    )
                  }
                  className={`flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer ${
                    item.completed
                      ? "bg-[#0A0D12]/30 border-slate-800/40 text-slate-500 line-through"
                      : "bg-[#0A0D12] border-slate-800/85 hover:border-slate-700/80 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      readOnly
                      className="w-4.5 h-4.5 accent-emerald-500 rounded border-slate-700 bg-slate-900 cursor-pointer"
                    />
                    <div>
                      <span className={`text-xs font-bold block ${item.completed ? "text-slate-600" : "text-slate-200"}`}>
                        {item.peptide.name}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {item.time} • {item.peptide.dosageMcg} mcg
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                      {item.peptide.calculatedUnits.toFixed(1)} Units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streak Counter */}
        <div className="bg-[#0F1219] p-4 rounded-xl border border-slate-800/80 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">Research Streak</span>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {streak} {streak === 1 ? "Day" : "Days"}
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Month Calendar Grid card - high fidelity to screenshot 8 & 9 */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Calendar Card */}
        <div className="bg-[#0F1219] p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-4">
          
          {/* Calendar Header with month and prev/next arrows */}
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              Calendar view
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-white font-mono uppercase tracking-wider">
                {currentDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </span>
              <div className="flex bg-[#0A0D12] border border-slate-800 rounded-lg overflow-hidden">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-px bg-slate-800" />
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout of Calendar */}
          <div>
            {/* Weekdays names heading */}
            <div className="grid grid-cols-7 text-center border-b border-slate-800/40 pb-2 mb-2">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                <span key={day} className="text-[9px] font-bold text-slate-500 font-mono">
                  {day}
                </span>
              ))}
            </div>

            {/* Days grid cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((cell, index) => {
                const dateStr = cell.date.toISOString().split("T")[0];
                const isSelected = selectedDate.toISOString().split("T")[0] === dateStr;
                const isToday = new Date().toISOString().split("T")[0] === dateStr;

                // Find scheduled peptides for this cell date
                const scheduledPeptides: StackPeptide[] = [];
                if (selectedStack) {
                  selectedStack.peptides.forEach((pep) => {
                    if (isPeptideActiveOnDate(pep, cell.date)) {
                      scheduledPeptides.push(pep);
                    }
                  });
                }

                return (
                  <div
                    key={`${index}-${dateStr}`}
                    onClick={() => {
                      setSelectedDate(cell.date);
                      if (Math.abs(cell.date.getTime() - new Date().getTime()) < 86400000 * 2) {
                        // Set adherenceFilter tab correctly
                        const todayStr = new Date().toISOString().split("T")[0];
                        if (dateStr === todayStr) setAdherenceFilter("today");
                        else if (cell.date < new Date()) setAdherenceFilter("previous");
                        else setAdherenceFilter("upcoming");
                      }
                    }}
                    className={`min-h-[72px] p-1.5 rounded-lg border flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-indigo-500/5 border-indigo-500/60"
                        : cell.isCurrentMonth
                        ? "bg-[#0A0D12]/40 border-slate-800/50 hover:border-slate-700/60"
                        : "bg-transparent border-transparent text-slate-700 hover:border-slate-800/30"
                    }`}
                  >
                    {/* Day number with green ring if today */}
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-[10px] font-black font-mono leading-none ${
                          isToday
                            ? "text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded font-black border border-emerald-500/20"
                            : isSelected
                            ? "text-indigo-400"
                            : cell.isCurrentMonth
                            ? "text-slate-400"
                            : "text-slate-600"
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                    </div>

                    {/* Stacking protocol colored tags vertically */}
                    <div className="space-y-0.5 overflow-hidden">
                      {scheduledPeptides.map((pep) => {
                        const style = getPeptidePillColor(pep.peptideId);
                        return (
                          <div
                            key={pep.id}
                            className={`text-[8px] font-black font-sans px-1 py-0.5 rounded truncate border uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                            title={`${pep.name} (${pep.dosageMcg}mcg)`}
                          >
                            {pep.name.substring(0, 4)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* History logs inside schedule tracking */}
        <div className="bg-[#0F1219] p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              Historical logs ({history.length})
            </h3>
            {history.length > 0 && (
              <button
                onClick={handleResetHistory}
                className="text-[10px] font-bold text-rose-400 hover:underline cursor-pointer transition-all"
              >
                Clear logs
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[10px] text-slate-500 font-bold">No injection logs saved yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {history.map((log) => {
                const rawDate = log.takenAt.split(" (")[0];
                const timeStr = log.takenAt.split(" (")?.[1]?.replace(")", "") || "";
                const formattedDate = new Date(rawDate).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={log.id}
                    className="p-2.5 bg-[#0A0D12]/40 rounded-lg border border-slate-800/60 flex items-center justify-between text-xs text-slate-300 hover:border-slate-700/40 transition-all"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-200 block text-[11px]">
                        {log.peptideName}
                      </span>
                      <span className="text-[9px] text-slate-500 block font-semibold">
                        {formattedDate} {timeStr && `• ${timeStr}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-bold text-xs bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                        +{log.dosageMcg} mcg
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
