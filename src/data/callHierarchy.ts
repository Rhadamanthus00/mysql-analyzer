// 调用关系数据结构
export interface CallNode {
  id: string
  name: string
  file: string
  line: number
  type: 'caller' | 'callee' | 'current'
  level: number
}

export interface CallHierarchyData {
  functionName: string
  file: string
  line: number
  callers: CallNode[]
  callees: CallNode[]
}

// 模拟的调用层次数据
export const callHierarchyData: Record<string, CallHierarchyData> = {
  'handle_one_connection': {
    functionName: 'handle_one_connection',
    file: 'sql/conn_handler/connection_handler_per_thread.cc',
    line: 40,
    callers: [
      {
        id: 'main',
        name: 'main',
        file: 'sql/main.cc',
        line: 450,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'do_command',
        name: 'do_command',
        file: 'sql/conn_handler/connection_handler_per_thread.cc',
        line: 84,
        type: 'callee',
        level: 1
      },
      {
        id: 'thd_store_globals',
        name: 'thd->store_globals',
        file: 'sql/sql_class.cc',
        line: 1200,
        type: 'callee',
        level: 1
      },
      {
        id: 'release_resources',
        name: 'thd->release_resources',
        file: 'sql/sql_class.cc',
        line: 1350,
        type: 'callee',
        level: 1
      },
      {
        id: 'end_connection',
        name: 'end_connection',
        file: 'sql/sql_connect.cc',
        line: 210,
        type: 'callee',
        level: 1
      }
    ]
  },

  'do_command': {
    functionName: 'do_command',
    file: 'sql/conn_handler/connection_handler_per_thread.cc',
    line: 84,
    callers: [
      {
        id: 'handle_one_connection',
        name: 'handle_one_connection',
        file: 'sql/conn_handler/connection_handler_per_thread.cc',
        line: 59,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'dispatch_command',
        name: 'dispatch_command',
        file: 'sql/sql_parse.cc',
        line: 160,
        type: 'callee',
        level: 1
      },
      {
        id: 'thd_read_query',
        name: 'thd->read_query',
        file: 'sql/sql_class.cc',
        line: 850,
        type: 'callee',
        level: 1
      },
      {
        id: 'send_kill_message',
        name: 'thd->send_kill_message',
        file: 'sql/sql_class.cc',
        line: 1400,
        type: 'callee',
        level: 1
      }
    ]
  },

  'dispatch_command': {
    functionName: 'dispatch_command',
    file: 'sql/sql_parse.cc',
    line: 160,
    callers: [
      {
        id: 'do_command',
        name: 'do_command',
        file: 'sql/conn_handler/connection_handler_per_thread.cc',
        line: 106,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'mysql_parse',
        name: 'mysql_parse',
        file: 'sql/sql_parse.cc',
        line: 210,
        type: 'callee',
        level: 1
      },
      {
        id: 'my_ok',
        name: 'my_ok',
        file: 'sql/sql_error.cc',
        line: 320,
        type: 'callee',
        level: 1
      },
      {
        id: 'my_error',
        name: 'my_error',
        file: 'sql/sql_error.cc',
        line: 450,
        type: 'callee',
        level: 1
      }
    ]
  },

  'mysql_parse': {
    functionName: 'mysql_parse',
    file: 'sql/sql_parse.cc',
    line: 210,
    callers: [
      {
        id: 'dispatch_command',
        name: 'dispatch_command',
        file: 'sql/sql_parse.cc',
        line: 175,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'thd_sql_parser',
        name: 'thd->sql_parser',
        file: 'sql/sql_parse.cc',
        line: 257,
        type: 'callee',
        level: 1
      },
      {
        id: 'yyparse',
        name: 'yyparse',
        file: 'sql/sql_yacc.yy',
        line: 5000,
        type: 'callee',
        level: 1
      },
      {
        id: 'optimize_query',
        name: 'thd->optimize_query',
        file: 'sql/sql_optimizer.cc',
        line: 298,
        type: 'callee',
        level: 1
      },
      {
        id: 'execute_query',
        name: 'thd->execute_query',
        file: 'sql/sql_executor.cc',
        line: 150,
        type: 'callee',
        level: 1
      }
    ]
  },

  'JOIN::optimize': {
    functionName: 'JOIN::optimize',
    file: 'sql/sql_optimizer.cc',
    line: 335,
    callers: [
      {
        id: 'optimize_query',
        name: 'THD::optimize_query',
        file: 'sql/sql_optimizer.cc',
        line: 314,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'simplify_conditions',
        name: 'simplify_conditions',
        file: 'sql/sql_optimizer.cc',
        line: 340,
        type: 'callee',
        level: 1
      },
      {
        id: 'pushdown_conditions',
        name: 'pushdown_conditions',
        file: 'sql/sql_optimizer.cc',
        line: 344,
        type: 'callee',
        level: 1
      },
      {
        id: 'choose_indexes',
        name: 'choose_indexes',
        file: 'sql/sql_optimizer.cc',
        line: 348,
        type: 'callee',
        level: 1
      },
      {
        id: 'optimize_join_order',
        name: 'optimize_join_order',
        file: 'sql/sql_optimizer.cc',
        line: 374,
        type: 'callee',
        level: 1
      },
      {
        id: 'make_join_plan',
        name: 'make_join_plan',
        file: 'sql/sql_optimizer.cc',
        line: 480,
        type: 'callee',
        level: 1
      }
    ]
  },

  'JOIN::optimize_join_order': {
    functionName: 'JOIN::optimize_join_order',
    file: 'sql/sql_optimizer.cc',
    line: 374,
    callers: [
      {
        id: 'optimize',
        name: 'JOIN::optimize',
        file: 'sql/sql_optimizer.cc',
        line: 352,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'find_best_table',
        name: 'find_best_table',
        file: 'sql/sql_optimizer.cc',
        line: 421,
        type: 'callee',
        level: 1
      },
      {
        id: 'calculate_join_cost',
        name: 'calculate_join_cost',
        file: 'sql/sql_optimizer.cc',
        line: 407,
        type: 'callee',
        level: 1
      }
    ]
  },

  'ha_innodb::rnd_next': {
    functionName: 'ha_innodb::rnd_next',
    file: 'storage/innobase/handler/ha_innodb.cc',
    line: 590,
    callers: [
      {
        id: 'read_record',
        name: 'read_record',
        file: 'sql/records.cc',
        line: 280,
        type: 'caller',
        level: 0
      },
      {
        id: 'join_read_first',
        name: 'join_read_first',
        file: 'sql/sql_executor.cc',
        line: 450,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'row_search_no_mvcc',
        name: 'row_search_no_mvcc',
        file: 'storage/innobase/row/row0sel.cc',
        line: 1200,
        type: 'callee',
        level: 1
      },
      {
        id: 'update_row_stats',
        name: 'update_row_stats',
        file: 'storage/innobase/handler/ha_innodb.cc',
        line: 610,
        type: 'callee',
        level: 1
      }
    ]
  },

  'ha_innodb::index_read': {
    functionName: 'ha_innodb::index_read',
    file: 'storage/innobase/handler/ha_innodb.cc',
    line: 623,
    callers: [
      {
        id: 'join_read_next',
        name: 'join_read_next',
        file: 'sql/sql_executor.cc',
        line: 520,
        type: 'caller',
        level: 0
      },
      {
        id: 'rr_quick',
        name: 'rr_quick',
        file: 'sql/records.cc',
        line: 350,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'row_search_for_mysql',
        name: 'row_search_for_mysql',
        file: 'storage/innobase/row/row0sel.cc',
        line: 1500,
        type: 'callee',
        level: 1
      }
    ]
  },

  'ha_innodb::write_row': {
    functionName: 'ha_innodb::write_row',
    file: 'storage/innobase/handler/ha_innodb.cc',
    line: 654,
    callers: [
      {
        id: 'write_record',
        name: 'write_record',
        file: 'sql/sql_insert.cc',
        line: 680,
        type: 'caller',
        level: 0
      }
    ],
    callees: [
      {
        id: 'innobase_trx_start',
        name: 'innobase_trx_start',
        file: 'storage/innobase/trx/trx0trx.cc',
        line: 800,
        type: 'callee',
        level: 1
      },
      {
        id: 'row_insert_for_mysql',
        name: 'row_insert_for_mysql',
        file: 'storage/innobase/row/row0ins.cc',
        line: 600,
        type: 'callee',
        level: 1
      },
      {
        id: 'buf_pool_modify_pages',
        name: 'buf_pool_modify_pages',
        file: 'storage/innobase/buf/buf0buf.cc',
        line: 1200,
        type: 'callee',
        level: 1
      }
    ]
  }
}

// 获取函数的调用层次数据
export function getCallHierarchy(functionName: string): CallHierarchyData | undefined {
  return callHierarchyData[functionName]
}

// 从代码内容中提取函数名（简化版）
export function extractFunctionNames(code: string): string[] {
  const functionNames: string[] = []
  
  // 匹配函数定义模式
  const patterns = [
    /(\w+)\s*\([^)]*\)\s*\{/g,  // function_name(args) {
    /(\w+)\s*::\s*(\w+)\s*\([^)]*\)\s*\{/g,  // Class::function(args) {
  ]
  
  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(code)) !== null) {
      const name = match[2] || match[1]
      if (name && !functionNames.includes(name) && !name.startsWith('_')) {
        functionNames.push(name)
      }
    }
  })
  
  return functionNames
}

// 查找包含函数调用的行号
export function findFunctionCallLines(code: string, functionName: string): number[] {
  const lines = code.split('\n')
  const result: number[] = []
  const pattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g')
  
  lines.forEach((line, idx) => {
    if (pattern.test(line)) {
      result.push(idx + 1)
    }
  })
  
  return result
}
