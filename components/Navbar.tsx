"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export default function Navbar({ onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  // 🔔 STATE NOTIFICATION COUNT
  const [notifCount, setNotifCount] = useState(0);

  // Efek transisi shadow & border saat scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch data profil
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => setUser(d))
      .catch(() => {});
  }, []);

  // 🔔 Fetch & Auto-reset notification logic (FIXED FOR NEW API)
  useEffect(() => {
    if (pathname === "/dashboard/notifications") {
      setNotifCount(0); // Angka hilang jika user berada di halaman notifikasi
    } else {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => {
          // Mengambil dari d.total karena API sekarang mengembalikan objek { total, notifications }
          setNotifCount(d?.total || 0);
        })
        .catch(() => setNotifCount(0));
    }
  }, [pathname]); // Trigger setiap kali pindah halaman

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    router.push("/auth/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <nav 
      className={`sticky top-0 z-[50] transition-all duration-500 ${
        scrolled 
        ? "bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]" 
        : "bg-[#0f172a] border-b border-slate-800/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LEFT SECTION: UNIQUE HAMBURGER & LOGO */}
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSidebar();
              }}
              className="group flex flex-col gap-[5px] p-2 focus:outline-none relative active:scale-90 transition-transform"
              aria-label="Toggle Sidebar"
            >
              <span className="w-6 h-[2px] bg-slate-400 rounded-full transition-all duration-300 group-hover:w-4 group-hover:bg-indigo-400"></span>
              <span className="w-4 h-[2px] bg-slate-200 rounded-full transition-all duration-300 group-hover:w-6"></span>
              <span className="w-5 h-[2px] bg-slate-400 rounded-full transition-all duration-300 group-hover:w-3 group-hover:bg-indigo-400"></span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group transition-all"
            >
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-600/50">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                Finzense
              </span>
            </Link>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-3">

            {/* 🔔 NOTIFICATION BELL - REFINED DESIGN */}
            <Link
              href="/dashboard/notifications"
              className={`relative group p-2.5 rounded-xl transition-all duration-300 ${
                pathname === "/dashboard/notifications" 
                ? "bg-indigo-500/10 text-indigo-400" 
                : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className={`w-6 h-6 transition-transform duration-300 group-hover:rotate-12 ${notifCount > 0 ? 'animate-[bell-ring_1.5s_infinite]' : ''}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75v-.563a6 6 0 10-12 0v.563a8.967 8.967 0 00-2.311 6.022 23.848 23.848 0 005.454 1.31m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>

                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] text-white flex items-center justify-center font-bold">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  </span>
                )}
              </div>
            </Link>
            
            {/* USER INFO CARD - ELEGANT STYLE */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 group shadow-lg"
            >
              <div className="hidden sm:block text-right">
                <p className="text-[8px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-0.5">Verified Account</p>
                <p className="text-sm font-medium text-slate-200 leading-none group-hover:text-white transition-colors">{user?.name || "User"}</p>
              </div>

              <div className="relative">
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500 group-hover:rotate-180 transition-all duration-700">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0f172a] flex items-center justify-center text-sm font-bold text-white border border-[#0f172a]">
                    {user?.image ? (
                      <img src={user.image} alt="Profile" className="w-full h-full object-cover transition-all group-hover:rotate-[-180deg]" />
                    ) : (
                      <span className="group-hover:rotate-[-180deg] transition-all">{initials}</span>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-[2.5px] border-[#0f172a] rounded-full shadow-sm"></div>
              </div>
            </Link>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-700/50 to-transparent mx-1 hidden sm:block" />

            <button
              onClick={handleLogout}
              className="group flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300"
              title="Logout"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" viewBox="0 0 24 24" 
                strokeWidth={2} stroke="currentColor" 
                className="w-5 h-5 group-hover:translate-x-0.5 transition-transform"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0); }
          5%, 15% { transform: rotate(15deg); }
          10%, 20% { transform: rotate(-15deg); }
          25% { transform: rotate(0); }
        }
      `}</style>
    </nav>
  );
}