"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/service/authService";
import { adminService } from "@/service/adminService";

export default function AdminDashboardPage() {
  const router = useRouter();

  // Authentication guards
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Tab management: 'summary' | 'kereta' | 'jadwal' | 'users' | 'financials'
  const [activeTab, setActiveTab] = useState<"summary" | "kereta" | "jadwal" | "users" | "financials">("summary");

  // Global lists
  const [keretaList, setKeretaList] = useState<any[]>([]);
  const [gerbongList, setGerbongList] = useState<any[]>([]);
  const [kursiList, setKursiList] = useState<any[]>([]);
  const [jadwalList, setJadwalList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Selection states for CRUD nesting
  const [selectedKeretaId, setSelectedKeretaId] = useState<string | number | null>(null);
  const [selectedGerbongId, setSelectedGerbongId] = useState<string | number | null>(null);

  // Financial report states
  const [financials, setFinancials] = useState<any>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [financialsLoading, setFinancialsLoading] = useState(false);

  // Overlay states
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal forms states
  const [trainModalOpen, setTrainModalOpen] = useState(false);
  const [editingTrain, setEditingTrain] = useState<any>(null); // if null, mode is Create. If object, mode is Edit.
  const [trainForm, setTrainForm] = useState({ nama_kereta: "", deskripsi: "", kelas: "EKSEKUTIF" });

  const [gerbongModalOpen, setGerbongModalOpen] = useState(false);
  const [gerbongForm, setGerbongForm] = useState({ nama_gerbong: "", kuota: 50 });

  const [kursiModalOpen, setKursiModalOpen] = useState(false);
  const [kursiForm, setKursiForm] = useState({ no_kursi: "" });

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState({
    asal_keberangkatan: "",
    tujuan_keberangkatan: "",
    tanggal_berangkat: "",
    tanggal_kedatangan: "",
    harga: 150000,
    keretaId: "",
  });

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth guard & prefetch
  useEffect(() => {
    const checkAdminAuth = async () => {
      if (!authService.isAuthenticated()) {
        router.push("/login");
        return;
      }

      const currentUser = authService.getUser();
      if (currentUser?.role !== "ADMIN") {
        router.push("/customer/dashboard");
        return;
      }

      setUser(currentUser);
      setIsAdmin(true);

      // Prefetch data
      try {
        await loadAllData();
      } catch (err) {
        console.error("Gagal memuat data awal admin:", err);
      } finally {
        setPageLoading(false);
      }
    };
    checkAdminAuth();
  }, [router]);

  // Reload financials when tab or filter changes
  useEffect(() => {
    if (isAdmin && activeTab === "financials") {
      loadFinancials();
    }
  }, [isAdmin, activeTab, filterMonth, filterYear]);

  // Load all master lists
  const loadAllData = async () => {
    try {
      // Fetch Kereta
      const keretaRes = await fetch(`${API_URL()}/kereta`);
      if (keretaRes.ok) {
        const keretaData = await keretaRes.json();
        setKeretaList(Array.isArray(keretaData) ? keretaData : []);
      }

      // Fetch Gerbong
      const gerbongRes = await fetch(`${API_URL()}/gerbong`);
      if (gerbongRes.ok) {
        const gerbongData = await gerbongRes.json();
        setGerbongList(Array.isArray(gerbongData) ? gerbongData : []);
      }

      // Fetch Kursi
      const kursiRes = await fetch(`${API_URL()}/kursi`);
      if (kursiRes.ok) {
        const kursiData = await kursiRes.json();
        setKursiList(Array.isArray(kursiData) ? kursiData : []);
      }

      // Fetch Jadwal
      const jadwalRes = await fetch(`${API_URL()}/jadwal`);
      if (jadwalRes.ok) {
        const jadwalData = await jadwalRes.json();
        setJadwalList(Array.isArray(jadwalData) ? jadwalData : []);
      }

      // Fetch Users
      const usersData = await adminService.getAllUsers();
      setUsersList(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      console.error("Gagal sinkronisasi data master:", err);
    }
  };

  const API_URL = () => {
    return (process.env.NEXT_PUBLIC_API_URL || "https://sistem-ukl-kereta2-production.up.railway.app/api").replace(/"/g, '');
  };

  const loadFinancials = async () => {
    setFinancialsLoading(true);
    try {
      const rekap = await adminService.getRevenueRekap(filterMonth, filterYear);
      setFinancials(rekap);
    } catch (err) {
      setFinancials(null);
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memuat rekap keuangan.",
      });
    } finally {
      setFinancialsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  // === KERETA CRUD LOGICS ===
  const openTrainModal = (train: any = null) => {
    setEditingTrain(train);
    if (train) {
      setTrainForm({
        nama_kereta: train.nama_kereta || "",
        deskripsi: train.deskripsi || "",
        kelas: train.kelas || "EKSEKUTIF",
      });
    } else {
      setTrainForm({ nama_kereta: "", deskripsi: "", kelas: "EKSEKUTIF" });
    }
    setTrainModalOpen(true);
  };

  const handleTrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingTrain) {
        await adminService.updateKereta(editingTrain.id, trainForm);
        setNotification({ type: "success", message: "Kereta berhasil diupdate!" });
      } else {
        await adminService.createKereta(trainForm);
        setNotification({ type: "success", message: "Kereta berhasil ditambahkan!" });
      }
      setTrainModalOpen(false);
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memproses data kereta.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrain = async (id: number | string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kereta ini? Semua gerbong & jadwal terkait mungkin akan terpengaruh.")) return;
    setLoading(true);
    try {
      await adminService.deleteKereta(id);
      setNotification({ type: "success", message: "Kereta berhasil dihapus!" });
      setSelectedKeretaId(null);
      setSelectedGerbongId(null);
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menghapus kereta.",
      });
    } finally {
      setLoading(false);
    }
  };

  // === GERBONG CRUD LOGICS ===
  const handleGerbongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeretaId) return;
    setLoading(true);
    try {
      await adminService.createGerbong({
        ...gerbongForm,
        keretaId: Number(selectedKeretaId),
      });
      setNotification({ type: "success", message: "Gerbong berhasil ditambahkan!" });
      setGerbongModalOpen(false);
      setGerbongForm({ nama_gerbong: "", kuota: 50 });
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menambahkan gerbong.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGerbong = async (id: number | string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus gerbong ini?")) return;
    setLoading(true);
    try {
      await adminService.deleteGerbong(id);
      setNotification({ type: "success", message: "Gerbong berhasil dihapus!" });
      setSelectedGerbongId(null);
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menghapus gerbong.",
      });
    } finally {
      setLoading(false);
    }
  };

  // === KURSI CRUD LOGICS ===
  const handleKursiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGerbongId) return;
    setLoading(true);
    try {
      await adminService.createKursi({
        no_kursi: kursiForm.no_kursi.toUpperCase().trim(),
        gerbongId: Number(selectedGerbongId),
      });
      setNotification({ type: "success", message: "Kursi berhasil ditambahkan!" });
      setKursiModalOpen(false);
      setKursiForm({ no_kursi: "" });
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menambahkan kursi.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKursi = async (id: number | string) => {
    if (!confirm("Hapus kursi ini?")) return;
    setLoading(true);
    try {
      await adminService.deleteKursi(id);
      setNotification({ type: "success", message: "Kursi dihapus!" });
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menghapus kursi.",
      });
    } finally {
      setLoading(false);
    }
  };

  // === JADWAL CRUD LOGICS ===
  const openScheduleModal = (schedule: any = null) => {
    setEditingSchedule(schedule);
    if (schedule) {
      // Convert ISO string date to datetime-local input string format (YYYY-MM-DDTHH:MM)
      const toLocalTimeFormat = (isoString: string) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        // timezone offset offsetting
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
        return localISOTime;
      };

      setScheduleForm({
        asal_keberangkatan: schedule.asal_keberangkatan || schedule.asal || "",
        tujuan_keberangkatan: schedule.tujuan_keberangkatan || schedule.tujuan || "",
        tanggal_berangkat: toLocalTimeFormat(schedule.tanggal_berangkat),
        tanggal_kedatangan: toLocalTimeFormat(schedule.tanggal_kedatangan),
        harga: schedule.harga || 150000,
        keretaId: schedule.keretaId || schedule.kereta?.id ? String(schedule.keretaId || schedule.kereta?.id) : "",
      });
    } else {
      setScheduleForm({
        asal_keberangkatan: "",
        tujuan_keberangkatan: "",
        tanggal_berangkat: "",
        tanggal_kedatangan: "",
        harga: 150000,
        keretaId: keretaList[0]?.id ? String(keretaList[0].id) : "",
      });
    }
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...scheduleForm,
        harga: Number(scheduleForm.harga),
        keretaId: Number(scheduleForm.keretaId),
        tanggal_berangkat: new Date(scheduleForm.tanggal_berangkat).toISOString(),
        tanggal_kedatangan: new Date(scheduleForm.tanggal_kedatangan).toISOString(),
      };

      if (editingSchedule) {
        await adminService.updateJadwal(editingSchedule.id, payload);
        setNotification({ type: "success", message: "Jadwal berhasil diupdate!" });
      } else {
        await adminService.createJadwal(payload);
        setNotification({ type: "success", message: "Jadwal berhasil dibuat!" });
      }
      setScheduleModalOpen(false);
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyimpan jadwal.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (id: number | string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal perjalanan ini?")) return;
    setLoading(true);
    try {
      await adminService.deleteJadwal(id);
      setNotification({ type: "success", message: "Jadwal berhasil dihapus!" });
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menghapus jadwal.",
      });
    } finally {
      setLoading(false);
    }
  };

  // === USER DELETION LOGIC ===
  const handleDeleteUser = async (userToDelete: any) => {
    if (String(userToDelete.id) === String(user?.id)) {
      alert("Anda tidak bisa menghapus akun Anda sendiri saat sedang masuk.");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${userToDelete.username}"?`)) return;
    setLoading(true);
    try {
      await adminService.deleteUser(userToDelete.id);
      setNotification({ type: "success", message: `User "${userToDelete.username}" berhasil dihapus.` });
      await loadAllData();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menghapus user.",
      });
    } finally {
      setLoading(false);
    }
  };

  // === TICKET DELETION LOGIC (ADMIN REFUND) ===
  const handleDeleteTicket = async (ticketId: string | number) => {
    if (!confirm(`Batalkan pemesanan tiket #${ticketId} secara permanen? Dana tiket akan hangus/refund.`)) return;
    setLoading(true);
    try {
      await adminService.deleteTicket(ticketId);
      setNotification({ type: "success", message: "Reservasi tiket berhasil dibatalkan." });
      await loadFinancials();
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menghapus tiket.",
      });
    } finally {
      setLoading(false);
    }
  };

  // === NOTA PRINT FOR TICKET ===
  const handlePrintNota = async (ticketId: string | number) => {
    try {
      const { blob, contentType } = await authService.getMyTicketNota(ticketId);
      const file = new Blob([blob], { type: contentType });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL);
    } catch (err) {
      alert("Gagal memuat nota: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Guard Loading Screen
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-400 font-semibold animate-pulse">Menghubungkan ke Portal Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="w-full md:w-64 bg-slate-950 text-slate-100 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen shadow-2xl z-30">
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <span className="text-2xl">🚂</span>
            <div>
              <h1 className="font-black tracking-wider text-base text-white">RailTicket</h1>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-500">Portal Admin</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: "summary", label: "Ringkasan", icon: "📊" },
              { id: "kereta", label: "Kereta & Gerbong", icon: "🚄" },
              { id: "jadwal", label: "Jadwal Perjalanan", icon: "📅" },
              { id: "users", label: "Daftar User", icon: "👥" },
              { id: "financials", label: "Laporan Keuangan", icon: "💰" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  // Reset CRUD selections
                  setSelectedKeretaId(null);
                  setSelectedGerbongId(null);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition duration-300 text-left cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/35"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black truncate text-white">👤 {user?.username}</p>
            <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">System Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-slate-850 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg transition border border-slate-800 hover:border-red-900/60 cursor-pointer shadow-sm"
            title="Keluar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-3.5 border">
            <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            <span className="text-sm font-semibold text-gray-700">Memproses permintaan...</span>
          </div>
        </div>
      )}

      {/* Floating Notifications */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-fadeIn">
          <div
            className={`flex items-start gap-3 p-4 rounded-2xl shadow-2xl border max-w-sm backdrop-blur-md ${
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

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Header Bar */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex flex-col sm:flex-row justify-between sm:items-center gap-2 shrink-0 shadow-sm z-20">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide">
              {activeTab === "summary" && "Ringkasan Sistem"}
              {activeTab === "kereta" && "Manajemen Kereta & Gerbong"}
              {activeTab === "jadwal" && "Jadwal Keberangkatan"}
              {activeTab === "users" && "Manajemen Pengguna"}
              {activeTab === "financials" && "Laporan Keuangan"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {activeTab === "summary" && "Informasi umum statistik operasional stasiun."}
              {activeTab === "kereta" && "Kelola armada kereta, kelas, gerbong, dan konfigurasi kursi."}
              {activeTab === "jadwal" && "Rencanakan rute stasiun, tanggal berangkat, dan tarif tiket."}
              {activeTab === "users" && "Daftar seluruh akun terdaftar dan kelola hak akses."}
              {activeTab === "financials" && "Rekapitulasi penjualan tiket dan total profit operasional."}
            </p>
          </div>
          <div className="text-left sm:text-right font-medium text-xs text-gray-400">
            <span>📅 {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </header>

        {/* Content body container */}
        <main className="flex-grow p-8 container mx-auto">
          
          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-8">
              {/* Stat Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Armada Kereta", val: keretaList.length, icon: "🚄", bg: "bg-blue-50 border-blue-200 text-blue-800" },
                  { label: "Jadwal Aktif", val: jadwalList.length, icon: "📅", bg: "bg-teal-50 border-teal-200 text-teal-800" },
                  { label: "User Terdaftar", val: usersList.length, icon: "👥", bg: "bg-purple-50 border-purple-200 text-purple-800" },
                  { label: "Pemasukan Keuangan", val: `Rp ${financials?.total_pemasukan ? financials.total_pemasukan.toLocaleString("id-ID") : "0"}`, icon: "💰", bg: "bg-amber-50 border-amber-200 text-amber-800" },
                ].map((stat, idx) => (
                  <div key={idx} className={`p-6 rounded-3xl border shadow-sm flex items-center justify-between gap-4 bg-white hover:shadow-md transition duration-300`}>
                    <div>
                      <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                      <span className="block text-2xl font-black text-slate-800 mt-1.5">{stat.val}</span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${stat.bg.split(" ").slice(0,2).join(" ")}`}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Guidelines Box */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-3">Selamat Datang di Dashboard Administrator</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Gunakan menu di sidebar kiri untuk mengelola master data stasiun. Anda dapat menambahkan armada kereta baru, membagi gerbong, mendaftarkan nomor kursi, menjadwalkan keberangkatan, memantau akun pengguna, serta menarik rekapitulasi data keuangan bulanan stasiun secara terintegrasi dengan backend.
                </p>
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed">
                  <strong>💡 Catatan Pengoperasian:</strong> Lakukan penginputan berurutan untuk armada baru (Buat Kereta &rarr; Tambahkan Gerbong &rarr; Mendaftarkan Kursi Gerbong &rarr; Buat Jadwal Perjalanan). Hal ini dikarenakan setiap entitas berelasi secara struktural di database.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGING TRAINS & CARRIAGES */}
          {activeTab === "kereta" && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Col 1: Train List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-extrabold text-gray-800 text-base">🚄 Daftar Kereta</h3>
                    <button
                      onClick={() => openTrainModal()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      ➕ <span>Kereta Baru</span>
                    </button>
                  </div>

                  {keretaList.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Belum ada data kereta. Buat kereta baru.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-400 font-bold text-xs uppercase tracking-wider">
                            <th className="pb-3">Nama Kereta</th>
                            <th className="pb-3">Kelas</th>
                            <th className="pb-3">Deskripsi</th>
                            <th className="pb-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {keretaList.map((k) => (
                            <tr
                              key={k.id}
                              onClick={() => {
                                setSelectedKeretaId(k.id);
                                setSelectedGerbongId(null);
                              }}
                              className={`hover:bg-slate-50/80 cursor-pointer transition ${
                                selectedKeretaId === k.id ? "bg-blue-50/40" : ""
                              }`}
                            >
                              <td className="py-4.5 font-bold text-slate-800 flex items-center gap-2">
                                <span>🚆</span> {k.nama_kereta}
                              </td>
                              <td className="py-4.5">
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                                  {k.kelas}
                                </span>
                              </td>
                              <td className="py-4.5 text-gray-500 text-xs truncate max-w-xs">{k.deskripsi || "-"}</td>
                              <td className="py-4.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => openTrainModal(k)}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold transition hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTrain(k.id)}
                                  className="text-red-600 hover:text-red-800 text-xs font-bold transition hover:underline"
                                >
                                  Hapus
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Col 2: Carriages & Seats Detail Panel */}
              <div className="space-y-6">
                {/* Carriage CRUD Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="font-extrabold text-gray-800 text-base">📦 Gerbong</h3>
                    {selectedKeretaId && (
                      <button
                        onClick={() => setGerbongModalOpen(true)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        ➕ Tambah
                      </button>
                    )}
                  </div>

                  {!selectedKeretaId ? (
                    <p className="text-xs text-gray-400 text-center py-6">Pilih kereta di daftar kiri untuk melihat gerbong.</p>
                  ) : gerbongList.filter((g) => String(g.keretaId) === String(selectedKeretaId)).length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <p className="text-xs text-gray-500">Belum ada gerbong pada kereta ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {gerbongList
                        .filter((g) => String(g.keretaId) === String(selectedKeretaId))
                        .map((g) => (
                          <div
                            key={g.id}
                            onClick={() => setSelectedGerbongId(g.id)}
                            className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                              selectedGerbongId === g.id
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-slate-50 hover:bg-slate-100 border-gray-200"
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs">🚪 {g.nama_gerbong}</p>
                              <p className={`text-[10px] ${selectedGerbongId === g.id ? "text-blue-200" : "text-gray-400"} mt-0.5`}>
                                Kuota: {g.kuota || 50} Kursi
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGerbong(g.id);
                              }}
                              className={`text-xs font-bold transition hover:scale-105 p-1 ${
                                selectedGerbongId === g.id ? "text-white/80 hover:text-white" : "text-red-600 hover:text-red-800"
                              }`}
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Seats (Kursi) CRUD Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="font-extrabold text-gray-800 text-base">💺 Daftar Kursi</h3>
                    {selectedGerbongId && (
                      <button
                        onClick={() => setKursiModalOpen(true)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        ➕ Tambah
                      </button>
                    )}
                  </div>

                  {!selectedGerbongId ? (
                    <p className="text-xs text-gray-400 text-center py-6">Pilih gerbong di atas untuk memuat nomor kursi.</p>
                  ) : kursiList.filter((k) => String(k.gerbongId) === String(selectedGerbongId)).length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">Belum ada kursi terdaftar di gerbong ini.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                      {kursiList
                        .filter((k) => String(k.gerbongId) === String(selectedGerbongId))
                        .map((k) => (
                          <div
                            key={k.id}
                            className="bg-slate-50 border border-gray-200 rounded-lg p-2 text-center text-xs font-bold flex items-center justify-between relative group hover:border-red-300"
                          >
                            <span className="text-gray-800">{k.no_kursi}</span>
                            <button
                              onClick={() => handleDeleteKursi(k.id)}
                              className="text-[9px] text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Hapus"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGING SCHEDULES (JADWAL) */}
          {activeTab === "jadwal" && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-gray-800 text-base">📅 Jadwal Perjalanan Kereta</h3>
                <button
                  onClick={() => openScheduleModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                  disabled={keretaList.length === 0}
                >
                  ➕ <span>Jadwal Baru</span>
                </button>
              </div>

              {jadwalList.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada jadwal keberangkatan dibuat.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-bold text-xs uppercase tracking-wider">
                        <th className="pb-3">Armada Kereta</th>
                        <th className="pb-3">Rute Perjalanan</th>
                        <th className="pb-3">Jam Keberangkatan</th>
                        <th className="pb-3">Jam Kedatangan</th>
                        <th className="pb-3">Tarif Tiket</th>
                        <th className="pb-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
                      {jadwalList.map((j) => {
                        const train = j.kereta || keretaList.find((k) => k.id === j.keretaId);
                        const formatTime = (isoStr: string) => {
                          if (!isoStr) return "-";
                          const d = new Date(isoStr);
                          return d.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                        };

                        return (
                          <tr key={j.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-4">
                              <p className="font-bold text-slate-800">{train?.nama_kereta || "Kereta Ekspres"}</p>
                              <span className="text-[10px] text-gray-400 font-extrabold uppercase">{train?.kelas || "EKSEKUTIF"}</span>
                            </td>
                            <td className="py-4">
                              <span className="font-bold text-slate-800">{j.asal_keberangkatan || j.asal}</span>
                              <span className="text-gray-300 mx-2">&rarr;</span>
                              <span className="font-bold text-slate-800">{j.tujuan_keberangkatan || j.tujuan}</span>
                            </td>
                            <td className="py-4 text-xs font-bold text-blue-600">🕒 {formatTime(j.tanggal_berangkat)}</td>
                            <td className="py-4 text-xs text-gray-500">🕒 {formatTime(j.tanggal_kedatangan)}</td>
                            <td className="py-4 font-black text-slate-800">Rp {(j.harga || 150000).toLocaleString("id-ID")}</td>
                            <td className="py-4 text-right space-x-2">
                              <button
                                onClick={() => openScheduleModal(j)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-bold transition hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(j.id)}
                                className="text-red-600 hover:text-red-800 text-xs font-bold transition hover:underline"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USERS LIST */}
          {activeTab === "users" && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-extrabold text-gray-800 text-base mb-6">👥 Manajemen Pengguna Terdaftar</h3>

              {usersList.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Belum ada akun user terdaftar di sistem.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-400 font-bold text-xs uppercase tracking-wider">
                        <th className="pb-3">Username</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Hak Akses (Role)</th>
                        <th className="pb-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 font-bold text-slate-800">👤 {u.username}</td>
                          <td className="py-4 text-gray-500 text-xs">{u.email || "-"}</td>
                          <td className="py-4">
                            <span
                              className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                u.role === "ADMIN"
                                  ? "bg-red-50 border-red-200 text-red-700"
                                  : "bg-green-50 border-green-200 text-green-700"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            {String(u.id) !== String(user?.id) ? (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="text-red-600 hover:text-red-800 text-xs font-bold transition hover:underline"
                              >
                                Hapus Akun
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 italic font-normal">Sesi Aktif</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FINANCIALS & BOOKED TICKETS REKAP */}
          {activeTab === "financials" && (
            <div className="space-y-6">
              {/* Filter Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-gray-800 text-base">💰 Laporan Keuangan Stasiun</h3>
                  <p className="text-xs text-gray-500 mt-1">Lihat nominal rekapitulasi pemasukan bulanan stasiun.</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(Number(e.target.value))}
                    className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 rounded-xl bg-white font-semibold text-xs text-black cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[
                      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                    ].map((mName, i) => (
                      <option key={i + 1} value={i + 1}>
                        {mName}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(Number(e.target.value))}
                    className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 rounded-xl bg-white font-semibold text-xs text-black cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[2025, 2026, 2027].map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Total Revenue Box */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 text-9xl opacity-10 -translate-y-8">💰</div>
                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest">Total Pemasukan Operasional</p>
                <p className="text-3xl font-black mt-2">
                  {financialsLoading ? (
                    <span className="animate-pulse">Menghitung...</span>
                  ) : (
                    `Rp ${financials?.total_pemasukan ? financials.total_pemasukan.toLocaleString("id-ID") : "0"}`
                  )}
                </p>
                <p className="text-[10px] text-blue-200 mt-2 bg-blue-800/40 p-2.5 rounded-xl border border-blue-600/35">
                  * Terhitung dari seluruh pemesanan tiket penumpang lunas di bulan {["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][filterMonth]} {filterYear}.
                </p>
              </div>

              {/* Booked Tickets List */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
                <h4 className="font-extrabold text-gray-800 text-sm mb-4">🎫 Tiket Terjual Terkait</h4>

                {financialsLoading ? (
                  <p className="text-xs text-gray-500 text-center py-6 animate-pulse">Menyinkronkan data tiket...</p>
                ) : !financials?.tiket || financials.tiket.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Tidak ada transaksi penjualan tiket pada bulan ini.</p>
                ) : (
                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                    {financials.tiket.map((ticket: any) => {
                      const origin = ticket.jadwal?.rute?.stasiun_asal || ticket.jadwal?.asal || "Bandung";
                      const dest = ticket.jadwal?.rute?.stasiun_tujuan || ticket.jadwal?.tujuan || "Surabaya";
                      const train = ticket.jadwal?.kereta?.nama_kereta || "Argo Express";
                      const date = ticket.jadwal?.tanggal || "2026-06-10";

                      return (
                        <div key={ticket.id} className="p-4 border border-gray-100 hover:border-gray-200 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">#TK-{ticket.id}</span>
                              <span className="font-semibold text-gray-500">{train}</span>
                            </div>
                            <p className="font-bold text-gray-800 mt-1">{origin} &rarr; {dest}</p>
                            <p className="text-gray-400 text-[10px] mt-0.5">Tanggal: {date}</p>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                            <div>
                              <p className="text-right text-slate-400 text-[9px] font-bold uppercase">Tarif Lunas</p>
                              <p className="font-black text-slate-800 text-sm text-right">Rp {(ticket.total_harga || ticket.harga || 150000).toLocaleString("id-ID")}</p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => handlePrintNota(ticket.id)}
                                className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer hover:shadow-sm"
                                title="Cetak Nota"
                              >
                                📄
                              </button>
                              <button
                                onClick={() => handleDeleteTicket(ticket.id)}
                                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg transition border border-red-200 cursor-pointer"
                                title="Batalkan & Refund"
                              >
                                ❌
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* === MODAL 1: ADD/EDIT TRAIN === */}
      {trainModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-lg font-extrabold text-gray-800">{editingTrain ? "Edit Armada Kereta" : "Tambah Kereta Baru"}</h3>
            <form onSubmit={handleTrainSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nama Kereta</label>
                <input
                  type="text"
                  placeholder="Contoh: Argo Lawu"
                  value={trainForm.nama_kereta}
                  onChange={(e) => setTrainForm({ ...trainForm, nama_kereta: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Kelas Kereta</label>
                <select
                  value={trainForm.kelas}
                  onChange={(e) => setTrainForm({ ...trainForm, kelas: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold cursor-pointer"
                  required
                >
                  <option value="EKSEKUTIF">EKSEKUTIF</option>
                  <option value="BISNIS">BISNIS</option>
                  <option value="EKONOMI">EKONOMI</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Deskripsi Rute/Armada</label>
                <textarea
                  placeholder="Deskripsi rute tujuan umum kereta..."
                  value={trainForm.deskripsi}
                  onChange={(e) => setTrainForm({ ...trainForm, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold h-20 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTrainModalOpen(false)}
                  className="w-1/2 py-2.5 border rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL 2: ADD CARRIAGE === */}
      {gerbongModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-base font-extrabold text-gray-800">Tambah Gerbong</h3>
            <form onSubmit={handleGerbongSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nama Gerbong</label>
                <input
                  type="text"
                  placeholder="Contoh: Gerbong 1"
                  value={gerbongForm.nama_gerbong}
                  onChange={(e) => setGerbongForm({ ...gerbongForm, nama_gerbong: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Kuota Kursi Max</label>
                <input
                  type="number"
                  placeholder="50"
                  value={gerbongForm.kuota}
                  onChange={(e) => setGerbongForm({ ...gerbongForm, kuota: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGerbongModalOpen(false)}
                  className="w-1/2 py-2.5 border rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL 3: ADD SEAT === */}
      {kursiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl border space-y-4">
            <h3 className="text-base font-extrabold text-gray-800">Tambah Kursi</h3>
            <form onSubmit={handleKursiSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Nomor Kursi</label>
                <input
                  type="text"
                  placeholder="Contoh: A1 atau 12B"
                  value={kursiForm.no_kursi}
                  onChange={(e) => setKursiForm({ ...kursiForm, no_kursi: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold uppercase"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setKursiModalOpen(false)}
                  className="w-1/2 py-2.5 border rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                >
                  Tambah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL 4: ADD/EDIT SCHEDULE === */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-gray-800">{editingSchedule ? "Edit Jadwal Perjalanan" : "Buat Jadwal Baru"}</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              
              {/* Select Train relation */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Pilih Armada Kereta</label>
                <select
                  value={scheduleForm.keretaId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, keretaId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold cursor-pointer"
                  required
                  disabled={!!editingSchedule} // Cannot change train of existing schedule
                >
                  {keretaList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kereta} ({k.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Asal */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Stasiun Asal</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bandung"
                    value={scheduleForm.asal_keberangkatan}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, asal_keberangkatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold"
                    required
                  />
                </div>

                {/* Tujuan */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Stasiun Tujuan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Surabaya"
                    value={scheduleForm.tujuan_keberangkatan}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, tujuan_keberangkatan: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold"
                    required
                  />
                </div>

                {/* Dep date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Tanggal Berangkat</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.tanggal_berangkat}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, tanggal_berangkat: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold"
                    required
                  />
                </div>

                {/* Arrive date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Tanggal Kedatangan</label>
                  <input
                    type="datetime-local"
                    value={scheduleForm.tanggal_kedatangan}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, tanggal_kedatangan: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Tarif Tiket (Rp)</label>
                <input
                  type="number"
                  placeholder="350000"
                  value={scheduleForm.harga}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, harga: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white text-black font-semibold"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="w-1/2 py-2.5 border rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
