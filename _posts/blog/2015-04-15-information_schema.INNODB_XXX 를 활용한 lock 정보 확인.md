---
title: information_schema.INNODB_XXX 를 활용한 lock 정보 확인
author: min_cho
created: 2015/04/15 20:31:36
modified:
layout: post
tags: mysql mysql_tips
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# information_schema.INNODB_XXX 를 활용한 lock 정보 확인

### 해당 table에 대한 이해

  * lock을 건 session에서 insert작업 후 어떤 작업도 하지 않는다면, processlist에 sleep 상태로 나타날것이다. 이와 같다면, 왜 lock이 걸렸는지 찾는것은 쉽지가 않다.
  * 해당 테이블들은 MySQL 5.5 부터 (InnoDB plugin 1.1) 부터 사용할 수 있다.
    * 아래와 같이 lock이 걸렸다고 가정하자.
    * abc 테이블은 첫번째 컬럼에 대하여 primary key가 걸려있다.
    * 1003 session에서 transaction을 시작하고 abc 테이블에 한건을 집어 넣는다.
    * 994 session에서 같은값의 row를 집어 넣는다.
    * 세번째 session에서 processlist 를 통해 상태를 확인한다.

```sql
========= Session A ==========
    mysql> select connection_id();
    +-----------------+
    | connection_id() |
    +-----------------+
    |            1003 |
    +-----------------+
    mysql> begin;
    Query OK, 0 rows affected (0.00 sec)
    mysql> insert into abc values (12345691,'a',now());
    Query OK, 1 row affected, 1 warning (0.00 sec)


========= Session B ==========
    mysql> select connection_id();
    +-----------------+
    | connection_id() |
    +-----------------+
    |             994 |
    +-----------------+
    1 row in set (0.00 sec)
    mysql> insert into abc values (12345691,'a',now());
    -- lock 이 풀릴때까지 대기


========= Session C ==========
mysql> show processlist;
+------+-----------------+--------------------+------+---------+------+-----------------------------+---------------------------------------------+
| Id   | User            | Host               | db   | Command | Time | State                       | Info                                        |
+------+-----------------+--------------------+------+---------+------+-----------------------------+---------------------------------------------+
|   22 | event_scheduler | localhost          | NULL | Daemon  |   24 | Waiting for next activation | NULL                                        |
|  992 | root            | localhost          | NULL | Query   |    0 | NULL                        | show processlist                            |
|  994 | root            | localhost          | ch   | Query   |    3 | update                      | insert into abc values (12345691,'a',now()) |
|  999 | agent           | 192.168.74.1:50025 | NULL | Sleep   |    5 |                             | NULL                                        |
| 1000 | agent           | 192.168.74.1:50027 | NULL | Sleep   |    5 |                             | NULL                                        |
| 1003 | root            | localhost          | ch   | Sleep   |  724 |                             | NULL                                        |
+------+-----------------+--------------------+------+---------+------+-----------------------------+---------------------------------------------+
6 rows in set (0.00 sec)
```

  * INNODB_LOCK_WAITS 은 현재 wait 으로 대기하고 있는 session에 대해 나타낸다.

```sql
mysql> select * from information_schema.INNODB_LOCK_WAITS;
+-------------------+-------------------+-----------------+------------------+
| requesting_trx_id | requested_lock_id | blocking_trx_id | blocking_lock_id |
+-------------------+-------------------+-----------------+------------------+
| 97E               | 97E:0:480:310     | 96B             | 96B:0:480:310    |
+-------------------+-------------------+-----------------+------------------+
1 row in set (0.00 sec)
-- transaction_id 를 통해 해당 session이 block 되고 있는지 보여준다.
-- 97E 를 가진 transaction_id 가 block 당했다.
-- 96B 를 가진 transaction_id 가 block 시켰다.
-- 97E:0:480:310 는 lock_trx_id:lock_space:lock_page:lock_rec 이다. INNODB_LOCKS 에 나타난다.
-- 해당 transaction_id 에 대해 알아보자
```

  * INNODB_LOCKS 은 현재 lock 정보를 보여준다.

