---
title: MySQL Audit 사용하기
author: min_cho
created: 2015/07/21 20:33:24
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



# MySQL Audit 사용하기

## 1\. Plugin file 확인

  * audit log plugin(audit_log) library object file이 MySQL plugin directory에 위치하는지 확인
  * Community version을 사용한다면, Enterprise edition을 받아 해당 library directory에서 audit_log.so를 복사한 후 Community version의 library directory에 넣어 사용할 수 있다.

## 2\. Plugin load

  * my.cnf 에 명시하고 restart 하는 방법
    * my.cnf의 [mysqld] 섹션에 아래와 같이 명시해주거나 startup comman-line에서 --plugin-load 을 사용한다.
    * restart시 plugin-load 명시해주지 않으면 load하지 않는다.
    * mysql 에 접속하여 show plugin 명령어를 통해 해당 plugin의 상태를 확인할 수 있다.

```
    [mysqld]
    plugin-load=audit_log.so

    -- MySQL Restart
    mysql> show plugins;
    +----------------------------+----------+--------------------+--------------+-------------+
    | Name                       | Status   | Type               | Library      | License     |
    +----------------------------+----------+--------------------+--------------+-------------+
    ...
    | audit_log                  | ACTIVE   | AUDIT              | audit_log.so | PROPRIETARY |
    +----------------------------+----------+--------------------+--------------+-------------+
```

  * INSTALL PLUGIN문으로 인스톨하는 방법
    * mysql 에 접속하여 아래의 명령어로 활성화 시킬 수 있다.

        ```mysql> INSTALL PLUGIN audit_log SONAME 'audit_log.so';```


    * mysql.plugin 테이블에 해당 plugin을 등록하고 restart시에도 load된다.

## 3\. Audit log file 관련 옵션

  * audit log file : audit.log
  * audit log format : OLD(default) 와 NEW 를 쓸 수 있다.
    * NEW format은 5.6.14부터 생겼고, Oracle Audit Vault와의 나은 호환성을 가짐.
    * 뒤에 이야기 하겠지만, MySQL table에 넣고 분석할 경우, OLD 포맷만이 가능하다. 현재 bug로 fix 중에 있다. 2015-07-21
  * audit_log_strategy :` ASYNCHRONOUS(default) | PERFORMANCE | SEMISYNCHRONOUS | SYNCHRONOUS`
    * ASYNCHRONOUS : asynchronously, buffer가 다 차면 쓴다. minimal impact
    * PERFORMACE : asynchronously, buffer가 부족해지면 쓴다.
    * SEMISYNCHRONOUS : synchronously, 즉각 OS 캐시에 씀, 캐시에서 내려쓰는건 OS에 맡김.
    * SYNCHRONOUS : synchronously, 매 write request마다 call sync()
  * audit_log_buffer_size : async방식일 때만 이만큼 buffer할당
  * audit_log_rotate_on_size, audit_log_flush : rotation, flush 관련 옵션

### 4\. Audit Log

  * 해당 파일은 default 로 datadir 아래 audit.log라는 이름으로 생성된다.
  * 물론 에러가 난 명령어까지도 STATUS_CODE를 통해 audit한다.
    * <https://dev.mysql.com/doc/refman/5.6/en/audit-log-file.html>

```
     <AUDIT_RECORD TIMESTAMP="2015-06-16T09:20:17 UTC" RECORD_ID="307_2015-06-16T08:23:17" NAME="Query" CONNECTION_ID="60" STATUS="1064" STATUS_CODE="1" USER="root[root] @ localhost []" OS_LOGIN="" HOST="localhost" IP="" COMMAND_CLASS="grant" SQLTEXT="grant all on *.* to 'dba'@'%' indentified by 'dba'"/>
     <AUDIT_RECORD TIMESTAMP="2015-06-16T09:21:01 UTC" RECORD_ID="308_2015-06-16T08:23:17" NAME="Query" CONNECTION_ID="60" STATUS="0" STATUS_CODE="0" USER="root[root] @ localhost []" OS_LOGIN="" HOST="localhost" IP="" COMMAND_CLASS="grant" SQLTEXT="GRANT ALL PRIVILEGES ON *.* TO 'dba'@'%' IDENTIFIED BY PASSWORD '*381AD08BBFA647B14C82AC1094A29AD4D7E4F51D'"/>
```

