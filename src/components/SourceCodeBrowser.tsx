import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  X, 
  Copy, 
  Download, 
  Maximize2, 
  Search, 
  FileCode, 
  Folder, 
  FolderOpen, 
  ChevronRight,
  ChevronDown,
  FileText,
  FileJson,
  Settings,
  BookOpen,
  File,
  GitBranch
} from 'lucide-react'
import { sourceCodeData } from '@/data/sourceCode'
import CallHierarchyPanel from '@/components/CallHierarchyPanel'
import { findFunctionCallLines, extractFunctionNames } from '@/data/callHierarchy'

interface SourceCodeBrowserProps {
  filePath?: string
  isOpen: boolean
  onClose: () => void
}

interface FileNode {
  path: string
  name: string
  type: 'file' | 'folder'
  children?: FileNode[]
  language?: string
}

export default function SourceCodeBrowser({ filePath, isOpen, onClose }: SourceCodeBrowserProps) {
  const [copied, setCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['sql', 'storage']))
  const [selectedFile, setSelectedFile] = useState<string | null>(filePath || null)
  const [searchResults, setSearchResults] = useState<{ path: string; line: number; content: string }[]>([])
  const [showCallHierarchy, setShowCallHierarchy] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null)
  const [highlightedLines, setHighlightedLines] = useState<Set<number>>(new Set())
  const codeContainerRef = useRef<HTMLDivElement>(null)

  const sourceFile = selectedFile ? sourceCodeData[selectedFile] : null
  const lines = sourceFile?.content.split('\n') || []
  const functionNames = sourceFile ? extractFunctionNames(sourceFile.content) : []

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  useEffect(() => {
    if (searchQuery.trim()) {
      const results: { path: string; line: number; content: string }[] = []
      Object.entries(sourceCodeData).forEach(([path, file]) => {
        const lines = file.content.split('\n')
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
            results.push({ path, line: idx + 1, content: line.trim() })
          }
        })
      })
      setSearchResults(results.slice(0, 100)) // 限制结果数量
    } else {
      setSearchResults([])
    }
  }, [searchQuery])



  if (!isOpen) {
    return null
  }

  const handleCopy = () => {
    if (sourceFile) {
      navigator.clipboard.writeText(sourceFile.content)
      setCopied(true)
    }
  }

  const handleDownload = () => {
    if (sourceFile) {
      const blob = new Blob([sourceFile.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = sourceFile.path.split('/').pop() || 'source.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleFunctionClick = (functionName: string, line: number) => {
    setSelectedFunction(functionName)
    setShowCallHierarchy(true)
    
    // 高亮包含函数调用的行
    if (sourceFile) {
      const callLines = findFunctionCallLines(sourceFile.content, functionName)
      setHighlightedLines(new Set(callLines))
    }
  }

  const handleNavigateToFile = (file: string, line: number) => {
    setSelectedFile(file)
    setShowCallHierarchy(false)
    setSelectedFunction(null)
    setHighlightedLines(new Set())
    
    // 滚动到指定行
    setTimeout(() => {
      const lineElement = document.querySelector(`[data-line="${line}"]`)
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleCloseHierarchy = () => {
    setShowCallHierarchy(false)
    setSelectedFunction(null)
    setHighlightedLines(new Set())
  }

  const getLanguageColor = (lang: string) => {
    switch (lang) {
      case 'cpp': return 'text-blue-400'
      case 'c': return 'text-cyan-400'
      case 'h': return 'text-purple-400'
      case 'yy': return 'text-orange-400'
      case 'cc': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const getFileIcon = (name: string) => {
    if (name.endsWith('.cc') || name.endsWith('.cpp')) return <FileCode className="w-4 h-4 text-blue-400" />
    if (name.endsWith('.h')) return <FileCode className="w-4 h-4 text-purple-400" />
    if (name.endsWith('.yy')) return <FileCode className="w-4 h-4 text-orange-400" />
    return <File className="w-4 h-4 text-gray-400" />
  }

  const highlightCode = (code: string, lineIndex: number) => {
    let highlighted = code
    
    // 注释
    highlighted = highlighted.replace(/(\/\*[\s\S]*?\*\/|\/\/.*$)/gm, '<span class="text-green-500">$1</span>')
    
    // 关键字
    const keywords = ['int', 'void', 'bool', 'class', 'struct', 'enum', 'if', 'else', 'for', 'while', 'return', 'break', 'case', 'switch', 'default', 'const', 'static', 'extern', 'bool', 'true', 'false', 'NULL', 'DBUG_ENTER', 'DBUG_RETURN', 'DBUG_VOID_RETURN', 'DBUG_PRINT']
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'g')
      highlighted = highlighted.replace(regex, '<span class="text-pink-400">$1</span>')
    })
    
    // 类型
    const types = ['THD', 'LEX', 'JOIN', 'POSITION', 'QEP_TAB', 'dict_table_t', 'trx_t', 'uchar', 'uint', 'ulong', 'my_bool', 'my_error', 'ha_innodb']
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
        
        if (!isLast) {
          current = (current[part].children || {}) as Record<string, FileNode>
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
              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800/50 cursor-pointer rounded transition-colors`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500" />
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
            className={`flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800/50 cursor-pointer rounded transition-colors ${
              isSelected ? 'bg-blue-500/20 border-l-2 border-blue-500' : ''
            }`}
            style={{ paddingLeft: `${depth * 12 + 20}px` }}
          >
            {getFileIcon(node.name)}
            <span className="text-sm text-slate-300 truncate">{node.name}</span>
          </div>
        )
      }
    })
  }

  // 处理代码行点击事件
  const handleCodeLineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const lineDiv = target.closest('[data-line]') as HTMLElement
    if (lineDiv && sourceFile) {
      const lineNumber = parseInt(lineDiv.getAttribute('data-line') || '0')
      if (lineNumber > 0) {
        const lineContent = lines[lineNumber - 1]
        // 检查是否是函数定义行
        const functionName = functionNames.find(fn => {
          const pattern = new RegExp(`\\b${fn}\\s*\\(`)
          return pattern.test(lineContent)
        })
        
        if (functionName) {
          handleFunctionClick(functionName, lineNumber)
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] bg-slate-900 border-slate-700 flex flex-col">
        {/* Header */}
        <CardHeader className="border-b border-slate-700 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 mb-2">
                <FileCode className="w-5 h-5 text-orange-500" />
                MySQL 源码浏览器
              </CardTitle>
              <p className="text-sm text-slate-400">浏览和分析 MySQL 8.0.24 源代码</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="在所有文件中搜索..."
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
          <div className="w-64 border-r border-slate-700 bg-slate-950/50 flex flex-col">
            <div className="p-3 border-b border-slate-700">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">文件浏览器</div>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {renderFileTree(fileTree)}
            </div>
          </div>

          {/* Main Content - Code View */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {sourceFile ? (
              <>
                {/* File Info Bar */}
                <div className="px-4 py-2 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-orange-500/50 text-orange-400 text-xs">
                      {sourceFile.language.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-slate-400 font-mono truncate max-w-md">
                      {sourceFile.path}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCallHierarchy(!showCallHierarchy)}
                      className={`border-slate-600 text-slate-300 hover:bg-slate-700 h-8 ${
                        showCallHierarchy ? 'bg-purple-500/20 border-purple-500/50' : ''
                      }`}
                    >
                      <GitBranch className="w-3.5 h-3.5 mr-1.5" />
                      {showCallHierarchy ? '关闭调用层次' : '调用层次'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      {copied ? '已复制' : '复制'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 h-8"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      下载
                    </Button>
                  </div>
                </div>

                {/* Code Content */}
                <div className="flex-1 overflow-auto">
                  <div className="px-4 py-2 bg-slate-900 border-b border-slate-700">
                    <p className="text-sm text-slate-400">{sourceFile.description}</p>
                  </div>
                  <pre className="m-0 p-4 font-mono text-sm bg-slate-950" ref={codeContainerRef} onClick={handleCodeLineClick}>
                    <code
                      dangerouslySetInnerHTML={{
                        __html: lines.map((line, idx) => {
                          const lineNum = (idx + 1).toString()
                          const lineNumber = idx + 1
                          const isHighlighted = highlightedLines.has(lineNumber)
                          const highlightedLine = highlightCode(line)
                          
                          // 检查是否是函数定义行
                          const isFunctionLine = functionNames.some(fn => {
                            const pattern = new RegExp(`\\b${fn}\\s*\\(`)
                            return pattern.test(line)
                          })
                          
                          return `<div 
                            class="flex hover:bg-slate-800/50 group cursor-pointer ${isHighlighted ? 'bg-yellow-500/10 border-l-2 border-yellow-500' : ''}"
                            data-line="${lineNumber}"
                          >
                            <span class="inline-block w-12 text-right pr-4 text-slate-600 select-none group-hover:text-slate-500">${lineNum}</span>
                            <span class="flex-1">${highlightedLine || ' '}</span>
                            ${isFunctionLine ? `<span class="ml-2 opacity-0 group-hover:opacity-100 text-purple-400 text-xs"><GitBranch class="w-3 h-3 inline"/></span>` : ''}
                          </div>`
                        }).join('')
                      }}
                    />
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
          </div>

          {/* Search Results Panel */}
          {searchResults.length > 0 && (
            <div className="w-80 border-l border-slate-700 bg-slate-950/50 flex flex-col overflow-hidden">
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
                    <div className="text-xs font-mono text-orange-300 truncate mb-1">
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

          {/* Call Hierarchy Panel */}
          {showCallHierarchy && selectedFunction && sourceFile && (
            <div className="w-96 border-l border-slate-700 bg-slate-950/50 flex flex-col overflow-hidden">
              <CallHierarchyPanel
                functionName={selectedFunction}
                file={sourceFile.path}
                onNavigateToFile={handleNavigateToFile}
                onClose={handleCloseHierarchy}
              />
            </div>
          )}
        </CardContent>

        {/* Status Bar */}
        <div className="px-4 py-2 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>{lines.length} 行代码</span>
            {sourceFile && <span>{sourceFile.language.toUpperCase()}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              MySQL 8.0.24
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
