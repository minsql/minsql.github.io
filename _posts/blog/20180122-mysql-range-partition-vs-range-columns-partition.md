---
layout: post
categories: blog
tags: [MySQL]
toc: true
title: MySQL range partition VS range columns partition
link: http://minsql.com/mysql/mysql-range-partition-vs-range-columns-partition/
author: min_cho
date: 2018/01/22 14:46:49
comment_status: open
post_name: mysql-range-partition-vs-range-columns-partition
status: publish
---
# MySQL range partition VS range columns partition

날짜를 이용하여 파티션시, range 를 사용할 것인가? range colums 를 사용할 것인가?

### 개요

  * 데이터가 커짐에 따라, mysql 에서도 partition 기능을 많이 사용하게 된다. 특히 날짜를 이용하여, partitioning 을 많이 진행하게 되는데 이는 "PARTITION BY RANGE (to_days(날짜형식컬럼))" 혹은 " PARTITION BY RANGE COLUMNS(날짜형식컬럼))" 으로 진행될 수 있다. 이 두형식에 대해 알아보자.

### 생성방법

  * RANGE PARTITONING
    * 대부분의 MySQL DBA 들은 날짜를 이용하여 파티션시, range 를 자주 사용한다. 사용은 date 형 컬럼을 to_days 로 비교하여 사용될 수 있다. (Range 파티션은 값으로 int 형 데이터가 와야 하기 때문이다.


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



<https://dev.mysql.com/doc/refman/5.7/en/partitioning-range.html>

  * RANGE COLUMNS PARTITONING
    * 파티션은 잘 모르는분들도 있겠지만, range partition 과 비슷하지만 복합 컬럼을 사용할 수 있다는 장점이 있다. 이는 열거된 컬럼들과 row 의 실제값과의 비교연산을 통해 partition 이 선택이 되는데, 날짜 형식컬럼을 partition key 로 지정하여 비교를 진행할 수 있다.


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



<https://dev.mysql.com/doc/refman/5.7/en/partitioning-columns-range.html>

### 장단점

#### 1\. 성능 관점에서

  * 일반적으로 성능상에는 아주 미세하게 "RANGE (to_days(createdAt))" 가 빠르다. date 형 값을 to_days function 으로 int 로 바꾸어 지정된 partition 으로 들어갈 수 있도록 비교하는것이, date 형을 string 형으로 바꾼 후 string 형으로 비교하는것보다 미세하게 빠르기 때문이다. 물론 CPU 의 성능에 따라 다르겠지만, 위와같은 비교연산에 비해 나머지 연산들 (Data 를 변경하거나 SELECT 하는 연산들) 이 훨씬 더 많은 자원과 시간을 소모하기때문에 크게 문제가 되지는 않는다. 이는 큰 문제가 되지 않는다.

> 성능을 측정하기 위해 mysqlslap 을 이용하여, 단순 TEST를 진행해보자. 천건씩 (limit 1000) insert 를 10개의 세션 (--concurrency=10) 에서 모두 1000 번 (--number-of-queries=1000, 세션당 100번) 을 실행한다. 이를 10번 진행해보고 (--iterations=10) 결과를 확인해보자.


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


**_크게 차이는 없지만, range partition table 에 데이터를 넣는것 (평균 19.477 vs 20.407) 이 insert 단위 테스트에서는 조금 더 빠른 결과를 보여준다. (큰 차이는 없었다)_**

  * 조건을 통해 partition pruning 을 할 경우 (정확히는 여러달에 걸친 조건 ( between '2018-03-30' and '2018-04-02';)) , 의도치 않게 "RANGE (to_days(createdAt))" 에서 첫번째 partition 을 추가로 읽을 수 있다. 이는 여러달에 걸친 data 를 조회할때는 추가적인 scan (첫번째 partiton 에 대한 scan) 이 필요함으로 성능이 떨어진다.


    mysql [localhost] {msandbox} (test) > explain select count(*) from pt_range where createdAt between '2018-03-30 00:00:00' and '2018-04-30 00:00:00';
    +----+-------------+----------+-------------------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
    | id | select_type | table    | partitions              | type  | possible_keys | key     | key_len | ref  | rows   | filtered | Extra                    |
    +----+-------------+----------+-------------------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
    |  1 | SIMPLE      | pt_range | p201801,p201803,p201804 | index | NULL          | PRIMARY | 12      | NULL | 524254 |    11.11 | Using where; Using index |
    +----+-------------+----------+-------------------------+-------+---------------+---------+---------+------+--------+----------+--------------------------+
    1 row in set, 1 warning (0.09 sec)

        -- range partition 의 경우, createdAt between '2018-03-30 00:00:00' and '2018-04-30 00:00:00'; 시에 알 수 없는 p201801 에 대한 partition 을 scan 하게 된다.


    mysql [localhost
