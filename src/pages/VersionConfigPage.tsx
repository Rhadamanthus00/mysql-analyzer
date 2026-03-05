import { useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Home, Database, FolderOpen, Upload, Check, ChevronRight,
  GitBranch, Tag, Calendar, Sparkles, ArrowRight, Server,
  HardDrive, FileCode, AlertCircle, Loader2, X, Star,
  Box, RefreshCw
} from 'lucide-react'
import {
  useVersion,
  mysqlVersions,
  type MySQLVersion,
  type CodeSource,
  type UploadedFile,
} from '@/contexts/VersionContext'
import type { Route } from '@/App'

interface VersionConfigPageProps {
  onNavigate: (route: Route) => void
}

// 版本系列配色
const seriesColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  '5.7': { bg: 'from-slate-600 to-slate-700', border: 'border-slate-500/40', text: 'text-slate-300', badge: 'bg-slate-600/30 text-slate-300 border-slate-500/40' },
  '8.0': { bg: 'from-blue-600 to-cyan-600', border: 'border-blue-500/40', text: 'text-blue-300', badge: 'bg-blue-600/20 text-blue-300 border-blue-500/30' },
  '8.4': { bg: 'from-emerald-600 to-teal-600', border: 'border-emerald-500/40', text: 'text-emerald-300', badge: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30' },
  '9.0': { bg: 'from-purple-600 to-violet-600', border: 'border-purple-500/40', text: 'text-purple-300', badge: 'bg-purple-600/20 text-purple-300 border-purple-500/30' },
}

