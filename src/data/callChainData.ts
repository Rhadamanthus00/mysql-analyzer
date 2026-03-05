// 动态调用链追踪数据

// 调用链节点
export interface CallChainNode {
  id: string
  name: string
  fullName: string
  file: string
  line: number
  module: 'sql-layer' | 'optimizer' | 'executor' | 'storage' | 'buffer' | 'parser' | 'network'
  description: string
  codeSnippet: string
  children?: CallChainNode[]
  // 节点在可视化中的位置
  depth: number
  order: number
}

// 调用链步骤（用于动态追踪）
export interface TraceStep {
  id: number
  title: string
  subtitle: string
  description: string
  highlightNodes: string[]  // 高亮的节点 ID
  highlightEdges: [string, string][]  // 高亮的边 [from, to]
  codeContext: {
    file: string
    line: number
    code: string
    explanation: string
  }
  gdbCommand?: string
  keyInsight: string
}

// 调用链场景
export interface CallChainScenario {
  id: string
  title: string
  subtitle: string
  description: string
  rootFunction: string
  markdownTree: string
  nodes: CallChainNode[]
  flatNodes: CallChainNode[]  // 扁平化的节点列表，用于渲染
  edges: { from: string; to: string; label?: string }[]
  steps: TraceStep[]
  tags: string[]
}

