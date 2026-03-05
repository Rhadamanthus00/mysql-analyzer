// 导航页面功能模块数据
export interface FeatureCard {
  id: string
  title: string
  description: string
  icon: string
  route: string
  color: string
  capabilities: string[]
}

export const features: FeatureCard[] = [
  {
    id: 'source',
    title: '源代码浏览',
    description: '浏览 MySQL 8.0.24 源代码，支持语法高亮、文件树导航和代码搜索',
    icon: 'code',
    route: '/source',
    color: 'from-blue-500 to-blue-600',
    capabilities: [
      '语法高亮显示 C/C++ 代码',
      '文件树导航和快速跳转',
      '全文代码搜索',
      '函数调用层次分析'
    ]
  },
  {
    id: 'flow',
    title: '流程可视化',
    description: 'SQL 执行流程可视化，10 个关键阶段的交互式展示',
    icon: 'layers',
    route: '/flow',
    color: 'from-purple-500 to-purple-600',
    capabilities: [
      '10 个 SQL 执行关键阶段',
      '每个阶段的源码文件定位',
      '关键函数和 GDB 断点',
      '学习路径引导'
    ]
  },
  {
    id: 'callgraph',
    title: '调用关系透视图',
    description: '展示代码逻辑的上下文调用关系，透视图分析复杂调用链',
    icon: 'git-branch',
    route: '/callgraph',
    color: 'from-green-500 to-green-600',
    capabilities: [
      '可展开/折叠的调用树',
      '查询执行和 Master 线程两种视图',
      '函数类型标注和文件定位',
      '节点详情和源码查看'
    ]
  },
  {
    id: 'threads',
    title: '关键线程分析',
    description: 'Master 线程工作场景和触发机制的动态交互图',
    icon: 'activity',
    route: '/threads',
    color: 'from-orange-500 to-orange-600',
    capabilities: [
      'Master 线程工作场景展示',
      '触发机制和执行间隔分析',
      '动态交互流程图',
      '相关函数和源码定位'
    ]
  },
  {
    id: 'gdb',
    title: 'GDB 调试',
    description: '在线 GDB 调试支持，预设断点和实时调试演示',
    icon: 'terminal',
    route: '/gdb',
    color: 'from-red-500 to-red-600',
    capabilities: [
      '预设调试断点',
      '模拟 GDB 调试会话',
      '断点和监视点管理',
      '调试输出预览'
    ]
  },
  {
    id: 'learning',
    title: '学习路径',
    description: '分阶段学习路径，从入门到精通的系统化课程',
    icon: 'book-open',
    route: '/learning',
    color: 'from-pink-500 to-pink-600',
    capabilities: [
      '初级、中级、高级三个阶段',
      '每个阶段的核心主题',
      '推荐学习时间估算',
      '与执行流程节点关联'
    ]
  }
]

// 快速开始步骤
export interface QuickStartStep {
  id: number
  title: string
  description: string
  action: string
  route: string
}

export const quickStartSteps: QuickStartStep[] = [
  {
    id: 1,
    title: '浏览源代码',
    description: '选择感兴趣的模块，浏览相关源文件',
    action: '进入源码浏览',
    route: '/source'
  },
  {
    id: 2,
    title: '查看流程图',
    description: '理解 SQL 查询执行的完整流程',
    action: '查看执行流程',
    route: '/flow'
  },
  {
    id: 3,
    title: '动态关联分析',
    description: '通过调用关系透视图深入理解代码逻辑',
    action: '探索调用关系',
    route: '/callgraph'
  }
]

// 学习路径数据
export interface LearningPathItem {
  id: string
  title: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  topics: string[]
}

export const learningPaths: LearningPathItem[] = [
  {
    id: 'beginner',
    title: '初级阶段',
    description: '了解 MySQL 基础架构和执行流程',
    level: 'beginner',
    topics: [
      'MySQL 整体架构概览',
      '客户端连接管理',
      'SQL 解析基础',
      '查询执行流程'
    ]
  },
  {
    id: 'intermediate',
    title: '中级阶段',
    description: '深入理解优化器和存储引擎',
    level: 'intermediate',
    topics: [
      '查询优化器原理',
      '成本估算模型',
      'InnoDB 存储引擎',
      '事务与锁机制'
    ]
  },
  {
    id: 'advanced',
    title: '高级阶段',
    description: '掌握高级调试和性能优化',
    level: 'advanced',
    topics: [
      'Master 线程工作原理',
      'GDB 高级调试技巧',
      '性能分析与优化',
      '源码定制与扩展'
    ]
  }
]

