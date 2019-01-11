---
title: Make my replication to the InnoDB Cluster
author: min_kim
created: 2017/09/19 05:29:02
modified:
layout: post
tags: mysql_innodb_cluster
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# Make my replication to the InnoDB Cluster

내 리플리케이션을 cluster로 관리해보자. 빈서버를 cluster로 구성하는 것도 유사한 스텝으로 작업한다. 데이터가 있는 경우라면, cluster생성시 첫 인스턴스를 master를 선택하면 된다. 이데이터가 seed가 되어 전체 클러스터에 복제되게 된다.

> 이번 테스트에서는 기존 5.7에 설치된 mixed replication으로 구성한 서버들을 활용한다.(server1,2,3) 기존의 replication 모두 절체. reset slave, reset master

## InnoDB cluster Requirements

  * InnoDB cluster uses Group Replication and therefore your server instances must meet the same requirements. See Section 17.7.1, “Group Replication Requirements”. -> Requirements를 모두 만족하는지 확인한다.

  * In addition, the provisioning scripts that MySQL Shell uses to configure servers for use in InnoDB cluster require access to Python (2.7 and above). On Windows MySQL Shell includes Python and no user configuration is required. On Unix Python must be found as part of the environment. To check that your system has Python configured correctly issue: -> 그리고 python이 2.7 이상이 필요하다.

@all servers

```
[root@server1:~]# git clone https://github.com/pyenv/pyenv.git ~/.pyenv
Initialized empty Git repository in /root/.pyenv/.git/
remote: Counting objects: 15428, done.
remote: Compressing objects: 100% (36/36), done.
remote: Total 15428 (delta 18), reused 31 (delta 10), pack-reused 15381
Receiving objects: 100% (15428/15428), 2.77 MiB | 820 KiB/s, done.
Resolving deltas: 100% (10543/10543), done.
[root@server1:~]# echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bash_profile
[root@server1:~]# echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bash_profile
[root@server1:~]# echo 'eval "$(pyenv init -)"' >> ~/.bash_profile
[root@server1:~]# pyenv versions
* system (set by /root/.pyenv/version)
[root@server1:~]# pyenv install 2.7.13
Downloading Python-2.7.13.tar.xz...
-> https://www.python.org/ftp/python/2.7.13/Python-2.7.13.tar.xz
Installing Python-2.7.13...
Installed Python-2.7.13 to /root/.pyenv/versions/2.7.13

[root@server1:~]# python --version
Python 2.6.6
[root@server1:~]# pyenv versions
* system (set by /root/.pyenv/version)
  2.7.13
[root@server1:~]# cd /mysql

[root@server1:/mysql]# pyenv local 2.7.13
[root@server1:/mysql]# python --version
Python 2.7.13
```

## Methods of Installing

  * MySQL Server 5.7.17 or higher. For details, see Chapter 2, Installing and Upgrading MySQL. -> ok
  * MySQL Shell 1.0.9 or higher. For details, see Section 19.3.1, “Installing MySQL Shell”.
    * Installing MySQL Shell from Direct Downloads from the MySQL Developer Zone
    * mysql-shell-1.0.10-linux-glibc2.12-x86-64bit.tar.gz 를 받아서 all servers에 업로드
  * MySQL Router 2.1.3 or higher. For details, see Installation.
    * Download official MySQL packages: Downloads are available at http://dev.mysql.com/downloads/router.
    * mysql-router-2.1.4-linux-glibc2.12-x86-64bit.tar.gz 를 받아서 all servers에 업로드
@all servers

```
[root@server1:/mysql]# tar zxf mysql-shell-1.0.10-linux-glibc2.12-x86-64bit.tar.gz
[root@server1:/mysql]# tar zxf mysql-router-2.1.4-linux-glibc2.12-x86-64bit.tar.gz
cd /usr/local/bin
ln -s  /mysql/mysql-shell-1.0.10-linux-glibc2.12-x86-64bit/bin/mysqlsh /usr/local/bin/mysqlsh
ln -s  /mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit/bin/mysqlrouter /usr/local/bin/mysqlrouter
```

## Production Deployment

  * https://dev.mysql.com/doc/refman/5.7/en/mysql-innodb-cluster-working-with-production-deployment.html

