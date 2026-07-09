import { useState } from "react";
import { Peptide } from "../types";
import { PEPTIDE_DATABASE } from "../data";
import { Search, ChevronDown, ChevronUp, Beaker, Shield, Scale, Activity, ClipboardList } from "lucide-react";

interface PeptideCatalogProps {
  onSelectPeptide: (peptide: Peptide) => void;
  onAddToStackDirectly?: (peptide: Peptide) => void;
}

export default function PeptideCatalog({
  onSelectPeptide,
  onAddToStackDirectly,
}: PeptideCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedPeptideId, setExpandedPeptideId] = useState<string | null>(null);

  // Filter peptides
  const filteredPeptides = PEPTIDE_DATABASE.filter((pep) => {
    const matchesSearch =
      pep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pep.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pep.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pep.class.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = activeCategory === "all" || pep.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedPeptideId((prev) => (prev === id ? null : id));
  };

  const categories = [
    { id: "all", label: "All Compounds" },
    { id: "healing", label: "Healing & Repair" },
    { id: "weight", label: "Weight & Satiety" },
    { id: "gh", label: "Pituitary / GH Secretagogues" },
    { id: "cosmetic", label: "Cosmetic & Skin" },
    { id: "cognitive", label: "Cognitive / Longevity" },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Category Filter bar */}
      <div className="bg-[#0F1219] p-3.5 sm:p-4 rounded-xl border border-slate-800/80 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search research peptide library (e.g. 'BPC-157', 'Semaglutide')..."
            className="w-full bg-[#0A0D12] pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/70 text-xs text-slate-200 placeholder:text-slate-600 font-mono"
          />
        </div>

        {/* Categories Grid */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all border cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35"
                  : "bg-[#0A0D12] text-slate-400 border-slate-800/80 hover:bg-[#151B26] hover:text-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Peptides */}
      {filteredPeptides.length === 0 ? (
        <div className="text-center py-10 bg-[#0F1219] rounded-xl border border-slate-800/80">
          <Beaker className="w-10 h-10 text-slate-650 mx-auto mb-2.5" />
          <p className="text-slate-500 text-xs font-semibold">
            No research peptides found matching your filters. Try a different term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPeptides.map((pep) => {
            const isExpanded = expandedPeptideId === pep.id;
            return (
              <div
                key={pep.id}
                className="bg-[#0F1219] rounded-xl border border-slate-800/80 shadow-sm hover:border-slate-700/80 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {pep.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{pep.fullName}</p>
                    </div>
                    <span
                      className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-bold rounded font-mono border ${
                        pep.category === "healing"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : pep.category === "weight"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : pep.category === "gh"
                          ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                          : pep.category === "cosmetic"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}
                    >
                      {pep.category === "gh" ? "Growth Hormone" : pep.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {pep.description}
                  </p>

                  <div className="flex gap-4 pt-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                      <Activity className="w-3 h-3 text-slate-600" />
                      <span>Half-life: {pep.halfLife}</span>
                    </div>
                  </div>

                  {/* Expanded detail panels */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800/60 mt-3 space-y-3 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-[#0A0D12] p-2 rounded-lg border border-slate-800/40">
                          <span className="font-bold text-slate-500 block mb-0.5 uppercase tracking-wide text-[8px]">Chemical Classification</span>
                          <span className="text-slate-300 leading-snug">{pep.class}</span>
                        </div>
                        {pep.molecularWeight && (
                          <div className="bg-[#0A0D12] p-2 rounded-lg border border-slate-800/40">
                            <span className="font-bold text-slate-500 block mb-0.5 uppercase tracking-wide text-[8px]">Molecular Weight</span>
                            <span className="text-slate-300 font-mono">{pep.molecularWeight}</span>
                          </div>
                        )}
                        <div className="bg-[#0A0D12] p-2 rounded-lg border border-slate-800/40">
                          <span className="font-bold text-slate-500 block mb-0.5 uppercase tracking-wide text-[8px]">Standard Reconstitution</span>
                          <span className="text-slate-300">{pep.standardReconstitution}</span>
                        </div>
                        <div className="bg-[#0A0D12] p-2 rounded-lg border border-slate-800/40">
                          <span className="font-bold text-slate-500 block mb-0.5 uppercase tracking-wide text-[8px]">Dosage Recommendation</span>
                          <span className="text-slate-300">{pep.dosageRange}</span>
                        </div>
                      </div>

                      {pep.sequence && (
                        <div className="bg-[#0A0D12] p-2.5 rounded-lg border border-slate-800/40 text-[10px]">
                          <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wide text-[8px]">Amino Acid Sequence</span>
                          <span className="font-mono text-slate-300 block break-all tracking-wider bg-[#06080c] px-2 py-1 rounded border border-slate-800">
                            {pep.sequence}
                          </span>
                        </div>
                      )}

                      <div className="bg-[#0A0D12] p-2.5 rounded-lg border border-slate-800/40 text-[10px] leading-relaxed text-slate-300">
                        <span className="font-bold text-slate-500 block mb-1 uppercase tracking-wide text-[8px]">Typical Research Protocol</span>
                        <span>{pep.protocols}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="bg-[#090C11] px-4 py-2 border-t border-slate-800/70 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(pep.id)}
                    className="text-[10px] text-slate-400 font-bold hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        Less Details <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      </>
                    ) : (
                      <>
                        More Details <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    {onAddToStackDirectly && (
                      <button
                        onClick={() => onAddToStackDirectly(pep)}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-200 bg-[#0A0D12] px-2 py-1 rounded border border-slate-800 cursor-pointer transition-all"
                      >
                        Add to Stack
                      </button>
                    )}
                    <button
                      onClick={() => onSelectPeptide(pep)}
                      className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Beaker className="w-3 h-3" />
                      Formulate Dose
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
