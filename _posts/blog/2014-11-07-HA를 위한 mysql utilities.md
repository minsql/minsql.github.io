---
title: HA를 위한 mysql utilities
author: min_kim
created: 2014/11/07 05:20:00
modified:
layout: post
tags: mysql mysql_utilities
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# HA를 위한 mysql utilities

*  mysqlrpladmin,mysqlfailover 등

###  1. 설치
```# yum install mysql-utilities```

###  2. 유틸리티
* mysqlrpladmin: replication administration tool. Commands include elect, failover, gtid, health, start, stop, and switchover
* mysqlfailover: replication heath check and automatic failover tool.
* mysqlreplicate: Setup replication
* mysqlrplcheck: Check replication configuration
* mysqlrplshow: Show slaves attached to master

###  3. mysqlrpladmin
#### 3.1. health check
  * slave auto discover를 위해서는 master-info-repository=TABLE이어야하고, report-host, report-port 옵션 설정되어야함.

```
[mysql@myvm1 conf]$ mysqlrpladmin --master=root:@localhost:3366 --discover-slaves-login=root health
# Discovering slaves for master at localhost:3366
# Discovering slave at localhost:3367
# Found slave: localhost:3367
# Discovering slave at localhost:3368
# Found slave: localhost:3368
# Checking privileges.
#
# Replication Topology Health:
+------------+-------+---------+--------+------------+---------+
| host       | port  | role    | state  | gtid_mode  | health  |
+------------+-------+---------+--------+------------+---------+
| localhost  | 3366  | MASTER  | UP     | ON         | OK      |
| localhost  | 3367  | SLAVE   | UP     | ON         | OK      |
| localhost  | 3368  | SLAVE   | UP     | ON         | OK      |
+------------+-------+---------+--------+------------+---------+
# ...done.
```
  * slave auto discover없이 --slaves에 slave list를 명시하여 체크 가능

```
[mysql@myvm1 conf]$ mysqlrpladmin --master=root@localhost:3366 --slaves=root@localhost:3367,root@localhost:3368 health
# Checking privileges.
#
# Replication Topology Health:
+------------+-------+---------+--------+------------+---------+
| host       | port  | role    | state  | gtid_mode  | health  |
+------------+-------+---------+--------+------------+---------+
| localhost  | 3366  | MASTER  | UP     | ON         | OK      |
| localhost  | 3367  | SLAVE   | UP     | ON         | OK      |
| localhost  | 3368  | SLAVE   | UP     | ON         | OK      |
+------------+-------+---------+--------+------------+---------+
# ...done.
```

####  3.2. elect
  * Slave가 new master 후보가 되려면, replication user가 생성되어 있어야 한다.
  * replication user가 있는데도 check fail난 경우가 있었는데, ip 주소로 체크하면 에러안난다.

```
[mysql@myvm1 conf]$ mysqlrpladmin --master=root@localhost:3366 --slaves=root@localhost:3367,root@localhost:3368 --verbose elect
# Checking privileges.
# WARNING: You may be mixing host names and IP addresses. This may result in negative status reporting if your DNS services do not support reverse name lookup.
# Electing candidate slave from known slaves.
# Checking eligibility of slave localhost:3367 for candidate.
#   Slave connected to master ... Ok
#   GTID_MODE=ON ... Ok
#   Logging filters agree ... Ok
#   Replication user exists ... FAIL
# Checking eligibility of slave localhost:3368 for candidate.
#   Slave connected to master ... Ok
#   GTID_MODE=ON ... Ok
#   Logging filters agree ... Ok
#   Replication user exists ... FAIL
ERROR: No slave found that meets eligilibility requirements.
# ...done.
[mysql@myvm1 conf]$ mysqlrpladmin --master=root@localhost:3366 --slaves=root@127.0.0.1:3367,root@127.0.0.1:3368 --verbose elect
# Checking privileges.
# WARNING: You may be mixing host names and IP addresses. This may result in negative status reporting if your DNS services do not support reverse name lookup.
# Electing candidate slave from known slaves.
# Checking eligibility of slave 127.0.0.1:3367 for candidate.
#   Slave connected to master ... Ok
#   GTID_MODE=ON ... Ok
#   Logging filters agree ... Ok
#   Replication user exists ... Ok
# Best slave found is located on 127.0.0.1:3367.
# ...done.
```

  * address resolving에 문제가 있나봄. hostname에 대해서도 replication user생성 해두면 OK

