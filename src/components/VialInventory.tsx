import React, { useState, useEffect } from "react";
import { InventoryItem } from "../types";
import { PEPTIDE_DATABASE } from "../data";
import { FlaskConical, Plus, Minus, Trash2, Check, AlertTriangle, ArrowDown } from "lucide-react";

export default function VialInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [peptideName, setPeptideName] = useState("");
  const [vialSize, setVialSize] = useState<number | "">("");
  const [quantity, setQuantity] = useState<number | "">("");

  // Load initial inventory from localStorage, or populate default stocks matching user screenshots if empty
  useEffect(() => {
    const saved = localStorage.getItem("peptideinventory");
    if (saved) {
      try {
        setInventory(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading inventory", e);
      }
    } else {
      // Seed with default stocks from screenshots to create a stunning immediate look
      const defaults: InventoryItem[] = [
        {
          id: "seed-1",
          peptideId: "ss-31",
          name: "SS-31",
          vialSizeMg: 50,
          quantity: 1,
          status: "in_stock",
        },
        {
          id: "seed-2",
          peptideId: "custom-5-amino",
          name: "5-Amino-1MQ",
          vialSizeMg: 50,
          quantity: 2,
          status: "in_stock",
        },
        {
          id: "seed-3",
          peptideId: "custom-aicar",
          name: "Aicar",
          vialSizeMg: 50,
          quantity: 4,
          status: "in_stock",
        },
        {
          id: "seed-4",
          peptideId: "mots-c",
          name: "Mots-C",
          vialSizeMg: 10,
          quantity: 4,
          status: "in_stock",
        }
      ];
      setInventory(defaults);
      localStorage.setItem("peptideinventory", JSON.stringify(defaults));
    }
  }, []);

  const saveInventory = (items: InventoryItem[]) => {
    setInventory(items);
    localStorage.setItem("peptideinventory", JSON.stringify(items));
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!peptideName.trim()) return;

    const size = typeof vialSize === "number" ? vialSize : 5;
    const qty = typeof quantity === "number" ? quantity : 1;

    // Check if item exists (matching name and size)
    const existingIndex = inventory.findIndex(
      (item) => item.name.toLowerCase() === peptideName.trim().toLowerCase() && item.vialSizeMg === size
    );

    let updated: InventoryItem[];
    if (existingIndex >= 0) {
      updated = [...inventory];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].status = getStatusForQuantity(updated[existingIndex].quantity);
    } else {
      const match = PEPTIDE_DATABASE.find(p => p.name.toLowerCase() === peptideName.trim().toLowerCase());
      const newItem: InventoryItem = {
        id: Math.random().toString(),
        peptideId: match ? match.id : "custom",
        name: peptideName.trim(),
        vialSizeMg: size,
        quantity: qty,
        status: getStatusForQuantity(qty),
      };
      updated = [...inventory, newItem];
    }

    saveInventory(updated);
    setPeptideName("");
    setVialSize("");
    setQuantity("");
  };

  const getStatusForQuantity = (qty: number): "in_stock" | "low_stock" | "out_of_stock" => {
    if (qty <= 0) return "out_of_stock";
    if (qty <= 2) return "low_stock";
    return "in_stock";
  };

  const updateQuantity = (id: string, delta: number) => {
    const updated = inventory.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          status: getStatusForQuantity(newQty),
        };
      }
      return item;
    });
    saveInventory(updated);
  };

  const updateStatus = (id: string, status: "in_stock" | "low_stock" | "out_of_stock") => {
    const updated = inventory.map((item) => {
      if (item.id === id) {
        return { ...item, status };
      }
      return item;
    });
    saveInventory(updated);
  };

  const deleteItem = (id: string) => {
    const updated = inventory.filter((item) => item.id !== id);
    saveInventory(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-1">
      
      {/* Left Column: Add Stock Card */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-[#0F1219] p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Add Stock
            </h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-wide">
              Add reconstituted or lyophilized peptide vials
            </p>
          </div>

          <form onSubmit={handleAddStock} className="space-y-4">
            
            {/* Peptide Name (Searchable / Suggestive) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1.5">
                Peptide Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. BPC-157"
                  value={peptideName}
                  onChange={(e) => setPeptideName(e.target.value)}
                  className="w-full bg-[#0A0D12] px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/70 text-slate-200"
                  list="suggested-inventory-peptides"
                />
                <datalist id="suggested-inventory-peptides">
                  {PEPTIDE_DATABASE.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Vial Size and Quantity */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1.5">
                  Vial Size
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    placeholder="e.g. 5"
                    value={vialSize}
                    onChange={(e) => setVialSize(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full bg-[#0A0D12] pl-3.5 pr-10 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/70 text-slate-200 font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-extrabold text-slate-500 font-mono uppercase">
                    mg
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === "" ? "" : parseInt(e.target.value))}
                  className="w-full bg-[#0A0D12] px-3.5 py-2.5 text-xs rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/70 text-slate-200 font-mono"
                />
              </div>
            </div>

            {/* Add Button */}
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-indigo-600/15 cursor-pointer flex items-center justify-center gap-1.5 uppercase font-mono tracking-wider"
            >
              <Plus className="w-4 h-4" /> Add Vials
            </button>
          </form>
        </div>

        {/* Low Stock Watch Out Alert */}
        {inventory.some(item => item.quantity <= 2) && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-500/90 leading-relaxed font-semibold">
              <strong className="font-bold block mb-0.5 font-sans">Low Inventory Warning</strong>
              Certain crucial peptide assays have 2 or fewer vials in active stock. Formulating a new titration stack might deplete these records immediately. Make sure to replenish stock.
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Current Stock Card */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-[#0F1219] p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
              Current Stock
            </h2>
            <p className="text-[10px] text-slate-500 font-bold tracking-wide">
              Real-time available assays and vial metrics
            </p>
          </div>

          {inventory.length === 0 ? (
            <div className="text-center py-12 bg-[#0A0D12] border border-dashed border-slate-800/50 rounded-lg">
              <FlaskConical className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-semibold">
                No stock added yet. Use the form on the left to catalog your assays.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-[#0A0D12]/60 hover:bg-[#0A0D12] rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Flask icon with beautiful lavender circle background */}
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <FlaskConical className="w-4.5 h-4.5 text-indigo-400" />
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{item.vialSizeMg}mg Vial</p>
                      
                      {/* Interactive Status Selector */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <select
                          value={item.status}
                          onChange={(e) => updateStatus(item.id, e.target.value as any)}
                          className={`text-[9px] font-bold font-mono uppercase bg-transparent border-none p-0 focus:ring-0 cursor-pointer pr-4 ${
                            item.status === "in_stock"
                              ? "text-emerald-400"
                              : item.status === "low_stock"
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          <option value="in_stock" className="bg-[#0F1219] text-emerald-400">IN STOCK</option>
                          <option value="low_stock" className="bg-[#0F1219] text-amber-400">LOW STOCK</option>
                          <option value="out_of_stock" className="bg-[#0F1219] text-rose-400">OUT OF STOCK</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right side controls: Check circle indicator, quantity adjustment stepper and delete button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                    <div className="flex items-center gap-2">
                      {/* Check mark badge */}
                      {item.quantity > 0 && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Pill-shaped Indigo Stepper block */}
                      <div className="flex items-center bg-[#0F1219] border border-slate-800 rounded-lg overflow-hidden shrink-0">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2.5 py-1 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3.5 text-xs font-bold text-white font-mono min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2.5 py-1 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
