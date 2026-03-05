import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, Layers, GitBranch, Activity, Terminal, BookOpen, 
  ChevronRight, CheckCircle2, Zap, Target, FileCode, Flame, 
  Bug, Database, Code2, Clock, Users, TrendingUp, Eye, Settings, Tag,
  LogIn, LogOut, Shield, User, Heart
} from 'lucide-react'
import { useVersion } from '@/contexts/VersionContext'
import { useAuth } from '@/contexts/AuthContext'
import DonateDialog from '@/components/DonateDialog'
import type { Route } from '@/App'

interface LandingPageProps {
  onNavigate: (route: Route) => void
}

const coreModules = [
  {
    id: 'source-browser',
    title: '源码浏览 & Call Hierarchy',
    description: '提供类似 MySQL 官网的代码阅读体验，集成 Control Flow Graph、调用树和架构依赖图',
    icon: <FileCode className="w-6 h-6" />,
    route: 'analyzer' as Route,
    color: 'from-blue-500 to-cyan-500',
    borderColor: 'border-blue-500/30 hover:border-blue-400',
    capabilities: [
      '语法高亮 C/C++ 代码阅读',
      'Call Tree 调用树可视化',
      'Control Flow Graph 控制流图',
      '架构依赖关系图',
      '函数上下游 Caller/Callee 分析',
    ]
  },
  {
    id: 'call-chain',
    title: '动态调用链追踪',
    description: '以 JOIN::optimize() 为核心场景，提供步骤引导式动态追踪、Markdown 树状图和代码上下文联动',
    icon: <Zap className="w-6 h-6" />,
    route: 'callchain' as Route,
    color: 'from-amber-500 to-orange-500',
    borderColor: 'border-amber-500/30 hover:border-amber-400',
    capabilities: [
      'JOIN::optimize() 完整调用链路追踪',
      'SELECT 全链路动态追踪',
      '步骤引导式交互 + 自动播放',
      'Markdown 树状图 + 代码上下文',
      'GDB 断点命令联动',
    ]
  },
  {
    id: 'gdb-lab',
    title: 'GDB 调试实验室',
    description: '提供手动 GDB 断言验证、执行和观测能力，包含5个递进式实验课程',
    icon: <Bug className="w-6 h-6" />,
    route: 'gdblab' as Route,
    color: 'from-orange-500 to-red-500',
    borderColor: 'border-orange-500/30 hover:border-orange-400',
    capabilities: [
      'SQL 查询完整生命周期跟踪',
      '优化器成本估算过程观测',
      'InnoDB 缓冲池内存分析',
      '多线程架构调试',
      '锁机制与死锁检测实验',
    ]
  },
  {
    id: 'flame-graph',
    title: '火焰图分析工具',
    description: '热点压测火焰图自动生成、观测和分析，帮助工程师学习性能分析方法论',
    icon: <Flame className="w-6 h-6" />,
    route: 'flamegraph' as Route,
    color: 'from-red-500 to-pink-500',
    borderColor: 'border-red-500/30 hover:border-red-400',
    capabilities: [
      'OLTP 读写混合火焰图分析',
      '高并发点查热点分析',
      '写密集型场景瓶颈定位',
      'perf + FlameGraph 工具链教学',
    ]
  },
]

