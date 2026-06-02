const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://sistem-ukl-kereta2-production.up.railway.app/api").replace(/"/g, '');

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email?: string;
    role: string;
  };
  message: string;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface RegisterPayload {
  username: string;
  password: string;
  role?: string;
}

interface RegisterResponse {
  id: string | number;
  username: string;
  role: string;
  message?: string;
}

interface ProfilePayload {
  NIK: string;
  nama_penumpang: string;
  alamat: string;
  telp: string;
}


export const authService = {
  login: async (credentials: LoginPayload): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login gagal. Silakan periksa kembali kredensial Anda.');
      }

      const data: LoginResponse = await response.json();

      // Store token and user in localStorage
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  register: async (credentials: RegisterPayload): Promise<RegisterResponse> => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          role: credentials.role || 'PENUMPANG',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registrasi gagal. Silakan coba username lain.');
      }

      const data: RegisterResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  createProfile: async (profile: ProfilePayload): Promise<any> => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Token otentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`${API_URL}/pelanggan/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menyimpan detail profil.');
      }

      const data = await response.json();
      localStorage.setItem('pelanggan', JSON.stringify(data));
      return data;
    } catch (error) {
      throw error;
    }
  },

  getProfile: async (): Promise<any> => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Token otentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`${API_URL}/pelanggan/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal memuat detail profil.');
      }

      const data = await response.json();
      localStorage.setItem('pelanggan', JSON.stringify(data));
      return data;
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profile: ProfilePayload): Promise<any> => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Token otentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`${API_URL}/pelanggan/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal memperbarui detail profil.');
      }

      const data = await response.json();
      localStorage.setItem('pelanggan', JSON.stringify(data));
      return data;
    } catch (error) {
      throw error;
    }
  },

  getMyTickets: async (bulan: number, tahun: number): Promise<any> => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Token otentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`${API_URL}/ticket/mine?bulan=${bulan}&tahun=${tahun}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal memuat daftar tiket Anda.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  getMyTicketNota: async (ticketId: string | number): Promise<{ blob: Blob; contentType: string }> => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Token otentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`${API_URL}/ticket/mine/${ticketId}/nota`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil nota tiket.');
      }

      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || "text/plain";
      return { blob, contentType };
    } catch (error) {
      throw error;
    }
  },

  cancelTicket: async (ticketId: string | number): Promise<any> => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Token otentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`${API_URL}/ticket/mine/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal membatalkan tiket.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  searchJadwal: async (asal: string, tujuan: string, kelas: string, tanggal: string): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/jadwal?asal=${asal}&tujuan=${tujuan}&kelas=${kelas}&tanggal=${tanggal}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mencari jadwal.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  getJadwalDetail: async (id: string | number): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/jadwal/${id}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal memuat detail jadwal.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  getGerbongs: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/gerbong`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal memuat daftar gerbong.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  getKursis: async (): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/kursi`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal memuat daftar kursi.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  bookTicket: async (bookingData: {
    jadwalId: number;
    penumpang: Array<{ NIK: string; nama_penumpang: string; kursiId: number }>;
  }): Promise<any> => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Token otentikasi tidak ditemukan. Silakan login kembali.');
      }

      const response = await fetch(`${API_URL}/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal memesan tiket.');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('pelanggan');
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },

  getUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getPelanggan: () => {
    if (typeof window === 'undefined') return null;
    const pelanggan = localStorage.getItem('pelanggan');
    return pelanggan ? JSON.parse(pelanggan) : null;
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('authToken');
  },
};
