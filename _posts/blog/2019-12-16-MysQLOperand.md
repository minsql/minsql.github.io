---
title: MySQL에서 null safe equal operator (<=>)
author: min_cho
created: 2019/12/15
modified:
layout: post
tags: mysql
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

------
# 개요
 * SQL에서 NULL과의 모든 연산은 NULL을 반환한다. NULL은 아직 할당되지 않은 값이기 때문이다. 이를 피하기 위해 [ifnull](https://dev.mysql.com/doc/refman/8.0/en/control-flow-functions.html#function_ifnull)과 같은 함수를 사용하기도 하지만 모든 nullable column을 비교하기위해 해당 function을 사용하는것은 꽤나 귀찮은 일이다. 이때문에 MySQL은 `<=>`라는 연산자를 제공한다.

```sql
mysql [localhost] {msandbox} (test) > select NULL = 'a';
+------------+
| NULL = 'a' |
+------------+
|       NULL |
+------------+
1 row in set (0.00 sec)

mysql [localhost] {msandbox} (test) > select ifnull(NULL,'null value') = 'a';
+---------------------------------+
| ifnull(NULL,'null value') = 'a' |
+---------------------------------+
|                               0 |
+---------------------------------+
1 row in set (0.00 sec)

mysql [localhost] {msandbox} (test) > select NULL <=> 'a';
+--------------+
| NULL <=> 'a' |
+--------------+
|            0 |
+--------------+
1 row in set (0.00 sec)

```

# [<=>](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_equal-to) 연산자
* MySQL은 [<=>](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_equal-to) 라는 null safe equal operator를 제공한다.
 * 일반적인 동작은 `=`과 같다.
 * NULL과 비교될 시에는 비교할값과 NULL을 그대로 비교한다.

```sql
CREATE TABLE tbl_n
  (
     a INT,
     b VARCHAR(10)
  );

INSERT INTO tbl_n VALUES (1,'a'),(2,'b'),(3,null);

SELECT
       b,
       b = 'a',
       b <=> 'a',
       b <=> null
FROM   tbl_n;

+------+---------+-----------+------------+
| b    | b = 'a' | b <=> 'a' | b <=> null |
+------+---------+-----------+------------+
| a    |       1 |         1 |          0 |
| b    |       0 |         0 |          0 |
| NULL |    NULL |         0 |          1 |
+------+---------+-----------+------------+
```