const learningTimeline = [
  { week: '第1-2周', title: '基础架构认知', tasks: ['阅读源码目录结构', '理解 SQL 执行 10 阶段流程', '完成 GDB 实验1-2'], color: 'bg-blue-500' },
  { week: '第3-4周', title: '优化器与存储引擎', tasks: ['深入 JOIN::optimize 源码', '完成 GDB 实验3 (缓冲池)', '分析 OLTP 火焰图'], color: 'bg-cyan-500' },
  { week: '第5-6周', title: '并发与事务', tasks: ['线程模型分析 (GDB 实验4)', '锁机制实验 (GDB 实验5)', '写密集型火焰图分析'], color: 'bg-green-500' },
  { week: '第7-8周', title: '性能调优实战', tasks: ['使用 perf 采集真实负载', '对比差异火焰图', '制定调优方案'], color: 'bg-orange-500' },
]

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { getVersionLabel, codeSource } = useVersion()
  const { user, isAuthenticated, isAdmin, logout, donateConfig, loadFullDonateConfig } = useAuth()
  const [showDonate, setShowDonate] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* 打赏弹窗 */}
      {showDonate && (
        <DonateDialog config={donateConfig} onClose={() => setShowDonate(false)} />
      )}
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">MySQL Analyzer</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {donateConfig.enabled && donateConfig.qrcodeImage && (
                  <button
                    onClick={() => { loadFullDonateConfig().then(() => setShowDonate(true)) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-pink-400 hover:bg-pink-500/10 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="hidden sm:inline">打赏</span>
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => onNavigate('admin' as Route)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">管理后台</span>
                  </button>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {user?.displayName?.[0] || 'U'}
                  </div>
                  <span className="text-sm text-slate-300 hidden sm:inline">{user?.displayName}</span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => onNavigate('auth' as Route)}
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                登录 / 注册
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-orange-500/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Database className="w-3 h-3 mr-1" />
              {getVersionLabel()} 内核学习平台
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent leading-tight">
              深入 MySQL 内核
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-4 max-w-3xl mx-auto">
              面向数据库研发工程师和运维工程师的源码学习平台
            </p>
            <p className="text-sm text-slate-500 mb-6 max-w-2xl mx-auto">
              通过源码阅读、GDB 断点调试、火焰图性能分析，在 1-2 个月内系统提升 MySQL 内核能力
            </p>

            {/* 版本配置入口 */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => onNavigate('versionconfig' as Route)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all group"
              >
                <Tag className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-slate-300">
                  当前版本: <span className="text-violet-300 font-medium">{getVersionLabel()}</span>
                </span>
                <span className="text-slate-600 mx-1">|</span>
                <span className="text-xs text-slate-400 group-hover:text-violet-300 transition-colors flex items-center gap-1">
                  <Settings className="w-3 h-3" />
                  切换版本 / 导入代码
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-8 text-base"
                onClick={() => onNavigate('analyzer')}
              >
                <Code2 className="w-5 h-5 mr-2" />
                开始阅读源码
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 px-8 text-base"
                onClick={() => onNavigate('gdblab')}
              >
                <Bug className="w-5 h-5 mr-2" />
                GDB 实验室
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 px-8 text-base"
                onClick={() => onNavigate('flamegraph')}
              >
                <Flame className="w-5 h-5 mr-2" />
                火焰图分析
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="font-medium text-sm">适用人群</div>
              <div className="text-xs text-slate-400">数据库研发 & 运维工程师</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="font-medium text-sm">学习周期</div>
              <div className="text-xs text-slate-400">1-2 个月系统学习</div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <div className="w-12 h-12 rounded-lg bg-orange-600/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="font-medium text-sm">学习目标</div>
              <div className="text-xs text-slate-400">持续提高内核开发能力</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Modules - 4 大核心功能 */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">四大核心模块</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            从源码阅读到性能分析，覆盖 MySQL 内核学习的完整链路
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {coreModules.map((mod) => (
            <Card
              key={mod.id}
              className={`bg-slate-900/50 border ${mod.borderColor} backdrop-blur-sm transition-all cursor-pointer group`}
              onClick={() => onNavigate(mod.route)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      {mod.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{mod.title}</CardTitle>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:translate-x-1 group-hover:text-slate-300 transition-all" />
                </div>
                <CardDescription className="mt-2">{mod.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {mod.capabilities.map((cap, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 8周学习路线图 */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">8 周学习路线图</h2>
          <p className="text-slate-400">从基础到实战，循序渐进掌握 MySQL 内核</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />
            
            {learningTimeline.map((item, idx) => (
              <div key={idx} className="relative flex gap-6 mb-8 last:mb-0">
                <div className={`relative z-10 flex-shrink-0 w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-sm font-bold shadow-lg`}>
                  {idx + 1}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                      {item.week}
                    </Badge>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <ul className="space-y-1">
                    {item.tasks.map((task, tidx) => (
                      <li key={tidx} className="flex items-center gap-2 text-sm text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Entry Cards */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">快速进入</h2>
          <p className="text-slate-400">选择你感兴趣的方向开始探索</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <Card
            className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border-blue-700/30 hover:border-blue-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate('analyzer')}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Layers className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">SQL 执行流程</span>
                <ChevronRight className="w-4 h-4 text-blue-400/50 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">10 阶段可视化，源码级定位</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 border-amber-700/30 hover:border-amber-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate('callchain')}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">动态调用链</span>
                <ChevronRight className="w-4 h-4 text-amber-400/50 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">JOIN::optimize 步骤追踪</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 border-orange-700/30 hover:border-orange-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate('masterthread')}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Master Thread</span>
                <ChevronRight className="w-4 h-4 text-orange-400/50 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">后台线程架构与交互</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-red-900/30 to-red-800/10 border-red-700/30 hover:border-red-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate('gdblab')}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Terminal className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">GDB 调试实验</span>
                <ChevronRight className="w-4 h-4 text-red-400/50 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">5 个递进式实验课程</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-pink-900/30 to-pink-800/10 border-pink-700/30 hover:border-pink-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate('flamegraph')}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">火焰图分析</span>
                <ChevronRight className="w-4 h-4 text-pink-400/50 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">压测热点分析与优化建议</p>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 border-purple-700/30 hover:border-purple-500/50 transition-all cursor-pointer group"
            onClick={() => onNavigate('analyzer')}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="font-medium">学习路径</span>
                <ChevronRight className="w-4 h-4 text-purple-400/50 ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">初级/中级/高级分层引导</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Donate CTA */}
      {donateConfig.enabled && donateConfig.qrcodeImage && (
        <section className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <div
              onClick={() => { loadFullDonateConfig().then(() => setShowDonate(true)) }}
              className="relative rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-orange-500/10 border border-pink-500/20 hover:border-pink-500/40 p-8 text-center cursor-pointer group transition-all"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{donateConfig.title}</h3>
                <p className="text-sm text-slate-400 max-w-md">{donateConfig.description}</p>
                <Button
                  className="mt-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  支持一下
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>{getVersionLabel()} 内核学习平台</p>
            <p className="mt-1">帮助数据库工程师系统提升内核开发和性能优化能力</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
