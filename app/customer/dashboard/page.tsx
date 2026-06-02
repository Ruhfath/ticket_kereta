"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/service/authService";

export default function CustomerDashboardPage() {
  const router = useRouter();

  // Authentication and user state
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Tab navigation state: 'home' | 'profile' | 'tickets'
  const [activeTab, setActiveTab] = useState<"home" | "profile" | "tickets">("home");

  // Notifications state
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Profile Form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nama_penumpang: "",
    NIK: "",
    telp: "",
    alamat: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Ticket listing state
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Ticket cancellation state
  const [confirmCancelId, setConfirmCancelId] = useState<string | number | null>(null);
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Read URL query parameter to switch active tab on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "tickets" || tabParam === "profile" || tabParam === "home") {
        setActiveTab(tabParam as any);
      }
    }
  }, [pageLoading]);

  // Auth Guard & Initial Data Fetching
  useEffect(() => {
    const checkAuth = async () => {
      if (!authService.isAuthenticated()) {
        router.push("/login");
        return;
      }

      setIsAuthenticated(true);
      const currentUser = authService.getUser();
      setUser(currentUser);

      if (currentUser?.role === "ADMIN") {
        router.push("/admin/dashboard");
        return;
      }

      try {
        // Fetch passenger profile from backend
        const passengerProfile = await authService.getProfile();
        setProfile(passengerProfile);
        setProfileForm({
          nama_penumpang: passengerProfile?.nama_penumpang || "",
          NIK: passengerProfile?.NIK || "",
          telp: passengerProfile?.telp || "",
          alamat: passengerProfile?.alamat || "",
        });
      } catch (err) {
        console.error("Gagal mengambil profil:", err);
        // Fallback to cached profile if any
        const cachedProfile = authService.getPelanggan();
        if (cachedProfile) {
          setProfile(cachedProfile);
          setProfileForm({
            nama_penumpang: cachedProfile.nama_penumpang || "",
            NIK: cachedProfile.NIK || "",
            telp: cachedProfile.telp || "",
            alamat: cachedProfile.alamat || "",
          });
        } else {
          setNotification({
            type: "error",
            message: "Profil penumpang belum dibuat atau gagal dimuat. Silakan buat profil Anda.",
          });
        }
      } finally {
        setPageLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Fetch Tickets on Filter Change
  useEffect(() => {
    if (isAuthenticated && activeTab === "tickets") {
      fetchTickets();
    }
  }, [isAuthenticated, activeTab, filterMonth, filterYear]);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const ticketList = await authService.getMyTickets(filterMonth, filterYear);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
    } catch (err) {
      console.error("Gagal mengambil tiket:", err);
      setTickets([]);
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memuat daftar tiket.",
      });
    } finally {
      setTicketsLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  // Handle Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setNotification(null);

    // Basic Validation
    if (profileForm.NIK.length !== 16 || !/^\d+$/.test(profileForm.NIK)) {
      setNotification({ type: "error", message: "NIK harus berupa 16 digit angka" });
      setProfileLoading(false);
      return;
    }

    try {
      const updated = await authService.updateProfile(profileForm);
      setProfile(updated);
      setIsEditingProfile(false);
      setNotification({ type: "success", message: "Profil berhasil diperbarui!" });
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memperbarui profil.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Download/Print Nota (Invoice)
  const handlePrintNota = async (ticketId: string | number) => {
    try {
      setNotification({ type: "success", message: "Mengunduh nota tiket..." });
      const { blob, contentType } = await authService.getMyTicketNota(ticketId);
      
      const file = new Blob([blob], { type: contentType });
      const fileURL = URL.createObjectURL(file);
      
      // Open in a new tab
      const newTab = window.open(fileURL);
      if (!newTab) {
        // Fallback to downloading it if popup blocked
        const a = document.createElement("a");
        a.href = fileURL;
        a.download = `Nota-Tiket-${ticketId}.${contentType.includes("html") ? "html" : "txt"}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memuat nota tiket.",
      });
    }
  };

  // Handle Cancel Ticket
  const handleCancelTicket = async (ticketId: string | number) => {
    setCancellingId(ticketId);
    setNotification(null);
    try {
      await authService.cancelTicket(ticketId);
      setNotification({ type: "success", message: "Tiket berhasil dibatalkan!" });
      setConfirmCancelId(null);
      // Re-fetch ticket listing
      fetchTickets();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal membatalkan tiket.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  // Loading Screen
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-semibold animate-pulse">Memuat dashboard Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-black">
      {/* Top Banner Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-xl translate-y-12 -translate-x-12"></div>

        <div className="container mx-auto px-6 py-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  {user?.role || "Penumpang"}
                </span>
                <span className="text-blue-100 text-sm">| ID: #{user?.id}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Halo, {profile?.nama_penumpang || user?.username || "Penumpang"}!
              </h1>
              <p className="text-blue-100 text-sm mt-1">
                Kelola tiket perjalanan dan profil diri Anda dengan mudah di RailTicket
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="self-start md:self-center bg-white/10 hover:bg-white/25 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/20 hover:border-white/40 transition duration-300 backdrop-blur-sm flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Notifications */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-fadeIn">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border max-w-sm backdrop-blur-md ${
              notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="text-xl">{notification.type === "success" ? "✅" : "⚠️"}</span>
            <div className="text-sm font-semibold">
              <p>{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="container mx-auto px-6 mt-8">
        {/* Tab Selection */}
        <div className="bg-white rounded-2xl shadow-sm p-2 flex border border-gray-200 mb-8 max-w-md mx-auto md:mx-0">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "home"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🏠 <span>Beranda</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "profile"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            👤 <span>Profil</span>
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "tickets"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🎫 <span>Tiket Saya</span>
          </button>
        </div>

        {/* TAB 1: BERANDA */}
        {activeTab === "home" && (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Col: Quick Summary */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>🚆</span> Rencana Perjalanan Anda
                </h2>
                <p className="text-gray-600 mb-6">
                  Selamat datang kembali di portal pelanggan RailTicket. Cari tiket perjalanan impian Anda atau lihat status tiket aktif melalui menu di bawah.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push("/customer/cari-ticket")}
                    className="p-5 bg-blue-50 border border-blue-100 hover:border-blue-300 rounded-2xl text-left transition duration-300 hover:shadow-md cursor-pointer group"
                  >
                    <div className="text-2xl mb-2">🔍</div>
                    <h3 className="font-bold text-blue-800 group-hover:text-blue-900">Cari & Pesan Tiket</h3>
                    <p className="text-xs text-blue-600 mt-1">Lihat jadwal kereta, pilih kursi, dan lakukan reservasi.</p>
                  </button>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className="p-5 bg-amber-50 border border-amber-100 hover:border-amber-300 rounded-2xl text-left transition duration-300 hover:shadow-md cursor-pointer group"
                  >
                    <div className="text-2xl mb-2">🎟️</div>
                    <h3 className="font-bold text-amber-800 group-hover:text-amber-900">Lihat Tiket Aktif</h3>
                    <p className="text-xs text-amber-600 mt-1">Cek kode booking, cetak invoice, atau lakukan pembatalan.</p>
                  </button>
                </div>
              </div>

              {/* Promo Banner Card */}
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 text-7xl opacity-10">🎁</div>
                <h3 className="font-bold text-lg text-emerald-100 uppercase tracking-wide">Promo Spesial</h3>
                <h4 className="text-2xl font-black mt-1">Cashback Ekstra s.d 30%</h4>
                <p className="text-emerald-500 bg-white inline-block px-3 py-1 rounded-full text-xs font-black mt-3 shadow">
                  KODE PROMO: RAILBACK30
                </p>
                <p className="text-xs text-emerald-500/85 mt-2 bg-emerald-50/15 p-2 rounded-lg">
                  * Berlaku khusus untuk pemesanan rute jarak jauh eksekutif hingga akhir Juni 2026.
                </p>
              </div>
            </div>

            {/* Right Col: Identity Summary Widget */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4 border-b pb-3 text-gray-800">
                  💳 Ringkasan Profil
                </h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Nama Lengkap</span>
                    <span className="font-bold text-gray-700">{profile?.nama_penumpang || "Belum diisi"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">NIK KTP</span>
                    <span className="font-mono font-bold text-gray-700">{profile?.NIK || "Belum diisi"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">No. Telepon</span>
                    <span className="font-bold text-gray-700">{profile?.telp || "Belum diisi"}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="w-full mt-2 text-center text-sm text-blue-600 font-bold hover:text-blue-700 hover:underline transition cursor-pointer"
                  >
                    Ubah data profil &raquo;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROFIL */}
        {activeTab === "profile" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Profil Penumpang</h2>
                  <p className="text-sm text-gray-500 mt-1">Data identitas resmi yang terintegrasi dengan pemesanan tiket</p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-blue-50 text-blue-600 font-bold px-4 py-2 rounded-xl hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    ✏️ <span>Ubah</span>
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                /* Edit Profile Form */
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Nama Lengkap Penumpang
                    </label>
                    <input
                      type="text"
                      value={profileForm.nama_penumpang}
                      onChange={(e) => setProfileForm({ ...profileForm, nama_penumpang: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black bg-white font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      NIK KTP (16 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={profileForm.NIK}
                      onChange={(e) => setProfileForm({ ...profileForm, NIK: e.target.value.replace(/\D/g, "") })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black bg-white font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      value={profileForm.telp}
                      onChange={(e) => setProfileForm({ ...profileForm, telp: e.target.value.replace(/\D/g, "") })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black bg-white font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Alamat Tinggal
                    </label>
                    <textarea
                      value={profileForm.alamat}
                      onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-black bg-white h-24 resize-none font-medium"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        // Reset form fields
                        setProfileForm({
                          nama_penumpang: profile?.nama_penumpang || "",
                          NIK: profile?.NIK || "",
                          telp: profile?.telp || "",
                          alamat: profile?.alamat || "",
                        });
                      }}
                      className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition cursor-pointer"
                      disabled={profileLoading}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-md transition cursor-pointer flex items-center gap-2"
                      disabled={profileLoading}
                    >
                      {profileLoading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Profile View Mode */
                <div className="space-y-5">
                  <div className="grid grid-cols-3 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Nama Lengkap</span>
                    <span className="col-span-2 text-base font-semibold text-gray-800">{profile?.nama_penumpang || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">NIK KTP</span>
                    <span className="col-span-2 text-base font-mono font-semibold text-gray-800">{profile?.NIK || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">No. Telepon</span>
                    <span className="col-span-2 text-base font-semibold text-gray-800">{profile?.telp || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Alamat</span>
                    <span className="col-span-2 text-base font-semibold text-gray-800 leading-relaxed">{profile?.alamat || "-"}</span>
                  </div>
                  <div className="grid grid-cols-3 py-3">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Username Akun</span>
                    <span className="col-span-2 text-base font-semibold text-gray-800">{user?.username || "-"}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TIKET SAYA */}
        {activeTab === "tickets" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Filter Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Riwayat Perjalanan</h2>
                <p className="text-sm text-gray-500 mt-1">Filter tiket Anda berdasarkan bulan keberangkatan</p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                {/* Month Dropdown */}
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="flex-1 sm:flex-initial px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm cursor-pointer"
                >
                  {[
                    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                  ].map((monthName, index) => (
                    <option key={index + 1} value={index + 1}>
                      {monthName}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="flex-1 sm:flex-initial px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm cursor-pointer"
                >
                  {[2025, 2026, 2027].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tickets Listing */}
            {ticketsLoading ? (
              /* Skeleton Loader */
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-pulse flex flex-col gap-4">
                    <div className="flex justify-between border-b pb-3">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-10 bg-gray-200 rounded w-full mt-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              /* Empty Ticket State */
              <div className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 text-center space-y-4">
                <div className="text-6xl">🎫</div>
                <h3 className="text-xl font-bold text-gray-800">Belum Ada Tiket Perjalanan</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Anda belum memesan tiket perjalanan untuk bulan {["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][filterMonth]} {filterYear}.
                </p>
                <button
                  onClick={() => router.push("/customer/cari-ticket")}
                  className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg transition duration-300 cursor-pointer"
                >
                  Cari Tiket Sekarang &raquo;
                </button>
              </div>
            ) : (
              /* Ticket Items list */
              <div className="space-y-6">
                {tickets.map((ticket: any) => {
                  // Safety mappings for backend ticket schema
                  const trainName = ticket.jadwal?.kereta?.nama_kereta || "Argo Express";
                  const trainClass = ticket.jadwal?.kereta?.kelas || "EKSEKUTIF";
                  const origin = ticket.jadwal?.rute?.stasiun_asal || ticket.jadwal?.asal || "Stasiun Asal";
                  const destination = ticket.jadwal?.rute?.stasiun_tujuan || ticket.jadwal?.tujuan || "Stasiun Tujuan";
                  const date = ticket.jadwal?.tanggal || "Tanggal Perjalanan";
                  const time = ticket.jadwal?.waktu_berangkat || ticket.jadwal?.jam || "08:00";
                  const price = ticket.total_harga || ticket.harga || 0;
                  
                  // Extract passengers list
                  const passengers = Array.isArray(ticket.penumpang) 
                    ? ticket.penumpang 
                    : Array.isArray(ticket.detail_ticket) 
                      ? ticket.detail_ticket 
                      : Array.isArray(ticket.ticketDetails)
                        ? ticket.ticketDetails
                        : [];

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-300 relative"
                    >
                      {/* Ticket Header */}
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Kode Pemesanan</p>
                          <p className="font-mono text-lg font-bold text-yellow-300">#TK-{ticket.id}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status Pembayaran</p>
                          <span className="bg-green-500/20 text-green-300 text-xs font-extrabold px-3 py-1 rounded-full border border-green-500/30 inline-block mt-0.5">
                            Lunas
                          </span>
                        </div>
                      </div>

                      {/* Ticket Body */}
                      <div className="p-6 space-y-6">
                        {/* Train Trip Info */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                          {/* Route Train Details */}
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-0.5 rounded-md border border-blue-200 uppercase">
                                {trainClass}
                              </span>
                              <h3 className="font-extrabold text-lg text-slate-800">{trainName}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-400">Keberangkatan</p>
                                <p className="font-bold text-gray-800">{origin}</p>
                              </div>
                              <div className="text-gray-300 text-lg">&rarr;</div>
                              <div>
                                <p className="text-xs font-semibold text-gray-400">Tujuan</p>
                                <p className="font-bold text-gray-800">{destination}</p>
                              </div>
                            </div>
                          </div>

                          {/* Date and Time Details */}
                          <div className="md:text-right space-y-1">
                            <p className="text-xs font-semibold text-gray-400">Jadwal Keberangkatan</p>
                            <p className="font-bold text-gray-800">{date}</p>
                            <p className="font-bold text-blue-600 text-lg flex items-center md:justify-end gap-1">
                              🕒 {time}
                            </p>
                          </div>
                        </div>

                        {/* Passenger Details */}
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Daftar Penumpang & Kursi</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            {passengers.length > 0 ? (
                              passengers.map((p: any, idx: number) => {
                                const pName = p.nama_penumpang || p.nama || "Nama Penumpang";
                                const pNik = p.NIK || p.nik || "-";
                                const pSeat = p.kursi?.no_kursi || p.no_kursi || p.kursiId || "A1";

                                return (
                                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-sm">
                                    <div>
                                      <p className="font-bold text-gray-800">{pName}</p>
                                      <p className="text-xs text-gray-500 font-mono mt-0.5">NIK: {pNik}</p>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 text-blue-700 font-black px-3 py-1.5 rounded-lg text-center min-w-[50px] shadow-sm">
                                      {pSeat}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3 text-sm">
                                <div>
                                  <p className="font-bold text-gray-800">{profile?.nama_penumpang || "Nama Penumpang"}</p>
                                  <p className="text-xs text-gray-500 font-mono mt-0.5">NIK: {profile?.NIK || "-"}</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 text-blue-700 font-black px-3 py-1.5 rounded-lg text-center min-w-[50px]">
                                  B1
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Total Price & Footer Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                          <div>
                            <span className="text-xs font-semibold text-gray-400">Total Pembayaran</span>
                            <p className="text-2xl font-black text-blue-600 mt-0.5">
                              Rp {price ? price.toLocaleString("id-ID") : "150.000"}
                            </p>
                          </div>

                          <div className="flex gap-3 w-full sm:w-auto">
                            {/* Cancel Button */}
                            <button
                              onClick={() => setConfirmCancelId(ticket.id)}
                              className="flex-1 sm:flex-none border border-red-200 text-red-600 hover:bg-red-50 font-bold px-4 py-2.5 rounded-xl transition duration-300 cursor-pointer text-center text-sm shadow-sm active:scale-95"
                            >
                              ❌ Batalkan
                            </button>

                            {/* Cetak Nota Button */}
                            <button
                              onClick={() => handlePrintNota(ticket.id)}
                              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-md transition duration-300 cursor-pointer text-center text-sm flex items-center justify-center gap-1.5 active:scale-95"
                            >
                              📄 <span>Cetak Nota</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONFIRM CANCELLATION MODAL */}
      {confirmCancelId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="text-center">
              <div className="inline-block bg-red-100 text-red-700 p-3.5 rounded-full mb-3 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Batalkan Tiket Perjalanan?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Tindakan ini tidak dapat dibatalkan. Tiket Anda dengan ID <strong>#TK-{confirmCancelId}</strong> akan dihapus secara permanen dari sistem dan kursi akan dirilis kembali.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelId(null)}
                className="w-1/2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition cursor-pointer text-sm"
                disabled={cancellingId !== null}
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => handleCancelTicket(confirmCancelId)}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl hover:shadow-md transition cursor-pointer text-sm flex items-center justify-center gap-1.5"
                disabled={cancellingId !== null}
              >
                {cancellingId !== null ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Proses...</span>
                  </>
                ) : (
                  <span>Ya, Batalkan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
