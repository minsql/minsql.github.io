---
title: MySQL 8.0 - SKIP LOCKED, NOWAIT
author: min_cho
created: 2019/08/21
modified:
layout: post
tags: mysql mysql8
image:
  feature: mysql.png
categories: MySQL8
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

## 개요

- MySQL 8.0에서는 쿼리를 효율적으로 실행시키기 위해 2가지의 옵션을 추가하여 실행시킬 수 있게되었다. 해당 옵션은 SKIP LOCKED 와 NOWAIT 이며, 다음과 같은 특징을 갖는다.

  > 해당 옵션은 ORACLE에서 이미 오래전에 구현되어 있던 부분이기도 하다.

  - SKIP LOCKED : 쿼리를 실행하며, lock 이 걸린 부분이 있다면, SKIP 하고 다음 row를 읽어들인다.
  - NOWAIT : 쿼리를 실행하며, lock이 걸린 부분이 있다면, 기다리지 않고 (기존에는 설정된 innodb_lock_wait_timeout 만큼 기다리고 초과되면 실패) 실패를 시킨다.



## 예제

- 아래와 같은 작업을 통해 신분증 확인 작업이 여러명에 의해 진행 된다고 가정하자.

  1. 한명의 작업자는 3개의 신분증을 가져온다.

  2. 하나씩 확인을 하고 업데이트를 한다.

  3. 3개가 완료되면 다른 신분증을 가져온다.

------

- 위를 구현하기 위해서는 간단히 아래와 같은 로직이 필요하다.

```sql
begin;
select * from ocr where progress='PREPARE' order by seq limit 3 for update;
update ocr set progress='DONE' where seq=1;
update ocr set progress='DONE' where seq=2;
update ocr set progress='DONE' where seq=3;
commit;
```

- 하지만 위의 로직을 가지고 여러명의 작업자가 동시에 작업을 진행한다면, 다음 작업자가 함께 처리하는것이 아닌 앞선 작업자가 업무를 끝낼때까지 기다려야 한다.

- 물론 작업진행중이라는 의미를 갖는 컬럼을 별도로 추가하여, select 시에 해당 진행컬럼에 filter를 추가하여 select for update 후에, 선택된 row에 대해 컬럼값을 변경하며 병렬적으로 처리할 수 있지만, 이것은 여러 추가적업이 필요하다.

```sql
begin;
select * from ocr where progress='PREPARE' and ongoing='N' order by seq limit 3 for update;
update ocr set ongoing='Y'where id in (1,2,3);
commit;
begin;
update ocr set progress='DONE' where seq=1;
update ocr set progress='DONE' where seq=2;
update ocr set progress='DONE' where seq=3;
commit;
```

이와 같은 불편함을 없애기 위해 MySQL 8.0에서 SKIP LOCKED 와 NOWAIT 를 지원하게 되었다. 아래의 예제를 통해 알아보자

------

#### - Sample 데이터 생성

```sql
-- OCR 테이블을 만들고 1..10 까지의 데이터를 넣는다.


CREATE TABLE ocr (
  seq INT PRIMARY KEY,
  progress ENUM('PREPARE', 'DONE') DEFAULT 'PREPARE'
);


INSERT INTO ocr (seq)
WITH RECURSIVE my_cte AS
(
SELECT 1 AS n
UNION ALL
SELECT 1+n FROM my_cte WHERE n<10
)
SELECT * FROM my_cte;
```



#### - SESSION 1

```sql
mysql 8.0 [localhost] {msandbox} (test) > begin;
Query OK, 0 rows affected (0.00 sec)

mysql 8.0 [localhost] {msandbox} (test) > select * from ocr where progress='PREPARE' order by seq limit 3 for update ;
+-----+----------+
| seq | progress |
+-----+----------+
|   1 | PREPARE  |
|   2 | PREPARE  |
|   3 | PREPARE  |
+-----+----------+
3 rows in set (0.01 sec)

mysql 8.0 [localhost] {msandbox} (test) > update ocr set progress='DONE' where seq=1;
Query OK, 1 row affected (0.00 sec)
Rows matched: 1  Changed: 1  Warnings: 0
```



#### - SESSION 2

- for update

- ```sql
  mysql 8.0 [localhost] {msandbox} (test) > select @@global.innodb_lock_wait_timeout;
  +-----------------------------------+
  | @@global.innodb_lock_wait_timeout |
  +-----------------------------------+
  |                                50 |
  +-----------------------------------+
  1 row in set (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > begin;
  Query OK, 0 rows affected (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > select now(6); select * from ocr where progress='PREPARE' order by seq limit 3 for update; select now(6);
  +----------------------------+
  | now(6)                     |
  +----------------------------+
  | 2019-01-29 17:27:48.045575 |
  +----------------------------+
  1 row in set (0.00 sec)

  ERROR 1205 (HY000): Lock wait timeout exceeded; try restarting transaction
  +----------------------------+
  | now(6)                     |
  +----------------------------+
  | 2019-01-29 17:28:39.920852 |
  +----------------------------+
  1 row in set (0.00 sec)


  --- innodb_lock_wait_timeout 로 설정된 lock 대기시간까지 기다린 후 실패하게된다.
  ```

- skip locked

- ```sql
  mysql 8.0 [localhost] {msandbox} (test) > begin;
  Query OK, 0 rows affected (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > select now(6); select * from ocr where progress='PREPARE' order by seq limit 3 for update  skip locked; select now(6);
  +----------------------------+
  | now(6)                     |
  +----------------------------+
  | 2019-01-29 17:29:25.915637 |
  +----------------------------+
  1 row in set (0.00 sec)

  +-----+----------+
  | seq | progress |
  +-----+----------+
  |   4 | PREPARE  |
  |   5 | PREPARE  |
  |   6 | PREPARE  |
  +-----+----------+
  3 rows in set (0.00 sec)

  +----------------------------+
  | now(6)                     |
  +----------------------------+
  | 2019-01-29 17:29:25.916010 |
  +----------------------------+
  1 row in set (0.00 sec)


  --- skip locked를 사용하면, lock이 걸린 row에 대해서 skip 하고 읽어가며 결과를 도출한다.
  ```

- nowait

- ```sql
  mysql 8.0 [localhost] {msandbox} (test) > begin;
  Query OK, 0 rows affected (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > select now(6); select * from ocr where progress='PREPARE' order by seq limit 3 for update nowait; select now(6);
  +----------------------------+
  | now(6)                     |
  +----------------------------+
  | 2019-01-29 17:29:34.440880 |
  +----------------------------+
  1 row in set (0.00 sec)

  ERROR 3572 (HY000): Statement aborted because lock(s) could not be acquired immediately and NOWAIT is set.
  +----------------------------+
  | now(6)                     |
  +----------------------------+
  | 2019-01-29 17:29:34.441329 |
  +----------------------------+
  1 row in set (0.00 sec)
  --- innodb_lock_wait_timeout 로 설정된 lock 대기시간과 관계없이 에러가 바로 발생한다.
  ```



## 적용범위

- 위의 예제처럼, 개발시 동시성에 대한 제어를 충분히 고려하지 않고 개발에 집중할 수 있다.
- innodb_lock_wait_timeout 로 설정된 lock 대기시간을 이용하지 않고 Application 에서 sleep 후 주기적으로 실행하는것이 deadlock을 피할 수 있는 요소가 될 수 있다.
