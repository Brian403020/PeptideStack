import React, { useRef, useEffect } from "react";

interface SyringeVisualizerProps {
  units: number;
  syringeSize: number; // 100, 50, or 30
  tickMarks: number;   // 100 or 50
  onPlungerChange?: (units: number) => void;
}

export default function SyringeVisualizer({
  units,
  syringeSize,
  tickMarks,
  onPlungerChange,
}: SyringeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize units within safe boundaries
  const currentUnits = Math.min(Math.max(0, units), syringeSize);

  // Percentage filled (0 to 100)
  const fillPercent = currentUnits / syringeSize;

  // Syringe dimension parameters
  const syringeWidth = 450;
  const syringeHeight = 110;
  const barrelLeft = 70;
  const barrelWidth = 280;
  const barrelTop = 20;
  const barrelHeight = 70;

  // Needle dimensions
  const needleWidth = 40;
  const needleHeight = 4;
  const needleX = barrelLeft - needleWidth;
  const needleY = barrelTop + barrelHeight / 2 - needleHeight / 2;

  // Stopper (rubber tip) positions
  const stopperWidth = 14;
  // Plunger fills from left to right.
  // When units = 0, stopper is at the very left of the barrel.
  // When units = syringeSize, stopper is at the very right of the barrel.
  const maxStopperTravel = barrelWidth - stopperWidth;
  const stopperX = barrelLeft + fillPercent * maxStopperTravel;

  // Handle click or drag interaction to set units
  const handleInteraction = (clientX: number) => {
    if (!onPlungerChange || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const svgScale = syringeWidth / rect.width;
    const clickXRelative = (clientX - rect.left) * svgScale;

    // We only care about clicks/drags inside the barrel travel area
    const travelStartX = barrelLeft;
    const travelEndX = barrelLeft + barrelWidth;

    let clickPercent = (clickXRelative - travelStartX) / (barrelWidth - stopperWidth);
    clickPercent = Math.min(Math.max(0, clickPercent), 1);

    // Round to nearest 0.5 units or 1 tick
    const rawUnits = clickPercent * syringeSize;
    const roundedUnits = Math.round(rawUnits * 2) / 2; // nearest 0.5
    onPlungerChange(roundedUnits);
  };

  // Setup drag event listeners
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPlungerChange) return;
    handleInteraction(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleInteraction(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!onPlungerChange || e.touches.length === 0) return;
    handleInteraction(e.touches[0].clientX);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length > 0) {
        handleInteraction(moveEvent.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };

    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
  };

  // Generate ticks
  const ticks: React.ReactNode[] = [];
  const tickSpacing = maxStopperTravel / syringeSize;

  // Determine tick frequency
  // Standard insulin syringe tick marks:
  // - 100 U with 100 ticks: mark every 1 unit
  // - 100 U with 50 ticks: mark every 2 units
  const tickInterval = syringeSize / tickMarks;

  for (let i = 0; i <= syringeSize; i++) {
    const x = barrelLeft + i * tickSpacing;
    const isMajor = i % 10 === 0;
    const isMedium = i % 5 === 0 && !isMajor;
    const isTick = i % tickInterval === 0 || isMajor || isMedium;

    if (!isTick) continue;

    let tickLength = 10;
    if (isMajor) tickLength = 22;
    else if (isMedium) tickLength = 15;

    ticks.push(
      <line
        key={`tick-${i}`}
        x1={x}
        y1={barrelTop}
        x2={x}
        y2={barrelTop + tickLength}
        stroke="currentColor"
        strokeWidth={isMajor ? 1.5 : 1}
        className="text-slate-700 dark:text-slate-300 transition-colors"
      />
    );

    // Number label for major ticks
    if (isMajor && i > 0 && i <= syringeSize) {
      ticks.push(
        <text
          key={`label-${i}`}
          x={x}
          y={barrelTop + tickLength + 13}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          className="fill-slate-700 dark:fill-slate-300 font-mono transition-colors"
        >
          {i}
        </text>
      );
    }
  }

  return (
    <div className="flex flex-col items-center w-full animate-fadeIn">
      <div
        ref={containerRef}
        className="w-full bg-[#0F1219] p-4 rounded-xl border border-slate-800/80 transition-all"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Syringe View ({syringeSize} Units)
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded">
            {onPlungerChange ? "Click & Drag Plunger" : "Locked Preview"}
          </span>
        </div>

        <svg
          viewBox={`0 0 ${syringeWidth} ${syringeHeight}`}
          className={`w-full h-auto select-none overflow-visible ${
            onPlungerChange ? "cursor-ew-resize" : "cursor-default"
          }`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <defs>
            {/* Fluid gradient */}
            <linearGradient id="fluidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#db2777" stopOpacity="0.5" />
            </linearGradient>
            {/* Plunger stem gradient */}
            <linearGradient id="plungerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
            </linearGradient>
            {/* Metal needle gradient */}
            <linearGradient id="needleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* 1. Metal needle extending left */}
          <line
            x1={needleX}
            y1={needleY + needleHeight / 2}
            x2={needleX + needleWidth - 10}
            y2={needleY + needleHeight / 2}
            stroke="url(#needleGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Needle cap hub */}
          <path
            d={`M ${barrelLeft - 10} ${barrelTop + 22} L ${barrelLeft} ${barrelTop + 25} L ${barrelLeft} ${barrelTop + 45} L ${barrelLeft - 10} ${barrelTop + 48} Z`}
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1"
          />

          {/* 2. Plunger Stem (green plastic rod extending right out of syringe) */}
          {/* Plunger thumb press */}
          <rect
            x={stopperX + stopperWidth + (barrelLeft + barrelWidth - (stopperX + stopperWidth)) + 40}
            y={barrelTop + 10}
            width="8"
            height={barrelHeight - 20}
            rx="2"
            fill="url(#plungerGrad)"
            stroke="#047857"
            strokeWidth="1"
          />
          {/* Plunger shaft */}
          <rect
            x={stopperX + stopperWidth - 2}
            y={barrelTop + barrelHeight / 2 - 6}
            width={(barrelLeft + barrelWidth - (stopperX + stopperWidth)) + 45}
            height="12"
            fill="url(#plungerGrad)"
            stroke="#047857"
            strokeWidth="0.5"
          />

          {/* 3. Fluid inside the barrel (drawn from left up to the stopper) */}
          {currentUnits > 0 && (
            <rect
              x={barrelLeft}
              y={barrelTop + 2}
              width={stopperX - barrelLeft + 2}
              height={barrelHeight - 4}
              fill="url(#fluidGrad)"
            />
          )}

          {/* 4. Translucent Syringe Barrel (main tube) */}
          <rect
            x={barrelLeft}
            y={barrelTop}
            width={barrelWidth}
            height={barrelHeight}
            rx="4"
            fill="currentColor"
            className="text-white/20 dark:text-slate-950/20"
            stroke="#94a3b8"
            strokeWidth="1.5"
          />

          {/* Barrel nozzle tip flange */}
          <path
            d={`M ${barrelLeft} ${barrelTop + 10} Q ${barrelLeft - 15} ${barrelTop + 15} ${barrelLeft - 15} ${barrelTop + barrelHeight / 2} Q ${barrelLeft - 15} ${barrelTop + barrelHeight - 15} ${barrelLeft} ${barrelTop + barrelHeight - 10} Z`}
            fill="#e2e8f0"
            stroke="#94a3b8"
            strokeWidth="1"
            opacity="0.9"
          />

          {/* 5. Rubber Stopper tip (black seal aligning with units) */}
          <g>
            {/* Rubber ribs */}
            <rect
              x={stopperX}
              y={barrelTop + 1.5}
              width={stopperWidth}
              height={barrelHeight - 3}
              rx="1.5"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="0.5"
            />
            {/* Front seal line */}
            <line
              x1={stopperX}
              y1={barrelTop + 2}
              x2={stopperX}
              y2={barrelTop + barrelHeight - 2}
              stroke="#334155"
              strokeWidth="1.5"
            />
          </g>

          {/* 6. Tick Graduation Lines (rendered on top of plunger and fluid) */}
          {ticks}

          {/* Outer highlight glare for 3D realism */}
          <rect
            x={barrelLeft + 2}
            y={barrelTop + 2}
            width={barrelWidth - 4}
            height="8"
            fill="#ffffff"
            opacity="0.15"
            rx="1"
          />
        </svg>

        <div className="mt-3 flex items-center justify-between bg-[#0A0D12] p-2.5 rounded-lg border border-slate-800/60 transition-all">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-mono font-bold text-slate-500">
              Syringe Fill
            </span>
            <span className="text-xs font-bold font-mono text-slate-200">
              {currentUnits.toFixed(1)} Units
            </span>
          </div>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase font-mono font-bold text-slate-500">
              Graduations
            </span>
            <span className="text-xs font-bold font-mono text-slate-200">
              {((currentUnits / syringeSize) * tickMarks).toFixed(1)} Ticks
            </span>
          </div>
          <div className="h-5 w-px bg-slate-800" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase font-mono font-bold text-slate-500">
              Fluid Volume
            </span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {(currentUnits * 0.01).toFixed(2)} mL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
