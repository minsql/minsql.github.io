---
title: MySQL 8.0 - 추가된 OPTIMIZER HINT
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
- MySQL 8.0은 이전 버젼보다 훨씬 강력하고 편의성이 강한 Optimizer hint를 제공한다. 새롭게 추가된 Hint 중 유용한 Hint는 다음과 같다.
 1. Hint를 통한 테이블 조인 순서 통제.
  > 기존의 join 순서를 제어하던 STRAIGHT_JOIN 구문등은 사용상의 여러 문제를 만들어 냈지만, 8.0 의 Optimizer hint를 통해 해결하게 되었다.
  - SQL 주석을 통한 Hint 제어로, MySQL에 의존적인 구문을 사용하지 않아 이기종간의 호환성을 유지한다.
  - ORMapper 를 이용한 Query 생성시 주석을 통해 Hint를 SET 시켜 쿼리를 통제할 수 있다.
  - 추가적인 Hint 로서, 조금 더 세밀한 조인 오더를 만들 수 있다.
   1. JOIN_FIXED_ORDER : STRAIGHT_JOIN 구문을 대체하며, 이는 조인순서를 강제한다.
   1. JOIN_ORDER : 가능하다면, 나열된 join 순서로 조인할것을 권고한다. (USE INDEX와 비슷하게 아주 불합리할 경우 사용하지 않는다.)
   1. JOIN_PREFIX : 처음의 조인순서를 권고한다.
   1. JOIN_SUFFIX: : 마지막의 조인순서를 권고한다.
 1. Hint를 통한 쿼리 runtime시 session variable 조절
  - 특정 쿼리에 대해서는 설정되어 있는 variable 보다 많은 값이 필요할때가 있다. 이러한 경우 기존에는 아래와 같은 구문을 사용하였지만, 8.0부터는 SET_VAR hint로 query 실행 시점에서 조절할 수 있다.
   ```sql
      SET @saved_val = @@SESSION.var_name;
      SET @@SESSION.var_name = value;
      SELECT ...
      SET @@SESSION.var_name = @saved_val;
   ```
 1. 기존의 5.7 optimzer hint 외에 다음과 같은 hint가 추가되었다.
  - INDEX_MERGE, NO_INDEX_MERGE : 옵티마이져에게 실행계획에 INDEX MERGE 혹은 그 반대의 경우를 권고할 수 있다.
  -  MERGE, NO_MERGE : 옵티마이져에게 실행계획에 테이블의 MERGE 혹은 그 반대의 경우를 권고할 수 있다.



  1. 순서가 필요한 목록
  2. 순서가 필요한 목록
    - 순서가 필요하지 않은 목록(서브)
    - 순서가 필요하지 않은 목록(서브)
  3. 순서가 필요한 목록
    1. 순서가 필요한 목록(서브)
    2. 순서가 필요한 목록(서브)
  4. 순서가 필요한 목록

  - 순서가 필요하지 않은 목록에 사용 가능한 기호
    - 대쉬(hyphen)
    * 별표(asterisks)
    + 더하기(plus sign)

## 예제

#### JOIN ORDER

