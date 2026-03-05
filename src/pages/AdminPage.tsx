import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/contexts/AuthContext'
import type { User, UsageRecord, SystemStats } from '@/contexts/AuthContext'
import {
  ArrowLeft, Users, Activity, BarChart3, Shield, Trash2,
  Search, UserCog, Clock, TrendingUp, Eye, LogOut,
  Database, FileText, Monitor, Globe,
  AlertTriangle, Heart, Upload, ImageIcon, X, Check,
  ToggleLeft, ToggleRight
} from 'lucide-react'
import type { Route } from '@/App'

interface AdminPageProps {
  onNavigate: (route: Route) => void
}

type AdminTab = 'overview' | 'users' | 'analytics' | 'logs' | 'donate'

function WechatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/>
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function ProviderIcon({ provider, className }: { provider: string; className?: string }) {
  switch (provider) {
    case 'wechat': return <WechatIcon className={className} />
    case 'google': return <GoogleIcon className={className} />
    case 'github': return <GitHubIcon className={className} />
    default: return <Users className={className} />
  }
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { user, isAdmin, logout, donateConfig, loadFullDonateConfig, updateDonateConfig, uploadQrcode, deleteQrcode, getAllUsers, getUsageRecords, getSystemStats, deleteUser, toggleUserRole } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [donateTitle, setDonateTitle] = useState(donateConfig.title)
  const [donateDesc, setDonateDesc] = useState(donateConfig.description)
  const [donateSaved, setDonateSaved] = useState(false)

  // Async data states
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) return
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const [users, records, statsData] = await Promise.all([
          getAllUsers(),
          getUsageRecords(100),
          getSystemStats(),
        ])
        setAllUsers(users)
        setUsageRecords(records)
        setStats(statsData)
      } catch (e) {
        console.error('Failed to load admin data:', e)
      }
      setDataLoading(false)
    }
    fetchData()
  }, [isAdmin, getAllUsers, getUsageRecords, getSystemStats])

  // Sync donate config changes
  useEffect(() => {
    setDonateTitle(donateConfig.title)
    setDonateDesc(donateConfig.description)
  }, [donateConfig.title, donateConfig.description])

  // Load full donate config (with qrcode image) when switching to donate tab
  useEffect(() => {
    if (activeTab === 'donate') {
      loadFullDonateConfig()
    }
  }, [activeTab])

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/80 border-slate-800 max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">权限不足</h2>
            <p className="text-slate-400 mb-6">您没有管理员权限，无法访问此页面</p>
            <Button onClick={() => onNavigate('landing')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (dataLoading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">加载中...</div>
      </div>
    )
  }

  const filteredUsers = allUsers.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: '数据概览', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: '用户管理', icon: <Users className="w-4 h-4" /> },
    { id: 'analytics', label: '使用分析', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'logs', label: '操作日志', icon: <FileText className="w-4 h-4" /> },
    { id: 'donate', label: '打赏设置', icon: <Heart className="w-4 h-4" /> },
  ]

  const providerLabel = (p: string) => {
    switch (p) {
      case 'local': return '账号密码'
      case 'wechat': return '微信'
      case 'google': return 'Google'
      case 'github': return 'GitHub'
      default: return p
    }
  }

  const providerColor = (p: string) => {
    switch (p) {
      case 'wechat': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'google': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'github': return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
      default: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId)
      setAllUsers(prev => prev.filter(u => u.id !== userId))
      setDeleteConfirm(null)
    } catch (e) {
      console.error('Delete user failed:', e)
    }
  }

  const handleToggleRole = async (userId: string) => {
    try {
      const newRole = await toggleUserRole(userId)
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u))
    } catch (e) {
      console.error('Toggle role failed:', e)
    }
  }

  const handleQrcodeUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过 2MB')
      return
    }
    try {
      await uploadQrcode(file)
    } catch (e: any) {
      alert(e.message || '上传失败')
    }
  }

  const BarChart = ({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue: number }) => (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-20 text-right flex-shrink-0 truncate">{item.label}</span>
          <div className="flex-1 h-6 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${item.color || 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
              style={{ width: `${Math.max((item.value / maxValue) * 100, 2)}%` }}
            />
          </div>
          <span className="text-xs text-slate-300 w-8 text-right flex-shrink-0">{item.value}</span>
        </div>
      ))}
    </div>
  )

  const SparkLine = ({ data, color = 'bg-blue-500' }: { data: number[]; color?: string }) => {
    const max = Math.max(...data, 1)
    return (
      <div className="flex items-end gap-[2px] h-12">
        {data.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-sm ${color} opacity-70 hover:opacity-100 transition-opacity`}
            style={{ height: `${Math.max((v / max) * 100, 4)}%` }}
            title={`${v}`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('landing')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">返回前台</span>
            </button>
            <Separator orientation="vertical" className="h-6 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="font-semibold">管理后台</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-[10px] font-bold">
                {user?.displayName?.[0] || 'A'}
              </div>
              <span className="text-sm text-slate-300">{user?.displayName}</span>
              <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">管理员</Badge>
            </div>
            <button onClick={() => { logout(); onNavigate('landing') }} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all" title="退出登录">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Tab Nav */}
        <div className="flex gap-1 mb-6 p-1 bg-slate-800/40 rounded-xl w-fit border border-slate-700/30">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== Overview ===== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Users className="w-5 h-5 text-blue-400" />, bg: 'bg-blue-500/20', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', badgeText: '总计', value: stats.totalUsers, label: '注册用户' },
                { icon: <Activity className="w-5 h-5 text-green-400" />, bg: 'bg-green-500/20', badge: 'bg-green-500/10 text-green-400 border-green-500/20', badgeText: '今日', value: stats.activeToday, label: '活跃用户' },
                { icon: <Monitor className="w-5 h-5 text-amber-400" />, bg: 'bg-amber-500/20', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', badgeText: '累计', value: stats.totalSessions, label: '登录会话' },
                { icon: <Clock className="w-5 h-5 text-violet-400" />, bg: 'bg-violet-500/20', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20', badgeText: '平均', value: `${stats.avgSessionMinutes}`, label: '会话时长(min)' },
              ].map((s, i) => (
                <Card key={i} className="bg-slate-900/50 border-slate-800">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                      <Badge className={`${s.badge} text-[10px]`}>{s.badgeText}</Badge>
                    </div>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-400" />每日活跃用户（近14天）</CardTitle></CardHeader>
                <CardContent>
                  <SparkLine data={stats.dailyActive.map(d => d.count)} color="bg-blue-500" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-600">{stats.dailyActive[0]?.date.slice(5)}</span>
                    <span className="text-[10px] text-slate-600">{stats.dailyActive[stats.dailyActive.length - 1]?.date.slice(5)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-green-400" />新用户注册（近14天）</CardTitle></CardHeader>
                <CardContent>
                  <SparkLine data={stats.registrationTrend.map(d => d.count)} color="bg-green-500" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-600">{stats.registrationTrend[0]?.date.slice(5)}</span>
                    <span className="text-[10px] text-slate-600">{stats.registrationTrend[stats.registrationTrend.length - 1]?.date.slice(5)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-400" />模块使用频次</CardTitle></CardHeader>
                <CardContent>
                  <BarChart
                    data={stats.moduleUsage.slice(0, 6).map((m, i) => ({
                      label: m.module, value: m.count,
                      color: ['bg-gradient-to-r from-blue-500 to-cyan-500','bg-gradient-to-r from-amber-500 to-orange-500','bg-gradient-to-r from-green-500 to-emerald-500','bg-gradient-to-r from-red-500 to-pink-500','bg-gradient-to-r from-violet-500 to-purple-500','bg-gradient-to-r from-slate-500 to-slate-400'][i] || 'bg-blue-500',
                    }))}
                    maxValue={Math.max(...stats.moduleUsage.map(m => m.count), 1)}
                  />
                </CardContent>
              </Card>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-violet-400" />登录方式分布</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.providerDistribution.map((p, i) => {
                      const total = stats.providerDistribution.reduce((sum, x) => sum + x.count, 0)
                      const pct = Math.round((p.count / total) * 100)
                      const colors = ['from-cyan-500 to-blue-500','from-green-500 to-emerald-500','from-blue-400 to-indigo-500','from-slate-400 to-slate-500']
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <ProviderIcon provider={p.provider === '账号密码' ? 'local' : p.provider === '微信' ? 'wechat' : p.provider === 'Google' ? 'google' : 'github'} className="w-4 h-4" />
                              <span className="text-sm text-slate-300">{p.provider}</span>
                            </div>
                            <span className="text-sm text-slate-400">{p.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ===== Users ===== */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input placeholder="搜索用户名、名称、邮箱..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600" />
              </div>
              <Badge className="bg-slate-800 text-slate-300 border-slate-700">共 {filteredUsers.length} 个用户</Badge>
            </div>
            <div className="space-y-2">
              {filteredUsers.map(u => (
                <Card key={u.id} className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${u.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'}`}>
                        {u.displayName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{u.displayName}</span>
                          <span className="text-xs text-slate-500">@{u.username}</span>
                          {u.role === 'admin' && <Badge className="text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">管理员</Badge>}
                          <Badge className={`text-[10px] ${providerColor(u.provider)}`}>{providerLabel(u.provider)}</Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          <span>{u.email}</span>
                          <span>登录 {u.loginCount} 次</span>
                          <span>使用 {u.totalUsageMinutes} 分钟</span>
                          <span>最后登录: {u.lastLoginAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {u.id !== 'admin_001' && (
                          <>
                            <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-8" onClick={() => handleToggleRole(u.id)}>
                              <UserCog className="w-3 h-3 mr-1" />
                              {u.role === 'admin' ? '降为普通' : '设为管理'}
                            </Button>
                            {deleteConfirm === u.id ? (
                              <div className="flex items-center gap-1">
                                <Button variant="destructive" size="sm" className="text-xs h-8" onClick={() => handleDeleteUser(u.id)}>确认删除</Button>
                                <Button variant="outline" size="sm" className="border-slate-700 text-xs h-8" onClick={() => setDeleteConfirm(null)}>取消</Button>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" className="border-red-800/50 text-red-400 hover:bg-red-500/10 text-xs h-8" onClick={() => setDeleteConfirm(u.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </>
                        )}
                        {u.id === 'admin_001' && <Badge className="text-[10px] bg-slate-800 text-slate-500 border-slate-700">超级管理员</Badge>}
                      </div>
                    </div>
                    {u.modulesVisited.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 ml-14">
                        <Eye className="w-3 h-3 text-slate-600" />
                        {u.modulesVisited.map(m => (
                          <Badge key={m} variant="outline" className="text-[10px] border-slate-700 text-slate-500 py-0">{m}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== Analytics ===== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" />模块使用详情</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {stats.moduleUsage.map((m, i) => {
                    const colors = ['from-blue-500 to-cyan-500','from-amber-500 to-orange-500','from-green-500 to-emerald-500','from-red-500 to-pink-500','from-violet-500 to-purple-500','from-slate-400 to-slate-500']
                    return (
                      <div key={i} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-300">{m.module}</span>
                          <span className="text-lg font-bold text-white">{m.count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]}`} style={{ width: `${m.percentage}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">{m.percentage}% 的使用占比</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-400" />用户活跃度排名</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...allUsers].sort((a, b) => b.totalUsageMinutes - a.totalUsageMinutes).slice(0, 10).map((u, i) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/30 text-amber-300' : i === 1 ? 'bg-slate-400/30 text-slate-300' : i === 2 ? 'bg-orange-500/30 text-orange-300' : 'bg-slate-800 text-slate-500'}`}>{i + 1}</span>
                      <span className="text-sm text-white w-24 truncate">{u.displayName}</span>
                      <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${(u.totalUsageMinutes / Math.max(allUsers[0]?.totalUsageMinutes || 1, 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-20 text-right">{u.totalUsageMinutes} 分钟</span>
                      <span className="text-xs text-slate-500 w-16 text-right">{u.loginCount} 次</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== Logs ===== */}
        {activeTab === 'logs' && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-green-400" />操作日志（最近 100 条）</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                {usageRecords.slice(0, 100).map(record => (
                  <div key={record.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/40 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${record.action === '登录' ? 'bg-green-500' : record.action === '注册' ? 'bg-blue-500' : record.action === '登出' ? 'bg-slate-500' : 'bg-amber-500'}`} />
                    <span className="text-xs text-slate-400 w-36 flex-shrink-0">{record.timestamp}</span>
                    <span className="text-xs text-cyan-400 w-20 flex-shrink-0 font-mono">@{record.username}</span>
                    <Badge variant="outline" className={`text-[10px] w-16 justify-center flex-shrink-0 ${record.action === '登录' ? 'border-green-500/30 text-green-400' : record.action === '注册' ? 'border-blue-500/30 text-blue-400' : record.action === '登出' ? 'border-slate-500/30 text-slate-400' : 'border-amber-500/30 text-amber-400'}`}>{record.action}</Badge>
                    <span className="text-xs text-slate-500 w-20 flex-shrink-0">{record.module}</span>
                    <span className="text-xs text-slate-400 truncate">{record.details}</span>
                    {record.duration ? <span className="text-[10px] text-slate-600 flex-shrink-0 ml-auto">{record.duration}min</span> : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== Donate Settings ===== */}
        {activeTab === 'donate' && (
          <div className="space-y-6 max-w-2xl">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center"><Heart className="w-5 h-5 text-pink-400" /></div>
                    <div>
                      <div className="font-medium text-white">打赏功能</div>
                      <div className="text-xs text-slate-400 mt-0.5">{donateConfig.enabled ? '已开启 - 用户可在页面看到打赏入口' : '已关闭 - 打赏入口不会显示'}</div>
                    </div>
                  </div>
                  <button onClick={() => updateDonateConfig({ enabled: !donateConfig.enabled })}>
                    {donateConfig.enabled ? <ToggleRight className="w-10 h-10 text-pink-400" /> : <ToggleLeft className="w-10 h-10 text-slate-600" />}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4 text-green-400" />微信收款码</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleQrcodeUpload(file)
                  e.target.value = ''
                }} />
                {donateConfig.qrcodeImage ? (
                  <div className="space-y-3">
                    <div className="relative inline-block">
                      <img src={donateConfig.qrcodeImage} alt="收款码" className="w-48 h-48 object-contain rounded-xl border border-slate-700 bg-white p-2" />
                      <button onClick={() => deleteQrcode()} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 hover:text-white" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-1.5" />更换收款码
                    </Button>
                  </div>
                ) : (
                  <div onClick={() => fileInputRef.current?.click()} className="w-48 h-48 rounded-xl border-2 border-dashed border-slate-700 hover:border-green-500/50 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-lg bg-slate-800 group-hover:bg-green-500/10 flex items-center justify-center transition-colors">
                      <Upload className="w-6 h-6 text-slate-500 group-hover:text-green-400 transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">上传收款码</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">支持 JPG/PNG，最大 2MB</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" />打赏文案</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">标题</Label>
                  <Input value={donateTitle} onChange={e => { setDonateTitle(e.target.value); setDonateSaved(false) }} placeholder="如：请作者喝杯咖啡" className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 text-xs">描述</Label>
                  <textarea value={donateDesc} onChange={e => { setDonateDesc(e.target.value); setDonateSaved(false) }} placeholder="感谢支持的文案..." rows={3} className="w-full rounded-md bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-600 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white" onClick={async () => {
                    await updateDonateConfig({ title: donateTitle, description: donateDesc })
                    setDonateSaved(true)
                    setTimeout(() => setDonateSaved(false), 2000)
                  }}>
                    {donateSaved ? <><Check className="w-4 h-4 mr-1.5" />已保存</> : <>保存文案</>}
                  </Button>
                  {donateSaved && <span className="text-xs text-green-400">设置已保存</span>}
                </div>
              </CardContent>
            </Card>

            {donateConfig.enabled && donateConfig.qrcodeImage && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" />效果预览</CardTitle></CardHeader>
                <CardContent>
                  <div className="max-w-xs mx-auto bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto"><Heart className="w-6 h-6 text-white" /></div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{donateConfig.title}</h4>
                      <p className="text-sm text-slate-400 mt-1">{donateConfig.description}</p>
                    </div>
                    <img src={donateConfig.qrcodeImage} alt="收款码预览" className="w-40 h-40 object-contain mx-auto rounded-xl bg-white p-2" />
                    <p className="text-[11px] text-slate-500">微信扫一扫，感谢您的支持</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
