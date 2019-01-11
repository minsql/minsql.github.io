---
title: MySQL 5.6 gtid replication configuration and failover simple test
author: min_kim
created: 2014/11/03 04:54:00
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


# MySQL 5.6 gtid replication configuration and failover simple test

### mysql 5.6 gtid replication 구성

테스트할땐 역시 mysqld_multi가 편리하네요.

##### 1. 일단 바이너리 엔진 준비해주고..원하는 위치에 두고 심볼릭 링크 생성

```
/db/multi/mysql-5.6.19-linux-glibc2.5-x86_64/
ln -s mysql-5.6.19-linux-glibc2.5-x86_64/ 5.6
```

##### 2. configuration my.cnf 수정
  * log-bin # 필수 
  * log-slave-updates # 필수
  * gtid-mode=on # GTID 모드
  * enforce-gtid-consistency # 여기까지 필수. transactionally safe하지 않는 애는 실패한다. 나중에 자세히 살펴봅시다. 
  * master-info-repository=TABLE # master.info File로 관리하던거 mysql.slave_master_info 테이블에 담음
  * relay-log-info-repository=TABLE # relay-log.info File로 관리하던거 mysql.slave_relay_log_info테이블에 담음 
  * slave-parallel-workers=2 # slave parallel-worker 사용가능. worker정보는 mysql.slave_worker_info에서 확인가능

```
[mysqld1]
datadir=/data1/multi/5.6/data1
log-error=multi_mysql56m1.err
port            = 3366
socket          = /tmp/mysql56m1.sock
pid-file = /data1/multi/5.6/data1/mysql56m2.pid
log-bin=mysql56m1-bin
binlog_format=mixed
server-id       = 561
expire_logs_days=30
log-slave-updates=true
gtid-mode=on
enforce-gtid-consistency=true
master-info-repository=TABLE
relay-log-info-repository=TABLE

[mysqld2]
datadir=/data1/multi/5.6/data2
log-error=multi_mysql56m2.err
port = 3367
socket = /tmp/mysql56m2.sock
pid-file = /data1/multi/5.6/data2/mysql56m2.pid
log-bin=mysql56m2-bin
binlog_format=mixed
server-id = 562
log-slave-updates=true
gtid-mode=on
enforce-gtid-consistency=true
master-info-repository=TABLE
relay-log-info-repository=TABLE
slave-parallel-workers=2
```

##### 3. multi instance들이 사용할 data directory 생성

```
mkdir -p /data1/multi/5.6/data1
mkdir -p /data1/multi/5.6/data2
/db/multi/5.6/scripts/mysql_install_db --user=mysql --basedir=/db/multi/5.6 --datadir=/data1/multi/5.6/data1
/db/multi/5.6/scripts/mysql_install_db --user=mysql --basedir=/db/multi/5.6 --datadir=/data1/multi/5.6/data2
```

##### 4. mysql instance 시작

```
./bin/mysqld_multi --defaults-file=/db/multi/5.6/conf/my.cnf start
./bin/mysqld_multi --defaults-file=/db/multi/5.6/conf/my.cnf stop
```

##### 5. @MASTER replication user 생성
* @MASTER

```sql
mysql> GRANT REPLICATION SLAVE ON *.* TO replication@127.0.0.1 IDENTIFIED BY 'replication';
Query OK, 0 rows affected (0.00 sec)
mysql> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.00 sec)

mysql> show master statusG
*************************** 1. row ***************************
File: mysql56m1-bin.000002
Position: 549
Binlog_Do_DB:
Binlog_Ignore_DB:
Executed_Gtid_Set: 141c523b-4747-11e4-98fb-000c298227a2:1-2
1 row in set (0.00 sec)

mysql>
```

##### 6. Replication 구성
* 6.1  @SLAVE

