import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Cpu, Activity, FileCode, Clock, Zap, ChevronRight } from 'lucide-react'
import { masterThreadWork, masterThreadFlow, callGraphs } from '@/data/navigationData'
import SourceCodeViewer from '@/components/SourceCodeViewer'
import type { Route } from '@/App'

interface MasterThreadPageProps {
  onNavigate: (route: Route) => void
}

export default function MasterThreadPage({ onNavigate }: MasterThreadPageProps) {
  const [isSourceViewerOpen, setIsSourceViewerOpen] = useState(false)
  const [selectedWork, setSelectedWork] = useState(masterThreadWork[0])
  const [activeFlowNode, setActiveFlowNode] = useState<string>('master')

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-300 border-green-500/30'
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const priorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '高优先级'
      case 'medium': return '中优先级'
      case 'low': return '低优先级'
      default: return ''
    }
  }

  const nodeTypeColor = (type: string) => {
    switch (type) {
      case 'process': return 'bg-blue-600 border-blue-500'
      case 'event': return 'bg-orange-600 border-orange-500'
      case 'resource': return 'bg-purple-600 border-purple-500'
      default: return 'bg-slate-600 border-slate-500'
    }
  }

  // Master thread call graph
  const masterCallGraph = callGraphs['master-thread']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cpu className="h-7 w-7 text-orange-400" />
              <h1 className="text-xl font-bold">Master 线程</h1>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Flow Visualization */}
          <div className="lg:col-span-1 space-y-6">
            {/* Interactive Flow */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  动态交互
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {masterThreadFlow.map((node) => (
                    <div
                      key={node.id}
                      onClick={() => setActiveFlowNode(node.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                        activeFlowNode === node.id
                          ? `${nodeTypeColor(node.type)} bg-opacity-20 border`
                          : 'hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        activeFlowNode === node.id ? 'bg-orange-400 animate-pulse' :
                        node.type === 'process' ? 'bg-blue-400' :
                        node.type === 'event' ? 'bg-orange-400' : 'bg-purple-400'
                      }`} />
                      <span className="text-sm flex-1">{node.label}</span>
                      <Badge variant="outline" className="text-xs border-slate-600 text-slate-500">
                        {node.type === 'process' ? '流程' : node.type === 'event' ? '事件' : '资源'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle & Right Panels */}
          <div className="lg:col-span-2 space-y-6">
            {/* Work Items */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">工作场景</CardTitle>
                <p className="text-xs text-slate-400">Master 线程的核心任务和触发机制</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {masterThreadWork.map((work) => (
                    <div
                      key={work.id}
                      onClick={() => setSelectedWork(work)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedWork.id === work.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{work.name}</h4>
                        <Badge className={priorityColor(work.priority)}>
                          {priorityLabel(work.priority)}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{work.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {work.trigger}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {work.interval}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Work Detail */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedWork.name} - 详情</CardTitle>
                  <Badge className={priorityColor(selectedWork.priority)}>
                    {priorityLabel(selectedWork.priority)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm">{selectedWork.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <div className="text-xs text-slate-500 mb-1">触发方式</div>
                      <div className="text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        {selectedWork.trigger}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50">
                      <div className="text-xs text-slate-500 mb-1">执行间隔</div>
                      <div className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        {selectedWork.interval}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">相关函数</div>
                    <div className="space-y-1">
                      {selectedWork.relatedFunctions.map((fn, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800/50">
                          <FileCode className="w-3.5 h-3.5 text-orange-400" />
                          <span className="font-mono text-xs text-slate-300">{fn}()</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => setIsSourceViewerOpen(true)}
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    查看源码
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Call Graph for Master Thread */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  Master 线程调用链
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {masterCallGraph.map((node) => (
                    <div key={node.id} className="space-y-1">
                      <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50">
                        <Activity className="w-4 h-4 text-orange-400" />
                        <span className="font-mono text-sm text-orange-300">{node.name}</span>
                        <span className="text-xs text-slate-500 ml-auto">{node.file}</span>
                      </div>
                      {node.children && node.children.map((child) => (
                        <div key={child.id} className="space-y-1">
                          <div className="flex items-center gap-2 p-2 rounded bg-slate-800/30 ml-6">
                            <ChevronRight className="w-3 h-3 text-slate-500" />
                            <span className="font-mono text-xs text-slate-300">{child.name}</span>
                            <span className="text-xs text-slate-500 ml-auto">{child.file}</span>
                          </div>
                          {child.children && child.children.map((grandchild) => (
                            <div key={grandchild.id} className="flex items-center gap-2 p-2 rounded bg-slate-800/20 ml-12">
                              <ChevronRight className="w-3 h-3 text-slate-600" />
                              <span className="font-mono text-xs text-slate-400">{grandchild.name}</span>
                              <span className="text-xs text-slate-600 ml-auto">{grandchild.file}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Source Code Viewer */}
      <SourceCodeViewer
        isOpen={isSourceViewerOpen}
        onClose={() => setIsSourceViewerOpen(false)}
      />
    </div>
  )
}
