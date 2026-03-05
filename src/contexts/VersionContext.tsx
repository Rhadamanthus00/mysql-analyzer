import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// MySQL 社区版本列表
export interface MySQLVersion {
  id: string
  version: string
  label: string
  releaseDate: string
  series: string  // '5.7' | '8.0' | '8.1' | '8.2' | '8.3' | '8.4' | '9.0'
  highlights: string[]
  isDefault?: boolean
}

export const mysqlVersions: MySQLVersion[] = [
  // 5.7 系列
  {
    id: '5.7.44',
    version: '5.7.44',
    label: 'MySQL 5.7.44',
    releaseDate: '2023-10-25',
    series: '5.7',
    highlights: ['5.7 最终版', 'InnoDB 改进', '传统优化器'],
  },
  // 8.0 系列
  {
    id: '8.0.11',
    version: '8.0.11',
    label: 'MySQL 8.0.11 (GA)',
    releaseDate: '2018-04-19',
    series: '8.0',
    highlights: ['8.0 首个 GA 版', 'CTE 支持', '窗口函数'],
  },
  {
    id: '8.0.20',
    version: '8.0.20',
    label: 'MySQL 8.0.20',
    releaseDate: '2020-04-27',
    series: '8.0',
    highlights: ['Hash Join 支持', 'EXPLAIN ANALYZE', 'Redo Log 重构'],
  },
  {
    id: '8.0.24',
    version: '8.0.24',
    label: 'MySQL 8.0.24',
    releaseDate: '2021-04-20',
    series: '8.0',
    highlights: ['性能优化', 'InnoDB 改进', '默认版本'],
    isDefault: true,
  },
  {
    id: '8.0.28',
    version: '8.0.28',
    label: 'MySQL 8.0.28',
    releaseDate: '2022-01-18',
    series: '8.0',
    highlights: ['OpenSSL 3.0', '性能改进', 'Bug 修复'],
  },
  {
    id: '8.0.32',
    version: '8.0.32',
    label: 'MySQL 8.0.32',
    releaseDate: '2023-01-17',
    series: '8.0',
    highlights: ['性能提升', '安全增强', 'InnoDB 优化'],
  },
  {
    id: '8.0.36',
    version: '8.0.36',
    label: 'MySQL 8.0.36',
    releaseDate: '2024-01-16',
    series: '8.0',
    highlights: ['安全更新', '稳定性改进'],
  },
  {
    id: '8.0.40',
    version: '8.0.40',
    label: 'MySQL 8.0.40',
    releaseDate: '2024-10-15',
    series: '8.0',
    highlights: ['8.0 LTS 延续', '维护更新'],
  },
  // 8.4 LTS
  {
    id: '8.4.0',
    version: '8.4.0',
    label: 'MySQL 8.4.0 LTS',
    releaseDate: '2024-04-30',
    series: '8.4',
    highlights: ['首个 LTS 版', 'Hypergraph 优化器可选', '性能改进'],
  },
  {
    id: '8.4.3',
    version: '8.4.3',
    label: 'MySQL 8.4.3 LTS',
    releaseDate: '2024-10-15',
    series: '8.4',
    highlights: ['LTS 维护版', '稳定性增强'],
  },
  // 9.0 Innovation
  {
    id: '9.0.0',
    version: '9.0.0',
    label: 'MySQL 9.0.0 Innovation',
    releaseDate: '2024-07-01',
    series: '9.0',
    highlights: ['Innovation 版', '新特性预览', 'JavaScript 存储过程'],
  },
  {
    id: '9.1.0',
    version: '9.1.0',
    label: 'MySQL 9.1.0 Innovation',
    releaseDate: '2024-10-15',
    series: '9.0',
    highlights: ['Innovation 版', '持续创新'],
  },
]

// 代码来源类型
export type CodeSourceType = 'community' | 'local-path' | 'upload'

export interface CodeSource {
  type: CodeSourceType
  version?: MySQLVersion        // 社区版本
  localPath?: string            // 本地路径
  uploadedFiles?: UploadedFile[] // 上传的文件
  displayName: string           // 显示名称
}

export interface UploadedFile {
  name: string
  path: string
  size: number
  lastModified: number
  content?: string
}

// 版本特定的函数差异
export interface VersionDiff {
  versionRange: string    // 如 '>=8.0.20', '<8.0', '>=9.0'
  changes: string         // 变更描述
  codeSnippet?: string    // 差异代码
  newFunction?: boolean   // 是否为新增函数
  removedFunction?: boolean // 是否已删除
  renamedFrom?: string    // 重命名来源
}

// 学习进度
export interface AnalysisStatus {
  isAnalyzing: boolean
  progress: number         // 0-100
  currentFile?: string
  totalFiles?: number
  analyzedFiles?: number
  message?: string
}

interface VersionContextType {
  codeSource: CodeSource
  setCodeSource: (source: CodeSource) => void
  analysisStatus: AnalysisStatus
  setAnalysisStatus: (status: AnalysisStatus) => void
  startAnalysis: (source: CodeSource) => void
  isConfigured: boolean
  getVersionLabel: () => string
  getVersionDiffs: (funcName: string) => VersionDiff[]
}