### Create user

  * instance 관리를 위한 user account가 필요하다. root일 필요는 없다. 하지만 많은 권한을 가져야한다. SUPER포함..
    * The user account used to administer an instance does not have to be the root account, however the user needs to be assigned full read and write privileges on the Metadata tables in addition to full MySQL administrator privileges (SUPER, GRANT OPTION, CREATE, DROP and so on). To give the user your_user the privileges needed to administer InnoDB cluster issue:
  * grgr@ip 유저를 활용한다.

@all servers

```
SET SQL_LOG_BIN=0;
create user 'grgr'@'192.168.73.123' identified by 'grgr';

GRANT ALL PRIVILEGES ON mysql_innodb_cluster_metadata.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
GRANT RELOAD, SHUTDOWN, PROCESS, FILE, SUPER, REPLICATION SLAVE, REPLICATION CLIENT, CREATE USER ON *.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
GRANT SELECT ON performance_schema.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
GRANT SELECT ON sys.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
GRANT SELECT, INSERT, UPDATE, DELETE ON mysql.* TO grgr@'192.168.73.123' WITH GRANT OPTION;

create user 'grgr'@'192.168.81.192' identified by 'grgr';
GRANT ALL PRIVILEGES ON mysql_innodb_cluster_metadata.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
GRANT RELOAD, SHUTDOWN, PROCESS, FILE, SUPER, REPLICATION SLAVE, REPLICATION CLIENT, CREATE USER ON *.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
GRANT SELECT ON performance_schema.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
GRANT SELECT ON sys.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
GRANT SELECT, INSERT, UPDATE, DELETE ON mysql.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
SET SQL_LOG_BIN=1;
```

  * 위처럼 멤버의 모든 아이피를 넣어줘야하지만, 유연한 변경을 위해서 %를 사용한다.

```
SET SQL_LOG_BIN=0;
create user 'grgr'@'192.168.%' identified by 'grgr';
GRANT ALL PRIVILEGES ON mysql_innodb_cluster_metadata.* TO grgr@'192.168.%' WITH GRANT OPTION;
GRANT RELOAD, SHUTDOWN, PROCESS, FILE, SUPER, REPLICATION SLAVE, REPLICATION CLIENT, CREATE USER ON *.* TO grgr@'192.168.%' WITH GRANT OPTION;
GRANT SELECT ON performance_schema.* TO grgr@'192.168.%' WITH GRANT OPTION;
GRANT SELECT ON sys.* TO grgr@'192.168.%' WITH GRANT OPTION;
GRANT SELECT, INSERT, UPDATE, DELETE ON mysql.* TO grgr@'192.168.%' WITH GRANT OPTION;
SET SQL_LOG_BIN=1;
```

  * 전체서버가 아직 클러스터 그룹이 되지 않은 상태이기 때문에, 모든 서버에 따로 변경을 가하는 경우에 SET SQL_LOG_BIN=0;을 잊지 않도록 한다. 나중에 dup에러를 만나지 않기 위해서. 물론 첫 구성이니 reset master로 해결할 수 있겠지만, 귀찮아지기 싫다면 SET SQL_LOG_BIN=0;로 작업한다. > 기존 사용하던 database가 추가되어있는 경우,


    * Checking compliance of existing tables... FAIL
    ERROR: 6 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key).


위와 같은 에러를 만날 수 있다. PK가 모두 존재하더라도.. 이건 user가 해당 데이터베이스에 권한이 없기 때문이었다. 만약 database가 사용자데이터베이스를 사용중이라면 권한을 추가해야한다. `GRANT SELECT ON test.* TO grgr@'192.168.%' WITH GRANT OPTION;` or 여러개라면, 그리고 귀찮다면 `GRANT SELECT ON *.* TO grgr@'192.168.%' WITH GRANT OPTION;`

### working with mysqlsh

  * When working with a production deployment it is a good idea to configure verbose logging for MySQL Shell initially. This is helpful in finding and resolving any issues that may arise when you are preparing the server to work as part of InnoDB cluster. To start MySQL Shell with a verbose logging level type: -> production에서 작업할때는 log-level을 높여서 작업하면 이슈를 찾기가 쉽다.

  * `shell> mysqlsh --log-level=DEBUG3`

  * The log file is located in ~/.mysqlsh/mysqlsh.log for Unix-based systems. On Microsoft Windows systems it is located in %APPDATA%\MySQL\mysqlsh\mysqlsh.log. See Section 18.5, “MySQL Shell Application Log”.

