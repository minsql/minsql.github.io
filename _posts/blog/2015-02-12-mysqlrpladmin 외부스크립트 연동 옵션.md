---
title: mysqlrpladmin 외부스크립트 연동 옵션
author: min_kim
created: 2015/02/12 22:50:09
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



# mysqlrpladmin 외부스크립트 연동 옵션

### mysqlrpladmin 외부스크립트 연동 옵션

> mysqlrpladmin failover/switchover 에서 활용가능한 외부스크립트 연동 옵션입니다.

 

  * mysqlrpladmin을 통한 failover/switchover하기 전이나 후에 외부 스크립트를 수행하게 할수 있습니다. (** _\--exec-before=<script>, --exec-after=<script>_** )
  * 만약 mysqlrpladmin전에 외부 스크립트를 사용하는 경우, 해당 스크립트의 결과값에 따라 mysqlrpladmin 동작을 제어할수 있습니다. (** _\--script-threshold=<return_code>_** )

#### 다음과 같이 disk availability checkup하는 스크립트를 미리 수행하길 원하는 경우를 테스트해봅시다.


    [mysql@myvm1 db]$ more test_disk_mysql56m3.sh
    touch /data1/multi/5.6/data3/test.out 2 > /dev/null

    if [ $? -eq 0 ]
    then
      echo "Successfully created file"
      exit 0
    else
      echo "Could not create file" >&2
      exit 1
    fi


#### 1\. 현 Replication구성 현황 확인

