const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('mysql_analyzer_token');
}

function setToken(token: string): void {
  localStorage.setItem('mysql_analyzer_token', token);
}

function removeToken(): void {
  localStorage.removeItem('mysql_analyzer_token');
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络后重试');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(path: string, options: RequestInit = {}, retries = 1): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}${path}`, {
        ...options,
        headers,
        // 手机微信浏览器需要显式设置 mode 和 credentials
        mode: 'cors' as RequestMode,
      }, 15000);

      if (res.status === 401) {
        removeToken();
        throw new Error('登录已过期，请重新登录');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '请求失败');
      }
      return data;
    } catch (err: any) {
      lastError = err;
      // 不重试认证错误和业务错误
      if (err.message === '登录已过期，请重新登录' || (err.message && !err.message.includes('超时') && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('network'))) {
        throw err;
      }
      // 最后一次尝试也失败了
      if (attempt === retries) {
        throw err;
      }
      // 等待后重试
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError || new Error('请求失败');
}

// ============ Auth API ============

export interface UserData {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: 'user' | 'admin';
  provider: 'local' | 'wechat' | 'google' | 'github';
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
  totalUsageMinutes: number;
  modulesVisited: string[];
}

export interface DonateConfigData {
  enabled: boolean;
  qrcodeImage: string;
  title: string;
  description: string;
  amounts: number[];
}

export interface UsageRecordData {
  id: string;
  user_id: string;
  username: string;
  action: string;
  module: string;
  timestamp: string;
  duration?: number;
  details?: string;
}

export interface SystemStatsData {
  totalUsers: number;
  activeToday: number;
  totalSessions: number;
  avgSessionMinutes: number;
  moduleUsage: { module: string; count: number; percentage: number }[];
  dailyActive: { date: string; count: number }[];
  registrationTrend: { date: string; count: number }[];
  providerDistribution: { provider: string; count: number }[];
}

export const authApi = {
  async login(username: string, password: string): Promise<{ success: boolean; user?: UserData; token?: string; requirePasswordChange?: boolean; error?: string }> {
    try {
      const data = await request<{ success: boolean; user: UserData; token: string; requirePasswordChange?: boolean }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data.token) setToken(data.token);
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async changePassword(currentPassword: string | undefined, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await request('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async register(username: string, email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, displayName }),
      });
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async oauthLogin(provider: string): Promise<{ success: boolean; user?: UserData; token?: string; error?: string }> {
    try {
      const data = await request<{ success: boolean; user: UserData; token: string }>('/api/auth/oauth', {
        method: 'POST',
        body: JSON.stringify({ provider }),
      }, 2); // 重试2次，共3次尝试，应对手机微信浏览器网络不稳定
      if (data.token) setToken(data.token);
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  async getMe(): Promise<{ user: UserData; requirePasswordChange?: boolean } | null> {
    try {
      return await request('/api/auth/me');
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    removeToken();
  },

  hasToken(): boolean {
    return !!getToken();
  },
};

export const adminApi = {
  async getUsers(): Promise<UserData[]> {
    const data = await request<{ users: UserData[] }>('/api/admin/users');
    return data.users;
  },

  async deleteUser(userId: string): Promise<void> {
    await request(`/api/admin/users/${userId}`, { method: 'DELETE' });
  },

  async toggleUserRole(userId: string): Promise<string> {
    const data = await request<{ newRole: string }>(`/api/admin/users/${userId}/role`, { method: 'PUT' });
    return data.newRole;
  },

  async getUsageRecords(limit = 100): Promise<UsageRecordData[]> {
    const data = await request<{ records: UsageRecordData[] }>(`/api/admin/usage-records?limit=${limit}`);
    return data.records;
  },

  async getStats(): Promise<SystemStatsData> {
    return await request('/api/admin/stats');
  },
};

export const donateApi = {
  async getConfig(): Promise<DonateConfigData> {
    return await request('/api/donate/config');
  },

  async getFullConfig(): Promise<DonateConfigData> {
    return await request('/api/donate/config?full=1');
  },

  async updateConfig(config: Partial<DonateConfigData>): Promise<DonateConfigData> {
    return await request('/api/donate/config?full=1', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  async uploadQrcode(file: File): Promise<{ qrcodeImage: string }> {
    const token = getToken();
    const formData = new FormData();
    formData.append('qrcode', file);
    const res = await fetch(`${API_BASE}/api/donate/qrcode`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '上传失败');
    }
    return await res.json();
  },

  async deleteQrcode(): Promise<void> {
    await request('/api/donate/qrcode', { method: 'DELETE' });
  },
};

export const usageApi = {
  async record(module: string, action: string, details?: string): Promise<void> {
    try {
      await request('/api/usage/record', {
        method: 'POST',
        body: JSON.stringify({ module, action, details }),
      });
    } catch { /* ignore usage recording errors */ }
  },
};
