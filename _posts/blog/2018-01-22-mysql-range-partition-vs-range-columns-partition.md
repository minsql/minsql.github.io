---
title: MySQL range partition VS range columns partition
author: min_cho
date: 2018/01/22 14:46:49
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

# MySQL range partition VS range columns partition

날짜를 이용하여 파티션시, range 를 사용할 것인가? range colums 를 사용할 것인가?

### 개요

  * 데이터가 커짐에 따라, mysql 에서도 partition 기능을 많이 사용하게 된다. 특히 날짜를 이용하여, partitioning 을 많이 진행하게 되는데 이는 "PARTITION BY RANGE (to_days(날짜형식컬럼))" 혹은 " PARTITION BY RANGE COLUMNS(날짜형식컬럼))" 으로 진행될 수 있다. 이 두형식에 대해 알아보자.

### 생성방법

  * RANGE PARTITONING
    * 대부분의 MySQL DBA 들은 날짜를 이용하여 파티션시, range 를 자주 사용한다. 사용은 date 형 컬럼을 to_days 로 비교하여 사용될 수 있다. (Range 파티션은 값으로 int 형 데이터가 와야 하기 때문이다.

```sql
CREATE TABLE pt_range (
  id int NOT NULL AUTO_INCREMENT,
  some_data varchar(100),
  createdAt datetime(6) NOT NULL,
  modifiedAt datetime(6) DEFAULT NULL,
  PRIMARY KEY (id,createdAt)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8
partition by range (to_days(createdAt))
(
partition p201801 values less than (to_days('2018-02-01')),
partition p201802 values less than (to_days('2018-03-01')),
partition p201803 values less than (to_days('2018-04-01')),
partition p201804 values less than (to_days('2018-05-01')),
partition p201805 values less than (to_days('2018-06-01')),
partition p201806 values less than (to_days('2018-07-01'))
);
```


<https://dev.mysql.com/doc/refman/5.7/en/partitioning-range.html>

  * RANGE COLUMNS PARTITONING
    * 파티션은 잘 모르는분들도 있겠지만, range partition 과 비슷하지만 복합 컬럼을 사용할 수 있다는 장점이 있다. 이는 열거된 컬럼들과 row 의 실제값과의 비교연산을 통해 partition 이 선택이 되는데, 날짜 형식컬럼을 partition key 로 지정하여 비교를 진행할 수 있다.

```sql
CREATE TABLE pt_range_columns (
  id int NOT NULL AUTO_INCREMENT,
  some_data varchar(100),
  createdAt datetime(6) NOT NULL,
  modifiedAt datetime(6) DEFAULT NULL,
  PRIMARY KEY (id,createdAt)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8
PARTITION BY RANGE COLUMNS(createdAt)
(
PARTITION p201801 VALUES LESS THAN ('2018-02-01') ENGINE = InnoDB,
 PARTITION p201802 VALUES LESS THAN ('2018-03-01') ENGINE = InnoDB,
 PARTITION p201803 VALUES LESS THAN ('2018-04-01') ENGINE = InnoDB,
 PARTITION p201804 VALUES LESS THAN ('2018-05-01') ENGINE = InnoDB,
 PARTITION p201805 VALUES LESS THAN ('2018-06-01') ENGINE = InnoDB,
 PARTITION p201806 VALUES LESS THAN ('2018-07-01') ENGINE = InnoDB);
```


<https://dev.mysql.com/doc/refman/5.7/en/partitioning-columns-range.html>

### 장단점

#### 1\. 성능 관점에서

* 일반적으로 성능상에는 아주 미세하게 "RANGE (to_days(createdAt))" 가 빠르다. date 형 값을 to_days function 으로 int 로 바꾸어 지정된 partition 으로 들어갈 수 있도록 비교하는것이, date 형을 string 형으로 바꾼 후 string 형으로 비교하는것보다 미세하게 빠르기 때문이다. 물론 CPU 의 성능에 따라 다르겠지만, 위와같은 비교연산에 비해 나머지 연산들 (Data 를 변경하거나 SELECT 하는 연산들) 이 훨씬 더 많은 자원과 시간을 소모하기때문에 크게 문제가 되지는 않는다. 이는 큰 문제가 되지 않는다.

> 성능을 측정하기 위해 mysqlslap 을 이용하여, 단순 TEST를 진행해보자. 천건씩 (limit 1000) insert 를 10개의 세션 (--concurrency=10) 에서 모두 1000 번 (--number-of-queries=1000, 세션당 100번) 을 실행한다. 이를 10번 진행해보고 (--iterations=10) 결과를 확인해보자.

```bash
[root@localhost msb_5_7_19]# cat bt.sh
echo "========================================================"
echo "Test for insert on range partition table"
date
/MySQL_bianries/5.7.19/bin/mysqlslap  --concurrency=10 --create-schema=test --iterations=10  --number-of-queries=1000 --pre-query="truncate table test.pt_range;" --query="insert into test.pt_range (some_data, createdAt, modifiedAt) select 'some_data',DATE_ADD(now(),INTERVAL round(rand() *150) DAY), now() from information_schema.tables a ,  information_schema.tables b limit 1000;"  --socket=/tmp/mysql_sandbox5719.sock -umsandbox -pmsandbox
date
echo "========================================================"
echo "Test for insert on range column partition table"
date
/MySQL_bianries/5.7.19/bin/mysqlslap  --concurrency=10 --create-schema=test --iterations=10  --number-of-queries=1000 --pre-query="truncate table test.pt_range_columns;" --query="insert into pt_range_columns (some_data, createdAt, modifiedAt) select 'some_data',DATE_ADD(now(),INTERVAL round(rand() *150) DAY), now() from information_schema.tables a ,  information_schema.tables b limit 1000;"  --socket=/tmp/mysql_sandbox5719.sock -umsandbox -pmsandbox
date
echo "========================================================"

[root@localhost msb_5_7_19]# ./bt.sh > x
[root@localhost msb_5_7_19]# cat x
========================================================
Test for insert on range partition table
Sun Jan 14 06:50:06 EST 2018
Benchmark
        Average number of seconds to run all queries: 19.477 seconds
        Minimum number of seconds to run all queries: 18.528 seconds
        Maximum number of seconds to run all queries: 20.999 seconds
        Number of clients running queries: 10
        Average number of queries per client: 100

Sun Jan 14 06:53:23 EST 2018
========================================================
Test for insert on range column partition table
Sun Jan 14 06:53:23 EST 2018
Benchmark
        Average number of seconds to run all queries: 20.407 seconds
        Minimum number of seconds to run all queries: 18.257 seconds
        Maximum number of seconds to run all queries: 23.298 seconds
        Number of clients running queries: 10
        Average number of queries per client: 100

Sun Jan 14 06:56:49 EST 2018
========================================================
```

**_크게 차이는 없지만, range partition table 에 데이터를 넣는것 (평균 19.477 vs 20.407) 이 insert 단위 테스트에서는 조금 더 빠른 결과를 보여준다. (큰 차이는 없었다)_**

  * 조건을 통해 partition pruning 을 할 경우 (정확히는 여러달에 걸친 조건 ( between '2018-03-30' and '2018-04-02';)) , 의도치 않게 "RANGE (to_days(createdAt))" 에서 첫번째 partition 을 추가로 읽을 수 있다. 이는 여러달에 걸친 data 를 조회할때는 추가적인 scan (첫번째 partiton 에 대한 scan) 이 필요함으로 성능이 떨어진다.


```sql
mysql [localhost] {msandbox} (test) > explain select count(*) from pt_range where createdAt between '2018-03-30 00:00:00' and '2018-04-30 00:00:00';
+----+-------------+----------+-------------------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
| id | select_type | table    | partitions              | type  | possible_keys | key     | key_len | ref  | rows   | filtered | Extra                    |
+----+-------------+----------+-------------------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
|  1 | SIMPLE      | pt_range | p201801,p201803,p201804 | index | NULL          | PRIMARY | 12      | NULL | 524254 |    11.11 | Using where; Using index |
+----+-------------+----------+-------------------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
1 row in set, 1 warning (0.09 sec)

    -- range partition 의 경우, createdAt between '2018-03-30 00:00:00' and '2018-04-30 00:00:00'; 시에 알 수 없는 p201801 에 대한 partition 을 scan 하게 된다.


mysql [localhost] {msandbox} (test) > explain select count(*) from pt_range_columns where createdAt between '2018-03-30 00:00:00' and  '2018-04-30 00:00:00';
+----+-------------+------------------+-----------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
| id | select_type | table            | partitions      | type  | possible_keys | key     | key_len | ref  | rows   | filtered | Extra                    |
+----+-------------+------------------+-----------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
|  1 | SIMPLE      | pt_range_columns | p201803,p201804 | index | NULL          | PRIMARY | 12      | NULL | 406717 |    11.11 | Using where; Using index |
+----+-------------+------------------+-----------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
1 row in set, 1 warning (0.00 sec)

    -- range columns partition 의 경우,  p201801 에 대한 partition 을 읽지 않는다.
```

**이는 to_days 가 특정일짜에 대해서 null 을 return 할 수 있기때문에, null 이 저장된 첫번째 partition 을 읽어야 정확한 데이터를 추출해낼 수 있기 때문이다. 이는 bug 가 아닌 의도된 결과이다.**

예를 들어, ‘2018-04-00 00:00:00’ 의 경우, 데이터는 들어갈 수 있지만 (sql_mode 에 따라 다르지만, NO_ZERO_IN_DATE 를 사용하지 않는 경우 들어갈 수 있다.) 해당 결과는 to_days function 에의해 null 로 return 되어 첫번째 partition 에 저장되기 때문이다.

이를 createdAt between ‘2018-03-30 00:00:00’ and ‘2018-04-30 00:00:00’ 와 같은 조건으로 검색할 경우, ‘2018-04-00 00:00:00’ 도 맞는 조건임으로 뽑아내야 하며, 이를 위해 첫번째 partition이 검색되어야 한다.

하지만, 일반적으로 createdAt between ‘2018-04-01 00:00:00’ and ‘2018-04-30 23:59:59’ 와 같이 한달을 기준으로 혹은 더 작은 단위로 사용될 경우, 첫번째 partition 은 검색되지 않는다.

아래의 예제를 확인해보자.

```sql
mysql [localhost] {msandbox} (test) > select to_days('2018-04-00 00:00:00');
+--------------------------------+
| to_days('2018-04-00 00:00:00') |
+--------------------------------+
|                           NULL |
+--------------------------------+
1 row in set, 1 warning (0.00 sec)

    -- NULL 이 return 된다. to_days 로 표현할 수 없는 값이기 때문이다.

mysql [localhost] {msandbox} (test) > insert into pt_range (some_data, createdAt, modifiedAt) values ('some_data','2018-04-00 00:00:00'0',now());
ERROR 1292 (22007): Incorrect datetime value: '2018-04-00 00:00:00' for column 'createdAt' at row 1

mysql [localhost] {msandbox} (test) > select @@session.sql_mode;
+-------------------------------------------------------------------------------------------------------------------------------------------+
| @@session.sql_mode                                                                                                                        |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION |
+-------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

    -- 해당 값으로 data 를 넣으면 5.7 에서는 error 가 발생한다. 그 이유는 5.7 의 default sql_mode 값으로 NO_ZERO_IN_DATE 값을 포함하기 때문이다.


mysql [localhost] {msandbox} (test) > SET SESSION sql_mode = sys.list_drop(@@session.sql_mode, 'NO_ZERO_IN_DATE');
Query OK, 0 rows affected, 1 warning (0.00 sec)

mysql [localhost] {msandbox} (test) > select @@session.sql_mode;
+---------------------------------------------------------------------------------------------------------------------------+
| @@session.sql_mode                                                                                                        |
+---------------------------------------------------------------------------------------------------------------------------+
| ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION |
+---------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

    --  sys.list_drop() 을 이용하여, 해당 session 의 sql_mode 에서 NO_ZERO_IN_DATE 값을 제거하였다.


mysql [localhost] {msandbox} (test) > insert into pt_range (some_data, createdAt, modifiedAt) values ('some_data','2018-04-00 00:00:00',now());
Query OK, 1 row affected (0.01 sec)

    --  값이 잘 들어간다. 5.6 의 경우, sql_mode 의 default 값에 NO_ZERO_IN_DATE 가 존재하지 않음으로 위의 작업 없이도 테스트가 가능하다.


mysql [localhost] {msandbox} (test) > explain select * from pt_range where createdAt='2018-04-00 00:00:00';
+----+-------------+----------+------------+------+---------------+------+---------+------+--------+----------+-------------+
| id | select_type | table    | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra       |
+----+-------------+----------+------------+------+---------------+------+---------+------+--------+----------+-------------+
|  1 | SIMPLE      | pt_range | p201801    | ALL  | NULL          | NULL | NULL    | NULL | 107694 |    10.00 | Using where |
+----+-------------+----------+------------+------+---------------+------+---------+------+--------+----------+-------------+
1 row in set, 1 warning (0.00 sec)

    --  실행계획을 range partition 의 경우,  partition pruning 시에 p201801 를 읽는것이 확인된다.


mysql [localhost] {msandbox} (test) > select * from pt_range where createdAt='2018-04-00 00:00:00';
+---------+-----------+----------------------------+----------------------------+
| id      | some_data | createdAt                  | modifiedAt                 |
+---------+-----------+----------------------------+----------------------------+
| 1002002 | some_data | 2018-04-00 00:00:00.000000 | 2018-01-14 07:09:52.000000 |
+---------+-----------+----------------------------+----------------------------+
1 row in set (0.09 sec)

    --  원하는값도 정상적으로 가져온다.


mysql [localhost] {msandbox} (test) > insert into pt_range_columns (some_data, createdAt, modifiedAt) values ('some_data','2018-04-00 00:00:00',now());
Query OK, 1 row affected (0.01 sec)

mysql [localhost] {msandbox} (test) > explain select * from pt_range_columns where createdAt='2018-04-00 00:00:00';
+----+-------------+------------------+------------+------+---------------+------+---------+------+--------+----------+-------------+
| id | select_type | table            | partitions | type | possible_keys | key  | key_len | ref  | rows   | filtered | Extra       |
+----+-------------+------------------+------------+------+---------------+------+---------+------+--------+----------+-------------+
|  1 | SIMPLE      | pt_range_columns | p201803    | ALL  | NULL          | NULL | NULL    | NULL | 206671 |    10.00 | Using where |
+----+-------------+------------------+------------+------+---------------+------+---------+------+--------+----------+-------------+
1 row in set, 1 warning (0.00 sec)

    --  실행계획을 range columns partition 의 경우, 기대한것처럼 partition pruning 시에 p201803 를 읽는것이 확인된다.


mysql [localhost] {msandbox} (test) > select * from pt_range_columns where createdAt='2018-04-00 00:00:00';
+---------+-----------+----------------------------+----------------------------+
| id      | some_data | createdAt                  | modifiedAt                 |
+---------+-----------+----------------------------+----------------------------+
| 1002278 | some_data | 2018-04-00 00:00:00.000000 | 2018-01-14 07:11:15.000000 |
+---------+-----------+----------------------------+----------------------------+
1 row in set (0.13 sec)

mysql [localhost] {msandbox} (test) > SET SESSION sql_mode = sys.list_add(@@session.sql_mode, 'NO_ZERO_IN_DATE');
Query OK, 0 rows affected (0.00 sec)

mysql [localhost] {msandbox} (test) > select @@session.sql_mode;
+-------------------------------------------------------------------------------------------------------------------------------------------+
| @@session.sql_mode                                                                                                                        |
+-------------------------------------------------------------------------------------------------------------------------------------------+
| ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION |
+-------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

    -- sys.list_add() 을 이용하여 다시 원래대로 세션의 sql_mode  값에 NO_ZERO_IN_DATE 를 추가할 수 있다.
```

* 이에대해 관련된 공식 문서와 버그는 아래와 같다.

```
- http://bugs.mysql.com/bug.php?id=72383 (Pruning includes first partition when query range crosses month boundary)
- Bug 18621754 : PRUNING INCLUDES FIRST PARTITION WHEN QUERY RANGE CROSSES MONTH BOUNDARY


    Fixed in 5.1+, documented in the 5.1.69, 5.5.31, 5.6.11, and 5.7.1 changelogs


    A query on a table partitioned by range and using TO_DAYS() as a
    partitioing function always included the first partition of the
    table when pruning. This happened regardless of the range
    employed in the BETWEEN clause of such a query.

    - https://dev.mysql.com/doc/relnotes/mysql/5.5/en/news-5-5-31.html
    - https://dev.mysql.com/doc/relnotes/mysql/5.6/en/news-5-6-11.html
```

추가로, range columns 에서 pruning 이 정확히 안되는 버그가 있었지만, 이는 5-5-33 과 5-6-13 에서 fix 되었다.

```
- Bug 16447483 : PARTITION PRUNING IS NOT CORRECT FOR RANGE COLUMNS

    - https://dev.mysql.com/doc/relnotes/mysql/5.5/en/news-5-5-33.html
    - https://dev.mysql.com/doc/relnotes/mysql/5.6/en/news-5-6-13.html
```

#### 2. 가독성 및 관리관점에서,
가독성 부분에서는 “PARTITION BY RANGE COLUMNS(createdAt)” 이 더 좋을 수 있다. show create table 등으로 확인할때 직관적으로 날짜를 확인하여 파티션구조를 확인할 수 있기 때문이다.

```sql
...
/*!50500 PARTITION BY RANGE  COLUMNS(createdAt)
(PARTITION p201801 VALUES LESS THAN ('2018-02-01') ENGINE = InnoDB,
 PARTITION p201802 VALUES LESS THAN ('2018-03-01') ENGINE = InnoDB,
 PARTITION p201803 VALUES LESS THAN ('2018-04-01') ENGINE = InnoDB,
 PARTITION p201804 VALUES LESS THAN ('2018-05-01') ENGINE = InnoDB,
 PARTITION p201805 VALUES LESS THAN ('2018-06-01') ENGINE = InnoDB,
 PARTITION p201806 VALUES LESS THAN ('2018-07-01') ENGINE = InnoDB) */
반면에 “PARTITION BY RANGE (to_days(createdAt))” 의 경우, show create table 시 to_days(‘2018-02-01’) 가 변환되어 737091 라는 결과가 반환된다. 이는 가독성 부분에서 많이 떨어질뿐 아니라, 향후 partition 을 추가할때도 SELECT DATE_ADD(‘0000-01-01’, INTERVAL 737241-1 DAY); 와 같이 언제까지 partition 을 추가했는지 알아내야한다.

...
/*!50100 PARTITION BY RANGE (to_days(createdAt))
(PARTITION p201801 VALUES LESS THAN (737091) ENGINE = InnoDB,
 PARTITION p201802 VALUES LESS THAN (737119) ENGINE = InnoDB,
 PARTITION p201803 VALUES LESS THAN (737150) ENGINE = InnoDB,
 PARTITION p201804 VALUES LESS THAN (737180) ENGINE = InnoDB,
 PARTITION p201805 VALUES LESS THAN (737211) ENGINE = InnoDB,
 PARTITION p201806 VALUES LESS THAN (737241) ENGINE = InnoDB) */
```

### 결론
일반적으로, 달이 넘어가는 데이터를 조회하지 않는 경우, “PARTITION BY RANGE COLUMNS(createdAt)” 과 “PARTITION BY RANGE (to_days(createdAt))” 는 성능에 큰 영향을 주지 않는다.

하지만, 달이 넘어가는 데이터를 조회하는 경우는 꼭 explain 을 확인해보자. 만약 첫번째 partition 이 데이터가 많은 경우, 이는 overhead 가 될 수 있다.

또한 partition drop 시 invalid date 를 가진 data 가 의도치않게 날아가버릴 수도 있다. 예를 들면, 첫번째 partition 인 2월이전의 partition 을 drop 하고 싶었지만, ‘2018-04-00 00:00:00’ row 도 함께 삭제될 수 있다.

RANGE partiton 을 꼭 써야만한다면, 아래와 같이 첫번째 partition 을 추가하는것이 좋다. 첫번째 partition 을 확인하더라도 첫번째 파티션에 저장된 유효하지 않은 데이터만 확인함으로 성능상 유리할 수 있다.

```sql
CREATE TABLE pt_range (
  id int NOT NULL AUTO_INCREMENT,
  some_data varchar(100),
  createdAt datetime(6) NOT NULL,
  modifiedAt datetime(6) DEFAULT NULL,
  PRIMARY KEY (id,createdAt)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8
partition by range (to_days(createdAt))
(PARTITION INVALID_DATE_DATA VALUES LESS THAN (0) ENGINE = InnoDB,
 PARTITION p201801 VALUES LESS THAN (737091) ENGINE = InnoDB,
 PARTITION p201802 VALUES LESS THAN (737119) ENGINE = InnoDB,
 PARTITION p201803 VALUES LESS THAN (737150) ENGINE = InnoDB,
 PARTITION p201804 VALUES LESS THAN (737180) ENGINE = InnoDB,
 PARTITION p201805 VALUES LESS THAN (737211) ENGINE = InnoDB,
 PARTITION p201806 VALUES LESS THAN (737241) ENGINE = InnoDB);
```
