"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
// IMPORT SWEETALERT2
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// --- KONFIGURASI NOTIFIKASI ---
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

interface Transaction {
  id: number;
  amount: number;
  type: "income" | "expense";
  category_id: number;
  category_name: string;
  description: string;
  transaction_date: string;
}

interface Category {
  id: number;
  name: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: null as number | null,
    amount: "",
    type: "expense" as "income" | "expense",
    category_id: "1",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  const stats = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.type === "income") acc.income += Number(t.amount);
        else acc.expense += Number(t.amount);
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  const fetchData = useCallback(async () => {
    try {
      const resTrans = await fetch(
        `/api/transactions?month=${selectedMonth}&search=${searchTerm}&t=${Date.now()}`
      );
      const dataTrans = await resTrans.json();
      setTransactions(Array.isArray(dataTrans) ? dataTrans : []);

      const resCat = await fetch("/api/categories");
      const dataCat = await resCat.json();
      if (Array.isArray(dataCat)) {
        setCategories(dataCat);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  }, [selectedMonth, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // BAGIAN YANG DIUPDATE AGAR KATEGORI BARU MUNCUL
  const getFilteredCategories = () => {
    if (formData.type === "expense") {
      // Menambahkan ID 9, 10, 11, 12, 13 sesuai data baru di categories (1).sql
      return categories.filter((c) => [1, 2, 3, 4, 9, 10, 11, 12, 13].includes(c.id));
    } else {
      // Kategori pemasukan (Gaji, Bonus, Investasi)
      return categories.filter((c) => [5, 6, 7].includes(c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentBalance = stats.income - stats.expense;
    const inputAmount = Number(formData.amount);

    if (formData.type === "expense") {
      let balanceCheck = currentBalance;
      if (isEditing) {
        const oldTransaction = transactions.find(t => t.id === formData.id);
        if (oldTransaction && oldTransaction.type === "expense") {
          balanceCheck += Number(oldTransaction.amount);
        }
      }

      if (inputAmount > balanceCheck) {
        MySwal.fire({
          ...swalConfig,
          icon: 'error',
          iconColor: '#f43f5e',
          title: 'Saldo Menipis!',
          text: `Saldo tidak mencukupi untuk pengeluaran ini. (Sisa: Rp ${balanceCheck.toLocaleString("id-ID")})`,
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch("/api/transactions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: inputAmount,
          category_id: Number(formData.category_id),
        }),
      });
      if (res.ok) {
        MySwal.fire({
          ...swalConfig,
          icon: 'success',
          iconColor: '#3b82f6', 
          title: isEditing ? 'Updated!' : 'Saved!',
          text: `Transaksi berhasil disimpan ke sistem.`,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
        resetForm();
        fetchData();
      }
    } catch (error) {
      MySwal.fire({ 
        ...swalConfig, 
        icon: 'error', 
        iconColor: '#f43f5e',
        title: 'Error', 
        text: 'Terjadi kesalahan pada server.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (t: Transaction) => {
    setIsEditing(true);
    setFormData({
      id: t.id,
      amount: String(t.amount),
      type: t.type,
      category_id: String(t.category_id),
      description: t.description || "",
      transaction_date: t.transaction_date,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      ...swalConfig,
      title: 'Hapus Data?',
      text: "Data ini tidak bisa dikembalikan setelah dihapus.",
      icon: 'warning',
      iconColor: '#f43f5e',
      showCancelButton: true,
      confirmButtonText: 'YA, HAPUS',
      cancelButtonText: 'BATAL',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch("/api/transactions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.ok) {
          MySwal.fire({
            ...swalConfig,
            icon: 'success',
            iconColor: '#3b82f6',
            title: 'Deleted',
            text: 'Data transaksi telah dihapus.',
            showConfirmButton: false,
            timer: 1500,
          });
          fetchData();
        }
      } catch (error) {
        MySwal.fire({ ...swalConfig, icon: 'error', title: 'Gagal', text: 'Gagal menghapus data' });
      }
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      amount: "",
      type: "expense",
      category_id: "1",
      description: "",
      transaction_date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      
      <div className={`transition-all duration-300 ease-in-out bg-slate-900 z-50 
        ${isSidebarOpen ? 'w-[280px]' : 'w-0'} 
        fixed md:relative h-screen overflow-hidden`}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[45] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        <div className="fixed top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/40 rounded-full blur-[100px] -z-10" />

        <Navbar onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        <header className="sticky top-0 z-40 w-full bg-white/40 backdrop-blur-md border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transform -rotate-3 hover:rotate-0 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-800 uppercase italic leading-none">
                    Catatan <span className="text-blue-600">Transaksi</span>
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1.5">
                    Unit Intelijen Keuangan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/5 p-1.5 rounded-[2rem] border border-white/40 shadow-inner backdrop-blur-sm">
                <div className="px-5 py-2 bg-white/80 rounded-full shadow-sm border border-slate-100/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Saldo Periode</p>
                  <p className={`text-sm font-black ${stats.income - stats.expense < 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                    Rp {(stats.income - stats.expense).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="hidden sm:block px-4">
                  <p className="text-[8px] font-black text-green-500 uppercase">Masuk</p>
                  <p className="text-xs font-bold text-slate-700">Rp {stats.income.toLocaleString("id-ID")}</p>
                </div>
                <div className="hidden sm:block px-4 border-l border-slate-200/50">
                  <p className="text-[8px] font-black text-rose-500 uppercase">Keluar</p>
                  <p className="text-xs font-bold text-slate-700">Rp {stats.expense.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-32">
              <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8">
                  <h2 className="text-white text-lg font-black uppercase italic tracking-wider">
                    {isEditing ? "Perbarui Data" : "Catatan Baru"}
                  </h2>
                  <p className="text-blue-100 text-[10px] font-bold uppercase mt-1">Lacak setiap arus keuangan anda</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nominal</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">Rp</span>
                      <input
                        type="number"
                        className="w-full pl-12 pr-5 py-4 bg-white/50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-black text-xl outline-none"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tipe</label>
                    <div className="flex p-1 bg-slate-100/50 rounded-2xl gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'expense', category_id: '1' })}
                        className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${formData.type === 'expense' ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}
                      >PENGELUARAN</button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'income', category_id: '5' })}
                        className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${formData.type === 'income' ? 'bg-white text-green-600 shadow-md' : 'text-slate-400'}`}
                      >PEMASUKAN</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kategori</label>
                      <select
                        className="w-full px-4 py-3.5 bg-white/50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      >
                        {getFilteredCategories().map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tanggal</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3.5 bg-white/50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Catatan</label>
                    <textarea
                      className="w-full px-5 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                      placeholder="Beli kopi, bayar tagihan..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? "PROSES..." : isEditing ? "SIMPAN PERUBAHAN" : "KONFIRMASI"}
                  </button>
                  {isEditing && (
                    <button onClick={resetForm} type="button" className="w-full text-[10px] font-black text-slate-400 uppercase hover:text-rose-500 transition-colors">
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
                    placeholder="Cari transaksi..."
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

              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="text-center py-20 bg-white/40 border border-dashed border-slate-300 rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Riwayat Kosong</p>
                  </div>
                ) : (
                  transactions.map((t) => (
                    <div key={t.id} className="group bg-white/60 backdrop-blur-md hover:bg-white p-5 rounded-3xl border border-white shadow-sm transition-all duration-300 flex flex-col sm:flex-row items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === 'expense' ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-green-500'}`}>
                        {t.type === 'expense' ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 17l-4 4m0 0l-4-4m4 4V3"/></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7l4-4m0 0l4 4m-4-4v18"/></svg>
                        )}
                      </div>
                      <div className="flex-1 text-center sm:text-left min-w-0">
                        <h3 className="text-sm font-black text-slate-800 uppercase italic mb-1.5 truncate">{t.description || t.category_name}</h3>
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase">{t.category_name}</span>
                          <span className="text-[9px] font-bold text-slate-400">{new Date(t.transaction_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                        <span className={`text-lg font-black tracking-tight ${t.type === "expense" ? "text-slate-800" : "text-green-600"}`}>
                          {t.type === "expense" ? "-" : "+"} Rp {Number(t.amount).toLocaleString("id-ID")}
                        </span>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleEdit(t)} className="p-2.5 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm bg-white/80 border border-slate-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          </button>
                          <button onClick={() => handleDelete(t.id)} className="p-2.5 text-slate-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm bg-white/80 border border-slate-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}