export default function VersionConfigPage({ onNavigate }: VersionConfigPageProps) {
  const { codeSource, startAnalysis, analysisStatus } = useVersion()

  const [activeTab, setActiveTab] = useState<string>(codeSource.type === 'community' ? 'community' : codeSource.type === 'local-path' ? 'local' : 'upload')
  const [selectedVersion, setSelectedVersion] = useState<MySQLVersion | null>(codeSource.version || null)
  const [localPath, setLocalPath] = useState(codeSource.localPath || '')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(codeSource.uploadedFiles || [])
  const [filterSeries, setFilterSeries] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 按系列分组
  const versionsBySeries = useMemo(() => {
    const groups: Record<string, MySQLVersion[]> = {}
    mysqlVersions.forEach(v => {
      if (!groups[v.series]) groups[v.series] = []
      groups[v.series].push(v)
    })
    return groups
  }, [])

  const filteredVersions = filterSeries
    ? mysqlVersions.filter(v => v.series === filterSeries)
    : mysqlVersions

  const seriesList = Object.keys(versionsBySeries).sort()

  const handleSelectVersion = (version: MySQLVersion) => {
    setSelectedVersion(version)
  }

  const handleApplyCommunity = () => {
    if (!selectedVersion) return
    const source: CodeSource = {
      type: 'community',
      version: selectedVersion,
      displayName: `MySQL ${selectedVersion.version}`,
    }
    startAnalysis(source)
  }

  const handleApplyLocalPath = () => {
    if (!localPath.trim()) return
    const source: CodeSource = {
      type: 'local-path',
      localPath: localPath.trim(),
      displayName: `本地: ${localPath.trim().split('/').pop()}`,
    }
    startAnalysis(source)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: UploadedFile[] = Array.from(files).map(f => ({
      name: f.name,
      path: (f as any).webkitRelativePath || f.name,
      size: f.size,
      lastModified: f.lastModified,
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const handleApplyUpload = () => {
    if (uploadedFiles.length === 0) return
    const source: CodeSource = {
      type: 'upload',
      uploadedFiles,
      displayName: `上传代码 (${uploadedFiles.length} 文件)`,
    }
    startAnalysis(source)
  }

  const removeUploadedFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">代码版本配置</h1>
                <p className="text-xs text-slate-400">选择 MySQL 版本或导入代码</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {codeSource.version && (
                <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                  <Tag className="w-3 h-3 mr-1" />
                  当前: {codeSource.displayName}
                </Badge>
              )}
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

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 分析进度条 */}
        {analysisStatus.isAnalyzing && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/5 border border-violet-500/30">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              <span className="text-sm font-medium text-violet-300">{analysisStatus.message}</span>
              <span className="text-xs text-slate-500 ml-auto">{analysisStatus.progress}%</span>
            </div>
            <Progress value={analysisStatus.progress} className="h-2 bg-slate-800" />
          </div>
        )}

        {/* 选项卡 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900/50 border border-slate-800 mb-6">
            <TabsTrigger value="community" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Server className="w-4 h-4 mr-1.5" />
              社区版本
            </TabsTrigger>
            <TabsTrigger value="local" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <FolderOpen className="w-4 h-4 mr-1.5" />
              本地路径
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Upload className="w-4 h-4 mr-1.5" />
              上传代码
            </TabsTrigger>
          </TabsList>

          {/* ====== 社区版本选择 ====== */}
          <TabsContent value="community" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 版本列表 */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-blue-400" />
                        MySQL 社区版本
                      </CardTitle>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setFilterSeries(null)}
                          className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                            !filterSeries ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          全部
                        </button>
                        {seriesList.map(series => (
                          <button
                            key={series}
                            onClick={() => setFilterSeries(filterSeries === series ? null : series)}
                            className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                              filterSeries === series
                                ? `bg-gradient-to-r ${seriesColors[series]?.bg || 'from-gray-600 to-gray-700'} text-white`
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {series}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                      {filteredVersions.map(version => {
                        const colors = seriesColors[version.series] || seriesColors['8.0']
                        const isSelected = selectedVersion?.id === version.id
                        const isCurrent = codeSource.version?.id === version.id

                        return (
                          <button
                            key={version.id}
                            onClick={() => handleSelectVersion(version)}
                            className={`
                              w-full text-left p-4 rounded-xl border transition-all duration-200
                              ${isSelected
                                ? `${colors.border} bg-gradient-to-r from-slate-800/80 to-slate-800/40 shadow-lg ring-1 ring-blue-500/30`
                                : 'border-slate-800/60 bg-slate-900/40 hover:border-slate-600'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
                                  {isSelected ? (
                                    <Check className="w-4 h-4 text-white" />
                                  ) : (
                                    <Database className="w-4 h-4 text-white/80" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold text-sm ${isSelected ? colors.text : 'text-slate-200'}`}>
                                      {version.label}
                                    </span>
                                    {version.isDefault && (
                                      <Badge className="text-[9px] bg-amber-500/20 text-amber-300 border-amber-500/30">
                                        <Star className="w-2.5 h-2.5 mr-0.5" />
                                        默认
                                      </Badge>
                                    )}
                                    {isCurrent && !isSelected && (
                                      <Badge className="text-[9px] bg-green-500/20 text-green-300 border-green-500/30">
                                        当前使用
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Calendar className="w-3 h-3 text-slate-600" />
                                    <span className="text-[11px] text-slate-500">{version.releaseDate}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                {version.highlights.map(h => (
                                  <Badge key={h} variant="outline" className={`text-[9px] ${isSelected ? colors.badge : 'border-slate-700 text-slate-500'}`}>
                                    {h}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右侧详情 + 操作 */}
              <div className="space-y-4">
                {selectedVersion ? (
                  <>
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-400" />
                          已选择版本
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className={`p-4 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border ${seriesColors[selectedVersion.series]?.border}`}>
                          <div className="text-xl font-bold text-white mb-1">
                            MySQL {selectedVersion.version}
                          </div>
                          <div className="text-xs text-slate-400">
                            发布于 {selectedVersion.releaseDate}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {selectedVersion.highlights.map(h => (
                              <Badge key={h} variant="outline" className={`text-[10px] ${seriesColors[selectedVersion.series]?.badge}`}>
                                {h}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-400">
                          <div className="flex items-center gap-2">
                            <Box className="w-3.5 h-3.5 text-slate-500" />
                            <span>版本系列: {selectedVersion.series}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileCode className="w-3.5 h-3.5 text-slate-500" />
                            <span>源码将从 GitHub mysql/mysql-server 获取</span>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                          onClick={handleApplyCommunity}
                          disabled={analysisStatus.isAnalyzing}
                        >
                          {analysisStatus.isAnalyzing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4 mr-2" />
                          )}
                          {codeSource.version?.id === selectedVersion.id ? '重新分析此版本' : '切换到此版本'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* 版本差异提示 */}
                    {selectedVersion.series !== '8.0' && (
                      <Card className="bg-amber-500/5 border-amber-500/20 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-300/80 leading-relaxed">
                              {selectedVersion.series === '5.7'
                                ? '5.7 系列代码结构与 8.0 有较大差异。部分函数签名和调用关系可能不同，分析结果会标注版本差异。'
                                : selectedVersion.series === '8.4'
                                ? '8.4 LTS 基于 8.0 代码，增加了 Hypergraph 优化器等新特性。差异部分会在调用链中标注。'
                                : '9.x Innovation 版包含实验性特性（如 JavaScript 存储过程），部分函数可能与 8.0 不同。'
                              }
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <Database className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <p className="text-sm text-slate-400">
                        从左侧选择一个 MySQL 版本
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        支持 5.7 ~ 9.1 全部社区版
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* 快速入口 */}
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="text-xs text-slate-500 mb-2 font-medium">配置完成后</div>
                    <div className="space-y-1.5">
                      <button
                        onClick={() => onNavigate('callchain')}
                        className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-slate-300">进入动态调用链追踪</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto" />
                      </button>
                      <button
                        onClick={() => onNavigate('analyzer')}
                        className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-left"
                      >
                        <FileCode className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-slate-300">进入源码浏览</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ====== 本地路径 ====== */}
          <TabsContent value="local" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-emerald-400" />
                    本地代码路径
                  </CardTitle>
                  <CardDescription>
                    输入本地 MySQL 源码目录路径，系统将自动扫描和分析代码结构
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">MySQL 源码根目录</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          value={localPath}
                          onChange={(e) => setLocalPath(e.target.value)}
                          placeholder="/path/to/mysql-server"
                          className="pl-10 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>示例路径:</p>
                      <p className="font-mono text-slate-400">/home/user/mysql-server</p>
                      <p className="font-mono text-slate-400">/opt/mysql-8.0.36-src</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-300/80 leading-relaxed">
                        <p className="font-medium mb-1">目录结构要求</p>
                        <p>目录应包含 MySQL 标准源码结构（含 sql/、storage/innobase/ 等子目录）。系统将自动识别版本并建立函数索引。</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    onClick={handleApplyLocalPath}
                    disabled={!localPath.trim() || analysisStatus.isAnalyzing}
                  >
                    {analysisStatus.isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    开始分析代码
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====== 上传代码 ====== */}
          <TabsContent value="upload" className="mt-0">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-purple-400" />
                    上传源码文件
                  </CardTitle>
                  <CardDescription>
                    上传 MySQL 源码文件或目录，支持 .cc, .h, .c, .cpp 格式
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 拖拽区域 */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-purple-500/50 bg-slate-900/30 hover:bg-purple-500/5 transition-all cursor-pointer text-center"
                  >
                    <Upload className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                    <p className="text-sm text-slate-300 mb-1">点击选择文件</p>
                    <p className="text-xs text-slate-500">支持 .cc, .h, .c, .cpp, .yy 文件</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".cc,.h,.c,.cpp,.cxx,.yy,.ll"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* 已上传文件列表 */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-medium">
                          已选择 {uploadedFiles.length} 个文件
                        </span>
                        <button
                          onClick={() => setUploadedFiles([])}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          清空
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCode className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                              <span className="text-xs text-slate-300 truncate">{file.path || file.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] text-slate-500">{formatFileSize(file.size)}</span>
                              <button onClick={() => removeUploadedFile(idx)} className="text-slate-500 hover:text-red-400">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                    onClick={handleApplyUpload}
                    disabled={uploadedFiles.length === 0 || analysisStatus.isAnalyzing}
                  >
                    {analysisStatus.isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    开始分析上传代码
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
