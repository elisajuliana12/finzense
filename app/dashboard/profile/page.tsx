"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [image, setImage] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile?t=${Date.now()}`);
      if (!res.ok) return;
      const data = await res.json();
      setUser(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setImage(data.image || "");
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat profil");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1048576) {
        toast.error("Batas ukuran file adalah 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        toast.success("Foto profil siap diunggah!");
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const loadId = toast.loading("Mengamankan perubahan...");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, image }),
      });
      
      if (res.ok) {
        setEditMode(false);
        setPassword("");
        await fetchProfile();
        toast.success("Profil Anda berhasil diperbarui!", { id: loadId });
      } else {
        toast.error("Terjadi kendala saat menyimpan", { id: loadId });
      }
    } catch (error) {
      toast.error("Koneksi terputus", { id: loadId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    toast.loading("Mengakhiri sesi...");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setTimeout(() => {
      router.push("/auth/login");
      router.refresh();
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    const loadId = toast.loading("Menghapus akun...");
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (res.ok) {
        toast.success("Akun berhasil dihapus", { id: loadId });
        
        // Menghapus cookie di sisi client untuk memastikan sesi bersih
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        
        // Redirect langsung ke halaman register sesuai permintaan
        setTimeout(() => {
          router.push("/auth/register");
          router.refresh();
        }, 1500);
      } else {
        toast.error("Gagal menghapus akun", { id: loadId });
      }
    } catch (error) {
      toast.error("Server tidak merespon", { id: loadId });
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-[#F8FAFC] items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-700">
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }} 
      />
      
      <div className={`transition-all duration-300 ease-in-out bg-[#0f172a] z-50 
        ${isSidebarOpen ? 'w-[280px]' : 'w-0'} fixed md:relative h-screen overflow-hidden`}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative bg-[#F8FAFC]">
        <Navbar onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />

        <main className="p-5 md:p-12 max-w-7xl mx-auto w-full">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-1">
              <h2 className="text-indigo-600 font-black uppercase tracking-[0.3em] text-[10px]">User Account</h2>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Pengaturan Profil</h1>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if(editMode) toast.error("Perubahan dibatalkan");
                  setEditMode(!editMode);
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm border ${
                  editMode 
                  ? "bg-white text-rose-500 border-rose-100 hover:bg-rose-50" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {editMode ? "Batal Edit" : "Ubah Profil"}
              </button>
              {!editMode && (
                <button 
                  onClick={() => setShowLogoutModal(true)}
                  className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* PROFILE CARD */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2.5rem] border border-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-indigo-800" />
                
                <div className="relative z-10 pt-4">
                  <div className="relative inline-block group">
                    <div className="w-36 h-36 rounded-[2.5rem] border-8 border-white shadow-2xl overflow-hidden bg-slate-100 mx-auto transform transition-transform group-hover:scale-105">
                      {image ? (
                        <img src={image} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-200">{user?.name?.charAt(0)}</div>
                      )}
                    </div>
                    {editMode && (
                      <label className="absolute bottom-0 right-0 w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white cursor-pointer hover:bg-indigo-700 transition-all scale-110">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>

                  <div className="mt-6 space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name || "User"}</h3>
                    <p className="text-sm text-slate-400 font-bold">{user?.email || "Email tidak ditemukan"}</p>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <p className="text-xs font-black text-indigo-600">Premium</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Level</p>
                      <p className="text-xs font-black text-indigo-600">Gold</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="w-full mt-6 py-4 px-6 text-rose-400 hover:text-rose-600 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-rose-50 rounded-2xl"
              >
                Hapus Seluruh Data Akun
              </button>
            </div>

            {/* DETAILS FORM CARD */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[2.5rem] border border-white p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.02)] h-full">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Data Personal</h4>
                    <p className="text-xs text-slate-400 font-bold">Pastikan informasi Anda selalu valid</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                      <input
                        disabled={!editMode}
                        className={`w-full p-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                          editMode 
                          ? "bg-white border-slate-100 focus:border-indigo-600 outline-none text-slate-900" 
                          : "bg-slate-50 border-transparent text-slate-500 cursor-not-allowed"
                        }`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                      <input
                        disabled={!editMode}
                        className={`w-full p-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                          editMode 
                          ? "bg-white border-slate-100 focus:border-indigo-600 outline-none text-slate-900" 
                          : "bg-slate-50 border-transparent text-slate-500 cursor-not-allowed"
                        }`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {editMode && (
                    <div className="space-y-3 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                      <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Security: Kata Sandi Baru</label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        className="w-full p-4 bg-white border-2 border-indigo-50 rounded-2xl text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <p className="text-[10px] text-slate-400 font-medium italic">Biarkan kosong jika tidak ingin mengubah kata sandi.</p>
                    </div>
                  )}

                  {editMode && (
                    <div className="pt-10">
                      <button
                        onClick={saveProfile}
                        disabled={isSaving}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
                      >
                        {isSaving ? "Sinkronisasi..." : "Simpan Permanen"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Logout?</h3>
            <p className="text-sm text-slate-500 mb-10 font-medium">Anda akan diarahkan kembali ke halaman masuk.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleLogout} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Ya, Logout</button>
              <button onClick={() => setShowLogoutModal(false)} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-rose-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-2xl font-black text-rose-600 mb-2">Hapus Akun?</h3>
            <p className="text-sm text-slate-500 mb-10 font-medium italic">Peringatan: Seluruh data keuangan Anda akan dihapus permanen dari server.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteAccount} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-100">Konfirmasi Hapus</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Batalkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}