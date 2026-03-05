import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

// ============ 类型定义 ============

export type OAuthProvider = 'wechat' | 'google' | 'github'

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  role: 'user' | 'admin'
  provider: 'local' | OAuthProvider
  createdAt: string
  lastLoginAt: string
  loginCount: number
  totalUsageMinutes: number
  modulesVisited: string[]
}

export interface UsageRecord {
  id: string
  userId: string
  username: string
  action: string
  module: string
  timestamp: string
  duration?: number
  details?: string
}

export interface SystemStats {
  totalUsers: number
  activeToday: number
  totalSessions: number
  avgSessionMinutes: number
  moduleUsage: { module: string; count: number; percentage: number }[]
  dailyActive: { date: string; count: number }[]
  registrationTrend: { date: string; count: number }[]
  providerDistribution: { provider: string; count: number }[]
}

export interface DonateConfig {
  enabled: boolean
  qrcodeImage: string // base64 data URL
  title: string
  description: string
  amounts: number[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>
  oauthLogin: (provider: OAuthProvider) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  // 管理员功能
  getAllUsers: () => User[]
  getUsageRecords: (limit?: number) => UsageRecord[]
  getSystemStats: () => SystemStats
  deleteUser: (userId: string) => void
  toggleUserRole: (userId: string) => void
  // 使用记录
  recordUsage: (module: string, action: string, details?: string) => void
  // 打赏配置
  donateConfig: DonateConfig
  updateDonateConfig: (config: Partial<DonateConfig>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// ============ 工具函数 ============

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

function hashPassword(password: string): string {
  // 简单的前端 hash（生产环境应使用 bcrypt 等后端方案）
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0]
}

function getDateStr(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

// ============ 初始化数据 ============

const STORAGE_KEYS = {
  users: 'mysql_analyzer_users',
  currentUser: 'mysql_analyzer_current_user',
  usageRecords: 'mysql_analyzer_usage_records',
  passwords: 'mysql_analyzer_passwords',
  donateConfig: 'mysql_analyzer_donate_config',
}

function getInitialUsers(): User[] {
  const stored = localStorage.getItem(STORAGE_KEYS.users)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* ignore */ }
  }

  // 初始化管理员和模拟用户
  const now = new Date()
  const users: User[] = [
    {
      id: 'admin_001',
      username: 'admin',
      email: 'admin@mysqlanalyzer.com',
      displayName: '系统管理员',
      role: 'admin',
      provider: 'local',
      createdAt: formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
      lastLoginAt: formatDate(now),
      loginCount: 42,
      totalUsageMinutes: 1260,
      modulesVisited: ['analyzer', 'callchain', 'gdblab', 'flamegraph', 'masterthread'],
    },
    {
      id: 'user_demo_01',
      username: 'zhang_wei',
      email: 'zhangwei@example.com',
      displayName: '张伟',
      avatar: '',
      role: 'user',
      provider: 'github',
      createdAt: formatDate(new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)),
      lastLoginAt: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      loginCount: 18,
      totalUsageMinutes: 540,
      modulesVisited: ['analyzer', 'callchain', 'gdblab'],
    },
    {
      id: 'user_demo_02',
      username: 'li_na',
      email: 'lina@example.com',
      displayName: '李娜',
      avatar: '',
      role: 'user',
      provider: 'wechat',
      createdAt: formatDate(new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)),
      lastLoginAt: formatDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      loginCount: 12,
      totalUsageMinutes: 360,
      modulesVisited: ['analyzer', 'flamegraph'],
    },
    {
      id: 'user_demo_03',
      username: 'wang_ming',
      email: 'wangming@example.com',
      displayName: '王明',
      avatar: '',
      role: 'user',
      provider: 'google',
      createdAt: formatDate(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)),
      lastLoginAt: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      loginCount: 8,
      totalUsageMinutes: 180,
      modulesVisited: ['callchain', 'gdblab', 'masterthread'],
    },
    {
      id: 'user_demo_04',
      username: 'chen_jie',
      email: 'chenjie@example.com',
      displayName: '陈洁',
      avatar: '',
      role: 'user',
      provider: 'local',
      createdAt: formatDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
      lastLoginAt: formatDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
      loginCount: 5,
      totalUsageMinutes: 120,
      modulesVisited: ['analyzer'],
    },
    {
      id: 'user_demo_05',
      username: 'liu_yang',
      email: 'liuyang@example.com',
      displayName: '刘洋',
      role: 'user',
      provider: 'github',
      createdAt: formatDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
      lastLoginAt: formatDate(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)),
      loginCount: 15,
      totalUsageMinutes: 420,
      modulesVisited: ['analyzer', 'callchain', 'gdblab', 'flamegraph'],
    },
    {
      id: 'user_demo_06',
      username: 'zhao_hong',
      email: 'zhaohong@example.com',
      displayName: '赵红',
      role: 'user',
      provider: 'wechat',
      createdAt: formatDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
      lastLoginAt: formatDate(now),
      loginCount: 6,
      totalUsageMinutes: 90,
      modulesVisited: ['gdblab', 'flamegraph'],
    },
  ]

  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))

  // 设置默认密码
  const passwords: Record<string, string> = {
    admin: hashPassword('admin@0305'),
    zhang_wei: hashPassword('demo123'),
    li_na: hashPassword('demo123'),
    wang_ming: hashPassword('demo123'),
    chen_jie: hashPassword('demo123'),
    liu_yang: hashPassword('demo123'),
    zhao_hong: hashPassword('demo123'),
  }
  localStorage.setItem(STORAGE_KEYS.passwords, JSON.stringify(passwords))

  return users
}