```
mysql> GRANT REPLICATION SLAVE ON *.* TO 'replication'@'localhost' IDENTIFIED BY 'replication';
Query OK, 0 rows affected (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

            [mysql@myvm1 conf]$ mysqlrpladmin --master=root@localhost:3366 --slaves=root@localhost:3367,root@localhost:3368 --verbose elect
# Checking privileges.
# WARNING: You may be mixing host names and IP addresses. This may result in negative status reporting if your DNS services do not support reverse name lookup.
# Electing candidate slave from known slaves.
# Checking eligibility of slave localhost:3367 for candidate.
#   Slave connected to master ... Ok
#   GTID_MODE=ON ... Ok
#   Logging filters agree ... Ok
#   Replication user exists ... Ok
# Best slave found is located on localhost:3367.
# ...done.
[mysql@myvm1 conf]$ mysqlrpladmin --master=root@localhost:3366 --slaves=root@127.0.0.1:3367,root@127.0.0.1:3368 --verbose elect
# Checking privileges.
# WARNING: You may be mixing host names and IP addresses. This may result in negative status reporting if your DNS services do not support reverse name lookup.
# Electing candidate slave from known slaves.
# Checking eligibility of slave 127.0.0.1:3367 for candidate.
#   Slave connected to master ... Ok
#   GTID_MODE=ON ... Ok
#   Logging filters agree ... Ok
#   Replication user exists ... Ok
# Best slave found is located on 127.0.0.1:3367.
# ...done.
```

#### 3.3. switchover
  * 계획된 maintenance작업으로서 slave중 하나를 new master로 대체 할 수 있다. transaction loss없음
  * **\--demote-master**을 사용하면, new master가 구성된 이후, old master를 slave로 자동으로 붙인다.

```
[mysql@myvm1 conf]$ mysqlrpladmin --demote-master --master=root@localhost:3366 --new-master=root@localhost:3367 --slaves=root@localhost:3367,root@localhost:3368 --verbose switchover
# Checking privileges.
# WARNING: You may be mixing host names and IP addresses. This may result in negative status reporting if your DNS services do not support reverse name lookup.
# Performing switchover from master at localhost:3366 to slave at localhost:3367.
# Checking candidate slave prerequisites.
# GTID_MODE=ON is set for all servers.
# Checking eligibility of slave localhost:3367 for candidate.
#   Slave connected to master ... Ok
#   GTID_MODE=ON ... Ok
#   Logging filters agree ... Ok
#   Replication user exists ... Ok
# Checking slaves configuration to master.
# Creating replication user if it does not exist.
# Blocking writes on master.
# LOCK STRING: FLUSH TABLES WITH READ LOCK
# Waiting for slaves to catch up to old master.
# Slave localhost:3367:
# QUERY = SELECT WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('141c523b-4747-11e4-98fb-000c298227a2:1-259', 300)
# Return Code = 0
# Slave localhost:3367:
# QUERY = SELECT WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('8e95986b-4747-11e4-98fe-000c298227a2:1', 300)
# Return Code = 0
# Slave localhost:3368:
# QUERY = SELECT WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('141c523b-4747-11e4-98fb-000c298227a2:1-259', 300)
# Return Code = 0
# Slave localhost:3368:
# QUERY = SELECT WAIT_UNTIL_SQL_THREAD_AFTER_GTIDS('8e95986b-4747-11e4-98fe-000c298227a2:1', 300)
# Return Code = 0
# Stopping slaves.
# Performing STOP on all slaves.
#   Executing stop on slave localhost:3367 Ok
#   Executing stop on slave localhost:3368 Ok
# UNLOCK STRING: UNLOCK TABLES
# Demoting old master to be a slave to the new master.
# Switching slaves to new master.
# Executing CHANGE MASTER on localhost:3368.
# CHANGE MASTER TO MASTER_HOST = 'localhost', MASTER_USER = 'replication', MASTER_PASSWORD = 'replication', MASTER_PORT = 3367, MASTER_AUTO_POSITION=1
# Executing CHANGE MASTER on localhost:3366.
# CHANGE MASTER TO MASTER_HOST = 'localhost', MASTER_USER = 'replication', MASTER_PASSWORD = 'replication', MASTER_PORT = 3367, MASTER_AUTO_POSITION=1
# Starting all slaves.
# Performing START on all slaves.
#   Executing start on slave localhost:3368 Ok
```
