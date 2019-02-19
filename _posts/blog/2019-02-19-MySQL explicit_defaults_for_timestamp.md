---
title: MySQL explicit_defaults_for_timestamp
author: min_kim
created: 2019/02/19
modified:
layout: post
tags: mysql mysql_variables
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---
 
# explicit_defaults_for_timestamp 에 대해서
> [Warning] TIMESTAMP with implicit DEFAULT value is deprecated. Please use --explicit_defaults_for_timestamp server option (see documentation for more details).
> 이런 로그를 mysql error log에서 만난적이 있다면 참고하세요.

## Default Value: OFF
## 설명
* TIMESTAMP 컬럼의 default 속성을 제어하는 옵션이다.
  * OFF라면, 
    - nullable로 선언되지 않았다면, 자동으로 NOT NULL로 선언된다. 
    - NULL을 인서트하면, 자동으로 current timestamp가 들어간다.
    - 테이블의 첫 TIMESTAMP 컬럼이 nullable로 선언되지 않았고, default값이나, on update 속성이 선언되지 않았다면, 자동으로 DEFAULT CURRENT_TIMESTAMP and ON UPDATE CURRENT_TIMESTAMP 속성이 선언된다.
    - 두번째 TIMESTAMP컬럼부터는,  nullable로 선언되지 않았고, default값이 선언되지 않았다면, 자동으로 DEFAULT '0000-00-00 00:00:00'로 선언된다. data insert시에 warning나오지 않는다.
    
```
root@localhost:test 12:27:45>create table timestamptest ( no int auto_increment primary key, b timestamp, c timestamp);
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 12:28:29>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `c` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)

root@localhost:test 12:45:30>insert into timestamptest(no) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:45:37>insert into timestamptest(b) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:45:41>insert into timestamptest(c) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:45:44>select * from timestamptest;
+----+---------------------+---------------------+
| no | b                   | c                   |
+----+---------------------+---------------------+
|  1 | 2019-02-19 12:45:37 | 0000-00-00 00:00:00 |
|  2 | 2019-02-19 12:45:41 | 0000-00-00 00:00:00 |
|  3 | 2019-02-19 12:45:44 | 2019-02-19 12:45:44 |
+----+---------------------+---------------------+
3 rows in set (0.00 sec)

```

- - - strict SQL mode나  NO_ZERO_DATE SQL mode 를 사용한다면,  '0000-00-00 00:00:00'은 invalid한 것으로 주의해야한다.
    
```

root@localhost:test 12:45:57>set sql_mode='traditional';
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 12:47:43>truncate table timestamptest;
Query OK, 0 rows affected (0.12 sec)

root@localhost:test 12:47:48>insert into timestamptest(no) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:47:50>insert into timestamptest(c) values('0000-00-00 00:00:00');
ERROR 1292 (22007): Incorrect datetime value: '0000-00-00 00:00:00' for column 'c' at row 1
root@localhost:test 12:47:52>select * from timestamptest;
+----+---------------------+---------------------+
| no | b                   | c                   |
+----+---------------------+---------------------+
|  1 | 2019-02-19 12:47:50 | 0000-00-00 00:00:00 |
+----+---------------------+---------------------+
1 row in set (0.00 sec)

```

- - - default로 선언된 zero date는 waring이나 error 없이 들어간다. 그런데 직접 zero date를 인서트하는 것은 sql_mode에 의해서 error가 된다. 
* * ON이라면,
    - TIMESTAMP컬럼 속성을 명시하지 않았을때, 혹은 NULL을 인서트했을 때, current timestamp를 자동으로 할당하지 않는다. current timestamp 사용하려면 `NOT NULL DEFAULT CURRENT_TIMESTAMP`를 사용해야한다.
    - TIMESTAMP컬럼이 NOT NULL로 명시되었다면 NULL insert를 허용하지 않는다. 
    - zero date의 인서트동작은 SQL mode에 따른다.
```
root@localhost:test 12:48:00>set explicit_defaults_for_timestamp = 1;
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 12:49:34>drop table timestamptest;
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 12:49:51>create table timestamptest ( no int auto_increment primary key, b timestamp, c timestamp);
Query OK, 0 rows affected (0.01 sec)

root@localhost:test 12:49:52>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NULL DEFAULT NULL,
  `c` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)

root@localhost:test 12:50:02>drop table timestamptest;
Query OK, 0 rows affected (0.03 sec)

root@localhost:test 12:51:29>create table timestamptest ( no int auto_increment primary key, b timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, c timestamp NOT NULL DEFAULT '0000-00-00 00:00:00');
Query OK, 0 rows affected (0.01 sec)

root@localhost:test 12:51:31>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `c` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)

root@localhost:test 12:52:26>insert into timestamptest(no) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:52:48>insert into timestamptest(b) values(null);
ERROR 1048 (23000): Column 'b' cannot be null

```
- - - NOT NULL에 default값을 선언하지 않았다면, default값은 SQL mode에 따라 다르다.
      - strict mode라면, ERROR
      - strict mode가 아니면 '0000-00-00 00:00:00' and warning
      
```
root@localhost:test 12:57:37>create table timestamptest ( no int auto_increment primary key, b timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, c timestamp NOT NULL);
Query OK, 0 rows affected (0.05 sec)

root@localhost:test 12:58:01>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `c` timestamp NOT NULL,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)

root@localhost:test 13:00:47>set sql_mode='traditional';
Query OK, 0 rows affected, 1 warning (0.00 sec)

Warning (Code 3090): Changing sql mode 'NO_AUTO_CREATE_USER' is deprecated. It will be removed in a future release.
root@localhost:test 13:00:54>insert into timestamptest(no) values(null);
ERROR 1364 (HY000): Field 'c' doesn't have a default value
```



