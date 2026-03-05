// GDB 调试实验数据

export interface GdbExperiment {
  id: string
  title: string
  category: 'breakpoint' | 'watchpoint' | 'backtrace' | 'memory' | 'thread'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  objective: string
  description: string
  prerequisites: string[]
  setupCommands: string[]
  steps: GdbStep[]
  expectedInsights: string[]
  relatedSourceFiles: string[]
}

export interface GdbStep {
  id: number
  instruction: string
  command: string
  expectedOutput: string[]
  explanation: string
  breakpointFile?: string
  breakpointLine?: number
}

export interface GdbQuickCommand {
  category: string
  commands: { cmd: string; desc: string; example?: string }[]
}

export const gdbQuickCommands: GdbQuickCommand[] = [
  {
    category: '断点管理',
    commands: [
      { cmd: 'break <function>', desc: '在函数入口设置断点', example: 'break mysql_parse' },
      { cmd: 'break <file>:<line>', desc: '在指定行设置断点', example: 'break sql_parse.cc:210' },
      { cmd: 'tbreak <function>', desc: '设置临时断点（触发一次后自动删除）', example: 'tbreak JOIN::optimize' },
      { cmd: 'condition <n> <expr>', desc: '给断点添加条件', example: 'condition 1 thd->query_id > 100' },
      { cmd: 'info breakpoints', desc: '查看所有断点', example: 'info b' },
      { cmd: 'delete <n>', desc: '删除断点', example: 'delete 1' },
      { cmd: 'disable/enable <n>', desc: '禁用/启用断点', example: 'disable 2' },
    ]
  },
  {
    category: '执行控制',
    commands: [
      { cmd: 'run', desc: '启动程序', example: 'run --user=root --port=3306' },
      { cmd: 'continue (c)', desc: '继续执行到下一个断点' },
      { cmd: 'next (n)', desc: '单步执行（不进入函数）' },
      { cmd: 'step (s)', desc: '单步执行（进入函数）' },
      { cmd: 'finish', desc: '执行完当前函数后停止' },
      { cmd: 'until <line>', desc: '执行到指定行', example: 'until 350' },
    ]
  },
  {
    category: '数据观察',
    commands: [
      { cmd: 'print <expr>', desc: '打印变量/表达式的值', example: 'print thd->query_string' },
      { cmd: 'print/x <expr>', desc: '以十六进制打印', example: 'print/x buf_pool->page_hash' },
      { cmd: 'watch <expr>', desc: '设置数据观察点', example: 'watch thd->killed' },
      { cmd: 'display <expr>', desc: '每次停止时自动打印', example: 'display thd->query_id' },
      { cmd: 'ptype <type>', desc: '查看类型定义', example: 'ptype THD' },
      { cmd: 'x/Nfmt <addr>', desc: '检查内存', example: 'x/16xb buf' },
    ]
  },
  {
    category: '调用栈分析',
    commands: [
      { cmd: 'backtrace (bt)', desc: '查看完整调用栈' },
      { cmd: 'bt full', desc: '查看调用栈（含局部变量）' },
      { cmd: 'frame <n>', desc: '切换到指定栈帧', example: 'frame 3' },
      { cmd: 'info locals', desc: '查看当前帧的局部变量' },
      { cmd: 'info args', desc: '查看当前函数的参数' },
      { cmd: 'up/down', desc: '在调用栈中上下移动' },
    ]
  },
  {
    category: '线程调试',
    commands: [
      { cmd: 'info threads', desc: '查看所有线程' },
      { cmd: 'thread <n>', desc: '切换到指定线程', example: 'thread 5' },
      { cmd: 'thread apply all bt', desc: '查看所有线程的调用栈' },
      { cmd: 'set scheduler-locking on', desc: '锁定当前线程（其他线程不执行）' },
    ]
  }
]

