import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuth, type OAuthProvider } from '@/contexts/AuthContext'
import {
  Database, Eye, EyeOff, ArrowLeft, Loader2,
  Lock, Mail, User, UserPlus, LogIn, ChevronRight,
  CheckCircle2, X, ExternalLink, ShieldCheck
} from 'lucide-react'
import type { Route } from '@/App'

interface AuthPageProps {
  onNavigate: (route: Route) => void
}

// 微信 SVG Icon
function WechatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18z"/>
    </svg>
  )
}

// Google SVG Icon
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

// GitHub SVG Icon
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

// OAuth 授权窗口配置
const oauthConfigs: Record<OAuthProvider, {
  name: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  authUrl: string
  scopes: string[]
  description: string
}> = {
  wechat: {
    name: '微信',
    color: 'text-green-400',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500/30',
    icon: <WechatIcon className="w-8 h-8 text-green-400" />,
    authUrl: 'open.weixin.qq.com',
    scopes: ['snsapi_userinfo', 'snsapi_login'],
    description: '微信开放平台将获取您的公开信息（昵称、头像）',
  },
  google: {
    name: 'Google',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500/30',
    icon: <GoogleIcon className="w-8 h-8" />,
    authUrl: 'accounts.google.com',
    scopes: ['openid', 'profile', 'email'],
    description: 'Google 将共享您的基本个人资料信息和电子邮件地址',
  },
  github: {
    name: 'GitHub',
    color: 'text-slate-300',
    bgColor: 'bg-slate-600',
    borderColor: 'border-slate-500/30',
    icon: <GitHubIcon className="w-8 h-8 text-white" />,
    authUrl: 'github.com/login/oauth',
    scopes: ['read:user', 'user:email'],
    description: 'GitHub 将共享您的用户名、邮箱和公开个人资料',
  },
}

