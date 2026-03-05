// SQL 执行流程节点类型
export interface ExecutionNode {
  id: number
  name: string
  description: string
  sourceFiles: string[]
  keyFunctions: string[]
  gdbBreakpoints: string[]
  notes: string
}

// 执行流程数据
export const executionFlow: ExecutionNode[] = [
  {
    id: 1,
    name: '客户端连接',
    description: '客户端通过 TCP/IP 或 Unix Socket 连接到 MySQL 服务器',
    sourceFiles: ['sql/conn_handler/connection_handler_per_thread.cc', 'sql/sql_connect.cc'],
    keyFunctions: ['handle_one_connection', 'THD::THD'],
    gdbBreakpoints: ['handle_one_connection', 'do_handle_one_connection'],
    notes: '连接处理器分配一个 THD 结构体表示连接会话'
  },
  {
    id: 2,
    name: '接收 SQL 查询',
    description: '服务器接收客户端发送的 SQL 查询语句',
    sourceFiles: ['sql/sql_parse.cc', 'sql/sql_class.cc'],
    keyFunctions: ['dispatch_command', 'mysql_parse'],
    gdbBreakpoints: ['dispatch_command', 'mysql_parse'],
    notes: '通过协议层解析命令类型 (COM_QUERY)'
  },
  {
    id: 3,
    name: 'SQL 解析（生成解析树）',
    description: '词法分析和语法分析，生成抽象语法树 (AST)',
    sourceFiles: ['sql/sql_yacc.yy', 'sql/sql_lex.cc', 'sql/sql_parse.cc'],
    keyFunctions: ['THD::sql_parser', 'yyparse'],
    gdbBreakpoints: ['THD::sql_parser', 'mysql_parse'],
    notes: '使用 Bison 生成解析器，生成 parse_tree 结构'
  },
  {
    id: 4,
    name: '预处理（语义检查）',
    description: '检查表、字段是否存在，权限验证，生成预处理树',
    sourceFiles: ['sql/sql_resolver.cc', 'sql/sql_show.cc'],
    keyFunctions: ['THD::resolve_item_tree', 'Item::fix_fields'],
    gdbBreakpoints: ['Item::fix_fields', 'resolve_item_tree'],
    notes: '将解析树转换为更优化的内部表示'
  },
  {
    id: 5,
    name: '查询优化（基于成本模型）',
    description: '优化器分析多个执行计划，选择成本最低的方案',
    sourceFiles: ['sql/sql_optimizer.cc', 'sql/opt_costmodel.cc'],
    keyFunctions: ['JOIN::optimize', 'JOIN::make_join_plan'],
    gdbBreakpoints: ['JOIN::optimize', 'JOIN::make_join_plan'],
    notes: '使用统计信息和成本模型估算执行成本'
  },
  {
    id: 6,
    name: '生成执行计划 (QEP)',
    description: '将优化后的计划转换为查询执行计划 (Query Execution Plan)',
    sourceFiles: ['sql/sql_executor.cc', 'sql/sql_select.cc'],
    keyFunctions: ['JOIN::prepare', 'JOIN::execute'],
    gdbBreakpoints: ['JOIN::prepare', 'JOIN::execute'],
    notes: 'QEP 定义了具体的执行步骤和访问方法'
  },
  {
    id: 7,
    name: '执行查询',
    description: '按照执行计划逐步执行查询操作',
    sourceFiles: ['sql/sql_executor.cc', 'sql/records.cc'],
    keyFunctions: ['sub_select', 'evaluate_join_record'],
    gdbBreakpoints: ['sub_select', 'evaluate_join_record'],
    notes: '使用迭代器模式逐行处理数据'
  },
  {
    id: 8,
    name: '访问存储引擎',
    description: '通过存储引擎 API 读取或写入数据',
    sourceFiles: ['storage/innobase/handler/ha_innodb.cc', 'sql/handler.cc'],
    keyFunctions: ['handler::rnd_next', 'handler::index_read'],
    gdbBreakpoints: ['handler::rnd_next', 'handler::index_read'],
    notes: 'InnoDB 引擎通过插件架构提供存储服务'
  },
  {
    id: 9,
    name: '返回结果',
    description: '将查询结果打包并返回给客户端',
    sourceFiles: ['sql/protocol_classic.cc', 'sql/protocol.cc'],
    keyFunctions: ['Protocol::send_result_set_row', 'net_write_row'],
    gdbBreakpoints: ['Protocol::send_result_set_row', 'net_write_row'],
    notes: '使用 MySQL 协议格式化并传输结果集'
  },
  {
    id: 10,
    name: '查询完成',
    description: '释放资源，清理连接状态',
    sourceFiles: ['sql/sql_parse.cc', 'sql/sql_class.cc'],
    keyFunctions: ['THD::cleanup_after_query', 'end_statement'],
    gdbBreakpoints: ['THD::cleanup_after_query', 'end_statement'],
    notes: '重置 THD 状态，准备处理下一个查询'
  }
]

