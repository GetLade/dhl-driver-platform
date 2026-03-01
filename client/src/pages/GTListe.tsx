// DHL Driver Platform – GT-Liste (Tag fra GT-liste)
// Design: Clean Logistics White – Scrollable table, search by postal code, weight summation
// IBM Plex Mono for numbers, large totals at bottom
import { useState, useMemo } from "react";
import { Search, Plus, Edit2, Trash2, Check, X, Package, Weight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { getGTData, saveGTData, type GTListItem } from "@/lib/store";
import { toast } from "sonner";

type SortKey = "postalCode" | "address" | "packages" | "physWeight" | "volumeWeight";
type SortDir = "asc" | "desc";

interface EditItemModalProps {
  item: GTListItem | null;
  onSave: (item: GTListItem) => void;
  onClose: () => void;
}

function EditItemModal({ item, onSave, onClose }: EditItemModalProps) {
  const isNew = !item;
  const [form, setForm] = useState<GTListItem>(
    item ?? {
      id: Date.now().toString(),
      postalCode: "",
      address: "",
      packages: 0,
      physWeight: 0,
      volumeWeight: 0,
    }
  );

  const setStr = (key: keyof GTListItem, val: string) => {
    setForm((p) => ({ ...p, [key]: val }));
  };

  const setNum = (key: keyof GTListItem, val: string) => {
    setForm((p) => ({ ...p, [key]: parseFloat(val) || 0 }));
  };

  const handleSave = () => {
    if (!form.postalCode || !form.address) {
      toast.error("Postnummer og adresse er påkrævet");
      return;
    }
    onSave(form);
    onClose();
  };

  const inputClass = "w-full rounded-lg px-3 py-2.5 text-sm border focus:outline-none focus:ring-1";
  const inputStyle = {
    border: "1px solid oklch(0.88 0.004 286)",
    background: "oklch(0.98 0.002 286)",
    color: "oklch(0.15 0.01 286)",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "oklch(1 0 0)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ background: "oklch(0.45 0.22 25)" }}
        >
          <h2 className="text-white font-semibold text-base">
            {isNew ? "Tilføj pakke" : "Rediger pakke"}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "oklch(0.55 0.01 286)" }}>
              Postnummer
            </label>
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => setStr("postalCode", e.target.value)}
              className={inputClass + " font-mono"}
              style={inputStyle}
              placeholder="f.eks. 2100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "oklch(0.55 0.01 286)" }}>
              Adresse
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setStr("address", e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="Vejnavn og nummer"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "oklch(0.55 0.01 286)" }}>
                Pakker
              </label>
              <input
                type="number"
                min={0}
                value={form.packages}
                onChange={(e) => setNum("packages", e.target.value)}
                className={inputClass + " font-mono"}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "oklch(0.55 0.01 286)" }}>
                Phys. kg
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.physWeight}
                onChange={(e) => setNum("physWeight", e.target.value)}
                className={inputClass + " font-mono"}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "oklch(0.55 0.01 286)" }}>
                Vol. kg
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={form.volumeWeight}
                onChange={(e) => setNum("volumeWeight", e.target.value)}
                className={inputClass + " font-mono"}
                style={inputStyle}
              />
            </div>
          </div>
        </div>
        <div className="px-5 py-4 flex gap-3 border-t" style={{ borderColor: "oklch(0.92 0.003 286)" }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm border"
            style={{ border: "1px solid oklch(0.88 0.004 286)", color: "oklch(0.4 0.01 286)" }}
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: "oklch(0.45 0.22 25)" }}
          >
            <Check size={16} />
            Gem
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GTListe() {
  const [items, setItems] = useState<GTListItem[]>(getGTData());
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("postalCode");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editItem, setEditItem] = useState<GTListItem | null | "new">(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) =>
        !q ||
        i.postalCode.toLowerCase().includes(q) ||
        i.address.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "string") {
          return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
        }
        return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
  }, [items, search, sortKey, sortDir]);

  const totalPackages = filtered.reduce((s, i) => s + i.packages, 0);
  const totalPhys = filtered.reduce((s, i) => s + i.physWeight, 0);
  const totalVol = filtered.reduce((s, i) => s + i.volumeWeight, 0);

  const handleSave = (item: GTListItem) => {
    const updated = items.find((x) => x.id === item.id)
      ? items.map((x) => (x.id === item.id ? item : x))
      : [...items, item];
    setItems(updated);
    saveGTData(updated);
    toast.success("Pakke gemt");
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveGTData(updated);
    toast.success("Pakke slettet");
  };

  const SortBtn = ({ colKey, label }: { colKey: SortKey; label: string }) => (
    <button
      onClick={() => handleSort(colKey)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
      style={{ color: sortKey === colKey ? "oklch(0.45 0.22 25)" : "oklch(0.55 0.01 286)" }}
    >
      {label}
      {sortKey === colKey ? (
        sortDir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />
      ) : (
        <ArrowUpDown size={10} className="opacity-40" />
      )}
    </button>
  );

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 56px - 64px)" }}>
      {/* Sticky Header */}
      <div
        className="sticky top-14 z-30 px-4 pt-4 pb-3 space-y-3"
        style={{ background: "oklch(0.97 0.002 286)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "oklch(0.15 0.01 286)" }}>
              GT-Liste
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.01 286)" }}>
              Tag fra GT-liste – varebil → lastbil
            </p>
          </div>
          <button
            onClick={() => setEditItem("new")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ background: "oklch(0.45 0.22 25)" }}
          >
            <Plus size={14} />
            Tilføj
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "oklch(0.6 0.01 286)" }}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søg på postnummer eller adresse..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none"
            style={{
              border: "1px solid oklch(0.88 0.004 286)",
              background: "oklch(1 0 0)",
              color: "oklch(0.15 0.01 286)",
            }}
          />
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "oklch(0.6 0.01 286)" }}>
            {filtered.length} af {items.length} rækker
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-semibold"
              style={{ color: "oklch(0.45 0.22 25)" }}
            >
              Ryd søgning
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-4 pb-32">
        <table className="w-full text-sm border-collapse min-w-[520px]">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: "oklch(0.97 0.002 286)", borderBottom: "2px solid oklch(0.88 0.004 286)" }}>
              <th className="text-left py-2 pr-3 w-20">
                <SortBtn colKey="postalCode" label="Post nr." />
              </th>
              <th className="text-left py-2 pr-3">
                <SortBtn colKey="address" label="Adresse" />
              </th>
              <th className="text-right py-2 pr-3 w-16">
                <SortBtn colKey="packages" label="Pkr." />
              </th>
              <th className="text-right py-2 pr-3 w-20">
                <SortBtn colKey="physWeight" label="Phys." />
              </th>
              <th className="text-right py-2 w-20">
                <SortBtn colKey="volumeWeight" label="Vol." />
              </th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <tr
                key={item.id}
                style={{
                  background: idx % 2 === 0 ? "oklch(1 0 0)" : "oklch(0.985 0.001 286)",
                  borderBottom: "1px solid oklch(0.93 0.003 286)",
                }}
              >
                <td className="py-3 pr-3">
                  <span
                    className="font-mono font-semibold text-xs px-2 py-1 rounded"
                    style={{ background: "oklch(0.97 0.01 25)", color: "oklch(0.45 0.22 25)" }}
                  >
                    {item.postalCode}
                  </span>
                </td>
                <td className="py-3 pr-3 text-xs" style={{ color: "oklch(0.3 0.01 286)" }}>
                  {item.address}
                </td>
                <td className="py-3 pr-3 text-right">
                  <span className="font-mono font-semibold text-sm" style={{ color: "oklch(0.15 0.01 286)" }}>
                    {item.packages}
                  </span>
                </td>
                <td className="py-3 pr-3 text-right">
                  <span className="font-mono text-xs" style={{ color: "oklch(0.4 0.01 286)" }}>
                    {item.physWeight.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className="font-mono text-xs" style={{ color: "oklch(0.4 0.01 286)" }}>
                    {item.volumeWeight.toFixed(1)}
                  </span>
                </td>
                <td className="py-3 pl-2">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => setEditItem(item)}
                      className="p-1.5 rounded"
                      style={{ color: "oklch(0.55 0.01 286)" }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded"
                      style={{ color: "oklch(0.52 0.22 25)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm" style={{ color: "oklch(0.6 0.01 286)" }}>
                  Ingen resultater for &quot;{search}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sticky Total Footer */}
      <div
        className="fixed bottom-16 left-0 right-0 z-20 mx-4 rounded-xl shadow-lg"
        style={{
          background: "oklch(0.15 0.01 286)",
          border: "1px solid oklch(0.25 0.01 286)",
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between gap-4">
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">
            Total ({filtered.length} rækker)
          </span>
          <div className="flex gap-4 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <Package size={13} className="text-white/50" />
              <span className="kpi-number text-white" style={{ fontSize: "1.4rem" }}>
                {totalPackages}
              </span>
              <span className="text-xs text-white/50">pkr.</span>
            </div>
            <div className="flex items-center gap-2">
              <Weight size={13} className="text-white/50" />
              <span className="kpi-number" style={{ fontSize: "1.4rem", color: "oklch(0.88 0.18 90)" }}>
                {totalPhys.toFixed(1)}
              </span>
              <span className="text-xs text-white/50">kg phys.</span>
            </div>
            <div className="flex items-center gap-2">
              <Weight size={13} className="text-white/50" />
              <span className="kpi-number text-white/70" style={{ fontSize: "1.4rem" }}>
                {totalVol.toFixed(1)}
              </span>
              <span className="text-xs text-white/50">kg vol.</span>
            </div>
          </div>
        </div>
      </div>

      {editItem !== null && (
        <EditItemModal
          item={editItem === "new" ? null : editItem}
          onSave={handleSave}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}