### Checking Instance State
* 대상 인스턴스가 cluster에 추가할 수 있는 상태인지 먼저 확인한다.

#### Checking Instance Configuration

```
[root@server1:~]# mysqlsh  --log-level=DEBUG3 --uri grgr@192.168.73.123:3306

mysql-js> dba.checkInstanceConfiguration('grgr@192.168.73.123:3306')
Please provide the password for 'grgr@192.168.73.123:3306':
Validating instance...

The instance '192.168.73.123:3306' is not valid for Cluster usage.

The following issues were encountered:

 - 2 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key).
 - Some configuration options need to be fixed.

+----------------------------------+---------------+----------------+--------------------------------------------------+
| Variable                         | Current Value | Required Value | Note     |
+----------------------------------+---------------+----------------+--------------------------------------------------+
| binlog_checksum                  | CRC32         | NONE           | Update the server variable or restart the server |
| binlog_format                    | MIXED         | ROW            | Update the server variable or restart the server |
| enforce_gtid_consistency         | OFF           | ON             | Restart the server     |
| gtid_mode                        | OFF           | ON             | Restart the server     |
| log_slave_updates                | 0             | ON             | Restart the server     |
| master_info_repository           | FILE          | TABLE          | Restart the server     |
| relay_log_info_repository        | FILE          | TABLE          | Restart the server     |
| transaction_write_set_extraction | OFF           | XXHASH64       | Restart the server     |
+----------------------------------+---------------+----------------+--------------------------------------------------+


Please fix these issues, restart the server and try again.

{
    "config_errors": [
        {
            "action": "server_update",
            "current": "CRC32",
            "option": "binlog_checksum",
            "required": "NONE"
        },
        {
            "action": "server_update",
            "current": "MIXED",
            "option": "binlog_format",
            "required": "ROW"
        },
        {
            "action": "restart",
            "current": "OFF",
            "option": "enforce_gtid_consistency",
            "required": "ON"
        },
        {
            "action": "restart",
            "current": "OFF",
            "option": "gtid_mode",
            "required": "ON"
        },
        {
            "action": "restart",
            "current": "0",
            "option": "log_slave_updates",
            "required": "ON"
        },
        {
            "action": "restart",
            "current": "FILE",
            "option": "master_info_repository",
            "required": "TABLE"
        },
        {
            "action": "restart",
            "current": "FILE",
            "option": "relay_log_info_repository",
            "required": "TABLE"
        },
        {
            "action": "restart",
            "current": "OFF",
            "option": "transaction_write_set_extraction",
            "required": "XXHASH64"
        }
    ],
    "errors": [
        "2 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key)."
    ],
    "restart_required": true,
    "status": "error"
}
=> my.cnf 변경하고 다시 시작.

mysql-js>  dba.checkInstanceConfiguration('grgr@192.168.73.123:3306')
Please provide the password for 'grgr@192.168.73.123:3306':
Validating instance...

The instance '192.168.73.123:3306' is not valid for Cluster usage.

The following issues were encountered:

 - 2 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key).

Please fix these issues and try again.

{
    "errors": [
        "2 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key)."
    ],
    "restart_required": false,
    "status": "error"
}
mysql-js>
=> pk 없는 테이블은 추가해준다.

mysql-sql> \js
Switching to JavaScript mode...
mysql-js> dba.checkInstanceConfiguration('grgr@192.168.73.123:3306')
Please provide the password for 'grgr@192.168.73.123:3306':
Validating instance...

The instance '192.168.73.123:3306' is valid for Cluster usage
{
    "status": "ok"
}
mysql-js>
=> status가 ok 라면 계속 진행한다.
```

### Creating the Cluster

```[root@server1:~]# mysqlsh --log-level=DEBUG3 --uri grgr@192.168.73.123:3306```

* Now create the cluster

