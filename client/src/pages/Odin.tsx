// DHL Driver Platform – ODIN Route Performance Page
// Design: Clean Logistics White – Color-coded performance bars, sortable table
// Green = on time, Amber = early, Red = late
import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, Edit2, Check, X, Plus, Trash2 } from "lucide-react";
import { getOdinData, saveOdinData, type RoutePerformance } from "@/lib/store";
import { toast } from "sonner";

type SortKey = "route" | "deliveryOnTime" | "pickupOnTime";
type SortDir = "asc" | "desc";

function PercentBar({ onTime, early, late }: { onTime: number; early: number; late: number }) {
  return (
    <div className="space-y-1">
      <div className="flex rounded-full overflow-hidden h-2" style={{ background: "oklch(0.93 0.003 286)" }}>
        <div
          style={{ width: `${onTime}%`, background: "oklch(0.52 0.17 145)" }}
          title={`Korrekt: ${onTime}%`}
        />
        <div
          style={{ width: `${early}%`, background: "oklch(0.72 0.18 60)" }}
          title={`For tidlig: ${early}%`}
        />
        <div
          style={{ width: `${late}%`, background: "oklch(0.52 0.22 25)" }}
          title={`For sen: ${late}%`}
        />
      </div>
      <div className="flex gap-2 text-xs">
        <span
          className="px-1.5 py-0.5 rounded font-semibold font-mono"
          style={{ background: "oklch(0.95 0.05 145)", color: "oklch(0.35 0.17 145)" }}
        >
          {onTime}%
        </span>
        <span
          className="px-1.5 py-0.5 rounded font-semibold font-mono"
          style={{ background: "oklch(0.97 0.06 90)", color: "oklch(0.5 0.18 60)" }}
        >
          {early}%
        </span>
        <span
          className="px-1.5 py-0.5 rounded font-semibold font-mono"
          style={{ background: "oklch(0.97 0.04 25)", color: "oklch(0.45 0.22 25)" }}
        >
          {late}%
        </span>
      </div>
    </div>
  );
}

function ScoreBadge({ value }: { value: number }) {
  const color =
    value >= 90
      ? { bg: "oklch(0.95 0.05 145)", text: "oklch(0.35 0.17 145)" }
      : value >= 80
      ? { bg: "oklch(0.97 0.06 90)", text: "oklch(0.5 0.18 60)" }
      : { bg: "oklch(0.97 0.04 25)", text: "oklch(0.45 0.22 25)" };

  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md font-mono font-bold text-sm"
      style={{ background: color.bg, color: color.text }}
    >
      {value}%
    </span>
  );
}

interface EditRouteModalProps {
  route: RoutePerformance | null;
  onSave: (r: RoutePerformance) => void;
  onClose: () => void;
}

