import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Home, Play, Pause, SkipForward, SkipBack, RotateCcw,
  ChevronRight, ChevronDown, FileCode, GitBranch, Lightbulb,
  Terminal, Code2, Zap, Eye, Copy, Check, ArrowRight,
  ChevronLeft, Maximize2, TreeDeciduous, Search, X,
  Sparkles, BookOpen, ArrowUpRight, Star, Database, Tag,
  AlertTriangle, Settings
} from 'lucide-react'
import { callChainScenarios, type CallChainScenario, type TraceStep, type CallChainNode } from '@/data/callChainData'
import { generateCallChain, searchFunctions, recommendedFunctions, type RecommendedFunction } from '@/data/mysqlFunctionDB'
import { useVersion } from '@/contexts/VersionContext'
import type { Route } from '@/App'

interface CallChainPageProps {
  onNavigate: (route: Route) => void
}

// 模块颜色映射
const moduleColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  'sql-layer': { bg: 'bg-blue-500/15', border: 'border-blue-500/50', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  'optimizer': { bg: 'bg-amber-500/15', border: 'border-amber-500/50', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  'executor': { bg: 'bg-green-500/15', border: 'border-green-500/50', text: 'text-green-400', glow: 'shadow-green-500/20' },
  'storage': { bg: 'bg-purple-500/15', border: 'border-purple-500/50', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  'buffer': { bg: 'bg-cyan-500/15', border: 'border-cyan-500/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
  'parser': { bg: 'bg-orange-500/15', border: 'border-orange-500/50', text: 'text-orange-400', glow: 'shadow-orange-500/20' },
  'network': { bg: 'bg-rose-500/15', border: 'border-rose-500/50', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
}

const moduleLabels: Record<string, string> = {
  'sql-layer': 'SQL 层',
  'optimizer': '优化器',
  'executor': '执行器',
  'storage': '存储引擎',
  'buffer': '缓冲池',
  'parser': '解析器',
  'network': '网络层',
}

// 模块图标颜色（用于推荐面板）
const moduleIconColors: Record<string, string> = {
  'sql-layer': 'from-blue-500 to-blue-600',
  'optimizer': 'from-amber-500 to-orange-600',
  'executor': 'from-green-500 to-emerald-600',
  'storage': 'from-purple-500 to-violet-600',
  'buffer': 'from-cyan-500 to-teal-600',
  'parser': 'from-orange-500 to-red-600',
  'network': 'from-rose-500 to-pink-600',
}

export default function CallChainPage({ onNavigate }: CallChainPageProps) {
  const { codeSource, getVersionLabel, getVersionDiffs } = useVersion()
  // 场景模式: 'preset' = 预设场景, 'dynamic' = 动态生成
  const [mode, setMode] = useState<'preset' | 'dynamic'>('dynamic')
  const [selectedScenario, setSelectedScenario] = useState<CallChainScenario>(callChainScenarios[0])
  const [currentStepIdx, setCurrentStepIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAllNodes, setShowAllNodes] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('trace')
  const [selectedNode, setSelectedNode] = useState<CallChainNode | null>(null)
  const [copied, setCopied] = useState(false)
  const playTimerRef = useRef<NodeJS.Timeout | null>(null)
  const stepsContainerRef = useRef<HTMLDivElement>(null)

  // 搜索相关
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchFunctions>>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showRecommendPanel, setShowRecommendPanel] = useState(true)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  const currentStep = selectedScenario.steps[currentStepIdx]
  const totalSteps = selectedScenario.steps.length

  // 搜索防抖
  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      const timer = setTimeout(() => {
        const results = searchFunctions(searchQuery)
        setSearchResults(results)
        setShowSearchDropdown(results.length > 0)
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }, [searchQuery])

  // 点击外部关闭搜索下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 自动播放
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIdx(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 4000)
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [isPlaying, totalSteps])

  // 步骤变化时滚动到对应步骤卡片
  useEffect(() => {
    if (stepsContainerRef.current) {
      const stepEl = stepsContainerRef.current.querySelector(`[data-step="${currentStepIdx}"]`)
      if (stepEl) {
        stepEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [currentStepIdx])

  // 选择预设场景
  const handleScenarioChange = (scenarioId: string) => {
    const scenario = callChainScenarios.find(s => s.id === scenarioId)
    if (scenario) {
      setSelectedScenario(scenario)
      setCurrentStepIdx(0)
      setIsPlaying(false)
      setShowAllNodes(false)
      setSelectedNode(null)
      setMode('preset')
      setShowRecommendPanel(false)
    }
  }

  // 选择函数（搜索结果或推荐）
  const handleSelectFunction = (funcName: string) => {
    const scenario = generateCallChain(funcName)
    if (scenario) {
      setSelectedScenario(scenario)
      setCurrentStepIdx(0)
      setIsPlaying(false)
      setShowAllNodes(false)
      setSelectedNode(null)
      setMode('dynamic')
      setShowRecommendPanel(false)
      setShowSearchDropdown(false)
      setSearchQuery('')
    }
  }

  const goToStep = (idx: number) => {
    setCurrentStepIdx(idx)
    setIsPlaying(false)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isNodeHighlighted = (nodeId: string): boolean => {
    if (showAllNodes) return true
    return currentStep?.highlightNodes.includes(nodeId) || false
  }

  const isEdgeHighlighted = (from: string, to: string): boolean => {
    if (showAllNodes) return true
    return currentStep?.highlightEdges.some(([f, t]) => f === from && t === to) || false
  }

  // 按分类对推荐函数分组
  const groupedRecommendations = useMemo(() => {
    const groups: Record<string, RecommendedFunction[]> = {}
    recommendedFunctions.forEach(f => {
      if (!groups[f.category]) groups[f.category] = []
      groups[f.category].push(f)
    })
    return groups
  }, [])

  // 渲染调用链可视化图
  const renderCallGraph = () => {
    const nodes = selectedScenario.flatNodes
    const edges = selectedScenario.edges

    // 按 depth 分组
    const depthGroups: Record<number, CallChainNode[]> = {}
    nodes.forEach(node => {
      if (!depthGroups[node.depth]) depthGroups[node.depth] = []
      depthGroups[node.depth].push(node)
    })

    const depths = Object.keys(depthGroups).map(Number).sort((a, b) => a - b)

    return (
      <div className="relative">
        {/* 图例 */}
        <div className="flex flex-wrap gap-3 mb-4 px-2">
          {Object.entries(moduleLabels).map(([key, label]) => {
            const colors = moduleColors[key]
            const hasNodes = nodes.some(n => n.module === key)
            if (!hasNodes) return null
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${colors.bg} ${colors.border} border`} />
                <span className={`text-xs ${colors.text}`}>{label}</span>
              </div>
            )
          })}
        </div>

        {/* 节点图 */}
        <div className="space-y-1">
          {depths.map((depth) => {
            const nodesAtDepth = depthGroups[depth]
            return (
              <div key={depth} className="flex items-start gap-3" style={{ paddingLeft: `${depth * 28}px` }}>
                {depth > 0 && (
                  <div className="flex items-center h-full absolute" style={{ left: `${(depth - 1) * 28 + 14}px` }}>
                    <div className="w-[28px] h-px bg-slate-700/50" />
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 relative">
                  {depth > 0 && (
                    <div className="absolute -left-5 top-0 bottom-0 flex flex-col items-center">
                      <div className={`w-px flex-1 ${nodesAtDepth.some(n => isNodeHighlighted(n.id)) ? 'bg-blue-500/50' : 'bg-slate-700/30'}`} />
                    </div>
                  )}
                  
                  {nodesAtDepth.map((node) => {
                    const colors = moduleColors[node.module]
                    const highlighted = isNodeHighlighted(node.id)
                    const isSelected = selectedNode?.id === node.id
                    const isTarget = node.name === selectedScenario.rootFunction || node.fullName?.includes(selectedScenario.rootFunction)

                    const inEdge = edges.find(e => e.to === node.id)
                    const edgeHighlighted = inEdge ? isEdgeHighlighted(inEdge.from, inEdge.to) : false

                    return (
                      <div key={node.id} className="flex items-center gap-1">
                        {inEdge && (
                          <div className={`flex items-center gap-0.5 mr-1 transition-all duration-500 ${edgeHighlighted ? 'opacity-100' : 'opacity-30'}`}>
                            {inEdge.label && (
                              <span className={`text-[10px] px-1 py-0.5 rounded ${edgeHighlighted ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-600'}`}>
                                {inEdge.label}
                              </span>
                            )}
                            <ArrowRight className={`w-3 h-3 ${edgeHighlighted ? 'text-blue-400' : 'text-slate-700'}`} />
                          </div>
                        )}
                        
                        <button
                          onClick={() => setSelectedNode(node)}
                          className={`
                            relative px-3 py-2 rounded-lg border text-left transition-all duration-500
                            ${highlighted
                              ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow} scale-100`
                              : 'bg-slate-900/30 border-slate-800/50 opacity-40 scale-95'
                            }
                            ${isSelected ? 'ring-2 ring-white/30' : ''}
                            ${isTarget ? 'ring-1 ring-amber-400/40' : ''}
                            hover:opacity-100 hover:scale-100 cursor-pointer
                          `}
                        >
                          {highlighted && currentStep?.highlightNodes[currentStep.highlightNodes.length - 1] === node.id && (
                            <div className={`absolute -inset-px rounded-lg ${colors.border} border animate-pulse`} />
                          )}
                          
                          <div className="flex items-center gap-2">
                            {isTarget && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                            <GitBranch className={`w-3.5 h-3.5 flex-shrink-0 ${highlighted ? colors.text : 'text-slate-600'}`} />
                            <span className={`font-mono text-xs font-medium ${highlighted ? colors.text : 'text-slate-600'}`}>
                              {node.name}
                            </span>
                          </div>
                          <div className={`text-[10px] mt-0.5 ml-5.5 ${highlighted ? 'text-slate-400' : 'text-slate-700'}`}>
                            {node.file.split('/').pop()}:{node.line}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ===== 推荐面板视图 =====
  const renderRecommendPanel = () => (
    <div className="space-y-6">
      {/* 搜索提示 */}
      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
          <Search className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">输入任意 MySQL 函数名</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          在上方搜索框输入函数名，自动生成其完整的上下文调用链路追踪。支持模糊搜索。
        </p>
      </div>

      {/* 推荐函数 */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-amber-300">推荐函数 — 快速开始</h3>
        </div>
        
        <div className="space-y-5">
          {Object.entries(groupedRecommendations).map(([category, funcs]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${moduleIconColors[funcs[0].icon] || 'from-gray-500 to-gray-600'}`} />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{category}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {funcs.map((func) => (
                  <button
                    key={func.name}
                    onClick={() => handleSelectFunction(func.name)}
                    className="group relative text-left p-3 rounded-lg border border-slate-800/60 bg-slate-900/40 
                      hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-semibold text-amber-300 group-hover:text-amber-200 truncate">
                            {func.displayName}
                          </code>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {func.description}
                        </p>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 flex-shrink-0 mt-0.5 transition-colors" />
                    </div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {func.tags.map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-500 group-hover:text-slate-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 预设场景入口 */}
      <div className="border-t border-slate-800 pt-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-300">预设深度分析场景</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {callChainScenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => handleScenarioChange(scenario.id)}
              className="group text-left p-4 rounded-xl border border-slate-800/60 bg-slate-900/40
                hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white group-hover:text-blue-200">{scenario.title}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{scenario.description}</p>
              <div className="flex gap-1.5 flex-wrap">
                {scenario.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] border-slate-700 text-slate-500 group-hover:border-blue-500/30 group-hover:text-blue-400">
                    {tag}
                  </Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">动态调用链追踪</h1>
                <p className="text-xs text-slate-400">Interactive Call Chain Tracer</p>
              </div>
            </div>

            {/* 搜索框 */}
            <div className="relative flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true)
                  }}
                  placeholder="输入函数名搜索... 如 JOIN::optimize, mysql_parse"
                  className="w-full pl-10 pr-10 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 
                    text-sm text-white placeholder:text-slate-500
                    focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20
                    transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setShowSearchDropdown(false) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 搜索结果下拉 */}
              {showSearchDropdown && (
                <div
                  ref={searchDropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 
                    rounded-lg shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto"
                >
                  {searchResults.map((result) => (
                    <button
                      key={result.name}
                      onClick={() => handleSelectFunction(result.name)}
                      className="w-full text-left px-4 py-2.5 hover:bg-amber-500/10 border-b border-slate-800/50 last:border-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${moduleIconColors[result.module] || 'from-gray-500 to-gray-600'}`} />
                          <code className="text-xs font-mono font-semibold text-amber-300">{result.fullName}</code>
                        </div>
                        <Badge variant="outline" className={`text-[9px] ${moduleColors[result.module]?.border} ${moduleColors[result.module]?.text}`}>
                          {moduleLabels[result.module] || result.module}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 ml-4 truncate">{result.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 版本指示 */}
              <button
                onClick={() => onNavigate('versionconfig' as Route)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                <Database className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-slate-300">{getVersionLabel()}</span>
                <Settings className="w-3 h-3 text-slate-500" />
              </button>
              <div className="w-px h-6 bg-slate-700" />
              {/* 推荐面板切换 */}
              <Button
                variant={showRecommendPanel ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowRecommendPanel(!showRecommendPanel)}
                className={showRecommendPanel
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                }
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                推荐
              </Button>
              <div className="w-px h-6 bg-slate-700" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('landing')}
                className="text-slate-300 hover:bg-white/10"
              >
                <Home className="h-4 w-4 mr-1.5" />
                首页
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* 推荐面板 */}
        {showRecommendPanel ? (
          renderRecommendPanel()
        ) : (
          <>
            {/* 场景描述 */}
            <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-amber-300">{selectedScenario.title}</h2>
                    {mode === 'dynamic' && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                        动态生成
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{selectedScenario.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 items-center">
                  {selectedScenario.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                      {tag}
                    </Badge>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRecommendPanel(true)}
                    className="border-slate-700 text-slate-400 hover:bg-slate-800 ml-2"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                    换函数
                  </Button>
                </div>
              </div>
            </div>

            {/* 主内容区 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-slate-900/50 border border-slate-800 mb-4">
                <TabsTrigger value="trace" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Eye className="w-4 h-4 mr-1.5" />
                  动态追踪
                </TabsTrigger>
                <TabsTrigger value="markdown" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <TreeDeciduous className="w-4 h-4 mr-1.5" />
                  树状图
                </TabsTrigger>
              </TabsList>

              {/* ===== 动态追踪视图 ===== */}
              <TabsContent value="trace" className="mt-0">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                  {/* 左侧 - 步骤导航 */}
                  <div className="xl:col-span-3">
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">
                            调用链步骤
                            <span className="text-slate-500 ml-2 font-normal">
                              {currentStepIdx + 1}/{totalSteps}
                            </span>
                          </CardTitle>
                        </div>
                        {/* 播放控制 */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToStep(Math.max(0, currentStepIdx - 1))}
                            disabled={currentStepIdx === 0}
                            className="h-7 w-7 p-0 border-slate-700"
                          >
                            <SkipBack className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant={isPlaying ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`h-7 flex-1 ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'border-slate-700'}`}
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                            {isPlaying ? '暂停' : '自动播放'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToStep(Math.min(totalSteps - 1, currentStepIdx + 1))}
                            disabled={currentStepIdx === totalSteps - 1}
                            className="h-7 w-7 p-0 border-slate-700"
                          >
                            <SkipForward className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { goToStep(0); setShowAllNodes(false); }}
                            className="h-7 w-7 p-0 border-slate-700"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        {/* 进度条 */}
                        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${((currentStepIdx + 1) / totalSteps) * 100}%` }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* 显示全部按钮 */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAllNodes(!showAllNodes)}
                          className={`w-full mb-3 h-7 text-xs ${
                            showAllNodes ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'border-slate-700 text-slate-400'
                          }`}
                        >
                          <Maximize2 className="w-3 h-3 mr-1.5" />
                          {showAllNodes ? '返回步骤追踪' : '显示完整调用链'}
                        </Button>
                        
                        {/* 步骤列表 */}
                        <div ref={stepsContainerRef} className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
                          {selectedScenario.steps.map((step, idx) => (
                            <div
                              key={step.id}
                              data-step={idx}
                              onClick={() => goToStep(idx)}
                              className={`
                                group relative p-2.5 rounded-lg border cursor-pointer transition-all duration-300
                                ${idx === currentStepIdx
                                  ? 'border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                                  : idx < currentStepIdx
                                  ? 'border-slate-700/50 bg-slate-800/30 opacity-70'
                                  : 'border-slate-800/50 bg-slate-900/30 opacity-50 hover:opacity-80'
                                }
                              `}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`
                                  w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all
                                  ${idx === currentStepIdx
                                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                                    : idx < currentStepIdx
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                                  }
                                `}>
                                  {idx < currentStepIdx ? '✓' : step.id}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium truncate ${
                                    idx === currentStepIdx ? 'text-amber-200' : 'text-slate-300'
                                  }`}>
                                    {step.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                    {step.subtitle}
                                  </div>
                                </div>
                              </div>
                              
                              {idx === currentStepIdx && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-amber-500 rounded-r" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 中间 - 调用图可视化 */}
                  <div className="xl:col-span-5">
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-amber-400" />
                            调用链可视化
                          </CardTitle>
                          <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                            Step {currentStepIdx + 1}: {currentStep?.title}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="overflow-auto max-h-[70vh]">
                        {renderCallGraph()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* 右侧 - 详情面板 */}
                  <div className="xl:col-span-4 space-y-4">
                    {/* 步骤详情 */}
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                          Step {currentStep?.id}: {currentStep?.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {currentStep?.description}
                        </p>

                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300 leading-relaxed">
                              {currentStep?.keyInsight}
                            </p>
                          </div>
                        </div>

                        {currentStep?.codeContext && (
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs text-slate-400 font-mono">
                                  {currentStep.codeContext.file}:{currentStep.codeContext.line}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopyCode(currentStep.codeContext.code)}
                                className="text-slate-500 hover:text-slate-300"
                              >
                                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <pre className="bg-slate-950 rounded-lg p-3 font-mono text-xs overflow-x-auto border border-slate-800 max-h-48 overflow-y-auto">
                              <code className="text-slate-300">{currentStep.codeContext.code}</code>
                            </pre>
                            <p className="text-[10px] text-slate-500 mt-1.5 italic">
                              {currentStep.codeContext.explanation}
                            </p>
                          </div>
                        )}

                        {currentStep?.gdbCommand && (
                          <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Terminal className="w-3 h-3 text-green-400" />
                              <span className="text-[10px] text-green-400 font-semibold uppercase">GDB 调试命令</span>
                            </div>
                            <div className="font-mono text-xs">
                              {currentStep.gdbCommand.split('\n').map((line, i) => (
                                <div key={i} className="text-green-300">
                                  <span className="text-slate-600">(gdb) </span>{line}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 版本差异提示 */}
                        {(() => {
                          const funcId = currentStep?.highlightNodes?.[currentStep.highlightNodes.length - 1]
                          if (!funcId) return null
                          const diffs = getVersionDiffs(funcId)
                          if (diffs.length === 0) return null
                          return (
                            <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <AlertTriangle className="w-3 h-3 text-violet-400" />
                                <span className="text-[10px] text-violet-400 font-semibold uppercase">
                                  版本差异 ({getVersionLabel()})
                                </span>
                              </div>
                              {diffs.map((diff, i) => (
                                <div key={i} className="mb-1.5 last:mb-0">
                                  <p className="text-xs text-violet-300/80 leading-relaxed">{diff.changes}</p>
                                  {diff.codeSnippet && (
                                    <pre className="bg-slate-950 rounded p-2 font-mono text-[10px] text-slate-400 mt-1 border border-slate-800 overflow-x-auto max-h-28 overflow-y-auto">
                                      {diff.codeSnippet}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>

                    {/* 选中节点详情 */}
                    {selectedNode && (
                      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <FileCode className="w-4 h-4 text-blue-400" />
                              节点详情
                            </CardTitle>
                            <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-slate-300">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase">函数</span>
                            <p className={`font-mono text-sm font-medium ${moduleColors[selectedNode.module]?.text || 'text-white'}`}>
                              {selectedNode.fullName}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase">文件</span>
                              <p className="font-mono text-xs text-slate-300 truncate">{selectedNode.file}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase">行号</span>
                              <p className="text-xs text-slate-300">第 {selectedNode.line} 行</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase">模块</span>
                            <Badge variant="outline" className={`text-xs ${moduleColors[selectedNode.module]?.border} ${moduleColors[selectedNode.module]?.text}`}>
                              {moduleLabels[selectedNode.module]}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase">说明</span>
                            <p className="text-xs text-slate-400">{selectedNode.description}</p>
                          </div>
                          {selectedNode.codeSnippet && (
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase">代码片段</span>
                              <pre className="bg-slate-950 rounded-lg p-2 font-mono text-[10px] text-slate-300 overflow-x-auto mt-1 border border-slate-800 max-h-40 overflow-y-auto">
                                {selectedNode.codeSnippet}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ===== Markdown 树状图视图 ===== */}
              <TabsContent value="markdown" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 树状图 */}
                  <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TreeDeciduous className="w-4 h-4 text-green-400" />
                          完整调用树
                        </CardTitle>
                        <button
                          onClick={() => handleCopyCode(selectedScenario.markdownTree)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                        >
                          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          复制 Markdown
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto">
                        <pre className="font-mono text-xs leading-relaxed">
                          {selectedScenario.markdownTree
                            .replace(/^```\n?/, '')
                            .replace(/\n?```$/, '')
                            .split('\n')
                            .map((line, idx) => {
                              let colorClass = 'text-slate-400'
                              if (line.includes('★')) colorClass = 'text-amber-400 font-bold'
                              else if (line.includes('←')) {
                                const parts = line.split('←')
                                return (
                                  <div key={idx} className="hover:bg-slate-800/30 px-1 -mx-1 rounded">
                                    <span className={line.includes('[Step') ? 'text-green-300' : 'text-blue-300'}>{parts[0]}</span>
                                    <span className="text-slate-600">←{parts[1]}</span>
                                  </div>
                                )
                              }
                              else if (line.includes('[Step')) colorClass = 'text-green-300'
                              else if (line.includes('│') || line.includes('├') || line.includes('└')) colorClass = 'text-slate-600'

                              return (
                                <div key={idx} className={`${colorClass} hover:bg-slate-800/30 px-1 -mx-1 rounded`}>
                                  {line}
                                </div>
                              )
                            })
                          }
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* 步骤解析 */}
                  <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        逐步解析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        {selectedScenario.steps.map((step, idx) => (
                          <div key={step.id} className="relative">
                            {idx < selectedScenario.steps.length - 1 && (
                              <div className="absolute left-3 top-10 bottom-0 w-px bg-slate-800" />
                            )}
                            
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white z-10">
                                {step.id}
                              </div>
                              <div className="flex-1 pb-4">
                                <h4 className="text-sm font-semibold text-amber-200">{step.title}</h4>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{step.subtitle}</p>
                                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{step.description}</p>

                                {step.codeContext && (
                                  <pre className="bg-slate-950 rounded-lg p-2.5 font-mono text-[10px] text-slate-300 mt-2 border border-slate-800 overflow-x-auto max-h-40 overflow-y-auto">
                                    {step.codeContext.code}
                                  </pre>
                                )}

                                <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/15">
                                  <p className="text-[10px] text-amber-300 flex items-start gap-1.5">
                                    <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {step.keyInsight}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
