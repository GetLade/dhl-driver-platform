// DHL Driver Platform – Dashboard / Flyoverblik
// Design: Clean Logistics White – Large KPI numbers, DHL Red/Yellow brand colors
// IBM Plex Mono for numbers, IBM Plex Sans for labels
import { useState, useEffect } from "react";
import { Edit2, Check, X, Package, Mail, Layers, Truck, RefreshCw, Clock } from "lucide-react";
import { getFlightData, saveFlightData, type FlightData } from "@/lib/store";
import { toast } from "sonner";

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  sublabel,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent?: "red" | "yellow" | "blue" | "grey";
  sublabel?: string;
}) {
  const accentStyles = {
    red: { border: "oklch(0.45 0.22 25)", bg: "oklch(0.98 0.01 25)", iconColor: "oklch(0.45 0.22 25)" },
    yellow: { border: "oklch(0.75 0.18 90)", bg: "oklch(0.99 0.03 90)", iconColor: "oklch(0.6 0.18 90)" },
    blue: { border: "oklch(0.5 0.15 250)", bg: "oklch(0.97 0.02 250)", iconColor: "oklch(0.5 0.15 250)" },
    grey: { border: "oklch(0.7 0.005 286)", bg: "oklch(0.98 0.002 286)", iconColor: "oklch(0.55 0.01 286)" },
  };
  const style = accentStyles[accent ?? "grey"];

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2 shadow-sm"
      style={{
        background: style.bg,
        borderLeft: `4px solid ${style.border}`,
        border: `1px solid oklch(0.9 0.003 286)`,
        borderLeftWidth: "4px",
        borderLeftColor: style.border,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.55 0.01 286)" }}>
          {label}
        </span>
        <Icon size={16} style={{ color: style.iconColor }} />
      </div>
      <div
        className="kpi-number count-animate"
        style={{ fontSize: "clamp(1.8rem, 7vw, 2.5rem)", lineHeight: 1, color: "oklch(0.15 0.01 286)", fontWeight: 600 }}
      >
        {value}
      </div>
      {sublabel && (
        <span className="text-xs" style={{ color: "oklch(0.6 0.01 286)" }}>{sublabel}</span>
      )}
    </div>
  );
}

interface EditModalProps {
  data: FlightData;
  onSave: (d: FlightData) => void;
  onClose: () => void;
}