```sql
-- MySQL에서 제공하는 기본 데이터베이스인 world database를 통한 예제이다.

EXPLAIN SELECT
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';

+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 1 warning (0.00 sec)

--^^ 아무런 Hint가 없는경우, 가장 효울적인 방법으로 실행계획을 조정한다.


EXPLAIN SELECT /*+ JOIN_FIXED_ORDER */
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';

+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 2 warnings (0.00 sec)

--^^ JOIN_FIXED_ORDER Hint를 추가햐였지만, 실행계획이 변경되지 않았다. 2개의 warnings 이 발생된것이 눈에 띈다. (일반적으로 재작성된 쿼리를 보여주기 위해 1개의 warning이 발생한다.)

mysql 8.0 [localhost] {msandbox} (world) > show warnings\G
*************************** 1. row ***************************
  Level: Warning
   Code: 1064
Message: Optimizer hint syntax error near '*/' at line 1
*************************** 2. row ***************************
  Level: Note
   Code: 1003
Message: /* select#1 */ select 'KOR' AS `Code`,'South Korea' ...
2 rows in set (0.00 sec)

--^^ "Optimizer hint syntax error" 가 발생하여, Hint가 적용되지 않았음이 확인된다.




EXPLAIN SELECT /*+ JOIN_FIXED_ORDER () */
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';

+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 1 warning (0.00 sec)

--^^ "()" 를 추가하여, 원하는 실행계획을 만들었다. 조인순서는 STRAIGHT_JOIN과 마찬가지로, 쿼리에서 나열된 테이블의 순서대로 조인순서가 결정된다.




EXPLAIN SELECT STRAIGHT_JOIN
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';

+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 1 warning (0.01 sec)


--^^ STRAIGHT_JOIN 과 결과가 같다.




EXPLAIN SELECT /*+ JOIN_ORDER (country, city, countrylanguage) */
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';

+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 1 warning (0.00 sec)

--^^ JOIN_ORDER 를 통해, 조인 순서를 권고할 수 있다.


EXPLAIN SELECT /*+ JOIN_ORDER (city, country, countrylanguage) */
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';

+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 1 warning (0.00 sec)

--^^ JOIN_ORDER 를 통해, 조인 순서를 권고할 수 있다. (city, country, countrylanguage)로 권고는 되었지만, 비효율적인 순서라고 판단하고 country를 첫번째 driving table로 지정하였다.
--^^ JOIN_ORDER Hint가 없었다면, 해당순서 (country -> countrylanguage -> city)로 적용되겠지만, (country -> countrylanguage -> city) 와 (country -> city -> countrylanguage) 의 cost가 비슷한 경우, Hint를 참고(마지막 table은 countrylanguage)하여 (country -> city -> countrylanguage) 의 조인순서를 결정한다.




EXPLAIN SELECT /*+ JOIN_PREFIX (country, city) */
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';

+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 1 warning (0.00 sec)

--^^ JOIN_PREFIX (처음 조인순서의 테이블을 결정)를 이용해 조인순서를 조절한다.


EXPLAIN SELECT /*+ JOIN_SUFFIX (countrylanguage) */
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 1 warning (0.00 sec)


EXPLAIN SELECT /*+ JOIN_SUFFIX (countrylanguage, city) */
*
FROM
country
   INNER JOIN city on country.Code=city.CountryCode
   INNER JOIN countrylanguage on country.Code = countrylanguage.CountryCode
WHERE country.code = 'KOR';

+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
| id | select_type | table           | partitions | type  | possible_keys       | key         | key_len | ref   | rows | filtered | Extra |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | country         | NULL       | const | PRIMARY             | PRIMARY     | 3       | const |    1 |   100.00 | NULL  |
|  1 | SIMPLE      | countrylanguage | NULL       | ref   | PRIMARY,CountryCode | PRIMARY     | 3       | const |    2 |   100.00 | NULL  |
|  1 | SIMPLE      | city            | NULL       | ref   | CountryCode         | CountryCode | 3       | const |   70 |   100.00 | NULL  |
+----+-------------+-----------------+------------+-------+---------------------+-------------+---------+-------+------+----------+-------+
3 rows in set, 1 warning (0.01 sec)

--^^ JOIN_SUFFIX (마지막 조인순서의 테이블을 결정)를 이용해 조인순서를 조절한다.
```



#### SET VAR

```sql
SELECT /*+ SET_VAR(tmp_table_size = 48M) */ CountryCode, count(*) FROM city GROUP BY CountryCode;

--^^ SET_VAR Hint를 사용하여, 특정 쿼리만 sessin 변수를 runtime시에 변경시킬 수 있다.


SELECT
   sys.format_bytes(@@global.tmp_table_size)
   ,sys.format_bytes(@@session.tmp_table_size);

+-------------------------------------------+--------------------------------------------+
| sys.format_bytes(@@global.tmp_table_size) | sys.format_bytes(@@session.tmp_table_size) |
+-------------------------------------------+--------------------------------------------+
| 16.00 MiB                                 | 16.00 MiB                                  |
+-------------------------------------------+--------------------------------------------+
1 row in set (0.00 sec)

SELECT /*+ SET_VAR(tmp_table_size = 48M) */
   sys.format_bytes(@@global.tmp_table_size)
   ,sys.format_bytes(@@session.tmp_table_size);
+-------------------------------------------+--------------------------------------------+
| sys.format_bytes(@@global.tmp_table_size) | sys.format_bytes(@@session.tmp_table_size) |
+-------------------------------------------+--------------------------------------------+
| 16.00 MiB                                 | 48.00 MiB                                  |
+-------------------------------------------+--------------------------------------------+
1 row in set (0.00 sec)

--^^ 변경된 변수를 확인해보자


SELECT /*+ SET_VAR(tmp_table_size = 48M) SET_VAR(max_heap_table_size=48M) */
   sys.format_bytes(@@global.tmp_table_size)
   ,sys.format_bytes(@@session.tmp_table_size)
   ,sys.format_bytes(@@session.max_heap_table_size);
+-------------------------------------------+--------------------------------------------+-------------------------------------------------+
| sys.format_bytes(@@global.tmp_table_size) | sys.format_bytes(@@session.tmp_table_size) | sys.format_bytes(@@session.max_heap_table_size) |
+-------------------------------------------+--------------------------------------------+-------------------------------------------------+
| 16.00 MiB                                 | 48.00 MiB                                  | 48.00 MiB                                       |
+-------------------------------------------+--------------------------------------------+-------------------------------------------------+
1 row in set (0.00 sec)

--^^ SET_VAR를 여러개 사용해야 하는 경우는 위와 같이 SET_VAR() SET_VAR() 로 연결하여 사용할 수 있다.
```



