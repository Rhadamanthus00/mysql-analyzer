// 火焰图数据模型

export interface FlameNode {
  name: string
  value: number          // 采样次数
  selfValue?: number     // 自身采样（不含子调用）
  children?: FlameNode[]
  file?: string
  module?: string
  color?: string
}

export interface FlameGraphScenario {
  id: string
  title: string
  description: string
  workload: string
  command: string
  duration: string
  metrics: { label: string; value: string }[]
  insights: string[]
  optimizations: string[]
  data: FlameNode
}

export interface PerfCommand {
  id: string
  title: string
  description: string
  command: string
  output: string[]
  explanation: string
}

export const perfCommands: PerfCommand[] = [
  {
    id: 'record-cpu',
    title: '采集 CPU 热点',
    description: '使用 perf record 采集 MySQL 进程的 CPU 采样数据',
    command: 'perf record -F 99 -p $(pidof mysqld) -g -- sleep 30',
    output: [
      '[ perf record: Woken up 3 times to write data ]',
      '[ perf record: Captured and wrote 1.234 MB perf.data (12345 samples) ]',
    ],
    explanation: '-F 99 表示每秒采样99次，-g 记录调用栈，-p 指定 mysqld 进程PID'
  },
  {
    id: 'generate-flame',
    title: '生成火焰图',
    description: '将 perf 数据转换为火焰图 SVG',
    command: 'perf script | ./FlameGraph/stackcollapse-perf.pl | ./FlameGraph/flamegraph.pl > mysql_flame.svg',
    output: [
      '# 生成 mysql_flame.svg 文件',
      '# 在浏览器中打开查看交互式火焰图',
    ],
    explanation: '使用 Brendan Gregg 的 FlameGraph 工具链处理 perf 输出'
  },
  {
    id: 'diff-flame',
    title: '差异火焰图',
    description: '对比优化前后的火焰图差异',
    command: './FlameGraph/difffolded.pl before.folded after.folded | ./FlameGraph/flamegraph.pl > diff.svg',
    output: [
      '# 红色 = 回归（耗时增加）',
      '# 蓝色 = 改进（耗时减少）',
    ],
    explanation: '差异火焰图帮助识别性能优化或回归的具体代码路径'
  },
  {
    id: 'on-off-cpu',
    title: 'Off-CPU 分析',
    description: '分析 MySQL 线程被阻塞（等待IO/锁）的时间分布',
    command: 'perf record -e sched:sched_switch -p $(pidof mysqld) -g -- sleep 10',
    output: [
      '# 采集上下文切换事件',
      '# 可以发现线程等待锁、IO 的时间消耗',
    ],
    explanation: 'Off-CPU 分析可以发现 IO 等待、锁争用等 CPU 采样无法捕获的性能问题'
  },
  {
    id: 'sysbench-prepare',
    title: 'SysBench 压测准备',
    description: '使用 sysbench 生成 OLTP 测试负载',
    command: 'sysbench oltp_read_write --db-driver=mysql --mysql-host=127.0.0.1 --mysql-port=3306 --mysql-user=root --mysql-db=sbtest --tables=4 --table-size=100000 prepare',
    output: [
      'Creating table sbtest1...',
      'Inserting 100000 records into sbtest1',
      'Creating table sbtest2...',
      '...',
    ],
    explanation: '准备标准 OLTP 测试数据，4张表各10万行'
  },
  {
    id: 'sysbench-run',
    title: 'SysBench 压测执行',
    description: '执行 OLTP 读写混合压测',
    command: 'sysbench oltp_read_write --db-driver=mysql --mysql-host=127.0.0.1 --mysql-port=3306 --mysql-user=root --mysql-db=sbtest --tables=4 --table-size=100000 --threads=16 --time=60 run',
    output: [
      'Threads started!',
      '',
      'SQL statistics:',
      '    queries performed:',
      '        read:                   142856',
      '        write:                  40816',
      '        other:                  20408',
      '        total:                  204080',
      '    transactions:              10204  (170.04 per sec.)',
      '    queries:                   204080 (3400.80 per sec.)',
      '    latency (ms):',
      '         min:                   45.23',
      '         avg:                   94.07',
      '         max:                   385.12',
      '         95th percentile:       155.80',
    ],
    explanation: '16线程并发执行读写混合负载，持续60秒'
  }
]

