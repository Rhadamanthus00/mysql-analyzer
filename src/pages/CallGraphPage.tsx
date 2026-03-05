import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, GitBranch, FileCode, ChevronRight, ChevronDown } from 'lucide-react'
import { callGraphs, type CallGraphNode } from '@/data/navigationData'
import SourceCodeViewer from '@/components/SourceCodeViewer'
import type { Route } from '@/App'

interface CallGraphPageProps {
  onNavigate: (route: Route) => void
}

function TreeNode({ node, level = 0, selectedNode, onSelect }: {
  node: CallGraphNode
  level?: number
  selectedNode: CallGraphNode | null
  onSelect: (node: CallGraphNode) => void
}) {
  const [expanded, setExpanded] = useState(level < 2)
  const isSelected = selectedNode?.id === node.id
  const hasChildren = node.children && node.children.length > 0

  const typeColor = node.type === 'function'
    ? 'text-blue-400'
    : node.type === 'class'
    ? 'text-yellow-400'
    : 'text-green-400'

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-all ${
          isSelected
            ? 'bg-blue-500/20 border-l-2 border-blue-500'
            : 'hover:bg-slate-800/50'
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
            className="text-slate-500 hover:text-slate-300 flex-shrink-0"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-3.5" />
        )}
        <GitBranch className={`w-3.5 h-3.5 flex-shrink-0 ${typeColor}`} />
        <span className={`font-mono text-sm ${typeColor}`}>{node.name}</span>
        {node.type !== 'function' && (
          <Badge variant="outline" className="text-xs border-slate-600 text-slate-500 ml-1">
            {node.type}
          </Badge>
        )}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedNode={selectedNode}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CallGraphPage({ onNavigate }: CallGraphPageProps) {
  const [isSourceViewerOpen, setIsSourceViewerOpen] = useState(false)
  const [activeGraph, setActiveGraph] = useState<'query-execution' | 'master-thread'>('query-execution')
  const [selectedNode, setSelectedNode] = useState<CallGraphNode | null>(null)

  const currentGraph = callGraphs[activeGraph]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GitBranch className="h-7 w-7 text-green-400" />
              <h1 className="text-xl font-bold">调用图</h1>
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
        {/* Graph Selector */}
        <div className="flex gap-3 mb-6">
          <Button
            variant={activeGraph === 'query-execution' ? 'default' : 'outline'}
            onClick={() => { setActiveGraph('query-execution'); setSelectedNode(null) }}
            className={activeGraph === 'query-execution'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }
          >
            查询执行流程
          </Button>
          <Button
            variant={activeGraph === 'master-thread' ? 'default' : 'outline'}
            onClick={() => { setActiveGraph('master-thread'); setSelectedNode(null) }}
            className={activeGraph === 'master-thread'
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }
          >
            Master 线程
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Tree View */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">调用树</CardTitle>
              <p className="text-xs text-slate-400">
                {activeGraph === 'query-execution' ? '查询执行的函数调用链' : 'Master 线程的函数调用链'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="max-h-[65vh] overflow-y-auto">
                {currentGraph.map((rootNode) => (
                  <TreeNode
                    key={rootNode.id}
                    node={rootNode}
                    selectedNode={selectedNode}
                    onSelect={setSelectedNode}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel - Details */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">节点详情</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">函数名</div>
                    <div className="font-mono text-sm text-blue-300">{selectedNode.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">类型</div>
                    <Badge variant="outline" className={`text-xs ${
                      selectedNode.type === 'function' ? 'border-blue-500/50 text-blue-400' :
                      selectedNode.type === 'class' ? 'border-yellow-500/50 text-yellow-400' :
                      'border-green-500/50 text-green-400'
                    }`}>
                      {selectedNode.type}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">文件</div>
                    <div className="font-mono text-sm text-slate-300">{selectedNode.file}</div>
                  </div>
                  {selectedNode.line && (
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">行号</div>
                      <div className="text-sm text-slate-300">第 {selectedNode.line} 行</div>
                    </div>
                  )}
                  {selectedNode.children && selectedNode.children.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">调用的函数</div>
                      <div className="space-y-1">
                        {selectedNode.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => setSelectedNode(child)}
                            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                          >
                            <GitBranch className="w-3.5 h-3.5 text-green-400" />
                            <span className="font-mono text-xs text-slate-300">{child.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setIsSourceViewerOpen(true)}
                  >
                    <FileCode className="w-4 h-4 mr-2" />
                    查看源码
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <GitBranch className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm">点击左侧调用树中的节点查看详情</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Source Code Viewer */}
      <SourceCodeViewer
        isOpen={isSourceViewerOpen}
        onClose={() => setIsSourceViewerOpen(false)}
        initialFile={selectedNode?.file}
      />
    </div>
  )
}
