---
title: MySQL 8.0 - SET PERIST 구문
author: min_cho
created: 2019/08/20
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

- MySQL 을 사용함에 있어, 실수가 잦은부분이 있다. 영구적으로 변수를 수정하기 위해, mysql commad line tool (mysql CLI)에서 set 명령어로 현재 사용되고 있는 Dynamic 변수를 수정하지만, 막상 my.cnf 에는 함께 수정되지 않았거나, 우선순위가 낮은 my.cnf에 수정을 하는 경우가 종종 발생한다.

  이와 같은 환경에서 mysqld instance 가 restart 된다면, set 구문으로 적용되었던 부분이 다시 reset 되며 문제가 다시 발생하게 된다 (대표적으로 max_connections 의 변경). 이를 회피하고자 *set perist* 구문을 추가하여 현재 사용되고 있는 Dynamic 변수를 포함 하여 mysqld config file (mysqld-auto.cnf) 도 함께 바뀔 수 있도록 기능이 추가되었다.



- set perist 와 set perist_only 가 구문이 존재하는데 차이는 다음과 같다.

  ```
  SET PERIST = SET GLOBAL 옵션실행  + mysqld-auto.cnf 파일에 내역 작성
  SET PERIST_ONLY = mysqld-auto.cnf 파일에 내역 작성 (이는 global option인 my.cnf에 기술해두는것과 같은 효과를 내지만, mysqld-auto.cnf 의 경우 변경한 계정 및 시간등을 자동으로 기록해두는 장점이 있다.)
  ```



- set perist 구문으로 수정된 dynamic 변수는 mysqld의 data directory의 mysqld-auto.cnf 라는 파일에 JSON형태로 저장된다. 해당 파일에는 변경시각, 변경한 계정등의 정보를 함께 담는다.

  ```
  MINCHO-M-B49A6A:data root# cat mysqld-auto.cnf
  { "Version" : 1 , "mysql_server" : { "max_connections" : { "Value" : "200" , "Metadata" : { "Timestamp" : 1544003361487009 , "User" : "msandbox" , "Host" : "localhost" } } } }
  ```



- 결과적으로 mysqld 는 다음과 같은 차례로 my.cnf를 읽어 mysqld를 시작한다.

  | File Name                   | 유형                                                         |
  | :-------------------------- | :----------------------------------------------------------- |
  | `/etc/my.cnf`               | Global options                                               |
  | `/etc/mysql/my.cnf`         | Global options                                               |
  | `*SYSCONFDIR*/my.cnf`       | Global options                                               |
  | `$MYSQL_HOME/my.cnf`        | 여러 instance가 존재하는 경우, 특정 instance를 위해          |
  | `defaults-extra-file`       | defaults-extra-file 이 지정되는 경우 (전사 공통 my.cnf가 있고, 특정 instance에 다른 옵션을 적용하는 경우) |
  | `~/.my.cnf`                 | 특정 OS 유저에 맞는 설정                                     |
  | `~/.mylogin.cnf`            | 특정 OS 유저에 맞는 login 옵션                               |
  | `*DATADIR*/mysqld-auto.cnf` | 마지막으로 set persist 혹은 set persist_only 에 의해 설정된 파일 |



## 사용예제