// ===== JOIN::optimize() 完整调用链 =====
const joinOptimizeNodes: CallChainNode[] = [
  {
    id: 'mysql_execute_command',
    name: 'mysql_execute_command',
    fullName: 'mysql_execute_command()',
    file: 'sql/sql_parse.cc',
    line: 4726,
    module: 'sql-layer',
    description: 'SQL 命令执行入口，根据命令类型分发到对应处理函数',
    codeSnippet: `int mysql_execute_command(THD *thd, bool first_level) {
  LEX *lex = thd->lex;
  SELECT_LEX *select_lex = lex->select_lex;
  ...
  switch (lex->sql_command) {
    case SQLCOM_SELECT:
      res = execute_sqlcom_select(thd, lex->query_tables);
      break;
    ...
  }
}`,
    depth: 0,
    order: 0
  },
  {
    id: 'execute_sqlcom_select',
    name: 'execute_sqlcom_select',
    fullName: 'execute_sqlcom_select()',
    file: 'sql/sql_select.cc',
    line: 542,
    module: 'sql-layer',
    description: '处理 SELECT 语句，创建 JOIN 对象并调用优化和执行',
    codeSnippet: `bool execute_sqlcom_select(THD *thd, TABLE_LIST *all_tables) {
  JOIN *join;
  ...
  if (select_lex->join != NULL) {
    join = select_lex->join;
  } else {
    join = new JOIN(thd, select_lex);
    select_lex->join = join;
  }
  // 进入优化阶段
  res = handle_query(thd, lex, result, ...);
}`,
    depth: 1,
    order: 0
  },
  {
    id: 'handle_query',
    name: 'handle_query',
    fullName: 'handle_query()',
    file: 'sql/sql_select.cc',
    line: 210,
    module: 'sql-layer',
    description: '查询处理的核心协调函数，串联优化与执行阶段',
    codeSnippet: `bool handle_query(THD *thd, LEX *lex, 
                   Query_result *result, ...) {
  SELECT_LEX *select_lex = lex->unit->first_select();
  JOIN *join = select_lex->join;

  // 阶段一：优化
  if (join->optimize())
    return true;

  // 阶段二：执行
  join->exec();
  return false;
}`,
    depth: 2,
    order: 0
  },
  {
    id: 'join_optimize',
    name: 'JOIN::optimize',
    fullName: 'JOIN::optimize()',
    file: 'sql/sql_optimizer.cc',
    line: 335,
    module: 'optimizer',
    description: 'JOIN 优化器主入口，执行完整的查询优化流程',
    codeSnippet: `int JOIN::optimize() {
  DBUG_ENTER("JOIN::optimize");
  
  // Step 1: 条件简化
  if (simplify_joins(...))
    DBUG_RETURN(1);
    
  // Step 2: 条件优化
  if (optimize_cond(thd, &where_cond, ...))
    DBUG_RETURN(1);
    
  // Step 3: 估算行数
  make_join_statistics(this, ...);
  
  // Step 4: 选择连接顺序
  if (optimize_join_order())
    DBUG_RETURN(1);
    
  // Step 5: 生成执行计划
  if (get_best_combination())
    DBUG_RETURN(1);
    
  // Step 6: 准备执行
  if (make_join_readinfo(this, ...))
    DBUG_RETURN(1);
    
  DBUG_RETURN(0);
}`,
    depth: 3,
    order: 0
  },
  {
    id: 'simplify_joins',
    name: 'simplify_joins',
    fullName: 'simplify_joins()',
    file: 'sql/sql_optimizer.cc',
    line: 890,
    module: 'optimizer',
    description: '简化 JOIN 条件，消除冗余的外连接，转换为内连接',
    codeSnippet: `static bool simplify_joins(THD *thd, 
                            List<TABLE_LIST> *join_list, ...) {
  // 尝试将外连接转为内连接
  // 如果 WHERE 条件使外连接的 NULL 补齐行无法满足，
  // 则可以安全地转为内连接
  if (cond && !table->outer_join) {
    table->outer_join = false;  // 简化为内连接
  }
}`,
    depth: 4,
    order: 0
  },
  {
    id: 'optimize_cond',
    name: 'optimize_cond',
    fullName: 'optimize_cond()',
    file: 'sql/sql_optimizer.cc',
    line: 1200,
    module: 'optimizer',
    description: '优化 WHERE 条件，包括常量折叠、等式传播、条件下推',
    codeSnippet: `bool optimize_cond(THD *thd, Item **cond, ...) {
  // 常量折叠: WHERE 1=1 → 消除
  // 等式传播: a=b AND b=5 → a=5 AND b=5
  // 条件下推: 将条件尽可能推到更低层
  
  if (propagate_cond_constants(thd, cond))
    return true;
  if (remove_eq_conds(thd, *cond, &cond_value))
    return true;
}`,
    depth: 4,
    order: 1
  },
  {
    id: 'make_join_statistics',
    name: 'make_join_statistics',
    fullName: 'make_join_statistics()',
    file: 'sql/sql_optimizer.cc',
    line: 1800,
    module: 'optimizer',
    description: '收集表统计信息，估算行数和成本，为优化器决策提供数据支撑',
    codeSnippet: `static bool make_join_statistics(JOIN *join, ...) {
  // 为每个表收集统计信息
  for (uint i = 0; i < join->tables; i++) {
    TABLE *table = join->join_tab[i].table();
    
    // 从 handler 获取统计信息
    table->file->info(HA_STATUS_VARIABLE | 
                      HA_STATUS_NO_LOCK);
    
    // 估算匹配行数
    records = get_quick_record_count(thd, ...);
  }
  
  // 分析可用的索引
  update_ref_and_keys(thd, ...);
}`,
    depth: 4,
    order: 2
  },
  {
    id: 'update_ref_and_keys',
    name: 'update_ref_and_keys',
    fullName: 'update_ref_and_keys()',
    file: 'sql/sql_optimizer.cc',
    line: 2100,
    module: 'optimizer',
    description: '更新引用关系和可用索引信息，生成 Key_use 数组',
    codeSnippet: `static bool update_ref_and_keys(THD *thd, ...) {
  // 分析 WHERE 条件中可以使用的索引
  Key_use_array *keyuse = &join->keyuse;
  
  // 为每个条件找到匹配的索引
  add_key_fields(thd, &key_fields, ...);
  
  // 生成索引使用计划
  sort_and_filter_keyuse(keyuse);
}`,
    depth: 5,
    order: 0
  },
  {
    id: 'optimize_join_order',
    name: 'optimize_join_order',
    fullName: 'JOIN::optimize_join_order()',
    file: 'sql/sql_optimizer.cc',
    line: 2800,
    module: 'optimizer',
    description: '确定最优的表连接顺序，使用贪心算法或穷举搜索',
    codeSnippet: `bool JOIN::optimize_join_order() {
  DBUG_ENTER("JOIN::optimize_join_order");
  
  if (tables <= max_tables_for_exhaustive_search) {
    // 穷举搜索：尝试所有可能的连接顺序
    if (greedy_search(thd, join_tab, tables, ...))
      DBUG_RETURN(true);
  } else {
    // 启发式搜索
    if (greedy_search(thd, join_tab, tables, ...))
      DBUG_RETURN(true);
  }
  
  DBUG_RETURN(false);
}`,
    depth: 4,
    order: 3
  },
  {
    id: 'greedy_search',
    name: 'greedy_search',
    fullName: 'greedy_search()',
    file: 'sql/sql_planner.cc',
    line: 1200,
    module: 'optimizer',
    description: '贪心搜索算法，逐步选择成本最低的下一个表',
    codeSnippet: `bool greedy_search(THD *thd, JOIN_TAB *join_tab, 
                    uint tables, ...) {
  uint remaining = tables;
  table_map remaining_tables = ~(table_map)0;
  
  for (uint i = 0; i < tables; i++) {
    // 为每个候选表计算最优访问路径
    best_access_path(thd, join_tab[j], 
                     remaining_tables, ...);
    
    // 选择成本最低的表
    pick_table_access_method(&join_tab[best_idx]);
  }
}`,
    depth: 5,
    order: 1
  },
  {
    id: 'best_access_path',
    name: 'best_access_path',
    fullName: 'best_access_path()',
    file: 'sql/sql_planner.cc',
    line: 350,
    module: 'optimizer',
    description: '为给定表选择最优访问路径（全表扫描、索引扫描、ref 访问等）',
    codeSnippet: `void best_access_path(THD *thd, JOIN_TAB *s, 
                       table_map remaining_tables, ...) {
  double best_cost = DBL_MAX;
  
  // 评估全表扫描成本
  double scan_cost = calculate_scan_cost(s);
  
  // 评估每个可用索引
  for (Key_use *keyuse = s->keyuse(); keyuse; ...) {
    double key_cost = calculate_index_cost(s, keyuse);
    if (key_cost < best_cost) {
      best_cost = key_cost;
      s->best_ref = keyuse;
    }
  }
  
  // 选择最优路径
  s->position()->set_prefix_cost(best_cost, ...);
}`,
    depth: 6,
    order: 0
  },
  {
    id: 'get_best_combination',
    name: 'get_best_combination',
    fullName: 'JOIN::get_best_combination()',
    file: 'sql/sql_optimizer.cc',
    line: 3200,
    module: 'optimizer',
    description: '获取最优连接组合，将优化结果转化为可执行的计划',
    codeSnippet: `bool JOIN::get_best_combination() {
  DBUG_ENTER("JOIN::get_best_combination");
  
  // 将最优排列转化为 QEP_TAB 数组
  for (uint tableno = 0; tableno < tables; tableno++) {
    POSITION *pos = best_positions + tableno;
    QEP_TAB *qep_tab = &this->qep_tab[tableno];
    
    qep_tab->set_table(pos->table);
    qep_tab->set_type(pos->type);
    qep_tab->set_index(pos->key);
  }
  
  DBUG_RETURN(false);
}`,
    depth: 4,
    order: 4
  },
  {
    id: 'make_join_readinfo',
    name: 'make_join_readinfo',
    fullName: 'make_join_readinfo()',
    file: 'sql/sql_select.cc',
    line: 3800,
    module: 'executor',
    description: '为每个 QEP_TAB 设置具体的读取函数（read_record 方法）',
    codeSnippet: `static bool make_join_readinfo(JOIN *join, ...) {
  for (uint i = join->const_tables; i < join->tables; i++) {
    QEP_TAB *tab = &join->qep_tab[i];
    
    switch (tab->type()) {
      case JT_REF:
        tab->read_record.read_record = join_read_key;
        break;
      case JT_ALL:
        tab->read_record.read_record = rr_sequential;
        break;
      case JT_INDEX_SCAN:
        tab->read_record.read_record = join_read_first;
        break;
    }
  }
}`,
    depth: 4,
    order: 5
  },
]

