---
title: Docker를 이용한 MySQL RPM 설치 및 기타 Tool 설치
author: min_cho
created: 2019/09/11
modified:
layout: post
tags: mysql
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

------
# 명령어 모음
## OS 명령어
### Docker로 centos 이미지 만들기
```
docker search centos
docker pull centos
docker images -a
docker run -dit --hostname C7_M8017 --name centos7_mysql8017 centos
docker container ls -a
docker exec -it centos7_mysql8017 /bin/bash
```

## Inside Docker
### MySQL 설치에 필요한 binaries Download
```
cd / && mkdir MySQL_binaries && cd MySQL_binaries/
yum -y install wget
yum -y install perl
yum -y install libaio
yum -y install net-tools
wget https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.17-1.el7.x86_64.rpm-bundle.tar --no-check-certificate
wget http://mirror.centos.org/centos/7/os/x86_64/Packages/numactl-libs-2.0.9-7.el7.x86_64.rpm
wget http://mirror.centos.org/centos/7/os/x86_64/Packages/numactl-devel-2.0.9-7.el7.x86_64.rpm
```

### RPM을 통한 MySQL 설치
```
tar xvf mysql-8.0.17-1.el7.x86_64.rpm-bundle.tar
rpm -Uvh numactl-*
rpm -Uvh mysql-community-{server,client,common,libs-compat,libs}-*
```

### MySQL 초기화 및 시작
```
mysqld --initialize-insecure --user=root
echo "default-authentication-plugin=mysql_native_password" >> /etc/my.cnf
mysqld --user=root &
mysql -uroot -e 'create user MinCHO; grant all on *.* to MinCHO;'
```

### sysbench 설치
```
echo "sslverify=false" >> /etc/yum.conf
yum install -y epel-release
yum install -y sysbench
```

### Sysbench를 통한 간단한 테스트
```
sysbench --mysql-user=MinCHO  --mysql-socket=/var/lib/mysql/mysql.sock --mysql-db=db --threads=8 --table-size=300000 --tables=3 /usr/share/sysbench/bulk_insert.lua prepare
sysbench --mysql-user=MinCHO  --mysql-socket=/var/lib/mysql/mysql.sock --mysql-db=db --threads=8 --table-size=300000 --tables=3 /usr/share/sysbench/bulk_insert.lua run
sysbench --mysql-user=MinCHO  --mysql-socket=/var/lib/mysql/mysql.sock --mysql-db=db --threads=8 --table-size=300000 --tables=3 /usr/share/sysbench/bulk_insert.lua cleanup
```

### Percona Random data load downlad 및 data 생성
```
wget https://github.com/Percona-Lab/mysql_random_data_load/releases/download/v0.1.10/mysql_random_data_load_linux_amd64.tar.gz --no-check-certificate
tar xfz mysql_random_data_load_linux_amd64.tar.gz
mysql -uMinCHO -e 'create database db; create table db.tbl (a int, b varchar(10), c char(10));'
 ./mysql_random_data_load db tbl 100 --user=MinCHO
```



# LOGS
## OS
```
mincho_makayal:~ makayal$ docker search centos
NAME                               DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
centos                             The official build of CentOS.                   5555                [OK]
...

mincho_makayal:~ makayal$ docker pull centos
Using default tag: latest
latest: Pulling from library/centos
Digest: sha256:307835c385f656ec2e2fec602cf093224173c51119bbebd602c53c3653a3d6eb
Status: Image is up to date for centos:latest

mincho_makayal:~ makayal$ docker images -a
REPOSITORY               TAG                 IMAGE ID            CREATED             SIZE
centos                   latest              67fa590cfc1c        2 weeks ago         202MB

mincho_makayal:~ makayal$ docker run -dit --hostname C7_M8017 --name centos7_mysql8017 centos
58d5c87165d0cc42a8badfb957610d7acc21e64d3dcf7fb03a1b04d45cf8e3de
mincho_makayal:~ makayal$ docker container ls -a
CONTAINER ID        IMAGE                   COMMAND                  CREATED             STATUS                      PORTS                 NAMES
58d5c87165d0        centos                  "/bin/bash"              5 seconds ago       Up 3 seconds                                      centos7_mysql8017

mincho_makayal:~ makayal$ docker exec -it centos7_mysql8017 /bin/bash
```


