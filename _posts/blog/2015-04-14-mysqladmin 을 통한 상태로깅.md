---
title: mysqladmin 을 통한 상태로깅
author: min_cho
created: 2015/04/14 19:21:55
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


# mysqladmin 을 통한 상태로깅

### mysqladmin 을 이용하여 장애시 해당 상황을 로깅하자.

  * 지금 서버에 문제가 있다고 가정하자... 어떻게 모니터링을 할 것인가... os 에서는 iostat 혹은 vmstat등으로 cpu, memory, io 를 모니터링 하겠지만 MySQL에서는 show proceslist 를 치면서 계속 모니터링하기도 힘든일이다. 이러한 경우 mysqladmin을 이용해보자.
    * <http://dev.mysql.com/doc/refman/5.6/en/mysqladmin.html>
    * 물론 mysqladmin은 shutdown 말고도 다양한 옵션을 이용할 수 있다.


    mysqladmin processlist status extended-status -uroot -pxxx --sleep=10 --count=1000 --relative


MySQL 에 대한 정보를 10초에 한번씩 1000번 뽑아내라는 명령어이다. relative 는 sleep 과 extended-status 옵션과 함께 사용하면 앞의 status 결과를 바탕으로 현재값과의 차이를 나타낸다. MySQL에 문제가 발생하면, 해당 스크립트를 통해 로깅을 시작하고 해당 파일을 이용하면 장애상황 분석시 용이한 자료로 사용할 수 있다. 이는 다음과 같이 간단하게 쓸 수 있다.


    /db/5.6/bin/mysqladmin proc stat ext -uroot -pxxx -i10 -c10000 -r



    -- processlist : processlist 를 보여준다.
    +----+------+-----------+----+---------+------+-------+------------------+
    | Id | User | Host      | db | Command | Time | State | Info             |
    +----+------+-----------+----+---------+------+-------+------------------+
    | 39 | root | localhost |    | Query   | 0    | init  | show processlist |
    +----+------+-----------+----+---------+------+-------+------------------+

    -- status : 현재 MySQL 의 상태를 보여준다.
    Uptime: 105298  Threads: 1  Questions: 208  Slow queries: 0  Opens: 98  Flush tables: 2  Open tables: 30  Queries per second avg: 0.001

    -- extended-status : show global status 값을 보여준다.
    +-----------------------------------------------+-------------+
    | Variable_name                                 | Value       |
    +-----------------------------------------------+-------------+
    | Aborted_clients                               | 15          |
    | Aborted_connects                              | 1           |
    | Binlog_cache_disk_use                         | 0           |
    | Binlog_cache_use                              | 0           |
    | Binlog_stmt_cache_disk_use                    | 0           |
    | Binlog_stmt_cache_use                         | 0           |
    | Bytes_received                                | 14267       |
    | Bytes_sent                                    | 260123      |
    | Com_admin_commands                            | 0           |
    | Com_assign_to_keycache                        | 0           |
    .....

    -- relative : 앞에서 뽑아낸 global status 의 값과 현재 값을 비교하여 뽑아낸다.
    -- 두번째 등장하는 extended-status 의 값
    +-----------------------------------------------+-------------+
    | Variable_name                                 | Value       |
    +-----------------------------------------------+-------------+
    | Aborted_clients                               | 0           |
    | Aborted_connects                              | 0           |
    | Binlog_cache_disk_use                         | 0           |
    | Binlog_cache_use                              | 0           |
    | Binlog_stmt_cache_disk_use                    | 0           |
    | Binlog_stmt_cache_use                         | 0           |
    | Bytes_received                                | 61          |
    | Bytes_sent                                    | 9734        |
    | Com_admin_commands                            | 0           |
    | Com_assign_to_keycache                        | 0           |
    .....


### 추가적인 Tip

갑자기 생각난것이 있는데... show global status 시 0이나 의미 없는값 모두 보여주기에 너무 많은 값을 보여준다. 이는 아래의 명령어를 통해 제거할 수 있다. 물론 해당 포스트의 내용이 적어 갑자기 생각난것은 아니다...후후 show global status where value; 를 통하여 0이나 String 값을 제거해보자.


    mysql> show global status;
    +-----------------------------------------------+-------------+
    | Variable_name                                 | Value       |
    +-----------------------------------------------+-------------+
    | Aborted_clients                               | 18          |
    | Aborted_connects                              | 1           |
    | Binlog_cache_disk_use                         | 0           |
    | Binlog_cache_use                              | 0           |
    .....
    341 rows in set (0.00 sec)


    -- 0 이나 integer 가 아닌값을 제거한다.
    mysql> show global status where value;
    +-----------------------------------+----------+
    | Variable_name                     | Value    |
    +-----------------------------------+----------+
    | Aborted_clients                   | 20       |
    | Aborted_connects                  | 1        |
    | Bytes_received                    | 16952    |
    | Bytes_sent                        | 420572   |
    94 rows in set, 16 warnings (0.01 sec)

    mysql> show warnings;
    +---------+------+--------------------------------------------------+
    | Level   | Code | Message                                          |
    +---------+------+--------------------------------------------------+
    | Warning | 1292 | Truncated incorrect INTEGER value: 'OFF'         |
    | Warning | 1292 | Truncated incorrect INTEGER value: 'not started' |
    | Warning | 1292 | Truncated incorrect INTEGER value: 'not started' |
    | Warning | 1292 | Truncated incorrect INTEGER value: 'ON'          |
    | Warning | 1292 | Truncated incorrect INTEGER value: '0.000000'    |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    | Warning | 1292 | Truncated incorrect INTEGER value: 'OFF'         |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    | Warning | 1292 | Truncated incorrect INTEGER value: 'NONE'        |
    | Warning | 1292 | Truncated incorrect INTEGER value: ''            |
    +---------+------+--------------------------------------------------+

    -- warning은 위와 같은데... 무시할 수 있다. warning을 확인하니, show global status의 value 값을 integer value로 바꾸고 해당값이 0이면 찍어내지 않는것 같다.
    -- show global status where value <> 0; 위와 같이 사용하는것이 더 괜찮은 방법일 수도 있겠다.
