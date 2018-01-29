---
title: MySQL 5.6 Multi-Threaded Slave
author: min_kim
created: 2014/11/05 00:59:00
modified:
layout: post
tags: MySQL
image:
  feature: mysql.png
categories: blog
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL 5.6 Multi-Threaded Slave

### slave-parallel-workers 옵션을 통한 Multi-Threaded Slave
<table>
<tbody><tr><td><span class="bold"><strong>Introduced</strong></span></td><td colspan="3">5.6.3</td></tr><tr><td><span class="bold"><strong>Command-Line Format</strong></span></td><td colspan="3"><code class="literal">--slave-parallel-workers=#</code></td></tr><tr><td rowspan="3"><span class="bold"><strong>System Variable</strong></span></td><td><span class="bold"><strong>Name</strong></span></td><td colspan="2"><code class="literal"><a class="link" href="replication-options-slave.html#sysvar_slave_parallel_workers">slave_parallel_workers</a></code></td></tr><tr><td><span class="bold"><strong>Scope</strong></span></td><td colspan="2">Global</td></tr><tr><td><span class="bold"><strong>Dynamic</strong></span></td><td colspan="2">Yes</td></tr><tr><td rowspan="4"><span class="bold"><strong>Permitted Values</strong></span></td><td><span class="bold"><strong>Type</strong></span></td><td colspan="2">integer</td></tr><tr><td><span class="bold"><strong>Default</strong></span></td><td colspan="2"><code class="literal">0</code></td></tr><tr><td><span class="bold"><strong>Minimum</strong></span></td><td colspan="2"><code class="literal">0</code></td></tr><tr><td><span class="bold"><strong>Maximum</strong></span></td><td colspan="2"><code class="literal">1024</code></td></tr></tbody>
</table>
* slave worker thread 개수를 지정하여 replication events(transactions)를 병렬로 처리할수 있다.
* default는 0(parallel execution은 disable) 이며 최대값은 1024개이다.
* 이 옵션이 활성화되면, slave SQL thread는 slave worker threads의 coordinator역할을 하게 된다. transaction은 database별로 분배된다. 각각의 worker thread는 타 데이터베이스와 관련된 트랜잭션을 기다릴 필요없이 주어진 database 에 대해서만 트랜잭션들을 수행하면 된다. (-> 성능향상)
* 현재의 multi-threading은 데이터들이 database별로 분리되었다는 가정하에 구현된 것으로, 한 데이터베이스 내에서 일어나는 변경 순서는 master와 slave가 서로 동일하지만, 서로 다른 데이터베이스에 대한 트랜잭션의 처리 순서는 master와 slave간에 순서가 다를 수 있다. 그러므로 가장 최근 실행된 트랜잭션이 slave에서 실행되었다고 해서 master에서 그 트랜잭션 이전에 실행된 모든 트랜잭션이 slave에 모두 적용되었다고 볼 수 없다. (-> 로깅, 리커버리시 주의 필요)
* 같은 이유로 START SLAVE UNTIL은 multi-threaded slave에서 사용할 수 없다.
multi-threading이 활성화된경우, transaction retry는 multi-threaded slave를 지원하지 않는다. slave_transaction_retries variable(default는 10)은 0으로 간주되고 변경될수 없다. -> MySQL 5.7.5 부터는 지원한다.
* MySQL 5.6.7 이후부터는 서로다른 데이터베이스 테이블 간에 FK가 걸린 경우, parallel이 아닌 sequential로 동작하며 성능에 악영향이 있을 수 있다.
slave-parallel-workers 옵션은 5.6.3에서 추가되었지만 버그가 존재하며, 5.6.4 부터 정상동작한다.


### 간단 테스트
* Dynamic variable이지만, sql thread는 재시작 해주어야 동작합니다.


```sql
@SLAVE worker활성화
mysql> show variables like 'slave_parallel_workers';
+------------------------+-------+
| Variable_name          | Value |
+------------------------+-------+
| slave_parallel_workers | 0     |
+------------------------+-------+
1 row in set (0.01 sec)

mysql> set global slave_parallel_workers=2;
Query OK, 0 rows affected (0.00 sec)

mysql> select * from mysql.slave_worker_info;
Empty set (0.00 sec)

mysql> stop slave sql_thread;
Query OK, 0 rows affected (0.00 sec)

mysql> start slave sql_thread;
Query OK, 0 rows affected, 1 warning (0.02 sec)

mysql> select * from mysql.slave_worker_infoG
*************************** 1. row ***************************
                        Id: 1
            Relay_log_name:
             Relay_log_pos: 0
           Master_log_name:
            Master_log_pos: 0
 Checkpoint_relay_log_name:
  Checkpoint_relay_log_pos: 0
Checkpoint_master_log_name:
 Checkpoint_master_log_pos: 0
          Checkpoint_seqno: 0
     Checkpoint_group_size: 64
   Checkpoint_group_bitmap:
*************************** 2. row ***************************
                        Id: 2
            Relay_log_name:
             Relay_log_pos: 0
           Master_log_name:
            Master_log_pos: 0
 Checkpoint_relay_log_name:
  Checkpoint_relay_log_pos: 0
Checkpoint_master_log_name:
 Checkpoint_master_log_pos: 0
          Checkpoint_seqno: 0
     Checkpoint_group_size: 64
   Checkpoint_group_bitmap:
2 rows in set (0.00 sec)

mysql> show processlist;
+----+-------------+-----------+------+---------+------+-----------------------------------------------------------------------------+------------------+
| Id | User        | Host      | db   | Command | Time | State                                                                       | Info             |
+----+-------------+-----------+------+---------+------+-----------------------------------------------------------------------------+------------------+
|  9 | system user |           | NULL | Connect | 4021 | Waiting for master to send event                                            | NULL             |
| 11 | system user |           | NULL | Connect |   34 | Slave has read all relay log; waiting for the slave I/O thread to update it | NULL             |
| 12 | system user |           | NULL | Connect | 3961 | Waiting for an event from Coordinator                                       | NULL             |
| 13 | system user |           | NULL | Connect |   34 | Waiting for an event from Coordinator                                       | NULL             |
| 15 | root        | localhost | NULL | Query   |    0 | init                                                                        | show processlist |
+----+-------------+-----------+------+---------+------+-----------------------------------------------------------------------------+------------------+
5 rows in set (0.00 sec)

mysql>
```

