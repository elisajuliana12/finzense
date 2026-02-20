"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
// IMPORT SWEETALERT2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// --- KONFIGURASI NOTIFIKASI ELEGAN ---
const swalConfig = {
  customClass: {
    popup: 'rounded-[2rem] border border-white/50 bg-white/90 backdrop-blur-xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.1)] p-6 max-w-[360px]',
    title: 'text-xl font-black uppercase italic tracking-tight text-slate-800 pt-2',
    htmlContainer: 'text-slate-500 font-medium text-xs pb-2',
    confirmButton: 'px-8 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-[10px] transition-all duration-300 mx-1 shadow-lg shadow-slate-200 hover:scale-105 active:scale-95 uppercase tracking-wider',
    cancelButton: 'px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-[10px] transition-all duration-300 mx-1 shadow-lg shadow-rose-100 hover:scale-105 active:scale-95 uppercase tracking-wider',
  },
  buttonsStyling: false,
  showClass: {
    popup: 'animate__animated animate__fadeInUp animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutDown animate__faster'
  },
  backdrop: `rgba(15, 23, 42, 0.15)`,
};

interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  limit_amount: number;
  month: string;
  actual_amount: number;
}

interface Category {
  id: number;
  name: string;
  allocation_type: string;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [statusFilter, setStatusFilter] = useState<"all" | "safe" | "warning" | "over">("all");

  const [formData, setFormData] = useState({
    category_id: "",
    limit_amount: "",
    month: new Date().toISOString().slice(0, 7),
  });