// 模拟的火焰图数据 — OLTP 读写混合场景
export const flameGraphScenarios: FlameGraphScenario[] = [
  {
    id: 'oltp-read-write',
    title: 'OLTP 读写混合 (SysBench)',
    description: '16线程并发 OLTP 读写混合压测下的 CPU 热点分布',
    workload: 'sysbench oltp_read_write --threads=16 --time=60',
    command: 'perf record -F 99 -p $(pidof mysqld) -g -- sleep 30',
    duration: '30 秒采样',
    metrics: [
      { label: 'QPS', value: '3,400' },
      { label: 'TPS', value: '170' },
      { label: 'P95 延迟', value: '155 ms' },
      { label: '采样数', value: '12,345' },
    ],
    insights: [
      'SQL 解析（mysql_parse）占 CPU 约 15%，是可优化的热点',
      'InnoDB 缓冲池操作（buf_page_get_gen）占 22%，表示大量内存访问',
      '锁竞争（lock_rec_lock）在高并发下占 8%',
      'redo log 写入（log_write_up_to）占 12%',
      'B+树搜索（btr_cur_search_to_nth_level）占 18%',
    ],
    optimizations: [
      '开启 Prepared Statement 可减少 SQL 解析开销',
      '增大 innodb_buffer_pool_size 可减少磁盘 IO',
      '调整 innodb_log_file_size 可减少 log 刷新频率',
      '使用 innodb_flush_log_at_trx_commit=2 可降低 log 写入延迟',
    ],
    data: {
      name: 'mysqld',
      value: 12345,
      children: [
        {
          name: 'handle_one_connection',
          value: 11000,
          module: 'sql',
          children: [
            {
              name: 'do_command',
              value: 10500,
              module: 'sql',
              children: [
                {
                  name: 'dispatch_command',
                  value: 10200,
                  module: 'sql',
                  children: [
                    {
                      name: 'mysql_parse',
                      value: 1850,
                      selfValue: 200,
                      module: 'sql',
                      file: 'sql/sql_parse.cc',
                      children: [
                        { name: 'THD::sql_parser', value: 800, selfValue: 150, module: 'sql', file: 'sql/sql_parse.cc' },
                        { name: 'yyparse', value: 650, selfValue: 650, module: 'sql', file: 'sql/sql_yacc.yy' },
                        { name: 'lex_one_token', value: 200, selfValue: 200, module: 'sql', file: 'sql/sql_lex.cc' },
                      ]
                    },
                    {
                      name: 'JOIN::optimize',
                      value: 1200,
                      selfValue: 100,
                      module: 'sql',
                      file: 'sql/sql_optimizer.cc',
                      children: [
                        { name: 'JOIN::optimize_join_order', value: 400, selfValue: 400, module: 'sql' },
                        { name: 'JOIN::make_join_plan', value: 350, selfValue: 350, module: 'sql' },
                        { name: 'choose_indexes', value: 250, selfValue: 250, module: 'sql' },
                        { name: 'simplify_conditions', value: 100, selfValue: 100, module: 'sql' },
                      ]
                    },
                    {
                      name: 'JOIN::execute',
                      value: 5500,
                      selfValue: 200,
                      module: 'sql',
                      file: 'sql/sql_executor.cc',
                      children: [
                        {
                          name: 'sub_select',
                          value: 5000,
                          selfValue: 300,
                          module: 'sql',
                          children: [
                            {
                              name: 'ha_innodb::rnd_next',
                              value: 2200,
                              selfValue: 200,
                              module: 'innodb',
                              file: 'storage/innobase/handler/ha_innodb.cc',
                              children: [
                                {
                                  name: 'row_search_no_mvcc',
                                  value: 1200,
                                  selfValue: 300,
                                  module: 'innodb',
                                  children: [
                                    {
                                      name: 'btr_cur_search_to_nth_level',
                                      value: 900,
                                      selfValue: 500,
                                      module: 'innodb',
                                      children: [
                                        { name: 'buf_page_get_gen', value: 400, selfValue: 400, module: 'innodb' },
                                      ]
                                    },
                                  ]
                                },
                                { name: 'buf_page_get_gen', value: 800, selfValue: 800, module: 'innodb' },
                              ]
                            },
                            {
                              name: 'ha_innodb::index_read',
                              value: 1800,
                              selfValue: 150,
                              module: 'innodb',
                              file: 'storage/innobase/handler/ha_innodb.cc',
                              children: [
                                {
                                  name: 'row_search_for_mysql',
                                  value: 1650,
                                  selfValue: 400,
                                  module: 'innodb',
                                  children: [
                                    { name: 'btr_cur_search_to_nth_level', value: 800, selfValue: 500, module: 'innodb' },
                                    { name: 'lock_rec_lock', value: 450, selfValue: 450, module: 'innodb' },
                                  ]
                                },
                              ]
                            },
                            {
                              name: 'lock_rec_lock',
                              value: 550,
                              selfValue: 550,
                              module: 'innodb',
                            },
                            { name: 'evaluate_join_record', value: 150, selfValue: 150, module: 'sql' },
                          ]
                        },
                        { name: 'Protocol::send_result_set_row', value: 300, selfValue: 300, module: 'sql' },
                      ]
                    },
                    {
                      name: 'ha_innodb::write_row',
                      value: 1200,
                      selfValue: 100,
                      module: 'innodb',
                      children: [
                        { name: 'row_insert_for_mysql', value: 500, selfValue: 500, module: 'innodb' },
                        {
                          name: 'log_write_up_to',
                          value: 400,
                          selfValue: 400,
                          module: 'innodb',
                        },
                        { name: 'trx_commit', value: 200, selfValue: 200, module: 'innodb' },
                      ]
                    },
                    { name: 'THD::cleanup_after_query', value: 250, selfValue: 250, module: 'sql' },
                  ]
                },
                { name: 'net_read_packet', value: 300, selfValue: 300, module: 'sql' },
              ]
            },
          ]
        },
        {
          name: 'srv_master_thread',
          value: 800,
          module: 'innodb',
          children: [
            { name: 'srv_master_do_active_tasks', value: 500, selfValue: 100, module: 'innodb',
              children: [
                { name: 'log_checkpoint', value: 200, selfValue: 200, module: 'innodb' },
                { name: 'buf_flush_page_cleaner', value: 200, selfValue: 200, module: 'innodb' },
              ]
            },
            { name: 'srv_master_do_idle_tasks', value: 300, selfValue: 300, module: 'innodb' },
          ]
        },
        {
          name: 'buf_flush_page_cleaner_coordinator',
          value: 350,
          selfValue: 150,
          module: 'innodb',
          children: [
            { name: 'buf_flush_batch', value: 200, selfValue: 200, module: 'innodb' },
          ]
        },
        { name: 'log_writer_thread', value: 195, selfValue: 195, module: 'innodb' },
      ]
    }
  },
  {
    id: 'point-select',
    title: '高并发点查 (Point Select)',
    description: '32线程并发主键点查场景下的 CPU 热点分布',
    workload: 'sysbench oltp_point_select --threads=32 --time=60',
    command: 'perf record -F 99 -p $(pidof mysqld) -g -- sleep 30',
    duration: '30 秒采样',
    metrics: [
      { label: 'QPS', value: '45,000' },
      { label: 'P95 延迟', value: '2.3 ms' },
      { label: 'P99 延迟', value: '4.1 ms' },
      { label: '采样数', value: '18,200' },
    ],
    insights: [
      'B+树搜索（btr_cur_search_to_nth_level）成为最大热点，占 35%',
      '缓冲池页面获取（buf_page_get_gen）占 15%',
      'SQL 解析在使用 Prepared Statement 后只占 5%',
      '网络IO（net_read_packet/net_write_packet）合计占 10%',
    ],
    optimizations: [
      '使用 Prepared Statement 可将解析开销降到最低',
      '确保热点数据完全在缓冲池中',
      '考虑使用连接池减少连接建立开销',
      '调整 innodb_adaptive_hash_index 参数',
    ],
    data: {
      name: 'mysqld',
      value: 18200,
      children: [
        {
          name: 'handle_one_connection',
          value: 17500,
          module: 'sql',
          children: [
            {
              name: 'do_command',
              value: 17000,
              module: 'sql',
              children: [
                {
                  name: 'dispatch_command',
                  value: 16500,
                  module: 'sql',
                  children: [
                    { name: 'mysql_parse', value: 910, selfValue: 200, module: 'sql',
                      children: [
                        { name: 'THD::sql_parser', value: 400, selfValue: 400, module: 'sql' },
                        { name: 'yyparse', value: 310, selfValue: 310, module: 'sql' },
                      ]
                    },
                    { name: 'JOIN::optimize', value: 800, selfValue: 200, module: 'sql',
                      children: [
                        { name: 'choose_indexes', value: 400, selfValue: 400, module: 'sql' },
                        { name: 'JOIN::make_join_plan', value: 200, selfValue: 200, module: 'sql' },
                      ]
                    },
                    {
                      name: 'JOIN::execute',
                      value: 12500,
                      selfValue: 300,
                      module: 'sql',
                      children: [
                        {
                          name: 'ha_innodb::index_read',
                          value: 10000,
                          selfValue: 500,
                          module: 'innodb',
                          children: [
                            {
                              name: 'row_search_for_mysql',
                              value: 9500,
                              selfValue: 1000,
                              module: 'innodb',
                              children: [
                                {
                                  name: 'btr_cur_search_to_nth_level',
                                  value: 6370,
                                  selfValue: 3500,
                                  module: 'innodb',
                                  children: [
                                    { name: 'buf_page_get_gen', value: 2730, selfValue: 2730, module: 'innodb' },
                                    { name: 'page_cur_search_with_match', value: 140, selfValue: 140, module: 'innodb' },
                                  ]
                                },
                                { name: 'lock_rec_lock', value: 1500, selfValue: 1500, module: 'innodb' },
                                { name: 'mtr_commit', value: 630, selfValue: 630, module: 'innodb' },
                              ]
                            },
                          ]
                        },
                        { name: 'Protocol::send_result_set_row', value: 1500, selfValue: 1500, module: 'sql' },
                        { name: 'evaluate_join_record', value: 700, selfValue: 700, module: 'sql' },
                      ]
                    },
                    { name: 'THD::cleanup_after_query', value: 500, selfValue: 500, module: 'sql' },
                    { name: 'net_read_packet', value: 1000, selfValue: 1000, module: 'sql' },
                    { name: 'net_write_packet', value: 790, selfValue: 790, module: 'sql' },
                  ]
                },
                { name: 'thd->read_query', value: 500, selfValue: 500, module: 'sql' },
              ]
            },
          ]
        },
        { name: 'srv_master_thread', value: 400, selfValue: 400, module: 'innodb' },
        { name: 'buf_flush_page_cleaner_coordinator', value: 200, selfValue: 200, module: 'innodb' },
        { name: 'log_writer_thread', value: 100, selfValue: 100, module: 'innodb' },
      ]
    }
  },
  {
    id: 'write-heavy',
    title: '写密集型场景 (Write Heavy)',
    description: '16线程纯写入压测下的 CPU 热点分布',
    workload: 'sysbench oltp_write_only --threads=16 --time=60',
    command: 'perf record -F 99 -p $(pidof mysqld) -g -- sleep 30',
    duration: '30 秒采样',
    metrics: [
      { label: 'QPS', value: '8,500' },
      { label: 'TPS', value: '530' },
      { label: 'P95 延迟', value: '48 ms' },
      { label: '采样数', value: '9,800' },
    ],
    insights: [
      'redo log 写入（log_write_up_to）成为最大瓶颈，占 28%',
      '事务提交（trx_commit）占 15%',
      'B+树插入（btr_cur_optimistic_insert）占 12%',
      '缓冲池脏页管理占 10%',
    ],
    optimizations: [
      '使用 group commit 批量提交减少 log 同步次数',
      '调整 innodb_flush_log_at_trx_commit=2 降低 IO 同步开销',
      '增大 innodb_log_buffer_size 减少 log buffer 刷新',
      '考虑使用 SSD 存储以降低 IO 延迟',
    ],
    data: {
      name: 'mysqld',
      value: 9800,
      children: [
        {
          name: 'handle_one_connection',
          value: 8800,
          module: 'sql',
          children: [
            {
              name: 'do_command',
              value: 8500,
              module: 'sql',
              children: [
                {
                  name: 'dispatch_command',
                  value: 8200,
                  module: 'sql',
                  children: [
                    { name: 'mysql_parse', value: 600, selfValue: 200, module: 'sql',
                      children: [
                        { name: 'THD::sql_parser', value: 250, selfValue: 250, module: 'sql' },
                        { name: 'yyparse', value: 150, selfValue: 150, module: 'sql' },
                      ]
                    },
                    {
                      name: 'ha_innodb::write_row',
                      value: 4500,
                      selfValue: 200,
                      module: 'innodb',
                      children: [
                        { name: 'row_insert_for_mysql', value: 1200, selfValue: 400, module: 'innodb',
                          children: [
                            { name: 'btr_cur_optimistic_insert', value: 800, selfValue: 500, module: 'innodb',
                              children: [
                                { name: 'page_cur_insert_rec', value: 300, selfValue: 300, module: 'innodb' },
                              ]
                            },
                          ]
                        },
                        { name: 'log_write_up_to', value: 1800, selfValue: 1800, module: 'innodb' },
                        { name: 'trx_commit', value: 900, selfValue: 400, module: 'innodb',
                          children: [
                            { name: 'trx_flush_log_if_needed', value: 500, selfValue: 500, module: 'innodb' },
                          ]
                        },
                        { name: 'lock_rec_lock', value: 400, selfValue: 400, module: 'innodb' },
                      ]
                    },
                    {
                      name: 'ha_innodb::update_row',
                      value: 2000,
                      selfValue: 200,
                      module: 'innodb',
                      children: [
                        { name: 'row_update_for_mysql', value: 800, selfValue: 800, module: 'innodb' },
                        { name: 'log_write_up_to', value: 600, selfValue: 600, module: 'innodb' },
                        { name: 'trx_commit', value: 400, selfValue: 400, module: 'innodb' },
                      ]
                    },
                    { name: 'THD::cleanup_after_query', value: 300, selfValue: 300, module: 'sql' },
                    { name: 'net_read_packet', value: 500, selfValue: 500, module: 'sql' },
                    { name: 'net_write_packet', value: 300, selfValue: 300, module: 'sql' },
                  ]
                },
                { name: 'thd->read_query', value: 300, selfValue: 300, module: 'sql' },
              ]
            },
          ]
        },
        {
          name: 'srv_master_thread',
          value: 500,
          module: 'innodb',
          children: [
            { name: 'buf_flush_page_cleaner', value: 300, selfValue: 300, module: 'innodb' },
            { name: 'log_checkpoint', value: 200, selfValue: 200, module: 'innodb' },
          ]
        },
        { name: 'buf_flush_page_cleaner_coordinator', value: 300, selfValue: 150, module: 'innodb',
          children: [
            { name: 'buf_flush_batch', value: 150, selfValue: 150, module: 'innodb' },
          ]
        },
        { name: 'log_writer_thread', value: 200, selfValue: 200, module: 'innodb' },
      ]
    }
  }
]
