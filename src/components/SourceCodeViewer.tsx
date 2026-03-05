import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Search, 
  FileCode, 
  Folder, 
  FolderOpen, 
  ChevronRight,
  ChevronDown,
  File,
  Maximize2,
  Minimize2,
  Copy
} from 'lucide-react'
import { sourceCodeData } from '@/data/sourceCode'

interface SourceCodeViewerProps {
  isOpen: boolean
  onClose: () => void
  initialFile?: string
}

interface FileNode {
  path: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  language?: string
}

export default function SourceCodeViewer({ isOpen, onClose, initialFile }: SourceCodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(initialFile || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['sql', 'storage']))
  const [isFullscreen, setIsFullscreen] = useState(false)

  const sourceFile = selectedFile ? sourceCodeData[selectedFile] : null

  // 构建文件树
  const fileTree: FileNode[] = useMemo(() => {
    const tree: Record<string, FileNode> = {}
    
    Object.entries(sourceCodeData).forEach(([path, file]) => {
      const parts = path.split('/')
      let current: Record<string, FileNode> = tree
      
      parts.forEach((part, idx) => {
        const isLast = idx === parts.length - 1
        
        if (!current[part]) {
          current[part] = {
            path: isLast ? path : parts.slice(0, idx + 1).join('/'),
            name: part,
            type: isLast ? 'file' : 'folder',
            children: isLast ? undefined : {},
            language: isLast ? file.language : undefined
          }
        }
        
        if (!isLast && current[part].children) {
          current = current[part].children as Record<string, FileNode>
        }
      })
    })
    
    return Object.values(tree).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }, [])

  // 搜索功能
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const results: { path: string; line: number; content: string }[] = []
    Object.entries(sourceCodeData).forEach(([path, file]) => {
      const lines = file.content.split('\n')
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ path, line: idx + 1, content: line.trim() })
        }
      })
    })
    return results.slice(0, 50)
  }, [searchQuery])

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map(node => {
      if (node.type === 'folder' && node.children) {
        const isExpanded = expandedFolders.has(node.path)
        return (
          <div key={node.path}>
            <div
              onClick={() => toggleFolder(node.path)}
              className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 cursor-pointer rounded transition-colors`}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-yellow-400" />
              ) : (
                <Folder className="w-4 h-4 text-yellow-400" />
              )}
              <span className="text-sm text-slate-300">{node.name}</span>
            </div>
            {isExpanded && renderFileTree(Object.values(node.children), depth + 1)}
          </div>
        )
      } else {
        const isSelected = selectedFile === node.path
        return (
          <div
            key={node.path}
            onClick={() => setSelectedFile(node.path)}
            className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-800/50 cursor-pointer rounded transition-colors ${
              isSelected ? 'bg-blue-500/20 border-l-2 border-blue-500' : ''
            }`}
            style={{ paddingLeft: `${depth * 16 + 28}px` }}
          >
            <FileCode className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300 truncate flex-1">{node.name}</span>
            {node.language && (
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                {node.language}
              </Badge>
            )}
          </div>
        )
      }
    })
  }

  // 语法高亮
  const highlightCode = (code: string) => {
    let highlighted = code
    
    // 注释
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, '<span class="text-green-500">$1</span>')
    
    // 关键字
    const keywords = ['int', 'void', 'bool', 'class', 'struct', 'if', 'else', 'for', 'while', 'return', 'break', 'case', 'switch', 'default', 'const', 'static', 'extern', 'true', 'false', 'NULL']
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
      highlighted = highlighted.replace(regex, '<span class="text-pink-400">$1</span>')
    })
    
    // 类型
    const types = ['THD', 'LEX', 'JOIN', 'uint', 'ulong', 'uchar']
    types.forEach(type => {
      const regex = new RegExp(`\\b(${type})\\b`, 'g')
      highlighted = highlighted.replace(regex, '<span class="text-yellow-400">$1</span>')
    })
    
    // 字符串
    highlighted = highlighted.replace(/(".*?")/g, '<span class="text-orange-400">$1</span>')
    
    // 函数调用
    highlighted = highlighted.replace(/(\w+)\s*\(/g, '<span class="text-blue-300">$1</span>(')
    
    return highlighted
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={`w-full bg-slate-900 border-slate-700 flex flex-col ${isFullscreen ? 'h-[95vh]' : 'max-h-[90vh]'}`}>
        {/* Header */}
        <CardHeader className="border-b border-slate-700 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-blue-500" />
              <div>
                <CardTitle className="text-lg">MySQL 源码浏览器</CardTitle>
                <p className="text-xs text-slate-400">MySQL 8.0.24 源代码</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-slate-400 hover:text-slate-200"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="搜索代码..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 text-xs text-slate-400">
                找到 {searchResults.length} 个结果
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 overflow-hidden flex">
          {/* Sidebar - File Tree */}
          <div className="w-72 border-r border-slate-700 bg-slate-950/30 flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-slate-700">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">文件</div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {renderFileTree(fileTree)}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {sourceFile ? (
              <>
                {/* File Info */}
                <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-xs">
                      {sourceFile.language.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-slate-400 font-mono truncate">
                      {sourceFile.path}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {sourceFile.content.split('\n').length} 行
                    </span>
                  </div>
                </div>

                {/* Code View */}
                <div className="flex-1 overflow-auto">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-700">
                    <p className="text-sm text-slate-400">{sourceFile.description}</p>
                  </div>
                  <pre className="m-0 p-0 font-mono text-sm bg-slate-950">
                    <code>
                      {sourceFile.content.split('\n').map((line, idx) => (
                        <div
                          key={idx}
                          className="flex hover:bg-slate-800/50"
                        >
                          <span className="inline-block w-16 text-right pr-4 text-slate-600 select-none border-r border-slate-800">
                            {(idx + 1).toString().padStart(4, ' ')}
                          </span>
                          <span 
                            className="flex-1 px-4 py-0.5"
                            dangerouslySetInnerHTML={{ __html: highlightCode(line) || ' ' }}
                          />
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">选择一个文件开始浏览</p>
                  <p className="text-sm">从左侧文件树中选择要查看的源代码文件</p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="w-96 border-l border-slate-700 bg-slate-950/30 flex flex-col flex-shrink-0 overflow-hidden">
                <div className="p-3 border-b border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">搜索结果</div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedFile(result.path)}
                      className="px-3 py-2 hover:bg-slate-800/50 cursor-pointer border-b border-slate-800/50"
                    >
                      <div className="text-xs font-mono text-blue-300 truncate mb-1">
                        {result.path.split('/').pop()}
                      </div>
                      <div className="text-xs text-slate-500 mb-1">
                        行 {result.line}
                      </div>
                      <div className="text-xs text-slate-400 truncate font-mono">
                        {result.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
