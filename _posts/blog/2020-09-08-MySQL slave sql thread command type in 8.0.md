---
title: MySQL slave sql_thread command type in 8.0
author: min_kim
created: 2020/09/08
modified:
layout: post
tags: mysql, mysql8
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# MySQL slave sql thread command type in 8.0
> 8.0부터 slave sql thread의 command type 표시 내용이 다르다. 뭔가 남몰래 바뀐 느낌.
로깅을 위해서 버전별로 확인해두자.

## Thread Command Values
- https://dev.mysql.com/doc/refman/8.0/en/thread-commands.html
- Connect: A replica is connected to its source.
- Query : The thread is executing a statement.
- sql thread가 connect type에서 query type으로 바뀌었다. relay log다 적용하고 기다리는 상태.

## sql thread command type by version
### 8.0
- Command: Query

```
root@localhost:(none) 17:06:03>show processlist;
+--------+-------------+--------------------+------+-------------+---------+---------------------------------------------------------------+------------------+
| Id     | User        | Host               | db   | Command     | Time    | State                                                         | Info             |
+--------+-------------+--------------------+------+-------------+---------+---------------------------------------------------------------+------------------+
|      9 | system user | connecting host    | NULL | Connect     | 3708210 | Waiting for master to send event                              | NULL             |
|     10 | system user |                    | NULL | Query       |       4 | Slave has read all relay log; waiting for more updates        | NULL             |
...
+--------+-------------+--------------------+------+-------------+---------+---------------------------------------------------------------+------------------+

root@localhost:(none) 17:06:07>select * from sys.session where user='sql/slave_sql'\G
*************************** 1. row ***************************
                thd_id: 50
               conn_id: 10
                  user: sql/slave_sql
                    db: NULL
               command: Query
                 state: Slave has read all relay log; waiting for more updates
                  time: 2
     current_statement: COMMIT
     statement_latency: NULL
              progress: NULL
          lock_latency:   0 ps
         rows_examined: 0
             rows_sent: 0
         rows_affected: 0
            tmp_tables: 0
       tmp_disk_tables: 0
             full_scan: NO
        last_statement: COMMIT
last_statement_latency: 20.34 us
        current_memory: 358.76 KiB
             last_wait: NULL
     last_wait_latency: NULL
                source: NULL
           trx_latency: 252.43 us
             trx_state: COMMITTED
        trx_autocommit: NO
                   pid: NULL
          program_name: NULL
1 row in set (0.07 sec)
```

### 5.7
- Command: Connect

```
root@localhost:(none) 17:38:29>show processlist;
+---------+-------------+---------------------+------+-------------+----------+---------------------------------------------------------------+------------------+
| Id      | User        | Host                | db   | Command     | Time     | State                                                         | Info             |
+---------+-------------+---------------------+------+-------------+----------+---------------------------------------------------------------+------------------+
|       1 | system user |                     | NULL | Connect     | 13050192 | Waiting for master to send event                              | NULL             |
|       2 | system user |                     | NULL | Connect     |        2 | Slave has read all relay log; waiting for more updates        | NULL             |
...
+---------+-------------+---------------------+------+-------------+----------+---------------------------------------------------------------+------------------+

root@localhost:(none) 17:38:31>select * from sys.session where user='sql/slave_sql'\G
*************************** 1. row ***************************
                thd_id: 24
               conn_id: 2
                  user: sql/slave_sql
                    db: marketdata
               command: Connect
                 state: Slave has read all relay log; waiting for more updates
                  time: 1
     current_statement: NULL
     statement_latency: NULL
              progress: NULL
          lock_latency: 0 ps
         rows_examined: 0
             rows_sent: 0
         rows_affected: 0
            tmp_tables: 0
       tmp_disk_tables: 0
             full_scan: NO
        last_statement: COMMIT
last_statement_latency: 10.20 us
        current_memory: 0 bytes
             last_wait: NULL
     last_wait_latency: NULL
                source: NULL
           trx_latency: NULL
             trx_state: NULL
        trx_autocommit: NULL
                   pid: NULL
          program_name: NULL
1 row in set (0.07 sec)
```

### 5.6
- Command: Connect

```
root@localhost:(none) 17:43:00>show processlist;
+----------+-------------+----------------------+------+-------------+----------+-----------------------------------------------------------------------------+------------------+
| Id       | User        | Host                 | db   | Command     | Time     | State                                                                       | Info             |
+----------+-------------+----------------------+------+-------------+----------+-----------------------------------------------------------------------------+------------------+
|    47706 | system user |                      | NULL | Connect     | 38544103 | Waiting for master to send event                                            | NULL             |
|    47707 | system user |                      | NULL | Connect     |        2 | Slave has read all relay log; waiting for the slave I/O thread to update it | NULL             |
...
+----------+-------------+----------------------+------+-------------+----------+-----------------------------------------------------------------------------+------------------+

```

### 5.5
- Command: Connect

```
root@localhost:(none) 17:52:47>show processlist;
+---------+-------------+----------------------+------+-------------+----------+-----------------------------------------------------------------------------+------------------+
| Id      | User        | Host                 | db   | Command     | Time     | State                                                                       | Info             |
+---------+-------------+----------------------+------+-------------+----------+-----------------------------------------------------------------------------+------------------+
|  115123 | system user |                      | NULL | Connect     | 16960606 | Waiting for master to send event                                            | NULL             |
|  115124 | system user |                      | NULL | Connect     |        1 | Slave has read all relay log; waiting for the slave I/O thread to update it | NULL             |
...
+---------+-------------+----------------------+------+-------------+----------+-----------------------------------------------------------------------------+------------------++
```

### 5.1

```
root@localhost:(none) 17:53:21>show processlist;
+----------+-------------+--------------------+-------+-------------+----------+-----------------------------------------------------------------------+------------------+
| Id       | User        | Host               | db    | Command     | Time     | State                                                                 | Info             |
+----------+-------------+--------------------+-------+-------------+----------+-----------------------------------------------------------------------+------------------+
| 30041321 | system user |                    | NULL  | Connect     |  3116655 | Waiting for master to send event                                      | NULL             |
| 30041322 | system user |                    | NULL  | Connect     |        2 | Has read all relay log; waiting for the slave I/O thread to update it | NULL             |
...
+----------+-------------+--------------------+-------+-------------+----------+-----------------------------------------------------------------------+------------------+
```

## Conclusion
* 5.1부터 쭉 Connect type이었는데. 갑자기 8.0에서 바뀜..-.- 흥

