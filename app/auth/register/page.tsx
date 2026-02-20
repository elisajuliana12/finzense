"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast"; // Library untuk notifikasi modern

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Membuat promise toast agar ada loading indicator yang cantik di pojok
    const registerPromise = fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mendaftar");
      }
      return data;
    });

    toast.promise(registerPromise, {
      loading: "Sedang mendaftarkan akun...",
      success: (data) => {
        setTimeout(() => router.push("/auth/login"), 1500); // Delay sedikit agar user sempat baca
        return "Akun berhasil dibuat! Silahkan login.";
      },
      error: (err) => `${err.message}`,
    }, {
      style: {
        borderRadius: '12px',
        background: '#333',
        color: '#fff',
      },
      success: {
        duration: 3000,
        iconTheme: {
          primary: '#10B981',
          secondary: '#fff',
        },
      },
    });

    try {
      await registerPromise;
    } catch (err) {
      // Error sudah ditangani oleh toast.promise
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Container untuk merender toast di layar */}
      <Toaster position="top-center" reverseOrder={false} />

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Daftar Akun</h1>
          <p className="text-sm text-gray-500 text-center">Mulai kelola keuanganmu sekarang.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 ml-1">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Masukkan nama anda"
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 ml-1">Email</label>
            <input
              type="email"
              placeholder="nama@email.com"
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 mt-4 rounded-xl text-white font-semibold transition-all duration-200 active:scale-[0.98] ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-[#0f172a] hover:bg-slate-800 shadow-lg shadow-slate-900/20"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses...</span>
              </div>
            ) : (
              "Daftar Sekarang"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-8">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="text-blue-600 font-bold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}