```sql
mysql> CHANGE MASTER TO MASTER_HOST='127.0.0.1',  MASTER_PORT = 3366, MASTER_USER='replication', MASTER_PASSWORD='replication', MASTER_AUTO_POSITION=1;
Query OK, 0 rows affected, 2 warnings (0.07 sec)
mysql> start slave;
Query OK, 0 rows affected (0.02 sec)

mysql> show slave statusG
*************************** 1. row ***************************
Slave_IO_State: Waiting for master to send event
Master_Host: 127.0.0.1
Master_User: replication
Master_Port: 3366
Connect_Retry: 60
Master_Log_File: mysql56m1-bin.000001
Read_Master_Log_Pos: 539
Relay_Log_File: mysql56m2-relay-bin.000002
Relay_Log_Pos: 757
Relay_Master_Log_File: mysql56m1-bin.000001
Slave_IO_Running: Yes
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
Exec_Master_Log_Pos: 549
Relay_Log_Space: 975
Until_Condition: None
Until_Log_File:
Until_Log_Pos: 0
Master_SSL_Allowed: No
Master_SSL_CA_File:
Master_SSL_CA_Path:
Master_SSL_Cert:
Master_SSL_Cipher:
Master_SSL_Key:
Seconds_Behind_Master: 0
Master_SSL_Verify_Server_Cert: No
Last_IO_Errno: 0
Last_IO_Error:
Last_SQL_Errno: 0
Last_SQL_Error:
Replicate_Ignore_Server_Ids:
Master_Server_Id: 561
Master_UUID: 141c523b-4747-11e4-98fb-000c298227a2
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
Retrieved_Gtid_Set: 141c523b-4747-11e4-98fb-000c298227a2:1-2
Executed_Gtid_Set: 141c523b-4747-11e4-98fb-000c298227a2:1-2
Auto_Position: 1
1 row in set (0.00 sec)

mysql>
```


* 6.2 @MASTER show slave hots;

```sql
mysql> show slave hosts;
+-----------+------+------+-----------+--------------------------------------+
| Server_id | Host | Port | Master_id | Slave_UUID                           |
+-----------+------+------+-----------+--------------------------------------+
|       562 |      | 3367 |       561 | 8e95986b-4747-11e4-98fe-000c298227a2 |
+-----------+------+------+-----------+--------------------------------------+
1 row in set (0.00 sec)
```

##### 7.  리플리케이션 동작 확인
* 7.1 @MASTER

```sql
mysql> show master statusG
*************************** 1. row ***************************
             File: mysql56m1-bin.000001
         Position: 539
     Binlog_Do_DB:
 Binlog_Ignore_DB:
Executed_Gtid_Set: 141c523b-4747-11e4-98fb-000c298227a2:1-2
1 row in set (0.00 sec)
mysql> create database reptest;
Query OK, 1 row affected (0.00 sec)

mysql> use reptest;
Database changed
mysql> CREATE TABLE `tt` ( `no` int(11) NOT NULL AUTO_INCREMENT, `name` varchar(100) DEFAULT NULL, PRIMARY KEY (`no`) ) ENGINE=InnoDB;
Query OK, 0 rows affected (0.05 sec)

mysql> insert into tt(name) values ('hihi');
Query OK, 1 row affected (0.01 sec)

mysql> select * from tt;
+----+------+
| no | name |
+----+------+
| 1 | hihi |
+----+------+
1 row in set (0.00 sec)

mysql> show master statusG
*************************** 1. row ***************************
File: mysql56m1-bin.000001
Position: 1262
Binlog_Do_DB:
Binlog_Ignore_DB:
Executed_Gtid_Set: 141c523b-4747-11e4-98fb-000c298227a2:1-5
1 row in set (0.00 sec)
```

  * 141c523b-4747-11e4-98fb-000c298227a2:1-5
    *  정확하게 트랜잭션 개수만큼 gtid 가 증가한다. 지금까지 5개. (grant, flush, create databse, create table, insert)

* 7.2 @SLAVE

```sql
mysql> show slave statusG
...
           Retrieved_Gtid_Set: 141c523b-4747-11e4-98fb-000c298227a2:1-5
            Executed_Gtid_Set: 141c523b-4747-11e4-98fb-000c298227a2:1-5
                Auto_Position: 1
1 row in set (0.00 sec)
mysql> select * from reptest.tt;
+----+------+
| no | name |
+----+------+
| 1 | hihi |
+----+------+
1 row in set (0.00 sec)
```

##### 8. Failover 시나리오 간단히 테스트해보자.
* 8.1. MASTER CRASHED

```
[mysql@myvm1 5.6]$ kill -9 30829 30551
```

* 8.2.  SLAVE -> new MASTER reset slave all

```sql
    mysql> show slave statusG
*************************** 1. row ***************************
               Slave_IO_State: Reconnecting after a failed master event read
                  Master_Host: 127.0.0.1
                  Master_User: replication
                  Master_Port: 3366
                Connect_Retry: 60
              Master_Log_File: mysql56m1-bin.000001
          Read_Master_Log_Pos: 1262
               Relay_Log_File: mysql56m2-relay-bin.000002
                Relay_Log_Pos: 757
        Relay_Master_Log_File: mysql56m1-bin.000001
             Slave_IO_Running: Connecting
            Slave_SQL_Running: Yes
```
