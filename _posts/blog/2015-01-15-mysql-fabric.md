---
title: MySQL Fabric
author: min_kim
created: 2015/01/15 00:59:27
modified:
layout: post
tags: mysql_fabric
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL Fabric

> MySQL 서버팜을 관리하는 시스템 MySQL sharding 이나 HA를 구현, 관리 가능

## 1\. 소개
* Fabric에 access할때 XML-FPC protocol을 사용하는 것이 좋다. application은 MySQL connector 확장 버전을 사용해야하는데 현재, Connector/Python와 Connector/J 가 지원한다. Fabric은 GTID가 enable된 MySQL server를 관리한다. GTID를 통해서 서버간 consistency를 체크하고 유지관리한다. 서버군은 high-availability group이라고 불리우고, 이들 서버들에 대한 정보는 별도의 MySQL instance에서 관리한다. 이 관리 서버 인스턴스는 ha group에 포함될수 없고, backing store라고 불리운다. Fabric은 Python으로 작성되었으며 mysqlfabric이라는 utility를 사용해서 Fabric과 통신한다.

### 1.1. Fabric Prerequisites

<table>
<thead>
<tr>
  <th>Prerequisite</th>
  <th>Version</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Fabric MySQL servers</td>
  <td>MySQL server 5.6.10 or later</td>
</tr>
<tr>
  <td>backing store</td>
  <td>MySQL server 5.6.x or later</td>
</tr>
<tr>
  <td>mysqlfabric utility</td>
  <td>Python 2 (2.6 or later) ubc0f Connector/Python 1.2.1 or later.</td>
</tr>
<tr>
  <td>application fabric-aware connector</td>
  <td>Connector/Python 1.2.1 or later ub610ub294 Connector/J 5.1.27 or latern1.2. Fabric Concepts</td>
</tr>
</tbody>
</table>


### 1.2. Fabric Concepts


<table>
<thead>
<tr>
  <th>CONCEPTS</th>
  <th>DESCRIPTION</th>
</tr>
</thead>
<tbody>
<tr>
  <td>high-availability group</td>
  <td>MySQL 서버군.</td>
</tr>
<tr>
  <td>group identifier</td>
  <td>group 이름</td>
</tr>
<tr>
  <td>global group</td>
  <td>모든 shard에 적용되어야하는 변경사항들을 저장 (??)stores all updates that must be propogated to all shards that are part of a sharding scheme.</td>
</tr>
<tr>
  <td>node or fabric node</td>
  <td>Fabric system의 구성원 인스턴스</td>
</tr>
<tr>
  <td>Sharding</td>
  <td>여러 서버로 데이터를 분배하는 Fabric feature</td>
</tr>
<tr>
  <td>shard</td>
  <td>table data segment나 horizontal partition을 의미</td>
</tr>
<tr>
  <td>Primary</td>
  <td>group member중 master로 지정된 노드를 의미. RW 가능</td>
</tr>
<tr>
  <td>Secondary</td>
  <td>group member중 switchover나 failover시 master를 대체할수 있는 candidate을 의미. RO 임.</td>
</tr>
</tbody>
</table>


## 2\. MySQL Fabric의 설치와 구성
* MySQL Fabric을 사용하려면 MySQL 5.6.10이상의 MySQL server 여러대를 먼저 준비해야한다. 그중 하나는 backing store로 사용되어야하고 나머지는 Fabric group으로 지정한다. MySQL Fabric의 replication feature를 사용할 계획이라면 replication topology에 따라 master한대와 하나이상의 slave서버가 필요하다. sharding feature를 사용하려면 shard의 depth(segment 개수)만큼의 서버가 필요하다.

### 2.1. Downloading MySQL Fabric

  * mysql utility : http://dev.mysql.com/downloads/tools/utilities/
  * connector/python : http://dev.mysql.com/downloads/connector/python/

### 2.2. Installing MySQL Fabric

