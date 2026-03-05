import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Home, Bug, Terminal, ChevronRight, ChevronDown, CheckCircle2, 
  Play, FileCode, BookOpen, AlertCircle, Copy, Lightbulb
} from 'lucide-react'
import { gdbExperiments, gdbQuickCommands, type GdbExperiment, type GdbStep } from '@/data/gdbData'
import SourceCodeViewer from '@/components/SourceCodeViewer'
import type { Route } from '@/App'

interface GdbLabPageProps {
  onNavigate: (route: Route) => void
}

export default function GdbLabPage({ onNavigate }: GdbLabPageProps) {
  const [selectedExperiment, setSelectedExperiment] = useState<GdbExperiment>(gdbExperiments[0])
  const [activeStep, setActiveStep] = useState<number>(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [expandedSetup, setExpandedSetup] = useState(false)
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null)
  const [isSourceViewerOpen, setIsSourceViewerOpen] = useState(false)
  const [initialFile, setInitialFile] = useState<string | undefined>()

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'beginner': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'advanced': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return ''
    }
  }

  const difficultyLabel = (d: string) => {
    switch (d) {
      case 'beginner': return '初级'
      case 'intermediate': return '中级'
      case 'advanced': return '高级'
      default: return ''
    }
  }

  const categoryLabel = (c: string) => {
    switch (c) {
      case 'breakpoint': return '断点调试'
      case 'watchpoint': return '数据观察'
      case 'backtrace': return '调用栈'
      case 'memory': return '内存分析'
      case 'thread': return '线程调试'
      default: return ''
    }
  }

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(cmd)
    setTimeout(() => setCopiedCmd(null), 2000)
  }

  const markStepComplete = (stepId: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      next.add(stepId)
      return next
    })
    if (activeStep < selectedExperiment.steps.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  const openSourceFile = (file: string) => {
    setInitialFile(file)
    setIsSourceViewerOpen(true)
  }

  const currentStep = selectedExperiment.steps[activeStep]
  const progress = (completedSteps.size / selectedExperiment.steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bug className="h-6 w-6 text-orange-400" />
              <h1 className="text-lg font-bold">GDB 调试实验室</h1>
              <Badge variant="outline" className="border-orange-500/50 text-orange-400 text-xs">
                {gdbExperiments.length} 个实验
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
        <Tabs defaultValue="experiments" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="experiments" className="data-[state=active]:bg-orange-600">
              <Bug className="w-4 h-4 mr-2" />
              实验课程
            </TabsTrigger>
            <TabsTrigger value="reference" className="data-[state=active]:bg-blue-600">
              <BookOpen className="w-4 h-4 mr-2" />
              GDB 速查手册
            </TabsTrigger>
          </TabsList>

          {/* 实验课程 Tab */}
          <TabsContent value="experiments">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left - Experiment List */}
              <div className="lg:col-span-3">
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">实验列表</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {gdbExperiments.map((exp, idx) => (
                      <div
                        key={exp.id}
                        onClick={() => { setSelectedExperiment(exp); setActiveStep(0); setCompletedSteps(new Set()) }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedExperiment.id === exp.id
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-slate-700/50 hover:border-slate-600 bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500">#{idx + 1}</span>
                          <Badge className={`text-xs ${difficultyColor(exp.difficulty)}`}>
                            {difficultyLabel(exp.difficulty)}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium truncate">{exp.title.replace(/实验\d+:\s*/, '')}</div>
                        <div className="text-xs text-slate-500 mt-1">{categoryLabel(exp.category)}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right - Experiment Detail */}
              <div className="lg:col-span-9 space-y-6">
                {/* Experiment Header */}
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{selectedExperiment.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={difficultyColor(selectedExperiment.difficulty)}>
                            {difficultyLabel(selectedExperiment.difficulty)}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {categoryLabel(selectedExperiment.category)}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                            {selectedExperiment.steps.length} 步
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium">实验目标</span>
                      </div>
                      <p className="text-sm text-slate-400">{selectedExperiment.objective}</p>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">{selectedExperiment.description}</p>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>进度</span>
                        <span>{completedSteps.size}/{selectedExperiment.steps.length} 步</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Prerequisites */}
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpandedSetup(!expandedSetup)}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                        {expandedSetup ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        环境准备 & 前置条件
                      </div>
                    </div>
                    {expandedSetup && (
                      <div className="space-y-3 ml-6 mb-4">
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">前置条件</div>
                          <ul className="space-y-1">
                            {selectedExperiment.prerequisites.map((p, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                <AlertCircle className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">环境准备</div>
                          <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs space-y-1">
                            {selectedExperiment.setupCommands.map((cmd, i) => (
                              <div key={i} className="flex items-center justify-between group">
                                <span className={cmd.startsWith('#') ? 'text-slate-500' : 'text-green-400'}>
                                  {cmd.startsWith('#') ? cmd : `$ ${cmd}`}
                                </span>
                                {!cmd.startsWith('#') && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCopyCommand(cmd) }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Related Source Files */}
                    <div className="flex flex-wrap gap-2">
                      {selectedExperiment.relatedSourceFiles.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => openSourceFile(file)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors text-xs"
                        >
                          <FileCode className="w-3 h-3 text-blue-400" />
                          <span className="font-mono text-slate-300">{file}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Step-by-step Guide */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Step List */}
                  <div className="lg:col-span-2">
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">操作步骤</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                          {selectedExperiment.steps.map((step, idx) => {
                            const isActive = activeStep === idx
                            const isCompleted = completedSteps.has(step.id)
                            return (
                              <div
                                key={step.id}
                                onClick={() => setActiveStep(idx)}
                                className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                                  isActive
                                    ? 'border border-orange-500 bg-orange-500/10'
                                    : 'border border-transparent hover:bg-slate-800/50'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                  isCompleted ? 'bg-green-500' :
                                  isActive ? 'bg-orange-500' :
                                  'bg-slate-700'
                                }`}>
                                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <span className={`text-xs flex-1 truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                  {step.instruction}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Active Step Detail */}
                  <div className="lg:col-span-3">
                    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Play className="w-4 h-4 text-orange-400" />
                            步骤 {activeStep + 1}: {currentStep.instruction}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* GDB Command */}
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">GDB 命令</div>
                          <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm">
                            {currentStep.command.split('\n').map((line, i) => (
                              <div key={i} className="flex items-center justify-between group">
                                <span className={line.startsWith('#') ? 'text-slate-500' : 'text-green-400'}>
                                  {line.startsWith('#') ? line : `(gdb) ${line}`}
                                </span>
                                {!line.startsWith('#') && (
                                  <button
                                    onClick={() => handleCopyCommand(line)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Copy className={`w-3.5 h-3.5 ${copiedCmd === line ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Expected Output */}
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">预期输出</div>
                          <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs space-y-0.5 max-h-40 overflow-y-auto">
                            {currentStep.expectedOutput.map((line, i) => (
                              <div key={i} className={line.startsWith('#') ? 'text-slate-500' : 'text-amber-300'}>
                                {line}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-300">{currentStep.explanation}</p>
                          </div>
                        </div>

                        {/* Source File Link */}
                        {currentStep.breakpointFile && (
                          <button
                            onClick={() => openSourceFile(currentStep.breakpointFile!)}
                            className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800/50 hover:bg-slate-700/50 transition-colors w-full text-left"
                          >
                            <FileCode className="w-4 h-4 text-blue-400" />
                            <span className="font-mono text-xs text-slate-300">
                              {currentStep.breakpointFile}
                              {currentStep.breakpointLine && `:${currentStep.breakpointLine}`}
                            </span>
                            <span className="text-xs text-slate-500 ml-auto">查看源码</span>
                          </button>
                        )}

                        {/* Mark Complete Button */}
                        <Button
                          className="w-full bg-orange-600 hover:bg-orange-700"
                          onClick={() => markStepComplete(currentStep.id)}
                          disabled={completedSteps.has(currentStep.id)}
                        >
                          {completedSteps.has(currentStep.id) ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              已完成
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              标记为已完成
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Insights */}
                    {completedSteps.size === selectedExperiment.steps.length && (
                      <Card className="bg-green-900/20 border-green-500/30 backdrop-blur-sm mt-6">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                            实验完成 - 关键收获
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {selectedExperiment.expectedInsights.map((insight, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-green-300/80">
                                <Lightbulb className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* GDB 速查手册 Tab */}
          <TabsContent value="reference">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gdbQuickCommands.map((group) => (
                <Card key={group.category} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-green-400" />
                      {group.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.commands.map((cmd, idx) => (
                        <div key={idx} className="group">
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-green-400">{cmd.cmd}</code>
                            <button
                              onClick={() => handleCopyCommand(cmd.cmd)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Copy className={`w-3.5 h-3.5 ${copiedCmd === cmd.cmd ? 'text-green-400' : 'text-slate-500'}`} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{cmd.desc}</p>
                          {cmd.example && (
                            <div className="mt-1 bg-slate-950 rounded px-2 py-1 font-mono text-xs text-slate-500">
                              例: {cmd.example}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <SourceCodeViewer
        isOpen={isSourceViewerOpen}
        onClose={() => setIsSourceViewerOpen(false)}
        initialFile={initialFile}
      />
    </div>
  )
}

function Target({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
