---
title: mysqlfailover , mysqlreplicate , mysqlrpladmin 를 이용한 MySQL HA 자동 failover 및 수동 failback
author: min_cho
created: 2015/03/16 20:28:53
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


# mysqlfailover , mysqlreplicate , mysqlrpladmin 를 이용한 MySQL HA 자동 failover 및 수동 failback

## 1\. 준비사항

### Master 1대 slave n대

  * 서버 여러대 만들기 귀찮아서 mysql_multi로 진행함. mysql_multi는 나중에 정리하겠음!

### MySQL utilities

  * python 소스로 되어있다. 아래와 같이 설치해도 되고 complie된 소스받아서 PATH지정해도 된다. python 자신있으면 수정해도 된다! (페이지 참고)

### GTID 설정

  * 각 서버에서 실행된 transaction 순서를 체크하고 적용하기 위함.


    my.cnf
    [mysqld]
    master-info-repository=TABLE
    log-bin=mysql-bin
    log-slave-updates
    gtid-mode=ON
    enforce-gtid-consistency


### 참고

  * 기본적으로 서버에 접속하기 위해 --master=root:password@localhost:3366 이런 형식으로 쓰거나, login-path를 이용하자! password를 눈에 안띄게 하려면, login-path를 사용하면 된다.
    * 하지만 귀찮아서 이 예제에서는 root의 password를 없애버렸다! --master=root@localhost:3301 이렇게 접속할거임.
    * WARNING: Using a password on the command line interface can be insecure. 이 경고가 나오지 않게 하기 위해서는 login-path가 필요하다! 아래를 참고하자. [MySQL login-path](/mysql/mysql-login-path/)

## 2\. 필요한 MySQL utilities 의 간단한 소개

### mysqlfailover

가장 핵심적인 유틸로서, 서버가 죽었는지 살았는지를 체크하고 죽거나 문제가 생겼다면 자동으로 failover를 해주는 유틸


    예제 - SHELL) mysqlfailover --master=root@localhost:3301 --slave=root@localhost:3302,root@localhost:3303 --candidates=root@localhost:3302 --daemon=start --pidfile=/tmp/mysqlFailover.pid --log=/tmp/mysqlFailover.log failover


http://dev.mysql.com/doc/mysql-utilities/1.5/en/mysqlfailover.html

  * failover 문제가 생기면 failover를 실행하라!
    * \--master 는 이렇게 접속해라!
    * \--slave slave들은 이렇게 접속해라! (,로 연결)
    * \--candidates master가 장애나면 이놈들 중의 한놈을 master로 승격시켜라! (,로 연결)
    * \--daemon 데몬을 통해 돌리겠다!
    * \--pidfile process id는 요걸로 쓰겠다! (failover를 stop 하는경우에 필요)
    * \--log= 로그는 요기다가 저장할꺼다!

### mysqlrpladmin

해당 유틸은 마스터의 계획된 작업으로 slave를 master로 승격시키거나, 이미 failover 된 master를 원래 상태로 원복하는 switchover 하는 유틸


    예제 - SHELL) mysqlrpladmin --master=root@localhost:3302 --slave=root@localhost:3301,root@localhost:3303 --new-master=root@localhost:3301 --demote-master --rpl-user=rpl:rpl  switchover


http://dev.mysql.com/doc/mysql-utilities/1.5/en/mysqlrpladmin.html

  * switchover 스위치오바 할꺼다!
    * \--master 는 이렇게 접속해라!
    * \--slave slave들은 이렇게 접속해라! (,로 연결)
    * \--new-master 새로운 master는 이놈이다!
    * \--demote-master 기존의 쓰던 master를 slave로 내려라!
    * \--rpl-user replication 연결에 필요한 유저는 이놈을 써라!

#### mysqlreplicate

