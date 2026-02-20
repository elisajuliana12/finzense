"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar"; 
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link"; 

// --- INTERFACES ---
interface Category {
  category: string;
  type: 'income' | 'expense';
  total: number;
}

interface Saving {
  goal_name: string;
  saved_amount: number;
  target_amount: number;
}

interface TransactionRecord {
  id: number;
  category_name: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transaction_date: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("User");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // STATE SIDEBAR: Default false agar awal-awal FULL LAYAR
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resSum = await fetch(`/api/summary?month=${selectedMonth}`, { cache: "no-store" });
      const dSum = await resSum.json();
      setData(dSum);
      setSavings(dSum.savings || []);

      const resProfile = await fetch("/api/profile");
      const dProfile = await resProfile.json();
      if (dProfile && dProfile.name) {
        setUserName(dProfile.name);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalIncome = Number(data?.totalIncome || 0);
  const totalExpense = Number(data?.totalExpense || 0);
  const balance = Number(data?.totalBalance || 0); 
  
  const categories: Category[] = data?.categories || [];
  const incomeCats = categories.filter((c) => c.type === 'income');
  const expenseCats = categories.filter((c) => c.type === 'expense');
  const transactions: TransactionRecord[] = data?.recentTransactions || [];

  const chartColors = ['#4338ca', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("LAPORAN KEUANGAN FINZENSE", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Nama Pengguna: ${userName}`, 14, 28);
    doc.text(`Periode Bulan: ${selectedMonth}`, 14, 33);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 38);
    doc.setDrawColor(200);
    doc.line(14, 43, 196, 43);
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`, 14, 50);
    doc.text(`Total Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`, 14, 57);
    doc.setFont("helvetica", "bold");
    doc.text(`Sisa Saldo: Rp ${balance.toLocaleString("id-ID")}`, 14, 64);

    const tableColumn = ["Tanggal", "Kategori", "Deskripsi", "Tipe", "Nominal"];
    const tableRows = transactions.map(tx => [
      new Date(tx.transaction_date).toLocaleDateString('id-ID'),
      tx.category_name.toUpperCase(),
      tx.description || "-",
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      `Rp ${Number(tx.amount).toLocaleString("id-ID")}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 70,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], fontSize: 10 },
      styles: { fontSize: 9 },
      columnStyles: { 4: { halign: 'right' } }
    });

    doc.save(`Finzense_Laporan_${userName}_${selectedMonth}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-hidden">
      
      {/* 1. SIDEBAR CONTAINER */}
      {/* Di desktop, lebar Sidebar ditentukan oleh isSidebarOpen (0px atau 280px) */}
      <div className={`transition-all duration-300 ease-in-out bg-slate-900 z-50 
        ${isSidebarOpen ? 'w-[280px]' : 'w-0'} 
        fixed md:relative h-screen overflow-hidden`}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      {/* 2. OVERLAY (Hanya muncul di Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[45] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 3. MAIN CONTENT: Area ini akan otomatis mengecil saat Sidebar di sampingnya muncul */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative transition-all duration-300">
        
        <Navbar 
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} 
        />

        {/* Background Gradient Navy */}
        <div className="absolute top-0 right-0 w-full h-[380px] bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 -z-10" />

        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 w-full relative z-10">
          
          {/* HEADER SECTION */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
  <div>
<h1 className="text-slate-900 text-3xl font-extrabold tracking-tight">
        {(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return "Selamat Pagi ☀️";
        if (hour >= 11 && hour < 15) return "Selamat Siang 🌤️";
        if (hour >= 15 && hour < 18) return "Selamat Sore 🌅";
        return "Selamat Malam 🌙";
      })()}
    </h1>
    <p className="text-slate-700 text-sm font-medium mt-1">
  Senang melihatmu lagi,{" "}
  <span className="text-indigo-600 font-bold">
    {userName || "User"}
  </span>! 👋
</p>
  </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-stretch md:self-auto shadow-xl">
              <span className="pl-4 text-[10px] font-bold text-slate-700 uppercase tracking-widest">Periode</span>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white px-4 py-2 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-white shadow-sm">
               <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className="font-semibold text-slate-500 text-sm animate-pulse">Menyinkronkan data keuangan...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* SECTION 1: MAIN CARDS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <div className="lg:col-span-2 bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(15,23,42,0.3)] relative overflow-hidden group border border-slate-700">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Total Net Balance</span>
                      <h2 className="text-4xl md:text-5xl font-bold mt-2 tracking-tighter">Rp {balance.toLocaleString("id-ID")}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 transition-all hover:bg-white/10">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Pemasukan</p>
                        <p className="text-2xl font-bold text-emerald-400">+{totalIncome.toLocaleString("id-ID")}</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/10 transition-all hover:bg-white/10">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Pengeluaran</p>
                        <p className="text-2xl font-bold text-rose-400">-{totalExpense.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-xl shadow-slate-100 transition-all duration-500 ${balance >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                    {balance >= 0 ? '✨' : '⚠️'}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Status Keuangan</h3>
                  <p className="text-slate-500 text-sm mt-3 font-medium px-4 leading-relaxed">
                    {balance >= 0 
                      ? 'Aliran kas Anda sehat. Anda memiliki lebih banyak uang masuk daripada keluar.' 
                      : 'Pengeluaran melebihi pendapatan. Coba tinjau kembali pos pengeluaran Anda.'}
                  </p>
                  <Link href="/dashboard/transactions" className="mt-6 px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200">
                      Lihat Detail
                  </Link>
                </div>
              </div>

              {/* SECTION 2: CHARTS & ALLOCATIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-8 flex items-center gap-2">
                    <span className="w-2 h-5 bg-indigo-600 rounded-full block"></span>
                    Distribusi Pemasukan
                  </h3>
                  <div className="space-y-6">
                    {incomeCats.length > 0 ? incomeCats.map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-600">{cat.category}</span>
                          <span className="text-xs font-extrabold text-slate-900">Rp {cat.total.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(79,70,229,0.4)]" 
                            style={{ width: `${(cat.total / (totalIncome || 1)) * 100}%` }} 
                          />
                        </div>
                      </div>
                    )) : <p className="text-slate-400 text-sm italic py-10 text-center">Data tidak tersedia.</p>}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-8 flex items-center gap-2">
                    <span className="w-2 h-5 bg-slate-800 rounded-full block"></span>
                    Alokasi Pengeluaran
                  </h3>
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="relative w-40 h-40 flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                        {expenseCats.reduce((acc: any[], cat, idx) => {
                          const percent = (cat.total / (totalExpense || 1)) * 100;
                          const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].percent : 0;
                          acc.push({ percent, offset, color: chartColors[idx % chartColors.length] });
                          return acc;
                        }, []).map((seg, i) => (
                          <circle 
                            key={i} cx="18" cy="18" r="15.915" 
                            fill="transparent" stroke={seg.color} strokeWidth="4" 
                            strokeDasharray={`${seg.percent} ${100 - seg.percent}`} 
                            strokeDashoffset={-seg.offset} 
                            className="transition-all duration-700 hover:opacity-80 cursor-pointer" 
                          />
                        ))}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-lg font-extrabold text-slate-800">
                          {totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0}%
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Expense<br/>Rate</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      {expenseCats.slice(0, 5).map((cat, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                            <span className="text-xs font-semibold text-slate-600">{cat.category}</span>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400">{Math.round((cat.total / (totalExpense || 1)) * 100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: SAVINGS GOALS */}
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm mb-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-bold text-slate-800 text-sm">Target Tabungan & Goals</h3>
                  <Link href="/dashboard/savings" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"> Kelola Goals </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {savings.length > 0 ? savings.map((goal, i) => {
                    const progress = (goal.saved_amount / (goal.target_amount || 1)) * 100;
                    return (
                      <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-lg transition-all group">
                        <h4 className="font-bold text-slate-700 text-sm mb-4">{goal.goal_name}</h4>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner mb-3">
                          <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400">Rp {Number(goal.saved_amount).toLocaleString("id-ID")}</span>
                          <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    );
                  }) : <p className="text-slate-400 text-sm italic col-span-3 text-center py-6">Belum ada target tabungan.</p>}
                </div>
              </div>

              {/* SECTION 4: TRANSACTIONS TABLE */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-12">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-sm">Riwayat Transaksi Terbaru</h3>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      downloadPDF();
                    }}
                    className="w-full sm:w-auto px-4 py-1.5 bg-white border border-slate-300 rounded-full text-[10px] font-bold text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm active:scale-95"
                  >
                    Unduh Laporan (PDF)
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</th>
                        <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi</th>
                        <th className="px-8 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.length > 0 ? transactions.map((tx) => (
                        <tr key={tx.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5 text-xs font-semibold text-slate-500">
                            {new Date(tx.transaction_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-8 py-5">
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-tighter">
                              {tx.category_name}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-xs font-medium text-slate-600">
                            {tx.description || <span className="text-slate-300 italic">No description</span>}
                          </td>
                          <td className={`px-8 py-5 text-right text-sm font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'income' ? '+' : '-'} Rp {Number(tx.amount).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-20 text-center text-slate-400 text-sm font-medium">Data transaksi tidak ditemukan.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}