```
[mysql@testvm1 mydba]$ tar zxf mysql-utilities-1.5.3.tar.gz
[mysql@testvm1 mydba]$ cd mysql-utilities-1.5.3
[mysql@testvm1 mysql-utilities-1.5.3]$ python ./setup.py build
[mysql@testvm1 mysql-utilities-1.5.3]$ su
Password:
[root@testvm1 mysql-utilities-1.5.3]# python ./setup.py install
[root@testvm1 mysql-utilities-1.5.3]# exit
exit
[mysql@testvm1 mydba]$ tar zxf mysql-connector-python-2.0.2.tar.gz
[mysql@testvm1 mydba]$ cd mysql-connector-python-2.0.2
[mysql@testvm1 mysql-connector-python-2.0.2]$ python ./setup.py build
[mysql@testvm1 mysql-connector-python-2.0.2]$ su
Password:
[root@testvm1 mysql-connector-python-2.0.2]# python ./setup.py install
[root@testvm1 mysql-connector-python-2.0.2]# exit
exit
```

### 2.3. Configuring MySQL Fabric
#### 2.3.1. Create a MySQL User
  * backing store에 fabric user 생성 (testvm1)

```sql
CREATE USER 'fabric'@'localhost' IDENTIFIED BY 'fabric';
GRANT ALL ON fabric.* TO 'fabric'@'localhost';
```

  * fabric group node에 fabric user 생성 (testvm2, testvm3) 이 유저로 replication 연결도 하기 때문에 서로 호스트에 대해서도 명시해야한다. 테스트에서는 편의상 subnet으로 명시하였다.

```sql
CREATE USER 'fabric'@'192.168.56.%' IDENTIFIED BY 'fabric';
GRANT ALL ON *.* TO 'fabric'@'192.168.56.%';<
```

#### 2.3.2. Configuration File
* fabric.cfg 파일 작성

```
[DEFAULT]
prefix = /db/mysql
sysconfdir = /db/mysql/conf
logdir = /data1/mysql/log

[storage]
address = localhost:3306
user = fabric
password = fabric
database = fabric
auth_plugin = mysql_native_password
connection_timeout = 6
connection_attempts = 6
connection_delay = 1

[servers]
user = fabric
password =

[protocol.xmlrpc]
address = localhost:32274
threads = 5
user = admin
password =
disable_authentication = no
realm = MySQL Fabric
ssl_ca =
ssl_cert =
ssl_key =

[protocol.mysql]
address = localhost:32275
user = admin
password =

[executor]
executors = 5

[logging]
level = INFO
url = file:///data1/mysql/log/fabric.log

[sharding]
mysqldump_program = /db/mysql/bin/mysqldump
mysqlclient_program = /db/mysql/bin/mysql

[statistics]
prune_time = 3600

[failure_tracking]
notifications = 300
notification_clients = 50
notification_interval = 60
failover_interval = 0
detections = 3
detection_interval = 6
detection_timeout = 1
prune_time = 3600

[connector]
ttl = 1

[client]
password =
```


#### 2.3.3. Setup Backing Store

```
[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg manage setup
 [INFO] 1418111991.571184 - MainThread - Initializing persister: user (fabric), server (localhost:3306), database (fabric).
 Finishing initial setup
 =======================
 Password for admin user is not yet set.
 Password for admin/xmlrpc:
 Repeat Password:
 Password set.
 Password set.
 No result returned
```
#### 2.3.4 Start

```
[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg manage start --daemonize
```
#### 2.3.5 Stop

```
[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg manage stop
```

## 3\. Quick start Example

### 3.1 Creating a High-Availability Group

#### 3.1.1 Group node configuration

  *  required variables
    * gtid_mode = on
    * enforce-gtid-consistency
    * log-bin
    * log-slave-updates

#### 3.1.2 Create my_group

```
[mysql@testvm1 mysql]$ mysqlfabric group create my_group
Password for admin:
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid finished success result
------------------------------------ -------- ------- ------
3cd38b3f-9c08-4996-8c03-a85607fc8f00        1       1      1

state success          when                                                   description
----- ------- ------------- -------------------------------------------------------------
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                             Executing action (_create_group).
    5       2   1.41812e+09                              Executed action (_create_group).
```

