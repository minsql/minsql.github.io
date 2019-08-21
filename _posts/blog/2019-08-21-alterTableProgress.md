---
title: Alter table시 소요시간 예측해보기
author: min_cho
created: 2019/08/21
modified:
layout: post
tags: mysql mysql8
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

## 개요
```txt
* Alter table 명령어를 실행하고 나면, 현재 진행상황이 어느정도인지 궁금할때가 있다.
 일반적으로 파일사이즈나 show engine innodb status를 통해 가늠해볼 수는 있지만, 정확한 값은 아니며 때로는 여러단계에서 같은 작업을 진행함으로 현재 작업을 얼마나 더 해야 하는지 예상하기 쉽지 않다.
 MySQL 5.7부터는 Performance_schema 를 이용하여, Alter 명령어에 대해 모니터링을 할 수 있다.
```

```sql
UPDATE performance_schema.setup_instruments SET ENABLED = 'YES' WHERE NAME LIKE 'stage/innodb/alter%';

--^^ alter 작업을 위한 setup_instruments 를 Enable 시킨다.


 UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME LIKE 'events_stages%';

--^^ events_stages_%의 setup_consumers 를 Enable시켜 해당 각각의 alter stage를 모니터링 한다.


-- Alter 작업을 진행한다.


 SELECT EVENT_NAME, WORK_COMPLETED, WORK_ESTIMATED FROM performance_schema.events_stages_current;

--^^ 다른 세션에서 해당 테이블을 조회하여, 현재의 alter 상태를 확인한다.

```


