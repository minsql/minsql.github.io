---
title: Meta Data Lock 에 의한 Deadlock 발생 예제
author: min_cho
created: 2020/06/28
modified:
layout: post
tags: mysql mysql_lock
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

## 개요
* 개발팀에서 **_Deadlock found when trying to get lock; try restarting transaction_** 메세지를 Application에서 받았다고 했지만, **show engine innodb status** 의 정보나 information_schema.INNODB_METRICS 테이블에 관련된 내용이 전혀 없었음.

* 해당 Message가 InnoDB 에서 발생시킨것이 아닐 수 있다는 의심을 하게 되었고, 공교롭게 해당 메세지를 받은 시간이 partition 작업이 이루어졌다는 점에서 Meta Data lock이 해당 메세지를 발생시킬 수 있다는 의구심을 갖게 됨.

* 재현결과 다음과 같은 상황에서 문제의 메세지가 나타날 수 있음을 확인

> session1> begin; select .. from some_tbl;

>> session2> alter table some_tbl add partition...

> session1> insert into some_tbl...;


-----------


## 재현스크립트
```sql

-- partition table 생성

 mysql [localhost] {msandbox} (test) > CREATE TABLE `deadlock_t` (
    ->   `id` int(11) NOT NULL,
    ->   `hired` date NOT NULL DEFAULT '1970-01-01'
    -> ) ENGINE=InnoDB
    -> /*!50500 PARTITION BY RANGE  COLUMNS(hired)
    -> (PARTITION p0 VALUES LESS THAN ('1970-01-01') ENGINE = InnoDB,
    ->  PARTITION p1 VALUES LESS THAN ('2010-01-01') ENGINE = InnoDB ENGINE = InnoDB) */;
Query OK, 0 rows affected (0.03 sec)



-- session 1
mysql [localhost] {msandbox} (test) > begin;
Query OK, 0 rows affected (0.00 sec)

mysql [localhost] {msandbox} (test) > select 1 from deadlock_t;
Empty set (0.00 sec)


          -- session 3 (metadatalock 정보확인용)
          mysql [localhost] {msandbox} (performance_Schema) > SELECT OBJECT_TYPE, OBJECT_SCHEMA, OBJECT_NAME, LOCK_TYPE, LOCK_STATUS, THREAD_ID, PROCESSLIST_ID, PROCESSLIST_INFO FROM performance_schema.metadata_locks INNER JOIN performance_schema.threads ON           THREAD_ID = OWNER_THREAD_ID WHERE PROCESSLIST_ID <> CONNECTION_ID();
          +-------------+---------------+-------------+-------------+-------------+-----------+----------------+------------------+
          | OBJECT_TYPE | OBJECT_SCHEMA | OBJECT_NAME | LOCK_TYPE   | LOCK_STATUS | THREAD_ID | PROCESSLIST_ID | PROCESSLIST_INFO |
          +-------------+---------------+-------------+-------------+-------------+-----------+----------------+------------------+
          | TABLE       | test          | deadlock_t  | SHARED_READ | GRANTED     |        34 |              8 | NULL             |
          +-------------+---------------+-------------+-------------+-------------+-----------+----------------+------------------+
          1 row in set (0.00 sec)

          ^^^^^ begin; select로 인해 해당 테이블 다른세션에서 변경작업 할 수 없도록 SHARED_READ lock 획득


     -- session 2
     mysql [localhost] {msandbox} (test) > ALTER TABLE deadlock_t ADD PARTITION (PARTITION p2 VALUES LESS THAN ('2011-01-01'));
     ^^^^^ ALTER TABLE 구문 대기


          -- session 3 (metadatalock 정보확인용)
          mysql [localhost] {msandbox} (performance_Schema) > SELECT OBJECT_TYPE, OBJECT_SCHEMA, OBJECT_NAME, LOCK_TYPE, LOCK_STATUS, THREAD_ID, PROCESSLIST_ID, PROCESSLIST_INFO FROM performance_schema.metadata_locks INNER JOIN performance_schema.threads ON           THREAD_ID = OWNER_THREAD_ID WHERE PROCESSLIST_ID <> CONNECTION_ID();
          +-------------+---------------+-------------+---------------------+-------------+-----------+----------------+-------------------------------------------------------------------------------------+
          | OBJECT_TYPE | OBJECT_SCHEMA | OBJECT_NAME | LOCK_TYPE           | LOCK_STATUS | THREAD_ID | PROCESSLIST_ID | PROCESSLIST_INFO                                                                    |
          +-------------+---------------+-------------+---------------------+-------------+-----------+----------------+-------------------------------------------------------------------------------------+
          | TABLE       | test          | deadlock_t  | SHARED_READ         | GRANTED     |        34 |              8 | NULL                                                                                |
          | GLOBAL      | NULL          | NULL        | INTENTION_EXCLUSIVE | GRANTED     |        38 |             12 | ALTER TABLE deadlock_t ADD PARTITION (PARTITION p2 VALUES LESS THAN ('2011-01-01')) |
          | SCHEMA      | test          | NULL        | INTENTION_EXCLUSIVE | GRANTED     |        38 |             12 | ALTER TABLE deadlock_t ADD PARTITION (PARTITION p2 VALUES LESS THAN ('2011-01-01')) |
          | TABLE       | test          | deadlock_t  | SHARED_UPGRADABLE   | GRANTED     |        38 |             12 | ALTER TABLE deadlock_t ADD PARTITION (PARTITION p2 VALUES LESS THAN ('2011-01-01')) |
          | TABLE       | test          | deadlock_t  | EXCLUSIVE           | PENDING     |        38 |             12 | ALTER TABLE deadlock_t ADD PARTITION (PARTITION p2 VALUES LESS THAN ('2011-01-01')) |
          +-------------+---------------+-------------+---------------------+-------------+-----------+----------------+-------------------------------------------------------------------------------------+
          5 rows in set (0.01 sec)

          ^^^^^ ALTER TABLE하기 위해 TABLE EXCLUSIVE LOCK 대기


-- session  1
mysql [localhost] {msandbox} (test) > insert into deadlock_t values (1,'2009-01-01');
ERROR 1213 (40001): Deadlock found when trying to get lock; try restarting transaction

^^^^^ ROW를 update하기위해 TABLE EXCLUSIVE LOCK을 요청하는 과정에서 Session 3과 deadlock 발생. 누구든지 먼저 양보해야함. 그렇지 않으면 교착상태 발생. 해당 trx 가 희생됨.


   -- session 2
   mysql [localhost] {msandbox} (test) > ALTER TABLE deadlock_t ADD PARTITION (PARTITION p2 VALUES LESS THAN ('2011-01-01'));
   Query OK, 0 rows affected (40.59 sec)
   Records: 0  Duplicates: 0  Warnings: 0

   ^^^^^^ Session 1번이 Deadlock의 희생양이 되는 순간 바로 ALTER 작업완료
```

-----
## 결론
* 일반적으로 jpa를 통한 프로그램시 insert과정에서 불필요하게 **insert하려는 값을 select 해보고 insert** 하는 경우가 많다. 하지만, 해당 select과정은 MySQL의 자원을 불필요하게 사용하는것과 더불어 위와 같은 lock문제를 일으킬 수 있다. 가능하다면, Insert를 먼저 진행하고 이미 존재하는값으로 인한 constraint에 걸렸을시 DB exception을 잡아 처리하는것이 좋아보인다.