### 3.1.3 add nodes to my_group


```
 [mysql@testvm1 mysql]$ mysqlfabric group add my_group testvm2:3306
Password for admin:
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid finished success result
------------------------------------ -------- ------- ------
2686ccbf-d192-4116-91ef-ab7d94a3159e        1       1      1

state success          when                                                   description
----- ------- ------------- -------------------------------------------------------------
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                               Executing action (_add_server).
    5       2   1.41812e+09                                Executed action (_add_server).


[mysql@testvm1 mysql]$ mysqlfabric group add my_group testvm3:3306
Password for admin:
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid finished success result
------------------------------------ -------- ------- ------
ac4d18c6-dd60-4751-9fdd-405843785aad        1       1      1

state success          when                                                   description
----- ------- ------------- -------------------------------------------------------------
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                               Executing action (_add_server).
    5       2   1.41812e+09                                Executed action (_add_server).

```

### 3.1.4 show information

```
[mysql@testvm1 mysql]$ mysqlfabric group lookup_servers my_group
Password for admin:
Fabric UUID: 5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

server_uuid address status mode weight
------------------------------------ ------------ --------- --------- ------
43f777a0-7f4a-11e4-863b-08002713b36f testvm2:3306 SECONDARY READ_ONLY 1.0
7f5ba91e-81d1-11e4-96b7-0800273900a5 testvm3:3306 SECONDARY READ_ONLY 1.0
```

### 3.1.5 promote server
한 서버를 master로 promote시켜준다.

```
[mysql@testvm1 mysql]$ mysqlfabric group promote my_group
Password for admin:
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid finished success result
------------------------------------ -------- ------- ------
3fa9a519-67f7-4928-ab40-6fbb073a2515        1       1      1

state success          when                                                   description
----- ------- ------------- -------------------------------------------------------------
    3       2   1.41812e+09  Triggered by .
    4       2   1.41812e+09                      Executing action (_define_ha_operation).
    5       2   1.41812e+09                       Executed action (_define_ha_operation).
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                      Executing action (_find_candidate_fail).
    5       2   1.41812e+09                       Executed action (_find_candidate_fail).
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                     Executing action (_check_candidate_fail).
    5       2   1.41812e+09                      Executed action (_check_candidate_fail).
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                          Executing action (_wait_slave_fail).
    5       2   1.41812e+09                           Executed action (_wait_slave_fail).
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                      Executing action (_change_to_candidate).
    5       2   1.41812e+09                       Executed action (_change_to_candidate).


[mysql@testvm1 mysql]$ mysqlfabric group lookup_servers my_group
Password for admin:
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                         server_uuid      address    status       mode weight
------------------------------------ ------------ --------- ---------- ------
43f777a0-7f4a-11e4-863b-08002713b36f testvm2:3306 SECONDARY  READ_ONLY    1.0
7f5ba91e-81d1-11e4-96b7-0800273900a5 testvm3:3306   PRIMARY READ_WRITE    1.0
```

다른서버가 master가 되도록 하려면, 다시 커맨드 수행하면 된다고 하는데
2개 있을때는 candidate을 elect하지 못하는듯 한다.

```
[mysql@testvm1 mysql]$ mysqlfabric group promote my_group
Password for admin:
Fabric UUID: 5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

GroupError: There is no valid candidate that can be automatically chosen in group (my_group). Please, choose one manually.
```

* 하나더 추가해서 테스트
  * mysqlfabric group add my_group testvm4:3306
