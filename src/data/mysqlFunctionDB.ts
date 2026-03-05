// MySQL 函数知识库 — 支持任意函数查询及动态调用链生成

export interface FunctionInfo {
  name: string                // 函数简名
  fullName: string            // 完整签名
  file: string                // 所在文件
  line: number                // 行号
  module: string              // 所属模块
  description: string         // 功能描述
  codeSnippet: string         // 代码片段
  callers: string[]           // 调用者列表（函数简名）
  callees: string[]           // 被调用函数列表
  gdbCommand?: string         // GDB 断点命令
  keyInsight?: string         // 关键洞察
}

// 完整的 MySQL 函数调用关系图谱
const functionDatabase: Record<string, FunctionInfo> = {
  // ============ 网络层 ============
  'handle_one_connection': {
    name: 'handle_one_connection',
    fullName: 'handle_one_connection()',
    file: 'sql/conn_handler/connection_handler_per_thread.cc',
    line: 40,
    module: 'network',
    description: '每个客户端连接的线程入口。MySQL 使用 one-thread-per-connection 模型，该函数是新线程的起点。',
    codeSnippet: `void handle_one_connection(THD *thd) {
  thd->thread_stack = (char*)&thd;
  thd->store_globals();
  
  for (;;) {
    if (do_command(thd))
      break;  // 客户端断开或出错
  }
  close_connection(thd);
}`,
    callers: [],
    callees: ['do_command', 'close_connection'],
    gdbCommand: 'b handle_one_connection\nr',
    keyInsight: 'MySQL 使用 one-thread-per-connection 模型，THD 是整个会话的上下文对象。'
  },
  'do_command': {
    name: 'do_command',
    fullName: 'do_command(THD*)',
    file: 'sql/sql_parse.cc',
    line: 84,
    module: 'network',
    description: '命令处理循环，从网络读取一个完整的命令包，根据命令类型调用 dispatch_command。',
    codeSnippet: `bool do_command(THD *thd) {
  NET *net = &thd->net;
  
  // 从网络读取命令
  my_net_read(net);
  
  enum_server_command command = 
    (enum_server_command)net->buff[0];
  
  return dispatch_command(thd, command, 
                          net->buff+1, length);
}`,
    callers: ['handle_one_connection'],
    callees: ['dispatch_command'],
    gdbCommand: 'b do_command\nc',
    keyInsight: '每个 SQL 请求都经过 do_command，它是性能监控和审计的关键钩子点。'
  },
  'dispatch_command': {
    name: 'dispatch_command',
    fullName: 'dispatch_command(THD*, enum_server_command, const char*, size_t)',
    file: 'sql/sql_parse.cc',
    line: 160,
    module: 'sql-layer',
    description: '根据 MySQL 协议命令类型进行分发。COM_QUERY（SQL 语句）、COM_PING、COM_QUIT 等各走不同处理逻辑。',
    codeSnippet: `bool dispatch_command(THD *thd, 
    enum_server_command command, ...) {
  switch (command) {
    case COM_QUERY:
      mysql_parse(thd, query, length);
      break;
    case COM_PING:
      my_ok(thd); break;
    case COM_QUIT:
      return true;
  }
}`,
    callers: ['do_command'],
    callees: ['mysql_parse'],
    gdbCommand: 'b dispatch_command\nc\np command',
    keyInsight: 'COM_QUERY 是最常见的命令类型，所有 SQL 语句（SELECT/INSERT/UPDATE/DELETE）都走这条路径。'
  },

  // ============ 解析器 ============
  'mysql_parse': {
    name: 'mysql_parse',
    fullName: 'mysql_parse(THD*, const char*, size_t)',
    file: 'sql/sql_parse.cc',
    line: 5500,
    module: 'parser',
    description: 'SQL 解析入口。调用词法分析器和语法分析器将 SQL 文本转化为 LEX 结构，然后调用 mysql_execute_command 执行。',
    codeSnippet: `void mysql_parse(THD *thd, const char *rawbuf, 
                  uint length) {
  Parser_state parser_state;
  parser_state.init(thd, rawbuf, length);
  
  // 解析 SQL
  parse_sql(thd, &parser_state);
  
  // 执行
  mysql_execute_command(thd, true);
}`,
    callers: ['dispatch_command'],
    callees: ['parse_sql', 'mysql_execute_command'],
    gdbCommand: 'b mysql_parse\nc\np rawbuf',
    keyInsight: 'mysql_parse 是"解析"和"执行"两大阶段的分界点。'
  },
  'parse_sql': {
    name: 'parse_sql',
    fullName: 'parse_sql(THD*, Parser_state*)',
    file: 'sql/sql_parse.cc',
    line: 6800,
    module: 'parser',
    description: '调用 Bison 生成的语法分析器 MYSQLparse() 解析 SQL 文本，生成 Parse Tree 并填充 LEX 结构。',
    codeSnippet: `bool parse_sql(THD *thd, Parser_state *ps) {
  // 初始化词法分析器
  lex_start(thd);
  
  // 调用 Bison 语法分析器
  bool err = MYSQLparse(thd);
  
  // 分析结果存储在 thd->lex
  return err;
}`,
    callers: ['mysql_parse'],
    callees: ['MYSQLparse', 'lex_start'],
    gdbCommand: 'b parse_sql\nc',
    keyInsight: 'Bison 语法分析器根据 sql_yacc.yy 规则文件生成，解析结果存入 LEX。'
  },
  'MYSQLparse': {
    name: 'MYSQLparse',
    fullName: 'MYSQLparse(THD*)',
    file: 'sql/sql_yacc.cc',
    line: 1,
    module: 'parser',
    description: '由 Bison 自动生成的语法分析器，根据 sql_yacc.yy 中的文法规则将 token 流转化为 Parse Tree。',
    codeSnippet: `// 自动生成的语法分析器 (Bison)
int MYSQLparse(THD *thd) {
  // LALR(1) 自动机驱动
  // 匹配 sql_yacc.yy 中的产生式
  // 构建 Parse Tree
  ...
}`,
    callers: ['parse_sql'],
    callees: ['MYSQLlex'],
    gdbCommand: 'b MYSQLparse\nc',
    keyInsight: '这是一个由 Bison 工具自动生成的 LALR(1) 分析器，不建议手动修改。'
  },

  // ============ SQL 层 ============
  'mysql_execute_command': {
    name: 'mysql_execute_command',
    fullName: 'mysql_execute_command(THD*, bool)',
    file: 'sql/sql_parse.cc',
    line: 4726,
    module: 'sql-layer',
    description: 'SQL 命令执行总入口。根据 LEX 中的 sql_command 类型分发到对应的处理函数（SELECT、INSERT、UPDATE、DELETE 等）。',
    codeSnippet: `int mysql_execute_command(THD *thd, bool first_level) {
  LEX *lex = thd->lex;
  
  switch (lex->sql_command) {
    case SQLCOM_SELECT:
      res = execute_sqlcom_select(thd, lex->query_tables);
      break;
    case SQLCOM_INSERT:
      res = mysql_insert(thd, lex->query_tables, ...);
      break;
    case SQLCOM_UPDATE:
      res = mysql_update(thd, lex->query_tables, ...);
      break;
    case SQLCOM_DELETE:
      res = mysql_delete(thd, lex->query_tables, ...);
      break;
  }
}`,
    callers: ['mysql_parse'],
    callees: ['execute_sqlcom_select', 'mysql_insert', 'mysql_update', 'mysql_delete'],
    gdbCommand: 'b mysql_execute_command\nc\np lex->sql_command',
    keyInsight: '这是所有 SQL 命令的执行入口，通过 switch-case 分发到约 200 种命令类型的处理函数。'
  },
  'execute_sqlcom_select': {
    name: 'execute_sqlcom_select',
    fullName: 'execute_sqlcom_select(THD*, TABLE_LIST*)',
    file: 'sql/sql_select.cc',
    line: 542,
    module: 'sql-layer',
    description: '处理 SELECT 语句，创建 JOIN 对象并调用 handle_query 进行优化和执行。',
    codeSnippet: `bool execute_sqlcom_select(THD *thd, TABLE_LIST *all_tables) {
  JOIN *join;
  if (select_lex->join != NULL) {
    join = select_lex->join;
  } else {
    join = new JOIN(thd, select_lex);
    select_lex->join = join;
  }
  res = handle_query(thd, lex, result, ...);
}`,
    callers: ['mysql_execute_command'],
    callees: ['handle_query'],
    gdbCommand: 'b execute_sqlcom_select\nc',
    keyInsight: 'JOIN 对象是整个查询优化和执行的核心数据结构，即使是单表查询也会创建 JOIN。'
  },
  'handle_query': {
    name: 'handle_query',
    fullName: 'handle_query(THD*, LEX*, Query_result*, ...)',
    file: 'sql/sql_select.cc',
    line: 210,
    module: 'sql-layer',
    description: '查询处理的核心协调函数，串联优化与执行两大阶段：先调用 JOIN::optimize()，再调用 JOIN::exec()。',
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
    callers: ['execute_sqlcom_select'],
    callees: ['JOIN::optimize', 'JOIN::exec'],
    gdbCommand: 'b handle_query\nc',
    keyInsight: 'handle_query 是优化和执行两大阶段的分界线，也是理解查询处理的最佳切入点。'
  },

  // ============ 优化器 ============
  'JOIN::optimize': {
    name: 'JOIN::optimize',
    fullName: 'JOIN::optimize()',
    file: 'sql/sql_optimizer.cc',
    line: 335,
    module: 'optimizer',
    description: 'JOIN 优化器主入口，按序执行 6 个关键步骤：简化 JOIN、条件优化、统计信息收集、连接顺序搜索、生成执行计划、设置读取函数。',
    codeSnippet: `int JOIN::optimize() {
  DBUG_ENTER("JOIN::optimize");
  
  // Step 1: 简化 JOIN 条件
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
    callers: ['handle_query'],
    callees: ['simplify_joins', 'optimize_cond', 'make_join_statistics', 'optimize_join_order', 'get_best_combination', 'make_join_readinfo'],
    gdbCommand: 'b JOIN::optimize\nc\nbt 5',
    keyInsight: 'JOIN::optimize() 是查询优化器的心脏，包含了从条件简化到执行计划生成的全部核心逻辑。'
  },
  'simplify_joins': {
    name: 'simplify_joins',
    fullName: 'simplify_joins(THD*, List<TABLE_LIST>*, ...)',
    file: 'sql/sql_optimizer.cc',
    line: 890,
    module: 'optimizer',
    description: '简化 JOIN 条件：将不必要的外连接转换为内连接（当 WHERE 条件使外连接的 NULL 补齐行不可能满足时），消除冗余连接。',
    codeSnippet: `static bool simplify_joins(THD *thd, 
    List<TABLE_LIST> *join_list, ...) {
  // 尝试将外连接转为内连接
  if (cond_rejects_null(where_cond, table)) {
    table->outer_join = false;
  }
}`,
    callers: ['JOIN::optimize'],
    callees: [],
    gdbCommand: 'b simplify_joins\nc\np join_list->elements',
    keyInsight: '外连接→内连接的转换使优化器获得更大的连接顺序搜索空间。'
  },
  'optimize_cond': {
    name: 'optimize_cond',
    fullName: 'optimize_cond(THD*, Item**, ...)',
    file: 'sql/sql_optimizer.cc',
    line: 1200,
    module: 'optimizer',
    description: '优化 WHERE 条件：常量折叠（WHERE 1=1 → 消除），等式传播（a=b AND b=5 → a=5 AND b=5），条件下推。',
    codeSnippet: `bool optimize_cond(THD *thd, Item **cond, ...) {
  // 等式传播: a=b AND b=5 → a=5 AND b=5
  propagate_cond_constants(thd, cond);
  
  // 移除恒真条件
  remove_eq_conds(thd, *cond, &cond_value);
}`,
    callers: ['JOIN::optimize'],
    callees: ['propagate_cond_constants', 'remove_eq_conds'],
    gdbCommand: 'b optimize_cond\nc',
    keyInsight: '条件优化直接影响后续的索引选择和行数估算，是性能优化的基础。'
  },
  'propagate_cond_constants': {
    name: 'propagate_cond_constants',
    fullName: 'propagate_cond_constants(THD*, Item**)',
    file: 'sql/sql_optimizer.cc',
    line: 1400,
    module: 'optimizer',
    description: '等式传播优化：如果已知 a=b 且 b=5，则可推导 a=5。这使得更多索引条件可用。',
    codeSnippet: `// 等式传播算法
// 输入: WHERE t1.a = t2.b AND t2.b = 5
// 输出: WHERE t1.a = 5 AND t2.b = 5
void propagate_cond_constants(THD *thd, Item **cond) {
  ...
}`,
    callers: ['optimize_cond'],
    callees: [],
    gdbCommand: 'b propagate_cond_constants\nc',
    keyInsight: '等式传播可以使原本不能使用索引的列变为可索引，显著提升性能。'
  },
  'remove_eq_conds': {
    name: 'remove_eq_conds',
    fullName: 'remove_eq_conds(THD*, Item*, Item_equal**)',
    file: 'sql/sql_optimizer.cc',
    line: 1500,
    module: 'optimizer',
    description: '移除恒真条件（如 1=1）和恒假条件（如 1=0），简化条件树。',
    codeSnippet: `Item *remove_eq_conds(THD *thd, Item *cond, 
    Item::cond_result *cond_value) {
  if (cond->const_item()) {
    if (cond->val_int())
      *cond_value = Item::COND_TRUE;
    else
      *cond_value = Item::COND_FALSE;
    return NULL;
  }
}`,
    callers: ['optimize_cond'],
    callees: [],
    gdbCommand: 'b remove_eq_conds\nc',
    keyInsight: '恒假条件可以让优化器直接返回空结果集，避免不必要的表访问。'
  },
  'make_join_statistics': {
    name: 'make_join_statistics',
    fullName: 'make_join_statistics(JOIN*, ...)',
    file: 'sql/sql_optimizer.cc',
    line: 1800,
    module: 'optimizer',
    description: '收集表统计信息：从存储引擎获取行数、索引基数等信息，分析 WHERE 条件中可用的索引，生成 Key_use 数组。',
    codeSnippet: `static bool make_join_statistics(JOIN *join, ...) {
  for (uint i = 0; i < join->tables; i++) {
    TABLE *table = join->join_tab[i].table();
    
    // 从存储引擎获取统计信息
    table->file->info(HA_STATUS_VARIABLE | 
                      HA_STATUS_NO_LOCK);
    
    // 估算匹配行数
    records = get_quick_record_count(thd, ...);
  }
  
  // 分析可用索引
  update_ref_and_keys(thd, ...);
}`,
    callers: ['JOIN::optimize'],
    callees: ['update_ref_and_keys', 'get_quick_record_count'],
    gdbCommand: 'b make_join_statistics\nc\np table->file->stats.records',
    keyInsight: '统计信息的准确性直接决定了优化器能否选出最优执行计划。ANALYZE TABLE 可更新统计信息。'
  },
  'update_ref_and_keys': {
    name: 'update_ref_and_keys',
    fullName: 'update_ref_and_keys(THD*, ...)',
    file: 'sql/sql_optimizer.cc',
    line: 2100,
    module: 'optimizer',
    description: '更新引用关系和可用索引信息：分析 WHERE 条件中哪些列可以使用索引，生成 Key_use 数组。',
    codeSnippet: `static bool update_ref_and_keys(THD *thd, ...) {
  Key_use_array *keyuse = &join->keyuse;
  
  // 分析每个条件对应的索引
  add_key_fields(thd, &key_fields, ...);
  
  // 排序和过滤
  sort_and_filter_keyuse(keyuse);
}`,
    callers: ['make_join_statistics'],
    callees: ['add_key_fields'],
    gdbCommand: 'b update_ref_and_keys\nc',
    keyInsight: 'Key_use 数组记录了每个可用的索引使用方案，是连接顺序搜索的输入。'
  },
  'add_key_fields': {
    name: 'add_key_fields',
    fullName: 'add_key_fields(THD*, Key_field**, ...)',
    file: 'sql/sql_optimizer.cc',
    line: 2300,
    module: 'optimizer',
    description: '遍历 WHERE 条件，找出所有可以使用索引的条件，为每个匹配的索引创建 Key_field 记录。',
    codeSnippet: `static void add_key_fields(THD *thd,
    Key_field **key_fields, ...) {
  // 对于 WHERE t1.id = 5
  // 如果 t1.id 上有索引，创建 Key_field
  if (field->key_start && 
      field->part_of_key.is_set(index)) {
    add_key_field(key_fields, field, ...);
  }
}`,
    callers: ['update_ref_and_keys'],
    callees: [],
    gdbCommand: 'b add_key_fields\nc',
    keyInsight: '索引匹配是自动的，优化器会尝试为每个 WHERE 条件找到可用索引。'
  },
  'optimize_join_order': {
    name: 'optimize_join_order',
    fullName: 'JOIN::optimize_join_order()',
    file: 'sql/sql_optimizer.cc',
    line: 2800,
    module: 'optimizer',
    description: '确定最优的表连接顺序。对于表数 ≤ optimizer_search_depth 使用穷举搜索，否则使用贪心搜索。',
    codeSnippet: `bool JOIN::optimize_join_order() {
  DBUG_ENTER("JOIN::optimize_join_order");
  
  if (tables <= max_tables_for_exhaustive) {
    // 穷举搜索
    greedy_search(thd, join_tab, tables, ...);
  } else {
    // 启发式搜索
    greedy_search(thd, join_tab, tables, ...);
  }
  
  DBUG_RETURN(false);
}`,
    callers: ['JOIN::optimize'],
    callees: ['greedy_search'],
    gdbCommand: 'b JOIN::optimize_join_order\nc',
    keyInsight: 'optimizer_search_depth 参数控制搜索深度，增大可以找到更优计划但更耗时。'
  },
  'greedy_search': {
    name: 'greedy_search',
    fullName: 'greedy_search(THD*, JOIN_TAB*, uint, ...)',
    file: 'sql/sql_planner.cc',
    line: 1200,
    module: 'optimizer',
    description: '贪心搜索算法：逐步选择成本最低的下一个表加入连接序列。每一步对所有候选表调用 best_access_path 评估。',
    codeSnippet: `bool greedy_search(THD *thd, JOIN_TAB *join_tab, 
                    uint tables, ...) {
  for (uint i = 0; i < tables; i++) {
    double best_cost = DBL_MAX;
    
    for (each remaining table t) {
      best_access_path(thd, t, remaining, ...);
      if (t.cost < best_cost) {
        best_cost = t.cost;
        best_table = t;
      }
    }
    result[i] = best_table;
  }
}`,
    callers: ['optimize_join_order'],
    callees: ['best_access_path'],
    gdbCommand: 'b greedy_search\nc\np remaining_tables',
    keyInsight: 'N 张表有 N! 种连接顺序，贪心搜索将复杂度从 O(N!) 降到 O(N²)。'
  },
  'best_access_path': {
    name: 'best_access_path',
    fullName: 'best_access_path(THD*, JOIN_TAB*, table_map, ...)',
    file: 'sql/sql_planner.cc',
    line: 350,
    module: 'optimizer',
    description: '为给定表选择最优访问路径：比较全表扫描、索引扫描、ref 访问、range 扫描等方式的成本。',
    codeSnippet: `void best_access_path(THD *thd, JOIN_TAB *s, 
    table_map remaining_tables, ...) {
  double best_cost = DBL_MAX;
  
  // 评估全表扫描
  double scan_cost = calculate_scan_cost(s);
  
  // 评估每个可用索引
  for (Key_use *keyuse = s->keyuse(); ...) {
    double key_cost = calculate_index_cost(s, keyuse);
    if (key_cost < best_cost) {
      best_cost = key_cost;
      s->best_ref = keyuse;
    }
  }
}`,
    callers: ['greedy_search'],
    callees: [],
    gdbCommand: 'b best_access_path\nc\np s->table()->s->table_name.str',
    keyInsight: '成本模型基于 IO 成本 + CPU 成本，考虑了缓存命中率、索引选择性等因素。'
  },
  'get_best_combination': {
    name: 'get_best_combination',
    fullName: 'JOIN::get_best_combination()',
    file: 'sql/sql_optimizer.cc',
    line: 3200,
    module: 'optimizer',
    description: '获取最优连接组合：将优化器选出的 POSITION 数组转化为 QEP_TAB 数组（查询执行计划）。',
    codeSnippet: `bool JOIN::get_best_combination() {
  for (uint i = 0; i < tables; i++) {
    POSITION *pos = best_positions + i;
    QEP_TAB *tab = &qep_tab[i];
    
    tab->set_table(pos->table);
    tab->set_type(pos->type);
    tab->set_index(pos->key);
  }
}`,
    callers: ['JOIN::optimize'],
    callees: [],
    gdbCommand: 'b JOIN::get_best_combination\nc\np qep_tab[0].type()',
    keyInsight: 'QEP_TAB 是优化器输出和执行器输入的接口，精确描述了每张表的访问方式。'
  },
  'make_join_readinfo': {
    name: 'make_join_readinfo',
    fullName: 'make_join_readinfo(JOIN*, ...)',
    file: 'sql/sql_select.cc',
    line: 3800,
    module: 'executor',
    description: '为每个 QEP_TAB 设置具体的行读取函数指针（read_record）。这是优化器的最后一步。',
    codeSnippet: `static bool make_join_readinfo(JOIN *join, ...) {
  for (uint i = 0; i < join->tables; i++) {
    QEP_TAB *tab = &join->qep_tab[i];
    switch (tab->type()) {
      case JT_REF:
        tab->read_record = join_read_key;     break;
      case JT_ALL:
        tab->read_record = rr_sequential;     break;
      case JT_INDEX_SCAN:
        tab->read_record = join_read_first;   break;
      case JT_RANGE:
        tab->read_record = rr_quick;          break;
    }
  }
}`,
    callers: ['JOIN::optimize'],
    callees: [],
    gdbCommand: 'b make_join_readinfo\nc',
    keyInsight: '函数指针模式实现了优化器和执行器的解耦，read_record 是连接二者的桥梁。'
  },

  // ============ 执行器 ============
  'JOIN::exec': {
    name: 'JOIN::exec',
    fullName: 'JOIN::exec()',
    file: 'sql/sql_executor.cc',
    line: 200,
    module: 'executor',
    description: '查询执行入口。根据优化器生成的 QEP（执行计划），驱动各表的行读取和连接操作。',
    codeSnippet: `void JOIN::exec() {
  DBUG_ENTER("JOIN::exec");
  
  if (thd->is_error()) DBUG_VOID_RETURN;
  
  // 发送 column metadata
  result->send_result_set_metadata(fields_list);
  
  // 执行连接
  do_select(this);
  
  // 发送 EOF
  result->send_eof();
  
  DBUG_VOID_RETURN;
}`,
    callers: ['handle_query'],
    callees: ['do_select'],
    gdbCommand: 'b JOIN::exec\nc',
    keyInsight: 'exec() 按照 optimize() 生成的 QEP 逐行读取数据，不做任何优化决策。'
  },
  'do_select': {
    name: 'do_select',
    fullName: 'do_select(JOIN*)',
    file: 'sql/sql_executor.cc',
    line: 900,
    module: 'executor',
    description: '执行查询的核心循环，调用 sub_select 对每个 QEP_TAB 进行迭代读取。',
    codeSnippet: `static int do_select(JOIN *join) {
  QEP_TAB *qep_tab = join->qep_tab;
  
  // 从第一个非常量表开始
  int error = sub_select(join, qep_tab, false);
  
  // 处理 GROUP BY / ORDER BY
  if (join->group_list)
    end_send_group(join);
  
  return error;
}`,
    callers: ['JOIN::exec'],
    callees: ['sub_select'],
    gdbCommand: 'b do_select\nc',
    keyInsight: 'do_select 负责驱动整个执行流程，包括排序、分组等后处理。'
  },
  'sub_select': {
    name: 'sub_select',
    fullName: 'sub_select(JOIN*, QEP_TAB*, bool)',
    file: 'sql/sql_executor.cc',
    line: 1200,
    module: 'executor',
    description: '递归执行连接操作：读取当前表的每一行，对满足条件的行递归处理下一个表（Nested Loop Join）。',
    codeSnippet: `int sub_select(JOIN *join, QEP_TAB *tab, bool end_of_records) {
  int error;
  READ_RECORD *info = &tab->read_record;
  
  // 循环读取当前表的每一行
  while ((error = info->read_record(info)) == 0) {
    // 评估 WHERE 条件
    if (tab->condition() && !tab->condition()->val_int())
      continue;
    
    // 递归处理下一个表
    if (tab->next_select)
      error = (*tab->next_select)(join, tab+1, false);
    else
      error = evaluate_join_record(join, tab);
  }
  return error;
}`,
    callers: ['do_select'],
    callees: ['evaluate_join_record'],
    gdbCommand: 'b sub_select\nc',
    keyInsight: 'sub_select 实现了经典的 Nested Loop Join，是 MySQL 默认的连接算法。'
  },
  'evaluate_join_record': {
    name: 'evaluate_join_record',
    fullName: 'evaluate_join_record(JOIN*, QEP_TAB*)',
    file: 'sql/sql_executor.cc',
    line: 1500,
    module: 'executor',
    description: '评估一条连接记录：检查所有连接条件是否满足，如果满足则发送结果行或进行聚合操作。',
    codeSnippet: `int evaluate_join_record(JOIN *join, QEP_TAB *tab) {
  // 所有表的连接条件都满足
  if (!tab->having || tab->having->val_int()) {
    // 发送结果行给客户端
    return join->result->send_data(join->fields_list);
  }
  return 0;
}`,
    callers: ['sub_select'],
    callees: [],
    gdbCommand: 'b evaluate_join_record\nc',
    keyInsight: '这是连接结果产生的最终点，满足所有条件的行会被发送给客户端。'
  },

  // ============ INSERT 路径 ============
  'mysql_insert': {
    name: 'mysql_insert',
    fullName: 'mysql_insert(THD*, TABLE_LIST*, ...)',
    file: 'sql/sql_insert.cc',
    line: 700,
    module: 'sql-layer',
    description: 'INSERT 语句的处理入口。解析 VALUES 列表，逐行写入表中，处理自增值、触发器等。',
    codeSnippet: `bool mysql_insert(THD *thd, TABLE_LIST *table_list, ...) {
  TABLE *table = table_list->table;
  
  // 逐行插入
  for (uint i = 0; i < values_list.elements; i++) {
    // 填充 record buffer
    fill_record(thd, table, fields, values);
    
    // 写入存储引擎
    error = table->file->ha_write_row(table->record[0]);
    
    if (!error) affected_rows++;
  }
}`,
    callers: ['mysql_execute_command'],
    callees: ['ha_write_row'],
    gdbCommand: 'b mysql_insert\nc',
    keyInsight: 'INSERT 不经过优化器，直接调用存储引擎的 write_row 接口。'
  },

  // ============ UPDATE 路径 ============
  'mysql_update': {
    name: 'mysql_update',
    fullName: 'mysql_update(THD*, TABLE_LIST*, ...)',
    file: 'sql/sql_update.cc',
    line: 600,
    module: 'sql-layer',
    description: 'UPDATE 语句的处理入口。先通过条件扫描找到需要更新的行，然后逐行更新。',
    codeSnippet: `bool mysql_update(THD *thd, TABLE_LIST *table_list, ...) {
  TABLE *table = table_list->table;
  
  // 初始化扫描
  init_read_record(&info, thd, table, ...);
  
  while (!(error = info.read_record(&info))) {
    // 评估 WHERE 条件
    if (cond && !cond->val_int()) continue;
    
    // 更新记录
    store_record(table, record[1]);
    fill_record(thd, table, fields, values);
    error = table->file->ha_update_row(
      table->record[1], table->record[0]);
  }
}`,
    callers: ['mysql_execute_command'],
    callees: ['ha_update_row'],
    gdbCommand: 'b mysql_update\nc',
    keyInsight: 'UPDATE 会先扫描找到目标行，再逐行更新。如果有索引条件会走索引扫描。'
  },

  // ============ DELETE 路径 ============
  'mysql_delete': {
    name: 'mysql_delete',
    fullName: 'mysql_delete(THD*, TABLE_LIST*, ...)',
    file: 'sql/sql_delete.cc',
    line: 500,
    module: 'sql-layer',
    description: 'DELETE 语句的处理入口。通过条件扫描找到需要删除的行，逐行删除。',
    codeSnippet: `bool mysql_delete(THD *thd, TABLE_LIST *table_list, ...) {
  TABLE *table = table_list->table;
  
  init_read_record(&info, thd, table, ...);
  
  while (!(error = info.read_record(&info))) {
    if (cond && !cond->val_int()) continue;
    
    error = table->file->ha_delete_row(
      table->record[0]);
    
    if (!error) deleted++;
  }
}`,
    callers: ['mysql_execute_command'],
    callees: ['ha_delete_row'],
    gdbCommand: 'b mysql_delete\nc',
    keyInsight: 'DELETE 不是立即物理删除，InnoDB 只是标记为已删除，由 purge 线程异步回收。'
  },

  // ============ 存储引擎层 ============
  'ha_write_row': {
    name: 'ha_write_row',
    fullName: 'handler::ha_write_row(uchar*)',
    file: 'sql/handler.cc',
    line: 7500,
    module: 'storage',
    description: '通过 handler 抽象接口写入一行数据。会调用具体存储引擎的 write_row 实现。',
    codeSnippet: `int handler::ha_write_row(uchar *buf) {
  // 调用存储引擎的具体实现
  int error = write_row(buf);
  
  // 更新行数统计
  if (!error) {
    stats.records++;
    ha_statistic_increment(&SSV::ha_write_count);
  }
  return error;
}`,
    callers: ['mysql_insert'],
    callees: ['write_row_innodb'],
    gdbCommand: 'b handler::ha_write_row\nc',
    keyInsight: 'handler 是 MySQL 的存储引擎抽象层，通过虚函数实现插件化架构。'
  },
  'ha_update_row': {
    name: 'ha_update_row',
    fullName: 'handler::ha_update_row(const uchar*, uchar*)',
    file: 'sql/handler.cc',
    line: 7600,
    module: 'storage',
    description: '通过 handler 抽象接口更新一行数据。old_data 是旧值，new_data 是新值。',
    codeSnippet: `int handler::ha_update_row(const uchar *old_data, 
    uchar *new_data) {
  int error = update_row(old_data, new_data);
  
  if (!error) {
    ha_statistic_increment(&SSV::ha_update_count);
  }
  return error;
}`,
    callers: ['mysql_update'],
    callees: [],
    gdbCommand: 'b handler::ha_update_row\nc',
    keyInsight: 'InnoDB 的 update_row 实现会生成 undo log 用于事务回滚和 MVCC 可见性判断。'
  },
  'ha_delete_row': {
    name: 'ha_delete_row',
    fullName: 'handler::ha_delete_row(const uchar*)',
    file: 'sql/handler.cc',
    line: 7700,
    module: 'storage',
    description: '通过 handler 抽象接口删除一行数据。InnoDB 使用标记删除方式。',
    codeSnippet: `int handler::ha_delete_row(const uchar *buf) {
  int error = delete_row(buf);
  
  if (!error) {
    stats.records--;
    ha_statistic_increment(&SSV::ha_delete_count);
  }
  return error;
}`,
    callers: ['mysql_delete'],
    callees: [],
    gdbCommand: 'b handler::ha_delete_row\nc',
    keyInsight: 'InnoDB 的删除是标记删除（delete mark），物理回收由 purge 线程异步完成。'
  },
  'ha_rnd_next': {
    name: 'ha_rnd_next',
    fullName: 'handler::ha_rnd_next(uchar*)',
    file: 'sql/handler.cc',
    line: 2800,
    module: 'storage',
    description: '顺序扫描读取下一行。全表扫描（JT_ALL）时使用此接口。',
    codeSnippet: `int handler::ha_rnd_next(uchar *buf) {
  int result;
  MYSQL_TABLE_IO_WAIT(m_psi, PSI_TABLE_FETCH_ROW, 
    MAX_KEY, 0, {
    result = rnd_next(buf);
  })
  return result;
}`,
    callers: ['sub_select'],
    callees: ['rnd_next_innodb'],
    gdbCommand: 'b handler::ha_rnd_next\nc',
    keyInsight: '全表扫描会调用此函数遍历所有行，是 IO 密集型操作。'
  },
  'rnd_next_innodb': {
    name: 'rnd_next_innodb',
    fullName: 'ha_innobase::rnd_next(uchar*)',
    file: 'storage/innobase/handler/ha_innodb.cc',
    line: 8500,
    module: 'storage',
    description: 'InnoDB 顺序扫描的具体实现，调用 row_search_mvcc 进行 MVCC 可见性判断。',
    codeSnippet: `int ha_innobase::rnd_next(uchar *buf) {
  int error = general_fetch(buf, ROW_SEL_NEXT, 0);
  return error;
}

// general_fetch 最终调用:
dberr_t row_search_mvcc(byte *buf, ...) {
  // MVCC 可见性判断
  // 读取 undo log 构建历史版本
}`,
    callers: ['ha_rnd_next'],
    callees: ['row_search_mvcc'],
    gdbCommand: 'b ha_innobase::rnd_next\nc',
    keyInsight: 'InnoDB 通过 MVCC 实现非锁定读，row_search_mvcc 根据事务 ID 判断行可见性。'
  },
  'row_search_mvcc': {
    name: 'row_search_mvcc',
    fullName: 'row_search_mvcc(byte*, page_cur_mode_t, ...)',
    file: 'storage/innobase/row/row0sel.cc',
    line: 4800,
    module: 'storage',
    description: 'InnoDB 的 MVCC 行搜索核心函数。根据事务的 Read View 判断行版本的可见性，需要时通过 undo log 回溯历史版本。',
    codeSnippet: `dberr_t row_search_mvcc(byte *buf, ...) {
  // 1. 在 B+Tree 中定位记录
  btr_pcur_open_at_index_side(start, index, ...);
  
  // 2. 读取记录
  rec = btr_pcur_get_rec(pcur);
  
  // 3. MVCC 可见性判断
  if (UNIV_LIKELY(srv_force_recovery < 5)) {
    trx_id = row_get_rec_trx_id(rec);
    if (!read_view->changes_visible(trx_id)) {
      // 行不可见，需要回溯 undo log
      row_sel_build_prev_vers_for_mysql(...);
    }
  }
}`,
    callers: ['rnd_next_innodb'],
    callees: [],
    gdbCommand: 'b row_search_mvcc\nc',
    keyInsight: 'row_search_mvcc 是 InnoDB MVCC 实现的核心，理解它是理解事务隔离级别的关键。'
  },
  'get_quick_record_count': {
    name: 'get_quick_record_count',
    fullName: 'get_quick_record_count(THD*, ...)',
    file: 'sql/sql_optimizer.cc',
    line: 1900,
    module: 'optimizer',
    description: '快速估算满足条件的记录数，使用索引统计信息或 range 分析。',
    codeSnippet: `ha_rows get_quick_record_count(THD *thd, ...) {
  // 使用索引 dive 或统计信息估算
  if (quick_select) {
    return quick_select->records;
  }
  return table->file->stats.records;
}`,
    callers: ['make_join_statistics'],
    callees: [],
    gdbCommand: 'b get_quick_record_count\nc',
    keyInsight: '行数估算的准确性对查询计划质量影响极大，eq_range_index_dive_limit 控制采样深度。'
  },

  // ============ 事务相关 ============
  'ha_commit_trans': {
    name: 'ha_commit_trans',
    fullName: 'ha_commit_trans(THD*, bool)',
    file: 'sql/handler.cc',
    line: 1500,
    module: 'sql-layer',
    description: '事务提交入口。协调各存储引擎的两阶段提交（2PC），确保 binlog 和 redo log 的一致性。',
    codeSnippet: `int ha_commit_trans(THD *thd, bool all) {
  // Phase 1: Prepare
  ha_prepare_low(thd, all);
  
  // Write binlog
  if (tc_log)
    tc_log->commit(thd, all);
  
  // Phase 2: Commit
  ha_commit_low(thd, all);
}`,
    callers: [],
    callees: ['ha_prepare_low', 'ha_commit_low'],
    gdbCommand: 'b ha_commit_trans\nc',
    keyInsight: 'MySQL 使用内部 XA 协议确保 binlog 和 redo log 的一致性（crash-safe）。'
  },
  'ha_prepare_low': {
    name: 'ha_prepare_low',
    fullName: 'ha_prepare_low(THD*, bool)',
    file: 'sql/handler.cc',
    line: 1600,
    module: 'sql-layer',
    description: '两阶段提交的准备阶段：通知各存储引擎准备提交，此时 redo log 已持久化。',
    codeSnippet: `int ha_prepare_low(THD *thd, bool all) {
  for (Ha_trx_info *ha_info = ...) {
    handlerton *ht = ha_info->ht();
    if (ht->prepare) {
      ht->prepare(ht, thd, all);
    }
  }
}`,
    callers: ['ha_commit_trans'],
    callees: [],
    gdbCommand: 'b ha_prepare_low\nc',
    keyInsight: 'prepare 阶段确保存储引擎已准备好提交，即使此时 crash 也可以恢复。'
  },
  'ha_commit_low': {
    name: 'ha_commit_low',
    fullName: 'ha_commit_low(THD*, bool)',
    file: 'sql/handler.cc',
    line: 1700,
    module: 'sql-layer',
    description: '两阶段提交的提交阶段：通知各存储引擎完成提交，释放事务资源。',
    codeSnippet: `int ha_commit_low(THD *thd, bool all) {
  for (Ha_trx_info *ha_info = ...) {
    handlerton *ht = ha_info->ht();
    if (ht->commit) {
      ht->commit(ht, thd, all);
    }
  }
  thd->transaction.cleanup();
}`,
    callers: ['ha_commit_trans'],
    callees: [],
    gdbCommand: 'b ha_commit_low\nc',
    keyInsight: '提交完成后事务对其他会话可见（取决于隔离级别）。'
  },

  // ============ Buffer Pool ============
  'buf_page_get_gen': {
    name: 'buf_page_get_gen',
    fullName: 'buf_page_get_gen(const page_id_t&, ...)',
    file: 'storage/innobase/buf/buf0buf.cc',
    line: 4200,
    module: 'buffer',
    description: 'InnoDB Buffer Pool 的页面获取入口。先在 buffer pool 查找，未命中则从磁盘读取。',
    codeSnippet: `buf_block_t *buf_page_get_gen(
    const page_id_t &page_id, ...) {
  buf_block_t *block;
  
  // 1. 在 hash table 中查找
  block = buf_page_hash_get_low(page_id);
  
  if (block != NULL) {
    // Buffer pool hit
    buf_page_make_young(&block->page);
  } else {
    // Buffer pool miss → 从磁盘读取
    block = buf_page_init_for_read(page_id);
    fil_io(IORequest(IORequest::READ), ...);
  }
  
  return block;
}`,
    callers: ['row_search_mvcc'],
    callees: [],
    gdbCommand: 'b buf_page_get_gen\nc\np page_id',
    keyInsight: 'Buffer Pool 是 InnoDB 性能的关键，命中率应保持在 99% 以上。'
  },

  // ============ 锁相关 ============
  'lock_table': {
    name: 'lock_table',
    fullName: 'lock_table(THD*, TABLE*, thr_lock_type)',
    file: 'sql/lock.cc',
    line: 300,
    module: 'sql-layer',
    description: '表级锁获取。MySQL 层的表锁管理，与 InnoDB 的行锁是两层不同的锁系统。',
    codeSnippet: `int lock_table(THD *thd, TABLE *table, 
    thr_lock_type lock_type) {
  THR_LOCK_DATA *lock_data = table->lock.data;
  
  if (thr_lock(lock_data, lock_type, ...)) {
    // 锁等待
    return HA_ERR_LOCK_WAIT_TIMEOUT;
  }
  return 0;
}`,
    callers: [],
    callees: [],
    gdbCommand: 'b lock_table\nc\np lock_type',
    keyInsight: 'MySQL 有两层锁：server 层的表锁和存储引擎层（InnoDB）的行锁。'
  },

  // ============ 复制相关 ============
  'binlog_write': {
    name: 'binlog_write',
    fullName: 'MYSQL_BIN_LOG::write_event(Log_event*)',
    file: 'sql/binlog.cc',
    line: 4500,
    module: 'sql-layer',
    description: '将事件写入 binlog。是 MySQL 复制和 point-in-time 恢复的基础。',
    codeSnippet: `bool MYSQL_BIN_LOG::write_event(Log_event *event) {
  // 序列化事件
  event->write(log_file);
  
  // 根据 sync_binlog 设置同步
  if (sync_binlog == 1)
    fsync(log_file);
}`,
    callers: ['ha_commit_trans'],
    callees: [],
    gdbCommand: 'b MYSQL_BIN_LOG::write_event\nc',
    keyInsight: 'sync_binlog=1 保证每次提交都将 binlog 刷盘，是数据安全的保障。'
  },

  // ============ close_connection ============
  'close_connection': {
    name: 'close_connection',
    fullName: 'close_connection(THD*)',
    file: 'sql/conn_handler/connection_handler_per_thread.cc',
    line: 200,
    module: 'network',
    description: '关闭客户端连接，清理 THD 资源，释放锁和临时表。',
    codeSnippet: `void close_connection(THD *thd) {
  // 清理临时表
  close_temporary_tables(thd);
  
  // 释放所有锁
  mysql_unlock_tables(thd, thd->lock);
  
  // 关闭网络连接
  thd->disconnect();
  
  delete thd;
}`,
    callers: ['handle_one_connection'],
    callees: [],
    gdbCommand: 'b close_connection\nc',
    keyInsight: '连接关闭时会自动回滚未提交的事务并释放所有资源。'
  },
  'lex_start': {
    name: 'lex_start',
    fullName: 'lex_start(THD*)',
    file: 'sql/sql_lex.cc',
    line: 400,
    module: 'parser',
    description: '初始化 LEX 结构，为新一轮的 SQL 解析做准备。',
    codeSnippet: `void lex_start(THD *thd) {
  LEX *lex = thd->lex;
  lex->sql_command = SQLCOM_END;
  lex->select_lex = NULL;
  lex->unit = NULL;
  lex->query_tables = NULL;
}`,
    callers: ['parse_sql'],
    callees: [],
    gdbCommand: 'b lex_start\nc',
    keyInsight: 'LEX 结构在每次 SQL 执行前都需要重新初始化。'
  },
  'MYSQLlex': {
    name: 'MYSQLlex',
    fullName: 'MYSQLlex(YYSTYPE*, YYLTYPE*, THD*)',
    file: 'sql/sql_lex.cc',
    line: 1200,
    module: 'parser',
    description: '词法分析器，由 Bison 语法分析器调用，每次返回一个 token（如 SELECT、FROM、WHERE 等）。',
    codeSnippet: `int MYSQLlex(YYSTYPE *yylval, YYLTYPE *yylloc, THD *thd) {
  Lex_input_stream *lip = &thd->m_parser_state->m_lip;
  
  int token = lex_one_token(lip, thd);
  
  switch(token) {
    case IDENT: // 标识符
    case NUM:   // 数字
    case STRING_TOKEN: // 字符串
    ...
  }
  return token;
}`,
    callers: ['MYSQLparse'],
    callees: [],
    gdbCommand: 'b MYSQLlex\nc\np token',
    keyInsight: '词法分析器是语法分析器的"供应者"，每次调用返回下一个 token。'
  },
  'write_row_innodb': {
    name: 'write_row_innodb',
    fullName: 'ha_innobase::write_row(uchar*)',
    file: 'storage/innobase/handler/ha_innodb.cc',
    line: 7200,
    module: 'storage',
    description: 'InnoDB 存储引擎写入一行数据的具体实现：在聚簇索引和二级索引中插入记录。',
    codeSnippet: `int ha_innobase::write_row(uchar *record) {
  // 1. 自增值处理
  update_auto_increment();
  
  // 2. 插入聚簇索引
  error = row_insert_for_mysql(record, prebuilt);
  
  // 3. 更新二级索引
  // 自动在事务中完成
  
  return convert_error_code_to_mysql(error);
}`,
    callers: ['ha_write_row'],
    callees: [],
    gdbCommand: 'b ha_innobase::write_row\nc',
    keyInsight: 'InnoDB 的写入先写 redo log 再修改 buffer pool 页面，保证 crash 安全。'
  },
}

// ===== 推荐函数列表 =====
export interface RecommendedFunction {
  name: string
  displayName: string
  description: string
  category: string
  icon: string  // 分类图标标识
  tags: string[]
}

export const recommendedFunctions: RecommendedFunction[] = [
  {
    name: 'JOIN::optimize',
    displayName: 'JOIN::optimize()',
    description: '查询优化器主入口，包含条件简化、统计信息收集、连接顺序搜索等核心步骤',
    category: '优化器',
    icon: 'optimizer',
    tags: ['核心', '优化器', 'QEP']
  },
  {
    name: 'mysql_execute_command',
    displayName: 'mysql_execute_command()',
    description: 'SQL 命令执行总入口，根据命令类型分发到 SELECT/INSERT/UPDATE/DELETE',
    category: 'SQL 层',
    icon: 'sql-layer',
    tags: ['入口', 'SQL', '分发']
  },
  {
    name: 'handle_one_connection',
    displayName: 'handle_one_connection()',
    description: '客户端连接的线程入口，追踪一个连接的完整生命周期',
    category: '网络层',
    icon: 'network',
    tags: ['连接', '线程', '入口']
  },
  {
    name: 'mysql_parse',
    displayName: 'mysql_parse()',
    description: 'SQL 解析入口，从 SQL 文本到 LEX 结构再到执行',
    category: '解析器',
    icon: 'parser',
    tags: ['解析', 'LEX', 'Bison']
  },
  {
    name: 'sub_select',
    displayName: 'sub_select()',
    description: '执行器核心：Nested Loop Join 实现，递归连接各表',
    category: '执行器',
    icon: 'executor',
    tags: ['执行', 'NLJ', '连接']
  },
  {
    name: 'row_search_mvcc',
    displayName: 'row_search_mvcc()',
    description: 'InnoDB MVCC 行搜索核心，事务可见性判断的关键函数',
    category: '存储引擎',
    icon: 'storage',
    tags: ['InnoDB', 'MVCC', '事务']
  },
  {
    name: 'ha_commit_trans',
    displayName: 'ha_commit_trans()',
    description: '事务提交入口，协调两阶段提交（2PC）确保数据一致性',
    category: 'SQL 层',
    icon: 'sql-layer',
    tags: ['事务', '2PC', 'binlog']
  },
  {
    name: 'greedy_search',
    displayName: 'greedy_search()',
    description: '贪心搜索算法，确定多表连接的最优顺序',
    category: '优化器',
    icon: 'optimizer',
    tags: ['连接顺序', '贪心', '成本']
  },
  {
    name: 'buf_page_get_gen',
    displayName: 'buf_page_get_gen()',
    description: 'InnoDB Buffer Pool 页面获取入口，缓存管理的核心',
    category: '缓冲池',
    icon: 'buffer',
    tags: ['Buffer Pool', 'IO', '缓存']
  },
  {
    name: 'mysql_insert',
    displayName: 'mysql_insert()',
    description: 'INSERT 语句处理入口，直接调用存储引擎写入',
    category: 'SQL 层',
    icon: 'sql-layer',
    tags: ['INSERT', 'DML']
  },
  {
    name: 'mysql_update',
    displayName: 'mysql_update()',
    description: 'UPDATE 语句处理入口，扫描→更新的处理流程',
    category: 'SQL 层',
    icon: 'sql-layer',
    tags: ['UPDATE', 'DML']
  },
  {
    name: 'mysql_delete',
    displayName: 'mysql_delete()',
    description: 'DELETE 语句处理入口，InnoDB 使用标记删除方式',
    category: 'SQL 层',
    icon: 'sql-layer',
    tags: ['DELETE', 'DML']
  },
]

// ===== 核心 API：根据函数名生成调用链 =====

// 向上追溯调用者链
function traceCallers(funcName: string, visited: Set<string> = new Set()): string[] {
  if (visited.has(funcName)) return []
  visited.add(funcName)
  
  const func = functionDatabase[funcName]
  if (!func || func.callers.length === 0) return [funcName]
  
  const result: string[] = []
  for (const caller of func.callers) {
    const chain = traceCallers(caller, visited)
    result.push(...chain)
  }
  result.push(funcName)
  return result
}

// 向下追溯被调用者链
function traceCallees(funcName: string, visited: Set<string> = new Set(), depth: number = 0, maxDepth: number = 6): string[] {
  if (visited.has(funcName) || depth > maxDepth) return [funcName]
  visited.add(funcName)
  
  const func = functionDatabase[funcName]
  if (!func || func.callees.length === 0) return [funcName]
  
  const result: string[] = [funcName]
  for (const callee of func.callees) {
    const chain = traceCallees(callee, visited, depth + 1, maxDepth)
    result.push(...chain)
  }
  return result
}

// 生成唯一的调用链节点列表（去重、排序）
function buildUniqueChain(funcName: string): string[] {
  const callers = traceCallers(funcName, new Set())
  const callees = traceCallees(funcName, new Set())
  
  // 合并并去重
  const seen = new Set<string>()
  const result: string[] = []
  
  for (const name of [...callers, ...callees]) {
    if (!seen.has(name)) {
      seen.add(name)
      result.push(name)
    }
  }
  
  return result
}

// 为节点分配 depth 和 order
function assignDepthOrder(chain: string[], targetFunc: string): { name: string; depth: number; order: number }[] {
  // 找到目标函数在链中的位置
  const targetIdx = chain.indexOf(targetFunc)
  
  // 按照调用关系分配深度
  const depthMap = new Map<string, number>()
  const orderAtDepth = new Map<number, number>()
  
  // 先从上到下分配 depth
  const visited = new Set<string>()
  
  function assignDepth(name: string, depth: number) {
    if (visited.has(name)) return
    visited.add(name)
    
    depthMap.set(name, depth)
    
    const func = functionDatabase[name]
    if (func) {
      for (const callee of func.callees) {
        if (chain.includes(callee) && !visited.has(callee)) {
          assignDepth(callee, depth + 1)
        }
      }
    }
  }
  
  // 从链的第一个节点开始分配
  if (chain.length > 0) {
    assignDepth(chain[0], 0)
  }
  
  // 对未分配深度的节点，按顺序分配
  let nextDepth = 0
  for (const name of chain) {
    if (!depthMap.has(name)) {
      depthMap.set(name, nextDepth++)
    }
  }
  
  // 分配 order
  const result: { name: string; depth: number; order: number }[] = []
  for (const name of chain) {
    const depth = depthMap.get(name) || 0
    const order = orderAtDepth.get(depth) || 0
    orderAtDepth.set(depth, order + 1)
    result.push({ name, depth, order })
  }
  
  return result
}

// 生成 Markdown 树状图
function generateMarkdownTree(funcName: string, chain: string[]): string {
  const func = functionDatabase[funcName]
  if (!func) return '```\n' + funcName + '()\n```'
  
  // 构建树形结构
  const lines: string[] = ['```']
  const visited = new Set<string>()
  
  function renderNode(name: string, prefix: string, isLast: boolean, isRoot: boolean) {
    if (visited.has(name)) return
    visited.add(name)
    
    const f = functionDatabase[name]
    if (!f) return
    
    const connector = isRoot ? '' : (isLast ? '└── ' : '├── ')
    const label = name === funcName ? `★ ${f.fullName}` : f.fullName
    const comment = f.description.substring(0, 30)
    const line = `${prefix}${connector}${label}  ← ${comment}`
    lines.push(line)
    
    const childPrefix = isRoot ? '' : (prefix + (isLast ? '    ' : '│   '))
    
    // 渲染子节点
    const children = f.callees.filter(c => chain.includes(c) && !visited.has(c))
    children.forEach((child, idx) => {
      const childIsLast = idx === children.length - 1
      renderNode(child, childPrefix, childIsLast, false)
    })
  }
  
  // 找到根节点（没有 caller 在链中的节点）
  const roots = chain.filter(name => {
    const f = functionDatabase[name]
    return !f || f.callers.every(c => !chain.includes(c))
  })
  
  if (roots.length > 0) {
    roots.forEach((root, idx) => {
      renderNode(root, '', idx === roots.length - 1, true)
    })
  } else {
    renderNode(funcName, '', true, true)
  }
  
  lines.push('```')
  return lines.join('\n')
}

// 生成追踪步骤
function generateSteps(funcName: string, chain: string[]): import('./callChainData').TraceStep[] {
  const steps: import('./callChainData').TraceStep[] = []
  
  let stepId = 1
  const visited = new Set<string>()
  
  // 按链的顺序生成步骤
  for (let i = 0; i < chain.length; i++) {
    const name = chain[i]
    if (visited.has(name)) continue
    visited.add(name)
    
    const func = functionDatabase[name]
    if (!func) continue
    
    // 确定高亮的节点和边
    const highlightNodes: string[] = [name]
    const highlightEdges: [string, string][] = []
    
    // 添加前一个节点的连接
    if (i > 0) {
      const prevName = chain[i - 1]
      highlightNodes.unshift(prevName)
      highlightEdges.push([prevName, name])
    }
    
    // 如果目标函数有直接 callee 在链中且紧接着
    const nextCallees = func.callees.filter(c => chain.includes(c) && !visited.has(c))
    if (nextCallees.length > 0 && nextCallees.length <= 2) {
      // 把直接 callee 也放入高亮
      nextCallees.forEach(c => {
        highlightNodes.push(c)
        highlightEdges.push([name, c])
      })
    }
    
    const isTarget = name === funcName
    const step: import('./callChainData').TraceStep = {
      id: stepId++,
      title: isTarget ? `★ ${func.fullName}` : func.fullName,
      subtitle: `${func.file}:${func.line}`,
      description: func.description,
      highlightNodes,
      highlightEdges,
      codeContext: {
        file: func.file,
        line: func.line,
        code: func.codeSnippet,
        explanation: func.keyInsight || func.description,
      },
      gdbCommand: func.gdbCommand,
      keyInsight: func.keyInsight || func.description,
    }
    
    steps.push(step)
  }
  
  return steps
}

// ===== 主要导出函数：生成完整的 CallChainScenario =====
export function generateCallChain(funcName: string): import('./callChainData').CallChainScenario | null {
  const func = functionDatabase[funcName]
  if (!func) return null
  
  const chain = buildUniqueChain(funcName)
  if (chain.length === 0) return null
  
  const nodesWithDepth = assignDepthOrder(chain, funcName)
  
  // 构建 CallChainNode 列表
  const flatNodes: import('./callChainData').CallChainNode[] = nodesWithDepth
    .map(({ name, depth, order }) => {
      const f = functionDatabase[name]
      if (!f) return null
      return {
        id: name,
        name: f.name,
        fullName: f.fullName,
        file: f.file,
        line: f.line,
        module: f.module as any,
        description: f.description,
        codeSnippet: f.codeSnippet,
        depth,
        order,
      }
    })
    .filter((n): n is import('./callChainData').CallChainNode => n !== null)
  
  // 构建边
  const edges: { from: string; to: string; label?: string }[] = []
  for (const name of chain) {
    const f = functionDatabase[name]
    if (!f) continue
    for (const callee of f.callees) {
      if (chain.includes(callee)) {
        edges.push({ from: name, to: callee })
      }
    }
  }
  
  // 生成步骤
  const steps = generateSteps(funcName, chain)
  
  // 生成 Markdown 树
  const markdownTree = generateMarkdownTree(funcName, chain)
  
  // 生成 tags
  const moduleSet = new Set(chain.map(n => functionDatabase[n]?.module).filter(Boolean))
  const tags = Array.from(moduleSet).map(m => {
    const labels: Record<string, string> = {
      'sql-layer': 'SQL层', 'optimizer': '优化器', 'executor': '执行器',
      'storage': '存储引擎', 'buffer': '缓冲池', 'parser': '解析器', 'network': '网络层'
    }
    return labels[m!] || m!
  })
  
  return {
    id: `dynamic-${funcName}`,
    title: `${func.fullName} 调用链路`,
    subtitle: func.description.substring(0, 40),
    description: func.description,
    rootFunction: funcName,
    markdownTree,
    nodes: flatNodes,
    flatNodes,
    edges,
    steps,
    tags,
  }
}

// 搜索函数（模糊匹配）
export function searchFunctions(query: string): FunctionInfo[] {
  if (!query.trim()) return []
  const lq = query.toLowerCase().replace(/::/g, '').replace(/\(\)/g, '').trim()
  
  return Object.values(functionDatabase).filter(f => {
    const fname = f.name.toLowerCase().replace(/::/g, '')
    const ffull = f.fullName.toLowerCase().replace(/::/g, '').replace(/\(\)/g, '')
    const fdesc = f.description.toLowerCase()
    
    return fname.includes(lq) || ffull.includes(lq) || fdesc.includes(lq)
  })
}

// 获取所有已知函数名
export function getAllFunctionNames(): string[] {
  return Object.keys(functionDatabase)
}

// 获取函数详情
export function getFunctionInfo(name: string): FunctionInfo | undefined {
  return functionDatabase[name]
}
