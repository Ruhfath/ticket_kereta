import { authService } from "./authService";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://sistem-ukl-kereta2-production.up.railway.app/api").replace(/"/g, '');

const getHeaders = () => {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
};

export const adminService = {
  // === KERETA CRUD ===
  createKereta: async (payload: { nama_kereta: string; deskripsi: string; kelas: string }): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/kereta`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal membuat data kereta");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  updateKereta: async (id: number | string, payload: { nama_kereta?: string; deskripsi?: string; kelas?: string }): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/kereta/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengupdate data kereta");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deleteKereta: async (id: number | string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/kereta/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus data kereta");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // === GERBONG CRUD ===
  createGerbong: async (payload: { nama_gerbong: string; kuota: number; keretaId: number }): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/gerbong`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal membuat data gerbong");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  updateGerbong: async (id: number | string, payload: { nama_gerbong?: string; kuota?: number; keretaId?: number }): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/gerbong/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengupdate data gerbong");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deleteGerbong: async (id: number | string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/gerbong/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus data gerbong");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // === KURSI CRUD ===
  createKursi: async (payload: { no_kursi: string; gerbongId: number }): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/kursi`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal membuat data kursi");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deleteKursi: async (id: number | string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/kursi/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus data kursi");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // === JADWAL CRUD ===
  createJadwal: async (payload: {
    asal_keberangkatan: string;
    tujuan_keberangkatan: string;
    tanggal_berangkat: string;
    tanggal_kedatangan: string;
    harga: number;
    keretaId: number;
  }): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/jadwal`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal membuat jadwal perjalanan");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  updateJadwal: async (
    id: number | string,
    payload: {
      asal_keberangkatan?: string;
      tujuan_keberangkatan?: string;
      tanggal_berangkat?: string;
      tanggal_kedatangan?: string;
      harga?: number;
      keretaId?: number;
    }
  ): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/jadwal/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal mengupdate jadwal perjalanan");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deleteJadwal: async (id: number | string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/jadwal/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus jadwal perjalanan");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // === USERS & PELANGGAN MANAGEMENT ===
  getAllUsers: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/users/findall`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal memuat data seluruh user");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (id: number | string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/users/delete/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus data user");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // === TICKETS & FINANCIAL REKAP ===
  getAllTickets: async (bulan: number, tahun: number): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/ticket?bulan=${bulan}&tahun=${tahun}`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal memuat seluruh data tiket");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deleteTicket: async (id: number | string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/ticket/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal menghapus/membatalkan tiket");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getRevenueRekap: async (bulan: number, tahun: number): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/ticket/rekap/pemasukan?bulan=${bulan}&tahun=${tahun}`, {
        method: "GET",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal memuat data rekapitulasi keuangan");
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};