## 예제
```sql
mysql 5.7 [localhost] {msandbox} (test) > SELECT * FROM performance_schema.setup_instruments WHERE NAME LIKE 'stage/innodb/alter%';
+------------------------------------------------------+---------+-------+
| NAME                                                 | ENABLED | TIMED |
+------------------------------------------------------+---------+-------+
| stage/innodb/alter table (end)                       | YES     | YES   |
| stage/innodb/alter table (flush)                     | YES     | YES   |
| stage/innodb/alter table (insert)                    | YES     | YES   |
| stage/innodb/alter table (log apply index)           | YES     | YES   |
| stage/innodb/alter table (log apply table)           | YES     | YES   |
| stage/innodb/alter table (merge sort)                | YES     | YES   |
| stage/innodb/alter table (read PK and internal sort) | YES     | YES   |
+------------------------------------------------------+---------+-------+
7 rows in set (0.01 sec)


mysql 5.7 [localhost] {msandbox} (test) > SELECT * FROM performance_schema.setup_consumers WHERE NAME LIKE 'events_stages%';
+----------------------------+---------+
| NAME                       | ENABLED |
+----------------------------+---------+
| events_stages_current      | NO      |
| events_stages_history      | NO      |
| events_stages_history_long | NO      |
+----------------------------+---------+
3 rows in set (0.00 sec)



-- Sample Data 생성
mysql 5.7 [localhost] {msandbox} (test) > create table alter_test_tbl (a int primary key auto_increment, b varchar(100),c varchar(100));
Query OK, 0 rows affected (0.03 sec)

mysql 5.7 [localhost] {msandbox} (test) > insert into alter_test_tbl select null, uuid(), uuid() from information_schema.columns a, information_schema.columns b, information_schema.columns c, information_schema.columns d limit 10000000;
Query OK, 10000000 rows affected (35.11 sec)
Records: 10000000  Duplicates: 0  Warnings: 0


-- performance_schema.setup_instruments , performance_schema.setup_consumers update 작업
mysql 5.7 [localhost] {msandbox} (test) > UPDATE performance_schema.setup_instruments SET ENABLED = 'YES' WHERE NAME LIKE 'stage/innodb/alter%';
Query OK, 0 rows affected (0.00 sec)
Rows matched: 7  Changed: 0  Warnings: 0

mysql 5.7 [localhost] {msandbox} (test) >  UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME LIKE 'events_stages%';
Query OK, 3 rows affected (0.00 sec)
Rows matched: 3  Changed: 3  Warnings: 0


-- Table Alter
mysql 5.7 [localhost] {msandbox} (test) > alter table alter_test_tbl add column x int;
Query OK, 0 rows affected (8.43 sec)
Records: 0  Duplicates: 0  Warnings: 0



--- 모니터링
SELECT esc.THREAD_ID
 , esc.SQL_TEXT
 , estc.EVENT_NAME
 , estc.WORK_COMPLETED
 , estc.WORK_ESTIMATED
 , (100 * estc.WORK_COMPLETED / estc.WORK_ESTIMATED) AS 'Progress_%'
FROM performance_schema.events_statements_current esc
,performance_schema.events_stages_current estc
WHERE estc.THREAD_ID = esc.THREAD_ID
 AND estc.NESTING_EVENT_ID = esc.EVENT_ID\G

*************************** 1. row ***************************
     THREAD_ID: 32
      SQL_TEXT: alter table alter_test_tbl add column x int
    EVENT_NAME: stage/innodb/alter table (read PK and internal sort)
WORK_COMPLETED: 53659
WORK_ESTIMATED: 96156
    Progress_%: 55.8041
1 row in set (0.01 sec)

--^^ 위의 select 결과는 alter 중의 데이터를 캡쳐한것이다. alter 작업이 끝나면, performance_schema.events_stages_current 테이블에 결과가 나타나지 않는다. performance_schema.events_stages_history 테이블을 조회해보자.


-- 각 단계에서 소요된 시간을 확인할 수 있다.
SELECT EVENT_ID
 , NESTING_EVENT_ID
 , EVENT_NAME
 , sys.format_time(TIMER_WAIT)
FROM performance_schema.events_stages_history_long
ORDER BY NESTING_EVENT_ID, TIMER_START;

+----------+------------------+------------------------------------------------------+-----------------------------+
| EVENT_ID | NESTING_EVENT_ID | EVENT_NAME                                           | sys.format_time(TIMER_WAIT) |
+----------+------------------+------------------------------------------------------+-----------------------------+
|      116 |              115 | stage/innodb/alter table (read PK and internal sort) | 7.65 s                      |
|      117 |              115 | stage/innodb/alter table (flush)                     | 604.15 ms                   |
|      118 |              115 | stage/innodb/alter table (log apply table)           | 23.00 us                    |
|      119 |              115 | stage/innodb/alter table (end)                       | 12.00 us                    |
|      120 |              115 | stage/innodb/alter table (log apply table)           | 165.27 ms                   |
+----------+------------------+------------------------------------------------------+-----------------------------+
5 rows in set (0.00 sec)


-- 추가 Alter 작업
mysql 5.7 [localhost] {msandbox} (test) > alter table alter_test_tbl add index b_idx(b);
Query OK, 0 rows affected (16.29 sec)
Records: 0  Duplicates: 0  Warnings: 0

mysql 5.7 [localhost] {msandbox} (test) > alter table alter_test_tbl add column y int;
Query OK, 0 rows affected (23.66 sec)
Records: 0  Duplicates: 0  Warnings: 0


-- 결과 확인
SELECT pseshl.EVENT_ID
 , pseshl.NESTING_EVENT_ID
 , esh.SQL_TEXT
 , pseshl.EVENT_NAME
 , sys.format_time(pseshl.TIMER_WAIT)
FROM performance_schema.events_stages_history_long pseshl
, performance_schema.events_statements_history esh
WHERE pseshl.NESTING_EVENT_ID = esh.EVENT_ID
ORDER BY pseshl.NESTING_EVENT_ID, pseshl.TIMER_START;

+----------+------------------+-----------------------------------------------+------------------------------------------------------+------------------------------------+
| EVENT_ID | NESTING_EVENT_ID | SQL_TEXT                                      | EVENT_NAME                                           | sys.format_time(pseshl.TIMER_WAIT) |
+----------+------------------+-----------------------------------------------+------------------------------------------------------+------------------------------------+
|      116 |              115 | alter table alter_test_tbl add column x int   | stage/innodb/alter table (read PK and internal sort) | 7.65 s                             |
|      117 |              115 | alter table alter_test_tbl add column x int   | stage/innodb/alter table (flush)                     | 604.15 ms                          |
|      118 |              115 | alter table alter_test_tbl add column x int   | stage/innodb/alter table (log apply table)           | 23.00 us                           |
|      119 |              115 | alter table alter_test_tbl add column x int   | stage/innodb/alter table (end)                       | 12.00 us                           |
|      120 |              115 | alter table alter_test_tbl add column x int   | stage/innodb/alter table (log apply table)           | 165.27 ms                          |
|      122 |              121 | alter table alter_test_tbl add index b_idx(b) | stage/innodb/alter table (read PK and internal sort) | 4.85 s                             |
|      123 |              121 | alter table alter_test_tbl add index b_idx(b) | stage/innodb/alter table (merge sort)                | 7.44 s                             |
|      124 |              121 | alter table alter_test_tbl add index b_idx(b) | stage/innodb/alter table (insert)                    | 3.10 s                             |
|      125 |              121 | alter table alter_test_tbl add index b_idx(b) | stage/innodb/alter table (flush)                     | 847.11 ms                          |
|      126 |              121 | alter table alter_test_tbl add index b_idx(b) | stage/innodb/alter table (log apply index)           | 31.64 ms                           |
|      127 |              121 | alter table alter_test_tbl add index b_idx(b) | stage/innodb/alter table (flush)                     | 21.00 us                           |
|      128 |              121 | alter table alter_test_tbl add index b_idx(b) | stage/innodb/alter table (end)                       | 5.78 ms                            |
|      130 |              129 | alter table alter_test_tbl add column y int   | stage/innodb/alter table (read PK and internal sort) | 10.85 s                            |
|      131 |              129 | alter table alter_test_tbl add column y int   | stage/innodb/alter table (merge sort)                | 8.24 s                             |
|      132 |              129 | alter table alter_test_tbl add column y int   | stage/innodb/alter table (insert)                    | 3.55 s                             |
|      133 |              129 | alter table alter_test_tbl add column y int   | stage/innodb/alter table (flush)                     | 760.70 ms                          |
|      134 |              129 | alter table alter_test_tbl add column y int   | stage/innodb/alter table (log apply table)           | 23.00 us                           |
|      135 |              129 | alter table alter_test_tbl add column y int   | stage/innodb/alter table (end)                       | 13.00 us                           |
|      136 |              129 | alter table alter_test_tbl add column y int   | stage/innodb/alter table (log apply table)           | 242.71 ms                          |
+----------+------------------+-----------------------------------------------+------------------------------------------------------+------------------------------------+
19 rows in set (0.01 sec)

--^^ NESTING_EVENT_ID 가 115, 129의 구문이 거의 같다고 할지라도, 실행되는 시간의 경우 현저한 차이를 보여준다. 이유는 b의 index가 추가됨에 따라 index를 위한 merge sort 작업이 추가로 필요하기 때문이다.
---- 이를 이용하면, alter 작업시 stage 혹은 test 서버에서 각각 어떤 단계의 작업이 일어나고 소요되는 시간을 확인한 후 전체적인 소요시간을 예측해볼 수 있다.

```
