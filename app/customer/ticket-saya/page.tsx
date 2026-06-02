"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/service/authService";

export default function TicketSayaPage() {
  const router = useRouter();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Ticket history lists
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Alerts notifications
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal actions
  const [confirmCancelId, setConfirmCancelId] = useState<string | number | null>(null);
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth Guard
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/login");
      return;
    }
    const currentUser = authService.getUser();
    if (currentUser?.role === "ADMIN") {
      router.push("/admin/dashboard");
      return;
    }
    setIsAuthenticated(true);
    setPageLoading(false);
  }, [router]);

  // Fetch tickets on mount & filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated, filterMonth, filterYear]);

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const list = await authService.getMyTickets(filterMonth, filterYear);
      setTickets(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Gagal mengambil tiket:", err);
      setTickets([]);
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal mengambil daftar tiket.",
      });
    } finally {
      setTicketsLoading(false);
    }
  };

  // Handle Download/Print Nota (Invoice)
  const handlePrintNota = async (ticketId: string | number) => {
    try {
      setNotification({ type: "success", message: "Mengunduh nota tiket..." });
      const { blob, contentType } = await authService.getMyTicketNota(ticketId);
      
      const file = new Blob([blob], { type: contentType });
      const fileURL = URL.createObjectURL(file);
      
      // Open in new tab
      const tab = window.open(fileURL);
      if (!tab) {
        // Fallback to download if popup blocked
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
      // Re-fetch listing
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
          <p className="text-gray-600 font-semibold animate-pulse">Memuat halaman tiket Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-black">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-xl translate-y-12 -translate-x-12"></div>

        <div className="container mx-auto px-6 py-8 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Tiket Saya</h1>
          <p className="text-blue-100 text-sm mt-1">Kelola dan lihat seluruh daftar riwayat pemesanan tiket kereta Anda</p>
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

      {/* Main Content */}
      <div className="container mx-auto px-6 mt-8 max-w-4xl space-y-6">
        
        {/* Filter Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Daftar Transaksi Perjalanan</h2>
            <p className="text-sm text-gray-500 mt-1">Saring tiket perjalanan aktif berdasarkan bulan keberangkatan</p>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {/* Month Dropdown */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className="flex-1 sm:flex-initial px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm text-black cursor-pointer shadow-sm"
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
              className="flex-1 sm:flex-initial px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm text-black cursor-pointer shadow-sm"
            >
              {[2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tickets List */}
        {ticketsLoading ? (
          /* Skeletons */
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse flex flex-col gap-4">
                <div className="flex justify-between border-b pb-3">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-16 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          /* Empty tickets state */
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
            <span className="text-6xl">🎫</span>
            <h3 className="text-xl font-bold text-gray-800">Tiket Tidak Ditemukan</h3>
            <p className="text-gray-500 max-w-sm mx-auto text-sm">
              Anda tidak memiliki tiket perjalanan pada bulan {["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][filterMonth]} {filterYear}.
            </p>
            <button
              onClick={() => router.push("/customer/cari-ticket")}
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg transition duration-300 cursor-pointer text-sm shadow"
            >
              Pesan Tiket Baru Sekarang &raquo;
            </button>
          </div>
        ) : (
          /* Ticket Items loop */
          <div className="space-y-6">
            {tickets.map((ticket) => {
              // Extract fields with fallback mechanisms
              const trainName = ticket.jadwal?.kereta?.nama_kereta || "Argo Express";
              const trainClass = ticket.jadwal?.kereta?.kelas || "EKSEKUTIF";
              const origin = ticket.jadwal?.rute?.stasiun_asal || ticket.jadwal?.asal || "Stasiun Asal";
              const destination = ticket.jadwal?.rute?.stasiun_tujuan || ticket.jadwal?.tujuan || "Stasiun Tujuan";
              const date = ticket.jadwal?.tanggal || "Tanggal Perjalanan";
              const time = ticket.jadwal?.waktu_berangkat || ticket.jadwal?.jam || "08:00";
              const price = ticket.total_harga || ticket.harga || 0;

              // Passengers mappings
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
                  className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition duration-300"
                >
                  {/* Item Header */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kode Booking</p>
                      <p className="font-mono text-base font-bold text-yellow-300">#TK-{ticket.id}</p>
                    </div>
                    <div>
                      <span className="bg-green-500/20 text-green-300 text-xs font-black px-3 py-1 rounded-full border border-green-500/30">
                        Lunas
                      </span>
                    </div>
                  </div>

                  {/* Item Body */}
                  <div className="p-6 space-y-5">
                    {/* Trip details */}
                    <div className="flex flex-col md:flex-row justify-between gap-4 pb-5 border-b border-gray-100">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-extrabold px-2.5 py-0.5 rounded uppercase">
                            {trainClass}
                          </span>
                          <h3 className="font-extrabold text-slate-800">{trainName}</h3>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="font-bold text-gray-700">{origin}</span>
                          <span className="text-gray-300 font-bold">&rarr;</span>
                          <span className="font-bold text-gray-700">{destination}</span>
                        </div>
                      </div>

                      <div className="md:text-right text-sm">
                        <p className="text-xs font-bold text-gray-400">Jadwal Keberangkatan</p>
                        <p className="font-bold text-gray-800 mt-0.5">{date}</p>
                        <p className="font-bold text-blue-600 mt-0.5">🕒 {time}</p>
                      </div>
                    </div>

                    {/* Passengers details */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Penumpang</p>
                      <div className="grid sm:grid-cols-2 gap-2.5">
                        {passengers.length > 0 ? (
                          passengers.map((p: any, idx: number) => {
                            const pName = p.nama_penumpang || p.nama || "Nama Lengkap";
                            const pNik = p.NIK || p.nik || "-";
                            const pSeat = p.kursi?.no_kursi || p.no_kursi || p.kursiId || "A1";
                            return (
                              <div key={idx} className="p-3 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                                <div>
                                  <p className="font-bold text-gray-800">{pName}</p>
                                  <p className="text-gray-400 font-mono mt-0.5">NIK: {pNik}</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-100 text-blue-700 font-black px-2.5 py-1.5 rounded-lg text-center shadow-sm">
                                  {pSeat}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="font-bold text-gray-800">Penumpang Utama</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 text-blue-700 font-black px-2.5 py-1.5 rounded-lg">
                              A1
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions & Price */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-5 border-t border-gray-100">
                      <div>
                        <span className="text-xs font-semibold text-gray-400">Total Biaya</span>
                        <p className="text-xl font-black text-blue-600">
                          Rp {price ? price.toLocaleString("id-ID") : "150.000"}
                        </p>
                      </div>

                      <div className="flex gap-2.5 w-full sm:w-auto">
                        <button
                          onClick={() => setConfirmCancelId(ticket.id)}
                          className="flex-1 sm:flex-none border border-red-200 text-red-600 hover:bg-red-50 font-bold px-4 py-2.5 rounded-xl transition duration-300 cursor-pointer text-sm shadow-sm active:scale-95"
                          disabled={cancellingId !== null}
                        >
                          Batalkan
                        </button>
                        <button
                          onClick={() => handlePrintNota(ticket.id)}
                          className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl hover:shadow-md transition duration-300 cursor-pointer text-sm flex items-center justify-center gap-1 active:scale-95"
                        >
                          📄 <span>Nota Tiket</span>
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

      {/* CONFIRM CANCEL MODAL */}
      {confirmCancelId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-center">
            <div className="inline-block bg-red-100 text-red-700 p-3 rounded-full shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Batalkan Tiket Perjalanan?</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Tindakan ini permanen. Tiket pemesanan <strong>#TK-{confirmCancelId}</strong> akan dibatalkan, dana hangus sesuai ketentuan, dan kursi akan dirilis kembali.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelId(null)}
                className="w-1/2 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition cursor-pointer text-xs"
                disabled={cancellingId !== null}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleCancelTicket(confirmCancelId)}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-1.5"
                disabled={cancellingId !== null}
              >
                {cancellingId !== null ? (
                  <>
                    <div className="w-4.5 h-4.5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
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
