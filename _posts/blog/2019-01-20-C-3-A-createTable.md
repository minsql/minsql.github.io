---
title: MySQL 8.0 - TABLE 생성시, 변경사항
author: min_cho
created: 2019/01/20
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


------
## Datatype default 값의 변경

- 8.0부터는 BLOB, TEXT, GEOMETRY, JSON Datatype을 가지는 컬럼에 default 값을 부여할 수 있게 되었다.

- 컬럼의 default 값으로 function을 추가하여 사용할 수 있게 되었다. (date 와 timestamp 형식에만 사용될 수 있었던 now, current_timestamp 등을 다른 형식의 data type에서도 사용이 가능하다.

  ```sql
  mysql 8.0 [localhost] {msandbox} (test) > create table tbl (a int, b text default ('no data here'), c varchar(20) default (current_timestamp), d char(36) default (uuid()));
  Query OK, 0 rows affected (0.03 sec)

  --^^ default 값에 괄호를 추가하여, BLOB, TEXT, GEOMETRY, JSON Datatype 에서도 default 값을 추가할 수 있다.

  mysql 8.0 [localhost] {msandbox} (test) > insert into tbl (a) values (1);
  Query OK, 1 row affected (0.09 sec)

  mysql 8.0 [localhost] {msandbox} (test) > select * from tbl;
  +------+--------------+---------------------+--------------------------------------+
  | a    | b            | c                   | d                                    |
  +------+--------------+---------------------+--------------------------------------+
  |    1 | no data here | 2018-12-18 14:23:15 | 056c2362-0285-11e9-b9f4-1436d38009ac |
  +------+--------------+---------------------+--------------------------------------+
  1 row in set (0.00 sec)
  ```



------

## explicit_defaults_for_timestamp default 값 변경 (OFF → ON)

- explicit_defaults_for_timestamp (Non-santadard 형식의 timestamp default 값으로 자동으로 사용할 수 없게 하는지에 대한 여부)변수의 값이 default로 off 에서 on 으로 변경이 되면서, timestamp datatype을 선언할때 주의해야 한다.

- 이로서, 더이상 "왜 default를 지정하지 않았음에도 현재시간이 들어가는가에 대한"논란은 종지부를 찍게 되었다.

- 버젼별 비교

  - 5.7

    ```sql
    mysql 5.7 [localhost] {msandbox} (test) > select @@version, @@global.explicit_defaults_for_timestamp;
    +-----------+------------------------------------------+
    | @@version | @@global.explicit_defaults_for_timestamp |
    +-----------+------------------------------------------+
    | 5.7.24    |                                        0 |
    +-----------+------------------------------------------+
    1 row in set (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > create table test.ts (a int, b timestamp);
    Query OK, 0 rows affected (0.02 sec)

    mysql 5.7 [localhost] {msandbox} (test) > show create table test.ts;
    ...
    | ts    | CREATE TABLE `ts` (
      `a` int(11) DEFAULT NULL,
      `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1 |
    ...
    1 row in set (0.00 sec)

    -- Table 생성시, timestamp 만 선언했지만 자동으로 'NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' 이 속성으로 주어진다.
    ---- 이는 테이블의 첫번째 timestamp에만 적용이되며, 두번째 timestamp에도 속성을 지정하지 않느다면, default 값을 지정하라는 에러가 발생된다.
    ---- e.g. create table test.ts (a int, b timestamp, c timestamp); -> ERROR 1067 (42000): Invalid default value for 'c'


    mysql 5.7 [localhost] {msandbox} (test) > insert into test.ts (a) values (1);
    Query OK, 1 row affected (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > select * from test.ts;
    +------+---------------------+
    | a    | b                   |
    +------+---------------------+
    |    1 | 2018-12-19 09:55:47 |
    +------+---------------------+
    1 row in set (0.00 sec)
    ```

  - 8.0

    ```sql

    mysql 8.0 [localhost] {msandbox} (test) > select @@version, @@global.explicit_defaults_for_timestamp;
    +-----------+------------------------------------------+
    | @@version | @@global.explicit_defaults_for_timestamp |
    +-----------+------------------------------------------+
    | 8.0.13    |                                        1 |
    +-----------+------------------------------------------+
    1 row in set (0.00 sec)

    mysql 8.0 [localhost] {msandbox} (test) > create table test.ts (a int, b timestamp);
    Query OK, 0 rows affected (0.10 sec)

    mysql 8.0 [localhost] {msandbox} (test) > show create table test.ts;
    ...
    | ts    | CREATE TABLE `ts` (
      `a` int(11) DEFAULT NULL,
      `b` timestamp NULL DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci |
    ...
    1 row in set (0.00 sec)

    -- Table 생성시, timestamp 만 선언했다면 자동으로 'NULL DEFAULT NULL' 이 속성으로 주어진다. 이는 explicit_defaults_for_timestamp=0 일때,  create table test.ts (a int, b timestamp null); 로 설정하는것과 동일하다.


    mysql 8.0 [localhost] {msandbox} (test) > insert into test.ts (a) values (1);
    Query OK, 1 row affected (0.10 sec)

    mysql 8.0 [localhost] {msandbox} (test) > select * from test.ts;
    +------+------+
    | a    | b    |
    +------+------+
    |    1 | NULL |
    +------+------+
    1 row in set (0.00 sec)
    ```



- **<u>5.7과 같은 행동을 사용하기 위해서는 explicit_defaults_for_timestamp 의 값을 OFF 로 사용해야 한다.</u>**

  - https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_explicit_defaults_for_timestamp
