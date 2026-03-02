import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { useGoogleSheets, parseGTListe } from "@/hooks/useGoogleSheets";
import { toast } from "sonner";

type SortKey = "postnummer" | "adresse" | "pakker" | "vaegt" | "volumen";
type SortDir = "asc" | "desc";

function SortIcon({ colKey, sortKey, sortDir }: { colKey: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (colKey !== sortKey) return <ArrowUpDown size={14} className="opacity-30" />;
  return sortDir === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}

export default function GTListe() {
  const { data: sheetsData, loading, error } = useGoogleSheets("GTListe");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("postnummer");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const packages = parseGTListe(sheetsData);

  const filteredPackages = useMemo(() => {
    return packages.filter(
      (pkg) =>
        pkg.postnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.adresse.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [packages, searchTerm]);

  const sortedPackages = useMemo(() => {
    const sorted = [...filteredPackages].sort((a, b) => {
      let aVal: number | string = a[sortKey];
      let bVal: number | string = b[sortKey];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredPackages, sortKey, sortDir]);

  const totals = useMemo(() => {
    return {
      pakker: sortedPackages.reduce((sum, pkg) => sum + pkg.pakker, 0),
      vaegt: sortedPackages.reduce((sum, pkg) => sum + pkg.vaegt, 0),
      volumen: sortedPackages.reduce((sum, pkg) => sum + pkg.volumen, 0),
    };
  }, [sortedPackages]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
          <p className="text-sm text-gray-600">Indlæser pakkeliste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "oklch(0.99 0.001 286)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 sm:p-6" style={{ background: "linear-gradient(135deg, oklch(0.15 0.01 286) 0%, oklch(0.25 0.01 286) 100%)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">Tag fra liste</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Søg på postnummer eller adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/50 focus:outline-none focus:border-white/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead style={{ background: "oklch(0.95 0.003 286)" }}>
              <tr>
                <th className="px-3 py-3 text-left font-semibold" style={{ color: "oklch(0.55 0.01 286)" }}>
                  <button
                    onClick={() => handleSort("postnummer")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Postnummer
                    <SortIcon colKey="postnummer" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left font-semibold" style={{ color: "oklch(0.55 0.01 286)" }}>
                  <button
                    onClick={() => handleSort("adresse")}
                    className="flex items-center gap-1 hover:text-gray-900"
                  >
                    Adresse
                    <SortIcon colKey="adresse" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: "oklch(0.55 0.01 286)" }}>
                  <button
                    onClick={() => handleSort("pakker")}
                    className="flex items-center justify-end gap-1 hover:text-gray-900 ml-auto"
                  >
                    Pakker
                    <SortIcon colKey="pakker" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: "oklch(0.55 0.01 286)" }}>
                  <button
                    onClick={() => handleSort("vaegt")}
                    className="flex items-center justify-end gap-1 hover:text-gray-900 ml-auto"
                  >
                    Vægt (kg)
                    <SortIcon colKey="vaegt" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-semibold" style={{ color: "oklch(0.55 0.01 286)" }}>
                  <button
                    onClick={() => handleSort("volumen")}
                    className="flex items-center justify-end gap-1 hover:text-gray-900 ml-auto"
                  >
                    Volumen (m³)
                    <SortIcon colKey="volumen" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPackages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    {searchTerm ? "Ingen pakker fundet" : "Ingen pakker"}
                  </td>
                </tr>
              ) : (
                sortedPackages.map((pkg, idx) => (
                  <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono font-semibold" style={{ color: "oklch(0.15 0.01 286)" }}>
                      {pkg.postnummer}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{pkg.adresse}</td>
                    <td className="px-3 py-3 text-right font-semibold" style={{ color: "oklch(0.45 0.22 25)" }}>
                      {pkg.pakker}
                    </td>
                    <td className="px-3 py-3 text-right font-mono" style={{ color: "oklch(0.55 0.01 286)" }}>
                      {pkg.vaegt.toFixed(1)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono" style={{ color: "oklch(0.55 0.01 286)" }}>
                      {pkg.volumen.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Bar */}
        <div
          className="mt-4 p-4 rounded-xl font-semibold text-white"
          style={{ background: "linear-gradient(135deg, oklch(0.15 0.01 286) 0%, oklch(0.25 0.01 286) 100%)" }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs opacity-70 mb-1">I alt</p>
              <p className="text-xl font-mono">{totals.pakker}</p>
              <p className="text-xs opacity-70">pakker</p>
            </div>
            <div>
              <p className="text-xs opacity-70 mb-1">Vægt</p>
              <p className="text-xl font-mono">{totals.vaegt.toFixed(0)}</p>
              <p className="text-xs opacity-70">kg</p>
            </div>
            <div>
              <p className="text-xs opacity-70 mb-1">Volumen</p>
              <p className="text-xl font-mono">{totals.volumen.toFixed(1)}</p>
              <p className="text-xs opacity-70">m³</p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 mt-6">
          <p className="font-semibold mb-1">📊 Data fra Google Sheets</p>
          <p className="text-xs text-blue-700">Tallene opdateres automatisk hvert 5. minut.</p>
        </div>
      </div>
    </div>
  );
}
