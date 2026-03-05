import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Home, Flame, Terminal, BookOpen, ChevronRight, Copy, 
  Lightbulb, BarChart3, ArrowRight, AlertTriangle, Zap
} from 'lucide-react'
import { flameGraphScenarios, perfCommands, type FlameNode, type FlameGraphScenario } from '@/data/flameGraphData'
import type { Route } from '@/App'

interface FlameGraphPageProps {
  onNavigate: (route: Route) => void
}

// 火焰图可视化组件
function FlameChart({ data, onSelect }: { data: FlameNode; onSelect: (node: FlameNode) => void }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [zoomStack, setZoomStack] = useState<FlameNode[]>([])
  
  const currentRoot = zoomStack.length > 0 ? zoomStack[zoomStack.length - 1] : data
  const totalValue = data.value

  const getModuleColor = (module?: string, depth: number = 0) => {
    if (module === 'innodb') return `hsl(${20 + depth * 8}, 80%, ${55 - depth * 3}%)`
    if (module === 'sql') return `hsl(${210 + depth * 5}, 70%, ${55 - depth * 3}%)`
    return `hsl(${0 + depth * 10}, 70%, ${55 - depth * 3}%)`
  }

  const flattenNodes = useCallback((node: FlameNode, depth: number, xOffset: number, totalWidth: number): {
    node: FlameNode; depth: number; x: number; width: number
  }[] => {
    const width = (node.value / currentRoot.value) * totalWidth
    if (width < 2) return [] // 过滤太小的节点
    
    const result = [{ node, depth, x: xOffset, width }]
    
    if (node.children) {
      let childX = xOffset
      for (const child of node.children) {
        const childResults = flattenNodes(child, depth + 1, childX, totalWidth)
        result.push(...childResults)
        childX += (child.value / currentRoot.value) * totalWidth
      }
    }
    
    return result
  }, [currentRoot])

  const chartWidth = 100 // percentage
  const items = flattenNodes(currentRoot, 0, 0, chartWidth)
  const maxDepth = Math.max(...items.map(i => i.depth), 0)
  const barHeight = 22
  const chartHeight = (maxDepth + 1) * (barHeight + 1) + 10

  const handleClick = (node: FlameNode) => {
    if (node.children && node.children.length > 0) {
      setZoomStack(prev => [...prev, node])
    }
    onSelect(node)
  }

  const handleZoomOut = () => {
    setZoomStack(prev => prev.slice(0, -1))
  }

  return (
    <div className="space-y-2">
      {zoomStack.length > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut} className="text-xs border-slate-600 text-slate-300">
            缩小视图
          </Button>
          <span className="text-xs text-slate-500">
            当前: {currentRoot.name}
          </span>
        </div>
      )}
      <div 
        className="relative w-full overflow-x-auto bg-slate-950 rounded-lg p-2"
        style={{ minHeight: `${chartHeight}px` }}
      >
        {items.map((item, idx) => {
          const isHovered = hoveredNode === `${item.depth}-${item.x}`
          const pct = ((item.node.value / totalValue) * 100).toFixed(1)
          const selfPct = item.node.selfValue ? ((item.node.selfValue / totalValue) * 100).toFixed(1) : null
          
          return (
            <div
              key={idx}
              className="absolute cursor-pointer transition-opacity"
              style={{
                left: `${item.x}%`,
                width: `${Math.max(item.width, 0.3)}%`,
                bottom: `${item.depth * (barHeight + 1)}px`,
                height: `${barHeight}px`,
                backgroundColor: getModuleColor(item.node.module, item.depth),
                opacity: isHovered ? 1 : 0.85,
                border: isHovered ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(0,0,0,0.2)',
                zIndex: isHovered ? 10 : 1,
              }}
              onMouseEnter={() => setHoveredNode(`${item.depth}-${item.x}`)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleClick(item.node)}
              title={`${item.node.name} (${pct}%${selfPct ? `, self: ${selfPct}%` : ''})`}
            >
              {item.width > 5 && (
                <div className="px-1 text-xs text-white truncate leading-[22px] font-mono">
                  {item.node.name}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: getModuleColor('sql', 0) }} />
          SQL Layer
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: getModuleColor('innodb', 0) }} />
          InnoDB Engine
        </div>
      </div>
    </div>
  )
}

