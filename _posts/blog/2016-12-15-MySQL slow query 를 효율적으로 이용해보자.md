---
title: MySQL slow query 를 효율적으로 이용해보자!
author: min_cho
created: 2016/12/15 14:59:57
modified:
layout: post
tags: mysql mysql_tips
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL slow query 를 효율적으로 이용해보자!

## 개요

  * MySQL 은 slow query 를 사용하여, 많은 정보를 얻어낼 수 있다. 하지만, 해당 기능들이 default 로 OFF 로 되어 있어 그냥 지나가는 경우가 많다. slow query 관련한 기능들을 알아보자.
    * Slow query 파일은 쿼리를 튜닝하는데 아주 중요한 요소로 작용하지만, 5.6부터는 해당 기능이 default 로 OFF 되어 있다. 먼저 아래에 나열된 모든 기능을 사용하기 위해서는 slow_query_log 를 ON 으로 설정해야 한다.
    * 해당값은 dynamic 변수로서 set global slow_query_log=ON; 와 같이 변경가능하다.
    * my.cnf 의 [mysqld] section 에 slow_query_log 를 추가하여 restart 후에도 해당 값이 ON 이 될 수있도록 조정한다.

## Slow query 에 쓰여지는것들

### 1. long_query_time 이상으로 실행되는 쿼리에 대하여, slow_query_log_file 에 존재하는 파일에 slow query 를 작성한다.
* long_query_time (default : 10) - [http://dev.mysql.com/doc/refman/5.6/en/server-system-variables.html#sysvar_long_query_time](\\"http://dev.mysql.com/doc/refman/5.6/en/server-system-variables.html#sysvar_long_query_time\\")
  * OLTP 환경에서 해당값을 10초로 두는것은 개인적으로 너무 길다. 해당 값을 1초 혹은 2초로 수정하자.
* slow_query_log_file (default : host_name-slow.log) - [http://dev.mysql.com/doc/refman/5.6/en/server-system-variables.html#sysvar_slow_query_log_file](\\"http://dev.mysql.com/doc/refman/5.6/en/server-system-variables.html#sysvar_slow_query_log_file\\")

### 2. Index 를 사용하지 않는 쿼리들
* log_queries_not_using_indexes (default : OFF) - [http://dev.mysql.com/doc/refman/5.6/en/server-system-variables.html#sysvar_log_queries_not_using_indexes](\\"http://dev.mysql.com/doc/refman/5.6/en/server-system-variables.html#sysvar_log_queries_not_using_indexes\\")
  * 해당옵션을 ON 하게 된다면, INDEX를 사용하지 않는 쿼리가 찍히게 된다. 이는 기존의 slow query (느려서 찍히게 되는 경우) 와 꼬일 수 있으므로, 프로젝트가 오픈되기 전 쿼리 검증을 위해 사용할 수 있다.
  * 중간에 쿼리튜닝을 위해 사용해야 한다면, 아래와 같이 사용하자.

```
mysql> set global log_queries_not_using_indexes = ON, GLOBAL long_query_time = 100000, GLOBAL slow_query_log_file = \'not_using_index.log\';
mysql> flush logs; 정보 수집을 한 후, 원래의 값으로 돌려놓자.
mysql> set global log_queries_not_using_indexes = OFF, GLOBAL long_query_time = 2, GLOBAL slow_query_log_file = \'host_name-slow.log\';
mysql> flush logs;
```

  * 물론 performance_schema 를 사용한다면, performance_schema.events_statements_summary_by_digest 의 SUM_NO_INDEX_USED 컬럼을 참고하여, 쿼리를 알아낼 수도 있다.


### 3. Admin 관련 명령어 혹은 slave 의 sql_thread 에 의해 실행된 명령어중 long_query_time 이상으로 실행된 명령어를 찾는다.
* log_slow_admin_statements (default : OFF) - [http://dev.mysql.com/doc/refman/5.6/en/server-system-variables.html#sysvar_log_slow_admin_statements](\\"http://dev.mysql.com/doc/refman/5.6/en/server-system-variables.html#sysvar_log_slow_admin_statements\\")
* log_slow_slave_statements (default : OFF) - [http://dev.mysql.com/doc/refman/5.6/en/replication-options-slave.html#sysvar_log_slow_slave_statements](\\"http://dev.mysql.com/doc/refman/5.6/en/replication-options-slave.html#sysvar_log_slow_slave_statements\\")
  * 기본적으로 slow queries 에는 admin 관련 명령어나 slave 의 sql_thread 에 의해 실행된 명령어는 아무리 오래걸려도 찍히지 않는다. 해당 내용을 확인하기 위해서는 위의 두옵션을 ON 으로 설정해야 한다.
  * admin 관련 명령어 는 ALTER TABLE, ANALYZE TABLE, CHECK TABLE, CREATE INDEX, DROP INDEX, OPTIMIZE TABLE, REPAIR TABLE 이다. 예전에 alter table 을 누가했는지 알 수 있는 방법을 문의한적이 있다. 이때 해당 방법은 좋은 선택이 될 수 있다. 물론 해당 명령어 역시, long_query_time 이상으로 실행된 명령어에 대해서만 찍힌다.
  * 예제

```
# User@Host: root[root] @  [192.168.74.202]  Id:    17
# Query_time: 3.362235  Lock_time: 0.007825 Rows_sent: 0  Rows_examined: 0
SET timestamp=1469352147;
alter table tester add index b(b);
```

## 효율적으로 활용하기

### 1. long-query-time 과 mysqldumpslow를 이용하여, 쿼리의 종류와 횟수 계산하기
* 일반적으로 어떤 쿼리가 얼만큼 들어오는지 확인하기 위해 여러방법이 쓰일 수 있다. WAS에서 계산해볼 수도 있고, general log 를 내려 모든 쿼리를 확인할 수 있다. 하지만 이 경우 직접 통계를 내는 프로그램이 필요하다.
* 간단히 특정시간동안 long_query_time 를 0 으로 세팅하여 모든 쿼리를 slow query에 남긴후, mysqldumpslow 를 통해 분석해 낼 수 있다.

```
mysql> set global long_query_time=0;
shell# mysqldumpslow -s c slow-queries.log > static.sql
```

* mysqldumpslow 는 여러가지 옵션이 있으니 적절히 사용해 보자. [https://dev.mysql.com/doc/refman/5.6/en/mysqldumpslow.html](\\"https://dev.mysql.com/doc/refman/5.6/en/mysqldumpslow.html\\")

### 2. min_examined_row_limit 를 이용하여, 특정 row 이상으로 검사한 쿼리만 찾기.
* 비록, log_queries_not_using_indexes 를 통해 index 를 사용하지 않는 쿼리를 찾는다 하더라도, 테이블에 데이터가 10건정도라면 인덱스를 타지 않는것이 현명한 쿼리일 수 있다. 또한 적절히 limit 를 쓴 경우도 그러하다. 이러한 쿼리들을 걸러내기 위하여 min_examined_row_limit 라는 변수가 존재한다.
* min_examined_row_limit (default : 0) - [http://dev.mysql.com/doc/refman/5.6/en/server-options.html#option_mysqld_min-examined-row-limit](\\"http://dev.mysql.com/doc/refman/5.6/en/server-options.html#option_mysqld_min-examined-row-limit\\")
* 소스를 보면 알겠지만, 해당 값은 마지막에 and 조건으로 연산이 된다. 해당 의미는 min_examined_row_limit 설정된값 이하로 row수를 검사하면 조건에 만족하더라도 slow query에 쓰지 않는다는 의미이다. 이로써 해당값으로 filter 를 만들 수 있다.(예를 들면 log_queries_not_using_indexes = ON, min_examined_row_limit=100)

```
if (thd->enable_slow_log)
{
  ulonglong end_utime_of_query= thd->current_utime();
  thd_proc_info(thd, 'logging slow query');

  if (((thd->server_status & SERVER_QUERY_WAS_SLOW) ||
       ((thd->server_status &
         (SERVER_QUERY_NO_INDEX_USED | SERVER_QUERY_NO_GOOD_INDEX_USED)) &&
        opt_log_queries_not_using_indexes &&
         !(sql_command_flags[thd->lex->sql_command] & CF_STATUS_COMMAND))) && thd->examined_row_count >= thd->variables.min_examined_row_limit)
  {
    thd_proc_info(thd, 'logging slow query');
    thd->status_var.long_query_count++;
    slow_log_print(thd, thd->query(), thd->query_length(),
                   end_utime_of_query);
  }
}
```

### 추천하는 설정

* MASTER

```
[mysqld]
log-slow-queries=/log/slow_queries.log
long-query-time=1
log_slow_admin_statements
```

* SLAVE

```
[mysqld]
log-slow-queries=/log/slow_queries.log
long-query-time=1
log_slow_slave_statements
```
