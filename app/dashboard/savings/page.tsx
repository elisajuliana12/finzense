"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
// IMPORT SWEETALERT2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// --- KONFIGURASI SWEETALERT2 (TEMA GLASSMORPHISM) ---
const swalConfig = {
  customClass: {
    popup: 'rounded-[2rem] border border-white/50 bg-white/90 backdrop-blur-xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.1)] p-6 max-w-[360px]',
    title: 'text-xl font-black uppercase italic tracking-tight text-slate-800 pt-2',
    htmlContainer: 'text-slate-500 font-medium text-xs pb-2',
    confirmButton: 'px-8 py-3 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold text-[10px] transition-all duration-300 mx-1 shadow-lg shadow-slate-200 hover:scale-105 active:scale-95 uppercase tracking-wider',
    cancelButton: 'px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-[10px] transition-all duration-300 mx-1 shadow-lg shadow-rose-100 hover:scale-105 active:scale-95 uppercase tracking-wider',
  },
  buttonsStyling: false,
  showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
  hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' },
  backdrop: `rgba(15, 23, 42, 0.15)`,
};

export default function SavingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State Filter Baru
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState<{ id: number; name: string } | null>(null);
  const [savingInput, setSavingInput] = useState("");
  
  // State saldo
  const [totalBalance, setTotalBalance] = useState(0);

  const savingsStats = useMemo(() => {
    return goals.reduce(
      (acc, g) => {
        acc.totalSaved += Number(g.saved_amount || 0);
        acc.totalTarget += Number(g.target_amount || 0);
        return acc;
      },
      { totalSaved: 0, totalTarget: 0 }
    );
  }, [goals]);

  // Logika Filter Data
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const saved = Number(g.saved_amount || 0);
      const target = Number(g.target_amount || 0);
      const progress = target > 0 ? (saved / target) * 100 : 0;
      
      // Filter berdasarkan pencarian nama
      const matchesSearch = g.goal_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterStatus === "completed") return progress >= 100;
      if (filterStatus === "active") return progress < 100;
      return true; // "all"
    });
  }, [goals, filterStatus, searchTerm]);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions?mode=stats", { 
        cache: 'no-store',
        headers: { "Accept": "application/json" }
      });
      
      if (!res.ok) return;
      const data = await res.json();
      setTotalBalance(Number(data.totalBalance || 0));
    } catch (err) {
      console.error("Gagal mengambil saldo:", err);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      // Menghapus query search dari API agar filtering dilakukan di Client side (lebih responsif)
      const res = await fetch(`/api/savings?t=${Date.now()}`);
      if (!res.ok) throw new Error("Gagal fetch data");
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal mengambil data tabungan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
    fetchBalance();
  }, [fetchGoals, fetchBalance]);

  const openSavingModal = (id: number, name: string) => {
    setActiveGoal({ id, name });
    setSavingInput("");
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountToAdd = Number(savingInput);

    // 1. Validasi Dasar
    if (!activeGoal || isNaN(amountToAdd) || amountToAdd <= 0) {
        MySwal.fire({ ...swalConfig, icon: 'error', title: 'INPUT TIDAK VALID', text: 'Masukkan nominal yang benar.' });
        return;
    }

    // 2. Validasi Saldo (Pencegahan Minus)
    if (amountToAdd > totalBalance) {
      MySwal.fire({
        ...swalConfig,
        icon: 'error',
        title: 'SALDO KURANG!',
        text: `Saldo Anda (Rp ${totalBalance.toLocaleString("id-ID")}) tidak mencukupi untuk menabung Rp ${amountToAdd.toLocaleString("id-ID")}.`,
      });
      return;
    }

    try {
      const res = await fetch("/api/savings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: activeGoal.id, 
          add_amount: amountToAdd 
        }),
      });

      if (res.ok) {
        MySwal.fire({
          ...swalConfig,
          icon: 'success',
          iconColor: '#3b82f6',
          title: 'BERHASIL SIMPAN!',
          text: `Rp ${amountToAdd.toLocaleString("id-ID")} berhasil dialokasikan ke ${activeGoal.name}`,
          showConfirmButton: false,
          timer: 2000,
        });
        setIsModalOpen(false);
        setSavingInput("");
        await fetchGoals();
        await fetchBalance(); 
      } else {
        throw new Error("Gagal update");
      }
    } catch (err) {
      MySwal.fire({ ...swalConfig, icon: 'error', title: 'GAGAL!', text: 'Terjadi kesalahan sistem.' });
    }
  };

  const addGoal = async (e: any) => {
    e.preventDefault();
    if (Number(targetAmount) <= 0) return;

    const res = await fetch("/api/savings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal_name: goalName, target_amount: Number(targetAmount) }),
    });

    if (res.ok) {
      MySwal.fire({ ...swalConfig, icon: 'success', title: 'TARGET DIAKTIFKAN!', showConfirmButton: false, timer: 2000 });
      setGoalName("");
      setTargetAmount("");
      fetchGoals();
    }
  };

  const saveEdit = async (g: any) => {
    const res = await fetch("/api/savings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: g.id, 
        goal_name: g.goal_name, 
        target_amount: Number(g.target_amount) 
      }),
    });
    
    if (res.ok) {
      setEditingId(null);
      MySwal.fire({ ...swalConfig, icon: 'success', title: 'DATA DIPERBARUI', showConfirmButton: false, timer: 1500 });
      fetchGoals();
    }
  };

  const deleteGoal = async (id: number) => {
    const result = await MySwal.fire({
      ...swalConfig,
      title: 'HAPUS IMPIAN?',
      text: "Data tabungan ini akan dihapus. Saldo yang sudah masuk tidak akan otomatis kembali ke saldo utama kecuali Anda mengaturnya di sistem.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'YA, HAPUS',
      cancelButtonText: 'BATAL',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      const res = await fetch("/api/savings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      
      if (res.ok) {
        MySwal.fire({ ...swalConfig, icon: 'success', title: 'TARGET DIHAPUS', showConfirmButton: false, timer: 1500 });
        fetchGoals();
        fetchBalance();
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans relative overflow-x-hidden">
      
      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform bg-white shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col min-w-0 pb-20 transition-all duration-300 ${isSidebarOpen ? "md:ml-64" : "ml-0"}`}>
        <div className="fixed top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[100px] -z-10" />

        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <header className="sticky top-0 z-40 w-full bg-white/40 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-6 py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transform -rotate-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase italic leading-none">
                    Catatan <span className="text-blue-600">Tabungan</span>
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">Mimpi Besar, Nabung Pintar</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/5 p-1.5 rounded-[2rem] border border-white/40 shadow-inner backdrop-blur-sm">
                <div className="px-5 py-2 bg-white/80 rounded-full shadow-sm border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Terkumpul</p>
                  <p className="text-sm font-black text-blue-600">Rp {savingsStats.totalSaved.toLocaleString("id-ID")}</p>
                </div>
                <div className="hidden sm:block px-4 border-l border-slate-200/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase">Target Total</p>
                  <p className="text-xs font-bold text-slate-700">Rp {savingsStats.totalTarget.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* FORM INPUT TABUNGAN */}
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8">
                  <h2 className="text-white text-lg font-black uppercase italic tracking-wider">Target Baru</h2>
                  <p className="text-blue-100 text-[10px] font-bold uppercase mt-1">Wujudkan impian anda sekarang</p>
                </div>

                <form onSubmit={addGoal} className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Impian</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-white/50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      placeholder="Contoh: Beli Laptop Baru"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Target Nominal</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                      <input
                        type="number"
                        className="w-full pl-12 pr-5 py-4 bg-white/50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-black text-xl outline-none"
                        placeholder="0"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                    Mulai Menabung
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT: LIST TABUNGAN */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                  <input 
                    type="text"
                    placeholder="Cari target impian..."
                    className="w-full pl-12 pr-6 py-4 bg-white/70 backdrop-blur-sm border border-white rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>

                {/* TAB FILTER STATUS */}
                <div className="flex p-1.5 bg-slate-900/5 backdrop-blur-sm border border-white/50 rounded-2xl self-start">
                  <button 
                    onClick={() => setFilterStatus("all")}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Semua
                  </button>
                  <button 
                    onClick={() => setFilterStatus("active")}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === "active" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Proses
                  </button>
                  <button 
                    onClick={() => setFilterStatus("completed")}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === "completed" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    Selesai
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-20 bg-white/40 border border-dashed border-slate-300 rounded-[2.5rem] animate-pulse">
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Menghitung Impian...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {filteredGoals.length === 0 ? (
                    <div className="text-center py-20 bg-white/40 border border-dashed border-slate-300 rounded-[2.5rem]">
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">
                        {filterStatus === "completed" ? "Belum ada target yang selesai" : "Belum Ada Target Impian"}
                      </p>
                    </div>
                  ) : filteredGoals.map((g) => {
                    const saved = Number(g.saved_amount || 0);
                    const target = Number(g.target_amount || 0);
                    const progress = target > 0 ? (saved / target) * 100 : 0;
                    const isCompleted = progress >= 100;

                    return (
                      <div key={g.id} className="group bg-white/60 backdrop-blur-md hover:bg-white p-6 rounded-[2rem] border border-white shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500">
                        {editingId === g.id ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-300">
                            <input className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" value={g.goal_name} onChange={(e) => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, goal_name: e.target.value } : x))} />
                            <input type="number" className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm" value={g.target_amount} onChange={(e) => setGoals(prev => prev.map(x => x.id === g.id ? { ...x, target_amount: e.target.value } : x))} />
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(g)} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase">Simpan</button>
                              <button onClick={() => setEditingId(null)} className="px-5 py-2 bg-slate-100 text-slate-400 rounded-lg font-black text-[10px] uppercase">Batal</button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-800 uppercase italic tracking-tight group-hover:text-blue-600 transition-colors">{g.goal_name}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black text-blue-600">Rp {saved.toLocaleString('id-ID')}</span>
                                  <span className="text-[10px] font-bold text-slate-300">/</span>
                                  <span className="text-[11px] font-bold text-slate-500">Rp {target.toLocaleString('id-ID')}</span>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => openSavingModal(g.id, g.goal_name)} className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
                                <button onClick={() => setEditingId(g.id)} className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                <button onClick={() => deleteGoal(g.id)} className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                              </div>
                            </div>
                            
                            <div className="relative">
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' : 'text-slate-400'}`}>
                                  {isCompleted ? "Goal Reached 🏆" : "Saving Progress"}
                                </span>
                                <span className="text-[10px] font-black text-slate-800">{progress.toFixed(0)}%</span>
                              </div>
                              <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-[2px] border border-white shadow-inner">
                                <div 
                                  className={`h-full rounded-full transition-all duration-[1500ms] ease-out relative ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600'}`} 
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                >
                                  <div className="absolute inset-0 bg-white/20 w-full h-[50%] top-0" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MODAL INPUT TABUNGAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white p-8 animate-in zoom-in-95">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-50/50">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-black uppercase italic text-slate-800">Tambah Tabungan</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Target: <span className="text-blue-600">{activeGoal?.name}</span></p>
              <div className="mt-4 py-2 px-4 bg-slate-900/5 rounded-full inline-block">
                <p className="text-[9px] font-black text-slate-500 uppercase">Tersedia: <span className="text-slate-800">Rp {totalBalance.toLocaleString("id-ID")}</span></p>
              </div>
            </div>
            <form onSubmit={handleModalSubmit} className="space-y-6">
              <div className="relative">
                <span className="absolute left-0 top-0 text-xl font-bold text-slate-300">Rp</span>
                <input 
                  autoFocus
                  type="number" 
                  className="w-full pl-10 text-3xl font-black border-b-2 border-slate-100 focus:border-blue-500 outline-none pb-4 bg-transparent transition-all placeholder:text-slate-100"
                  placeholder="0"
                  value={savingInput}
                  onChange={(e) => setSavingInput(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-wider transition-all">Batal</button>
                <button type="submit" className="py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-100 uppercase text-[10px] tracking-wider transition-all">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}