```
mysql-js> var cluster = dba.createCluster('myCluster');
A new InnoDB cluster will be created on instance 'grgr@192.168.73.123:3306'.

Creating InnoDB cluster 'myCluster' on 'grgr@192.168.73.123:3306'...
Adding Seed Instance...

Cluster successfully created. Use Cluster.addInstance() to add MySQL instances.
At least 3 instances are needed for the cluster to be able to withstand up to
one server failure.

mysql-js>
```

* check the instance state:

```
mysql-js> cluster.checkInstanceState('grgr@192.168.73.123:3306')
Please provide the password for 'grgr@192.168.73.123:3306':
Analyzing the instance replication state...

The instance '192.168.73.123:3306' is valid for the cluster.
The instance is fully recoverable.

{
    "reason": "recoverable",
    "state": "ok"
}
```

* Check the cluster status:

```
mysql-js> cluster.status()
{
    "clusterName": "myCluster",
    "defaultReplicaSet": {
        "name": "default",
        "primary": "192.168.73.123:3306",
        "status": "OK_NO_TOLERANCE",
        "statusText": "Cluster is NOT tolerant to any failures.",
        "topology": {
            "192.168.73.123:3306": {
                "address": "192.168.73.123:3306",
                "mode": "R/W",
                "readReplicas": {},
                "role": "HA",
                "status": "ONLINE"
            }
        }
    }
}
mysql-js>
```


#### Adding instances
You need to add two more instances to the cluster to make it tolerant to a server failure.

```
[root@server1:~]#  mysqlsh  --log-level=DEBUG3 --uri grgr@192.168.73.123:3306

mysql-js> cluster=dba.getCluster();

mysql-js> cluster.status();
```

* 다음과 같이 추가한다.

```
dba.checkInstanceConfiguration('grgr@192.168.81.192:3306')
cluster.addInstance("grgr@192.168.81.192:3306")
dba.checkInstanceConfiguration('grgr@192.168.85.198:3306')
cluster.addInstance("grgr@192.168.85.198:3306")
```

* logs

```
Please provide the password for 'grgr@192.168.85.198:3306':
Validating instance...

The instance '192.168.85.198:3306' is valid for Cluster usage
{
    "status": "ok"
}
mysql-js>
mysql-js> cluster.addInstance('grgr@192.168.85.198:3306')
A new instance will be added to the InnoDB cluster. Depending on the amount of
data on the cluster this might take from a few seconds to several hours.

Please provide the password for 'grgr@192.168.85.198:3306':
Adding instance to the cluster ...

Cluster.addInstance: WARNING: Not running locally on the server and can not access its error log.
ERROR:
Group Replication join failed.
ERROR: Error joining instance to cluster: '192.168.85.198:3306' - Query failed.3092 (HY000): The server is not configured properly to be an active member of the group. Please see more details on error log.. Query: START group_replication (RuntimeError)

mysql-js> cluster.addInstance("grgr@192.168.85.198:3306", {ipWhitelist: "192.168.73.0/24,192.168.81.0/24,192.168.85.0/24"})
A new instance will be added to the InnoDB cluster. Depending on the amount of
data on the cluster this might take from a few seconds to several hours.

Please provide the password for 'grgr@192.168.85.198:3306':
Adding instance to the cluster ...

The instance 'grgr@192.168.85.198:3306' was successfully added to the cluster.

mysql-js>
```

=> 잘 추가된다면 다행이지만..
역시 여러가지 에러케이스가 존재한다.
configuration다 변경했는지.
user를 잘 생성했는지.
PK를 다 추가했는지.
checkInstanceConfiguration에서 걸린 에러를 잘 확인하도록 한다.
정보가 부족하다면 dba.verbose = 1를 사용한다.

#### Error Cases

* User권한 부족