```
[mysql@testvm1 log]$ mysqlfabric group promote my_group
Password for admin:
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid finished success result
------------------------------------ -------- ------- ------
2e5f16ed-1864-4598-9c31-f8c1e6dd4879        1       1      1

state success          when                                                   description
----- ------- ------------- -------------------------------------------------------------
    3       2   1.41812e+09  Triggered by .
    4       2   1.41812e+09                      Executing action (_define_ha_operation).
    5       2   1.41812e+09                       Executed action (_define_ha_operation).
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                    Executing action (_find_candidate_switch).
    5       2   1.41812e+09                     Executed action (_find_candidate_switch).
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                   Executing action (_check_candidate_switch).
    5       2   1.41812e+09                    Executed action (_check_candidate_switch).
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                       Executing action (_block_write_switch).
    5       2   1.41812e+09                        Executed action (_block_write_switch).
    3       2   1.41812e+09  Triggered by .
    4       2   1.41812e+09                       Executing action (_wait_slaves_switch).
    5       2   1.41812e+09                        Executed action (_wait_slaves_switch).
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                      Executing action (_change_to_candidate).
    5       2   1.41812e+09                       Executed action (_change_to_candidate).


[mysql@testvm1 log]$ mysqlfabric group lookup_servers my_group
Password for admin:
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                         server_uuid      address    status       mode weight
------------------------------------ ------------ --------- ---------- ------
1c70d9dd-84e5-11e4-aac7-0800279a65c5 testvm4:3306 SECONDARY  READ_ONLY    1.0
43f777a0-7f4a-11e4-863b-08002713b36f testvm2:3306   PRIMARY READ_WRITE    1.0
7f5ba91e-81d1-11e4-96b7-0800273900a5 testvm3:3306 SECONDARY  READ_ONLY    1.0
```

## 4. maintenance

### 4.1 slave stop

slave server stop되면 FAULTY status됨.
다시 올려도 계속 FAULTY상태임.
이건 spare로 status바꿨다가 다시 secondary로 넣어줘야함.

```
[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg group health my_group
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid is_alive    status is_not_running is_not_configured io_not_running sql_not_running io_error sql_error
------------------------------------ -------- --------- -------------- ----------------- -------------- --------------- -------- ---------
1c70d9dd-84e5-11e4-aac7-0800279a65c5        1    FAULTY              0                 0              0               0    False     False
43f777a0-7f4a-11e4-863b-08002713b36f        1   PRIMARY              0                 0              0               0    False     False
7f5ba91e-81d1-11e4-96b7-0800273900a5        1 SECONDARY              0                 0              0               0    False     False

issue
-----


[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg server set_status 1c70d9dd-84e5-11e4-aac7-0800279a65c5 SPARE
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid finished success result
------------------------------------ -------- ------- ------
0df3d7d7-322a-40a5-9a7f-84f0f1a58fd8        1       1      1

state success          when                                                   description
----- ------- ------------- -------------------------------------------------------------
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                        Executing action (_set_server_status).
    5       2   1.41812e+09                         Executed action (_set_server_status).


[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg server set_status 1c70d9dd-84e5-11e4-aac7-0800279a65c5 SECONDARY
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid finished success result
------------------------------------ -------- ------- ------
e0a96e70-d32e-4b39-8d36-5a3f1abb5edd        1       1      1

state success          when                                                   description
----- ------- ------------- -------------------------------------------------------------
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                        Executing action (_set_server_status).
    5       2   1.41812e+09                         Executed action (_set_server_status).


[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg group health my_group
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid is_alive    status is_not_running is_not_configured io_not_running sql_not_running io_error sql_error
------------------------------------ -------- --------- -------------- ----------------- -------------- --------------- -------- ---------
1c70d9dd-84e5-11e4-aac7-0800279a65c5        1 SECONDARY              0                 0              0               0    False     False
43f777a0-7f4a-11e4-863b-08002713b36f        1   PRIMARY              0                 0              0               0    False     False
7f5ba91e-81d1-11e4-96b7-0800273900a5        1 SECONDARY              0                 0              0               0    False     False

issue
-----
```

### 4.2 master stop

일단 failure detector를 activate시키자.