// JOIN::optimize 步骤
const joinOptimizeSteps: TraceStep[] = [
  {
    id: 1,
    title: 'SQL 命令分发',
    subtitle: 'mysql_execute_command → execute_sqlcom_select',
    description: '客户端发送 SELECT 查询后，经过解析阶段生成 LEX 结构体。mysql_execute_command() 根据 sql_command 类型将 SELECT 语句分发到 execute_sqlcom_select()，后者创建 JOIN 对象并调用 handle_query()。',
    highlightNodes: ['mysql_execute_command', 'execute_sqlcom_select', 'handle_query'],
    highlightEdges: [['mysql_execute_command', 'execute_sqlcom_select'], ['execute_sqlcom_select', 'handle_query']],
    codeContext: {
      file: 'sql/sql_parse.cc',
      line: 4726,
      code: `switch (lex->sql_command) {
  case SQLCOM_SELECT:
    res = execute_sqlcom_select(thd, lex->query_tables);
    break;
}`,
      explanation: 'LEX 中的 sql_command 标识了 SQL 类型，SELECT 分发到专用处理函数'
    },
    gdbCommand: 'b mysql_execute_command\nb execute_sqlcom_select\nr',
    keyInsight: '这是 SQL 语句从"解析完成"到"开始优化"的转折点。JOIN 对象在此创建。'
  },
  {
    id: 2,
    title: '进入 JOIN 优化器',
    subtitle: 'handle_query → JOIN::optimize',
    description: 'handle_query() 首先调用 join->optimize() 进行查询优化，如果优化成功，再调用 join->exec() 执行查询。这是优化和执行两大阶段的分界线。',
    highlightNodes: ['handle_query', 'join_optimize'],
    highlightEdges: [['handle_query', 'join_optimize']],
    codeContext: {
      file: 'sql/sql_select.cc',
      line: 210,
      code: `// handle_query 核心逻辑
if (join->optimize())  // ← 优化阶段
  return true;
join->exec();          // ← 执行阶段`,
      explanation: 'optimize() 和 exec() 是查询处理的两大核心阶段，清晰分离'
    },
    gdbCommand: 'b JOIN::optimize\nc\nbt 5',
    keyInsight: 'JOIN::optimize() 是整个优化器的入口点，返回 0 表示优化成功。'
  },
  {
    id: 3,
    title: 'Step 1: 简化 JOIN 条件',
    subtitle: 'JOIN::optimize → simplify_joins',
    description: '优化器的第一步是简化 JOIN 结构。尝试将不必要的外连接转换为内连接（当 WHERE 条件隐式排除了 NULL 行时），消除笛卡尔积等。',
    highlightNodes: ['join_optimize', 'simplify_joins'],
    highlightEdges: [['join_optimize', 'simplify_joins']],
    codeContext: {
      file: 'sql/sql_optimizer.cc',
      line: 890,
      code: `// 外连接 → 内连接转换
// 如果 WHERE 条件使 NULL 补齐行不满足条件
// 则外连接可以安全转为内连接
if (cond_rejects_null(where_cond, table)) {
  table->outer_join = false;
}`,
      explanation: '外连接消除是一个重要的优化手段，可以大幅增加优化器的搜索空间'
    },
    gdbCommand: 'b simplify_joins\nc\np join_list->elements',
    keyInsight: '外连接→内连接的转换让优化器有更多的连接顺序选择空间。'
  },
  {
    id: 4,
    title: 'Step 2: 条件优化',
    subtitle: 'JOIN::optimize → optimize_cond',
    description: '对 WHERE 条件进行深度优化：常量折叠（WHERE 1=1 消除），等式传播（a=b AND b=5 → a=5），IN 子查询转 semi-join 等。',
    highlightNodes: ['join_optimize', 'optimize_cond'],
    highlightEdges: [['join_optimize', 'optimize_cond']],
    codeContext: {
      file: 'sql/sql_optimizer.cc',
      line: 1200,
      code: `// 等式传播示例:
// 原始: WHERE t1.a = t2.b AND t2.b = 5
// 优化: WHERE t1.a = 5 AND t2.b = 5
propagate_cond_constants(thd, &cond);

// 移除恒真条件
remove_eq_conds(thd, cond, &cond_value);`,
      explanation: '条件优化减少了运行时的比较次数，并可能使更多索引可用'
    },
    gdbCommand: 'b optimize_cond\nc\np cond->print(thd, ...)',
    keyInsight: '条件优化直接影响后续的索引选择和行数估算。'
  },
  {
    id: 5,
    title: 'Step 3: 统计信息收集',
    subtitle: 'JOIN::optimize → make_join_statistics',
    description: '向存储引擎收集表的统计信息（行数、索引基数等），分析 WHERE 条件中可用的索引（Key_use 分析），估算每个条件的过滤率。',
    highlightNodes: ['join_optimize', 'make_join_statistics', 'update_ref_and_keys'],
    highlightEdges: [['join_optimize', 'make_join_statistics'], ['make_join_statistics', 'update_ref_and_keys']],
    codeContext: {
      file: 'sql/sql_optimizer.cc',
      line: 1800,
      code: `// 获取表统计信息
table->file->info(HA_STATUS_VARIABLE);

// 分析可用索引
update_ref_and_keys(thd, keyuse_array, ...);

// 索引匹配: WHERE id = 5 → 可用主键索引
add_key_fields(thd, &key_fields, cond, ...);`,
      explanation: '统计信息是成本模型的基础，行数估算的准确性直接影响计划质量'
    },
    gdbCommand: 'b make_join_statistics\nc\np table->file->stats.records',
    keyInsight: '存储引擎提供的统计信息是优化器做出决策的关键数据来源。'
  },
  {
    id: 6,
    title: 'Step 4: 连接顺序搜索',
    subtitle: 'JOIN::optimize → optimize_join_order → greedy_search',
    description: '这是优化器最核心的步骤——确定多表连接的顺序。使用贪心搜索算法，逐步选择成本最低的下一个表加入连接序列。对于小表数（≤7），可能使用穷举搜索。',
    highlightNodes: ['join_optimize', 'optimize_join_order', 'greedy_search', 'best_access_path'],
    highlightEdges: [['join_optimize', 'optimize_join_order'], ['optimize_join_order', 'greedy_search'], ['greedy_search', 'best_access_path']],
    codeContext: {
      file: 'sql/sql_planner.cc',
      line: 1200,
      code: `// 贪心搜索: 每步选最优
for (uint i = 0; i < tables; i++) {
  double best_cost = DBL_MAX;
  
  for (each remaining table t) {
    // 评估: 全表扫描 vs 索引扫描 vs ref访问
    best_access_path(thd, t, remaining, ...);
    
    if (t.cost < best_cost) {
      best_cost = t.cost;
      best_table = t;
    }
  }
  result[i] = best_table;
}`,
      explanation: '连接顺序的选择是组合优化问题，贪心算法是时间复杂度和方案质量的平衡'
    },
    gdbCommand: 'b greedy_search\nb best_access_path\nc\np remaining_tables',
    keyInsight: '对于 N 张表，有 N! 种连接顺序。贪心搜索将复杂度从 O(N!) 降到 O(N²)。'
  },
  {
    id: 7,
    title: 'Step 5: 生成执行计划',
    subtitle: 'JOIN::optimize → get_best_combination',
    description: '将优化器选出的最优连接顺序转化为 QEP_TAB 数组——即查询执行计划（Query Execution Plan）。每个 QEP_TAB 对应一个表的访问方式。',
    highlightNodes: ['join_optimize', 'get_best_combination'],
    highlightEdges: [['join_optimize', 'get_best_combination']],
    codeContext: {
      file: 'sql/sql_optimizer.cc',
      line: 3200,
      code: `// 将 POSITION 数组 → QEP_TAB 数组
for (uint i = 0; i < tables; i++) {
  POSITION *pos = best_positions + i;
  QEP_TAB *tab = &qep_tab[i];
  
  tab->set_table(pos->table);    // 绑定表
  tab->set_type(pos->type);      // ref/ALL/range
  tab->set_index(pos->key);      // 使用的索引
  tab->set_condition(pos->cond); // 过滤条件
}`,
      explanation: 'QEP_TAB 是优化器的输出和执行器的输入，是两个阶段的接口'
    },
    gdbCommand: 'b JOIN::get_best_combination\nc\np qep_tab[0].type()',
    keyInsight: 'QEP_TAB 是优化与执行的桥梁，它精确描述了"怎么读每张表"。'
  },
  {
    id: 8,
    title: 'Step 6: 设置读取函数',
    subtitle: 'JOIN::optimize → make_join_readinfo',
    description: '最后一步：为每个 QEP_TAB 设置具体的行读取函数指针。例如 ref 访问使用 join_read_key，全表扫描使用 rr_sequential。optimize() 完成，准备进入执行阶段。',
    highlightNodes: ['join_optimize', 'make_join_readinfo'],
    highlightEdges: [['join_optimize', 'make_join_readinfo']],
    codeContext: {
      file: 'sql/sql_select.cc',
      line: 3800,
      code: `// 根据访问类型设置读取函数
switch (tab->type()) {
  case JT_REF:         // 索引等值查找
    read_record = join_read_key;      break;
  case JT_ALL:         // 全表扫描
    read_record = rr_sequential;      break;
  case JT_INDEX_SCAN:  // 索引全扫描
    read_record = join_read_first;    break;
  case JT_RANGE:       // 范围扫描
    read_record = rr_quick;           break;
}`,
      explanation: '函数指针模式让执行器无需关心具体的访问方式，实现了优化器和执行器的解耦'
    },
    gdbCommand: 'b make_join_readinfo\nc\np tab->read_record.read_record',
    keyInsight: '优化完成！read_record 函数指针是连接优化器和存储引擎的最后一环。'
  }
]

