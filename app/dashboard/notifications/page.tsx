"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface Notification {
  type: "alert" | "reminder" | "achievement";
  title: string;
  message: string;
  icon?: string;
  createdAt?: string;
}

export default function NotificationsPage() {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        setData(d.notifications || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "alert":
        return "bg-rose-100 text-rose-600";
      case "reminder":
        return "bg-blue-100 text-blue-600";
      case "achievement":
        return "bg-green-100 text-green-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div
        className={`transition-all duration-300 ease-in-out bg-slate-900 z-50 
        ${isSidebarOpen ? "w-[280px]" : "w-0"} 
        fixed md:relative h-screen overflow-hidden`}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[45] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        
        {/* Background Glow Effect */}
        <div className="fixed top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[100px] -z-10" />

        {/* NAVBAR */}
        <Navbar onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        {/* HEADER */}
        <header className="sticky top-0 z-40 w-full bg-white/40 backdrop-blur-md border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-all duration-300">
                <span className="text-white text-xl">🔔</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase italic leading-none">
                  Pusat <span className="text-indigo-600">Notifikasi</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                  Monitoring Aktivitas Keuangan
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="max-w-5xl mx-auto px-6 py-10 w-full">
          
          {loading && (
            <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
              Memuat notifikasi...
            </div>
          )}

          {!loading && data.length === 0 && (
            <div className="text-center py-20 bg-white/40 border border-dashed border-slate-300 rounded-[2.5rem]">
              <div className="text-5xl mb-4">🔔</div>
              <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">
                Tidak Ada Notifikasi
              </p>
            </div>
          )}

          {!loading && data.length > 0 && (
            <div className="space-y-4">
              {data.map((n, i) => (
                <div
                  key={i}
                  className="group bg-white/70 backdrop-blur-md hover:bg-white p-6 rounded-3xl border border-white shadow-sm transition-all duration-300 flex items-start gap-5"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-100 text-xl">
                    {n.icon || "🔔"}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-slate-800 uppercase italic">
                        {n.title}
                      </h3>

                      <span
                        className={`text-[9px] font-black px-3 py-1 rounded-md uppercase ${getTypeStyle(
                          n.type
                        )}`}
                      >
                        {n.type}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 font-medium">
                      {n.message}
                    </p>

                    {n.createdAt && (
                      <p className="text-[10px] text-slate-400 mt-2 font-bold">
                        {new Date(n.createdAt).toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
