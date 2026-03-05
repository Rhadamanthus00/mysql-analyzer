import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, GitBranch, FileCode, X, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { callHierarchyData, CallNode, getCallHierarchy } from '@/data/callHierarchy'
import { sourceCodeData } from '@/data/sourceCode'

interface CallHierarchyPanelProps {
  functionName: string
  file: string
  onNavigateToFile: (file: string, line: number) => void
  onClose: () => void
}

type ViewMode = 'callers' | 'callees' | 'both'

export default function CallHierarchyPanel({ 
  functionName, 
  file, 
  onNavigateToFile, 
  onClose 
}: CallHierarchyPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  
  const hierarchy = getCallHierarchy(functionName)
  
  if (!hierarchy) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-purple-500" />
              调用层次
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无调用层次数据</p>
            <p className="text-xs mt-1">当前函数未记录在调用关系数据库中</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  const handleNodeClick = (node: CallNode) => {
    onNavigateToFile(node.file, node.line)
  }

  const renderNode = (node: CallNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = viewMode === 'both' || (viewMode === 'callers' && node.type === 'callee')
    
    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => handleNodeClick(node)}
          className={`flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-all border-l-2 ${
            node.type === 'current' 
              ? 'border-purple-500 bg-purple-500/10' 
              : node.type === 'caller'
              ? 'border-blue-500/50 hover:border-blue-500'
              : 'border-green-500/50 hover:border-green-500'
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {/* Icon based on type */}
          <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
            node.type === 'current'
              ? 'bg-purple-500/20'
              : node.type === 'caller'
              ? 'bg-blue-500/20'
              : 'bg-green-500/20'
          }`}>
            {node.type === 'current' ? (
              <GitBranch className="w-3 h-3 text-purple-400" />
            ) : node.type === 'caller' ? (
              <ArrowUp className="w-3 h-3 text-blue-400" />
            ) : (
              <ArrowDown className="w-3 h-3 text-green-400" />
            )}
          </div>

          {/* Function Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-mono text-sm font-medium ${
                node.type === 'current' 
                  ? 'text-purple-300' 
                  : node.type === 'caller'
                  ? 'text-blue-300'
                  : 'text-green-300'
              }`}>
                {node.name}
              </span>
              {node.type === 'current' && (
                <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                  当前
                </Badge>
              )}
              {node.type === 'caller' && (
                <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                  调用者
                </Badge>
              )}
              {node.type === 'callee' && (
                <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                  被调用
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileCode className="w-3 h-3" />
              <span className="font-mono truncate">{node.file.split('/').pop()}</span>
              <span className="text-slate-600">:</span>
              <span className="text-slate-400">第 {node.line} 行</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderHierarchy = () => {
    if (viewMode === 'both') {
      return (
        <div className="space-y-4">
          {/* Callers Section */}
          {hierarchy.callers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-3">
                <ArrowUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">调用者 (Callers)</span>
                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                  {hierarchy.callers.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {hierarchy.callers.map(node => renderNode(node, 0))}
              </div>
            </div>
          )}

          {/* Current Function */}
          <div>
            {renderNode({
              id: 'current',
              name: hierarchy.functionName,
              file: hierarchy.file,
              line: hierarchy.line,
              type: 'current',
              level: 0
            }, 0)}
          </div>

          {/* Callees Section */}
          {hierarchy.callees.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-3">
                <ArrowDown className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">被调用者 (Callees)</span>
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                  {hierarchy.callees.length}
                </Badge>
              </div>
              <div className="space-y-1">
                {hierarchy.callees.map(node => renderNode(node, 0))}
              </div>
            </div>
          )}
        </div>
      )
    } else if (viewMode === 'callers') {
      return (
        <div className="space-y-1">
          {hierarchy.callers.map(node => renderNode(node, 0))}
        </div>
      )
    } else {
      return (
        <div className="space-y-1">
          {hierarchy.callees.map(node => renderNode(node, 0))}
        </div>
      )
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2 mb-2">
              <GitBranch className="w-4 h-4 text-purple-500" />
              调用层次
            </CardTitle>
            <div className="text-xs text-slate-400 font-mono truncate">
              {hierarchy.functionName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={viewMode === 'both' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('both')}
            className={`text-xs h-7 ${
              viewMode === 'both'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            全部
          </Button>
          <Button
            variant={viewMode === 'callers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('callers')}
            className={`text-xs h-7 ${
              viewMode === 'callers'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ArrowUp className="w-3 h-3 mr-1" />
            调用者
          </Button>
          <Button
            variant={viewMode === 'callees' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('callees')}
            className={`text-xs h-7 ${
              viewMode === 'callees'
                ? 'bg-green-600 hover:bg-green-700'
                : 'border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ArrowDown className="w-3 h-3 mr-1" />
            被调用者
          </Button>
        </div>
      </CardHeader>

      <CardContent className="max-h-[400px] overflow-y-auto">
        {renderHierarchy()}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-blue-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">
                {hierarchy.callers.length}
              </div>
              <div className="text-xs text-slate-400">调用者</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-400">
                {hierarchy.callees.length}
              </div>
              <div className="text-xs text-slate-400">被调用者</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