// JOIN::optimize 的 Markdown 树状图
const joinOptimizeMarkdownTree = `\`\`\`
mysql_execute_command()                    ← SQL命令分发入口
│
├── execute_sqlcom_select()               ← SELECT 处理
│   │
│   └── handle_query()                    ← 查询处理协调
│       │
│       └── JOIN::optimize()              ← ★ 优化器主入口
│           │
│           ├── [Step 1] simplify_joins()  ← 简化JOIN条件
│           │   └── 外连接 → 内连接转换
│           │
│           ├── [Step 2] optimize_cond()   ← 条件优化
│           │   ├── propagate_cond_constants()  ← 常量传播
│           │   └── remove_eq_conds()           ← 移除恒真条件
│           │
│           ├── [Step 3] make_join_statistics() ← 统计信息收集
│           │   ├── handler::info()             ← 获取行数/索引信息
│           │   └── update_ref_and_keys()       ← 分析可用索引
│           │       └── add_key_fields()        ← 索引匹配
│           │
│           ├── [Step 4] optimize_join_order()  ← 连接顺序优化
│           │   └── greedy_search()             ← 贪心搜索
│           │       └── best_access_path()      ← 最优访问路径
│           │           ├── 全表扫描成本
│           │           ├── 索引扫描成本
│           │           └── ref 访问成本
│           │
│           ├── [Step 5] get_best_combination() ← 生成执行计划
│           │   └── POSITION[] → QEP_TAB[]
│           │
│           └── [Step 6] make_join_readinfo()   ← 设置读取函数
│               ├── JT_REF  → join_read_key
│               ├── JT_ALL  → rr_sequential
│               └── JT_RANGE → rr_quick
\`\`\``

