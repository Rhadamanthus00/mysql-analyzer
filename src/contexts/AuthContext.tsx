import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  authApi, adminApi, donateApi, usageApi,
  type UserData, type DonateConfigData, type UsageRecordData, type SystemStatsData,
} from '@/lib/api'

// ============ 类型定义 ============

export type OAuthProvider = 'wechat' | 'google' | 'github'

export type User = UserData

export type UsageRecord = UsageRecordData

export type SystemStats = SystemStatsData

export type DonateConfig = DonateConfigData

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>
  oauthLogin: (provider: OAuthProvider) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  // 管理员功能
  getAllUsers: () => Promise<User[]>
  getUsageRecords: (limit?: number) => Promise<UsageRecord[]>
  getSystemStats: () => Promise<SystemStats>
  deleteUser: (userId: string) => Promise<void>
  toggleUserRole: (userId: string) => Promise<string>
  // 使用记录
  recordUsage: (module: string, action: string, details?: string) => void
  // 打赏配置
  donateConfig: DonateConfig
  updateDonateConfig: (config: Partial<DonateConfig>) => Promise<void>
  uploadQrcode: (file: File) => Promise<string>
  deleteQrcode: () => Promise<void>
  refreshDonateConfig: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// ============ Provider ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [donateConfig, setDonateConfig] = useState<DonateConfig>({
    enabled: false,
    qrcodeImage: '',
    title: '请作者喝杯咖啡',
    description: '如果这个项目对您有帮助，可以请作者喝杯咖啡，感谢您的支持！',
    amounts: [5, 10, 20, 50],
  })

  // On mount: check token and fetch user + donate config
  useEffect(() => {
    const init = async () => {
      // Always fetch donate config (public)
      try {
        const config = await donateApi.getConfig()
        setDonateConfig(config)
      } catch { /* ignore */ }

      // Check existing token
      if (authApi.hasToken()) {
        const result = await authApi.getMe()
        if (result?.user) {
          setUser(result.user)
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await authApi.login(username, password)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return { success: result.success, error: result.error }
  }

  const register = async (username: string, email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    return await authApi.register(username, email, password, displayName)
  }

  const oauthLogin = async (provider: OAuthProvider): Promise<{ success: boolean; error?: string }> => {
    const result = await authApi.oauthLogin(provider)
    if (result.success && result.user) {
      setUser(result.user)
    }
    return { success: result.success, error: result.error }
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
  }

  const recordUsage = (module: string, action: string, details?: string) => {
    if (!user) return
    usageApi.record(module, action, details)
  }

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    return await adminApi.getUsers()
  }, [])

  const getUsageRecords = useCallback(async (limit?: number): Promise<UsageRecord[]> => {
    return await adminApi.getUsageRecords(limit)
  }, [])

  const getSystemStats = useCallback(async (): Promise<SystemStats> => {
    return await adminApi.getStats()
  }, [])

  const deleteUser = async (userId: string): Promise<void> => {
    await adminApi.deleteUser(userId)
  }

  const toggleUserRole = async (userId: string): Promise<string> => {
    return await adminApi.toggleUserRole(userId)
  }

  const updateDonateConfig = async (config: Partial<DonateConfig>): Promise<void> => {
    const updated = await donateApi.updateConfig(config)
    setDonateConfig(updated)
  }

  const uploadQrcode = async (file: File): Promise<string> => {
    const result = await donateApi.uploadQrcode(file)
    setDonateConfig(prev => ({ ...prev, qrcodeImage: result.qrcodeImage }))
    return result.qrcodeImage
  }

  const deleteQrcode = async (): Promise<void> => {
    await donateApi.deleteQrcode()
    setDonateConfig(prev => ({ ...prev, qrcodeImage: '' }))
  }

  const refreshDonateConfig = async (): Promise<void> => {
    try {
      const config = await donateApi.getConfig()
      setDonateConfig(config)
    } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      loading,
      login,
      register,
      oauthLogin,
      logout,
      getAllUsers,
      getUsageRecords,
      getSystemStats,
      deleteUser,
      toggleUserRole,
      recordUsage,
      donateConfig,
      updateDonateConfig,
      uploadQrcode,
      deleteQrcode,
      refreshDonateConfig,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
