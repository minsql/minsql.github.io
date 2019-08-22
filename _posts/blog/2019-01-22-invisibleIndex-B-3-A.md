---
title: MySQL 8.0 - Invisible Index
author: min_cho
created: 2019/01/14
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

```txt
* MySQL 8.0부터는 Invisible Index 라는 기능이 새롭게 추가되었다. ORACLE 사용자라면 해당 기능이 익숙하겠지만 MySQL 에서는 8.0이 되어서야 비로소 추가되었다.

* 해당 기능을 통해 아래와 같은 효과를 낼 수 있다.
   - Index를 생성테스트시, 생성전, 후를 쉽게 비교해 볼 수 있다.
   - Index를 생성하고 뜻하지 않게 다른 쿼리가 영향을 받는경우 추가된 Index를 dorp 하지 않고 단순히 Invisible 시킬 수 있다.
```



------

## 사용예제

- 아래의 예제는 dummy data를 만들고, index가 걸려있지 않는 column으로 select 한 뒤 invisible index 혹은 visible 만들어 MySQL이 어떻게 동작하는지 확인하는 예제이다.



```sql
mysql 8.0 [localhost] {msandbox} (test) > create table tbl_alter (a int primary key auto_increment, b int, c int, d varchar(40));
Query OK, 0 rows affected (0.04 sec)

mysql 8.0 [localhost] {msandbox} (test) > insert into tbl_alter (b,c,d)  select round(rand()*10)+1, round(rand()*1000)+1, uuid() from information_schema.columns A1, information_schema.columns B2 limit 1000000;
Query OK, 1000000 rows affected (32.68 sec)
Records: 1000000  Duplicates: 0  Warnings: 0

mysql 8.0 [localhost] {msandbox} (test) > select d from tbl_alter order by d desc limit 10;
+--------------------------------------+
| d                                    |
+--------------------------------------+
| 56c11a4e-13cc-11e9-b724-c271ec4ec1de |
| 56c119f4-13cc-11e9-b724-c271ec4ec1de |
| 56c119a4-13cc-11e9-b724-c271ec4ec1de |
| 56c1194a-13cc-11e9-b724-c271ec4ec1de |
| 56c11878-13cc-11e9-b724-c271ec4ec1de |
| 56c11828-13cc-11e9-b724-c271ec4ec1de |
| 56c117e2-13cc-11e9-b724-c271ec4ec1de |
| 56c11792-13cc-11e9-b724-c271ec4ec1de |
| 56c11742-13cc-11e9-b724-c271ec4ec1de |
| 56c116e8-13cc-11e9-b724-c271ec4ec1de |
+--------------------------------------+
10 rows in set (0.43 sec)

mysql 8.0 [localhost] {msandbox} (test) > explain select d from tbl_alter order by d desc limit 10;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | tbl_alter | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 995826 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)

--^^ 현재 사용랑 수 있는 INDEX가 없음으로, 전체 테이블을 full scan하여 file sort가 진행된 후 10건을 결과로 전달한다.


mysql 8.0 [localhost] {msandbox} (test) > ALTER TABLE tbl_alter ADD INDEX d_idx (d) INVISIBLE;
Query OK, 0 rows affected (2.09 sec)
Records: 0  Duplicates: 0  Warnings: 0

--^^ Index를 INVISIBLE로 만든다.


mysql 8.0 [localhost] {msandbox} (test) > explain select d from tbl_alter order by d desc limit 10;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | tbl_alter | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 995826 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)

--^^ Index 를 만들었음에도 불구하고 여전히 실행계획이 변하지 않는다.


mysql 8.0 [localhost] {msandbox} (test) > select d from tbl_alter order by d desc limit 10;
+--------------------------------------+
| d                                    |
+--------------------------------------+
| 56c11a4e-13cc-11e9-b724-c271ec4ec1de |
| 56c119f4-13cc-11e9-b724-c271ec4ec1de |
| 56c119a4-13cc-11e9-b724-c271ec4ec1de |
| 56c1194a-13cc-11e9-b724-c271ec4ec1de |
| 56c11878-13cc-11e9-b724-c271ec4ec1de |
| 56c11828-13cc-11e9-b724-c271ec4ec1de |
| 56c117e2-13cc-11e9-b724-c271ec4ec1de |
| 56c11792-13cc-11e9-b724-c271ec4ec1de |
| 56c11742-13cc-11e9-b724-c271ec4ec1de |
| 56c116e8-13cc-11e9-b724-c271ec4ec1de |
+--------------------------------------+
10 rows in set (0.42 sec)

--^^ 여전히 시간이 오래 걸린다.


mysql 8.0 [localhost] {msandbox} (test) > show create table tbl_alter\G
*************************** 1. row ***************************
       Table: tbl_alter
Create Table: CREATE TABLE `tbl_alter` (
  `a` int(11) NOT NULL AUTO_INCREMENT,
  `b` int(11) DEFAULT NULL,
  `c` int(11) DEFAULT NULL,
  `d` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`a`),
  KEY `d_idx` (`d`) /*!80000 INVISIBLE */
) ENGINE=InnoDB AUTO_INCREMENT=1048561 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
1 row in set (0.00 sec)

--^^ 테이블 생성구문을 확인하면, "KEY `d_idx` (`d`) /*!80000 INVISIBLE */" 로 현재 해당 index가 invisible임을 보여준다.


mysql 8.0 [localhost] {msandbox} (test) > SELECT INDEX_NAME, IS_VISIBLE FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'test' AND TABLE_NAME = 'tbl_alter';
+------------+------------+
| INDEX_NAME | IS_VISIBLE |
+------------+------------+
| d_idx      | NO         |
| PRIMARY    | YES        |
+------------+------------+
2 rows in set (0.00 sec)

--^^ INFORMATION_SCHEMA.STATISTICS 의 테이블을 조회해도 해당 결과를 얻을 수 있다.


---- 해당 index를 VISIBLE 로 수정하자. 수정은 아주 빠르게 일어난다.

mysql 8.0 [localhost] {msandbox} (test) > ALTER TABLE tbl_alter ALTER INDEX d_idx VISIBLE;
Query OK, 0 rows affected (0.05 sec)
Records: 0  Duplicates: 0  Warnings: 0

mysql 8.0 [localhost] {msandbox} (test) > show create table tbl_alter\G
*************************** 1. row ***************************
       Table: tbl_alter
Create Table: CREATE TABLE `tbl_alter` (
  `a` int(11) NOT NULL AUTO_INCREMENT,
  `b` int(11) DEFAULT NULL,
  `c` int(11) DEFAULT NULL,
  `d` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`a`),
  KEY `d_idx` (`d`)
) ENGINE=InnoDB AUTO_INCREMENT=1048561 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
1 row in set (0.00 sec)

--^^ INDEX가 show create 구문에서도 정상적으로 나타난다.


mysql 8.0 [localhost] {msandbox} (test) > explain select d from tbl_alter order by d desc limit 10;
+----+-------------+-----------+------------+-------+---------------+-------+---------+------+------+----------+----------------------------------+
| id | select_type | table     | partitions | type  | possible_keys | key   | key_len | ref  | rows | filtered | Extra                            |
+----+-------------+-----------+------------+-------+---------------+-------+---------+------+------+----------+----------------------------------+
|  1 | SIMPLE      | tbl_alter | NULL       | index | NULL          | d_idx | 163     | NULL |   10 |   100.00 | Backward index scan; Using index |
+----+-------------+-----------+------------+-------+---------------+-------+---------+------+------+----------+----------------------------------+
1 row in set, 1 warning (0.00 sec)

--^^ 정상적인 실행계획이 나타난다.


mysql 8.0 [localhost] {msandbox} (test) > select d from tbl_alter order by d desc limit 10;
+--------------------------------------+
| d                                    |
+--------------------------------------+
| 56c11a4e-13cc-11e9-b724-c271ec4ec1de |
| 56c119f4-13cc-11e9-b724-c271ec4ec1de |
| 56c119a4-13cc-11e9-b724-c271ec4ec1de |
| 56c1194a-13cc-11e9-b724-c271ec4ec1de |
| 56c11878-13cc-11e9-b724-c271ec4ec1de |
| 56c11828-13cc-11e9-b724-c271ec4ec1de |
| 56c117e2-13cc-11e9-b724-c271ec4ec1de |
| 56c11792-13cc-11e9-b724-c271ec4ec1de |
| 56c11742-13cc-11e9-b724-c271ec4ec1de |
| 56c116e8-13cc-11e9-b724-c271ec4ec1de |
+--------------------------------------+
10 rows in set (0.00 sec)

--^^ 결과도 빠르게 나타난다.


mysql 8.0 [localhost] {msandbox} (test) > ALTER TABLE tbl_alter ALTER INDEX d_idx INVISIBLE;
Query OK, 0 rows affected (0.02 sec)
Records: 0  Duplicates: 0  Warnings: 0

mysql 8.0 [localhost] {msandbox} (test) > explain select d from tbl_alter order by d desc limit 10;
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
| id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra          |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
|  1 | SIMPLE      | tbl_alter | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 995826 |   100.00 | Using filesort |
+----+-------------+-----------+------------+------+---------------+------+---------+------+--------+----------+----------------+
1 row in set, 1 warning (0.00 sec)

--^^  ALTER INDEX d_idx INVISIBLE 구문을 통해 다시 해당 INDEX를 INVISIBLE로 변경할 수 있다.
```



------

## 적용범위

- INDEX 를 생성하고 난 후, 성능측정 및 실행계획 확인을 위해 주로 사용하던 ignore , use index, force index 구문대신 invisible , visible 기능을 사용한다면, 좀 더 정확한 실행계획과 성능측정이 가능하다.
- INDEX 를 적용하고 난 후, 만약 의도치 않게 다른 쿼리에 영향을 준다면, 해당 쿼리를 바로 Invisible 로 변경하여 Index 생성전의 환경으로 돌아갈 수 있다.