function EditRouteModal({ route, onSave, onClose }: EditRouteModalProps) {
  const isNew = !route;
  const [form, setForm] = useState<RoutePerformance>(
    route ?? {
      id: Date.now().toString(),
      route: "",
      deliveries: { onTime: 0, early: 0, late: 0 },
      pickups: { onTime: 0, early: 0, late: 0 },
    }
  );

  const setNum = (section: "deliveries" | "pickups", key: "onTime" | "early" | "late", val: string) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: parseInt(val) || 0 },
    }));
  };

  const handleSave = () => {
    const dTotal = form.deliveries.onTime + form.deliveries.early + form.deliveries.late;
    const pTotal = form.pickups.onTime + form.pickups.early + form.pickups.late;
    if (dTotal !== 100 || pTotal !== 100) {
      toast.error("Leveringer og opsamlinger skal summere til 100%");
      return;
    }
    onSave(form);
    onClose();
  };

  const inputClass = "w-full rounded-lg px-3 py-2 text-sm font-mono border focus:outline-none focus:ring-1";
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
            {isNew ? "Tilføj rute" : "Rediger rute"}
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "oklch(0.55 0.01 286)" }}>
              Rutenavn
            </label>
            <input
              type="text"
              value={form.route}
              onChange={(e) => setForm((p) => ({ ...p, route: e.target.value }))}
              className={inputClass}
              style={inputStyle}
              placeholder="f.eks. R01 – København N"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.45 0.22 25)" }}>
              Leveringer (skal = 100%)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["onTime", "early", "late"] as const).map((k) => (
                <div key={k}>
                  <label className="block text-xs mb-1" style={{ color: "oklch(0.6 0.01 286)" }}>
                    {k === "onTime" ? "✅ Korrekt" : k === "early" ? "🟡 Tidlig" : "🔴 Sen"} %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.deliveries[k]}
                    onChange={(e) => setNum("deliveries", k, e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.5 0.15 250)" }}>
              Opsamlinger (skal = 100%)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["onTime", "early", "late"] as const).map((k) => (
                <div key={k}>
                  <label className="block text-xs mb-1" style={{ color: "oklch(0.6 0.01 286)" }}>
                    {k === "onTime" ? "✅ Korrekt" : k === "early" ? "🟡 Tidlig" : "🔴 Sen"} %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.pickups[k]}
                    onChange={(e) => setNum("pickups", k, e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  />
                </div>
              ))}
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

export default function Odin() {
  const [routes, setRoutes] = useState<RoutePerformance[]>(getOdinData());
  const [sortKey, setSortKey] = useState<SortKey>("route");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editRoute, setEditRoute] = useState<RoutePerformance | null | "new">(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...routes].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      if (sortKey === "route") { aVal = a.route; bVal = b.route; }
      else if (sortKey === "deliveryOnTime") { aVal = a.deliveries.onTime; bVal = b.deliveries.onTime; }
      else if (sortKey === "pickupOnTime") { aVal = a.pickups.onTime; bVal = b.pickups.onTime; }
      if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [routes, sortKey, sortDir]);

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const handleSaveRoute = (r: RoutePerformance) => {
    const updated = routes.find((x) => x.id === r.id)
      ? routes.map((x) => (x.id === r.id ? r : x))
      : [...routes, r];
    setRoutes(updated);
    saveOdinData(updated);
    toast.success("Rute gemt");
  };

  const handleDelete = (id: string) => {
    const updated = routes.filter((r) => r.id !== id);
    setRoutes(updated);
    saveOdinData(updated);
    toast.success("Rute slettet");
  };

  const avgDelivery = Math.round(routes.reduce((s, r) => s + r.deliveries.onTime, 0) / routes.length);
  const avgPickup = Math.round(routes.reduce((s, r) => s + r.pickups.onTime, 0) / routes.length);

  return (
    <div className="container py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "oklch(0.15 0.01 286)" }}>
            ODIN Performance
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.01 286)" }}>
            Rute-performance oversigt
          </p>
        </div>
        <button
          onClick={() => setEditRoute("new")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white"
          style={{ background: "oklch(0.45 0.22 25)" }}
        >
          <Plus size={14} />
          Tilføj rute
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{ background: "oklch(0.95 0.05 145)", borderLeft: "4px solid oklch(0.52 0.17 145)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} style={{ color: "oklch(0.35 0.17 145)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.35 0.17 145)" }}>
              Ø Levering
            </span>
          </div>
          <div className="kpi-number" style={{ fontSize: "2.2rem", color: "oklch(0.25 0.17 145)" }}>
            {avgDelivery}%
          </div>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: "oklch(0.97 0.02 250)", borderLeft: "4px solid oklch(0.5 0.15 250)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} style={{ color: "oklch(0.4 0.15 250)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "oklch(0.4 0.15 250)" }}>
              Ø Opsamling
            </span>
          </div>
          <div className="kpi-number" style={{ fontSize: "2.2rem", color: "oklch(0.3 0.15 250)" }}>
            {avgPickup}%
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        className="rounded-lg px-4 py-2.5 flex items-center gap-4 flex-wrap"
        style={{ background: "oklch(0.97 0.002 286)", border: "1px solid oklch(0.92 0.003 286)" }}
      >
        <span className="text-xs font-semibold" style={{ color: "oklch(0.55 0.01 286)" }}>Farver:</span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.35 0.17 145)" }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "oklch(0.52 0.17 145)" }} />
          Korrekt tidsrum
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.5 0.18 60)" }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "oklch(0.72 0.18 60)" }} />
          For tidlig
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.45 0.22 25)" }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "oklch(0.52 0.22 25)" }} />
          For sen
        </span>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "route" as SortKey, label: "Rute" },
          { key: "deliveryOnTime" as SortKey, label: "Levering %" },
          { key: "pickupOnTime" as SortKey, label: "Opsamling %" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
            style={{
              background: sortKey === key ? "oklch(0.45 0.22 25)" : "oklch(1 0 0)",
              color: sortKey === key ? "oklch(1 0 0)" : "oklch(0.4 0.01 286)",
              border: sortKey === key ? "1px solid oklch(0.45 0.22 25)" : "1px solid oklch(0.88 0.004 286)",
            }}
          >
            {label}
            <SortIcon colKey={key} />
          </button>
        ))}
      </div>

      {/* Route Cards */}
      <div className="space-y-3">
        {sorted.map((route) => {
          const isExpanded = expandedId === route.id;
          return (
            <div
              key={route.id}
              className="rounded-xl overflow-hidden shadow-sm"
              style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.92 0.003 286)" }}
            >
              {/* Route Header */}
              <div
                className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : route.id)}
              >
                <div>
                  <div className="font-semibold text-sm" style={{ color: "oklch(0.15 0.01 286)" }}>
                    {route.route}
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs" style={{ color: "oklch(0.55 0.01 286)" }}>
                      Lev: <ScoreBadge value={route.deliveries.onTime} />
                    </span>
                    <span className="text-xs" style={{ color: "oklch(0.55 0.01 286)" }}>
                      Ops: <ScoreBadge value={route.pickups.onTime} />
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditRoute(route); }}
                    className="p-1.5 rounded-lg"
                    style={{ color: "oklch(0.55 0.01 286)" }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(route.id); }}
                    className="p-1.5 rounded-lg"
                    style={{ color: "oklch(0.52 0.22 25)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs transition-transform"
                    style={{
                      background: "oklch(0.94 0.003 286)",
                      color: "oklch(0.4 0.01 286)",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    ▾
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div
                  className="px-4 pb-4 space-y-4 border-t"
                  style={{ borderColor: "oklch(0.93 0.003 286)" }}
                >
                  <div className="pt-3">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.45 0.22 25)" }}>
                      Leveringer
                    </p>
                    <PercentBar
                      onTime={route.deliveries.onTime}
                      early={route.deliveries.early}
                      late={route.deliveries.late}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "oklch(0.5 0.15 250)" }}>
                      Opsamlinger
                    </p>
                    <PercentBar
                      onTime={route.pickups.onTime}
                      early={route.pickups.early}
                      late={route.pickups.late}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editRoute !== null && (
        <EditRouteModal
          route={editRoute === "new" ? null : editRoute}
          onSave={handleSaveRoute}
          onClose={() => setEditRoute(null)}
        />
      )}
    </div>
  );
}