```
mysql-js> dba.verbose = 1
1
mysql-js> dba.checkInstanceConfiguration('grgr@192.168.81.192:3306')
Please provide the password for 'grgr@192.168.81.192:3306':
Validating instance...

=========================== MySQL Provision Output ===========================
Enter the password for server (grgr@192.168.81.192:3306):

Running check command.
Checking Group Replication prerequisites.
* Comparing options compatibility with Group Replication... PASS
Server configuration is compliant with the requirements.
* Checking server version... PASS
Server is 5.7.17

* Checking that server_id is unique... PASS
The server_id is valid.

* Checking compatibility of Multi-Threaded Slave settings... PASS
Multi-Threaded Slave settings are compatible with Group Replication.

* Checking compliance of existing tables... FAIL
ERROR: 6 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key).
        PERCONA_SCHEMA.xtrabackup_history, test.events, test.t1, test.t2, test.tp, test_group_event_stats.event_user_actions

Group Replication requires tables to use InnoDB and have a PRIMARY KEY or PRIMARY KEY Equivalent (non-null unique key). Tables that do not follow these requirements will be readable but not updateable when used with Group Replication. If your applications make updates (INSERT, UPDATE or DELETE) to these tables, ensure they use the InnoDB storage engine and have a PRIMARY KEY or PRIMARY KEY Equivalent.
You can retry this command with the --allow-non-compatible-tables option if you'd like to enable Group Replication ignoring this warning.


ERROR: Error checking instance: The operation could not continue due to the following requirementsnot being met:
Non-compatible tables found in database.
==============================================================================
The instance '192.168.81.192:3306' is not valid for Cluster usage.

The following issues were encountered:

 - 6 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key).

Please fix these issues and try again.

{
    "errors": [
        "6 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key)."
    ],
    "restart_required": false,
    "status": "error"
}
mysql-js>
```
=> 추가된 데이터베이스에 권한이 없다. 권한을 부여
```GRANT SELECT ON *.* TO grgr@'192.168.73.123' WITH GRANT OPTION;```

* IP whitelist문제
  * addInstance에서 작업하다가 에러남. 이건 무엇인가 한참 해맸으나. IP 대역대 문제였음.
  * mysql error log를 함께 본다

```
2017-09-19T12:09:08.639569+09:00 0 [Warning] Plugin group_replication reported: '[GCS] Connection attempt from IP address 192.168.81.192 refused. Address is not in the IP whitelist.'
```

=> 이런 에러를 발견했다면 whitelist문제일수 있다. group_replication_ip_whitelist= AUTOMATIC 이지만, C class를 벗어난 대역대 간의 통신에 대해서는 수동으로 추가해줄 필요가 있음. 물론 서로간에 방화벽이나 SElinux같은 것이 활성화 되지 않은 통신이 가능한 상태의 서버들간이어야함.

@server1: group_replication_ip_whitelist를 설정한다.

```
root@localhost:(none) 16:18:00>stop group_replication;

Query OK, 0 rows affected (35.04 sec)

set global group_replication_ip_whitelist = '192.168.73.0/24,192.168.81.0/24,192.168.85.0/24';

set global group_replication_ip_whitelist=AUTOMATIC;


root@localhost:(none) 16:18:43>start group_replication;
ERROR 3097 (HY000): The START GROUP_REPLICATION command failed as there was an error when joining the communication group.
=> 노드가 1개뿐이었던 상태이므로 조인할수 없다는 에러가 나온다. 이렇게 되면,
mysql-js> dba.rebootClusterFromCompleteOutage();
Reconfiguring the default cluster from complete outage...


The cluster was successfully rebooted.

<Cluster:myCluster>



 mysql-js> cluster.addInstance("grgr@192.168.81.192:3306");
 A new instance will be added to the InnoDB cluster. Depending on the amount of
 data on the cluster this might take from a few seconds to several hours.

 Please provide the password for 'grgr@192.168.81.192:3306':
 Adding instance to the cluster ...

 The instance 'grgr@192.168.81.192:3306' was successfully added to the cluster.
=> addInsatance 할때도 cluster.addInstance(“grgr@192.168.81.192:3306”, {ipWhitelist: “192.168.73.0/24,192.168.81.0/24,192.168.85.0/24”})와 같이 whitelist argument를 추가한다.
```


* gtid에러
  * addInstance에서 실패하면 mysqlsh 의 로그보다는 mysql error log를 보는 것에 좋다.
  * mysql error log를 함께 본다