function EditModal({ data, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState<FlightData>({ ...data });

  const handleChange = (key: keyof FlightData, val: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: ["cny", "flyers", "ulds", "earlyUlds", "ddTd"].includes(key)
        ? parseInt(val) || 0
        : val,
    }));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const fields: { key: keyof FlightData; label: string; type: "time" | "date" | "number" }[] = [
    { key: "etaDate", label: "ETA Dato", type: "date" },
    { key: "eta", label: "ETA Tidspunkt", type: "time" },
    { key: "cny", label: "CNY (pakker)", type: "number" },
    { key: "flyers", label: "Flyers (konvolutter)", type: "number" },
    { key: "ulds", label: "ULD'er på flyet", type: "number" },
    { key: "earlyUlds", label: "Tidlige ULD'er", type: "number" },
    { key: "ddTd", label: "DD-TD (vejtransport)", type: "number" },
  ];

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
          <h2 className="text-white font-semibold text-base">Opdater Flydata</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          {fields.map(({ key, label, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "oklch(0.55 0.01 286)" }}>
                {label}
              </label>
              <input
                type={type}
                value={String(form[key])}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded-lg px-3 py-2.5 text-base font-mono border focus:outline-none focus:ring-2"
                style={{
                  border: "1px solid oklch(0.88 0.004 286)",
                  background: "oklch(0.98 0.002 286)",
                  color: "oklch(0.15 0.01 286)",
                }}
              />
            </div>
          ))}
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
            Gem data
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<FlightData>(getFlightData());
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    setData(getFlightData());
  }, []);

  const handleSave = (newData: FlightData) => {
    saveFlightData(newData);
    setData(newData);
    toast.success("Flydata opdateret");
  };

  const total = data.cny + data.flyers;

  const formatETA = () => {
    const date = new Date(`${data.etaDate}T${data.eta}`);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const dayStr = isToday
      ? "I dag"
      : date.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "short" });
    return { time: data.eta, day: dayStr };
  };

  const eta = formatETA();

  const lastUpdated = new Date(data.lastUpdated).toLocaleString("da-DK", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
  });

  return (
    <div className="container py-4 space-y-5">
      {/* ETA Hero Section */}
      <div
        className="rounded-2xl overflow-hidden shadow-md relative"
        style={{ background: "oklch(0.45 0.22 25)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663392980405/fKvyyNk7oPfYfEqykoWEyN/dhl-header-bg-Ss4VdptvEfdbJ2eJovTnBJ.webp)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative px-5 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "oklch(0.88 0.18 90)" }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "oklch(0.88 0.18 90)" }} />
                </span>
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                  ETA – Flyets ankomst
                </span>
              </div>
              <div
                className="kpi-number text-white"
                style={{ fontSize: "clamp(3rem, 12vw, 5rem)", lineHeight: 1, letterSpacing: "-0.03em" }}
              >
                {eta.time}
              </div>
              <div className="text-white/80 text-sm font-medium mt-1 capitalize">{eta.day}</div>
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "oklch(1 0 0 / 0.15)", color: "oklch(1 0 0)" }}
            >
              <Edit2 size={13} />
              Rediger
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
            <RefreshCw size={11} className="text-white/40" />
            <span className="text-white/40 text-xs">Opdateret: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Section 1: Flyets indhold */}
      <section>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
          style={{ color: "oklch(0.55 0.01 286)" }}
        >
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ background: "oklch(0.45 0.22 25)" }}
          />
          Flyets indhold
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard label="CNY" value={data.cny.toLocaleString("da-DK")} icon={Package} accent="red" sublabel="pakker" />
          <KpiCard label="Flyers" value={data.flyers.toLocaleString("da-DK")} icon={Mail} accent="yellow" sublabel="konvolutter" />
          <div
            className="rounded-xl p-4 flex flex-col gap-2 shadow-sm col-span-3"
            style={{
              background: "oklch(0.15 0.01 286)",
              borderLeft: "4px solid oklch(0.88 0.18 90)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Total
              </span>
              <Layers size={16} className="text-yellow-300" />
            </div>
            <div
            className="kpi-number count-animate"
            style={{ fontSize: "clamp(2.2rem, 9vw, 3rem)", lineHeight: 1, color: "oklch(0.88 0.18 90)", fontWeight: 600 }}
            >
              {total.toLocaleString("da-DK")}
            </div>
            <span className="text-xs text-white/50">CNY + Flyers samlet</span>
          </div>
        </div>
      </section>

      {/* Section 2: Load status */}
      <section>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
          style={{ color: "oklch(0.55 0.01 286)" }}
        >
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ background: "oklch(0.5 0.15 250)" }}
          />
          Load Status
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <KpiCard
            label="ULD'er"
            value={data.ulds}
            icon={Layers}
            accent="blue"
            sublabel="på flyet"
          />
          <KpiCard
            label="Tidlige ULD'er"
            value={data.earlyUlds}
            icon={Clock}
            accent="yellow"
            sublabel="ankommet tidligt"
          />
          <KpiCard
            label="DD-TD"
            value={data.ddTd}
            icon={Truck}
            accent="grey"
            sublabel="vejtransport"
          />
        </div>
      </section>

      {/* Quick update hint */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: "oklch(0.97 0.01 25)", border: "1px solid oklch(0.9 0.04 25)" }}
      >
        <Edit2 size={14} style={{ color: "oklch(0.45 0.22 25)" }} />
        <p className="text-xs" style={{ color: "oklch(0.45 0.22 25)" }}>
          Tryk <strong>Rediger</strong> øverst for at opdatere tallene fra mail — ingen kodeændringer nødvendigt.
        </p>
      </div>

      {showEdit && (
        <EditModal data={data} onSave={handleSave} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}
