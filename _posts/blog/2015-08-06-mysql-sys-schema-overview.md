---
title: MySQL SYS schema overview
author: min_kim
created: 2015/08/06 14:55:41
modified:
layout: post
tags: MySQL
image:
  feature: mysql.png
categories: blog
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL SYS schema overview

## 1\. SYS schema란

### 1.1 SYS schema 소개

  * DBA, Developer, Ops 를 위한 views, procedures, functions 제공
  * 일반적인 DBA, Developer의 debugging, tunning 작업에 필요한 기능을 제공함
  * MySQL 5.7.7 부터 New Feature로 소개되어 default로 포함되고 5.7.7 미만 5.6 이상에서는 따로 설치가능하다.

### 1.2 왜 SYS schema가 필요한가?

  * performance_schema를 통해 원하는 데이터를 추출하기가 까다롭다.
  * performance_schema의 대량 데이터는 여러 방면으로 유용하게 쓰일수 있는데, 목적에 따라 쉽게 사용할수 있도록 views, procedures, functions 제공한다.

## 2\. 설치

### 2.1 command line설치

  * git clone https://github.com/MarkLeith/mysql-sys.git /tmp/sys
  * cd /tmp/sys
  * mysql -u user -p < sys_.sql
  * 예제

```
    [mysql@myvm1 ~]$  git clone https://github.com/MarkLeith/mysql-sys.git /tmp/sys
    Initialized empty Git repository in /tmp/sys/.git/
    remote: Counting objects: 1704, done.
    remote: Total 1704 (delta 0), reused 0 (delta 0), pack-reused 1704
    Receiving objects: 100% (1704/1704), 663.39 KiB | 310 KiB/s, done.
    Resolving deltas: 100% (1146/1146), done.
    [mysql@myvm1 ~]$ cd /tmp/sys
    [mysql@myvm1 sys]$ mysql -uroot -p --socket=/tmp/mysql56.sock < sys_56.sql
    Enter password:
```

### 2.2 MySQL Workbench 6.1+ 을 통한 설치

  * Performance Reports -> Install Helper

### 2.3 설치 확인

  * git 로 설치한 예제임

```
    mysql> select * from sys.version;
    +-------------+---------------+
    | sys_version | mysql_version |
    +-------------+---------------+
    | 1.4.0       | 5.6.19-log    |
    +-------------+---------------+
    1 row in set (0.00 sec)


    mysql> select * from sys.schema_object_overview where db='sys';
    +-----+---------------+-------+
    | db  | object_type   | count |
    +-----+---------------+-------+
    | sys | FUNCTION      |    14 |
    | sys | PROCEDURE     |    22 |
    | sys | VIEW          |    81 |
    | sys | BASE TABLE    |     1 |
    | sys | INDEX (BTREE) |     1 |
    | sys | TRIGGER       |     2 |
    +-----+---------------+-------+
    6 rows in set (0.05 sec)
```


## 3\. MySQL SYS schema 설명

### 3.1 MySQL sys views

  * DB운영시 참조할만한 뷰들이 들어있다.
  * sys 스키마의 뷰를 사용해서 커스터마이징한 뷰를 생성해서 사용할 수 있다.
  * 모두 performance_schema와 information_schema를 기반으로 한다.
  * formatted view와 raw view를 제공함
    * formatted views : 사람용, command line 용, 사람이 식별하기 쉬운 데이터로 되어있다. 예를들면 시간데이터들 raw views는 pico second로 되어있는데, formatted view에서는 ms, us로 보여줌
    * raw views : x$로 시작한다. tool용.

```
    mysql> select * from waits_global_by_latency limit 1;
    +------------------------------+-------+---------------+-------------+-------------+
    | events                       | total | total_latency | avg_latency | max_latency |
    +------------------------------+-------+---------------+-------------+-------------+
    | wait/io/file/sql/file_parser |  2077 | 623.59 ms     | 300.24 us   | 69.80 ms    |
    +------------------------------+-------+---------------+-------------+-------------+
    1 row in set (0.00 sec)

    mysql> select * from x$waits_global_by_latency limit 1;
    +------------------------------+-------+---------------+-------------+-------------+
    | events                       | total | total_latency | avg_latency | max_latency |
    +------------------------------+-------+---------------+-------------+-------------+
    | wait/io/file/sql/file_parser |  2077 |  623594918562 |   300238092 | 69796836648 |
    +------------------------------+-------+---------------+-------------+-------------+
    1 row in set (0.00 sec)
```

