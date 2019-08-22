---
title: MySQL 8.0 - Function Based Index (Functional Key Parts)
author: min_cho
created: 2019/01/19
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
* MySQL 8.0.13 부터 Function Based Index (Function을 적용한 Column에 대한 값을 인덱싱)를 지원하게 되었다.

* Function Based Index의 경우, 매우 필요한 기능이었지만 그동안 구현이 되지 않은 관계로 아래와 같이 진행되었다.
    - 5.6 이하 버젼에서는 컬럼을 추가하고 인덱싱을 건 후, trigger를 이용하여 추가된 컬럼에 데이터를 넣는 방식
    - 5.7 버젼에서는 Virtual Column을 만들고 해당 컬럼에 Index를 거는 방식
```



------

## 사용예제

- 아래 예제는 저장된 id를 대소문자를 가리지 않고, 검색하는 경우이다. (물론 collation 을 Case Insensitive로 조절하는 방법도 있음에 유의하자)

```sql
-- 데이터를 로딩한다.


 MySQL  localhost:8013 ssl  test  SQL > create table fbi(col1 varchar(100)) CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
Query OK, 0 rows affected (0.0398 sec)

 MySQL  localhost:8013 ssl  test  SQL > insert into fbi values ('min.cho'),('chan.chan'),('tim.s'),('test.user');
Query OK, 4 rows affected (0.0776 sec)

Records: 4  Duplicates: 0  Warnings: 0




-- 저장된값과 입력된값을 비교한다.


 MySQL  localhost:8013 ssl  test  SQL > select * from fbi where col1='Min.CHO';
Empty set (0.0003 sec)


--^^ Case Insensitive임으로 대소문자를 가리게 되고 'min.cho' <> 'Min.CHO' 임으로 결과는 나오지 않게 된다.



 MySQL  localhost:8013 ssl  test  SQL > select * from fbi where upper(col1)=upper('Min.CHO');
+---------+
| col1    |
+---------+
| min.cho |
+---------+
1 row in set (0.0004 sec)

--^^ 위의 비교를 위해서는 저장된값과 입력된값 모두 upper 혹은 lower function 을 적용하여 비교해야 한다.


 MySQL  localhost:8013 ssl  test  SQL > explain select * from fbi where upper(col1)=upper('Min.CHO');
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | fbi   | NULL       | ALL  | NULL          | NULL | NULL    | NULL |    4 |      100 | Using where |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
1 row in set (0.0004 sec)

--^^ 전체 table full scan 이 일어난다.




-- Function Based Index 생성


 MySQL  localhost:8013 ssl  test  SQL > alter table fbi add key idx_upperId ((upper(col1)));
Query OK, 0 rows affected (0.1089 sec)

Records: 0  Duplicates: 0  Warnings: 0

 MySQL  localhost:8013 ssl  test  SQL > explain select * from fbi where upper(col1)=upper('Min.CHO');
+----+-------------+-------+------------+------+---------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-------+------------+------+---------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | fbi   | NULL       | ref  | idx_upperId   | idx_upperId | 403     | const |    1 |      100 | NULL  |
+----+-------------+-------+------------+------+---------------+-------------+---------+-------+------+----------+-------+
1 row in set (0.0005 sec)


--^^ 처음의 실행계획과 다르게 Index scan 하는것이 확인된다.
```



------

## 적용범위

- 8.0이전까지는 여러 귀찮은 방법을 써서 구현하거나 쿼리자체를 적절히 변경하여 사용하였지만, 더 이상 그럴 필요가 없어졌다.



------

## 주의사항

- Function Based Index 를 생성시에는 괄호로 따로 묶어주어야 한다. 기본적으로 사용되는 () 와 functional key parts를 의미하는 ()가 추가되어 마치 괄호를 2개 사용하는것처럼 보인다.

  ```sql
  MySQL  localhost:8013 ssl  test  SQL > create table t1 (col1 varchar(10));
  Query OK, 0 rows affected (0.0205 sec)

   MySQL  localhost:8013 ssl  test  SQL > alter table t1 add key idx_upperId (upper(col1));
  ERROR: 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'col1))' at line 1

   MySQL  localhost:8013 ssl  test  SQL > alter table t1 add key idx_upperId ((upper(col1)));
  Query OK, 0 rows affected (0.0078 sec)

  Records: 0  Duplicates: 0  Warnings: 0
  ```