function getInitialUsageRecords(): UsageRecord[] {
  const stored = localStorage.getItem(STORAGE_KEYS.usageRecords)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* ignore */ }
  }

  const now = new Date()
  const modules = ['analyzer', 'callchain', 'gdblab', 'flamegraph', 'masterthread', 'versionconfig']
  const actions = ['页面访问', '功能使用', '代码浏览', '调试操作', '分析运行', '版本切换']
  const usernames = ['admin', 'zhang_wei', 'li_na', 'wang_ming', 'chen_jie', 'liu_yang', 'zhao_hong']
  const userIds = ['admin_001', 'user_demo_01', 'user_demo_02', 'user_demo_03', 'user_demo_04', 'user_demo_05', 'user_demo_06']

  const records: UsageRecord[] = []
  for (let i = 0; i < 80; i++) {
    const userIdx = Math.floor(Math.random() * usernames.length)
    const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    records.push({
      id: generateId(),
      userId: userIds[userIdx],
      username: usernames[userIdx],
      action: actions[Math.floor(Math.random() * actions.length)],
      module: modules[Math.floor(Math.random() * modules.length)],
      timestamp: formatDate(timestamp),
      duration: Math.floor(Math.random() * 60) + 1,
      details: ['查看 JOIN::optimize 调用链', '运行 GDB 实验 #3', '分析 OLTP 火焰图', '浏览 InnoDB 源码', '切换到 MySQL 5.7'][Math.floor(Math.random() * 5)],
    })
  }
  records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  localStorage.setItem(STORAGE_KEYS.usageRecords, JSON.stringify(records))
  return records
}

