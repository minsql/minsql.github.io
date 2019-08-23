---
title: MySQL 8.0 - Performance_schema data_locks Table
author: min_cho
created: 2019/01/19
modified:
layout: post
tags: mysql mysql8 performance_schema
image:
  feature: mysql.png
categories: MySQL8
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


------
## 개요

- 기존 5.7 까지 information_schema database 에 존재하던 INNODB_LOCK_WAITS, INNODB_LOCKS 테이블이 performance_schema로 이관되면서 두가지 장점을 제공해 주었다.

  - performance_schema.data_locks 을 통한 더욱 자세한 lock 정보

  - Waiting 하지 않는 상태에서도 현재의 lock 정보를 표시

    - 해당 정보를 얻기 위해서는 gdb를 이용하여, 해당 thread가 가지는 lock정보를 확인해야 했다.
    - 5.7에서 INFORMATION_SCHEMA.INNODB_LOCKS 의 경우, Waiting 하는 session이 발생했을때만 나타나지만 8.0의 performance_schema.data_locks 의 경우 현재 lock을 걸고 있는 모든 세션에 대해 lock상태를 보여준다. 이는 아주 중요한 정보로서, 현재의 session 들이 잡고 있는 lock들을 확인할 수 있다.

  - 5.7

    ```sql
    mysql 5.7 [localhost] {msandbox} (test) > create table lock_t (id int primary key, name varchar(10));
    Query OK, 0 rows affected (0.04 sec)

    mysql 5.7 [localhost] {msandbox} (test) > insert into lock_t values (1,'Min'),(2,'Chan'),(3,'Tim');
    Query OK, 3 rows affected (0.01 sec)
    Records: 3  Duplicates: 0  Warnings: 0

    mysql 5.7 [localhost] {msandbox} (test) > begin;
    Query OK, 0 rows affected (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > select * from lock_t where id=2 for update;
    +----+------+
    | id | name |
    +----+------+
    |  2 | Chan |
    +----+------+
    1 row in set (0.01 sec)

    mysql 5.7 [localhost] {msandbox} (test) > select * from information_schema.INNODB_LOCKS;
    Empty set, 1 warning (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > select * from information_schema.INNODB_LOCK_WAITS;
    Empty set, 1 warning (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > show warnings;
    +---------+------+-----------------------------------------------------------------------------------------------+
    | Level   | Code | Message                                                                                       |
    +---------+------+-----------------------------------------------------------------------------------------------+
    | Warning | 1681 | 'INFORMATION_SCHEMA.INNODB_LOCK_WAITS' is deprecated and will be removed in a future release. |
    +---------+------+-----------------------------------------------------------------------------------------------+
    1 row in set (0.01 sec)
    ```

  - 8.0

    ```sql
    mysql 8.0 [localhost] {msandbox} (test) > create table lock_t (id int primary key, name varchar(10));
    Query OK, 0 rows affected (0.04 sec)

    mysql 8.0 [localhost] {msandbox} (test) > insert into lock_t values (1,'Min'),(2,'Chan'),(3,'Tim');
    Query OK, 3 rows affected (0.08 sec)
    Records: 3  Duplicates: 0  Warnings: 0

    mysql 8.0 [localhost] {msandbox} (test) > begin;
    Query OK, 0 rows affected (0.00 sec)

    mysql 8.0 [localhost] {msandbox} (test) > select * from lock_t where id=2 for update;
    +----+------+
    | id | name |
    +----+------+
    |  2 | Chan |
    +----+------+
    1 row in set (0.00 sec)


    mysql 8.0 [localhost] {msandbox} (test) > select * from performance_schema.data_locks;
    +--------+----------------+-----------------------+-----------+----------+---------------+-------------+----------------+-------------------+------------+-----------------------+-----------+---------------+-------------+-----------+
    | ENGINE | ENGINE_LOCK_ID | ENGINE_TRANSACTION_ID | THREAD_ID | EVENT_ID | OBJECT_SCHEMA | OBJECT_NAME | PARTITION_NAME | SUBPARTITION_NAME | INDEX_NAME | OBJECT_INSTANCE_BEGIN | LOCK_TYPE | LOCK_MODE     | LOCK_STATUS | LOCK_DATA |
    +--------+----------------+-----------------------+-----------+----------+---------------+-------------+----------------+-------------------+------------+-----------------------+-----------+---------------+-------------+-----------+
    | INNODB | 90919:1132     |                 90919 |        50 |       44 | test          | lock_t      | NULL           | NULL              | NULL       |       140613502769240 | TABLE     | IX            | GRANTED     | NULL      |
    | INNODB | 90919:73:4:3   |                 90919 |        50 |       44 | test          | lock_t      | NULL           | NULL              | PRIMARY    |       140613521814040 | RECORD    | X,REC_NOT_GAP | GRANTED     | 2         |
    +--------+----------------+-----------------------+-----------+----------+---------------+-------------+----------------+-------------------+------------+-----------------------+-----------+---------------+-------------+-----------+
    2 rows in set (0.00 sec)
    ```





