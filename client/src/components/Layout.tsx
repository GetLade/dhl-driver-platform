// DHL Driver Platform – Layout Component
// Design: Clean Logistics White – DHL Red header, bottom tab navigation for mobile-first UX
import { useLocation, Link } from "wouter";
import { Plane, BarChart2, List } from "lucide-react";

const tabs = [
  { path: "/", label: "Flyoverblik", icon: Plane },
  { path: "/performance", label: "Performance", icon: BarChart2 },
  { path: "/gtliste", label: "Tag fra liste", icon: List },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.97 0.002 286)" }}>
      {/* Top Header */}
      <header
        className="sticky top-0 z-50 shadow-md"
        style={{ background: "oklch(0.45 0.22 25)" }}
      >
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            {/* DHL Logo Text */}
            <div
              className="px-2 py-0.5 rounded font-bold text-xl tracking-widest"
              style={{ background: "oklch(0.88 0.18 90)", color: "oklch(0.15 0.01 286)" }}
            >
              DHL
            </div>
            <span className="text-white font-semibold text-sm tracking-wide hidden sm:block">
              Driver Platform
            </span>
          </div>
          <div className="text-white/70 text-xs font-mono">
            {new Date().toLocaleDateString("da-DK", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 pb-20 page-enter">
        {children}
      </main>

      {/* Bottom Tab Navigation – mobile-first */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: "oklch(1 0 0)",
          borderColor: "oklch(0.88 0.004 286)",
          boxShadow: "0 -2px 12px oklch(0 0 0 / 0.08)",
        }}
      >
        <div className="flex">
          {tabs.map(({ path, label, icon: Icon }) => {
            const isActive = location === path || (path === "/performance" && location === "/odin");
            return (
              <Link
                key={path}
                href={path === "/performance" ? "/performance" : path}
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
                style={{
                  color: isActive ? "oklch(0.45 0.22 25)" : "oklch(0.55 0.01 286)",
                  borderTop: isActive ? "3px solid oklch(0.45 0.22 25)" : "3px solid transparent",
                  background: isActive ? "oklch(0.98 0.01 25)" : "transparent",
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