### 5\. Audit Log Filtering

  * 계정별 filtering
    * 가장 요구사항이 많았던 기능으로 5.6.20 부터 지원된다.
    * <https://dev.mysql.com/doc/refman/5.6/en/audit-log-plugin-options-variables.html#sysvar_audit_log_include_accounts>
    * audit_log_include_accounts : 명시한 계정만 audit
    * audit_log_exclude_accounts : 명시한 계정 이외의 계정들 audit
    * 다음과 같이 user_name@host_name format으로 명시한다. mysql> SET GLOBAL audit_log_include_accounts = 'user1@localhost,user2@localhost';
    * 5.6.23 까지는 해당 옵션과 관계없이 모든유저의 접속 및 quit한 로그가 나타났지만, 5.6.24부터는 설정된 유저만 나타나게 된다.
    * 지속적인 적용을 위해 my.cnf에 해당 옵션을 명시한다. [mysqld] audit_log_include_accounts=dba@localhost,dba@%
  * command 별 filtering
    * audit_log_policy :` ALL | LOGINS | QUERIES | NONE` 로 나누어 적용할 수 있다.
    * <https://dev.mysql.com/doc/refman/5.6/en/audit-log-plugin-options-variables.html#sysvar_audit_log_policy>

### 6\. Audit file rotate 시키기

  * audit_log_rotate_on_size 설정
    * <https://dev.mysql.com/doc/refman/5.6/en/audit-log-plugin-options-variables.html#sysvar_audit_log_rotate_on_size>
    * 지정된 사이즈만큼 커지고 넘어가게 되면 timestamp의 값을 추가하여 아카이빙한다.
    * default 는 0으로 audit 파일은 계속 커진다.
  * 수동 설정
    * 먼저 해당 테이블로 저장하기위해는 온전한 파일이어야 한다. 수동으로 해당 파일을 분리해보자.
    * mv로 옮겨도 file descriptor를 mysql이 가지고 있기 때문에 지속적으로 변경된 파일에 쓰게 된다.

        ## MySQL 의 Data Home Directory는 /data1/5.6/data 로 설정되어 있다.
    ```SHELL> mv /data1/5.6/data/audit.log  /data1/5.6/data/audit.log.bak
```

    * audit log를 flush 한다.
    * 기존의 /data1/5.6/data/audit.log.bak 에 대해서는 닫고 새로운 /data1/5.6/data/audit.log 을 열게 된다.

        ```mysql> SET GLOBAL audit_log_flush = 1;```


### 7\. Audit 파일 테이블로 저장하기

  * table을 만들고, LOAD XML을 통해 올려보자.
    * 해당 /data1/5.6/data/audit.log.bak 을 테이블로 넣어보자. 물론 mv로 해당 파일을 바꾸지 않고 쓰고 있는 파일에 대하여 넣어도 상관없다.
    * 중복을 방지하기 위해 UNIQUE U_RECORD_ID 를 추가했다.
    * 필요한 business logic에 맞춰 테이블의 인덱스를 추가해서 넣자.

```
mysql> CREATE TABLE audit_log_to_table (
    id bigint PRIMARY KEY auto_increment,
    TIMESTAMP timestamp,
    CONNECTION_ID bigint,
    USER varchar(128),
    HOST varchar(128),
    IP varchar(25),
    OS_LOGIN varchar(64),
    RECORD_ID varchar(64),
    NAME varchar(64),
    STATUS int,
    STATUS_CODE int,
    COMMAND_CLASS varchar(64),
    SQLTEXT longtext,
    UNIQUE U_RECORD_ID (RECORD_ID)
    ) DEFAULT CHARSET utf8mb4;

mysql> LOAD XML LOCAL INFILE '/data1/5.6/data/audit.log.bak'
     INTO TABLE audit_log_to_table
     CHARACTER SET utf8mb4
     ROWS IDENTIFIED BY ''
    (@TIMESTAMP, CONNECTION_ID, USER, HOST, IP, OS_LOGIN, RECORD_ID, NAME, STATUS, STATUS_CODE, COMMAND_CLASS, SQLTEXT)
    SET TIMESTAMP = CONVERT_TZ(STR_TO_DATE(@TIMESTAMP, '%Y-%m-%dT%H:%i:%s UTC'), 'UTC', '+9:00');
```
