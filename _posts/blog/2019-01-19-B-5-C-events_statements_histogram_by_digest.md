---
title: MySQL 8.0 - Performance_schema events_statements_histogram_by_digest Table
author: min_cho
created: 2019/01/19
modified:
layout: post
tags: mysql mysql8 performance_schema
image:
  feature: mysql.png
categories: MySQL8
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


------
## 개요

- 8.0 부터는 특정 Query 실행시간에 대해 내부적으로 범위를 정하고 그에 대한 Histogram을 통계로서 보여주게 된다.



------

## 사용예제

```sql
master [localhost] {msandbox} (performance_schema) > show tables from performance_schema like '%histogram%';
+--------------------------------------------+
| Tables_in_performance_schema (%histogram%) |
+--------------------------------------------+
| events_statements_histogram_by_digest      |
| events_statements_histogram_global         |
+--------------------------------------------+
2 rows in set (0.00 sec)

master [localhost] {msandbox} (performance_schema) > select * from events_statements_summary_by_digest where digest='14752b67eb0925e19d522324c1b60b1b6c338794da0a912a92d5cab2f37821da'\G
*************************** 1. row ***************************
                SCHEMA_NAME: test
                     DIGEST: 14752b67eb0925e19d522324c1b60b1b6c338794da0a912a92d5cab2f37821da
                DIGEST_TEXT: SHOW GLOBAL STATUS LIKE ?
                 COUNT_STAR: 21
             SUM_TIMER_WAIT: 28619000000
             MIN_TIMER_WAIT: 708000000
             AVG_TIMER_WAIT: 1362809000
             MAX_TIMER_WAIT: 10917000000
              SUM_LOCK_TIME: 3364000000
                 SUM_ERRORS: 0
               SUM_WARNINGS: 0
          SUM_ROWS_AFFECTED: 0
              SUM_ROWS_SENT: 289
          SUM_ROWS_EXAMINED: 18102
SUM_CREATED_TMP_DISK_TABLES: 0
     SUM_CREATED_TMP_TABLES: 21
       SUM_SELECT_FULL_JOIN: 0
 SUM_SELECT_FULL_RANGE_JOIN: 0
           SUM_SELECT_RANGE: 0
     SUM_SELECT_RANGE_CHECK: 0
            SUM_SELECT_SCAN: 42
      SUM_SORT_MERGE_PASSES: 0
             SUM_SORT_RANGE: 0
              SUM_SORT_ROWS: 0
              SUM_SORT_SCAN: 0
          SUM_NO_INDEX_USED: 21
     SUM_NO_GOOD_INDEX_USED: 0
                 FIRST_SEEN: 2018-11-21 13:27:38.860682
                  LAST_SEEN: 2018-11-21 13:31:20.504404
                QUANTILE_95: 1000000000
                QUANTILE_99: 10964781961
               QUANTILE_999: 10964781961
          QUERY_SAMPLE_TEXT: show global status like '%que%'
          QUERY_SAMPLE_SEEN: 2018-11-21 13:31:11.538601
    QUERY_SAMPLE_TIMER_WAIT: 885000000
1 row in set (0.00 sec)



master [localhost] {msandbox} (performance_schema) > select SCHEMA_NAME, BUCKET_NUMBER, sys.format_time(BUCKET_TIMER_LOW), Percentage, Count_bucket_and_lower, Bucket_quantile
from ( select SCHEMA_NAME, BUCKET_NUMBER, BUCKET_TIMER_LOW, BUCKET_TIMER_HIGH ,Count_bucket, (Bucket_quantile - ifnull(lag(Bucket_quantile,1) over(),0)) as Percentage, Count_bucket_and_lower, Bucket_quantile
from performance_schema.events_statements_histogram_by_digest where schema_name='test' and digest='14752b67eb0925e19d522324c1b60b1b6c338794da0a912a92d5cab2f37821da' and count_bucket <> 0   )x;
+-------------+---------------+-----------------------------------+------------+------------------------+-----------------+
| SCHEMA_NAME | BUCKET_NUMBER | sys.format_time(BUCKET_TIMER_LOW) | Percentage | Count_bucket_and_lower | Bucket_quantile |
+-------------+---------------+-----------------------------------+------------+------------------------+-----------------+
| test        |            93 | 691.83 us                         |   0.047619 |                      1 |        0.047619 |
| test        |            96 | 794.33 us                         |   0.095238 |                      3 |        0.142857 |
| test        |            97 | 831.76 us                         |   0.095238 |                      5 |        0.238095 |
| test        |            98 | 870.96 us                         |   0.428572 |                     14 |        0.666667 |
| test        |            99 | 912.01 us                         |   0.190476 |                     18 |        0.857143 |
| test        |           100 | 954.99 us                         |   0.095238 |                     20 |        0.952381 |
| test        |           152 | 10.47 ms                          |   0.047619 |                     21 |        1.000000 |
+-------------+---------------+-----------------------------------+------------+------------------------+-----------------+
7 rows in set (0.00 sec)


--^^ 위의 쿼리는 특정 SQL의 실행시간을 performance_schema.events_statements_histogram_by_digest 조회하여 가져온 결과이다. 예를 들어, SHOW GLOBAL STATUS LIKE ? 구문(DIGEST: 14752b67eb0925e19d522324c1b60b1b6c338794da0a912a92d5cab2f37821da)은 실행시간 691.83 us ~ 794.33 us 에서 1번 실행되었고 4.7% 이고, 794.33 us ~ 831.76 us  에서 2번 (3-1) 실행되었고 전체 9.5% 였다.
```



------

## 적용범위

- 서비스 오픈전 전체적인 쿼리의 실행시간에 대한 histogram을 조사하여, 예상되는 분포에서 벗어나게 실행되는 경우가 있었는지 확인할 수 있다.
- 때로는 특정쿼리가 Optimizer의 실행계획의 변경에 의해 예상보다 오래 실행되어 서버가 느려지는 경우가있다. 하지만 횟수를 알 수 없는 경우가 많은데, 이때 해당 TABLE을 조회하여, 좀 더 많은 정보를 확인할 수 있다.