// 调用关系透视图数据
export interface CallGraphNode {
  id: string
  name: string
  type: 'function' | 'class' | 'module'
  file: string
  line?: number
  children?: CallGraphNode[]
}

export const callGraphs: Record<string, CallGraphNode[]> = {
  'query-execution': [
    {
      id: 'mysql_parse',
      name: 'mysql_parse',
      type: 'function',
      file: 'sql/sql_parse.cc',
      line: 4567,
      children: [
        {
          id: 'THD::sql_parser',
          name: 'THD::sql_parser',
          type: 'function',
          file: 'sql/sql_parse.cc',
          line: 1234,
          children: [
            {
              id: 'yyparse',
              name: 'yyparse',
              type: 'function',
              file: 'sql/sql_yacc.yy',
              line: 567,
              children: [
                {
                  id: 'Parse_tree_root',
                  name: 'Parse_tree_root',
                  type: 'class',
                  file: 'sql/sql_yacc.yy'
                }
              ]
            }
          ]
        },
        {
          id: 'THD::resolve_item_tree',
          name: 'THD::resolve_item_tree',
          type: 'function',
          file: 'sql/sql_resolver.cc',
          line: 890
        }
      ]
    },
    {
      id: 'JOIN::optimize',
      name: 'JOIN::optimize',
      type: 'function',
      file: 'sql/sql_optimizer.cc',
      line: 3456,
      children: [
        {
          id: 'JOIN::make_join_plan',
          name: 'JOIN::make_join_plan',
          type: 'function',
          file: 'sql/sql_optimizer.cc',
          line: 2345
        },
        {
          id: 'JOIN::best_access_path',
          name: 'JOIN::best_access_path',
          type: 'function',
          file: 'sql/sql_optimizer.cc',
          line: 6789
        }
      ]
    },
    {
      id: 'JOIN::execute',
      name: 'JOIN::execute',
      type: 'function',
      file: 'sql/sql_executor.cc',
      line: 5678,
      children: [
        {
          id: 'sub_select',
          name: 'sub_select',
          type: 'function',
          file: 'sql/sql_executor.cc',
          line: 7890
        },
        {
          id: 'handler::rnd_next',
          name: 'handler::rnd_next',
          type: 'function',
          file: 'sql/handler.cc',
          line: 1234
        }
      ]
    }
  ],
  'master-thread': [
    {
      id: 'handle_connections_sockets',
      name: 'handle_connections_sockets',
      type: 'function',
      file: 'sql/mysqld.cc',
      line: 5678,
      children: [
        {
          id: 'create_new_thread',
          name: 'create_new_thread',
          type: 'function',
          file: 'sql/mysqld.cc',
          line: 6789
        }
      ]
    },
    {
      id: 'srv_master_thread',
      name: 'srv_master_thread',
      type: 'function',
      file: 'storage/innobase/srv/srv0srv.cc',
      line: 2345,
      children: [
        {
          id: 'srv_master_do_active_tasks',
          name: 'srv_master_do_active_tasks',
          type: 'function',
          file: 'storage/innobase/srv/srv0srv.cc',
          line: 3456,
          children: [
            {
              id: 'srv_main_thread_flush_logs',
              name: 'srv_main_thread_flush_logs',
              type: 'function',
              file: 'storage/innobase/log/log0log.cc',
              line: 1234
            },
            {
              id: 'buf_flush_page_cleaner',
              name: 'buf_flush_page_cleaner',
              type: 'function',
              file: 'storage/innobase/buf/buf0flu.cc',
              line: 5678
            }
          ]
        },
        {
          id: 'srv_master_do_idle_tasks',
          name: 'srv_master_do_idle_tasks',
          type: 'function',
          file: 'storage/innobase/srv/srv0srv.cc',
          line: 4567
        }
      ]
    }
  ]
}