------

## 적용범위

- 위의 예제와 같이, 더 이상 STRAIGHT_JOIN을 통해 고정된 조인순서를 사용하지 않고 유연한 조인순서를 결정시킬 수 있다.

- SET_VAR 를 통해, session 에서 가능한 여러 변수를 runtime시에 제어할 수 있다. 이는 batch성 쿼리나 TEST용 쿼리등을 사용하는데 여러가지 이점을 줄 수 있다.

  ```sql
  mysql 8.0 [localhost] {msandbox} (world) > alter table countrylanguage add index IX_Language_CountryCode(Language,CountryCode);
  Query OK, 0 rows affected (0.12 sec)
  Records: 0  Duplicates: 0  Warnings: 0

  mysql 8.0 [localhost] {msandbox} (world) > explain select * from countrylanguage where Language = 'Korean' and CountryCode like '%K%' order by IsOfficial;
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+---------------------------------------+
  | id | select_type | table           | partitions | type | possible_keys           | key                     | key_len | ref   | rows | filtered | Extra                                 |
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+---------------------------------------+
  |  1 | SIMPLE      | countrylanguage | NULL       | ref  | IX_Language_CountryCode | IX_Language_CountryCode | 30      | const |    6 |    11.11 | Using index condition; Using filesort |
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+---------------------------------------+
  1 row in set, 1 warning (0.00 sec)

  -^^ ICP를 사용하도록 Index를 추가하고 실행계획은 확인한다.


  mysql 8.0 [localhost] {msandbox} (world) > explain select /*+ SET_VAR(sort_buffer_size = 16M) SET_VAR(optimizer_switch = 'index_condition_pushdown=off') */ * from countrylanguage where Language = 'Korean' and CountryCode like '%K%' order by IsOfficial;
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+-----------------------------+
  | id | select_type | table           | partitions | type | possible_keys           | key                     | key_len | ref   | rows | filtered | Extra                       |
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+-----------------------------+
  |  1 | SIMPLE      | countrylanguage | NULL       | ref  | IX_Language_CountryCode | IX_Language_CountryCode | 30      | const |    6 |    11.11 | Using where; Using filesort |
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+-----------------------------+
  1 row in set, 1 warning (0.00 sec)

  --^^ SET_VAR 를 통해 sort_buffer_size 를 16MiB로 쿼리 실행동안 한시적으로 늘리고, optimizer_switch를 통해 ICP를 사용하지 않도록 Hint를 만든 예제이다. Using index condition 에서 Using where 로 변경된것에 유의하자.


  mysql 8.0 [localhost] {msandbox} (world) > explain select /*+ SET_VAR(sort_buffer_size = 16M) NO_ICP(countrylanguage) */ * from countrylanguage where Language = 'Korean' and CountryCode like '%K%' order by IsOfficial;
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+-----------------------------+
  | id | select_type | table           | partitions | type | possible_keys           | key                     | key_len | ref   | rows | filtered | Extra                       |
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+-----------------------------+
  |  1 | SIMPLE      | countrylanguage | NULL       | ref  | IX_Language_CountryCode | IX_Language_CountryCode | 30      | const |    6 |    11.11 | Using where; Using filesort |
  +----+-------------+-----------------+------------+------+-------------------------+-------------------------+---------+-------+------+----------+-----------------------------+
  1 row in set, 1 warning (0.00 sec)

  --^^ 물론 해당예제는 위와 같은 Hint로 사용될 수도 있다.


  INSERT /*+ SET_VAR(foreign_key_checks=OFF) */ INTO t2 VALUES(2);

  --^^ TEST 데이터인 경우, 쿼리 runtime시 foreign_key_checks 를 순간적으로 끄고 DML을 진행할 수 있다.
  ```