const defaultCodeSource: CodeSource = {
  type: 'community',
  version: mysqlVersions.find(v => v.isDefault),
  displayName: 'MySQL 8.0.24',
}

const VersionContext = createContext<VersionContextType | null>(null)

export function VersionProvider({ children }: { children: ReactNode }) {
  const [codeSource, setCodeSource] = useState<CodeSource>(defaultCodeSource)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    isAnalyzing: false,
    progress: 100,
  })

  const isConfigured = codeSource.type === 'community' 
    ? !!codeSource.version 
    : codeSource.type === 'local-path' 
    ? !!codeSource.localPath 
    : (codeSource.uploadedFiles?.length || 0) > 0

  const getVersionLabel = useCallback(() => {
    if (codeSource.type === 'community' && codeSource.version) {
      return `MySQL ${codeSource.version.version}`
    }
    if (codeSource.type === 'local-path' && codeSource.localPath) {
      return `本地代码: ${codeSource.localPath.split('/').pop()}`
    }
    if (codeSource.type === 'upload') {
      return `上传代码 (${codeSource.uploadedFiles?.length || 0} 个文件)`
    }
    return 'MySQL 8.0.24'
  }, [codeSource])

  // 获取版本差异信息
  const getVersionDiffs = useCallback((funcName: string): VersionDiff[] => {
    if (codeSource.type !== 'community' || !codeSource.version) return []
    
    const v = codeSource.version.version
    const diffs = versionDiffDatabase[funcName]
    if (!diffs) return []
    
    return diffs.filter(d => matchVersionRange(v, d.versionRange))
  }, [codeSource])

  // 模拟代码分析过程
  const startAnalysis = useCallback((source: CodeSource) => {
    setCodeSource(source)
    setAnalysisStatus({
      isAnalyzing: true,
      progress: 0,
      message: '正在初始化分析...',
    })

    // 模拟分析进度
    const stages = [
      { progress: 10, message: '扫描源码目录结构...', delay: 400 },
      { progress: 25, message: '解析头文件依赖...', delay: 600 },
      { progress: 40, message: '构建函数调用图谱...', delay: 800 },
      { progress: 55, message: '分析 SQL 层函数签名...', delay: 600 },
      { progress: 70, message: '分析优化器模块...', delay: 700 },
      { progress: 80, message: '分析存储引擎接口...', delay: 500 },
      { progress: 90, message: '生成版本差异报告...', delay: 400 },
      { progress: 100, message: '分析完成', delay: 300 },
    ]

    let i = 0
    const runNext = () => {
      if (i >= stages.length) {
        setAnalysisStatus({
          isAnalyzing: false,
          progress: 100,
          message: '分析完成',
        })
        return
      }
      const stage = stages[i]
      setTimeout(() => {
        setAnalysisStatus({
          isAnalyzing: i < stages.length - 1,
          progress: stage.progress,
          message: stage.message,
        })
        i++
        runNext()
      }, stage.delay)
    }
    runNext()
  }, [])

  return (
    <VersionContext.Provider value={{
      codeSource,
      setCodeSource,
      analysisStatus,
      setAnalysisStatus,
      startAnalysis,
      isConfigured,
      getVersionLabel,
      getVersionDiffs,
    }}>
      {children}
    </VersionContext.Provider>
  )
}

export function useVersion() {
  const ctx = useContext(VersionContext)
  if (!ctx) throw new Error('useVersion must be used within VersionProvider')
  return ctx
}

// 版本范围匹配
function matchVersionRange(version: string, range: string): boolean {
  const parts = version.split('.').map(Number)
  const major = parts[0], minor = parts[1], patch = parts[2] || 0
  const vNum = major * 10000 + minor * 100 + patch

  // 解析 range: >=8.0.20, <8.0, >=9.0, 5.7.x, etc.
  const rangeMatch = range.match(/^([<>=!]+)?([\d.]+)$/)
  if (!rangeMatch) return false

  const op = rangeMatch[1] || '='
  const rParts = rangeMatch[2].split('.').map(Number)
  const rMajor = rParts[0], rMinor = rParts[1] || 0, rPatch = rParts[2] || 0
  const rNum = rMajor * 10000 + rMinor * 100 + rPatch

  switch (op) {
    case '>=': return vNum >= rNum
    case '<=': return vNum <= rNum
    case '>': return vNum > rNum
    case '<': return vNum < rNum
    case '!=': return vNum !== rNum
    case '=': return vNum === rNum
    default: return false
  }
}

