---
title: MySQL 8.0 - Descending Index
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
* 8.0 에서 Descending Index가 구현되었다 (5.7까지는 INDEX 생성구문에 넣을 수는 있었지만 무시되었음).

* 5.7까지 진행했던 방법은, Ascending Index를 Backward index scan으로 읽어들이는 방법을 사용하여 Descending Index의 흉내를 낼 수 있지만, 그에따른 부작용이 발생되었다.
    - ORDER BY 구문에 사용되는 컬럼의 ORDER 순서가 DESC과 ASC이 혼재되어 사용되어져야 하는 경우, index를 (col1:DESC , col2:ASC) 처럼 만들겠지만 실제로는 (col1:ASC , col2:ASC) 로 만들어져 col1의 Backward index scan 만이 가능했다.
    - Backward index scan 이 Forward Index scan 만큼 성능이 좋지 못했다. 이는 처음 구성된 InnoDB 아키텍쳐의 한계 (Page lock order, Page 내의 single linked list를 가진 데이터) 이다.

```



------

## 사용예제

- 아래 예제는 5000건의 dummy data를 만들고 compositeOrder_idx (c desc, b asc) 라는 Index를 만들어 실행계획을 확인하는 예제이다.

### 5.7

    ```sql
    mysql 5.7 [localhost] {msandbox} (test) > create table tbl_alter (a int primary key auto_increment, b int, c int, d varchar(40));
    Query OK, 0 rows affected (0.03 sec)

    mysql 5.7 [localhost] {msandbox} (test) > insert into tbl_alter (b,c,d)  select round(rand()*10)+1, round(rand()*1000)+1, uuid()
     from information_schema.columns A1, information_schema.columns B2 limit 5000;
    Query OK, 5000 rows affected (0.22 sec)
    Records: 5000  Duplicates: 0  Warnings: 0

    mysql 5.7 [localhost] {msandbox} (test) > explain select c,b from tbl_alter order by c desc, b asc limit 10;
    +----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+----------------+
    | id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra          |
    +----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+----------------+
    |  1 | SIMPLE      | tbl_alter | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 4999 |   100.00 | Using filesort |
    +----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+----------------+
    1 row in set, 1 warning (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > alter table tbl_alter add index compositeOrder_idx (c desc, b asc);
    Query OK, 0 rows affected (0.03 sec)
    Records: 0  Duplicates: 0  Warnings: 0

    mysql 5.7 [localhost] {msandbox} (test) > explain  select c,b from tbl_alter order by c desc, b asc limit 10;
    +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
    | id | select_type | table     | partitions | type  | possible_keys | key                | key_len | ref  | rows | filtered | Extra                       |
    +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
    |  1 | SIMPLE      | tbl_alter | NULL       | index | NULL          | compositeOrder_idx | 10      | NULL | 4999 |   100.00 | Using index; Using filesort |
    +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+-----------------------------+
    1 row in set, 1 warning (0.00 sec)
    ```

### 8.0

  ```sql
  mysql 8.0 [localhost] {msandbox} (test) > create table tbl_alter (a int primary key auto_increment, b int, c int, d varchar(40));
  Query OK, 0 rows affected (0.07 sec)

  mysql 8.0 [localhost] {msandbox} (test) > insert into tbl_alter (b,c,d)  select round(rand()*10)+1, round(rand()*1000)+1, uuid() from information_schema.columns A1, information_schema.columns B2 limit 5000;
  Query OK, 5000 rows affected (0.10 sec)
  Records: 5000  Duplicates: 0  Warnings: 0

  mysql 8.0 [localhost] {msandbox} (test) > explain select c,b from tbl_alter order by c desc, b asc limit 10;
  +----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+----------------+
  | id | select_type | table     | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra          |
  +----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+----------------+
  |  1 | SIMPLE      | tbl_alter | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 5000 |   100.00 | Using filesort |
  +----+-------------+-----------+------------+------+---------------+------+---------+------+------+----------+----------------+
  1 row in set, 1 warning (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > alter table tbl_alter add index compositeOrder_idx (c desc, b asc);
  Query OK, 0 rows affected (0.02 sec)
  Records: 0  Duplicates: 0  Warnings: 0

  mysql 8.0 [localhost] {msandbox} (test) > explain  select c,b from tbl_alter order by c desc, b asc limit 10;
  +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
  | id | select_type | table     | partitions | type  | possible_keys | key                | key_len | ref  | rows | filtered | Extra       |
  +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
  |  1 | SIMPLE      | tbl_alter | NULL       | index | NULL          | compositeOrder_idx | 10      | NULL |   10 |   100.00 | Using index |
  +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+-------------+
  1 row in set, 1 warning (0.01 sec)

  --^^ 5.7 과 다르게 file sort가 일어나지 않는것이 확인된다.



  mysql 8.0 [localhost] {msandbox} (test) > explain  select c,b from tbl_alter order by c asc limit 10;
  +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+----------------------------------+
  | id | select_type | table     | partitions | type  | possible_keys | key                | key_len | ref  | rows | filtered | Extra                            |
  +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+----------------------------------+
  |  1 | SIMPLE      | tbl_alter | NULL       | index | NULL          | compositeOrder_idx | 10      | NULL |   10 |   100.00 | Backward index scan; Using index |
  +----+-------------+-----------+------------+-------+---------------+--------------------+---------+------+------+----------+----------------------------------+
  1 row in set, 1 warning (0.00 sec)

  --^^ Backward index scan 이 진행된다면, 실행계획의 결과로서 "Backward index scan" 문구를 보여준다.
  ```



------

## 성능테스트

- 아래 예제는 데이터 100000 건을 Ascending Index와 함께 만들고 "order by d [asc|desc] limit 99999,1" 을 통해 [Forward | Backward] Index scan의 성능테스트를 진행한 예제이다.

  ```sql
  mysql 8.0 [localhost] {msandbox} (test) > create table tbl_alter (a int primary key auto_increment, d varchar(40), key d_idx(d));
  Query OK, 0 rows affected (0.01 sec)


  mysql 8.0 [localhost] {msandbox} (test) > insert into tbl_alter (d)  select uuid() from information_schema.columns A1, information_schema.columns B2 limit 100000;
  Query OK, 100000 rows affected (5.38 sec)
  Records: 100000  Duplicates: 0  Warnings: 0


  mysql 8.0 [localhost] {msandbox} (test) > DELIMITER $$
  mysql 8.0 [localhost] {msandbox} (test) > DROP FUNCTION IF EXISTS `getValue`$$
  Query OK, 0 rows affected (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > CREATE FUNCTION `getValue`() RETURNS INT(11)
      -> DETERMINISTIC
      -> BEGIN
      ->    DECLARE dummy int default 0;
      ->    select 1 into @dummy;
      ->    RETURN dummy;
      ->    END$$
  Query OK, 0 rows affected (0.01 sec)

  mysql 8.0 [localhost] {msandbox} (test) > DROP FUNCTION IF EXISTS `getValueASC`$$
  Query OK, 0 rows affected (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > CREATE FUNCTION `getValueASC`() RETURNS INT(11)
      -> DETERMINISTIC
      -> BEGIN
      ->    DECLARE dummy int default 0;
      ->    select 1 into @dummy from tbl_alter order by d asc limit 99999,1;
      ->    RETURN dummy;
      ->    END$$
  Query OK, 0 rows affected (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) >
  mysql 8.0 [localhost] {msandbox} (test) > DROP FUNCTION IF EXISTS `getValueDESC`$$
  Query OK, 0 rows affected (0.00 sec)

  mysql 8.0 [localhost] {msandbox} (test) > CREATE FUNCTION `getValueDESC`() RETURNS INT(11)
      -> DETERMINISTIC
      -> BEGIN
      ->    DECLARE dummy int default 0;
      ->    select 1 into @dummy from tbl_alter order by d desc limit 99999,1;
      ->    RETURN dummy;
      ->    END$$
  Query OK, 0 rows affected (0.00 sec)


  mysql 8.0 [localhost] {msandbox} (test) > DELIMITER ;
  mysql 8.0 [localhost] {msandbox} (test) > SELECT BENCHMARK(1000,getValue());
  +----------------------------+
  | BENCHMARK(1000,getValue()) |
  +----------------------------+
  |                          0 |
  +----------------------------+
  1 row in set (0.01 sec)

  mysql 8.0 [localhost] {msandbox} (test) > SELECT BENCHMARK(1000,getValueASC());
  +-------------------------------+
  | BENCHMARK(1000,getValueASC()) |
  +-------------------------------+
  |                             0 |
  +-------------------------------+
  1 row in set (17.84 sec)

  mysql 8.0 [localhost] {msandbox} (test) > SELECT BENCHMARK(1000,getValueDESC());
  +--------------------------------+
  | BENCHMARK(1000,getValueDESC()) |
  +--------------------------------+
  |                              0 |
  +--------------------------------+
  1 row in set (21.56 sec)



  --^^ 십만건의 Forward Index Scan 과 십만건의 Backword Index Scan 의 성능을 비교한 결과 20%가량 Forward Index Scan 이 빠른 결과를 보였다. (21.56/17.84 = 1.20)
  ```



------

## 적용범위

- 위의 예제처럼 ORDER BY 구문에 사용되는 컬럼의 ORDER 순서가 DESC과 ASC이 혼재되어 있는 경우.

- ORDER BY col DESC 구문이 주로 실행되어질때,  Descending Index를 생성을 통해  Forward Index Scan 을 진행하여 성능을 더 끌어올리려는 경우.