#### 3.1.1 User/Host Summary views

  * user_summary_%, host_summary_% : user/host 정보를 보여주는 뷰
  * Breakdowns by : IO usage, Stages, Statement details

```
    mysql> select * from user_summaryG
    ...
    *************************** 2. row ***************************
       user: michaela
               statements: 2189
        statement_latency: 7.19 s
    statement_avg_latency: 3.28 ms
              table_scans: 1960
                 file_ios: 6803
          file_io_latency: 5.91 h
      current_connections: 4
        total_connections: 7
             unique_hosts: 1
    ...
```

  * user_summary : user가 실행한 statement 개수, latency, table_scans, file_ios, file_io_latency 등
  * user_summary_by_% : breakdown 조건에 따른 뷰들

#### 3.1.2 IO Summary views

  * io_by_thread_by_latency : current threads의 IO정보
    * thread별 IO latency 정보, foreground process(processlist_id가 있는 것)뿐 아니라 background thread에 대한 정보도 포함됨.
  * io_global_by_% : file별 클래스별 Global 요약정보
  * latest_file_io : 마지막 file IO events에 대한 정보

#### 3.1.3 Schema Analysis views

  * schema_object_overview : Object overview
  * schema_table_% : Table 사용 통계정보
    * schema_tables_with_full_table_scans : full table scan한 테이블들 확인할 수 있다. 스키마 변경, 인덱스 추가를 고려하는 경우 참조할수 있다.
  * schema_index_statistics, schema_unused_indexes : Index 사용 통계정보
    * schema_unused_indexes : drop index등의 스키마 변경을 고려하는 경우 unused indexes정보 확인할 수 있다. 반드시 어플리케이션 특성에 따라 인덱스 사용빈도 확인후 충분히 모니터링 하고 작업해야한다.

#### 3.1.4 Wait Analysis views

  * wait_classes_% : event class별 wait summaries
  * waits_by_user%, waits_by_host% waits_global_% : user, host, global wait details

#### 3.1.5 Statement Analysis views

  * statement_analysis : Statement overview
  * 튜닝업무시 참조할수 있다.
  * 다음 조건에 해당하는 statement를 찾을 수 있다.
    * statements_with_errors_or_warnings : 에러난 구문
    * statements_with_full_table_scans : full table scan한 구문
    * statements_with_temp_tables : temp table 만든 구문
    * statements_with_sorting : sorting 일으킨 구문
    * statements_with_runtimes_in_95th_percentile : 95%(상위 5%) latency 구문

#### 3.1.6 기타 views

  * processlist : show processlist 및 추가정보 확인할수 있는 view
    * no mutex contention
    * 해당 쿼리의 현재 통계정보

### 3.2 Functions

  * format_path, format_statement : 식별가능한 포맷으로 변경하는 펑션
  * format_time : 적절한 time 포맷으로 바꾸는 펑션
  * format_bytes : 적절한 bytes 포맷으로 바꾸는 펑션
  * extract_%_from_file_name : object name 추출
  * ps_is_% : performace_schema의 측정도구인지 확인
  * ps_thread_id : 해당 connection_id의 performance_schema의 thread_id 반환
  * ps_thread_stack : thread stack dump내리는 펑션
  * sys_get_config

### 3.3 Procedures

#### 3.3.1 Performance Schema Config Helper Procedures

  * ps_setup_%

#### 3.3.2 Statement Tracing Procedures

  * ps_trace_thread : thread trace를 위해서 performace_schema 데이터 dump
    * 특정 기간동안의 특정 thread 모니터링
    * thread activity관련 가능한한 많은 정보를 캡처
    * graph를 그려주는 dot fommatted file을 return한다.
  * ps_trace_statement_digest : statement history table를 확인해서 statement digest상세정보 캡쳐
    * 현재 라이브 traffic 정보를 분석하여 특정 기간동안의 statement digest를 구한다.
    * 각각의 statement 통계정보를 캡처한다.