// ===== SELECT 完整执行链路 =====
const selectExecutionMarkdownTree = `\`\`\`
handle_one_connection()                      ← 连接线程入口
│
└── do_command()                             ← 命令循环
    │
    └── dispatch_command(COM_QUERY)           ← 命令分发
        │
        └── mysql_parse()                    ← SQL解析
            │
            ├── THD::sql_parser()            ← 词法分析
            │   └── MYSQLparse()             ← Flex/Bison
            │
            ├── yyparse()                    ← 语法分析
            │   └── 生成 Parse_tree
            │
            └── mysql_execute_command()      ← 执行
                │
                └── execute_sqlcom_select()
                    │
                    └── handle_query()
                        │
                        ├── JOIN::optimize()     ← 优化阶段
                        │   └── [见 JOIN::optimize 详细链路]
                        │
                        └── JOIN::exec()         ← 执行阶段
                            │
                            ├── sub_select()
                            │   └── evaluate_join_record()
                            │
                            └── handler::ha_rnd_next()
                                └── ha_innodb::rnd_next()
                                    └── row_search_mvcc()
\`\`\``

const selectExecutionSteps: TraceStep[] = [
  {
    id: 1,
    title: '连接处理',
    subtitle: 'handle_one_connection → do_command',
    description: '每个客户端连接由一个独立线程处理。handle_one_connection() 是线程入口，进入 do_command() 循环等待并处理命令。',
    highlightNodes: ['select_handle_connection', 'select_do_command'],
    highlightEdges: [['select_handle_connection', 'select_do_command']],
    codeContext: {
      file: 'sql/conn_handler/connection_handler_per_thread.cc',
      line: 40,
      code: `for (;;) {
  if (do_command(thd))
    break;  // 客户端断开或出错
}`,
      explanation: '每个连接一个线程的模型，do_command 是命令处理的核心循环'
    },
    keyInsight: 'MySQL 使用 one-thread-per-connection 模型，THD 是整个会话的上下文。'
  },
  {
    id: 2,
    title: '命令分发',
    subtitle: 'dispatch_command → mysql_parse',
    description: '从网络读取数据包，识别命令类型为 COM_QUERY，提取 SQL 文本，调用 mysql_parse() 进入解析流程。',
    highlightNodes: ['select_dispatch_command', 'select_mysql_parse'],
    highlightEdges: [['select_do_command', 'select_dispatch_command'], ['select_dispatch_command', 'select_mysql_parse']],
    codeContext: {
      file: 'sql/sql_parse.cc',
      line: 160,
      code: `case COM_QUERY: {
  const char *query = packet;
  mysql_parse(thd, query, length);
  break;
}`,
      explanation: 'COM_QUERY 是最常见的命令类型，对应所有 SQL 语句'
    },
    keyInsight: 'MySQL 协议定义了 COM_QUERY、COM_PING 等命令类型，SQL 都走 COM_QUERY。'
  },
  {
    id: 3,
    title: '词法和语法分析',
    subtitle: 'mysql_parse → sql_parser → yyparse',
    description: '使用 Flex 做词法分析将 SQL 文本分解为 token 序列，Bison 做语法分析生成 Parse Tree（解析树），并填充 LEX 结构。',
    highlightNodes: ['select_mysql_parse', 'select_sql_parser', 'select_yyparse'],
    highlightEdges: [['select_mysql_parse', 'select_sql_parser'], ['select_sql_parser', 'select_yyparse']],
    codeContext: {
      file: 'sql/sql_parse.cc',
      line: 210,
      code: `// 词法分析
if (!thd->sql_parser()) {
  // 语法分析
  if (!yyparse(&ps)) {
    LEX *lex = thd->lex;
    // lex->sql_command == SQLCOM_SELECT
  }
}`,
      explanation: 'Flex 负责 tokenize，Bison 负责语法匹配，结果存在 LEX 结构中'
    },
    keyInsight: 'LEX 结构是解析器的输出，包含了 SQL 的完整语义信息。'
  },
  {
    id: 4,
    title: '优化与执行',
    subtitle: 'mysql_execute_command → handle_query → optimize + exec',
    description: '根据 LEX 中的命令类型分发到 execute_sqlcom_select()，创建 JOIN 对象，先调用 optimize() 再调用 exec()。',
    highlightNodes: ['select_execute_command', 'select_handle_query', 'select_optimize', 'select_exec'],
    highlightEdges: [['select_mysql_parse', 'select_execute_command'], ['select_execute_command', 'select_handle_query'], ['select_handle_query', 'select_optimize'], ['select_handle_query', 'select_exec']],
    codeContext: {
      file: 'sql/sql_select.cc',
      line: 210,
      code: `// 查询处理核心
join->optimize();  // 生成最优计划
join->exec();      // 按计划执行`,
      explanation: '优化和执行是 SELECT 处理的两大阶段，由 JOIN 对象统一管理'
    },
    keyInsight: 'optimize() 决定"怎么做"，exec() 按计划"去做"。'
  },
  {
    id: 5,
    title: '执行与存储引擎交互',
    subtitle: 'JOIN::exec → handler → InnoDB',
    description: '执行器通过 handler API 与存储引擎交互。ha_innodb::rnd_next() 从 InnoDB 读取数据行，经过 WHERE 过滤后返回给客户端。',
    highlightNodes: ['select_exec', 'select_sub_select', 'select_handler', 'select_innodb'],
    highlightEdges: [['select_exec', 'select_sub_select'], ['select_sub_select', 'select_handler'], ['select_handler', 'select_innodb']],
    codeContext: {
      file: 'storage/innobase/handler/ha_innodb.cc',
      line: 590,
      code: `int ha_innodb::rnd_next(uchar *buf) {
  int rc = row_search_mvcc(buf, ...);
  if (rc == DB_END_OF_INDEX)
    return HA_ERR_END_OF_FILE;
  return 0;
}`,
      explanation: 'handler API 是 SQL 层和存储引擎的桥梁，实现了插件化架构'
    },
    keyInsight: 'MySQL 的 handler API 使得更换存储引擎成为可能，这是其架构的精髓。'
  }
]