// OAuth 授权弹窗组件
function OAuthDialog({
  provider,
  step,
  onAuthorize,
  onCancel,
}: {
  provider: OAuthProvider
  step: 'authorize' | 'loading' | 'success'
  onAuthorize: () => void
  onCancel: () => void
}) {
  const config = oauthConfigs[provider]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 顶部：模拟浏览器地址栏 */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border-b border-slate-700">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer hover:bg-red-500" onClick={onCancel} />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-1 rounded-md bg-slate-700/60 text-xs text-slate-400">
            <ShieldCheck className="w-3 h-3 text-green-400" />
            <span className="truncate">https://{config.authUrl}/authorize?client_id=mysql_analyzer&scope={config.scopes.join(',')}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </div>

        <div className="p-6">
          {step === 'authorize' && (
            <div className="space-y-5">
              {/* 平台 Logo */}
              <div className="flex items-center justify-center">
                <div className={`w-16 h-16 rounded-2xl ${config.bgColor}/20 border ${config.borderColor} flex items-center justify-center`}>
                  {config.icon}
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-1">
                  授权 {config.name} 登录
                </h3>
                <p className="text-sm text-slate-400">
                  MySQL Analyzer 请求访问您的 {config.name} 账号
                </p>
              </div>

              {/* 权限列表 */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-3">此应用将获取以下权限：</p>
                <div className="space-y-2">
                  {config.scopes.map((scope) => (
                    <div key={scope} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{scope}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-700/50">
                  {config.description}
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                  onClick={onCancel}
                >
                  取消
                </Button>
                <Button
                  className={`flex-1 ${config.bgColor} hover:opacity-90 text-white`}
                  onClick={onAuthorize}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  授权并登录
                </Button>
              </div>

              <p className="text-[10px] text-slate-600 text-center">
                授权即表示同意 MySQL Analyzer 的服务条款和隐私政策
              </p>
            </div>
          )}

          {step === 'loading' && (
            <div className="py-8 text-center space-y-4">
              <div className="relative mx-auto w-16 h-16">
                <div className={`absolute inset-0 rounded-full border-2 ${config.borderColor} opacity-30`} />
                <div className={`absolute inset-0 rounded-full border-2 border-transparent ${config.borderColor} border-t-current animate-spin`} />
                <div className="absolute inset-3 flex items-center justify-center">
                  {config.icon}
                </div>
              </div>
              <div>
                <p className="text-white font-medium">正在与 {config.name} 通信</p>
                <p className="text-sm text-slate-500 mt-1">正在验证授权并获取用户信息...</p>
              </div>
              <div className="flex justify-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">授权成功</p>
                <p className="text-sm text-slate-400 mt-1">正在跳转到 MySQL Analyzer...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthPage({ onNavigate }: AuthPageProps) {
  const { login, register, oauthLogin, isAuthenticated } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // OAuth 弹窗状态
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null)
  const [oauthStep, setOauthStep] = useState<'authorize' | 'loading' | 'success'>('authorize')

  // 表单字段
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const result = await login(username, password)
        if (result.success) {
          onNavigate('landing')
        } else {
          setError(result.error || '登录失败')
        }
      } else {
        if (!displayName.trim()) {
          setError('请输入显示名称')
          setLoading(false)
          return
        }
        const result = await register(username, email, password, displayName)
        if (result.success) {
          // 注册成功后不自动登录，而是切到登录页提示
          setSuccessMsg('注册成功！请使用您的账号密码登录')
          setMode('login')
          setPassword('')
          // username 保留方便用户登录
        } else {
          setError(result.error || '注册失败')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 打开 OAuth 弹窗
  const openOAuth = (provider: OAuthProvider) => {
    setError('')
    setSuccessMsg('')
    setOauthProvider(provider)
    setOauthStep('authorize')
  }

  // 确认授权
  const handleOAuthAuthorize = async () => {
    if (!oauthProvider) return
    setOauthStep('loading')

    try {
      const result = await oauthLogin(oauthProvider)
      if (result.success) {
        setOauthStep('success')
        setTimeout(() => {
          setOauthProvider(null)
          onNavigate('landing')
        }, 800)
      } else {
        setOauthProvider(null)
        setError(result.error || '第三方授权失败')
      }
    } catch {
      setOauthProvider(null)
      setError('授权过程发生错误，请重试')
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setError('')
    setSuccessMsg('')
    setUsername('')
    setEmail('')
    setPassword('')
    setDisplayName('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* OAuth 授权弹窗 */}
      {oauthProvider && (
        <OAuthDialog
          provider={oauthProvider}
          step={oauthStep}
          onAuthorize={handleOAuthAuthorize}
          onCancel={() => setOauthProvider(null)}
        />
      )}

      <div className="w-full max-w-md relative z-10">
        {/* 返回首页（仅已登录时显示） */}
        {isAuthenticated && (
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        )}

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MySQL Analyzer</span>
          </div>
          <p className="text-sm text-slate-500">MySQL 内核学习平台</p>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center text-white">
              {mode === 'login' ? '欢迎回来' : '创建账号'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'login' ? '登录以继续使用' : '注册以开始学习 MySQL 内核'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth 第三方登录 */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="bg-slate-800/50 border-slate-700 hover:bg-green-500/10 hover:border-green-500/50 text-slate-300 h-11"
                onClick={() => openOAuth('wechat')}
                disabled={loading}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <WechatIcon className="w-5 h-5 text-green-400" />
                  <span className="text-[10px]">微信</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="bg-slate-800/50 border-slate-700 hover:bg-blue-500/10 hover:border-blue-500/50 text-slate-300 h-11"
                onClick={() => openOAuth('google')}
                disabled={loading}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <GoogleIcon className="w-5 h-5" />
                  <span className="text-[10px]">Google</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="bg-slate-800/50 border-slate-700 hover:bg-slate-500/10 hover:border-slate-500/50 text-slate-300 h-11"
                onClick={() => openOAuth('github')}
                disabled={loading}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <GitHubIcon className="w-5 h-5" />
                  <span className="text-[10px]">GitHub</span>
                </div>
              </Button>
            </div>

            <div className="relative">
              <Separator className="bg-slate-700" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-3 text-xs text-slate-500">
                或使用账号密码
              </span>
            </div>

            {/* 成功提示 */}
            {successMsg && (
              <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            {/* 表单 */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-slate-400 text-xs">显示名称</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="displayName"
                      placeholder="如：张三"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-slate-400 text-xs">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="username"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-400 text-xs">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-400 text-xs">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'login' ? '请输入密码' : '至少6个字符'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9 pr-9 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-11"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : mode === 'login' ? (
                  <LogIn className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {loading ? '处理中...' : mode === 'login' ? '登 录' : '注 册'}
              </Button>
            </form>

            {/* 切换登录/注册 */}
            <div className="text-center pt-2">
              <button
                onClick={switchMode}
                className="text-sm text-slate-400 hover:text-blue-400 transition-colors inline-flex items-center gap-1"
              >
                {mode === 'login' ? '没有账号？点此注册' : '已有账号？点此登录'}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* 管理员提示 */}
            {mode === 'login' && (
              <div className="text-center">
                <p className="text-[11px] text-slate-600">
                  管理员账号: admin / admin@0305
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