mysql replication을 자동으로 만들어주는주는 유틸


    예제 ) SHELL> mysqlreplicate --master=root@localhost:3302 --slave=root@localhost:3301 --rpl-user=rpl:rpl
    http://dev.mysql.com/doc/mysql-utilities/1.5/en/mysqlreplicate.html


  * \--master master는 이렇게 접속해라!
    * \--slave slave는 이렇게 접속해라!
    * \--rpl-user replication 연결에 필요한 유저는 이놈을 써라!

##  3\. failover 예제

  * mysqlfailover 를 다음의 옵션으로 띄운다. --daemon, --pidfile=, --log options

```
    [mysql@testvm_multi db]$ mysqlfailover --master=root@localhost:3301 --slave=root@localhost:3302,root@localhost:3303 --candidates=root@localhost:3302 --daemon=start --pidfile=/tmp/mysqlFailover.pid --log=/tmp/mysqlFailover.log failover
    WARNING: Using a password on the command line interface can be insecure.
    NOTE: Log file '/tmp/mysqlFailover.log' does not exist. Will be created.
    Starting failover daemon...

    [mysql@testvm_multi db]$ tail -f /tmp/mysqlFailover.log
    2014-12-18 08:28:45 AM INFO Failover daemon started.
    2014-12-18 08:28:45 AM INFO Failover mode = auto.
    2014-12-18 08:28:48 AM INFO Master Information
    2014-12-18 08:28:48 AM INFO Binary Log File: mysql-bin.000014, Position: 383, Binlog_Do_DB: N/A, Binlog_Ignore_DB: N/A
    2014-12-18 08:28:48 AM INFO GTID Executed Set: a6d8cd08-83e3-11e4-a438-080027bb031f:1-86:88-94:96-419[...]
    2014-12-18 08:28:48 AM INFO Getting health for master: localhost:3301.
    2014-12-18 08:28:48 AM INFO Health Status:
    2014-12-18 08:28:48 AM INFO host: localhost, port: 3301, role: MASTER, state: UP, gtid_mode: ON, health: OK
    2014-12-18 08:28:48 AM INFO host: localhost, port: 3302, role: SLAVE, state: UP, gtid_mode: ON, health: OK
    2014-12-18 08:28:48 AM INFO host: localhost, port: 3303, role: SLAVE, state: UP, gtid_mode: ON, health: OK
```

  * 기존에 쓰던 Master를 내리고 Failover 가 잘되는지 살펴보자!

```
    [mysql@testvm_multi db]$  ./multi/5.6/bin/mysqladmin -uroot --socket=/tmp/multi1.sock  shutdown
    141218 08:29:56 mysqld_safe mysqld from pid file /data1/multi1/data/multi1.pid ended

    [mysql@testvm_multi db]$ tail -f /tmp/mysqlFailover.log
    2014-12-18 08:30:22 AM INFO Failed to reconnect to the master after 3 attemps.
    2014-12-18 08:30:22 AM CRITICAL Master is confirmed to be down or unreachable.
    2014-12-18 08:30:22 AM INFO Failover starting in 'auto' mode...
    2014-12-18 08:30:22 AM INFO Candidate slave localhost:3302 will become the new master.
    2014-12-18 08:30:22 AM INFO Checking slaves status (before failover).
    2014-12-18 08:30:22 AM INFO Preparing candidate for failover.
    2014-12-18 08:30:22 AM INFO Creating replication user if it does not exist.
    2014-12-18 08:30:22 AM INFO Stopping slaves.
    2014-12-18 08:30:22 AM INFO Performing STOP on all slaves.
    2014-12-18 08:30:22 AM INFO Switching slaves to new master.
    2014-12-18 08:30:22 AM INFO Disconnecting new master as slave.
    2014-12-18 08:30:22 AM INFO Starting slaves.
    2014-12-18 08:30:22 AM INFO Performing START on all slaves.
    2014-12-18 08:30:22 AM INFO Checking slaves for errors.
    2014-12-18 08:30:22 AM INFO Failover complete.
    2014-12-18 08:30:27 AM INFO Unregistering existing instances from slaves.
    2014-12-18 08:30:27 AM INFO Registering instance on new master localhost:3302.
    2014-12-18 08:30:27 AM INFO Master Information
    2014-12-18 08:30:27 AM INFO Binary Log File: mysql-bin.000009, Position: 848, Binlog_Do_DB: N/A, Binlog_Ignore_DB: N/A
    2014-12-18 08:30:27 AM INFO GTID Executed Set: a6d8cd08-83e3-11e4-a438-080027bb031f:1-86:88-94:96-419[...]
    2014-12-18 08:30:27 AM INFO Getting health for master: localhost:3302. -- failover가 잘 되었다!
    2014-12-18 08:30:27 AM INFO Health Status:
    2014-12-18 08:30:27 AM INFO host: localhost, port: 3302, role: MASTER, state: UP, gtid_mode: ON, health: OK
    2014-12-18 08:30:27 AM INFO host: localhost, port: 3303, role: SLAVE, state: UP, gtid_mode: ON, health: OK
```

  * 예전 master를 올리고 새로운 master로 replication을 붙이자!

