import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, RefreshCw, AlertCircle, Download } from "lucide-react";
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

  const odinRoutes = parseOdin(odinData);
  const stops = parseStop(stopData);
  const statistics = parseStatistik(statistikData);

  // Combine ODIN and Stop data by route - ensure same day or show only available data
  const combinedData = useMemo(() => {
    // Get the latest date from BOTH Stop and ODIN data
    const latestStopDate = stops.length > 0 
      ? new Date(Math.max(...stops.map(s => new Date(s.date).getTime())))
      : null;
    
    const latestOdinDate = odinRoutes.length > 0
      ? new Date(Math.max(...odinRoutes.map(r => new Date(r.date).getTime())))
      : null;
    
    // Use the latest date from either source
    const latestDate = !latestStopDate ? latestOdinDate 
      : !latestOdinDate ? latestStopDate
      : latestOdinDate > latestStopDate ? latestOdinDate
      : latestStopDate;

    // Filter ODIN data to only include routes from the latest date
    const filteredOdinRoutes = latestDate
      ? odinRoutes.filter(route => {
          const routeDate = new Date(route.date);
          return routeDate.toDateString() === latestDate.toDateString();
        })
      : odinRoutes;

    // Filter Stop data to only include routes from the latest date
    const filteredStops = latestDate
      ? stops.filter(stop => {
          const stopDate = new Date(stop.date);
          return stopDate.toDateString() === latestDate.toDateString();
        })
      : stops;

    const combined = filteredOdinRoutes.map(route => {
      const stopInfo = filteredStops.find(s => s.pudRoute === route.route);
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

    // Also add routes that only have Stop data (from the latest date)
    filteredStops.forEach(stop => {
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



  // Check if route has performance alert (delivery success < 90%)
  const hasPerformanceAlert = (route: typeof sortedRoutes[0]) => {
    return route.twAdhLeveris > 0 && route.twAdhLeveris < 90;
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

        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 py-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
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
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg" style={{ color: "oklch(0.15 0.01 286)" }}>
                    {route.route}
                  </h3>
                  {hasPerformanceAlert(route) && (
                    <div className="flex items-center gap-0.5 px-1 py-0.5 rounded" style={{ background: "oklch(0.97 0.04 25)" }}>
                      <AlertCircle size={11} style={{ color: "oklch(0.45 0.22 25)" }} />
                      <span className="text-xs font-semibold" style={{ color: "oklch(0.45 0.22 25)" }}>Under 90%</span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-mono text-gray-500">{route.date ? new Date(route.date).toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}</span>
              </div>

              <div className="space-y-4">
                {/* ODIN Performance Data with Statistics */}
                {route.twAdhLeveris > 0 || route.twAdhAfhent > 0 ? (
                  <>
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
                      {route.avgTwAdhDL > 0 && (
                        <div className="mt-1 p-1 rounded" style={{ background: "oklch(0.97 0.001 286)" }}>
                          <p className="text-xs font-semibold text-gray-500">
                            Avg: {route.avgTwAdhDL.toFixed(1)}%
                          </p>
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
                  <div className="text-center py-4 text-gray-400 text-sm">
                    Ingen ODIN-data tilgængelig
                  </div>
                )}

                {/* Stop Data */}
                {route.hasStopData && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Meldt:</p>
                      <p className="text-lg font-bold" style={{ color: "oklch(0.15 0.01 286)" }}>
                        {route.meldt}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Total Stops:</p>
                      <p className="text-lg font-bold" style={{ color: "oklch(0.15 0.01 286)" }}>
                        {route.totalStops}
                      </p>
                      {route.avgTotalStops > 0 && (
                        <p className="text-xs text-gray-500">Avg: {route.avgTotalStops.toFixed(1)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">SPORH:</p>
                      <p className="text-lg font-bold" style={{ color: "oklch(0.15 0.01 286)" }}>
                        {route.sporh}
                      </p>
                      {route.avgSporh > 0 && (
                        <p className="text-xs text-gray-500">Avg: {route.avgSporh.toFixed(1)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">Pause:</p>
                      <p className="text-lg font-bold" style={{ color: "oklch(0.15 0.01 286)" }}>
                        {route.breakMinutes} min
                      </p>
                      {route.avgBreakMinutes >= 0 && (
                        <p className="text-xs text-gray-500">Avg: {route.avgBreakMinutes.toFixed(1)} min</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Average Arrival Time */}
                {route.avgCourierArrivalTm && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-600 font-semibold">Gennemsn. ankomst:</p>
                    <p className="text-lg font-bold" style={{ color: "oklch(0.15 0.01 286)" }}>
                      {route.avgCourierArrivalTm}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        </div>
        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
          <p>Platform af Filip Lade til Pakkenbilen</p>
        </div>
      </div>
    </div>
  );
}
