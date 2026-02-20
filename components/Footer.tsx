"use client";

import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-10 bg-[#0f172a] text-slate-400 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Left: Brand & Tagline - Style matched to Navbar Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
                <span className="text-white font-black text-sm">F</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tighter">
                Finzense
              </span>
            </div>
            <div className="hidden md:block h-4 w-[1px] bg-slate-700"></div>
            <p className="hidden md:block text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Smart Personal Finance Manager
            </p>
          </div>

          {/* Center: Quick Links - Style matched to Navbar menu items */}
          <nav className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider">
            <Link href="/transactions" className="text-slate-300 hover:text-white transition-colors">Aktivitas</Link>
            <Link href="/budgets" className="text-slate-300 hover:text-white transition-colors">Anggaran</Link>
            <Link href="/savings" className="text-slate-300 hover:text-white transition-colors">Tabungan</Link>
          </nav>

          {/* Right: System Status - Style matched to Profile Box in Navbar */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/40 rounded-full border border-slate-700 shadow-sm">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 tracking-tight uppercase">SYSTEM ACTIVE</span>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            &copy; {currentYear} Finzense Inc. <span className="mx-2 opacity-20">|</span> All Rights Reserved
          </div>
          
          <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <Link href="#" className="hover:text-indigo-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-indigo-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Spacer - Agar tidak tertutup oleh Mobile Bottom Nav dari Navbar */}
      <div className="md:hidden h-16" />
    </footer>
  );
}