```
2017-09-19T12:16:32.035765+09:00 0 [ERROR] Plugin group_replication reported: 'This member has more executed transactions than those present in the group. Local transactions: 998a1dbd-7b3c-11e7-a6c0-fa163ed51496:1 > Group transactions: 7f3e956c-98f7-11e7-84a4-fa163e110d6b:1-159,
b5eafd39-2316-11e7-88c5-fa163e110d6b:1-24'
=> 트랜잭션이 더 있었다? 지금은 설정하면서 발생한 트랜잭션일 가능성이 높으므로, reset master해버린다.

root@localhost:(none) 12:16:59>reset master;
Query OK, 0 rows affected (0.00 sec)
```


### Check cluster status

```
[root@server1:~]#  mysqlsh  --log-level=DEBUG3 --uri grgr@192.168.73.123:3306

mysql-js> cluster=dba.getCluster();

mysql-js> cluster.status();
{
    "clusterName": "myCluster",
    "defaultReplicaSet": {
        "name": "default",
        "primary": "192.168.73.123:3306",
        "status": "OK",
        "statusText": "Cluster is ONLINE and can tolerate up to ONE failure.",
        "topology": {
            "192.168.73.123:3306": {
                "address": "192.168.73.123:3306",
                "mode": "R/W",
                "readReplicas": {},
                "role": "HA",
                "status": "ONLINE"
            },
            "192.168.81.192:3306": {
                "address": "192.168.81.192:3306",
                "mode": "R/O",
                "readReplicas": {},
                "role": "HA",
                "status": "ONLINE"
            },
            "192.168.85.198:3306": {
                "address": "192.168.85.198:3306",
                "mode": "R/O",
                "readReplicas": {},
                "role": "HA",
                "status": "ONLINE"
            }
        }
    }
}
```

### Deploy MySQL Router

```
[root@server1:~]# cd /mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit
[root@server1:/mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit]# cd bin
[root@server1:/mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit/bin]#

[root@server1:/mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit/bin]# mysqlrouter --bootstrap root@localhost:3306 --user=mysql
Please enter MySQL password for root:
WARNING: The MySQL server does not have SSL configured and metadata used by therouter may be transmitted unencrypted.

Bootstrapping system MySQL Router instance...
MySQL Router  has now been configured for the InnoDB cluster 'myCluster'.

The following connection information can be used to connect to the cluster.

Classic MySQL protocol connections to cluster 'myCluster':
- Read/Write Connections: localhost:6446
- Read/Only Connections: localhost:6447

X protocol connections to cluster 'myCluster':
- Read/Write Connections: localhost:64460
- Read/Only Connections: localhost:64470
[root@server1:/mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit/bin]#
[root@server1:/mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit/bin]# mysqlrouter &
[1] 3225
Connect using Mysql Router
Read/Write Connections: localhost:6446
[root@server1:/mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit/bin]# mysqlsh --uri test@localhost:6446
Creating a Session to 'test@localhost:6446'
Enter password:
Your MySQL connection id is 13101
Server version: 5.7.17-enterprise-commercial-advanced-log MySQL Enterprise Server - Advanced Edition (Commercial)
No default schema selected; type \use <schema> to set one.
MySQL Shell 1.0.10

Copyright (c) 2016, 2017, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type '\help' or '\?' for help; '\quit' to exit.

Currently in JavaScript mode. Use \sql to switch to SQL mode and execute queries.
mysql-js> \sql
Switching to SQL mode... Commands end with ;
mysql-sql> select @@hostname;
+-------------------------------+
| @@hostname                    |
+-------------------------------+
| server1 |
+-------------------------------+
1 row in set (0.00 sec)
mysql-sql> \q
Bye!
Read/Only Connections: localhost:6447
[root@server1:/mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit/bin]# mysqlsh --uri test@localhost:6447
Creating a Session to 'test@localhost:6447'
Enter password:
Your MySQL connection id is 116
Server version: 5.7.17-log MySQL Community Server (GPL)
No default schema selected; type \use <schema> to set one.
MySQL Shell 1.0.10

Copyright (c) 2016, 2017, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type '\help' or '\?' for help; '\quit' to exit.

Currently in JavaScript mode. Use \sql to switch to SQL mode and execute queries.
mysql-js> \sql
Switching to SQL mode... Commands end with ;
mysql-sql> select @@hostname;
+-------------------------------+
| @@hostname                    |
+-------------------------------+
| server3 |
+-------------------------------+
1 row in set (0.00 sec)
mysql-sql>
```