// ===== 版本差异数据库 =====
const versionDiffDatabase: Record<string, VersionDiff[]> = {
  'JOIN::optimize': [
    {
      versionRange: '<8.0',
      changes: '5.7 中优化器使用旧版成本模型，缺少 Histogram 统计信息支持。optimize() 流程类似但少了 hypergraph 相关的条件分支。',
      codeSnippet: `// MySQL 5.7 的 JOIN::optimize 不包含 Hypergraph
int JOIN::optimize() {
  // ... 与 8.0 类似但无 secondary_engine 相关逻辑
  simplify_joins(...);
  optimize_cond(...);
  make_join_statistics(...);
  // 5.7 使用 old-style optimizer
  choose_plan(this, ...);
  ...
}`,
    },
    {
      versionRange: '>=8.0.20',
      changes: '8.0.20+ 引入了 Hash Join 支持，optimize() 中增加了对 Hash Join 条件的检测和评估逻辑。',
      codeSnippet: `// 8.0.20+ 新增 Hash Join 评估
if (tab->type() == JT_ALL && 
    can_use_hash_join(tab)) {
  // 评估 Hash Join 成本
  evaluate_hash_join_cost(tab, ...);
}`,
    },
    {
      versionRange: '>=8.4.0',
      changes: '8.4 LTS 中可通过 optimizer_switch 启用 Hypergraph 优化器，JOINoptimize() 内部可能走不同的优化路径。',
      codeSnippet: `// 8.4+ Hypergraph 可选
if (thd->optimizer_switch_flag(
    OPTIMIZER_SWITCH_HYPERGRAPH_OPTIMIZER)) {
  return HypergraphOptimize(this);
}
// 否则走传统路径
...`,
    },
  ],
  'handle_query': [
    {
      versionRange: '<8.0',
      changes: '5.7 中该函数名为 execute_sqlcom_select 的一部分，没有独立的 handle_query 抽象层。',
    },
  ],
  'mysql_execute_command': [
    {
      versionRange: '>=8.0',
      changes: '8.0 重构了命令分发逻辑，增加了 Resource Group 支持和更细粒度的权限检查。',
    },
    {
      versionRange: '>=9.0',
      changes: '9.0 新增了 JavaScript 存储过程的命令分发路径。',
    },
  ],
  'row_search_mvcc': [
    {
      versionRange: '<8.0',
      changes: '5.7 中 MVCC 可见性判断使用 ReadView 的旧实现，每次 SELECT 都创建新 ReadView（RC 级别下）。',
    },
    {
      versionRange: '>=8.0.20',
      changes: '8.0.20+ 改进了 ReadView 缓存机制，减少了 RR 隔离级别下的内存分配。',
    },
  ],
  'ha_write_row': [
    {
      versionRange: '>=8.0.20',
      changes: '8.0.20+ 优化了 Redo Log 的写入机制，采用了无锁的 log buffer 写入方式。',
      codeSnippet: `// 8.0.20+ 无锁 Redo Log
// 旧版: mutex 保护 log buffer 写入
// 新版: 使用 reservation-based 方式
log_buffer_reserve(log, len);
memcpy(log->buf + reserved_offset, ...);
log_buffer_write_completed(log, ...);`,
    },
  ],
  'buf_page_get_gen': [
    {
      versionRange: '<8.0',
      changes: '5.7 的 Buffer Pool 使用单一 mutex 保护 hash table，在高并发下是性能瓶颈。',
    },
    {
      versionRange: '>=8.0',
      changes: '8.0 将 Buffer Pool hash table 拆分为多个分区（shard），减少锁竞争。',
    },
  ],
  'ha_commit_trans': [
    {
      versionRange: '>=8.0.20',
      changes: '8.0.20+ 重构了 binlog group commit 机制，提升了高并发事务提交的吞吐量。',
    },
  ],
  'dispatch_command': [
    {
      versionRange: '>=8.0.24',
      changes: '8.0.24 增加了更完善的查询属性（query attributes）支持，允许客户端在 COM_QUERY 中传递额外元数据。',
    },
  ],
  'mysql_parse': [
    {
      versionRange: '<8.0',
      changes: '5.7 中 parser 是传统的单遍解析，8.0 引入了"prepare once, execute many"的 PS 协议改进。',
    },
    {
      versionRange: '>=8.0',
      changes: '8.0 的解析器完全重写了语法规则文件，支持 CTE、窗口函数等新语法。sql_yacc.yy 增加了约 3000 行产生式。',
    },
  ],
  'sub_select': [
    {
      versionRange: '>=8.0.20',
      changes: '8.0.20+ 在 Nested Loop Join 之外新增了 Hash Join 执行路径，sub_select 中会根据优化器决策选择 NLJ 或 Hash Join。',
      codeSnippet: `// 8.0.20+ Hash Join 路径
if (tab->using_hash_join()) {
  return hash_join_exec(join, tab);
}
// 传统 Nested Loop Join
while ((error = info->read_record(info)) == 0) {
  ...
}`,
    },
  ],
  'greedy_search': [
    {
      versionRange: '<8.0',
      changes: '5.7 的 greedy_search 使用较简单的成本模型，不考虑磁盘临时表和 Sort Buffer 的影响。',
    },
    {
      versionRange: '>=8.0',
      changes: '8.0 引入了新的成本模型（cost model 2.0），考虑了更多硬件参数和内存缓存命中率。',
    },
  ],
}