## Inside Docker
```
[root@C7_M8017 /]# cd / && mkdir MySQL_binaries && cd MySQL_binaries/

[root@C7_M8017 MySQL_binaries]# yum -y install wget
Loaded plugins: fastestmirror, ovl
...
Complete!

[root@C7_M8017 MySQL_binaries]# yum -y install perl
Loaded plugins: fastestmirror, ovl
...
Complete!

[root@C7_M8017 MySQL_binaries]# yum -y install libaio
Loaded plugins: fastestmirror, ovl
...
Complete!

[root@C7_M8017 MySQL_binaries]# wget https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.17-1.el7.x86_64.rpm-bundle.tar --no-check-certificate
--2019-09-09 01:38:06--  https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.17-1.el7.x86_64.rpm-bundle.tar
...
100%[========================================================================================================================================================================================================>] 663,142,400 10.5MB/s   in 82s
2019-09-09 01:39:30 (7.71 MB/s) - 'mysql-8.0.17-1.el7.x86_64.rpm-bundle.tar' saved [663142400/663142400]

[root@C7_M8017 MySQL_binaries]# wget http://mirror.centos.org/centos/7/os/x86_64/Packages/numactl-libs-2.0.9-7.el7.x86_64.rpm
--2019-09-09 01:39:30--  http://mirror.centos.org/centos/7/os/x86_64/Packages/numactl-libs-2.0.9-7.el7.x86_64.rpm
...
100%[========================================================================================================================================================================================================>] 30,192      --.-K/s   in 0.09s
2019-09-09 01:39:31 (334 KB/s) - 'numactl-libs-2.0.9-7.el7.x86_64.rpm' saved [30192/30192]

[root@C7_M8017 MySQL_binaries]# wget http://mirror.centos.org/centos/7/os/x86_64/Packages/numactl-devel-2.0.9-7.el7.x86_64.rpm
--2019-09-09 01:39:55--  http://mirror.centos.org/centos/7/os/x86_64/Packages/numactl-devel-2.0.9-7.el7.x86_64.rpm
...
100%[========================================================================================================================================================================================================>] 23,460      --.-K/s   in 0.09s
2019-09-09 01:39:55 (247 KB/s) - 'numactl-devel-2.0.9-7.el7.x86_64.rpm' saved [23460/23460]

[root@C7_M8017 MySQL_binaries]# tar xvf mysql-8.0.17-1.el7.x86_64.rpm-bundle.tar
mysql-community-test-8.0.17-1.el7.x86_64.rpm
mysql-community-server-8.0.17-1.el7.x86_64.rpm
mysql-community-embedded-compat-8.0.17-1.el7.x86_64.rpm
mysql-community-client-8.0.17-1.el7.x86_64.rpm
mysql-community-devel-8.0.17-1.el7.x86_64.rpm
mysql-community-common-8.0.17-1.el7.x86_64.rpm
mysql-community-libs-compat-8.0.17-1.el7.x86_64.rpm
mysql-community-libs-8.0.17-1.el7.x86_64.rpm

[root@C7_M8017 MySQL_binaries]# rpm -Uvh numactl-*
Preparing...                          ################################# [100%]
Updating / installing...
   1:numactl-libs-2.0.9-7.el7         ################################# [ 50%]
   2:numactl-devel-2.0.9-7.el7        ################################# [100%]

[root@C7_M8017 MySQL_binaries]# rpm -Uvh mysql-community-{server,client,common,libs-compat,libs}-*
warning: mysql-community-server-8.0.17-1.el7.x86_64.rpm: Header V3 DSA/SHA1 Signature, key ID 5072e1f5: NOKEY
warning: package mysql-community-libs-compat-8.0.17-1.el7.x86_64 was already added, skipping mysql-community-libs-compat-8.0.17-1.el7.x86_64
Preparing...                          ################################# [100%]
Updating / installing...
   1:mysql-community-common-8.0.17-1.e################################# [ 20%]
   2:mysql-community-libs-8.0.17-1.el7################################# [ 40%]
   3:mysql-community-client-8.0.17-1.e################################# [ 60%]
   4:mysql-community-server-8.0.17-1.e################################# [ 80%]
   5:mysql-community-libs-compat-8.0.1################################# [100%]

[root@C7_M8017 MySQL_binaries]# mysqld --initialize-insecure --user=root

[root@C7_M8017 MySQL_binaries]# echo "default-authentication-plugin=mysql_native_password" >> /etc/my.cnf

[root@C7_M8017 MySQL_binaries]# mysqld --user=root &
[1] 166

[root@C7_M8017 MySQL_binaries]# mysql -uroot -e 'create user MinCHO; grant all on *.* to MinCHO;'

[root@C7_M8017 MySQL_binaries]# echo "sslverify=false" >> /etc/yum.conf

[root@C7_M8017 MySQL_binaries]# yum install -y epel-release
Loaded plugins: fastestmirror, ovl
Loading mirror speeds from cached hostfile
...
Complete!

[root@C7_M8017 MySQL_binaries]# yum install -y sysbench
Loaded plugins: fastestmirror, ovl
...
Complete!

[root@C7_M8017 MySQL_binaries]# sysbench --mysql-user=MinCHO  --mysql-socket=/var/lib/mysql/mysql.sock --mysql-db=db --threads=8 --table-size=300000 --tables=3 /usr/share/sysbench/bulk_insert.lua prepare
sysbench 1.0.17 (using system LuaJIT 2.0.4)

Creating table 'sbtest1'...
Creating table 'sbtest2'...
Creating table 'sbtest3'...
Creating table 'sbtest4'...
Creating table 'sbtest5'...
Creating table 'sbtest6'...
Creating table 'sbtest7'...
Creating table 'sbtest8'...

[root@C7_M8017 MySQL_binaries]# sysbench --mysql-user=MinCHO  --mysql-socket=/var/lib/mysql/mysql.sock --mysql-db=db --threads=8 --table-size=300000 --tables=3 /usr/share/sysbench/bulk_insert.lua run
sysbench 1.0.17 (using system LuaJIT 2.0.4)

Running the test with following options:
Number of threads: 8
Initializing random number generator from current time


Initializing worker threads...

Threads started!

SQL statistics:
    queries performed:
        read:                            0
        write:                           81
        other:                           0
        total:                           81
    transactions:                        2528368 (241385.61 per sec.)
    queries:                             81     (7.73 per sec.)
    ignored errors:                      0      (0.00 per sec.)
    reconnects:                          0      (0.00 per sec.)

General statistics:
    total time:                          10.4725s
    total number of events:              2528368

Latency (ms):
         min:                                    0.00
         avg:                                    0.03
         max:                                 1441.71
         95th percentile:                        0.00
         sum:                                78882.14

Threads fairness:
    events (avg/stddev):           316046.0000/12515.13
    execution time (avg/stddev):   9.8603/0.18

[root@C7_M8017 MySQL_binaries]# sysbench --mysql-user=MinCHO  --mysql-socket=/var/lib/mysql/mysql.sock --mysql-db=db --threads=8 --table-size=300000 --tables=3 /usr/share/sysbench/bulk_insert.lua cleanup
sysbench 1.0.17 (using system LuaJIT 2.0.4)

Dropping table 'sbtest1'...
Dropping table 'sbtest2'...
Dropping table 'sbtest3'...
Dropping table 'sbtest4'...
Dropping table 'sbtest5'...
Dropping table 'sbtest6'...
Dropping table 'sbtest7'...
Dropping table 'sbtest8'...

[root@C7_M8017 MySQL_binaries]# wget https://github.com/Percona-Lab/mysql_random_data_load/releases/download/v0.1.10/mysql_random_data_load_linux_amd64.tar.gz --no-check-certificate
--2019-09-09 01:57:30--  https://github.com/Percona-Lab/mysql_random_data_load/releases/download/v0.1.10/mysql_random_data_load_linux_amd64.tar.gz
...
100%[========================================================================================================================================================================================================>] 2,940,957    887KB/s   in 3.2s
2019-09-09 01:57:37 (887 KB/s) - 'mysql_random_data_load_linux_amd64.tar.gz' saved [2940957/2940957]

[root@C7_M8017 MySQL_binaries]# tar xfz mysql_random_data_load_linux_amd64.tar.gz

[root@C7_M8017 MySQL_binaries]# mysql -uMinCHO -e 'create database db; create table db.tbl (a int, b varchar(10), c char(10));'

[root@C7_M8017 MySQL_binaries]#  ./mysql_random_data_load db tbl 100 --user=MinCHO
INFO[2019-09-09T01:57:53Z] Starting
   0s [====================================================================] 100%
INFO[2019-09-09T01:57:54Z] 100 rows inserted
```
