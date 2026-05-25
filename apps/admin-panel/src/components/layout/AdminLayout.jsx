import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, ClipboardList, LogOut, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const location = useLocation();

  const links = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Products", path: "/products", icon: ShoppingBag },
    { label: "Orders", path: "/orders", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen flex bg-[#0f0f1a] text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a2e] border-r border-white/5 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-white/5 gap-2">
            <Shield className="h-6 w-6 text-[#e94560]" />
            <span className="font-playfair text-xl font-bold tracking-widest text-[#e94560]">AURENZA</span>
            <span className="text-[9px] uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded text-text-secondary">Admin</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 mt-6">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || 
                               (link.path !== "/" && location.pathname.startsWith(link.path));

              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`flex items-center gap-3.5 py-3 px-4 rounded-xl text-sm font-medium tracking-wide transition-all ${
                    isActive
                      ? "bg-[#e94560]/10 border-l-4 border-[#e94560] text-white"
                      : "text-text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-[#e94560]" : "text-text-secondary"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin profile & logout */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-[#e94560]/20 flex items-center justify-center text-[#e94560] font-bold">
              {admin?.name?.[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{admin?.name}</p>
              <p className="text-[10px] text-text-secondary truncate mt-0.5">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-red-500/10 text-red-400 py-2.5 rounded-xl text-xs font-semibold border border-white/5 hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="h-20 bg-[#16213e]/40 border-b border-white/5 flex items-center justify-between px-8 relative z-10 glass">
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white uppercase">
              {links.find((l) => l.path === location.pathname || (l.path !== "/" && location.pathname.startsWith(l.path)))?.label || "Admin Console"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-secondary">Logged in as {admin?.name}</span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