// Master 线程工作场景数据
export interface ThreadWorkItem {
  id: string
  name: string
  description: string
  trigger: string
  interval: string
  priority: 'high' | 'medium' | 'low'
  relatedFunctions: string[]
}

export const masterThreadWork: ThreadWorkItem[] = [
  {
    id: 'log-flush',
    name: '日志刷新',
    description: '将缓冲池中的脏页写入重做日志',
    trigger: '定时器触发',
    interval: '1秒',
    priority: 'high',
    relatedFunctions: ['srv_main_thread_flush_logs', 'log_write_up_to']
  },
  {
    id: 'page-flush',
    name: '页面刷新',
    description: '将脏页刷新到磁盘数据文件',
    trigger: '缓冲池压力',
    interval: '按需触发',
    priority: 'high',
    relatedFunctions: ['buf_flush_page_cleaner', 'buf_flush_batch']
  },
  {
    id: 'checkpoint',
    name: '检查点',
    description: '推进检查点，减少恢复时间',
    trigger: '异步触发',
    interval: '后台定期',
    priority: 'medium',
    relatedFunctions: ['log_checkpoint', 'buf_flush_sync']
  },
  {
    id: 'purge',
    name: '清理操作',
    description: '清理已提交事务的 undo 记录',
    trigger: '后台任务',
    interval: '持续执行',
    priority: 'low',
    relatedFunctions: ['srv_purge_coordinator_thread', 'row_purge_step']
  },
  {
    id: 'buffer-pool-stats',
    name: '缓冲池统计',
    description: '更新缓冲池统计信息',
    trigger: '定时触发',
    interval: '10秒',
    priority: 'low',
    relatedFunctions: ['buf_pool_stat_get', 'buf_LRU_stat_sum']
  }
]

// 动态交互图节点
export interface InteractiveNode {
  id: string
  label: string
  type: 'process' | 'event' | 'resource'
  position: { x: number; y: number }
  active: boolean
  next?: string[]
  prev?: string[]
}

export const masterThreadFlow: InteractiveNode[] = [
  {
    id: 'client',
    label: '客户端请求',
    type: 'process',
    position: { x: 100, y: 300 },
    active: true,
    next: ['connection']
  },
  {
    id: 'connection',
    label: '建立连接',
    type: 'process',
    position: { x: 300, y: 300 },
    active: false,
    prev: ['client'],
    next: ['parse']
  },
  {
    id: 'parse',
    label: 'SQL 解析',
    type: 'process',
    position: { x: 500, y: 200 },
    active: false,
    prev: ['connection'],
    next: ['optimize']
  },
  {
    id: 'optimize',
    label: '查询优化',
    type: 'process',
    position: { x: 700, y: 200 },
    active: false,
    prev: ['parse'],
    next: ['execute']
  },
  {
    id: 'execute',
    label: '执行查询',
    type: 'process',
    position: { x: 900, y: 300 },
    active: false,
    prev: ['optimize', 'buffer-pool'],
    next: ['buffer-pool', 'log-flush']
  },
  {
    id: 'buffer-pool',
    label: '缓冲池',
    type: 'resource',
    position: { x: 700, y: 400 },
    active: false,
    prev: ['execute'],
    next: ['execute', 'page-flush']
  },
  {
    id: 'log-flush',
    label: '日志刷新',
    type: 'event',
    position: { x: 500, y: 400 },
    active: false,
    prev: ['execute', 'master'],
    next: ['master']
  },
  {
    id: 'page-flush',
    label: '页面刷新',
    type: 'event',
    position: { x: 500, y: 500 },
    active: false,
    prev: ['buffer-pool'],
    next: ['master']
  },
  {
    id: 'master',
    label: 'Master 线程',
    type: 'process',
    position: { x: 100, y: 400 },
    active: false,
    prev: ['log-flush', 'page-flush'],
    next: ['log-flush', 'checkpoint', 'purge']
  },
  {
    id: 'checkpoint',
    label: '检查点',
    type: 'event',
    position: { x: 300, y: 500 },
    active: false,
    prev: ['master'],
    next: []
  },
  {
    id: 'purge',
    label: '清理操作',
    type: 'event',
    position: { x: 700, y: 500 },
    active: false,
    prev: ['master'],
    next: []
  }
]