export const gdbExperiments: GdbExperiment[] = [
  {
    id: 'exp-query-lifecycle',
    title: '实验1: 跟踪 SQL 查询完整生命周期',
    category: 'breakpoint',
    difficulty: 'beginner',
    objective: '理解一条 SELECT 语句从接收到返回结果的完整执行路径',
    description: '通过在 SQL 执行的关键节点设置断点，观察查询从客户端接收、解析、优化、执行到返回结果的完整流程。这是理解 MySQL 内核架构的第一步。',
    prerequisites: [
      '编译带调试信息的 MySQL (cmake -DWITH_DEBUG=1)',
      '准备一个简单的测试数据库和表',
      '熟悉 GDB 基本操作'
    ],
    setupCommands: [
      'cd /path/to/mysql-build',
      'gdb --args ./bin/mysqld --defaults-file=my.cnf --gdb',
      '# 在另一个终端连接 MySQL',
      'mysql -u root -p -e "CREATE DATABASE test; USE test; CREATE TABLE users(id INT PRIMARY KEY, name VARCHAR(50)); INSERT INTO users VALUES(1,\'Alice\'),(2,\'Bob\');"'
    ],
    steps: [
      {
        id: 1,
        instruction: '在命令分发函数设置断点',
        command: 'break dispatch_command',
        expectedOutput: [
          'Breakpoint 1 at 0x55555596a230: file sql/sql_parse.cc, line 160.',
        ],
        explanation: 'dispatch_command 是所有客户端命令的入口，COM_QUERY 类型的命令会触发 SQL 解析',
        breakpointFile: 'sql/sql_parse.cc',
        breakpointLine: 160
      },
      {
        id: 2,
        instruction: '在 SQL 解析函数设置断点',
        command: 'break mysql_parse',
        expectedOutput: [
          'Breakpoint 2 at 0x55555596b100: file sql/sql_parse.cc, line 210.',
        ],
        explanation: 'mysql_parse 负责将 SQL 文本转换为内部语法树表示',
        breakpointFile: 'sql/sql_parse.cc',
        breakpointLine: 210
      },
      {
        id: 3,
        instruction: '在优化器入口设置断点',
        command: 'break JOIN::optimize',
        expectedOutput: [
          'Breakpoint 3 at 0x555555980a50: file sql/sql_optimizer.cc, line 335.',
        ],
        explanation: 'JOIN::optimize 是查询优化器的核心，负责生成最优执行计划',
        breakpointFile: 'sql/sql_optimizer.cc',
        breakpointLine: 335
      },
      {
        id: 4,
        instruction: '在存储引擎读取函数设置断点',
        command: 'break ha_innodb::rnd_next',
        expectedOutput: [
          'Breakpoint 4 at 0x555555a1c600: file storage/innobase/handler/ha_innodb.cc, line 590.',
        ],
        explanation: 'rnd_next 是全表扫描时逐行读取数据的函数',
        breakpointFile: 'storage/innobase/handler/ha_innodb.cc',
        breakpointLine: 590
      },
      {
        id: 5,
        instruction: '启动 MySQL 服务器',
        command: 'run',
        expectedOutput: [
          'Starting program: /path/to/mysqld',
          '[Thread debugging using libthread_db enabled]',
          'mysqld: ready for connections.',
        ],
        explanation: 'MySQL 服务器启动并等待客户端连接'
      },
      {
        id: 6,
        instruction: '在客户端执行查询，GDB 会在第一个断点停下',
        command: '# 在客户端执行: SELECT * FROM users WHERE id = 1;',
        expectedOutput: [
          'Thread 3 "connection" hit Breakpoint 1, dispatch_command',
          '    (command=COM_QUERY, thd=0x7fff2c000d70,',
          '     packet=0x7fff2c004a90 "SELECT * FROM users WHERE id = 1",'
        ],
        explanation: '客户端发送的 SQL 语句被 dispatch_command 接收'
      },
      {
        id: 7,
        instruction: '查看当前调用栈',
        command: 'backtrace',
        expectedOutput: [
          '#0  dispatch_command (...) at sql/sql_parse.cc:160',
          '#1  do_command (thd=0x7fff2c000d70) at sql/sql_parse.cc:106',
          '#2  handle_one_connection (arg=0x7fff2c000d70)',
          '    at sql/conn_handler/connection_handler_per_thread.cc:59',
        ],
        explanation: '调用栈清晰展示了从连接处理到命令分发的调用链'
      },
      {
        id: 8,
        instruction: '继续执行到 mysql_parse 断点',
        command: 'continue',
        expectedOutput: [
          'Continuing.',
          'Thread 3 "connection" hit Breakpoint 2, mysql_parse',
          '    (thd=0x7fff2c000d70, inBuf=0x7fff2c004a90,',
          '     length=42) at sql/sql_parse.cc:210',
        ],
        explanation: 'dispatch_command 调用 mysql_parse 开始解析 SQL'
      },
      {
        id: 9,
        instruction: '继续到优化器',
        command: 'continue',
        expectedOutput: [
          'Continuing.',
          'Thread 3 "connection" hit Breakpoint 3, JOIN::optimize',
          '    (this=0x7fff2c0a1000) at sql/sql_optimizer.cc:335',
        ],
        explanation: '解析完成后进入优化器，选择最优执行方案'
      },
      {
        id: 10,
        instruction: '查看优化器中的关键变量',
        command: 'print this->table_count',
        expectedOutput: [
          '$1 = 1',
          '# 表示只有一张表参与查询'
        ],
        explanation: 'table_count 表示参与 JOIN 的表数量'
      },
      {
        id: 11,
        instruction: '继续到存储引擎',
        command: 'continue',
        expectedOutput: [
          'Continuing.',
          'Thread 3 "connection" hit Breakpoint 4, ha_innodb::rnd_next',
          '    (this=0x7fff2c0b2000, buf=0x7fff2c0c0000)',
          '    at storage/innobase/handler/ha_innodb.cc:590',
        ],
        explanation: '优化器决定使用全表扫描后，调用 InnoDB 的 rnd_next 逐行读取'
      },
      {
        id: 12,
        instruction: '查看读取的数据',
        command: 'print prebuilt->table->name',
        expectedOutput: [
          '$2 = {m_name = "test/users"}',
        ],
        explanation: '确认正在读取 users 表的数据'
      },
    ],
    expectedInsights: [
      '一条 SQL 查询经历了 dispatch_command → mysql_parse → JOIN::optimize → ha_innodb::rnd_next 的完整路径',
      '每个阶段都有明确的职责分离：命令分发、解析、优化、存储引擎访问',
      'MySQL 使用 handler API 抽象存储引擎，使得查询执行与存储实现解耦',
      '调用栈清晰展示了 MySQL 的分层架构'
    ],
    relatedSourceFiles: ['sql/sql_parse.cc', 'sql/sql_optimizer.cc', 'storage/innobase/handler/ha_innodb.cc']
  },
  {
    id: 'exp-optimizer-cost',
    title: '实验2: 观察优化器成本估算过程',
    category: 'watchpoint',
    difficulty: 'intermediate',
    objective: '理解 MySQL 优化器如何基于成本模型选择执行计划',
    description: '通过观察 JOIN::optimize 的内部工作过程，理解 MySQL 如何估算不同执行计划的成本，并选择最优方案。',
    prerequisites: [
      '完成实验1',
      '创建包含索引的测试表',
      '理解基本的查询优化概念'
    ],
    setupCommands: [
      'gdb --args ./bin/mysqld --defaults-file=my.cnf --gdb',
      '# 准备测试数据',
      'mysql -e "CREATE TABLE orders(id INT PRIMARY KEY, user_id INT, amount DECIMAL(10,2), INDEX idx_user(user_id));"',
      'mysql -e "INSERT INTO orders SELECT seq, seq%100, RAND()*1000 FROM seq_1_to_10000;"'
    ],
    steps: [
      {
        id: 1,
        instruction: '在优化器关键位置设置断点',
        command: 'break JOIN::optimize\nbreak JOIN::optimize_join_order\nbreak JOIN::make_join_plan',
        expectedOutput: [
          'Breakpoint 1 at 0x555555980a50: file sql/sql_optimizer.cc, line 335.',
          'Breakpoint 2 at 0x555555981200: file sql/sql_optimizer.cc, line 374.',
          'Breakpoint 3 at 0x555555982000: file sql/sql_optimizer.cc, line 480.',
        ],
        explanation: '在优化器的三个关键阶段设置断点'
      },
      {
        id: 2,
        instruction: '设置数据观察点跟踪最优成本',
        command: 'run\n# 客户端执行: SELECT * FROM orders WHERE user_id = 42;',
        expectedOutput: [
          'Thread 3 hit Breakpoint 1, JOIN::optimize()',
        ],
        explanation: '查询触发优化器'
      },
      {
        id: 3,
        instruction: '单步执行观察简化条件',
        command: 'next\nnext\nnext',
        expectedOutput: [
          '340: if (simplify_conditions())',
          '344: if (pushdown_conditions())',
          '348: if (choose_indexes())',
        ],
        explanation: '优化器按顺序执行：条件简化 → 条件下推 → 索引选择'
      },
      {
        id: 4,
        instruction: '在索引选择后观察选中的索引',
        command: 'print positions[0].key',
        expectedOutput: [
          '$1 = (KEY *) 0x7fff2c0d1000',
          '# print positions[0].key->name',
          '$2 = "idx_user"',
        ],
        explanation: '优化器选择了 idx_user 索引来执行查询'
      },
      {
        id: 5,
        instruction: '继续到 make_join_plan 观察最终执行计划',
        command: 'continue',
        expectedOutput: [
          'Thread 3 hit Breakpoint 3, JOIN::make_join_plan()',
          '    at sql/sql_optimizer.cc:480',
        ],
        explanation: '优化完成，生成最终的查询执行计划（QEP）'
      },
      {
        id: 6,
        instruction: '查看最终的执行成本',
        command: 'print best_read',
        expectedOutput: [
          '$3 = 10.456',
          '# 成本值越低表示执行计划越优',
        ],
        explanation: 'best_read 是优化器估算的最优执行成本'
      },
    ],
    expectedInsights: [
      '优化器执行多个阶段：条件简化 → 条件下推 → 索引选择 → 连接顺序优化 → 生成 QEP',
      '成本估算基于统计信息（行数、索引选择性等）',
      '优化器会自动选择合适的索引来降低执行成本',
      'best_read 字段记录了最优执行计划的估算成本'
    ],
    relatedSourceFiles: ['sql/sql_optimizer.cc', 'sql/opt_costmodel.cc']
  },
  {
    id: 'exp-innodb-buffer',
    title: '实验3: 探索 InnoDB 缓冲池工作机制',
    category: 'memory',
    difficulty: 'intermediate',
    objective: '理解 InnoDB 缓冲池如何管理内存中的数据页',
    description: '通过 GDB 观察缓冲池的内部结构，理解 LRU 列表、脏页管理和刷新机制。',
    prerequisites: [
      '完成实验1和2',
      '理解 InnoDB 缓冲池基本概念',
      '了解 B+ 树索引结构'
    ],
    setupCommands: [
      'gdb --args ./bin/mysqld --defaults-file=my.cnf --innodb-buffer-pool-size=128M --gdb',
    ],
    steps: [
      {
        id: 1,
        instruction: '在缓冲池页面获取函数设置断点',
        command: 'break buf_page_get_gen',
        expectedOutput: [
          'Breakpoint 1 at 0x555555b1a000: file storage/innobase/buf/buf0buf.cc, line 1200.',
        ],
        explanation: 'buf_page_get_gen 是获取缓冲池页面的核心函数'
      },
      {
        id: 2,
        instruction: '触发一次数据读取',
        command: 'run\n# 客户端: SELECT * FROM users WHERE id = 1;',
        expectedOutput: [
          'Thread 3 hit Breakpoint 1, buf_page_get_gen',
          '    (page_id={m_space=3, m_page_no=5}, ...)',
        ],
        explanation: '读取 users 表时需要从缓冲池获取数据页'
      },
      {
        id: 3,
        instruction: '查看缓冲池统计信息',
        command: 'print buf_pool->stat',
        expectedOutput: [
          '$1 = {',
          '  n_page_gets = 15234,',
          '  n_pages_read = 342,',
          '  n_pages_written = 128,',
          '  n_pages_created = 56',
          '}',
        ],
        explanation: '缓冲池统计显示了页面访问、读取、写入的计数'
      },
      {
        id: 4,
        instruction: '查看 LRU 列表长度',
        command: 'print buf_pool->LRU->count',
        expectedOutput: [
          '$2 = 8192',
          '# 当前 LRU 列表中有 8192 个页面',
        ],
        explanation: 'LRU 列表管理缓冲池中所有已缓存的数据页'
      },
      {
        id: 5,
        instruction: '检查命中率',
        command: 'print (double)(buf_pool->stat.n_page_gets - buf_pool->stat.n_pages_read) / buf_pool->stat.n_page_gets * 100',
        expectedOutput: [
          '$3 = 97.754',
          '# 缓冲池命中率 97.75%',
        ],
        explanation: '高命中率表示大部分数据访问都在内存中完成'
      },
    ],
    expectedInsights: [
      '缓冲池使用 LRU 算法管理内存页面',
      '缓冲池命中率直接影响查询性能',
      '脏页通过后台线程异步刷新到磁盘',
      '理解缓冲池配置对数据库性能的关键影响'
    ],
    relatedSourceFiles: ['storage/innobase/handler/ha_innodb.cc']
  },
  {
    id: 'exp-thread-analysis',
    title: '实验4: MySQL 线程模型与 Master Thread 分析',
    category: 'thread',
    difficulty: 'advanced',
    objective: '理解 MySQL 的多线程架构，特别是 Master Thread 的工作机制',
    description: '通过 GDB 的线程调试功能，观察 MySQL 各个后台线程的工作状态，深入分析 Master Thread 的周期性任务。',
    prerequisites: [
      '完成前三个实验',
      '理解多线程编程概念',
      '了解 InnoDB 后台线程架构'
    ],
    setupCommands: [
      'gdb --args ./bin/mysqld --defaults-file=my.cnf --gdb',
    ],
    steps: [
      {
        id: 1,
        instruction: '启动后查看所有线程',
        command: 'run\n# 等待启动完成后 Ctrl+C\ninfo threads',
        expectedOutput: [
          '  Id   Target Id         Frame',
          '  1    Thread 0x7ffff7a4d740 "mysqld" main()',
          '  2    Thread 0x7fffe7fff700 "srv_master" srv_master_thread()',
          '  3    Thread 0x7fffe77fe700 "srv_purge" srv_purge_coordinator_thread()',
          '  4    Thread 0x7fffe6ffd700 "buf_flush" buf_flush_page_cleaner_coordinator()',
          '  5    Thread 0x7fffe67fc700 "log_writer" log_writer_thread()',
        ],
        explanation: 'MySQL 启动后创建多个后台线程，各自负责不同的任务'
      },
      {
        id: 2,
        instruction: '切换到 Master Thread 并查看调用栈',
        command: 'thread 2\nbacktrace',
        expectedOutput: [
          '#0  srv_master_thread() at storage/innobase/srv/srv0srv.cc:2345',
          '#1  os_thread_entry() at storage/innobase/os/os0thread.cc:50',
        ],
        explanation: 'Master Thread 运行在 srv_master_thread 函数中'
      },
      {
        id: 3,
        instruction: '在 Master Thread 的活跃任务函数设置断点',
        command: 'break srv_master_do_active_tasks\nbreak srv_master_do_idle_tasks',
        expectedOutput: [
          'Breakpoint 1 at 0x555555c2a000: file storage/innobase/srv/srv0srv.cc, line 3456.',
          'Breakpoint 2 at 0x555555c2b000: file storage/innobase/srv/srv0srv.cc, line 4567.',
        ],
        explanation: 'Master Thread 根据系统负载切换活跃和空闲两种工作模式'
      },
      {
        id: 4,
        instruction: '继续执行，观察 Master Thread 的工作切换',
        command: 'continue',
        expectedOutput: [
          'Thread 2 hit Breakpoint 1, srv_master_do_active_tasks()',
          '    at storage/innobase/srv/srv0srv.cc:3456',
        ],
        explanation: 'Master Thread 正在执行活跃状态的任务'
      },
      {
        id: 5,
        instruction: '查看当前负载情况',
        command: 'print srv_sys->activity_count',
        expectedOutput: [
          '$1 = 1523',
          '# 活跃计数器，用于判断系统负载',
        ],
        explanation: 'activity_count 帮助 Master Thread 决定执行哪种级别的任务'
      },
    ],
    expectedInsights: [
      'MySQL 使用多线程架构，每个后台线程有特定职责',
      'Master Thread 根据系统负载自动切换活跃/空闲模式',
      '活跃模式下执行更频繁的刷新操作',
      '空闲模式下执行清理和维护操作'
    ],
    relatedSourceFiles: ['sql/sql_parse.cc']
  },
  {
    id: 'exp-lock-analysis',
    title: '实验5: InnoDB 锁机制与死锁检测',
    category: 'watchpoint',
    difficulty: 'advanced',
    objective: '理解 InnoDB 的行级锁机制和死锁检测算法',
    description: '通过模拟并发事务，观察 InnoDB 的加锁过程和死锁检测机制。',
    prerequisites: [
      '完成前四个实验',
      '理解事务隔离级别',
      '理解 InnoDB 锁类型（共享锁、排他锁、意向锁）'
    ],
    setupCommands: [
      'gdb --args ./bin/mysqld --defaults-file=my.cnf --gdb',
      '# 准备两个客户端连接用于模拟并发'
    ],
    steps: [
      {
        id: 1,
        instruction: '在锁请求函数设置断点',
        command: 'break lock_rec_lock',
        expectedOutput: [
          'Breakpoint 1 at 0x555555c5a000: file storage/innobase/lock/lock0lock.cc, line 890.',
        ],
        explanation: 'lock_rec_lock 是行级锁的核心请求函数'
      },
      {
        id: 2,
        instruction: '在死锁检测函数设置断点',
        command: 'break Deadlock_notifier::notify',
        expectedOutput: [
          'Breakpoint 2 at 0x555555c5b000: file storage/innobase/lock/lock0lock.cc, line 2345.',
        ],
        explanation: '当检测到死锁时会调用此函数'
      },
      {
        id: 3,
        instruction: '模拟加锁过程',
        command: '# 客户端1: BEGIN; SELECT * FROM users WHERE id=1 FOR UPDATE;',
        expectedOutput: [
          'Thread 3 hit Breakpoint 1, lock_rec_lock',
          '    (mode=LOCK_X, block=0x7fff2c0a0000, ...)',
        ],
        explanation: 'FOR UPDATE 触发排他锁（LOCK_X）请求'
      },
      {
        id: 4,
        instruction: '查看锁类型',
        command: 'print mode',
        expectedOutput: [
          '$1 = LOCK_X (排他锁)',
        ],
        explanation: 'LOCK_X 表示排他锁，其他事务无法同时持有'
      },
    ],
    expectedInsights: [
      'InnoDB 使用行级锁实现并发控制',
      '死锁检测使用等待图（wait-for graph）算法',
      '当检测到死锁时，InnoDB 会回滚代价最小的事务',
      '了解不同锁类型对性能的影响'
    ],
    relatedSourceFiles: ['storage/innobase/handler/ha_innodb.cc']
  }
]