const selectExecutionNodes: CallChainNode[] = [
  { id: 'select_handle_connection', name: 'handle_one_connection', fullName: 'handle_one_connection()', file: 'sql/conn_handler/connection_handler_per_thread.cc', line: 40, module: 'network', description: '连接线程入口函数', codeSnippet: '', depth: 0, order: 0 },
  { id: 'select_do_command', name: 'do_command', fullName: 'do_command()', file: 'sql/conn_handler/connection_handler_per_thread.cc', line: 84, module: 'network', description: '命令处理循环', codeSnippet: '', depth: 1, order: 0 },
  { id: 'select_dispatch_command', name: 'dispatch_command', fullName: 'dispatch_command()', file: 'sql/sql_parse.cc', line: 160, module: 'sql-layer', description: '命令分发', codeSnippet: '', depth: 2, order: 0 },
  { id: 'select_mysql_parse', name: 'mysql_parse', fullName: 'mysql_parse()', file: 'sql/sql_parse.cc', line: 210, module: 'parser', description: 'SQL 解析入口', codeSnippet: '', depth: 3, order: 0 },
  { id: 'select_sql_parser', name: 'THD::sql_parser', fullName: 'THD::sql_parser()', file: 'sql/sql_parse.cc', line: 257, module: 'parser', description: '词法分析', codeSnippet: '', depth: 4, order: 0 },
  { id: 'select_yyparse', name: 'yyparse', fullName: 'yyparse()', file: 'sql/sql_yacc.yy', line: 5000, module: 'parser', description: '语法分析', codeSnippet: '', depth: 4, order: 1 },
  { id: 'select_execute_command', name: 'mysql_execute_command', fullName: 'mysql_execute_command()', file: 'sql/sql_parse.cc', line: 4726, module: 'sql-layer', description: 'SQL 命令执行', codeSnippet: '', depth: 4, order: 2 },
  { id: 'select_handle_query', name: 'handle_query', fullName: 'handle_query()', file: 'sql/sql_select.cc', line: 210, module: 'sql-layer', description: '查询协调', codeSnippet: '', depth: 5, order: 0 },
  { id: 'select_optimize', name: 'JOIN::optimize', fullName: 'JOIN::optimize()', file: 'sql/sql_optimizer.cc', line: 335, module: 'optimizer', description: '查询优化', codeSnippet: '', depth: 6, order: 0 },
  { id: 'select_exec', name: 'JOIN::exec', fullName: 'JOIN::exec()', file: 'sql/sql_executor.cc', line: 200, module: 'executor', description: '查询执行', codeSnippet: '', depth: 6, order: 1 },
  { id: 'select_sub_select', name: 'sub_select', fullName: 'sub_select()', file: 'sql/sql_executor.cc', line: 1200, module: 'executor', description: '迭代读取', codeSnippet: '', depth: 7, order: 0 },
  { id: 'select_handler', name: 'handler::ha_rnd_next', fullName: 'handler::ha_rnd_next()', file: 'sql/handler.cc', line: 2800, module: 'storage', description: 'Handler 接口', codeSnippet: '', depth: 8, order: 0 },
  { id: 'select_innodb', name: 'ha_innodb::rnd_next', fullName: 'ha_innodb::rnd_next()', file: 'storage/innobase/handler/ha_innodb.cc', line: 590, module: 'storage', description: 'InnoDB 读取', codeSnippet: '', depth: 9, order: 0 },
]

