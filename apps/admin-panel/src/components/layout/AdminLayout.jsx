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
    <div className="h-screen flex overflow-hidden text-white relative selection:bg-[#e94560]/30 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/5 flex flex-col justify-between relative z-20 shadow-2xl">
        <div>
          {/* Logo */}
          <div className="h-20 flex items-center px-8 border-b border-white/5 gap-3">
            <div className="relative">
              <Shield className="h-7 w-7 text-[#e94560] relative z-10" />
              <div className="absolute inset-0 bg-[#e94560] blur-md opacity-40 rounded-full" />
            </div>
            <span className="font-playfair text-xl font-bold tracking-[0.2em] text-white">AURENZA</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 mt-6">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || 
                               (link.path !== "/" && location.pathname.startsWith(link.path));

              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`flex items-center gap-3.5 py-3 px-5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${
                    isActive
                      ? "sidebar-link-active"
                      : "text-text-secondary hover:text-white hover:bg-white/5 hover:translate-x-1"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-[#e94560]" : "text-text-secondary"}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin profile & logout */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#e94560] to-red-900 flex items-center justify-center text-white font-bold shadow-inner">
              {admin?.name?.[0].toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate tracking-wide">{admin?.name}</p>
              <p className="text-[10px] text-text-secondary truncate mt-0.5">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 text-red-400 py-3 rounded-xl text-xs font-semibold border border-transparent hover:border-red-500/20 transition-all cursor-pointer group"
          >
            <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10">
        {/* Header */}
        <header className="sticky top-0 h-20 glass border-b border-white/5 flex items-center justify-between px-10 z-30">
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 rounded-full bg-[#e94560] animate-pulse" />
            <h1 className="text-lg font-bold tracking-[0.15em] text-white uppercase">
              {links.find((l) => l.path === location.pathname || (l.path !== "/" && location.pathname.startsWith(l.path)))?.label || "Admin Console"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              Admin Session Active
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="p-6 sm:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
