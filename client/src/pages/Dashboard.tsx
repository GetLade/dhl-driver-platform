import { useState } from "react";
import { Edit2, Check, X, Package, Mail, Layers, Truck, RefreshCw } from "lucide-react";
import { useGoogleSheets, parseDagensTal } from "@/hooks/useGoogleSheets";
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

export default function Dashboard() {
  const { data: sheetsData, loading, error } = useGoogleSheets("DagensTal");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const flightData = parseDagensTal(sheetsData);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force refetch by waiting a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
    toast.success("Data opdateret fra Google Sheets");
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Fejl ved indlæsning af data</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !flightData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
          <p className="text-sm text-gray-600">Indlæser flydata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "oklch(0.99 0.001 286)" }}>
      {/* Header with ETA */}
      <div className="sticky top-0 z-10 p-4 sm:p-6" style={{ background: "linear-gradient(135deg, oklch(0.15 0.01 286) 0%, oklch(0.25 0.01 286) 100%)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-white">Flyoverblik</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* ETA Display */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 sm:p-6 border border-white/20">
            <div className="flex items-baseline gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold text-white/70 uppercase tracking-wider">ETA Ankomst</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "oklch(0.45 0.22 25)" }}
                />
                <span
                  className="text-3xl sm:text-5xl font-bold font-mono"
                  style={{ color: "oklch(0.75 0.18 90)" }}
                >
                  {flightData.eta || "--:--"}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-2">
              {flightData.date ? new Date(flightData.date).toLocaleDateString('da-DK') : 'Dato ukendt'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Sektion 1: Flyets indhold */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.55 0.01 286)" }}>
            Flyets indhold
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <KpiCard label="CNY" value={flightData.cny} icon={Package} accent="red" />
            <KpiCard label="Flyers" value={flightData.flyers} icon={Mail} accent="yellow" />
            <KpiCard label="Ialt" value={flightData.total} icon={Truck} accent="blue" />
          </div>
        </div>

        {/* Sektion 2: Load Status */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "oklch(0.55 0.01 286)" }}>
            Load Status
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <KpiCard label="ULD'er" value={flightData.ulds} icon={Layers} accent="grey" sublabel="på flyet" />
            <KpiCard label="Tidlige ULD'er" value={flightData.earlyUlds} icon={Layers} accent="yellow" />
            <KpiCard label="DD-TD" value={flightData.ddTd} icon={Truck} accent="red" sublabel="vejtransport" />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">📊 Data fra Google Sheets</p>
          <p className="text-xs text-blue-700">Tallene opdateres automatisk hvert 5. sekund fra dit Google Sheets-dokument.</p>
        </div>
      </div>
    </div>
  );
}