------

## 사용예제

- session 1

  ```sql
  mysql 8.0 [localhost] {msandbox} (test) > begin;
  Query OK, 0 rows affected (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > select 's1', a from tbl where a=1 for update;
  +----+------+
  | s1 | a    |
  +----+------+
  | s1 |    1 |
  +----+------+
  1 row in set (0.00 sec)
  ```

- 모니터링세션

  ```sql
  SELECT straight_join
     dl.THREAD_ID
    , est.SQL_TEXT
    , dl.OBJECT_SCHEMA
    , dl.OBJECT_NAME
    , dl.INDEX_NAME
    , dl.LOCK_TYPE
    , dl.LOCK_MODE
    , dl.LOCK_STATUS
    , dl.LOCK_DATA
  FROM
    performance_schema.data_locks dl inner join performance_schema.events_statements_current est on dl.THREAD_ID = est.THREAD_ID
  ORDER BY est.TIMER_START,dl.OBJECT_INSTANCE_BEGIN;

  +-----------+----------------------------------------------+---------------+-------------+-----------------+-----------+-----------+-------------+------------------------+
  | THREAD_ID | SQL_TEXT                                     | OBJECT_SCHEMA | OBJECT_NAME | INDEX_NAME      | LOCK_TYPE | LOCK_MODE | LOCK_STATUS | LOCK_DATA              |
  +-----------+----------------------------------------------+---------------+-------------+-----------------+-----------+-----------+-------------+------------------------+
  |        47 | select 's1', a from tbl where a=1 for update | test          | tbl         | NULL            | TABLE     | IX        | GRANTED     | NULL                   |
  |        47 | select 's1', a from tbl where a=1 for update | test          | tbl         | GEN_CLUST_INDEX | RECORD    | X         | GRANTED     | supremum pseudo-record |
  |        47 | select 's1', a from tbl where a=1 for update | test          | tbl         | GEN_CLUST_INDEX | RECORD    | X         | GRANTED     | 0x000000000221         |
  +-----------+----------------------------------------------+---------------+-------------+-----------------+-----------+-----------+-------------+------------------------+
  3 rows in set (0.00 sec)

  ```

- session 2

  ```sql
  mysql 8.0 [localhost] {msandbox} (test) > select 's2',a from tbl where a=1 for update;
  --- 대기상태
  ```

- 모니터링 세션

  ```sql
  SELECT straight_join
     dl.THREAD_ID
    , est.SQL_TEXT
    , dl.OBJECT_SCHEMA
    , dl.OBJECT_NAME
    , dl.INDEX_NAME
    , dl.LOCK_TYPE
    , dl.LOCK_MODE
    , dl.LOCK_STATUS
    , dl.LOCK_DATA
  FROM
    performance_schema.data_locks dl inner join performance_schema.events_statements_current est on dl.THREAD_ID = est.THREAD_ID
  ORDER BY est.TIMER_START,dl.OBJECT_INSTANCE_BEGIN;
  +-----------+----------------------------------------------+---------------+-------------+-----------------+-----------+-----------+-------------+------------------------+
  | THREAD_ID | SQL_TEXT                                     | OBJECT_SCHEMA | OBJECT_NAME | INDEX_NAME      | LOCK_TYPE | LOCK_MODE | LOCK_STATUS | LOCK_DATA              |
  +-----------+----------------------------------------------+---------------+-------------+-----------------+-----------+-----------+-------------+------------------------+
  |        47 | select 's1', a from tbl where a=1 for update | test          | tbl         | NULL            | TABLE     | IX        | GRANTED     | NULL                   |
  |        47 | select 's1', a from tbl where a=1 for update | test          | tbl         | GEN_CLUST_INDEX | RECORD    | X         | GRANTED     | supremum pseudo-record |
  |        47 | select 's1', a from tbl where a=1 for update | test          | tbl         | GEN_CLUST_INDEX | RECORD    | X         | GRANTED     | 0x000000000221         |
  |        48 | select 's2',a from tbl where a=1 for update  | test          | tbl         | NULL            | TABLE     | IX        | GRANTED     | NULL                   |
  |        48 | select 's2',a from tbl where a=1 for update  | test          | tbl         | GEN_CLUST_INDEX | RECORD    | X         | WAITING     | 0x000000000221         |
  +-----------+----------------------------------------------+---------------+-------------+-----------------+-----------+-----------+-------------+------------------------+
  5 rows in set (0.00 sec)

  ```



------

## 적용범위

- 현재 information_schema 의 INNODB_LOCK_WAITS, INNODB_LOCKS 테이블을 사용하는 모든 모니터링을 Performance_Schema 의  data_lock_waits , data_locks 로 수정한다.

- 추가로, Performance_Schema.data_lock_waits 를 주기적으로 모니터링하며, 어떤 쿼리들이 지속적으로 많은 양의 lock을 잡고 있는지 확인해 볼 수 있다.
