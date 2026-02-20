"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setUser(d))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    router.push("/auth/login");
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Transaksi", href: "/dashboard/transactions", icon: "💸" },
    { name: "Anggaran", href: "/dashboard/budgets", icon: "📅" },
    { name: "Tabungan", href: "/dashboard/savings", icon: "🏦" },
    { name: "Profil", href: "/dashboard/profile", icon: "👤" },
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-[60] flex flex-col w-64 h-screen bg-[#0f172a] border-r border-slate-800 transition-transform duration-300 ease-in-out transform 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        md:sticky md:top-0`}
    >
      {/* LOGO SECTION */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Finzense
          </span>
        </Link>
        
        <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        <p className="px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Main Menu</p>
        {menuItems.map((item) => {
          // PERBAIKAN LOGIKA DI SINI:
          // Jika item adalah Dashboard, cek kesamaan persis (exact match)
          // Jika item lain, cek apakah dimulai dengan href tersebut
          const isActive = item.href === "/dashboard" 
            ? pathname === "/dashboard" 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { if (window.innerWidth < 768 && onClose) onClose(); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive ? "bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className={`text-xl transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>{item.icon}</span>
              <span className="tracking-wide">{item.name}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
            </Link>
          );
        })}
      </nav>

      {/* USER & LOGOUT SECTION */}
      <div className="p-4 border-t border-slate-800/50">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/10 transition-all duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Logout
        </button> 
      </div>   
    </aside>  
  );
}