참고로 connection information에는 login-path를 사용하였습니다. login-path 구성은 다음 게시글 참조해주세요 : [MySQL login-path](http://minsql.890m.com/mysql/mysql-login-path/)


    [mysql@myvm1 db]$  mysqlrpladmin --master=multi56_mysql2 --discover-slaves-login=multi56_mysql2 health
    # Discovering slaves for master at localhost:3367
    # Discovering slave at localhost:3366
    # Found slave: localhost:3366
    # Discovering slave at localhost:3368
    # Found slave: localhost:3368
    # Checking privileges.
    #
    # Replication Topology Health:
    +------------+-------+---------+--------+------------+---------+
    | host       | port  | role    | state  | gtid_mode  | health  |
    +------------+-------+---------+--------+------------+---------+
    | localhost  | 3367  | MASTER  | UP     | ON         | OK      |
    | localhost  | 3366  | SLAVE   | UP     | ON         | OK      |
    | localhost  | 3368  | SLAVE   | UP     | ON         | OK      |
    +------------+-------+---------+--------+------------+---------+
    # ...done.
    [mysql@myvm1 db]$



#### 2\. port 3368 mysql instance의 data directory가 사용불가능한 상태에서 테스트


    [mysql@myvm1 db]$ su - root
    Password:
    [root@myvm1 ~]# cd /data1/multi/5.6/
    [root@myvm1 5.6]# chown -R root. data3
    [root@myvm1 5.6]# exit
    logout

    [mysql@myvm1 db]$ ./test_disk_mysql56m3.sh
    Could not create file


    [mysql@myvm1 db]$ mysqlrpladmin --master=multi56_mysql2 --discover-slaves-login=multi56_mysql2 health
    # Discovering slaves for master at localhost:3367
    # Discovering slave at localhost:3366
    # Found slave: localhost:3366
    # Discovering slave at localhost:3368
    # Found slave: localhost:3368
    # Checking privileges.
    #
    # Replication Topology Health:
    +------------+-------+---------+--------+------------+---------+
    | host       | port  | role    | state  | gtid_mode  | health  |
    +------------+-------+---------+--------+------------+---------+
    | localhost  | 3367  | MASTER  | UP     | ON         | OK      |
    | localhost  | 3366  | SLAVE   | UP     | ON         | OK      |
    | localhost  | 3368  | SLAVE   | UP     | ON         | OK      |
    +------------+-------+---------+--------+------------+---------+
    # ...done.
    [mysql@myvm1 db]$



##### switchover 시도


    [mysql@myvm1 db]$ mysqlrpladmin --exec-before=/db/test_disk_mysql56m3.sh --script-threshold=1 --demote-master --master=multi56_mysql2 --new-master=multi56_mysql3 --slaves=multi56_mysql1,multi56_mysql3 --verbose switchover
    WARNING: You have chosen to use external script return code checking. Depending on which script fails, this can leave the operation in an undefined state. Please check your results carefully if the operation aborts.
    # Checking privileges.
    # Performing switchover from master at localhost:3367 to slave at localhost:3368.
    # Checking candidate slave prerequisites.
    # GTID_MODE=ON is set for all servers.
    # Checking eligibility of slave localhost:3368 for candidate.
    #   Slave connected to master ... Ok
    #   GTID_MODE=ON ... Ok
    #   Logging filters agree ... Ok
    #   Replication user exists ... Ok
    # Checking slaves configuration to master.
    # Creating replication user if it does not exist.
    # Spawning external script.
    # SCRIPT EXECUTED: /db/test_disk_mysql56m3.sh localhost 3367 localhost 3368
    Could not create file
    ERROR: External script '/db/test_disk_mysql56m3.sh' failed. Result = 1.
    Specified threshold exceeded. Operation aborted.
    WARNING: The operation did not complete. Depending on when the external script was called, you should check the topology for inconsistencies.
    [mysql@myvm1 db]$


**외부 스크립트가 result=1로 fail했기 때문에 Operation이 멈추었습니다.**  

#### 3\. 디스크가 사용가능한 상태에서 테스트


    [mysql@myvm1 db]$ su - root
    Password:
    [root@myvm1 ~]# cd /data1/multi/5.6/
    [root@myvm1 5.6]# chown -R mysql. data3
    [root@myvm1 5.6]# exit
    logout
    [mysql@myvm1 db]$ ./test_disk_mysql56m3.sh
    Successfully created file


switchover 시도


    [mysql@myvm1 db]$ mysqlrpladmin --exec-before=/db/test_disk_mysql56m3.sh --script-threshold=1 --demote-master --master=multi56_mysql2 --new-master=multi56_mysql3 --slaves=multi56_mysql1,multi56_mysql3 --verbose switchover
    WARNING: You have chosen to use external script return code checking. Depending on which script fails, this can leave the operation in an undefined state. Please check your results carefully if the operation aborts.
    # Checking privileges.
    # Performing switchover from master at localhost:3367 to slave at localhost:3368.
    # Checking candidate slave prerequisites.
    # GTID_MODE=ON is set for all servers.
    # Checking eligibility of slave localhost:3368 for candidate.
    #   Slave connected to master ... Ok
    #   GTID_MODE=ON ... Ok
    #   Logging filters agree ... Ok
    #   Replication user exists ... Ok
    # Checking slaves configuration to master.
    # Creating replication user if it does not exist.
    # Spawning external script.
    # SCRIPT EXECUTED: /db/test_disk_mysql56m3.sh localhost 3367 localhost 3368
    Successfully created file
    # Script completed Ok.
    # Blocking writes on master.
    # LOCK STRING: FLUSH TABLES WITH READ LOCK
    # Waiting for slaves to catch up to old master.
    # Slave localhost:3366:
    # QUERY = SELECT WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('141c523b-4747-11e4-98fb-000c298227a2:1-1531', 300)
    # Return Code = 0
    # Slave localhost:3366:
    # QUERY = SELECT WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('8e95986b-4747-11e4-98fe-000c298227a2:1-15', 300)
    # Return Code = 0
    # Slave localhost:3368:
    # QUERY = SELECT WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('141c523b-4747-11e4-98fb-000c298227a2:1-1531', 300)
    # Return Code = 0
    # Slave localhost:3368:
    # QUERY = SELECT WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('8e95986b-4747-11e4-98fe-000c298227a2:1-15', 300)
    # Return Code = 0
    # Stopping slaves.
    # Performing STOP on all slaves.
    #   Executing stop on slave localhost:3366 Ok
    #   Executing stop on slave localhost:3368 Ok
    # UNLOCK STRING: UNLOCK TABLES
    # Demoting old master to be a slave to the new master.
    # Switching slaves to new master.
    # Executing CHANGE MASTER on localhost:3366.
    # CHANGE MASTER TO MASTER_HOST = 'localhost', MASTER_USER = 'replication', MASTER_PASSWORD = 'replication', MASTER_PORT = 3368, MASTER_AUTO_POSITION=1
    # Executing CHANGE MASTER on localhost:3367.
    # CHANGE MASTER TO MASTER_HOST = 'localhost', MASTER_USER = 'replication', MASTER_PASSWORD = 'replication', MASTER_PORT = 3368, MASTER_AUTO_POSITION=1
    # Starting all slaves.
    # Performing START on all slaves.
    #   Executing start on slave localhost:3366 Ok
    #   Executing start on slave localhost:3367 Ok
    # Checking slaves for errors.
    # localhost:3366 status: Ok
    # localhost:3367 status: Ok
    # Switchover complete.
    # Attempting to contact localhost ... Success
    # Attempting to contact localhost ... Success
    # Attempting to contact localhost ... Success
    #
    # Replication Topology Health:
    # Replication Topology Health:
    +------------+-------+---------+--------+------------+---------+-------------+-----------------------+-----------------+------------+-------------+--------------+------------------+---------------+-----------+----------------+------------+---------------+
    | host       | port  | role    | state  | gtid_mode  | health  | version     | master_log_file       | master_log_pos  | IO_Thread  | SQL_Thread  | Secs_Behind  | Remaining_Delay  | IO_Error_Num  | IO_Error  | SQL_Error_Num  | SQL_Error  | Trans_Behind  |
    +------------+-------+---------+--------+------------+---------+-------------+-----------------------+-----------------+------------+-------------+--------------+------------------+---------------+-----------+----------------+------------+---------------+
    | localhost  | 3368  | MASTER  | UP     | ON         | OK      | 5.6.19-log  | mysql56m3-bin.000013  | 864             |            |             |              |                  |               |           |                |            |               |
    | localhost  | 3366  | SLAVE   | UP     | ON         | OK      | 5.6.19-log  | mysql56m3-bin.000013  | 864             | Yes        | Yes         | 0            | No               | 0             |           | 0              |            | 0             |
    | localhost  | 3367  | SLAVE   | UP     | ON         | OK      | 5.6.19-log  | mysql56m3-bin.000013  | 864             | Yes        | Yes         | 0            | No               | 0             |           | 0              |            | 0             |
    +------------+-------+---------+--------+------------+---------+-------------+-----------------------+-----------------+------------+-------------+--------------+------------------+---------------+-----------+----------------+------------+---------------+
    # ...done.
    [mysql@myvm1 db]$


이번에는 before 스크립트가 성공하고 switchover동작도 성공하였습니다.
실전에서는 요구사항에 따라 유용하게 사용할수 있을 듯합니다.