* 테스트환경 구축 : 두개 데이터베이스, 테이블 생성

```sql
@MASTER create database, table
mysql> CREATE DATABASE db1;
Query OK, 1 row affected (0.00 sec)

mysql> CREATE DATABASE db2;
Query OK, 1 row affected (0.00 sec)

mysql> CREATE TABLE db1.t1 (a INT);
Query OK, 0 rows affected (0.03 sec)

mysql> CREATE TABLE db2.t1 (a INT);
Query OK, 0 rows affected (0.03 sec)
```


* DML 발생
  * 계속 한개의 worker만 동작하는 현상? coordinator가 worker 두개 쓸필요 없다고 판단했나봅니다.

```sql
@MASTER DML
mysql> INSERT INTO db1.t1 VALUES (1), (2); INSERT INTO db2.t1 VALUES (3),(4);
Query OK, 2 rows affected (0.01 sec)
Records: 2  Duplicates: 0  Warnings: 0

Query OK, 2 rows affected (0.01 sec)
Records: 2  Duplicates: 0  Warnings: 0
@SLAVE
mysql> select * from mysql.slave_worker_infoG
*************************** 1. row ***************************
                        Id: 1
            Relay_log_name:
             Relay_log_pos: 0
           Master_log_name:
            Master_log_pos: 0
 Checkpoint_relay_log_name:
  Checkpoint_relay_log_pos: 0
Checkpoint_master_log_name:
 Checkpoint_master_log_pos: 0
          Checkpoint_seqno: 0
     Checkpoint_group_size: 64
   Checkpoint_group_bitmap:
*************************** 2. row ***************************
                        Id: 2
            Relay_log_name: ./mysql56m2-relay-bin.000007
             Relay_log_pos: 1601
           Master_log_name: mysql56m1-bin.000002
            Master_log_pos: 17012
 Checkpoint_relay_log_name: ./mysql56m2-relay-bin.000007
  Checkpoint_relay_log_pos: 1003
Checkpoint_master_log_name: mysql56m1-bin.000002
 Checkpoint_master_log_pos: 16414
          Checkpoint_seqno: 1
     Checkpoint_group_size: 64
   Checkpoint_group_bitmap:
2 rows in set (0.00 sec)
```

*  * 좀만더 Concurrent하게 DML 발생시키면? OK

```sql
@MASTER DML
mysql> INSERT INTO db1.t1 VALUES (1), (2); INSERT INTO db2.t1 VALUES (3),(4); INSERT INTO db1.t1 VALUES (1),(2);INSERT INTO db2.t1 VALUES (3),(4);
Query OK, 2 rows affected (0.00 sec)
Records: 2  Duplicates: 0  Warnings: 0

Query OK, 2 rows affected (0.02 sec)
Records: 2  Duplicates: 0  Warnings: 0

Query OK, 2 rows affected (0.01 sec)
Records: 2  Duplicates: 0  Warnings: 0

Query OK, 2 rows affected (0.01 sec)
Records: 2  Duplicates: 0  Warnings: 0
@SLAVE
mysql> select * from mysql.slave_worker_infoG
*************************** 1. row ***************************
                        Id: 1
            Relay_log_name: ./mysql56m2-relay-bin.000021
             Relay_log_pos: 1244
           Master_log_name: mysql56m1-bin.000002
            Master_log_pos: 59739
 Checkpoint_relay_log_name: ./mysql56m2-relay-bin.000021
  Checkpoint_relay_log_pos: 460
Checkpoint_master_log_name: mysql56m1-bin.000002
 Checkpoint_master_log_pos: 58955
          Checkpoint_seqno: 2
     Checkpoint_group_size: 64
   Checkpoint_group_bitmap:
*************************** 2. row ***************************
                        Id: 2
            Relay_log_name: ./mysql56m2-relay-bin.000021
             Relay_log_pos: 1505
           Master_log_name: mysql56m1-bin.000002
            Master_log_pos: 60000
 Checkpoint_relay_log_name: ./mysql56m2-relay-bin.000021
  Checkpoint_relay_log_pos: 460
Checkpoint_master_log_name: mysql56m1-bin.000002
 Checkpoint_master_log_pos: 58955
          Checkpoint_seqno: 3
     Checkpoint_group_size: 64
   Checkpoint_group_bitmap:
2 rows in set (0.00 sec)
```
