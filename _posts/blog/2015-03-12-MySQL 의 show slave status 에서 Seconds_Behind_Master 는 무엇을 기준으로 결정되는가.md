---
title: MySQL 의 show slave status 에서 Seconds_Behind_Master 는 무엇을 기준으로 결정되는가
author: min_cho
created: 2015/03/12 19:10:31
modified:
layout: post
tags: mysql mysql_replication
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL 의 show slave status 에서 Seconds_Behind_Master 는 무엇을 기준으로 결정되는가?

## show slave status에 나타나는 값은 아래와 같이 계산됩니다

> (가장 최근에 가져온 I/O Thread 의 timestamp - 가장 마지막에 적용한 SQL Thread의 timestamp 값)

으로 계산됩니다. 이와 같은 이유로, master에서 더이상 DML이 실행되지 않는다면 slave에서 아무런 작업이 일어나지 않습니다. 그럼으로 해당 값이 0 으로 유지 됩니다. master에서 DML이 실행되지 않았다고 해서, Seconds_Behind_Master 의 값이 늘어나면 안되기 때문입니다. 대부분의 경우, I/O thread가 master에서 binlog를 가져와 slave 의 relay log로 만드는 시간보다 sql thread가 해당 relay log를 가져와 sql 로 적용시키는 시간이 더 짧기 때문에 문제가 없지만, 아주 간혹 네트워크 문제로 인하여 I/O thread가 늦는경우는 해당값이 약간 왜곡될 수도 있습니다. master것을 다 적용하지 않았음에도, I/O thread가 가져온것은 다 적용했다고 해당값을 0으로 보여주는 경우가 있을 수 있겠죠.

## 두번째 show processlist에 나타나는 sql thread의 time은

> (서버의 현재 timestamp - 가장 마지막에 적용한 SQL Thread의 timestamp 값)

으로 계산됩니다. 그로인하여, master에서 더이상 DML이 실행되지 않고 slave에서 아무런 작업을 하지 않는다면, 해당 값이 조회할때 마다 증가값을 나타내게 될 것입니다. 간단한 테스트를 해보면, (slave의 시간을 인위적으로 master 보다 빠르게 조작하였습니다. processlist 의 값은 큰값을 나타낼테지만, show slave status의 second behind master 는 0을 나타낼 것입니다) \--------------------------------------------------------------


    --- master와 slave에서 동시에 insert를 진행하고 확인해봅니다. (해당 table은 unique가 아니기 때문에 잘 들어가겠죠...)
    master > insert into ttt values (1); select now(),UNIX_TIMESTAMP();
    Query OK, 1 row affected (0.00 sec)

    +---------------------+------------------+
    | now()               | UNIX_TIMESTAMP() |
    +---------------------+------------------+
    | 2014-12-19 07:31:15 |       1418934675 |
    +---------------------+------------------+
    1 row in set (0.00 sec)


    slave> insert into ttt values (1); select now(),UNIX_TIMESTAMP(); show processlist;
    Query OK, 1 row affected (0.08 sec)

    +---------------------+------------------+
    | now()               | UNIX_TIMESTAMP() |
    +---------------------+------------------+
    | 2014-12-21 04:14:56 |       1419095696 |
    +---------------------+------------------+
    1 row in set (0.00 sec)

    +----+-------------+-----------+------+---------+--------+----------------------------------+------------------+
    | Id | User        | Host      | db   | Command | Time   | State                            | Info             |
    +----+-------------+-----------+------+---------+--------+----------------------------------+------------------+
    | 95 | root        | localhost | test | Query   |      0 | init                             | show processlist |
    | 97 | system user |           | NULL | Connect | 161021 | System lock                      | NULL             |
    | 98 | system user |           | NULL | Connect |   2863 | Waiting for master to send event | NULL             |
    +----+-------------+-----------+------+---------+--------+----------------------------------+------------------+
    3 rows in set (0.00 sec)

    --- sql thread 의 time이 161021 를 나타냅니다.  slave의 timestamp 값과 master로 부터 받은 relay log의 timestamp값의 차이입니다.

    slave> select 1419095696-1418934675;
    +-----------------------+
    | 1419095696-1418934675 |
    +-----------------------+
    |                161021 |
    +-----------------------+
    1 row in set (0.00 sec)


    slave> show slave statusG
    *************************** 1. row ***************************
    ...
            Seconds_Behind_Master: 0
    ...



    -- master에서 아무런 작업을 하지않고, 몇분후 해당 time이 계속 증가되는것을 확인할 수 있습니다. 161021 -> 161362

    slave> show processlist;
    +----+-------------+-----------+------+---------+--------+-----------------------------------------------------------------------------+------------------+
    | Id | User        | Host      | db   | Command | Time   | State                                                                       | Info             |
    +----+-------------+-----------+------+---------+--------+-----------------------------------------------------------------------------+------------------+
    | 95 | root        | localhost | test | Query   |      0 | init                                                                        | show processlist |
    | 97 | system user |           | NULL | Connect | 161362 | Slave has read all relay log; waiting for the slave I/O thread to update it | NULL             |
    | 98 | system user |           | NULL | Connect |   3204 | Waiting for master to send event                                            | NULL             |
    +----+-------------+-----------+------+---------+--------+-----------------------------------------------------------------------------+------------------+

    1 row in set (0.00 sec)


    --- 하지만  Seconds_Behind_Master의 값은 그대로 입니다. 그이유는 master에 작업이 없었음으로 I/O thread가 relay log에 새로운 값을 넣지 않았기 때문입니다.

    slave> show slave statusG
    *************************** 1. row ***************************
    ...
            Seconds_Behind_Master: 0
    ...

참고로 show porcesslist에 보여지는 I/O thread의 time은 replication이 연결된 시간을 의미합니다. 위의 예제에서 값이 3204라면, 해당 slave는 master와 연결된지 3204초가 지났다는 의미입니다.
