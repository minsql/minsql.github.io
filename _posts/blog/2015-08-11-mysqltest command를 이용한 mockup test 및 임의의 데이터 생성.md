---
title: mysqltest command를 이용한 mockup test 및 임의의 데이터 생성
author: min_cho
created: 2015/08/11 21:14:19
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

# mysqltest command를 이용한 mockup test 및 임의의 데이터 생성

### 개요

여러가지 테스트를 진행하기 위해 MySQL에 dummy data를 생성하고 성능을 측정하거나 문제점을 찾는것은 여간 귀찮은일이 아닐 수 없다.

  * 일반적으로 대량의 데이터를 만들기 위해서는 아래와 같은 코드를 생성하여 반복적으로 화살표와 엔터로 실행을 하거나

```sql
    mysql> insert into test.xxx values(1);
    mysql> insert into test.xxx select * from test.xxx;
    mysql> insert into test.xxx select * from test.xxx;
    mysql> insert into test.xxx select * from test.xxx;
    ...
```

  * SQL로 된 script를 만들어 mysql client tool을 통해 밀어 넣거나
  * procedure를 만드는 방법도 있지만 역시나 귀찮다.
이런경우, 간단하게 mysqltest를 사용해보자. mysqltest는 잘 사용되지 않는 util이지만, 알아두면 너무나도 편하게 작업할 수 있다. mockup 테스트는 물론이고 원하는 형식의 대량의 데이터를 만들어내거나, 임의로 error를 내거나 여러개의 connection source를 만들어 작업할 수도 있다. 이와같이 mysqltest는 엄청난 기능들을 제공한다. 해당 명령어를 알아두면 귀찮은일을 많이 줄일 수도 있다. 해당 command는 아주 오래전부터 있었지만, 많은 사람들이 존재 자체를 모르고 있다. 여기서는 간단한 test를 소개한다.

### 예제

  * 일반적인 sql은 그냥 써주면 된다.
  * shell 문법을 이용하여, 필요한 sql구문을 만들어 실행할 수 있다. 자세한것은 아래 reference를 확인하자.
  * 아래 예제는 단순하게 테이블을 하나 만들고, 0을 집어넣은 후 loop를 돌려 20에서 1까지 집어넣는 간단한 예제이다.

```sql
    [root@testvm1 ~]# cat z
    create table if not exists test.mysqltest ( a int);
    truncate table test.mysqltest;
    start transaction;
    INSERT INTO test.mysqltest VALUES (0);
    commit;

    set autocommit = 1;


    let $i=20;
    while($i)
    {
      eval INSERT INTO test.mysqltest VALUES ($i);
      dec $i;
    }


    [root@testvm1 ~]# /db/5.6/bin/mysqltest < z
    create table if not exists test.mysqltest ( a int);
    Warnings:
    Note    1050    Table 'mysqltest' already exists
    truncate table test.mysqltest;
    start transaction;
    INSERT INTO test.mysqltest VALUES (0);
    commit;
    set autocommit = 1;
    INSERT INTO test.mysqltest VALUES (20);
    INSERT INTO test.mysqltest VALUES (19);
    INSERT INTO test.mysqltest VALUES (18);
    INSERT INTO test.mysqltest VALUES (17);
    INSERT INTO test.mysqltest VALUES (16);
    INSERT INTO test.mysqltest VALUES (15);
    INSERT INTO test.mysqltest VALUES (14);
    INSERT INTO test.mysqltest VALUES (13);
    INSERT INTO test.mysqltest VALUES (12);
    INSERT INTO test.mysqltest VALUES (11);
    INSERT INTO test.mysqltest VALUES (10);
    INSERT INTO test.mysqltest VALUES (9);
    INSERT INTO test.mysqltest VALUES (8);
    INSERT INTO test.mysqltest VALUES (7);
    INSERT INTO test.mysqltest VALUES (6);
    INSERT INTO test.mysqltest VALUES (5);
    INSERT INTO test.mysqltest VALUES (4);
    INSERT INTO test.mysqltest VALUES (3);
    INSERT INTO test.mysqltest VALUES (2);
    INSERT INTO test.mysqltest VALUES (1);
    ok

    --- MySQL 에 접속 후 데이터 확인
    ONE> select * from test.mysqltest;
    +------+
    | a    |
    +------+
    |    0 |
    |   20 |
    |   19 |
    |   18 |
    |   17 |
    |   16 |
    |   15 |
    |   14 |
    |   13 |
    |   12 |
    |   11 |
    |   10 |
    |    9 |
    |    8 |
    |    7 |
    |    6 |
    |    5 |
    |    4 |
    |    3 |
    |    2 |
    |    1 |
    +------+
    21 rows in set (0.01 sec)
```

### Reference

* 개요 : <http://dev.mysql.com/doc/mysqltest/2.0/en/mysqltest-reference.html>
* 어떻게 실행하는가? : <http://dev.mysql.com/doc/mysqltest/2.0/en/mysqltest.html>
* 어떤 명령어가 있는가? : <http://dev.mysql.com/doc/mysqltest/2.0/en/mysqltest-commands.html>