```
    [mysql@testvm_multi 5.6]$ ./bin/mysqld_safe --master-info-repository=TABLE --skip-name-resolve --log-slave-updates --gtid-mode=ON --enforce-gtid-consistency --datadir=/data1/multi1/data --log-error=mysql.err --port=3301 --socket=/tmp/multi1.sock --pid-file=multi1.pid --key_buffer_size=16M --max_allowed_packet=1M --table_open_cache=64 --sort_buffer_size=512K --net_buffer_length=8K --read_buffer_size=256K --read_rnd_buffer_size=512K --myisam_sort_buffer_size=8M --log-bin=mysql-bin --binlog_format=mixed --server-id=201 &
    [1] 26964

    [mysql@testvm_multi 5.6]$ mysqlreplicate --master=root@localhost:3302 --slave=root@localhost:3301 --rpl-user=rpl:rpl
    WARNING: Using a password on the command line interface can be insecure.
    # master on localhost: ... connected.
    # slave on localhost: ... connected.
    # Checking for binary logging on master...
    # Setting up replication...
    # ...done.
```

* 상태를 check해 보자!

```
    [mysql@testvm_multi db]$  mysqlrpladmin --master=root@localhost:3302 --slave=root@localhost:3301,root@localhost:3303 --verbose health
    WARNING: Using a password on the command line interface can be insecure.
    # Checking privileges.
    # Attempting to contact localhost ... Success
    # Attempting to contact localhost ... Success
    # Attempting to contact localhost ... Success
    #
    # Replication Topology Health:
    +------------+-------+---------+--------+------------+---------+-------------+-------------------+-----------------+------------+-------------+--------------+------------------+---------------+-----------+----------------+------------+---------------+
    | host       | port  | role    | state  | gtid_mode  | health  | version     | master_log_file   | master_log_pos  | IO_Thread  | SQL_Thread  | Secs_Behind  | Remaining_Delay  | IO_Error_Num  | IO_Error  | SQL_Error_Num  | SQL_Error  | Trans_Behind  |
    +------------+-------+---------+--------+------------+---------+-------------+-------------------+-----------------+------------+-------------+--------------+------------------+---------------+-----------+----------------+------------+---------------+
    | localhost  | 3302  | MASTER  | UP     | ON         | OK      | 5.6.19-log  | mysql-bin.000009  | 848             |            |             |              |                  |               |           |                |            |               |
    | localhost  | 3301  | SLAVE   | UP     | ON         | OK      | 5.6.19-log  | mysql-bin.000009  | 848             | Yes        | Yes         | 0            | No               | 0             |           | 0              |            | 0             |
    | localhost  | 3303  | SLAVE   | UP     | ON         | OK      | 5.6.19-log  | mysql-bin.000009  | 848             | Yes        | Yes         | 0            | No               | 0             |           | 0              |            | 0             |
    +------------+-------+---------+--------+------------+---------+-------------+-------------------+-----------------+------------+-------------+--------------+------------------+---------------+-----------+----------------+------------+---------------+
    # ...done.
```

