---
title: MySQL 8.0 - ALTER TABLE ALGORITHM=INSTANT 옵션
author: min_cho
created: 2019/01/17
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

------

## 개요
```
* 컬럼을 추가하는 작업은 업무시 자주 발생되는 요청이지만, MySQL 5.7까지에 대해서는 여러상황을 고려 (Disk Size, 서버의 load 등) 해야 하는 큰 작업이었다. [해당 작업](https://dev.mysql.com/doc/refman/5.7/en/innodb-online-ddl-operations.html#online-ddl-column-operations)이 ONLINE DDL로서 algorithm=inplace 로 비록 이루어지긴 했지만, 전체 테이블에 대해 Rebuild 작업을 진행하여, 상당한 시간과 resource가 필요했다.

* 8.0.12 부터는 meta data만을 변경(ALGORITHM=INSTANT) 하여 column을 추가할 수 있게 되었다. INSTANT 로 가능한 작업은 다음과 같다.

  - 컬럼 추가

    __주의할점으로는 테이블이가지고 있는 컬럼들의 제일 마지막에 넣는경우 (default) meta data 만을 수정하며 빠른시간에 완료되지만, alter 구문 중 before, after등을 사용하여 중간에 들어와야하는 경우 이전방법(ALGORITHM=INPLACE) 으로 진행됨을 유의해야 한다.__

  - Virtual 컬럼의 추가 및 삭제

  - 컬럼의 default 값 추가 및 삭제

  - Index type의 변경

  - ENUM과 SET의 항목추가 (5.7에서는 INSTANT 구문없이 진행되었지만, 변경가능)

  - Table 및 column rename (5.7에서는 INSTANT 구문없이 진행되었지만, 변경가능)

```


------

## 사용예제

```sql
-- 샘플 DATA 생성
mysql [localhost] {msandbox} (test) > create table tbl_alter (a int primary key auto_increment, b int, c varchar(40));
Query OK, 0 rows affected (0.06 sec)

mysql [localhost] {msandbox} (test) > insert into tbl_alter (b,c)  select round(rand()*10)+1 , uuid() from information_schema.columns A1, information_schema.columns B2 limit 100000;
Query OK, 100000 rows affected (5.73 sec)
Records: 100000  Duplicates: 0  Warnings: 0

--^^ Sample Data 100000건을 넣는다.

mysql [localhost] {msandbox} (test) > alter table tbl_alter add column x int;
Query OK, 0 rows affected (0.01 sec)
Records: 0  Duplicates: 0  Warnings: 0

--^^ 컬럼 추가의 경우, 순식간에 진행된다.

mysql [localhost] {msandbox} (test) > alter table tbl_alter add column y int after a;
Query OK, 0 rows affected (0.33 sec)
Records: 0  Duplicates: 0  Warnings: 0

--^^ 컬럼 추가시, after 혹은 before를 통해 중간에 column을 추가하려는 경우, 예전방식으로 동작된다. 시간이 0.33초로 늘어난것을 확인하자.

mysql [localhost] {msandbox} (test) > alter table tbl_alter add column z int after a, ALGORITHM=INSTANT;
ERROR 1845 (0A000): ALGORITHM=INSTANT is not supported for this operation. Try ALGORITHM=COPY/INPLACE.

--^^ 컬럼 추가시, after 혹은 before를 통해 중간에 column을 추가하면서 META DATA만 변경하는 INSTANT algorithm을 사용한다면, 에러가 발생한다.


mysql [localhost] {msandbox} (test) > alter table tbl_alter add column z int after a, ALGORITHM=INPLACE, LOCK=NONE;
Query OK, 0 rows affected (0.36 sec)
Records: 0  Duplicates: 0  Warnings: 0

--^^ ALGORITHM=INPLACE 방식으로는 정상적으로 추가됨을 확인한다.

mysql [localhost] {msandbox} (test) > ALTER TABLE tbl_alter ALTER COLUMN c SET DEFAULT 'defaultValue', ALGORITHM=INSTANT;
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0

mysql [localhost] {msandbox} (test) > ALTER TABLE tbl_alter ALTER COLUMN c DROP DEFAULT, ALGORITHM=INSTANT;
Query OK, 0 rows affected (0.03 sec)
Records: 0  Duplicates: 0  Warnings: 0

--^^ default 값을 추가하거나 삭제하는 작업은 ALGORITHM=INSTANT 로 metadata만을 수정하여 작업가능하다.



mysql 8.0 [localhost] {msandbox} (test) > ALTER TABLE tbl_alter RENAME COLUMN x to x2;
Query OK, 0 rows affected (0.05 sec)
Records: 0  Duplicates: 0  Warnings: 0

--^^ column 이름을 변경하는것도 빠른시간내에 meta만 변경하는 작업으로 진행된다.



mysql 8.0 [localhost] {msandbox} (test) > show create table tbl_alter\G
*************************** 1. row ***************************
       Table: tbl_alter
Create Table: CREATE TABLE `tbl_alter` (
  `a` int(11) NOT NULL AUTO_INCREMENT,
  `z` int(11) DEFAULT NULL,
  `y` int(11) DEFAULT NULL,
  `b` int(11) DEFAULT NULL,
  `c` varchar(40),
  `x2` int(11) DEFAULT NULL,
  PRIMARY KEY (`a`)
) ENGINE=InnoDB AUTO_INCREMENT=131071 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
1 row in set (0.00 sec)
```