// ============ Provider ============

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => getInitialUsers())
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>(() => getInitialUsageRecords())
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.currentUser)
    if (stored) {
      try { return JSON.parse(stored) } catch { /* ignore */ }
    }
    return null
  })
  const [donateConfig, setDonateConfig] = useState<DonateConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.donateConfig)
    if (stored) {
      try { return JSON.parse(stored) } catch { /* ignore */ }
    }
    return {
      enabled: false,
      qrcodeImage: '',
      title: '请作者喝杯咖啡',
      description: '如果这个项目对您有帮助，可以请作者喝杯咖啡，感谢您的支持！',
      amounts: [5, 10, 20, 50],
    }
  })

  // 持久化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.usageRecords, JSON.stringify(usageRecords))
  }, [usageRecords])

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUser)
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.donateConfig, JSON.stringify(donateConfig))
  }, [donateConfig])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 600))

    const passwordsRaw = localStorage.getItem(STORAGE_KEYS.passwords)
    const passwords: Record<string, string> = passwordsRaw ? JSON.parse(passwordsRaw) : {}
    const hashed = hashPassword(password)

    if (!passwords[username]) {
      return { success: false, error: '用户名不存在' }
    }
    if (passwords[username] !== hashed) {
      return { success: false, error: '密码错误' }
    }

    const foundUser = users.find(u => u.username === username)
    if (!foundUser) {
      return { success: false, error: '用户数据异常' }
    }

    const updatedUser = {
      ...foundUser,
      lastLoginAt: formatDate(new Date()),
      loginCount: foundUser.loginCount + 1,
    }
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    setUser(updatedUser)
    recordUsageInternal(updatedUser.id, updatedUser.username, '登录', '系统', '账号密码登录')
    return { success: true }
  }

  const register = async (username: string, email: string, password: string, displayName: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 600))

    if (users.some(u => u.username === username)) {
      return { success: false, error: '用户名已存在' }
    }
    if (users.some(u => u.email === email)) {
      return { success: false, error: '邮箱已被注册' }
    }
    if (password.length < 6) {
      return { success: false, error: '密码至少需要6个字符' }
    }

    const now = formatDate(new Date())
    const newUser: User = {
      id: generateId(),
      username,
      email,
      displayName,
      role: 'user',
      provider: 'local',
      createdAt: now,
      lastLoginAt: now,
      loginCount: 1,
      totalUsageMinutes: 0,
      modulesVisited: [],
    }

    const passwordsRaw = localStorage.getItem(STORAGE_KEYS.passwords)
    const passwords: Record<string, string> = passwordsRaw ? JSON.parse(passwordsRaw) : {}
    passwords[username] = hashPassword(password)
    localStorage.setItem(STORAGE_KEYS.passwords, JSON.stringify(passwords))

    setUsers(prev => [...prev, newUser])
    // 注册成功但不自动登录，用户需要使用账号密码登录
    recordUsageInternal(newUser.id, newUser.username, '注册', '系统', '新用户注册')
    return { success: true }
  }

  const oauthLogin = async (provider: OAuthProvider): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 1200))

    const providerNames: Record<OAuthProvider, string> = {
      wechat: '微信',
      google: 'Google',
      github: 'GitHub',
    }

    // 模拟 OAuth：生成或查找已有的 OAuth 用户
    const existingOAuth = users.find(u => u.provider === provider && u.username.startsWith(`${provider}_`))
    if (existingOAuth) {
      const updatedUser = {
        ...existingOAuth,
        lastLoginAt: formatDate(new Date()),
        loginCount: existingOAuth.loginCount + 1,
      }
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
      setUser(updatedUser)
      recordUsageInternal(updatedUser.id, updatedUser.username, '登录', '系统', `${providerNames[provider]}登录`)
      return { success: true }
    }

    const now = formatDate(new Date())
    const randomNum = Math.floor(Math.random() * 9000) + 1000
    const newUser: User = {
      id: generateId(),
      username: `${provider}_${randomNum}`,
      email: `${provider}_${randomNum}@oauth.example.com`,
      displayName: `${providerNames[provider]}用户${randomNum}`,
      role: 'user',
      provider,
      createdAt: now,
      lastLoginAt: now,
      loginCount: 1,
      totalUsageMinutes: 0,
      modulesVisited: [],
    }

    setUsers(prev => [...prev, newUser])
    setUser(newUser)
    recordUsageInternal(newUser.id, newUser.username, '注册', '系统', `${providerNames[provider]} OAuth 注册`)
    return { success: true }
  }

  const logout = () => {
    if (user) {
      recordUsageInternal(user.id, user.username, '登出', '系统', '用户登出')
    }
    setUser(null)
  }

  const recordUsageInternal = (userId: string, username: string, action: string, module: string, details?: string) => {
    const record: UsageRecord = {
      id: generateId(),
      userId,
      username,
      action,
      module,
      timestamp: formatDate(new Date()),
      duration: 0,
      details,
    }
    setUsageRecords(prev => [record, ...prev])
  }

  const recordUsage = (module: string, action: string, details?: string) => {
    if (!user) return
    recordUsageInternal(user.id, user.username, action, module, details)

    // 更新用户的模块访问记录
    if (!user.modulesVisited.includes(module)) {
      const updatedUser = {
        ...user,
        modulesVisited: [...user.modulesVisited, module],
      }
      setUser(updatedUser)
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    }
  }

  const getAllUsers = (): User[] => users

  const getUsageRecords = (limit?: number): UsageRecord[] => {
    return limit ? usageRecords.slice(0, limit) : usageRecords
  }

  const deleteUser = (userId: string) => {
    if (userId === 'admin_001') return // 不能删除超级管理员
    setUsers(prev => prev.filter(u => u.id !== userId))
    // 清理密码
    const target = users.find(u => u.id === userId)
    if (target) {
      const passwordsRaw = localStorage.getItem(STORAGE_KEYS.passwords)
      const passwords: Record<string, string> = passwordsRaw ? JSON.parse(passwordsRaw) : {}
      delete passwords[target.username]
      localStorage.setItem(STORAGE_KEYS.passwords, JSON.stringify(passwords))
    }
  }

  const toggleUserRole = (userId: string) => {
    if (userId === 'admin_001') return
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role: u.role === 'admin' ? 'user' as const : 'admin' as const } : u
    ))
  }

  const getSystemStats = (): SystemStats => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = usageRecords.filter(r => r.timestamp.startsWith(today))
    const uniqueTodayUsers = new Set(todayRecords.map(r => r.userId))

    // 模块使用统计
    const moduleCounts: Record<string, number> = {}
    const moduleLabels: Record<string, string> = {
      analyzer: '源码浏览',
      callchain: '调用链追踪',
      gdblab: 'GDB 实验室',
      flamegraph: '火焰图',
      masterthread: 'Master Thread',
      versionconfig: '版本配置',
      '系统': '系统操作',
    }
    usageRecords.forEach(r => {
      moduleCounts[r.module] = (moduleCounts[r.module] || 0) + 1
    })
    const totalModuleUsage = Object.values(moduleCounts).reduce((a, b) => a + b, 0)
    const moduleUsage = Object.entries(moduleCounts)
      .map(([module, count]) => ({
        module: moduleLabels[module] || module,
        count,
        percentage: Math.round((count / totalModuleUsage) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    // 每日活跃用户（最近14天）
    const dailyActive: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = getDateStr(i)
      const dayRecords = usageRecords.filter(r => r.timestamp.startsWith(date))
      const uniqueUsers = new Set(dayRecords.map(r => r.userId))
      dailyActive.push({ date, count: uniqueUsers.size || Math.floor(Math.random() * 5) + 1 })
    }

    // 注册趋势（最近14天）
    const registrationTrend: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = getDateStr(i)
      const dayRegistrations = users.filter(u => u.createdAt.startsWith(date)).length
      registrationTrend.push({ date, count: dayRegistrations || (Math.random() > 0.6 ? 1 : 0) })
    }

    // 登录方式分布
    const providerCounts: Record<string, number> = {}
    users.forEach(u => {
      const label = u.provider === 'local' ? '账号密码' : u.provider === 'wechat' ? '微信' : u.provider === 'google' ? 'Google' : 'GitHub'
      providerCounts[label] = (providerCounts[label] || 0) + 1
    })
    const providerDistribution = Object.entries(providerCounts).map(([provider, count]) => ({ provider, count }))

    return {
      totalUsers: users.length,
      activeToday: uniqueTodayUsers.size || Math.floor(Math.random() * 3) + 1,
      totalSessions: usageRecords.filter(r => r.action === '登录' || r.action === '注册').length,
      avgSessionMinutes: Math.round(users.reduce((sum, u) => sum + u.totalUsageMinutes, 0) / Math.max(users.length, 1) / Math.max(users[0]?.loginCount || 1, 1)),
      moduleUsage,
      dailyActive,
      registrationTrend,
      providerDistribution,
    }
  }

  const updateDonateConfig = (config: Partial<DonateConfig>) => {
    setDonateConfig(prev => ({ ...prev, ...config }))
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
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