// 学习路径类型
export interface LearningPath {
  id: string
  title: string
  description: string
  nodes: number[]
  estimatedTime: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export const learningPaths: LearningPath[] = [
  {
    id: 'quick-start',
    title: '快速入门',
    description: '了解 MySQL 查询执行的基本流程',
    nodes: [1, 2, 3, 10],
    estimatedTime: '30 分钟',
    difficulty: 'beginner'
  },
  {
    id: 'core-logic',
    title: '核心逻辑',
    description: '深入理解 SQL 解析和优化过程',
    nodes: [3, 4, 5, 6],
    estimatedTime: '2 小时',
    difficulty: 'intermediate'
  },
  {
    id: 'storage-engine',
    title: '存储引擎',
    description: '研究 InnoDB 存储引擎的实现',
    nodes: [7, 8, 9],
    estimatedTime: '1.5 小时',
    difficulty: 'advanced'
  },
  {
    id: 'complete-analysis',
    title: '完整分析',
    description: '全流程深度分析，适合高级研究',
    nodes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    estimatedTime: '5 小时',
    difficulty: 'advanced'
  }
]

// GDB 调试会话类型
export interface GDBSession {
  id: string
  name: string
  description: string
  breakpoints: string[]
  watchpoints: string[]
  expectedOutput: string[]
}

export const gdbSessions: GDBSession[] = [
  {
    id: 'query-parsing',
    name: '查询解析流程',
    description: '跟踪 SQL 语句从接收到解析的完整过程',
    breakpoints: ['dispatch_command', 'mysql_parse', 'THD::sql_parser'],
    watchpoints: ['thd->query_string'],
    expectedOutput: [
      'Breakpoint 1, dispatch_command',
      'Breakpoint 2, mysql_parse',
      'Parsing SQL: SELECT * FROM users'
    ]
  },
  {
    id: 'optimizer-path',
    name: '优化器执行路径',
    description: '观察查询优化器如何选择执行计划',
    breakpoints: ['JOIN::optimize', 'JOIN::make_join_plan', 'JOIN::best_access_path'],
    watchpoints: ['join->best_positions', 'join->positions'],
    expectedOutput: [
      'Best join order: [0, 1, 2]',
      'Using index: idx_user_id',
      'Estimated cost: 123.45'
    ]
  },
  {
    id: 'storage-access',
    name: '存储引擎访问',
    description: '跟踪数据如何从存储引擎读取',
    breakpoints: ['handler::rnd_next', 'handler::index_read', 'buf_page_get_gen'],
    watchpoints: ['record[0]', 'buf_block->frame'],
    expectedOutput: [
      'Fetching row from page 123',
      'Index lookup: key=42',
      'Buffer pool hit ratio: 95%'
    ]
  }
]

// 源码文件信息类型
export interface SourceFileInfo {
  path: string
  description: string
  linesOfCode: number
  keyClasses: string[]
  relatedNodes: number[]
}

export const sourceFiles: Record<string, SourceFileInfo> = {
  'sql/sql_parse.cc': {
    path: 'sql/sql_parse.cc',
    description: 'SQL 查询解析和处理的主文件',
    linesOfCode: 12345,
    keyClasses: ['THD', 'Item', 'LEX'],
    relatedNodes: [2, 3, 4, 10]
  },
  'sql/sql_yacc.yy': {
    path: 'sql/sql_yacc.yy',
    description: 'Bison 语法分析器定义',
    linesOfCode: 45678,
    keyClasses: ['LEX', 'Parse_tree_root'],
    relatedNodes: [3]
  },
  'sql/sql_optimizer.cc': {
    path: 'sql/sql_optimizer.cc',
    description: '查询优化器实现',
    linesOfCode: 23456,
    keyClasses: ['JOIN', 'QEP_TAB', 'Optimization_context'],
    relatedNodes: [5, 6]
  },
  'sql/sql_executor.cc': {
    path: 'sql/sql_executor.cc',
    description: '查询执行器实现',
    linesOfCode: 18765,
    keyClasses: ['QEP_TAB', 'JOIN', 'RowIterator'],
    relatedNodes: [7]
  },
  'storage/innobase/handler/ha_innodb.cc': {
    path: 'storage/innobase/handler/ha_innodb.cc',
    description: 'InnoDB 存储引擎处理器',
    linesOfCode: 34567,
    keyClasses: ['handler', 'dict_index_t', 'buf_block_t'],
    relatedNodes: [8]
  }
}
