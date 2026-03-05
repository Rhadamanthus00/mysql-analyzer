// 源码文件类型
export interface SourceFile {
  path: string
  content: string
  language: 'cpp' | 'c' | 'h' | 'yy' | 'cc'
  description: string
}

// 模拟的源码内容
export const sourceCodeData: Record<string, SourceFile> = {
  'sql/conn_handler/connection_handler_per_thread.cc': {
    path: 'sql/conn_handler/connection_handler_per_thread.cc',
    language: 'cpp',
    description: '每个连接一个线程的处理逻辑',
    content: `/*
  Copyright (c) 2000, 2021, Oracle and/or its affiliates.

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License, version 2.0,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
*/

#include <mysql/plugin.h>
#include <mysql/psi/mysql_thread.h>
#include "sql/conn_handler/connection_handler_per_thread.h"
#include "sql/sql_connect.h"
#include "sql/sql_class.h"

/**
 * 处理一个客户端连接
 * 这是MySQL连接处理的核心函数，每个客户端连接都会创建一个线程来调用此函数
 * 
 * @param arg 线程参数，包含THD结构体指针
 */
extern "C" void *handle_one_connection(void *arg)
{
  THD *thd= (THD *)arg;

  DBUG_ENTER("handle_one_connection");

  // 初始化线程特定的数据结构
  my_thread_init();

  // 设置当前线程的THD
  thd->store_globals();

  DBUG_PRINT("info", ("handle_one_connection called for thread %lu", 
                      (ulong)thd->thread_id));

  // 进入连接处理循环
  for (;;)
  {
    // 等待并读取来自客户端的命令
    if (do_command(thd))
      break;  // 客户端断开连接或出错

    // 检查是否需要杀死连接
    if (thd->killed)
    {
      thd->send_kill_message();
      break;
    }
  }

  // 清理并断开连接
  thd->release_resources();
  end_connection(thd);

  my_thread_end();
  DBUG_RETURN(0);
}

/**
 * 执行客户端发送的命令
 * 
 * @param thd 当前线程上下文
 * @return 0 表示成功, 非0 表示错误
 */
int do_command(THD *thd)
{
  int rc;
  enum enum_server_command command;

  DBUG_ENTER("do_command");

  // 从网络读取命令
  if ((rc= thd->read_query()))
  {
    if (rc == 1)
      thd->killed = THD::KILL_CONNECTION;
    DBUG_RETURN(1);
  }

  // 获取命令类型
  command= thd->command;

  // 根据命令类型分发处理
  switch (command) {
    case COM_QUERY:
      // 处理SQL查询
      rc= dispatch_command(COM_QUERY, thd, thd->packet, thd->packet_length);
      break;
      
    case COM_QUIT:
      // 客户端请求断开连接
      thd->killed = THD::KILL_CONNECTION;
      rc= 0;
      break;
      
    case COM_PING:
      // 心跳检测
      my_ok(thd);
      rc= 0;
      break;
      
    default:
      // 其他命令类型
      rc= dispatch_command(command, thd, thd->packet, thd->packet_length);
      break;
  }

  DBUG_RETURN(rc);
}`
  },

  'sql/sql_parse.cc': {
    path: 'sql/sql_parse.cc',
    language: 'cpp',
    description: 'SQL语句解析和命令分发',
    content: `/*
  SQL解析和命令分发核心模块

  该文件负责:
  1. 接收和解析SQL语句
  2. 将SQL语句转换为内部表示
  3. 调用优化器生成执行计划
  4. 执行查询并返回结果
*/

#include <mysql/plugin.h>
#include "sql/sql_parse.h"
#include "sql/sql_resolver.h"
#include "sql/sql_optimizer.h"
#include "sql/sql_executor.h"

/**
 * 分发命令到对应的处理函数
 * 
 * @param command 命令类型
 * @param thd 线程上下文
 * @param packet 数据包
 * @param packet_length 数据包长度
 * @return 0 表示成功
 */
int dispatch_command(enum enum_server_command command, THD *thd,
                     const char *packet, uint packet_length)
{
  DBUG_ENTER("dispatch_command");

  switch (command) {
    case COM_QUERY:
    {
      // 处理SQL查询命令
      const char *query= packet;
      uint length= packet_length;

      DBUG_PRINT("info", ("Query: %.*s", length, query));

      // 解析并执行SQL语句
      mysql_parse(thd, query, length);
      break;
    }

    case COM_FIELD_LIST:
      // 处理字段列表请求
      // TODO: 实现
      break;

    case COM_CREATE_DB:
      // 处理创建数据库命令
      // TODO: 实现
      break;

    case COM_DROP_DB:
      // 处理删除数据库命令
      // TODO: 实现
      break;

    default:
      // 未知命令类型
      my_error(ER_UNKNOWN_COM_ERROR, MYF(0), command);
      break;
  }

  DBUG_RETURN(0);
}

/**
 * 解析并执行SQL语句
 * 
 * @param thd 线程上下文
 * @param inBuf SQL语句缓冲区
 * @param length SQL语句长度
 */
void mysql_parse(THD *thd, const char *inBuf, uint length)
{
  DBUG_ENTER("mysql_parse");

  Parser_state ps;

  // 初始化解析器状态
  if (!ps.init(thd, inBuf, length))
  {
    // 词法分析
    if (!thd->sql_parser())
    {
      // 语法分析,生成抽象语法树
      if (!yyparse(&ps))
      {
        // 语义分析和解析树处理
        LEX *lex= thd->lex;
        
        // 解析树优化
        if (lex->sql_command == SQLCOM_SELECT)
        {
          // SELECT语句需要经过优化器
          if (!thd->optimize_query())
          {
            // 执行查询
            thd->execute_query();
          }
        }
        else
        {
          // 非SELECT语句直接执行
          thd->execute_query();
        }
      }
    }
  }

  DBUG_VOID_RETURN;
}

/**
 * 词法分析器
 * 将SQL语句分解为token序列
 * 
 * @param thd 线程上下文
 * @return 0 表示成功
 */
bool THD::sql_parser()
{
  DBUG_ENTER("THD::sql_parser");

  LEX *lex= this->lex;
  Parser_state *parser_state= this->parser_state;

  // 调用Flex生成的词法分析器
  if (MYSQLparse(this, parser_state))
  {
    my_error(ER_PARSE_ERROR, MYF(0));
    DBUG_RETURN(TRUE);
  }

  DBUG_RETURN(FALSE);
}`
  },

  'sql/sql_optimizer.cc': {
    path: 'sql/sql_optimizer.cc',
    language: 'cpp',
    description: '查询优化器,生成最优执行计划',
    content: `/*
  MySQL查询优化器

  基于成本的优化器,通过分析多种执行计划,
  选择成本最低的方案
*/

#include <mysql/plugin.h>
#include "sql/sql_optimizer.h"
#include "sql/sql_select.h"
#include "sql/opt_costmodel.h"

/**
 * 优化查询
 * 分析SQL语句并生成最优的执行计划
 * 
 * @param thd 线程上下文
 * @return 0 表示成功
 */
int THD::optimize_query()
{
  DBUG_ENTER("THD::optimize_query");

  LEX *lex= this->lex;
  SELECT_LEX *select_lex= &lex->select_lex;
  JOIN *join= select_lex->join;

  if (!join)
  {
    // 创建JOIN对象
    join= new JOIN(this, select_lex);
    select_lex->join= join;
  }

  // 调用JOIN优化器
  if (join->optimize())
  {
    my_error(ER_OPTIMIZER_ERROR, MYF(0));
    DBUG_RETURN(1);
  }

  DBUG_RETURN(0);
}

/**
 * JOIN优化器主函数
 * 
 * 执行以下优化步骤:
 * 1. 常量折叠和表达式简化
 * 2. 条件下推
 * 3. 索引选择
 * 4. 连接顺序优化
 * 5. 访问方法选择
 * 
 * @return 0 表示成功
 */
int JOIN::optimize()
{
  DBUG_ENTER("JOIN::optimize");

  // 步骤1: 简化和预处理
  if (simplify_conditions())
    DBUG_RETURN(1);

  // 步骤2: 条件下推
  if (pushdown_conditions())
    DBUG_RETURN(1);

  // 步骤3: 选择索引
  if (choose_indexes())
    DBUG_RETURN(1);

  // 步骤4: 优化连接顺序
  if (optimize_join_order())
    DBUG_RETURN(1);

  // 步骤5: 生成查询执行计划(QEP)
  if (make_join_plan())
    DBUG_RETURN(1);

  // 步骤6: 准备执行
  if (prepare())
    DBUG_RETURN(1);

  DBUG_PRINT("info", ("JOIN optimized, cost: %.2f", best_read));

  DBUG_RETURN(0);
}

/**
 * 优化连接顺序
 * 使用贪心算法或动态规划选择最优的连接顺序
 * 
 * @return 0 表示成功
 */
int JOIN::optimize_join_order()
{
  DBUG_ENTER("JOIN::optimize_join_order");

  const uint tables= table_count;
  
  if (tables <= 2)
  {
    // 表数量少,直接使用固定顺序
    for (uint i= 0; i < tables; i++)
    {
      best_positions[i]= positions[i];
    }
    DBUG_RETURN(0);
  }

  // 使用贪心算法选择连接顺序
  table_map used_tables= 0;
  double best_cost= DBL_MAX;
  
  for (uint i= 0; i < tables; i++)
  {
    // 选择下一个最优的表
    uint best_table= find_best_table(used_tables);
    
    if (best_table == (uint)-1)
      break;
      
    best_positions[i]= positions[best_table];
    used_tables|= positions[best_table].table->map;
  }

  // 计算总成本
  best_cost= calculate_join_cost();
  
  DBUG_PRINT("info", ("Optimal join order: %s, cost: %.2f",
                      get_join_order_str(used_tables), best_cost));

  DBUG_RETURN(0);
}

/**
 * 查找下一个最优的表加入连接顺序
 * 
 * @param used_tables 已使用的表位图
 * @return 最优表的索引
 */
uint JOIN::find_best_table(table_map used_tables)
{
  double min_cost= DBL_MAX;
  uint best_table= (uint)-1;

  for (uint i= 0; i < table_count; i++)
  {
    // 跳过已使用的表
    if (used_tables & positions[i].table->map)
      continue;

    // 估算加入该表的成本
    double cost= estimate_join_cost(i, used_tables);
    
    if (cost < min_cost)
    {
      min_cost= cost;
      best_table= i;
    }
  }

  return best_table;
}

/**
 * 估算连接成本
 * 
 * @param table_idx 表索引
 * @param used_tables 已使用的表
 * @return 估算的成本
 */
double JOIN::estimate_join_cost(uint table_idx, table_map used_tables)
{
  double cost= 0;
  POSITION *pos= &positions[table_idx];

  // 读取成本
  cost+= pos->table->file->stats.records * 
        pos->table->file->scan_time();

  // 如果有索引,计算索引访问成本
  if (pos->key)
  {
    cost+= pos->table->file->stats.records * 
          pos->table->file->keyread_time(pos->key);
  }

  // 连接成本
  cost+= calculate_join_cost(table_idx, used_tables);

  return cost;
}

/**
 * 生成查询执行计划(QEP)
 * 将优化后的计划转换为可执行的QEP结构
 * 
 * @return 0 表示成功
 */
int JOIN::make_join_plan()
{
  DBUG_ENTER("JOIN::make_join_plan");

  // 创建QEP_TAB结构
  qep_tab= (QEP_TAB*) thd->mem_calloc(sizeof(QEP_TAB) * table_count);
  
  for (uint i= 0; i < table_count; i++)
  {
    POSITION *pos= &best_positions[i];
    QEP_TAB *qt= &qep_tab[i];
    
    qt->table= pos->table;
    qt->key= pos->key;
    qt->read_type= pos->read_type;
    qt->cond= pos->cond;
    qt->ref= pos->ref;
  }

  // 设置执行器
  if (!exec)
  {
    exec= new QEP_TAB(this, qep_tab);
  }

  DBUG_RETURN(0);
}`
  },

  'storage/innobase/handler/ha_innodb.cc': {
    path: 'storage/innobase/handler/ha_innodb.cc',
    language: 'cpp',
    description: 'InnoDB存储引擎处理器',
    content: `/*
  InnoDB存储引擎 - MySQL Handler接口实现

  InnoDB是MySQL的默认存储引擎,提供:
  - ACID事务支持
  - 行级锁定
  - 外键约束
  - 崩溃恢复
*/

#include <mysql/plugin.h>
#include "storage/innobase/include/handler0ha.h"
#include "storage/innobase/include/btr0btr.h"
#include "storage/innobase/include/buf0buf.h"

/**
 * InnoDB Handler构造函数
 */
ha_innodb::ha_innodb(handlerton *hton, TABLE_SHARE *table_arg)
  : handler(hton, table_arg)
{
  DBUG_ENTER("ha_innodb::ha_innodb");

  // 初始化InnoDB特定的字段
  int_autoinc= 0;
  auto_increment_safe= 0;
  auto_increment_mode= AUTO_INCREMENT_OFF;
  
  // 缓冲池信息
  prebuilt= 0;
  
  DBUG_VOID_RETURN;
}

/**
 * 打开表
 * 
 * @param name 表名
 * @param mode 打开模式
 * @param test_if_locked 是否测试锁定
 * @return 0 表示成功
 */
int ha_innodb::open(const char *name, int mode, uint test_if_locked)
{
  DBUG_ENTER("ha_innodb::open");

  // 将MySQL表名转换为InnoDB内部表名
  char norm_name[FN_REFLEN];
  normalize_table_name(norm_name, name);

  // 在InnoDB数据字典中查找表
  dict_table_t *ib_table= dict_table_open_on_name(
    norm_name, FALSE, FALSE, DICT_ERR_IGNORE_NONE
  );

  if (!ib_table)
  {
    my_error(ER_TABLE_NOT_FOUND, MYF(0), name);
    DBUG_RETURN(1);
  }

  // 创建prebuilt结构
  prebuilt= row_prebuilt_create(ib_table);
  
  // 保存表信息
  table->s->db_record_offset= 0;
  
  DBUG_RETURN(0);
}

/**
 * 读取下一行数据
 * 使用全表扫描方式
 * 
 * @param buf 输出缓冲区
 * @return 0 表示成功, HA_ERR_END_OF_FILE 表示结束
 */
int ha_innodb::rnd_next(uchar *buf)
{
  DBUG_ENTER("ha_innodb::rnd_next");

  // 使用行迭代器读取下一行
  int rc= row_search_no_mvcc(buf, ROW_SEL_NEXT, prebuilt, 0, 0);
  
  if (rc == DB_RECORD_NOT_FOUND)
  {
    my_errno= HA_ERR_END_OF_FILE;
    DBUG_RETURN(HA_ERR_END_OF_FILE);
  }

  if (rc != DB_SUCCESS)
  {
    my_errno= convert_error(rc);
    DBUG_RETURN(my_errno);
  }

  // 更新统计信息
  update_row_stats();

  DBUG_RETURN(0);
}

/**
 * 使用索引读取数据
 * 
 * @param buf 输出缓冲区
 * @param part 索引key
 * @param part_len key长度
 * @return 0 表示成功
 */
int ha_innodb::index_read(uchar *buf, const uchar *key, uint key_len)
{
  DBUG_ENTER("ha_innodb::index_read");

  // 设置索引搜索模式
  prebuilt->search_mode= ROW_SEL_EXACT;

  // 使用索引查找
  int rc= row_search_for_mysql(buf, ROW_SEL_NEXT, prebuilt, 0, key, key_len);
  
  if (rc == DB_RECORD_NOT_FOUND)
  {
    my_errno= HA_ERR_END_OF_FILE;
    DBUG_RETURN(HA_ERR_END_OF_FILE);
  }

  if (rc != DB_SUCCESS)
  {
    my_errno= convert_error(rc);
    DBUG_RETURN(my_errno);
  }

  DBUG_RETURN(0);
}

/**
 * 写入一行数据
 * 
 * @param buf 数据缓冲区
 * @return 0 表示成功
 */
int ha_innodb::write_row(uchar *buf)
{
  DBUG_ENTER("ha_innodb::write_row");

  // 开始事务(如果还未开始)
  trx_t *trx= thd_trx(thd);
  
  if (!trx->in_statement)
  {
    innobase_trx_start(thd, trx);
  }

  // 插入行到InnoDB
  int rc= row_insert_for_mysql(buf, prebuilt);
  
  if (rc != DB_SUCCESS)
  {
    my_errno= convert_error(rc);
    DBUG_RETURN(my_errno);
  }

  // 标记缓冲池页面为脏页
  buf_pool_modify_pages(prebuilt->table);

  DBUG_RETURN(0);
}

/**
 * 更新一行数据
 * 
 * @param old_data 旧数据
 * @param new_data 新数据
 * @return 0 表示成功
 */
int ha_innodb::update_row(const uchar *old_data, uchar *new_data)
{
  DBUG_ENTER("ha_innodb::update_row");

  // 更新行
  int rc= row_update_for_mysql(old_data, new_data, prebuilt);
  
  if (rc != DB_SUCCESS)
  {
    my_errno= convert_error(rc);
    DBUG_RETURN(my_errno);
  }

  DBUG_RETURN(0);
}

/**
 * 删除一行数据
 * 
 * @param buf 数据缓冲区
 * @return 0 表示成功
 */
int ha_innodb::delete_row(const uchar *buf)
{
  DBUG_ENTER("ha_innodb::delete_row");

  // 删除行
  int rc= row_delete_for_mysql(buf, prebuilt);
  
  if (rc != DB_SUCCESS)
  {
    my_errno= convert_error(rc);
    DBUG_RETURN(my_errno);
  }

  DBUG_RETURN(0);
}`
  }
}