```sql
mysql> select * FROM information_schema.INNODB_LOCKS;
+---------------+-------------+-----------+-----------+------------+------------+------------+-----------+----------+-----------+
| lock_id       | lock_trx_id | lock_mode | lock_type | lock_table | lock_index | lock_space | lock_page | lock_rec | lock_data |
+---------------+-------------+-----------+-----------+------------+------------+------------+-----------+----------+-----------+
| 97E:0:480:310 | 97E         | S         | RECORD    | `ch`.`abc` | `PRIMARY`  |          0 |       480 |      310 | 12345691  |
| 96B:0:480:310 | 96B         | X         | RECORD    | `ch`.`abc` | `PRIMARY`  |          0 |       480 |      310 | 12345691  |
+---------------+-------------+-----------+-----------+------------+------------+------------+-----------+----------+-----------+
2 rows in set (0.00 sec)
-- 97E 를 가진 transaction_id 가 lock_mode S (해당 값을 읽기 위함)를 `ch`.`abc` 테이블의 `PRIMARY` 에 걸었다.  lock_page는 480번이며, lock_rec 는 310번이다. lock_data는 insert 하려는 pk 값이다.
-- 96B 를 가진 transaction_id 가 lock_mode X (해당 값을 수정하기 위함)를 `ch`.`abc` 테이블의 `PRIMARY` 에 걸었다. lock_page는 480번이며, lock_rec 는 310번이다. lock_data는 insert 한 pk 값이다.
```

  * INNODB_TRX 은 해당 lock을 걸고 있는 transaction이 어떤 상태인가를 보여준다.

```sql
mysql> select * FROM information_schema.INNODB_TRX;
+--------+-----------+---------------------+-----------------------+---------------------+------------+---------------------+---------------------------------------------+---------------------+-------------------+-------------------+------------------+-----------------------+-----------------+-------------------+-------------------------+---------------------+-------------------+------------------------+----------------------------+---------------------------+---------------------------+
| trx_id | trx_state | trx_started         | trx_requested_lock_id | trx_wait_started    | trx_weight | trx_mysql_thread_id | trx_query                                   | trx_operation_state | trx_tables_in_use | trx_tables_locked | trx_lock_structs | trx_lock_memory_bytes | trx_rows_locked | trx_rows_modified | trx_concurrency_tickets | trx_isolation_level | trx_unique_checks | trx_foreign_key_checks | trx_last_foreign_key_error | trx_adaptive_hash_latched | trx_adaptive_hash_timeout |
+--------+-----------+---------------------+-----------------------+---------------------+------------+---------------------+---------------------------------------------+---------------------+-------------------+-------------------+------------------+-----------------------+-----------------+-------------------+-------------------------+---------------------+-------------------+------------------------+----------------------------+---------------------------+---------------------------+
| 97E    | LOCK WAIT | 2015-03-22 23:52:18 | 97E:0:480:310         | 2015-03-22 23:52:18 |          2 |                 994 | insert into abc values (12345691,'a',now()) | inserting           |                 1 |                 1 |                2 |                   376 |               1 |                 0 |                       0 | READ COMMITTED      |                 1 |                      1 | NULL                       |                         0 |                     10000 |
| 96B    | RUNNING   | 2015-03-22 23:40:05 | NULL                  | NULL                |          4 |                1003 | NULL                                        | NULL                |                 0 |                 0 |                3 |                  1248 |               3 |                 1 |                       0 | READ COMMITTED      |                 1 |                      1 | NULL                       |                         0 |                     10000 |
+--------+-----------+---------------------+-----------------------+---------------------+------------+---------------------+---------------------------------------------+---------------------+-------------------+-------------------+------------------+-----------------------+-----------------+-------------------+-------------------------+---------------------+-------------------+------------------------+----------------------------+---------------------------+---------------------------+
2 rows in set (0.01 sec)
-- 97E 를 가진 transaction_id 가 현재 lock을 기다리고 있으며, 해당 thread_id 는 994 이다. 이 외에도 다양한 정보를 보여준다.
-- 96B 를 가진 transaction_id 가 현재 실행중이며, 2015-03-22 23:40:05 에 시작되었고 해당 thread_id는 1003 이다
```