```sql
mysql [localhost] {msandbox} ((none)) > select @@global.max_connections;
+--------------------------+
| @@global.max_connections |
+--------------------------+
|                      151 |
+--------------------------+
1 row in set (0.01 sec)

mysql [localhost] {msandbox} ((none)) > set global max_connections=200;
Query OK, 0 rows affected (0.01 sec)


mysql [localhost] {msandbox} ((none)) > select @@global.max_connections;
+--------------------------+
| @@global.max_connections |
+--------------------------+
|                      200 |
+--------------------------+
1 row in set (0.00 sec)


--************ 서버 restart *************

mysql [localhost] {msandbox} ((none)) > select @@global.max_connections;
ERROR 2006 (HY000): MySQL server has gone away
No connection. Trying to reconnect...
Connection id:    8
Current database: *** NONE ***

+--------------------------+
| @@global.max_connections |
+--------------------------+
|                      151 |
+--------------------------+
1 row in set (0.00 sec)

--^^ set global 명령어로 변경된 사항은 my.cnf에 저장되지 않음으로, restart 시 my.cnf에 존재하는 값, 그렇지 않다면 default value로 적용된다.
mysql [localhost] {msandbox} ((none)) > set persist max_connections=200;
Query OK, 0 rows affected (0.01 sec)


mysql [localhost] {msandbox} ((none)) > select @@global.max_connections;
+--------------------------+
| @@global.max_connections |
+--------------------------+
|                      200 |
+--------------------------+
1 row in set (0.00 sec)



--************ 서버 restart *************

mysql [localhost] {msandbox} ((none)) > select @@global.max_connections;
ERROR 2006 (HY000): MySQL server has gone away
No connection. Trying to reconnect...
Connection id:    8
Current database: *** NONE ***

+--------------------------+
| @@global.max_connections |
+--------------------------+
|                      200 |
+--------------------------+
1 row in set (0.00 sec)


--^^ my.cnf 의 max_connections 값을 변경하지 않아도, 재시작시 적용되는것이 확인된다. 해당 이유는 SET PERIST 구문을 사용하여, mysqld-auto.cnf 에 변경내용을 적용하였고, mysqld는 시작시 마지막에 해당 파일을 읽어 변경된 값을 적용하였기 때문이다.


-- 해당 정보는 performance_schema.variables_info 를 통해서 정확히 확인할 수 있다.


mysql 8.0 [localhost] {msandbox} ((none)) > select * from performance_schema.variables_info where VARIABLE_NAME='max_connections'\G
*************************** 1. row ***************************
  VARIABLE_NAME: max_connections
VARIABLE_SOURCE: PERSISTED
  VARIABLE_PATH: /Users/kakaobank/sandboxes/msb_8_0_13/data/mysqld-auto.cnf
      MIN_VALUE: 1
      MAX_VALUE: 100000
       SET_TIME: 2019-03-27 14:07:33.942065
       SET_USER: root
       SET_HOST: localhost
1 row in set (0.00 sec)

mysql 8.0 [localhost] {msandbox} ((none)) > set global max_connections = 300;
Query OK, 0 rows affected (0.00 sec)

mysql 8.0 [localhost] {msandbox} ((none)) > select * from performance_schema.variables_info where VARIABLE_NAME='max_connections'\G
*************************** 1. row ***************************
  VARIABLE_NAME: max_connections
VARIABLE_SOURCE: DYNAMIC
  VARIABLE_PATH:
      MIN_VALUE: 1
      MAX_VALUE: 100000
       SET_TIME: 2019-04-03 14:30:56.295106
       SET_USER: msandbox
       SET_HOST: localhost
1 row in set (0.00 sec)




-- Data Direcoty 에 존재하는 mysqld-auto.cnf 파일을 살펴보면 아래와 같다.
MINCHO-M-B49A6A:data root# cat mysqld-auto.cnf
{ "Version" : 1 , "mysql_server" : { "max_connections" : { "Value" : "200" , "Metadata" : { "Timestamp" : 1544003361487009 , "User" : "msandbox" , "Host" : "localhost" } } } }
```





## 적용범위

- 향후, dynamic 변수를 적용할때는 필요에 따라 (특히 max_connections , *_buffer_size), SET PERIST 구문을 사용하여 변경시간과 변경한 계정에 대해 확인할 수 있다. 이에 대한 장점은 다음과 같다.
  - my.cnf 에 적용하지 않는 실수를 줄일 수 있다.
  - mysqld-auto.cnf 에 기입된 정보를 바탕으로, 어떤 유저가 언제 어떠한 값을 어떻게 변경했는가에 대한 정보를 추적할 수 있다.

- 많은 PATH의 my.cnf 를 사용하는 경우, 간혹 해당 변수가 어디서 세팅되었는지 알기 힘든 경우가 있다. 이때 performance_schema.variables_info 를 조회하여 어디서 세팅되었는지를 확인할 수 있다.
