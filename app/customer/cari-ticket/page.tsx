"use client";

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/service/authService";

export default function CariTicketPage() {
  const router = useRouter();

  // Authentication state
  const [profile, setProfile] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Search parameters
  const [asal, setAsal] = useState("");
  const [tujuan, setTujuan] = useState("");
  const [kelas, setKelas] = useState("EKSEKUTIF");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);

  // Search results state
  const [schedules, setSchedules] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  // Booking state
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [selectedScheduleDetail, setSelectedScheduleDetail] = useState<any>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Passenger entries in booking form
  const [passengers, setPassengers] = useState<Array<{ name: string; NIK: string; gerbongId: string; kursiId: string }>>([
    { name: "", NIK: "", gerbongId: "", kursiId: "" }
  ]);

  // Carriages and Seats raw databases (fetched dynamically)
  const [allGerbongs, setAllGerbongs] = useState<any[]>([]);
  const [allKursis, setAllKursis] = useState<any[]>([]);

  // Filtered carriages and seats options for selectors
  const [availableGerbongs, setAvailableGerbongs] = useState<any[]>([]);

  // List of available stations
  const [availableStations, setAvailableStations] = useState<string[]>([]);

  // Notification state
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Check auth & pre-fetch lists on mount
  useEffect(() => {
    const init = async () => {
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

      try {
        // Fetch passenger profile to auto-populate Passenger 1
        const userProfile = await authService.getProfile();
        setProfile(userProfile);
        if (userProfile) {
          setPassengers([{
            name: userProfile.nama_penumpang || "",
            NIK: userProfile.NIK || "",
            gerbongId: "",
            kursiId: ""
          }]);
        }

        // Pre-fetch all gerbongs and kursis databases for offline relational filtering
        const gerbongsList = await authService.getGerbongs();
        const kursisList = await authService.getKursis();
        setAllGerbongs(Array.isArray(gerbongsList) ? gerbongsList : []);
        setAllKursis(Array.isArray(kursisList) ? kursisList : []);

        // Fetch stations from active schedules
        try {
          const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://sistem-ukl-kereta2-production.up.railway.app/api").replace(/"/g, '');
          const jadwalRes = await fetch(`${API_URL}/jadwal`);
          const defaultStations = ["Bandung", "Surabaya", "Jakarta", "Yogyakarta", "Semarang", "Solo", "Malang", "Cirebon"];
          const stationsSet = new Set<string>(defaultStations);

          if (jadwalRes.ok) {
            const jadwalData = await jadwalRes.json();
            if (Array.isArray(jadwalData)) {
              jadwalData.forEach((j: any) => {
                const origin = j.asal_keberangkatan || j.asal;
                const dest = j.tujuan_keberangkatan || j.tujuan;
                if (origin) stationsSet.add(origin);
                if (dest) stationsSet.add(dest);
              });
            }
          }
          setAvailableStations(Array.from(stationsSet).sort());
        } catch (err) {
          console.error("Gagal memuat stasiun:", err);
          setAvailableStations(["Bandung", "Surabaya", "Jakarta", "Yogyakarta", "Semarang", "Solo", "Malang", "Cirebon"]);
        }
      } catch (err) {
        console.error("Gagal menginisialisasi pencarian:", err);
      } finally {
        setPageLoading(false);
      }
    };
    init();
  }, [router]);

  // Handle schedule search submit
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asal.trim() || !tujuan.trim() || !tanggal) {
      setError("Semua kolom pencarian wajib diisi");
      return;
    }

    setError("");
    setSearching(true);
    setHasSearched(true);
    setSchedules([]);

    try {
      const results = await authService.searchJadwal(asal, tujuan, kelas, tanggal);
      setSchedules(Array.isArray(results) ? results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencari jadwal.");
    } finally {
      setSearching(false);
    }
  };

  // Open booking modal and fetch schedule details (seats availability) dynamically
  const handleOpenBooking = async (schedule: any) => {
    setSelectedSchedule(schedule);
    setBookingError("");
    setFetchingDetail(true);
    setBookingModalOpen(true);

    try {
      const detail = await authService.getJadwalDetail(schedule.id);
      setSelectedScheduleDetail(detail);

      const filteredGerbongs = detail?.kereta?.gerbong || [];
      setAvailableGerbongs(filteredGerbongs);

      // Reset passenger inputs (maintaining P1 from user profile if loaded)
      setPassengers([
        {
          name: profile?.nama_penumpang || "",
          NIK: profile?.NIK || "",
          gerbongId: filteredGerbongs[0]?.id ? String(filteredGerbongs[0].id) : "",
          kursiId: ""
        }
      ]);
    } catch (err) {
      console.error("Gagal memuat detail jadwal & kursi:", err);
      setBookingError("Gagal memuat data kursi dari server.");
    } finally {
      setFetchingDetail(false);
    }
  };

  // Add extra passenger fields
  const handleAddPassenger = () => {
    setPassengers([
      ...passengers,
      {
        name: "",
        NIK: "",
        gerbongId: availableGerbongs[0]?.id ? String(availableGerbongs[0].id) : "",
        kursiId: ""
      }
    ]);
  };

  // Remove passenger fields
  const handleRemovePassenger = (index: number) => {
    const updated = [...passengers];
    updated.splice(index, 1);
    setPassengers(updated);
  };

  // Handle passenger input changes
  const handlePassengerChange = (index: number, field: string, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    
    // If gerbong changes, reset the seat choice for that passenger
    if (field === "gerbongId") {
      updated[index].kursiId = "";
    }
    
    setPassengers(updated);
  };

  // Filter seats based on selected Carriage (gerbongId) for a specific passenger row
  const getSeatsForGerbong = (gerbongId: string) => {
    if (!gerbongId) return [];
    
    // First try to find seats inside selectedScheduleDetail (real-time availability)
    const detailGerbong = selectedScheduleDetail?.kereta?.gerbong?.find(
      (g: any) => String(g.id) === String(gerbongId)
    );
    if (detailGerbong?.kursi) {
      return detailGerbong.kursi;
    }
    
    // Fallback to offline pre-cached seats
    return allKursis.filter((k) => String(k.gerbongId) === String(gerbongId));
  };

  // Utility to parse seat string into row and column
  const parseSeat = (no_kursi: string) => {
    const rowMatch = no_kursi.match(/\d+/);
    const colMatch = no_kursi.match(/[a-zA-Z]+/);
    
    const row = rowMatch ? parseInt(rowMatch[0]) : 1;
    const col = colMatch ? colMatch[0].toUpperCase() : "A";
    
    return { row, col };
  };

  // Group seats by row and column for carriage layout
  const getGroupedSeats = (gerbongId: string) => {
    const seatsList = getSeatsForGerbong(gerbongId);
    
    const rowsMap: { [row: number]: { [col: string]: any } } = {};
    const columnsSet = new Set<string>();
    
    seatsList.forEach((seat: any) => {
      const { row, col } = parseSeat(seat.no_kursi);
      if (!rowsMap[row]) {
        rowsMap[row] = {};
      }
      rowsMap[row][col] = seat;
      columnsSet.add(col);
    });
    
    const sortedRows = Object.keys(rowsMap)
      .map(Number)
      .sort((a, b) => a - b);
      
    const sortedCols = Array.from(columnsSet).sort();
    
    return {
      rows: sortedRows,
      cols: sortedCols,
      rowsMap
    };
  };

  // Render Visual Carriage Seat Map Grid
  const renderSeatGrid = (passengerIndex: number, gerbongId: string) => {
    const { rows, cols, rowsMap } = getGroupedSeats(gerbongId);
    
    if (rows.length === 0) {
      return (
        <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl bg-slate-50">
          Tidak ada data kursi di gerbong ini
        </div>
      );
    }
    
    // Determine aisle location
    const aisleIndex = cols.length === 5 ? 2 : cols.length === 4 ? 1 : Math.floor(cols.length / 2) - 1;
    
    // Grid class configuration
    const gridClass = cols.length === 5 ? "grid-cols-6" : "grid-cols-5";
    
    return (
      <div className="space-y-4">
        {/* Legend Indicator */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold justify-center bg-slate-50 p-3 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="w-4.5 h-4.5 bg-white border border-gray-300 rounded shadow-sm"></span>
            <span className="text-gray-600">Tersedia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4.5 h-4.5 bg-blue-600 rounded shadow-sm"></span>
            <span className="text-gray-600 font-bold">Pilihan Anda</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4.5 h-4.5 bg-amber-500 rounded shadow-sm"></span>
            <span className="text-gray-600">Dipilih Penumpang Lain (Grup)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4.5 h-4.5 bg-slate-200 border border-slate-300 rounded flex items-center justify-center text-[9px] font-black text-slate-400">✕</span>
            <span className="text-gray-600">Sudah Terisi</span>
          </div>
        </div>

        {/* Carriage layout box */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 max-h-[300px] overflow-y-auto shadow-inner">
          <div className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b border-dashed border-slate-200 pb-2">
            🚆 ARAH PERJALANAN (DEPAN)
          </div>
          
          <div className="space-y-3 max-w-sm mx-auto">
            {/* Columns header labels */}
            <div className={`grid ${gridClass} gap-2 text-center font-extrabold text-[10px] text-slate-400`}>
              {cols.map((col, idx) => (
                <Fragment key={col}>
                  <div className="flex justify-center items-center">
                    <span>{col}</span>
                  </div>
                  {idx === aisleIndex && (
                    <div className="w-6 flex justify-center items-center text-[9px] font-bold text-slate-300">
                      Gg
                    </div>
                  )}
                </Fragment>
              ))}
            </div>

            {/* Grid Rows */}
            {rows.map((rowNum) => (
              <div key={rowNum} className={`grid ${gridClass} gap-2 items-center`}>
                {cols.map((col, idx) => {
                  const seat = rowsMap[rowNum]?.[col];
                  const aisleElement = idx === aisleIndex && (
                    <div className="w-6 text-[9px] font-bold text-slate-300 text-center tracking-widest uppercase select-none">
                      ||
                    </div>
                  );

                  if (!seat) {
                    return (
                      <Fragment key={col}>
                        <div className="flex justify-center items-center">
                          <div className="w-9 h-9 rounded bg-transparent" />
                        </div>
                        {aisleElement}
                      </Fragment>
                    );
                  }

                  const seatId = String(seat.id);
                  const isOccupied = !seat.tersedia;
                  const isSelectedByMe = String(passengers[passengerIndex].kursiId) === seatId;
                  const isSelectedByOtherInGroup = passengers.some(
                    (p, pIdx) => pIdx !== passengerIndex && String(p.kursiId) === seatId
                  );

                  let btnStyle = "";
                  let onSeatClick = () => handlePassengerChange(passengerIndex, "kursiId", seatId);

                  if (isOccupied) {
                    btnStyle = "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed line-through";
                    onSeatClick = () => {};
                  } else if (isSelectedByMe) {
                    btnStyle = "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300 scale-105 font-bold";
                  } else if (isSelectedByOtherInGroup) {
                    btnStyle = "bg-amber-500 text-white border-amber-600 cursor-not-allowed font-bold opacity-80";
                    onSeatClick = () => {};
                  } else {
                    btnStyle = "bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 active:scale-95";
                  }

                  return (
                    <Fragment key={col}>
                      <div className="flex justify-center items-center">
                        <button
                          type="button"
                          disabled={isOccupied || isSelectedByOtherInGroup}
                          onClick={onSeatClick}
                          title={`Kursi ${seat.no_kursi}`}
                          className={`w-9 h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all duration-200 ${btnStyle}`}
                        >
                          {seat.no_kursi}
                        </button>
                      </div>
                      {aisleElement}
                    </Fragment>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Handle Ticket Booking Submit
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Confirming reservation for passengers:", passengers);
    setBookingError("");
    setBookingLoading(true);

    // Validation
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim()) {
        setBookingError(`Nama Penumpang #${i + 1} wajib diisi`);
        setBookingLoading(false);
        return;
      }
      if (!p.NIK.trim() || p.NIK.length !== 16) {
        setBookingError(`NIK Penumpang #${i + 1} harus 16 digit angka`);
        setBookingLoading(false);
        return;
      }
      if (!p.kursiId) {
        setBookingError(`Pilih kursi untuk Penumpang #${i + 1}`);
        setBookingLoading(false);
        return;
      }
    }

    // Check duplicate seat choices
    const selectedSeatIds = passengers.map((p) => p.kursiId);
    if (new Set(selectedSeatIds).size !== selectedSeatIds.length) {
      setBookingError("Satu nomor kursi tidak boleh dipilih lebih dari sekali");
      setBookingLoading(false);
      return;
    }

    const payload = {
      jadwalId: Number(selectedSchedule.id),
      penumpang: passengers.map((p) => ({
        NIK: p.NIK,
        nama_penumpang: p.name,
        kursiId: Number(p.kursiId)
      }))
    };

    console.log("Submitting reservation payload:", payload);

    try {
      const response = await authService.bookTicket(payload);
      console.log("Reservation success response:", response);
      
      // Display success alert popup directly on user's screen
      alert(`Reservasi Berhasil!\nTiket perjalanan Anda telah sukses dipesan dengan ID Booking: #TK-${response.id}`);

      setNotification({
        type: "success",
        message: `Tiket berhasil dipesan! ID Booking: #TK-${response.id}`
      });
      setBookingModalOpen(false);
      
      // Redirect to passenger dashboard tickets tab after delay
      setTimeout(() => {
        router.push("/customer/dashboard?tab=tickets");
      }, 500);
    } catch (err) {
      console.error("Reservation error caught:", err);
      const errMsg = err instanceof Error ? err.message : "Gagal memesan tiket.";
      
      // Display failure alert details on screen
      alert(`Gagal Melakukan Reservasi:\n${errMsg}`);
      setBookingError(errMsg);
    } finally {
      setBookingLoading(false);
    }
  };

  // Global Page Loading
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-semibold animate-pulse">Menyiapkan form pencarian...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-black">
      {/* Header Banner */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-y-12 translate-x-12"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-xl translate-y-12 -translate-x-12"></div>

        <div className="container mx-auto px-6 py-8 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Cari & Pesan Tiket Kereta</h1>
          <p className="text-blue-100 text-sm mt-1">Temukan rute perjalanan terbaik dengan harga termurah di Indonesia</p>
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

      {/* Main Container */}
      <div className="container mx-auto px-6 mt-8">
        {/* 1. SEARCH BOX FORM CARD */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8 max-w-4xl mx-auto">
          <form onSubmit={handleSearch} className="space-y-6">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-3 flex items-center gap-2">
              <span>🔍</span> Lengkapi Detail Rute Perjalanan
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Asal */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Stasiun Asal</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 z-10">🚉</span>
                  <select
                    value={asal}
                    onChange={(e) => setAsal(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-sm text-black cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Pilih Stasiun Asal --</option>
                    {availableStations.map((stasiun) => (
                      <option key={stasiun} value={stasiun} disabled={stasiun === tujuan}>
                        {stasiun}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tujuan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Stasiun Tujuan</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 z-10">🏁</span>
                  <select
                    value={tujuan}
                    onChange={(e) => setTujuan(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-sm text-black cursor-pointer"
                    required
                  >
                    <option value="" disabled>-- Pilih Stasiun Tujuan --</option>
                    {availableStations.map((stasiun) => (
                      <option key={stasiun} value={stasiun} disabled={stasiun === asal}>
                        {stasiun}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanggal */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal Perjalanan</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">📅</span>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm text-black"
                    required
                  />
                </div>
              </div>

              {/* Kelas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Kelas Kereta</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">💎</span>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm text-black cursor-pointer"
                  >
                    <option value="EKSEKUTIF">Eksekutif (Premium)</option>
                    <option value="BISNIS">Bisnis (Nyaman)</option>
                    <option value="EKONOMI">Ekonomi (Hemat)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl hover:shadow-lg transition duration-300 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {searching ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Mencari Jadwal...</span>
                </>
              ) : (
                <>
                  <span>🚀 Cari Tiket Perjalanan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* 2. SEARCH RESULTS AREA */}
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3">
              <span>⚠️</span>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {searching ? (
            /* Skeletons */
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-pulse flex flex-col gap-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-12 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : hasSearched && schedules.length === 0 ? (
            /* Empty Results */
            <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 space-y-3">
              <span className="text-5xl">🚂</span>
              <h3 className="text-lg font-bold text-gray-800">Jadwal Perjalanan Tidak Ditemukan</h3>
              <p className="text-gray-500 max-w-md mx-auto text-sm">
                Maaf, tidak ada jadwal keberangkatan kereta kelas <strong>{kelas}</strong> rute <strong>{asal}</strong> ke <strong>{tujuan}</strong> untuk tanggal <strong>{tanggal}</strong>. Silakan sesuaikan rute, kelas, atau tanggal perjalanan Anda.
              </p>
            </div>
          ) : (
            /* Results Cards */
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const trainName = schedule.kereta?.nama_kereta || "Kereta Ekspres";
                const trainClass = schedule.kereta?.kelas || kelas;
                const origin = schedule.asal_keberangkatan || schedule.asal || asal;
                const destination = schedule.tujuan_keberangkatan || schedule.tujuan || tujuan;
                
                // Formatted dates/times
                const depDate = schedule.tanggal_berangkat 
                  ? new Date(schedule.tanggal_berangkat).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                  : tanggal;
                const depTime = schedule.tanggal_berangkat 
                  ? new Date(schedule.tanggal_berangkat).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
                  : "08:00";
                  
                const arrTime = schedule.tanggal_kedatangan 
                  ? new Date(schedule.tanggal_kedatangan).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) 
                  : "16:00";
                  
                const price = schedule.harga || 150000;

                return (
                  <div
                    key={schedule.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-blue-200 transition duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    {/* Trip summary */}
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-md uppercase">
                          {trainClass}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-lg">{trainName}</h3>
                      </div>

                      <div className="grid grid-cols-3 items-center max-w-sm gap-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-400">Berangkat ({depTime})</p>
                          <p className="font-bold text-gray-700">{origin}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{depDate}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-gray-300 text-xl font-bold">&rarr;</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-400">Tiba ({arrTime})</p>
                          <p className="font-bold text-gray-700">{destination}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action Button */}
                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                      <div>
                        <p className="text-xs font-semibold text-gray-400 text-left md:text-right">Harga per Kursi</p>
                        <p className="text-2xl font-black text-blue-600">Rp {price.toLocaleString("id-ID")}</p>
                      </div>

                      <button
                        onClick={() => handleOpenBooking(schedule)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl hover:shadow-md transition duration-300 cursor-pointer text-sm shadow active:scale-95"
                      >
                        Pesan Tiket
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. BOOKING RESERVATION OVERLAY MODAL */}
      {bookingModalOpen && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto transition-opacity duration-300">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-white/20 space-y-6 max-h-[90vh] overflow-y-auto my-8 transform transition-transform duration-300 scale-100 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>🎟️</span> Formulir Reservasi Tiket
                </h3>
                <p className="text-xs text-slate-500 mt-1">Lengkapi nama, NIK, dan pilih kursi visual per penumpang</p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold p-1 cursor-pointer transition"
                disabled={bookingLoading}
              >
                ✕
              </button>
            </div>

            {/* Premium Boarding Pass Trip Brief Details */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 overflow-hidden border border-white/10 shadow-lg select-none">
              {/* Ticket Notches */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-900/60 rounded-r-full -ml-2 backdrop-blur-sm"></div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-slate-900/60 rounded-l-full -mr-2 backdrop-blur-sm"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Left Area: Route info & Train */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-blue-500/20 text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded border border-blue-400/20 uppercase tracking-wider">
                      {selectedSchedule.kereta?.kelas || kelas}
                    </span>
                    <span className="font-mono text-xs text-slate-400">Jadwal #{selectedSchedule.id}</span>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asal</p>
                      <p className="text-xl font-black text-slate-100">{selectedSchedule.asal_keberangkatan || selectedSchedule.asal || asal}</p>
                    </div>
                    
                    {/* Train graphic bridge */}
                    <div className="flex-1 flex flex-col items-center justify-center relative px-2">
                      <div className="w-full border-t border-dashed border-slate-600 my-1"></div>
                      <span className="absolute bg-slate-800 px-3 py-1 text-xs rounded-full border border-slate-700 text-slate-300 font-bold tracking-wide flex items-center gap-1.5 shadow-sm">
                        <span>🚂</span> {selectedSchedule.kereta?.nama_kereta || "Kereta Ekspres"}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5 text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tujuan</p>
                      <p className="text-xl font-black text-slate-100">{selectedSchedule.tujuan_keberangkatan || selectedSchedule.tujuan || tujuan}</p>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Divider vs Desktop dashed line */}
                <div className="hidden md:block border-l border-dashed border-slate-700 h-16 absolute right-[32%] top-1/2 -translate-y-1/2"></div>
                
                {/* Right Area: Time & Price */}
                <div className="md:pl-6 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keberangkatan</p>
                    <p className="text-sm font-black text-slate-200">
                      {selectedSchedule.tanggal_berangkat 
                        ? new Date(selectedSchedule.tanggal_berangkat).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
                        : tanggal}
                    </p>
                    <p className="text-xs font-semibold text-indigo-300 mt-0.5">
                      🕒 {selectedSchedule.tanggal_berangkat 
                        ? new Date(selectedSchedule.tanggal_berangkat).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
                        : "08:00"} WIB
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 md:border-t-0 md:pt-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Biaya Tiket</p>
                    <p className="text-lg font-black text-yellow-400">
                      Rp {(selectedSchedule.harga || 150000).toLocaleString("id-ID")} <span className="text-[10px] text-slate-300 font-normal">/ pax</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Notification message */}
            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-sm font-semibold flex items-start gap-2.5 shadow-sm">
                <span className="text-base">⚠️</span>
                <div>
                  <p className="font-bold">Gagal Validasi Formulir</p>
                  <p className="text-xs text-red-700/90 font-medium mt-0.5">{bookingError}</p>
                </div>
              </div>
            )}

            {/* Schedule details loader spinner */}
            {fetchingDetail ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative w-14 h-14">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-500 font-bold text-sm animate-pulse">Menyiapkan Denah Kursi Interaktif...</p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-6">
                <div className="space-y-5">
                  {passengers.map((passenger, index) => {
                    return (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-3xl p-5 md:p-6 space-y-5 relative bg-white shadow-sm hover:shadow-md transition duration-300"
                      >
                        {/* Passenger card header */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <h4 className="font-black text-sm text-blue-900 flex items-center gap-2">
                            <span className="bg-blue-50 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">#{index + 1}</span> 
                            <span>Data Penumpang</span>
                          </h4>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePassenger(index)}
                              className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-red-50"
                              disabled={bookingLoading}
                            >
                              Hapus Penumpang
                            </button>
                          )}
                        </div>

                        {/* Input details */}
                        <div className="grid sm:grid-cols-3 gap-4">
                          {/* Name input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                              <span>👤</span> Nama Lengkap
                            </label>
                            <input
                              type="text"
                              placeholder="Sesuai KTP / SIM"
                              value={passenger.name}
                              onChange={(e) => handlePassengerChange(index, "name", e.target.value)}
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                              required
                              disabled={bookingLoading}
                            />
                          </div>

                          {/* NIK input */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                              <span>💳</span> NIK KTP (16 Digit)
                            </label>
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="Nomor Induk Kependudukan"
                              value={passenger.NIK}
                              onChange={(e) => handlePassengerChange(index, "NIK", e.target.value.replace(/\D/g, ""))}
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                              required
                              disabled={bookingLoading}
                            />
                          </div>

                          {/* Gerbong dropdown selector */}
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                              <span>🚪</span> Pilih Gerbong
                            </label>
                            <select
                              value={passenger.gerbongId}
                              onChange={(e) => handlePassengerChange(index, "gerbongId", e.target.value)}
                              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white text-slate-900 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                              required
                              disabled={bookingLoading}
                            >
                              <option value="" disabled>-- Pilih Gerbong --</option>
                              {availableGerbongs.map((g) => (
                                <option key={g.id} value={String(g.id)}>
                                  {g.nama_gerbong}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Interactive visual seat map */}
                        {passenger.gerbongId && (
                          <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                              <span className="flex items-center gap-1.5">💺 Pilih Nomor Kursi Visual</span>
                              {passenger.kursiId ? (
                                <span className="bg-blue-100 text-blue-700 text-xs px-3 py-0.5 rounded-full font-black border border-blue-200 shadow-sm animate-pulse">
                                  Terpilih: Kursi {
                                    getSeatsForGerbong(passenger.gerbongId).find(
                                      (k: any) => String(k.id) === String(passenger.kursiId)
                                    )?.no_kursi || ""
                                  }
                                </span>
                              ) : (
                                <span className="text-red-500 font-bold animate-pulse text-[10px] bg-red-50 px-2 py-0.5 border border-red-200/50 rounded">
                                  Wajib pilih kursi di denah
                                </span>
                              )}
                            </label>
                            {renderSeatGrid(index, passenger.gerbongId)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add passenger button option */}
                <button
                  type="button"
                  onClick={handleAddPassenger}
                  className="w-full py-4 border-2 border-dashed border-blue-200 hover:border-blue-400 text-blue-600 hover:text-blue-800 hover:bg-blue-50/35 rounded-2xl text-sm font-black transition duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  disabled={bookingLoading}
                >
                  <span>➕</span>
                  <span>Tambah Penumpang Lain</span>
                </button>

                {/* Reservation Summary Footer */}
                <div className="border-t border-slate-200 pt-5 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <div className="space-y-0.5">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Total Reservasi</span>
                      <span className="text-slate-400 text-xs font-medium">{passengers.length} Tiket Kereta</span>
                    </div>
                    <span className="text-3xl font-black text-blue-600 tracking-tight">
                      Rp {( (selectedSchedule.harga || 150000) * passengers.length ).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setBookingModalOpen(false)}
                      className="w-1/3 py-3.5 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer text-sm shadow-sm active:scale-95"
                      disabled={bookingLoading}
                    >
                      Batal
                    </button>

                    <button
                      type="submit"
                      className="w-2/3 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold rounded-xl hover:shadow-lg transition duration-300 cursor-pointer text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                          <span>Memproses Reservasi...</span>
                        </>
                      ) : (
                        <>
                          <span>✅ Konfirmasi Reservasi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
