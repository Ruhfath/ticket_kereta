"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/service/authService";

export default function RegisterPage() {
  const router = useRouter();

  // Multi-step state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");

  // Step 1: Account credentials
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Passenger Profile Identity
  const [namaPenumpang, setNamaPenumpang] = useState("");
  const [nik, setNik] = useState("");
  const [telp, setTelp] = useState("");
  const [alamat, setAlamat] = useState("");

  // Track backend registration state for smart retry
  const [isAccountCreated, setIsAccountCreated] = useState(false);

  // Form validations for Step 1
  const validateStep1 = () => {
    setError("");
    if (!username.trim()) {
      setError("Username wajib diisi");
      return false;
    }
    if (username.length < 3) {
      setError("Username minimal 3 karakter");
      return false;
    }
    if (!password) {
      setError("Password wajib diisi");
      return false;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return false;
    }
    return true;
  };

  // Form validations for Step 2
  const validateStep2 = () => {
    setError("");
    if (!namaPenumpang.trim()) {
      setError("Nama Lengkap wajib diisi");
      return false;
    }
    if (!nik.trim()) {
      setError("NIK (Nomor Induk Kependudukan) wajib diisi");
      return false;
    }
    if (nik.length !== 16 || !/^\d+$/.test(nik)) {
      setError("NIK harus berupa 16 digit angka");
      return false;
    }
    if (!telp.trim()) {
      setError("Nomor telepon wajib diisi");
      return false;
    }
    if (!/^\d{9,15}$/.test(telp)) {
      setError("Nomor telepon tidak valid (9-15 digit angka)");
      return false;
    }
    if (!alamat.trim()) {
      setError("Alamat lengkap wajib diisi");
      return false;
    }
    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setError("");
    setLoading(true);

    let loggedIn = isAccountCreated;

    try {
      // Step 1: Create Account if not done yet
      if (!isAccountCreated) {
        setLoadingText("Membuat akun Anda...");
        await authService.register({ username, password });
        setIsAccountCreated(true);

        // Step 2: Auto Login to get JWT Token
        setLoadingText("Menghubungkan ke server...");
        await authService.login({ username, password });
        loggedIn = true;
      }

      // Step 3: Create Passenger Profile (Pelanggan)
      setLoadingText("Menyimpan profil penumpang...");
      await authService.createProfile({
        NIK: nik,
        nama_penumpang: namaPenumpang,
        alamat: alamat,
        telp: telp,
      });

      // Step 4: Complete! Redirect to dashboard
      setLoadingText("Mengalihkan ke dashboard...");
      setTimeout(() => {
        router.push("/customer/dashboard");
      }, 800);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.";
      setError(errMsg);
      setLoading(false);
      // If we registered successfully but profile creation failed, we keep isAccountCreated = true
      // so the user doesn't hit "username already exists" when they fix inputs and resubmit.
      if (loggedIn) {
        setIsAccountCreated(true);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 transition-all duration-500">
          {/* Logo/Header */}
          <div className="text-center mb-6">
            <div className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full mb-3 shadow-md">
              <span className="font-bold text-base">🚂 RailTicket</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Daftar Akun Baru</h1>
            <p className="text-sm text-gray-600">Lengkapi data Anda untuk mulai memesan tiket kereta</p>
          </div>

          {/* Step Progress Stepper */}
          <div className="flex items-center justify-center mb-8 px-4">
            <div className="flex items-center w-full max-w-xs justify-between relative">
              {/* Stepper Background Line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded z-0"></div>
              {/* Stepper Active Line */}
              <div
                className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 rounded z-0 transition-all duration-500"
                style={{ width: step === 2 ? "100%" : "0%" }}
              ></div>

              {/* Step 1 Node */}
              <button
                type="button"
                onClick={() => !loading && step === 2 && setStep(1)}
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition duration-300 ${
                  step === 1
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-green-500 text-white"
                }`}
                disabled={loading}
              >
                {step === 2 || isAccountCreated ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  "1"
                )}
              </button>

              {/* Step 2 Node */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition duration-300 ${
                  step === 2
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Step Labels */}
          <div className="flex justify-between text-xs font-semibold text-gray-500 px-6 -mt-6 mb-8">
            <span className={step === 1 ? "text-blue-600 font-bold" : "text-green-600"}>Kredensial Akun</span>
            <span className={step === 2 ? "text-blue-600 font-bold" : "text-gray-400"}>Identitas Diri</span>
          </div>

          {/* Form Area */}
          {loading ? (
            /* Loading State UI */
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-lg font-semibold text-gray-700 animate-pulse">{loadingText}</p>
              <p className="text-xs text-gray-400">Harap tunggu sebentar, jangan menutup halaman ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl flex items-start gap-2.5 text-red-700 animate-fadeIn">
                  <span className="text-lg mt-0.5">⚠️</span>
                  <div className="text-sm font-medium">
                    <p className="font-semibold text-red-800">Gagal Registrasi</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {step === 1 ? (
                /* STEP 1 FORM: Account Setup */
                <form onSubmit={handleNextStep} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Masukkan username pilihan Anda"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black placeholder-gray-400 bg-white"
                        required
                        disabled={isAccountCreated}
                      />
                    </div>
                    {isAccountCreated && (
                      <p className="text-xs text-green-600 font-medium">✓ Akun telah didaftarkan. Anda dapat melanjutkan.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Masukkan password (min. 6 karakter)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black placeholder-gray-400 bg-white"
                        required
                        disabled={isAccountCreated}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                        disabled={isAccountCreated}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Ulangi password Anda"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black placeholder-gray-400 bg-white"
                        required
                        disabled={isAccountCreated}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                        disabled={isAccountCreated}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition duration-300 transform flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    <span>Langkah Berikutnya</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>
              ) : (
                /* STEP 2 FORM: Profile Setup */
                <form onSubmit={handleRegister} className="space-y-4 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Nama Lengkap Penumpang
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Masukkan nama lengkap sesuai KTP"
                        value={namaPenumpang}
                        onChange={(e) => setNamaPenumpang(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black placeholder-gray-400 bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      NIK (KTP)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6zM15 7V4a2 2 0 00-2-2h-2a2 2 0 00-2 2v3h6z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Masukkan 16 digit nomor NIK"
                        maxLength={16}
                        value={nik}
                        onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black placeholder-gray-400 bg-white"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">Sistem memverifikasi NIK untuk menerbitkan tiket resmi.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      No. Telepon / WhatsApp
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        value={telp}
                        onChange={(e) => setTelp(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black placeholder-gray-400 bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Alamat Lengkap
                    </label>
                    <div className="relative">
                      <div className="absolute top-3 left-3.5 text-gray-400 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <textarea
                        placeholder="Masukkan alamat tinggal saat ini lengkap dengan kota dan kode pos"
                        value={alamat}
                        onChange={(e) => setAlamat(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black placeholder-gray-400 bg-white h-24 resize-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Kembali</span>
                    </button>

                    <button
                      type="submit"
                      className="w-2/3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition duration-300 transform flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Daftar Sekarang</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Divider */}
          {!loading && (
            <>
              <div className="my-6 flex items-center">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="px-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">atau</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">
                  Sudah memiliki akun?{" "}
                  <a href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition">
                    Masuk di sini
                  </a>
                </p>
              </div>
            </>
          )}

          {/* Footer Info */}
          <div className="mt-6 pt-5 border-t border-gray-200 text-center text-[10px] text-gray-400">
            <p>
              Dengan mendaftar, Anda menyetujui{" "}
              <a href="#" className="text-blue-500 hover:underline">
                Syarat & Ketentuan
              </a>{" "}
              dan{" "}
              <a href="#" className="text-blue-500 hover:underline">
                Kebijakan Privasi
              </a>{" "}
              RailTicket.
            </p>
          </div>
        </div>

        {/* Bottom promo text */}
        <div className="mt-6 text-center text-white/80">
          <p className="text-xs">🚄 Perjalanan aman, nyaman, dan bebas ribet bersama RailTicket</p>
        </div>
      </div>
    </main>
  );
}
