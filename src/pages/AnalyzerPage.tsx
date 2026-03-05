import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, Database, Code2, ChevronRight, BookOpen, Terminal } from 'lucide-react'
import { executionFlow, learningPaths as execLearningPaths, gdbSessions } from '@/data/executionFlow'
import SourceCodeViewer from '@/components/SourceCodeViewer'
import type { Route } from '@/App'

interface AnalyzerPageProps {
  onNavigate: (route: Route) => void
}

export default function AnalyzerPage({ onNavigate }: AnalyzerPageProps) {
  const [isSourceViewerOpen, setIsSourceViewerOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState(executionFlow[0])
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [initialFile, setInitialFile] = useState<string | undefined>(undefined)

  const stageColors = [
    'border-blue-500 bg-blue-500/10',
    'border-cyan-500 bg-cyan-500/10',
    'border-teal-500 bg-teal-500/10',
    'border-green-500 bg-green-500/10',
    'border-yellow-500 bg-yellow-500/10',
    'border-amber-500 bg-amber-500/10',
    'border-orange-500 bg-orange-500/10',
    'border-red-500 bg-red-500/10',
    'border-pink-500 bg-pink-500/10',
    'border-purple-500 bg-purple-500/10',
  ]

  const stageNumColors = [
    'bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-green-500', 'bg-yellow-500',
    'bg-amber-500', 'bg-orange-500', 'bg-red-500', 'bg-pink-500', 'bg-purple-500',
  ]

  const openSourceViewer = (file?: string) => {
    setInitialFile(file)
    setIsSourceViewerOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-7 w-7 text-blue-400" />
              <h1 className="text-xl font-bold">SQL 分析器</h1>
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
          {/* Left Panel - Execution Flow */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">执行流程</CardTitle>
                <p className="text-xs text-slate-400">SELECT * FROM users WHERE id = 1</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                  {executionFlow.map((node, idx) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                        selectedNode.id === node.id
                          ? stageColors[idx % stageColors.length]
                          : 'border-slate-700/50 hover:border-slate-600 bg-slate-800/30'
                      }`}
                    >
                      <div className={`w-8 h-8 ${stageNumColors[idx % stageNumColors.length]} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                        <span className="text-xs font-bold text-white">{node.id}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{node.name}</div>
                      </div>
                      {selectedNode.id === node.id && (
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Node Details */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedNode.name}</CardTitle>
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-xs">
                    阶段 {selectedNode.id}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">{selectedNode.description}</p>

                {/* Source Files */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">源文件</h4>
                  <div className="space-y-1">
                    {selectedNode.sourceFiles.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => openSourceViewer(file)}
                        className="flex items-center gap-2 w-full text-left px-3 py-2 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="font-mono text-xs text-slate-300 truncate">{file}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Key Functions */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">关键函数</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.keyFunctions.map((fn, idx) => (
                      <Badge key={idx} variant="outline" className="font-mono text-xs border-slate-600 text-slate-300">
                        {fn}()
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* GDB Breakpoints */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">GDB 断点</h4>
                  <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs">
                    {selectedNode.gdbBreakpoints.map((bp, idx) => (
                      <div key={idx} className="text-green-400">
                        <span className="text-slate-500">(gdb) </span>break {bp}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-300">{selectedNode.notes}</p>
                </div>
              </CardContent>
            </Card>

            {/* Learning Paths */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  学习路径
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {execLearningPaths.map((path) => (
                    <div
                      key={path.id}
                      onClick={() => setSelectedPath(selectedPath === path.id ? null : path.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPath === path.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{path.title}</span>
                        <Badge className={
                          path.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                          path.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                          'bg-red-500/20 text-red-300 border-red-500/30'
                        }>
                          {path.difficulty === 'beginner' ? '初级' : path.difficulty === 'intermediate' ? '中级' : '高级'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{path.description}</p>
                      <div className="text-xs text-slate-500">{path.estimatedTime} · {path.nodes.length} 个节点</div>
                      {selectedPath === path.id && (
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <div className="flex flex-wrap gap-1">
                            {path.nodes.map((nodeId) => {
                              const node = executionFlow.find(n => n.id === nodeId)
                              return node ? (
                                <Badge
                                  key={nodeId}
                                  variant="outline"
                                  className="text-xs border-slate-600 text-slate-300 cursor-pointer hover:bg-slate-700"
                                  onClick={(e) => { e.stopPropagation(); setSelectedNode(node) }}
                                >
                                  {nodeId}. {node.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* GDB Sessions */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-green-400" />
                  GDB 调试会话
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {gdbSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-lg border border-slate-700 bg-slate-800/30 hover:border-slate-600 transition-all"
                    >
                      <h4 className="font-semibold text-sm mb-1">{session.name}</h4>
                      <p className="text-xs text-slate-400 mb-2">{session.description}</p>
                      <div className="bg-slate-950 rounded p-2 font-mono text-xs">
                        {session.expectedOutput.slice(0, 2).map((line, idx) => (
                          <div key={idx} className="text-green-400 truncate">{line}</div>
                        ))}
                      </div>
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
        initialFile={initialFile}
      />
    </div>
  )
}
