"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Menggunakan toast.promise untuk alur yang lebih seamless (Loading -> Success/Error)
    const loginPromise = fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login gagal");
      }
      return data;
    });

    toast.promise(loginPromise, {
      loading: "Memverifikasi akun...",
      success: () => {
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1000);
        return "Berhasil masuk! Selamat datang.";
      },
      error: (err) => `${err.message}`,
    }, {
      style: {
        borderRadius: '12px',
        background: '#1e293b',
        color: '#fff',
        padding: '16px',
      },
      success: {
        iconTheme: {
          primary: '#22c55e',
          secondary: '#fff',
        },
      },
    });

    try {
      await loginPromise;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Konfigurasi Toaster yang lebih cantik */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
        }}
      />

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 transition-all">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">Finzense</h1>
          <p className="text-gray-500 mt-2 text-sm">Selamat datang kembali!</p>
        </div>

        {/* Notifikasi error lokal tetap ada sebagai cadangan visual di atas form */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-5 border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">
              Email
            </label>
            <input
              type="email"
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl text-white font-bold transition-all duration-200 active:scale-[0.97] mt-2 ${
              loading 
              ? "bg-slate-400 cursor-not-allowed" 
              : "bg-[#0f172a] hover:bg-slate-800 shadow-lg shadow-slate-900/30"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-sm">Memproses...</span>
              </div>
            ) : (
              "Masuk ke Akun"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Belum punya akun?{" "}
          <Link href="/auth/register" className="text-blue-600 font-bold hover:underline decoration-2 underline-offset-4">
            Daftar gratis
          </Link>
        </p>
      </div>
    </div>
  );
}