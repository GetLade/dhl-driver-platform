import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, RefreshCw } from "lucide-react";
import { useGoogleSheets, parseOdin, parseStop, parseStatistik } from "@/hooks/useGoogleSheets";
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

function SortIcon({ colKey, sortKey, sortDir }: { colKey: string; sortKey: SortKey; sortDir: SortDir }) {
  if (colKey !== sortKey) return <ArrowUpDown size={14} className="opacity-30" />;
  return sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}

export default function Performance() {
  const { data: odinData, loading: odinLoading, error: odinError } = useGoogleSheets("Odin");
  const { data: stopData, loading: stopLoading, error: stopError } = useGoogleSheets("Stop");
  const { data: statistikData, loading: statistikLoading } = useGoogleSheets("Statestik", "A:M");
  const [sortKey, setSortKey] = useState<SortKey>("route");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const odinRoutes = parseOdin(odinData);
  const stops = parseStop(stopData);
  const statistics = parseStatistik(statistikData);

  // Combine ODIN and Stop data by route
  const combinedData = useMemo(() => {
    const combined = odinRoutes.map(route => {
      const stopInfo = stops.find(s => s.pudRoute === route.route);
      const stats = statistics.find(s => s.route === route.route);
      return {
        ...route,
        meldt: stopInfo?.meldt || 0,
        totalStops: stopInfo?.totalStops || 0,
        sporh: stopInfo?.sporh || 0,
        breakMinutes: stopInfo?.breakMinutes || 0,
        avgCourierArrivalTm: stopInfo?.avgCourierArrivalTm || '',
        hasStopData: !!stopInfo,
        avgTotalStops: stats?.avgTotalStops || 0,
        avgBreakMinutes: stats?.avgBreakMinutes || 0,
        avgSporh: stats?.avgSporh || 0,
        avgTwAdhDL: stats?.avgTwAdhDL || 0,
      };
    });

    // Also add routes that only have Stop data
    stops.forEach(stop => {
      if (!combined.find(c => c.route === stop.pudRoute)) {
        const stats = statistics.find(s => s.route === stop.pudRoute);
        combined.push({
          date: stop.date,
          route: stop.pudRoute,
          twAdhLeveris: 0,
          tidligLeveris: 0,
          senLeveris: 0,
          twAdhAfhent: 0,
          tidligAfhent: 0,
          senAfhent: 0,
          meldt: stop.meldt,
          totalStops: stop.totalStops,
          sporh: stop.sporh,
          breakMinutes: stop.breakMinutes,
          avgCourierArrivalTm: stop.avgCourierArrivalTm,
          hasStopData: true,
          avgTotalStops: stats?.avgTotalStops || 0,
          avgBreakMinutes: stats?.avgBreakMinutes || 0,
          avgSporh: stats?.avgSporh || 0,
          avgTwAdhDL: stats?.avgTwAdhDL || 0,
        });
      }
    });

    return combined;
  }, [odinRoutes, stops, statistics]);

  const sortedRoutes = useMemo(() => {
    const sorted = [...combinedData].sort((a, b) => {
      let aVal: any = a[sortKey as keyof typeof a];
      let bVal: any = b[sortKey as keyof typeof b];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (typeof aVal === "boolean") aVal = aVal ? 1 : 0;
      if (typeof bVal === "boolean") bVal = bVal ? 1 : 0;

      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [combinedData, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data opdateret");
    }, 500);
  };

  const loading = odinLoading || stopLoading || statistikLoading;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.98 0.001 286)" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "oklch(0.15 0.01 286)" }}>
              Performance
            </h1>
            <p className="text-sm text-gray-600">Rute Performance & Stop Oversigt</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="inline-block animate-spin">
              <RefreshCw size={32} />
            </div>
            <p className="mt-2">Indlæser data...</p>
          </div>
        ) : sortedRoutes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
            <p>Ingen data fundet</p>
          </div>
        ) : (
          sortedRoutes.map((route, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg" style={{ color: "oklch(0.15 0.01 286)" }}>
                  {route.route}
                </h3>
                <span className="text-xs font-mono text-gray-500">{route.date ? new Date(route.date).toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</span>
              </div>

              <div className="space-y-4">
                {/* ODIN Performance Data with Statistics */}
                {route.twAdhLeveris > 0 || route.twAdhAfhent > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold" style={{ color: "oklch(0.55 0.01 286)" }}>
                            Leveringer
                          </span>
                          <button
                            onClick={() => handleSort("deliveryOnTime")}
                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                          >
                            <SortIcon colKey="deliveryOnTime" sortKey={sortKey} sortDir={sortDir} />
                          </button>
                        </div>
                        <PercentBar
                          onTime={route.twAdhLeveris}
                          early={route.tidligLeveris}
                          late={route.senLeveris}
                        />
                      </div>
                      {route.avgTwAdhDL > 0 && (
                        <div className="flex flex-col justify-center">
                          <span className="text-xs text-gray-500 mb-1">Gennemsnit</span>
                          <p className="text-2xl font-bold" style={{ color: "oklch(0.55 0.01 286)" }}>
                            {route.avgTwAdhDL.toFixed(1)}%
                          </p>
                          <span className="text-xs text-gray-400 mt-1">Avg twAdhDL</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{ color: "oklch(0.55 0.01 286)" }}>
                          Opsamlinger
                        </span>
                        <button
                          onClick={() => handleSort("pickupOnTime")}
                          className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                        >
                          <SortIcon colKey="pickupOnTime" sortKey={sortKey} sortDir={sortDir} />
                        </button>
                      </div>
                      <PercentBar
                        onTime={route.twAdhAfhent}
                        early={route.tidligAfhent}
                        late={route.senAfhent}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">Ingen ODIN-data tilgængelig</div>
                )}

                {/* Stop Data with Statistics */}
                {route.hasStopData && (
                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Meldt:</span>
                        <p className="font-bold text-lg" style={{ color: "oklch(0.15 0.01 286)" }}>
                          {route.meldt}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Stops:</span>
                        <p className="font-bold text-lg" style={{ color: "oklch(0.15 0.01 286)" }}>
                          {route.totalStops}
                        </p>
                        {route.avgTotalStops > 0 && (
                          <span className="text-xs text-gray-500">Avg: {route.avgTotalStops.toFixed(1)}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">SPORH:</span>
                        <p className="font-bold text-lg" style={{ color: "oklch(0.15 0.01 286)" }}>
                          {route.sporh}
                        </p>
                        {route.avgSporh > 0 && (
                          <span className="text-xs text-gray-500">Avg: {route.avgSporh.toFixed(1)}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-600">Pause:</span>
                        <p className="font-bold text-lg" style={{ color: "oklch(0.15 0.01 286)" }}>
                          {route.breakMinutes} min
                        </p>
                        {route.avgBreakMinutes > 0 && (
                          <span className="text-xs text-gray-500">Avg: {route.avgBreakMinutes.toFixed(1)} min</span>
                        )}
                      </div>
                    </div>
                    {route.avgCourierArrivalTm && (
                      <div className="text-sm">
                        <span className="text-gray-600">Gennemsn. ankomst:</span>
                        <p className="font-semibold">{route.avgCourierArrivalTm}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
          <p>Platform af Filip Lade til Pakkenbilen</p>
        </div>
      </div>
    </div>
  );
}