// 导出场景数据
export const callChainScenarios: CallChainScenario[] = [
  {
    id: 'join-optimize',
    title: 'JOIN::optimize() 完整调用链路',
    subtitle: '查询优化器核心流程',
    description: '深入追踪 MySQL 查询优化器的完整调用链，从 SQL 命令分发到最终生成 QEP 执行计划的 6 个关键步骤。',
    rootFunction: 'JOIN::optimize',
    markdownTree: joinOptimizeMarkdownTree,
    nodes: joinOptimizeNodes,
    flatNodes: joinOptimizeNodes,
    edges: [
      { from: 'mysql_execute_command', to: 'execute_sqlcom_select', label: '分发 SELECT' },
      { from: 'execute_sqlcom_select', to: 'handle_query', label: '创建 JOIN' },
      { from: 'handle_query', to: 'join_optimize', label: '调用优化器' },
      { from: 'join_optimize', to: 'simplify_joins', label: 'Step 1' },
      { from: 'join_optimize', to: 'optimize_cond', label: 'Step 2' },
      { from: 'join_optimize', to: 'make_join_statistics', label: 'Step 3' },
      { from: 'make_join_statistics', to: 'update_ref_and_keys' },
      { from: 'join_optimize', to: 'optimize_join_order', label: 'Step 4' },
      { from: 'optimize_join_order', to: 'greedy_search' },
      { from: 'greedy_search', to: 'best_access_path' },
      { from: 'join_optimize', to: 'get_best_combination', label: 'Step 5' },
      { from: 'join_optimize', to: 'make_join_readinfo', label: 'Step 6' },
    ],
    steps: joinOptimizeSteps,
    tags: ['优化器', '成本模型', '连接顺序', 'QEP']
  },
  {
    id: 'select-execution',
    title: 'SELECT 完整执行链路',
    subtitle: '从连接到返回结果',
    description: '追踪一条 SELECT 语句从客户端连接、SQL 解析、优化、执行到存储引擎读取的完整链路。',
    rootFunction: 'handle_one_connection',
    markdownTree: selectExecutionMarkdownTree,
    nodes: selectExecutionNodes,
    flatNodes: selectExecutionNodes,
    edges: [
      { from: 'select_handle_connection', to: 'select_do_command' },
      { from: 'select_do_command', to: 'select_dispatch_command' },
      { from: 'select_dispatch_command', to: 'select_mysql_parse' },
      { from: 'select_mysql_parse', to: 'select_sql_parser' },
      { from: 'select_sql_parser', to: 'select_yyparse' },
      { from: 'select_mysql_parse', to: 'select_execute_command' },
      { from: 'select_execute_command', to: 'select_handle_query' },
      { from: 'select_handle_query', to: 'select_optimize' },
      { from: 'select_handle_query', to: 'select_exec' },
      { from: 'select_exec', to: 'select_sub_select' },
      { from: 'select_sub_select', to: 'select_handler' },
      { from: 'select_handler', to: 'select_innodb' },
    ],
    steps: selectExecutionSteps,
    tags: ['全链路', '解析', '执行', 'InnoDB']
  }
]

export function getScenarioById(id: string): CallChainScenario | undefined {
  return callChainScenarios.find(s => s.id === id)
}