## 4. Failback 예제
* mysqlfailover 를 stop 시키자!

```
    [mysql@testvm_multi db]$ mysqlfailover --daemon=stop --pidfile=/tmp/mysqlFailover.pid
    Stopping failover daemon...
    예전에 쓰던 master로 다시 failback (switchover) 시키자!
    [mysql@testvm_multi 5.6]$  mysqlrpladmin --master=root@localhost:3302 --slave=root@localhost:3301,root@localhost:3303 --new-master=root@localhost:3301 --demote-master --rpl-user=rpl:rpl  switchover
    WARNING: Using a password on the command line interface can be insecure.
    # Checking privileges.
    # Performing switchover from master at localhost:3302 to slave at localhost:3301.
    # Checking candidate slave prerequisites.
    # Checking slaves configuration to master.
    # Waiting for slaves to catch up to old master.
    # Stopping slaves.
    # Performing STOP on all slaves.
    # Demoting old master to be a slave to the new master.
    # Switching slaves to new master.
    # Starting all slaves.
    # Performing START on all slaves.
    # Checking slaves for errors.
    # Switchover complete.
    #
    # Replication Topology Health:
    +------------+-------+---------+--------+------------+---------+
    | host       | port  | role    | state  | gtid_mode  | health  |
    +------------+-------+---------+--------+------------+---------+
    | localhost  | 3301  | MASTER  | UP     | ON         | OK      |
    | localhost  | 3302  | SLAVE   | UP     | ON         | OK      |
    | localhost  | 3303  | SLAVE   | UP     | ON         | OK      |
    +------------+-------+---------+--------+------------+---------+
    # ...done.
    mysqlfailover를 시작하기전에, 기존의 더러운 정보 (mysql.failover_console)를 지워버리자!
    mysql> select * from  mysql.failover_console;
    +-----------+------+
    | host      | port |
    +-----------+------+
    | localhost | 3301 |
    +-----------+------+
    1 row in set (0.00 sec)

    mysql> set sql_log_bin=0;
    Query OK, 0 rows affected (0.00 sec)

    mysql> drop table mysql.failover_console;
    Query OK, 0 rows affected (0.02 sec)
    다시 mysqlfailover 를 –daemon, –pidfile=, –log options 의 옵션과 함께 시작하자!
    [mysql@testvm_multi db]$ mysqlfailover --master=root@localhost:3301 --slave=root@localhost:3302,root@localhost:3303 --candidates=root@localhost:3302 --daemon=start --pidfile=/tmp/mysqlFailover.pid --log=/tmp/mysqlFailover.log failover
    WARNING: Using a password on the command line interface can be insecure.
    Starting failover daemon...
    [mysql@testvm_multi db]$
    [mysql@testvm_multi db]$
    [mysql@testvm_multi db]$ tail -f /tmp/mysqlFailover.log
    2014-12-18 08:40:31 AM INFO Failover daemon started.
    2014-12-18 08:40:31 AM INFO Failover mode = auto.
    2014-12-18 08:40:34 AM INFO Master Information
    2014-12-18 08:40:34 AM INFO Binary Log File: mysql-bin.000015, Position: 383, Binlog_Do_DB: N/A, Binlog_Ignore_DB: N/A
    2014-12-18 08:40:34 AM INFO Health Status:
    2014-12-18 08:40:34 AM INFO host: localhost, port: 3301, role: MASTER, state: UP, gtid_mode: ON, health: OK
    2014-12-18 08:40:34 AM INFO host: localhost, port: 3302, role: SLAVE, state: UP, gtid_mode: ON, health: OK
    2014-12-18 08:40:34 AM INFO host: localhost, port: 3303, role: SLAVE, state: UP, gtid_mode: ON, health: OK

```

## 5. 번외 1 (master가 failover 되었는데…. 만약 slave 중 하나가 적용하지 못한 log를 받아서 적용할 수 있을까?)
*    GTID임으로 가능하다!

