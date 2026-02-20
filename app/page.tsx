"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Ornamen */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-50/50 blur-[120px]" />
        <div className="absolute top-[40%] -right-[5%] w-[30%] h-[30%] rounded-full bg-slate-200/40 blur-[100px]" />
      </div>

      {/* Navbar Landing Page */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 shadow-lg" : "bg-transparent p-2"
      }`}>
        <div className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold">F</span>
            </div>
            <h1 className={`text-2xl font-bold tracking-tight transition-colors ${scrolled ? "text-white" : "text-[#0f172a]"}`}>
              Finzense
            </h1>
          </div>
          <div className="space-x-6 flex items-center">
            <Link href="/auth/login" className={`text-sm font-bold transition-colors ${scrolled ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-indigo-600"}`}>
              Masuk
            </Link>
            <Link href="/auth/register" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 max-w-7xl mx-auto">
        {/* Hero Section */}
        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-8 border border-indigo-100">
          Solusi Keuangan Modern
        </span>
        <h2 className="text-5xl md:text-7xl font-black text-[#0f172a] leading-[1.1] mb-8 tracking-tight max-w-4xl">
          Kelola Keuangan Pribadi Jadi <span className="text-indigo-600 italic">Lebih Cerdas.</span>
        </h2>
        <p className="text-xl text-slate-500 mb-12 max-w-2xl leading-relaxed font-medium">
          Finzense membantu kamu mencatat transaksi, mengatur anggaran bulanan, hingga memantau target tabungan dalam satu aplikasi yang mudah digunakan.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 mb-28">
          <Link href="/auth/register" className="bg-[#0f172a] text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-300 hover:-translate-y-1">
            Mulai Sekarang
          </Link>
          <Link href="/auth/login" className="bg-white border-2 border-slate-200 text-slate-700 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
            Lihat Demo
          </Link>
        </div>

        {/* MOCKUP DASHBOARD (MIRIP FOTO KAMU) */}
        <div className="relative w-full max-w-6xl mx-auto">
          <div className="p-2 md:p-4 bg-white/50 backdrop-blur-md rounded-[3rem] border border-white shadow-2xl overflow-hidden">
            <div className="bg-[#f8fafc] rounded-[2.5rem] overflow-hidden border border-slate-200 flex flex-col min-h-[500px]">
              
              {/* Mockup App Navbar */}
              <div className="bg-[#0f172a] px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-[10px] text-white font-bold">F</div>
                    <span className="text-white font-bold text-sm tracking-tight">Finzense</span>
                  </div>
                  <div className="hidden md:flex gap-4">
                    <div className="bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-500/30">Dashboard</div>
                    <div className="text-slate-400 text-[10px] font-bold">Transaksi</div>
                    <div className="text-slate-400 text-[10px] font-bold">Anggaran</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-6 w-20 bg-slate-800 rounded-full border border-slate-700"></div>
                    <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600"></div>
                </div>
              </div>

              {/* Mockup App Content */}
              <div className="p-8 text-left">
                <h3 className="text-2xl font-black text-[#0f172a] mb-1">Financial Overview</h3>
                <p className="text-slate-500 text-xs mb-8">Selamat datang kembali, Keonho Ahn! Berikut ringkasan keuangan Anda.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card Saldo Utama */}
                  <div className="md:col-span-2 bg-[#0f172a] rounded-[2rem] p-8 relative overflow-hidden shadow-xl">
                    {/* Pattern Overlay mirip foto */}
                    <div className="absolute inset-0 opacity-[0.05]" 
                         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`, backgroundSize: '40px' }}>
                    </div>
                    
                    <div className="relative z-10">
                      <p className="text-indigo-300 text-[9px] font-black uppercase tracking-widest mb-2">TOTAL NET BALANCE</p>
                      <h4 className="text-white text-4xl font-bold tracking-tighter mb-10">Rp 13.730.001</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                           <p className="text-slate-400 text-[8px] font-bold uppercase mb-1">Total Pemasukan</p>
                           <p className="text-emerald-400 font-bold text-sm">+5.000.000</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                           <p className="text-slate-400 text-[8px] font-bold uppercase mb-1">Total Pengeluaran</p>
                           <p className="text-rose-400 font-bold text-sm">-1.269.999</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Keuangan Card */}
                  <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-2xl shadow-inner">✨</div>
                    <h5 className="text-[#0f172a] font-bold text-sm mb-2">Status Keuangan</h5>
                    <p className="text-slate-500 text-[10px] leading-relaxed mb-6">Aliran kas Anda sehat. Anda memiliki lebih banyak uang masuk daripada keluar.</p>
                    <button className="bg-[#0f172a] text-white text-[10px] font-bold px-5 py-2 rounded-full">Lihat Detail</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION CARA KERJA --- */}
        <div className="py-32 w-full">
          <h3 className="text-3xl font-black text-[#0f172a] mb-20">Mulai Dalam 3 Langkah Mudah</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
            {/* Dekorasi Garis (Desktop Only) */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-[2px] bg-indigo-100 -z-10"></div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-2xl font-black text-indigo-600 border border-indigo-50 mb-6">1</div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-2">Daftar Gratis</h4>
              <p className="text-slate-500 text-sm">Buat akun Finzense hanya dalam hitungan detik.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 flex items-center justify-center text-2xl font-black text-white mb-6">2</div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-2">Catat Transaksi</h4>
              <p className="text-slate-500 text-sm">Masukkan pengeluaran harianmu dengan praktis.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-2xl font-black text-indigo-600 border border-indigo-50 mb-6">3</div>
              <h4 className="font-bold text-[#0f172a] text-lg mb-2">Pantau Analisis</h4>
              <p className="text-slate-500 text-sm">Lihat laporan otomatis keuanganmu secara real-time.</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 text-left w-full">
          <div className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-indigo-200 transition-all">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="font-bold text-[#0f172a] text-xl mb-3">Pantau Anggaran</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Setel batas pengeluaran untuk tiap kategori agar tidak boros.</p>
          </div>
          <div className="group p-10 bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-2xl shadow-slate-900/20 hover:-translate-y-2 transition-all">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="font-bold text-white text-xl mb-3">Target Tabungan</h3>
            <p className="text-slate-400 leading-relaxed text-sm">Visualisasikan progres impianmu dengan fitur saving goals.</p>
          </div>
          <div className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-indigo-200 transition-all">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📱</div>
            <h3 className="font-bold text-[#0f172a] text-xl mb-3">Akses Dimana Saja</h3>
            <p className="text-slate-500 leading-relaxed text-sm">Desain responsif yang nyaman dibuka di HP maupun Laptop.</p>
          </div>
        </div>
      </main>
    </div>
  );
}