export default function FlameGraphPage({ onNavigate }: FlameGraphPageProps) {
  const [selectedScenario, setSelectedScenario] = useState<FlameGraphScenario>(flameGraphScenarios[0])
  const [selectedNode, setSelectedNode] = useState<FlameNode | null>(null)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(cmd)
    setTimeout(() => setCopiedCmd(null), 2000)
  }

  const totalValue = selectedScenario.data.value
  const selfPct = selectedNode?.selfValue 
    ? ((selectedNode.selfValue / totalValue) * 100).toFixed(2) 
    : null
  const totalPct = selectedNode 
    ? ((selectedNode.value / totalValue) * 100).toFixed(2)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Flame className="h-6 w-6 text-red-400" />
              <h1 className="text-lg font-bold">火焰图分析工具</h1>
              <Badge variant="outline" className="border-red-500/50 text-red-400 text-xs">
                {flameGraphScenarios.length} 个场景
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('landing')}
              className="text-slate-300 hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="analysis" className="data-[state=active]:bg-red-600">
              <Flame className="w-4 h-4 mr-2" />
              火焰图分析
            </TabsTrigger>
            <TabsTrigger value="tutorial" className="data-[state=active]:bg-blue-600">
              <BookOpen className="w-4 h-4 mr-2" />
              工具链教程
            </TabsTrigger>
          </TabsList>

          {/* 火焰图分析 Tab */}
          <TabsContent value="analysis">
            {/* Scenario Selector */}
            <div className="flex gap-3 mb-6 flex-wrap">
              {flameGraphScenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  variant={selectedScenario.id === scenario.id ? 'default' : 'outline'}
                  onClick={() => { setSelectedScenario(scenario); setSelectedNode(null) }}
                  className={selectedScenario.id === scenario.id
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }
                  size="sm"
                >
                  {scenario.title}
                </Button>
              ))}
            </div>

            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedScenario.metrics.map((metric, idx) => (
                  <Card key={idx} className="bg-slate-900/50 border-slate-800">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-white">{metric.value}</div>
                      <div className="text-xs text-slate-400 mt-1">{metric.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Flame Graph */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-red-400" />
                        {selectedScenario.title}
                      </CardTitle>
                      <p className="text-xs text-slate-400 mt-1">{selectedScenario.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                      {selectedScenario.duration}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <FlameChart data={selectedScenario.data} onSelect={setSelectedNode} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Selected Node Details */}
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">函数详情</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedNode ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">函数名</div>
                          <div className="font-mono text-sm text-orange-300">{selectedNode.name}</div>
                        </div>
                        {selectedNode.file && (
                          <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">文件</div>
                            <div className="font-mono text-xs text-slate-300">{selectedNode.file}</div>
                          </div>
                        )}
                        {selectedNode.module && (
                          <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">模块</div>
                            <Badge variant="outline" className={`text-xs ${
                              selectedNode.module === 'innodb' ? 'border-orange-500/50 text-orange-400' : 'border-blue-500/50 text-blue-400'
                            }`}>
                              {selectedNode.module === 'innodb' ? 'InnoDB Engine' : 'SQL Layer'}
                            </Badge>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-red-500/10">
                            <div className="text-xs text-slate-400 mb-1">总占比</div>
                            <div className="text-xl font-bold text-red-400">{totalPct}%</div>
                            <div className="text-xs text-slate-500">{selectedNode.value} 采样</div>
                          </div>
                          {selfPct && (
                            <div className="p-3 rounded-lg bg-orange-500/10">
                              <div className="text-xs text-slate-400 mb-1">自身占比</div>
                              <div className="text-xl font-bold text-orange-400">{selfPct}%</div>
                              <div className="text-xs text-slate-500">{selectedNode.selfValue} 采样</div>
                            </div>
                          )}
                        </div>
                        {selectedNode.children && selectedNode.children.length > 0 && (
                          <div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">子调用</div>
                            <div className="space-y-1">
                              {selectedNode.children.sort((a, b) => b.value - a.value).map((child, idx) => (
                                <div key={idx} className="flex items-center justify-between px-2 py-1.5 rounded bg-slate-800/50 text-xs">
                                  <span className="font-mono text-slate-300 truncate flex-1 mr-2">{child.name}</span>
                                  <span className="text-slate-400 flex-shrink-0">
                                    {((child.value / totalValue) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                        <Flame className="w-12 h-12 mb-3 opacity-50" />
                        <p className="text-sm">点击火焰图中的函数查看详情</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Insights & Optimizations */}
                <div className="space-y-6">
                  <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        热点分析
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedScenario.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                            <Zap className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-green-400" />
                        优化建议
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selectedScenario.optimizations.map((opt, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                            <ArrowRight className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Workload Info */}
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400" />
                    采集命令
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-2">压测负载</div>
                      <div className="bg-slate-950 rounded p-3 font-mono text-xs flex items-center justify-between group">
                        <span className="text-cyan-400">$ {selectedScenario.workload}</span>
                        <button onClick={() => handleCopyCommand(selectedScenario.workload)} className="opacity-0 group-hover:opacity-100">
                          <Copy className={`w-3.5 h-3.5 ${copiedCmd === selectedScenario.workload ? 'text-green-400' : 'text-slate-500'}`} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-2">perf 采集</div>
                      <div className="bg-slate-950 rounded p-3 font-mono text-xs flex items-center justify-between group">
                        <span className="text-green-400">$ {selectedScenario.command}</span>
                        <button onClick={() => handleCopyCommand(selectedScenario.command)} className="opacity-0 group-hover:opacity-100">
                          <Copy className={`w-3.5 h-3.5 ${copiedCmd === selectedScenario.command ? 'text-green-400' : 'text-slate-500'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 工具链教程 Tab */}
          <TabsContent value="tutorial">
            <div className="space-y-6">
              <Card className="bg-blue-900/20 border-blue-500/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    火焰图分析方法论
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
                    <div>
                      <h4 className="font-medium text-white mb-2">1. 如何阅读火焰图</h4>
                      <ul className="space-y-1 text-xs text-slate-400">
                        <li>- x 轴表示采样比例（越宽 = CPU 占用越多）</li>
                        <li>- y 轴表示调用栈深度（从底到顶）</li>
                        <li>- 颜色区分模块（蓝 = SQL层，橙 = InnoDB）</li>
                        <li>- 自身时间 vs 总时间的区别</li>
                        <li>- 平顶 = 真正的热点函数</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-2">2. 分析思路</h4>
                      <ul className="space-y-1 text-xs text-slate-400">
                        <li>- 先看最宽的函数（CPU 占比最大）</li>
                        <li>- 区分 SQL 层 vs 存储引擎层热点</li>
                        <li>- 关注锁竞争相关函数</li>
                        <li>- 对比不同场景的火焰图差异</li>
                        <li>- 使用差异火焰图定位回归</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-2">3. 常见热点函数</h4>
                      <ul className="space-y-1 text-xs text-slate-400">
                        <li>- <code className="text-cyan-400">btr_cur_search_to_nth_level</code>: B+树搜索</li>
                        <li>- <code className="text-cyan-400">buf_page_get_gen</code>: 缓冲池页面获取</li>
                        <li>- <code className="text-cyan-400">lock_rec_lock</code>: 行级锁</li>
                        <li>- <code className="text-cyan-400">log_write_up_to</code>: redo log 写入</li>
                        <li>- <code className="text-cyan-400">mysql_parse</code>: SQL 解析</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {perfCommands.map((cmd) => (
                  <Card key={cmd.id} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{cmd.title}</CardTitle>
                      <p className="text-xs text-slate-400">{cmd.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs flex items-center justify-between group">
                        <span className="text-green-400 truncate mr-2">$ {cmd.command}</span>
                        <button
                          onClick={() => handleCopyCommand(cmd.command)}
                          className="opacity-0 group-hover:opacity-100 flex-shrink-0"
                        >
                          <Copy className={`w-3.5 h-3.5 ${copiedCmd === cmd.command ? 'text-green-400' : 'text-slate-500'}`} />
                        </button>
                      </div>
                      <div className="bg-slate-950/50 rounded p-3 font-mono text-xs space-y-0.5">
                        {cmd.output.map((line, idx) => (
                          <div key={idx} className={line.startsWith('#') ? 'text-slate-500' : 'text-amber-300'}>
                            {line}
                          </div>
                        ))}
                      </div>
                      <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-300">{cmd.explanation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
