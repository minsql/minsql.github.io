---
title: MySQL Fractional timestamp and Partition pruning
author: min_kim
created: 2018/07/18
modified:
layout: post
tags: mysql mysql_partitioning
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL Fractional timestamp and Partition pruning

## MySQL Fractional timestamp
- timestamp 를 milliseconds 혹은 microseconds까지 저장하기 위해서 fractional part 를 명시할 수 있다.
- Reference : https://dev.mysql.com/doc/refman/5.7/en/fractional-seconds.html
- timestamp(3): 3자리 fractional part를 저장한다. milliseconds(ms)
- timestamp(6): 6자리 fractional part를 저장한다. microseconds(µs)

## test table with timestamp(3)
```
root@localhost:(none) 11:17:56>show create table test.atest\G
*************************** 1. row ***************************
       Table: atest
Create Table: CREATE TABLE `atest` (
  `no` bigint(20) NOT NULL AUTO_INCREMENT,
  `a_no` bigint(20) NOT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`no`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)


root@localhost:test 13:58:20>select * from atest;
+----+------+-------------------------+
| no | a_no | created_at              |
+----+------+-------------------------+
|  1 |    1 | 2018-06-04 09:56:35.931 |
|  2 |    2 | 2018-06-04 09:56:35.931 |
|  3 |    3 | 2018-06-04 09:56:35.931 |
|  4 |    4 | 2018-06-04 09:56:35.931 |
+----+------+-------------------------+
4 rows in set (0.00 sec)
```


## Partitoining with fractional timestamp
### try to alter partition table
```
alter table atest
PARTITION BY RANGE (unix_timestamp(created_at))
(PARTITION p20180601 VALUES LESS THAN (1530370800) ENGINE = InnoDB,
PARTITION p20180701 VALUES LESS THAN (1533049200) ENGINE = InnoDB);

ERROR 1491 (HY000): The PARTITION function returns the wrong type
```

> 안된다..

### wrong type이라니, 확인해보자.
```
root@localhost:test 15:19:25>select now(3),unix_timestamp(now(3));
+-------------------------+------------------------+
| now(3)                  | unix_timestamp(now(3)) |
+-------------------------+------------------------+
| 2018-07-18 15:19:32.469 |         1531894772.469 |
+-------------------------+------------------------+
1 row in set (0.00 sec)
```

> 어떻게 하면 fractional timestamp기준으로 partitioning할 수 있을까.
정답: 소수점 떼기, FLOOR!

### FLOOR(UNIX_TIMESTMP(your_partitioning_key))

```
alter table atest
PARTITION BY RANGE (floor(unix_timestamp(created_at)))
(PARTITION p20180601 VALUES LESS THAN (1530370800) ENGINE = InnoDB,
PARTITION p20180701 VALUES LESS THAN (1533049200) ENGINE = InnoDB);

root@localhost:test 15:41:07>show create table atest\G
*************************** 1. row ***************************
       Table: atest
Create Table: CREATE TABLE `atest` (
  `no` bigint(20) NOT NULL AUTO_INCREMENT,
  `a_no` bigint(20) NOT NULL,
  `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`no`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4
/*!50100 PARTITION BY RANGE (floor(unix_timestamp(created_at)))
(PARTITION p20180601 VALUES LESS THAN (1530370800) ENGINE = InnoDB,
 PARTITION p20180701 VALUES LESS THAN (1533049200) ENGINE = InnoDB) */
1 row in set (0.00 sec)
```

## UNFORTUNATELY, Partition pruning is not working well
### try to range scan

```
root@localhost:test 15:43:09>explain select * from atest where created_at between ('2018-06-01') and ('2018-06-10');
+----+-------------+-------+---------------------+------+---------------+------+---------+------+------+----------+-------------+
| id | select_type | table | partitions          | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+---------------------+------+---------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | atest | p20180601,p20180701 | ALL  | NULL          | NULL | NULL    | NULL |    8 |    12.50 | Using where |
+----+-------------+-------+---------------------+------+---------------+------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```
### try to equal scan
```
root@localhost:test 15:43:13>explain select * from atest where created_at ='2018-06-04 09:56:35.931';
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows | filtered | Extra       |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
|  1 | SIMPLE      | atest | p20180601  | ALL  | NULL          | NULL | NULL    | NULL |    4 |    25.00 | Using where |
+----+-------------+-------+------------+------+---------------+------+---------+------+------+----------+-------------+
1 row in set, 1 warning (0.00 sec)
```

> BUG 였음. FLOOR(decimal)의 partitioning expression으로 되어있지만, pruning에 제약이 있음.


## Conclusion
- 인덱스를 타게 해야한다.
- 가능하다면, Partition selection을 강제한다.
- 빨리 bug fix 되길 바란다.