### lock 관련 정보 한번에 보기.
해당 lock 정보를 한번에 볼 수 있는 쿼리는 다음과 같다.

```
mysql> SELECT straight_join
 w.trx_mysql_thread_id waiting_thread,
     w.trx_id waiting_trx_id,
     w.trx_query waiting_query,
     b.trx_mysql_thread_id blocking_thread,
     b.trx_id blocking_trx_id,
     b.trx_query blocking_query,
     bl.lock_id blocking_lock_id,
     bl.lock_mode blocking_lock_mode,
     bl.lock_type blocking_lock_type,
     bl.lock_table blocking_lock_table,
     bl.lock_index blocking_lock_index,
     wl.lock_id waiting_lock_id,
     wl.lock_mode waiting_lock_mode,
     wl.lock_type waiting_lock_type,
     wl.lock_table waiting_lock_table,
     wl.lock_index waiting_lock_index
 FROM
     information_schema.INNODB_LOCK_WAITS ilw ,
     information_schema.INNODB_TRX b ,
     information_schema.INNODB_TRX w ,
     information_schema.INNODB_LOCKS bl ,
     information_schema.INNODB_LOCKS wl
 WHERE
 b.trx_id = ilw.blocking_trx_id
     AND w.trx_id = ilw.requesting_trx_id
     AND bl.lock_id = ilw.blocking_lock_id
     AND wl.lock_id = ilw.requested_lock_idG
*************************** 1. row ***************************
     waiting_thread: 994
     waiting_trx_id: 97E
      waiting_query: insert into abc values (12345691,'a',now())
    blocking_thread: 1003
    blocking_trx_id: 96B
     blocking_query: NULL
   blocking_lock_id: 96B:0:480:310
 blocking_lock_mode: X
 blocking_lock_type: RECORD
blocking_lock_table: `ch`.`abc`
blocking_lock_index: `PRIMARY`
    waiting_lock_id: 97E:0:480:310
  waiting_lock_mode: S
  waiting_lock_type: RECORD
 waiting_lock_table: `ch`.`abc`
 waiting_lock_index: `PRIMARY`
1 row in set (0.11 sec)

-- 어떤 transaction에 의해 해당 쿼리가 block 되었는지 알 수 있다. (blocking_thread 를 통해 processlist 에서 해당 session을 kill 시킬 수도 있다.)
```

물론 show engine innodb status 를 통해서도 확인할 수 있다.
undo log entries 를 통해 유추해서 볼 수는 있지만, 정확한 원인을 찾기 위해서는 위의 테이블을 조회하는것이 좋다.

```sql
mysql> show engine innodb statusG

---TRANSACTION 9B2, ACTIVE 16 sec inserting
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 376, 1 row lock(s)
MySQL thread id 994, OS thread handle 0x7fd7a1ba5700, query id 13266 localhost root update  
insert into abc values (12345691,'a',now())  
------- TRX HAS BEEN WAITING 16 SEC FOR THIS LOCK TO BE GRANTED:  
RECORD LOCKS space id 0 page no 480 n bits 440 index `PRIMARY` of table `ch`.`abc` trx id 9B2 lock mode S locks rec but not gap waiting
Record lock, heap no 310 PHYSICAL RECORD: n_fields 5; compact format; info bits 0
 0: len 4; hex 80bc615b; asc   a[;;
 1: len 6; hex 00000000096b; asc      k;;
 2: len 7; hex f3000001a70110; asc        ;;
 3: len 4; hex 80000000; asc     ;;
 4: len 4; hex 40ffc3c1; asc @   ;;

------------------
---TRANSACTION 96B, ACTIVE 3757 sec
3 lock struct(s), heap size 1248, 3 row lock(s), undo log entries 1
MySQL thread id 1003, OS thread handle 0x7fd7a1b64700, query id 12678 localhost root
```
