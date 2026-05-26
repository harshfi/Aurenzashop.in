import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, ClipboardList, LogOut, Shield, Menu, X, TicketPercent, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const links = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Products", path: "/products", icon: ShoppingBag },
    { label: "Orders", path: "/orders", icon: ClipboardList },
    { label: "Coupons", path: "/coupons", icon: TicketPercent },
    { label: "Customers", path: "/customers", icon: Users },
  ];

  const activeLabel = links.find((l) => l.path === location.pathname || (l.path !== "/" && location.pathname.startsWith(l.path)))?.label || "Admin Console";

  return (
    <div className="min-h-screen admin-shell text-slate-900">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(138,90,45,0.15),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(61,42,26,0.14),transparent_28%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1480px]">
        {mobileNavOpen && <button className="fixed inset-0 z-30 bg-slate-900/25 lg:hidden" onClick={() => setMobileNavOpen(false)} aria-label="Close menu" />}

        <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[#8a5a2d1f] bg-white/95 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-full flex-col justify-between p-5">
            <div>
              <div className="mb-7 flex items-center gap-3 rounded-2xl border border-[#8a5a2d24] bg-[#f7efe3] p-4">
                <div className="rounded-xl bg-[#8a5a2d1a] p-2 text-[#8a5a2d]">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-wide text-[#1c130c]">Aurenza</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a5a2d]">Admin Console</p>
                </div>
              </div>

              <nav className="space-y-1.5">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path || (link.path !== "/" && location.pathname.startsWith(link.path));
                  return (
                    <Link
                      key={link.label}
                      to={link.path}
                      onClick={() => setMobileNavOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${isActive ? "bg-[#1c130c] text-white shadow-md shadow-[#1c130c33]" : "text-slate-600 hover:bg-[#f7efe3] hover:text-[#8a5a2d]"}`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-500 group-hover:text-[#8a5a2d]"}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e5d6] font-bold text-[#8a5a2d]">{admin?.name?.[0]?.toUpperCase() || "A"}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{admin?.name}</p>
                  <p className="truncate text-xs text-slate-500">{admin?.email}</p>
                </div>
              </div>
              <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#8a5a2d1f] bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileNavOpen((prev) => !prev)} className="inline-flex rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:text-indigo-700 lg:hidden" aria-label="Toggle menu">
                  {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a5a2d]">Aurenza Control Center</p>
                  <h1 className="text-base font-semibold tracking-wide text-slate-900 sm:text-lg">{activeLabel}</h1>
                </div>
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">Signed in as {admin?.name}</p>
            </div>
          </header>

          <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