```
    기본 세팅
    mysql_1> insert into gtid_test values (1,'a'),(2,'b'),(3,'c');
    Query OK, 3 rows affected (0.03 sec)
    Records: 3  Duplicates: 0  Warnings: 0

    mysql_2> stop slave io_thread;    -- 의도적으로 master의 log를 적용시키지 않음
    Query OK, 0 rows affected (0.01 sec)

    mysql_1> update gtid_test set b='z' where a=3;
    Query OK, 1 row affected (0.07 sec)
    Rows matched: 1  Changed: 1  Warnings: 0

    mysql_2> select * from test.gtid_test;  -- 변경분이 2번 슬레이브는 적용안됨
    +------+------+
    | a    | b    |
    +------+------+
    |    1 | a    |
    |    2 | b    |
    |    3 | c    |
    +------+------+
    3 rows in set (0.00 sec)

    mysql_2> show slave statusG
    *************************** 1. row ***************************
                   Slave_IO_State:
                      Master_Host: localhost
                      Master_User: rpl
                      Master_Port: 3301
                    Connect_Retry: 60
                  Master_Log_File: mysql-bin.000016
              Read_Master_Log_Pos: 832
                   Relay_Log_File: multi2-relay-bin.000004
                    Relay_Log_Pos: 850
            Relay_Master_Log_File: mysql-bin.000016
                 Slave_IO_Running: No
                Slave_SQL_Running: Yes
                  Replicate_Do_DB:
              Replicate_Ignore_DB:
               Replicate_Do_Table:
           Replicate_Ignore_Table:
          Replicate_Wild_Do_Table:
      Replicate_Wild_Ignore_Table:
                       Last_Errno: 0
                       Last_Error:
                     Skip_Counter: 0
              Exec_Master_Log_Pos: 832
                  Relay_Log_Space: 1024
                  Until_Condition: None
                   Until_Log_File:
                    Until_Log_Pos: 0
               Master_SSL_Allowed: No
               Master_SSL_CA_File:
               Master_SSL_CA_Path:
                  Master_SSL_Cert:
                Master_SSL_Cipher:
                   Master_SSL_Key:
            Seconds_Behind_Master: NULL
    Master_SSL_Verify_Server_Cert: No
                    Last_IO_Errno: 0
                    Last_IO_Error:
                   Last_SQL_Errno: 0
                   Last_SQL_Error:
      Replicate_Ignore_Server_Ids:
                 Master_Server_Id: 201
                      Master_UUID: d4cea137-85ca-11e4-b0a0-080027da779e
                 Master_Info_File: mysql.slave_master_info
                        SQL_Delay: 0
              SQL_Remaining_Delay: NULL
          Slave_SQL_Running_State: Slave has read all relay log; waiting for the slave I/O thread to update it
               Master_Retry_Count: 86400
                      Master_Bind:
          Last_IO_Error_Timestamp:
         Last_SQL_Error_Timestamp:
                   Master_SSL_Crl:
               Master_SSL_Crlpath:
               Retrieved_Gtid_Set: d4cea137-85ca-11e4-b0a0-080027da779e:23-25
                Executed_Gtid_Set: a6d8cd08-83e3-11e4-a438-080027bb031f:1-86:88-94:96-419,
    cabe77a2-83ea-11e4-a466-080027da779e:1-4,
    d4ca1f42-85ca-11e4-b0a0-080027da779e:1,
    d4cea137-85ca-11e4-b0a0-080027da779e:1-25,
    d4d179a8-85ca-11e4-b0a0-080027da779e:1-25
                    Auto_Position: 1
    1 row in set (0.00 sec)

    mysql_3> select * from test.gtid_test; -- 3번은 적용됨.
    +------+------+
    | a    | b    |
    +------+------+
    |    1 | a    |
    |    2 | b    |
    |    3 | z    |
    +------+------+
    3 rows in set (0.00 sec)
    master를 죽였음!
    2014-12-18 11:48:05 AM INFO Failed to reconnect to the master after 3 attemps.
    2014-12-18 11:48:05 AM CRITICAL Master is confirmed to be down or unreachable.
    2014-12-18 11:48:05 AM INFO Failover starting in 'auto' mode...
    2014-12-18 11:48:05 AM INFO Candidate slave localhost:3302 will become the new master.
    2014-12-18 11:48:05 AM INFO Checking slaves status (before failover).
    2014-12-18 11:48:05 AM INFO Preparing candidate for failover.
    2014-12-18 11:48:05 AM INFO Creating replication user if it does not exist.
    2014-12-18 11:48:05 AM INFO Stopping slaves.
    2014-12-18 11:48:05 AM INFO Performing STOP on all slaves.
    2014-12-18 11:48:05 AM INFO Switching slaves to new master.
    2014-12-18 11:48:05 AM INFO Disconnecting new master as slave.
    2014-12-18 11:48:05 AM INFO Starting slaves.
    2014-12-18 11:48:05 AM INFO Performing START on all slaves.
    2014-12-18 11:48:05 AM INFO Checking slaves for errors.
    2014-12-18 11:48:05 AM INFO Failover complete.
    2014-12-18 11:48:10 AM INFO Unregistering existing instances from slaves.
    2014-12-18 11:48:10 AM INFO Registering instance on new master localhost:3302.
    2014-12-18 11:48:10 AM INFO Master Information
    2014-12-18 11:48:10 AM INFO Binary Log File: mysql-bin.000010, Position: 1342, Binlog_Do_DB: N/A, Binlog_Ignore_DB: N/A
    2014-12-18 11:48:10 AM INFO GTID Executed Set: a6d8cd08-83e3-11e4-a438-080027bb031f:1-86:88-94:96-419[...]
    2014-12-18 11:48:10 AM INFO Getting health for master: localhost:3302.
    2014-12-18 11:48:10 AM INFO Health Status:
    2014-12-18 11:48:10 AM INFO host: localhost, port: 3302, role: MASTER, state: UP, gtid_mode: ON, health: OK
    2014-12-18 11:48:10 AM INFO host: localhost, port: 3303, role: SLAVE, state: UP, gtid_mode: ON, health: OK
    2014-12-18 11:48:28 AM INFO Master Information
    2014-12-18 11:48:28 AM INFO Binary Log File: mysql-bin.000010, Position: 1342, Binlog_Do_DB: N/A, Binlog_Ignore_DB: N/A
    2014-12-18 11:48:28 AM INFO GTID Executed Set: a6d8cd08-83e3-11e4-a438-080027bb031f:1-86:88-94:96-419[...]
    2014-12-18 11:48:28 AM INFO Getting health for master: localhost:3302.
    2014-12-18 11:48:28 AM INFO Health Status:
    2014-12-18 11:48:28 AM INFO host: localhost, port: 3302, role: MASTER, state: UP, gtid_mode: ON, health: OK
    2014-12-18 11:48:28 AM INFO host: localhost, port: 3303, role: SLAVE, state: UP, gtid_mode: ON, health: OK

    mysql_2> select * from test.gtid_test;  -- 적용되지 못한 2번이 3번에서 필요한것들을 가져오고 적용후에 master가 된다. --candidates 를 하나만 지정했지만, 여러개를 지정할경우 가장 많이 유리한놈이 master가 된다!
    +------+------+
    | a    | b    |
    +------+------+
    |    1 | a    |
    |    2 | b    |
    |    3 | z    |
    +------+------+
    3 rows in set (0.00 sec)
```


##    6. 번외 2 (master가 failover 될때, vip 같은것을 옮겨주는 script를 실행할 수 있을까?)
* 물론 가능하다!
* mysqlfailover , mysqlrpladmin 에서 –exec-before 나 –exec-after 를 –script-threshold 와 함께 이용할 수 있다.
* 예제는 이 페이지를 참고하자!
  * [mysqlrpladmin 외부스크립트 연동 옵션](../mysqlrpladmin-외부스크립트-연동-옵션)