```
[mysql@testvm1 conf]$ mysqlfabric group activate my_group
Password for admin:
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid finished success result
------------------------------------ -------- ------- ------
b9faf486-d2a5-4df3-aca2-84cc1d73e032        1       1      1

state success          when                                                   description
----- ------- ------------- -------------------------------------------------------------
    3       2   1.41812e+09 Triggered by .
    4       2   1.41812e+09                           Executing action (_activate_group).
    5       2   1.41812e+09                            Executed action (_activate_group).
master shutdown

[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg group health my_group
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid is_alive    status is_not_running is_not_configured io_not_running sql_not_running io_error sql_error
------------------------------------ -------- --------- -------------- ----------------- -------------- --------------- -------- ---------
1c70d9dd-84e5-11e4-aac7-0800279a65c5        1 SECONDARY              0                 0              0               0    False     False
43f777a0-7f4a-11e4-863b-08002713b36f        0    FAULTY              0                 0              0               0    False     False
7f5ba91e-81d1-11e4-96b7-0800273900a5        1   PRIMARY              0                 0              0               0    False     False

issue
-----
```

master는 faulty되고 다른 하나가 primary됨.

또 죽이면

```
[mysql@testvm1 conf]$ mysqlfabric --config=/db/mysql/conf/fabric.cfg group health my_group
Fabric UUID:  5ca1ab1e-a007-feed-f00d-cab3fe13249e
Time-To-Live: 1

                                uuid is_alive  status is_not_running is_not_configured io_not_running sql_not_running io_error sql_error
------------------------------------ -------- ------- -------------- ----------------- -------------- --------------- -------- ---------
1c70d9dd-84e5-11e4-aac7-0800279a65c5        1 PRIMARY              0                 0              0               0    False     False
43f777a0-7f4a-11e4-863b-08002713b36f        0  FAULTY              0                 0              0               0    False     False
7f5ba91e-81d1-11e4-96b7-0800273900a5        0  FAULTY              0                 0              0               0    False     False

issue
-----
```

둘다 다시 올려보자.
그래도 계속 faulty임

## 99. issue handling

### 99.1 regarding protocol.mysql

* error

```
[mysql@testvm1 conf]$ mysqlfabric  --config=/db/mysql/conf/fabric.cfg manage setup
[INFO] 1418110319.957376 - MainThread - Initializing persister: user (fabric), server (localhost:3306), database (fabric).
Traceback (most recent call last):
  File "/usr/bin/mysqlfabric", line 443, in
    main()
  File "/usr/bin/mysqlfabric", line 424, in main
    fire_command(cmd, *cargs)
  File "/usr/bin/mysqlfabric", line 356, in fire_command
    result = command.dispatch(*(command.append_options_to_args(args)))
  File "/usr/lib/python2.6/site-packages/mysql/fabric/services/manage.py", line 170, in dispatch
    _persistence.MySQLPersister())
  File "/usr/lib/python2.6/site-packages/mysql/fabric/credentials.py", line 493, in check_initial_setup
    username = config.get(section, 'user')
  File "/usr/lib64/python2.6/ConfigParser.py", line 532, in get
    raise NoSectionError(section)
ConfigParser.NoSectionError: No section: 'protocol.mysql'
[mysql@testvm1 conf]$
```

* solution
  * Please add the protocol.mysql section to the example configuration file, and to the manual page that lists all configuration file sections.

### 99.2 same UUID when cloning mysql instances

* solution
  * delete DATADIR/auto.cnf
  * and restart

```
[mysql@testvm2 data]$ more auto.cnf
[auto]
server-uuid=63ff2650-0bfb-11e4-9653-080027637261
[mysql@testvm2 data]$ mv auto.cnf  auto.cnf.bak
[mysql@testvm2 data]$ /db/mydba/56_shutdown.sh
141209 13:22:42 mysqld_safe mysqld from pid file /data1/mysql/data/testvm2.pid ended
[mysql@testvm2 data]$ /db/mydba/56_startup.sh
[mysql@testvm2 data]$ 141209 13:22:46 mysqld_safe Logging to '/data1/mysql/data/mysql.err'.
141209 13:22:46 mysqld_safe Starting mysqld daemon with databases from /data1/mysql/data
[mysql@testvm2 data]$ more auto.cnf
[auto]
server-uuid=43f777a0-7f4a-11e4-863b-08002713b36f
```