  const budgetStats = useMemo(() => {
    return budgets.reduce(
      (acc, b) => {
        acc.totalLimit += Number(b.limit_amount);
        acc.totalActual += Number(b.actual_amount);
        return acc;
      },
      { totalLimit: 0, totalActual: 0 }
    );
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const actual = Number(b.actual_amount);
      const limit = Number(b.limit_amount);
      const percent = limit > 0 ? (actual / limit) * 100 : 0;

      if (statusFilter === "over") return actual > limit;
      if (statusFilter === "warning") return percent >= 85 && percent <= 100;
      if (statusFilter === "safe") return percent < 85;
      return true;
    });
  }, [budgets, statusFilter]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resBudget = await fetch(
        `/api/budgets?month=${selectedMonth}&search=${searchTerm}&t=${Date.now()}`
      );
      const dataBudget = await resBudget.json();
      setBudgets(Array.isArray(dataBudget) ? dataBudget : []);

      const resCat = await fetch("/api/categories");
      const dataCat = await resCat.json();
      
      if (Array.isArray(dataCat)) {
        const expenseOnly = dataCat.filter((c) => 
          c.allocation_type !== "Savings" && 
          c.name.toLowerCase() !== "tabungan"
        );
        setCategories(expenseOnly);

        if (!editId && expenseOnly.length > 0 && formData.category_id === "") {
          setFormData((prev) => ({ ...prev, category_id: String(expenseOnly[0].id) }));
        }
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, searchTerm, editId, formData.category_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editId ? "PUT" : "POST";
      const res = await fetch("/api/budgets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          category_id: Number(formData.category_id),
          limit_amount: Number(formData.limit_amount),
          month: formData.month,
        }),
      });

      if (res.ok) {
        MySwal.fire({
          ...swalConfig,
          icon: 'success',
          iconColor: '#3b82f6',
          title: editId ? 'UPDATED!' : 'ACTIVATED!',
          text: editId ? "Anggaran berhasil diperbarui!" : "Anggaran baru berhasil diaktifkan!",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        
        setEditId(null);
        setFormData({
          category_id: categories.length > 0 ? String(categories[0].id) : "",
          limit_amount: "",
          month: new Date().toISOString().slice(0, 7),
        });
        fetchData();
      } else {
        MySwal.fire({ ...swalConfig, icon: 'error', iconColor: '#f43f5e', title: 'GAGAL', text: 'Gagal menyimpan data.' });
      }
    } catch (error) {
      MySwal.fire({ ...swalConfig, icon: 'error', iconColor: '#f43f5e', title: 'ERROR', text: 'Terjadi kesalahan sistem.' });
    }
  };

  const handleEdit = (b: Budget) => {
    setEditId(b.id);
    setFormData({
      category_id: String(b.category_id),
      limit_amount: String(b.limit_amount),
      month: b.month,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      ...swalConfig,
      title: 'HAPUS BUDGET?',
      text: "Alokasi anggaran ini akan dihapus dari sistem.",
      icon: 'warning',
      iconColor: '#f43f5e',
      showCancelButton: true,
      confirmButtonText: 'YA, HAPUS',
      cancelButtonText: 'BATAL',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch("/api/budgets", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          MySwal.fire({
            ...swalConfig,
            icon: 'success',
            iconColor: '#3b82f6',
            title: 'DELETED',
            text: 'Anggaran berhasil dihapus.',
            showConfirmButton: false,
            timer: 1500,
          });
          fetchData();
        }
      } catch (error) {
        MySwal.fire({ ...swalConfig, icon: 'error', title: 'GAGAL', text: 'Gagal menghapus data.' });
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans relative overflow-x-hidden">
      
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform bg-white shadow-2xl ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`flex-1 flex flex-col min-w-0 pb-20 transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "ml-0"}`}>
        
        <div className="fixed top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[100px] -z-10" />

        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <header className="sticky top-0 z-40 w-full bg-white/40 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transform -rotate-3 hover:rotate-0 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase italic leading-none">
                    Catatan <span className="text-blue-600">Anggaran</span>
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                    Alokasi Dana Presisi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/5 p-1.5 rounded-[2rem] border border-white/40 shadow-inner backdrop-blur-sm">
                <div className="px-5 py-2 bg-white/80 rounded-full shadow-sm border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Terpakai Total</p>
                  <p className="text-sm font-black text-blue-600">
                    Rp {budgetStats.totalActual.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="hidden sm:block px-4 border-l border-slate-200/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Limit Total</p>
                  <p className="text-xs font-bold text-slate-700">Rp {budgetStats.totalLimit.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8">
                  <h2 className="text-white text-lg font-black uppercase italic tracking-wider">
                    {editId ? "Update Anggaran" : "Anggaran Baru"}
                  </h2>
                  <p className="text-blue-100 text-[10px] font-bold uppercase mt-1">Tetapkan batas belanja cerdas anda</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kategori Belanja</label>
                    <select
                      className="w-full px-4 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Limit Nominal</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                      <input
                        type="number"
                        className="w-full pl-12 pr-5 py-4 bg-white/50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-black text-xl outline-none"
                        placeholder="0"
                        value={formData.limit_amount}
                        onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Periode Bulan</label>
                    <input
                      type="month"
                      className="w-full px-5 py-4 bg-white/50 border border-slate-100 rounded-2xl font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      editId ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100" : "bg-slate-900 hover:bg-blue-600 text-white shadow-slate-200"
                    }`}
                  >
                    {editId ? "SIMPAN PERUBAHAN" : "AKTIFKAN ANGGARAN"}
                  </button>
                  {editId && (
                    <button onClick={() => {
                      setEditId(null);
                      setFormData({ category_id: String(categories[0]?.id || ""), limit_amount: "", month: new Date().toISOString().slice(0, 7) });
                    }} type="button" className="w-full text-[10px] font-black text-slate-400 uppercase hover:text-rose-500 transition-colors">
                      Batal Edit
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <input 
                    type="text"
                    placeholder="Cari alokasi anggaran..."
                    className="w-full pl-12 pr-6 py-4 bg-white/70 backdrop-blur-sm border border-white rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <input 
                  type="month"
                  className="px-6 py-4 bg-white/70 backdrop-blur-sm border border-white rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-slate-800"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "Semua", color: "bg-slate-200 text-slate-600" },
                  { id: "safe", label: "Aman", color: "bg-emerald-100 text-emerald-600" },
                  { id: "warning", label: "Peringatan", color: "bg-amber-100 text-amber-600" },
                  { id: "over", label: "Over Budget", color: "bg-rose-100 text-rose-600" }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      statusFilter === f.id 
                        ? "ring-2 ring-blue-500 ring-offset-2 scale-105 shadow-md " + f.color
                        : "bg-white text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="text-center py-20 bg-white/40 border border-dashed border-slate-300 rounded-[2.5rem] animate-pulse">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Menyusun Anggaran...</p>
                </div>
              ) : filteredBudgets.length === 0 ? (
                <div className="text-center py-20 bg-white/40 border border-dashed border-slate-300 rounded-[2.5rem]">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 2v-6m-8 13h11a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">
                    {searchTerm || statusFilter !== "all" ? "Data Tidak Ditemukan" : "Belum Ada Anggaran"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredBudgets.map((b) => {
                    const actual = Number(b.actual_amount);
                    const limit = Number(b.limit_amount);
                    const percent = limit > 0 ? (actual / limit) * 100 : 0;
                    const isOver = actual > limit;
                    const isWarning = percent >= 85 && percent <= 100;

                    // Dinamika warna untuk progress bar (Tabungan Style)
                    const barColor = isOver 
                      ? "from-rose-500 to-red-600 shadow-rose-200" 
                      : isWarning 
                        ? "from-amber-400 to-orange-500 shadow-amber-200" 
                        : "from-blue-500 to-indigo-600 shadow-blue-200";

                    return (
                      <div key={b.id} className="group bg-white/80 backdrop-blur-md hover:bg-white p-5 rounded-[2rem] border border-white shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex gap-3">
                            {/* Icon Box Perkecil: w-12 ke w-10 */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border border-white transition-transform duration-500 group-hover:rotate-6 ${isOver ? 'bg-rose-50' : isWarning ? 'bg-amber-50' : 'bg-blue-50'}`}>
                               <svg className={`w-5 h-5 ${isOver ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                               </svg>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-0.5">
                                {new Date(b.month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                              </p>
                              {/* Font Judul Perkecil: text-lg ke text-base */}
                              <h3 className="text-base font-black text-slate-800 uppercase italic leading-none truncate max-w-[120px]">
                                {b.category_name}
                              </h3>
                            </div>
                          </div>
                          {/* Button Container: opacity dikurangi dikit */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button onClick={() => handleEdit(b)} className="p-1.5 text-slate-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm bg-white border border-slate-50">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                            </button>
                            <button onClick={() => handleDelete(b.id)} className="p-1.5 text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm bg-white border border-slate-50">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Realisasi</p>
                              {/* Nominal Perkecil: text-xl ke text-lg */}
                              <p className={`text-lg font-black tracking-tight ${isOver ? "text-rose-600" : isWarning ? "text-amber-500" : "text-blue-600"}`}>
                                Rp {actual.toLocaleString("id-ID")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{isOver ? "Over" : "Sisa"}</p>
                              <div className="flex items-center gap-1 justify-end">
                                <span className={`w-1 h-1 rounded-full animate-pulse ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                <p className={`text-xs font-black ${isOver ? "text-rose-600" : "text-slate-800"}`}>
                                  Rp {Math.abs(limit - actual).toLocaleString("id-ID")}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="relative pt-1">
                            {/* Progress Bar Perkecil: h-4 ke h-3 */}
                            <div className="relative h-3 bg-slate-100/80 rounded-full overflow-hidden border border-white shadow-inner">
                              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                              <div 
                                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-[2000ms] ease-out shadow-lg`} 
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                                <div className="absolute inset-0 w-full h-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"></div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Limit:</span>
                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Rp {limit.toLocaleString("id-ID")}</span>
                              </div>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm border border-white ${isOver ? 'bg-rose-500 text-white shadow-rose-100' : isWarning ? 'bg-amber-400 text-white shadow-amber-100' : 'bg-blue-600 text-white shadow-blue-100'}`}>
                                {percent.toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}