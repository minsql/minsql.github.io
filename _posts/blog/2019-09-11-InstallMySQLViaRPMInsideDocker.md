---
title: MySQL 디버깅을 위한 Docker 안에서 MySQL Source 설치하기
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

# 주의사항
 * 해당 스크립트는 MySQL Debugging 을 위해 debug버젼을 compile하는데 목적이 있음으로 OS root유저로 진행한다. 사용을 위해서는 정상적인 절차 (mysql user 생성 / systemd 등록..) 를 진행한다.
 * 5.7 과 8.0은 명령어가 조금 다른데, 해당이유는 8.0을 compile 하기 위해서는 cmake 버젼과 gcc 버젼을 올려줘야 한다.
 * 8.0 compile시, `fatal error: ld terminated with signal 9 [Killed]` 라는 에러가 발생했는데 이는 docker가 사용했던 메모리가 부족 (2GiB)하여 발생되었다. oom 세팅과 메모리를 4GiB로 올린 후 문제는 발생하지 않았다.
 * _windows 는 깔끔하게 mysql_debug binary를 받아서 사용하면 된다. :-)_


# 5.7
## OS 명령어
### Docker로 centos 이미지 만들기
```
docker search centos
docker pull centos
docker images -a
docker run -dit --hostname C7_compiled_5727 --name centos7_complied_mysql_5727 centos
docker container ls -a
docker exec -it centos7_complied_mysql_5727 /bin/bash
```

## Inside Docker
### MySQL Build에 필요한 유팀 및 의존성 설치
```
yum -y update
yum -y install cmake
yum -y install gcc-c++
yum -y install wget
yum -y install perl
yum -y install libaio
yum -y install net-tools
yum -y install ncurses-devel
yum -y groupinstall "Development Libraries" "Development Tools"
```

### source 받기 및 make
```
cd / && mkdir MySQL_sources && cd MySQL_sources/

wget https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-5.7.27.tar.gz --no-check-certificate

tar xfz mysql-5.7.27.tar.gz

cd mysql-5.7.27

mkdir -p /usr/local/makayal

cmake \
-DCMAKE_INSTALL_PREFIX=/usr/local/makayal/mysql \
-DMYSQL_UNIX_ADDR=/usr/local/makayal/mysql/tmp/mysql.sock \
-DDEFAULT_CHARSET=utf8mb4 \
-DDEFAULT_COLLATION=utf8mb4_bin \
-DWITH_EXTRA_CHARSETS=all \
-DMYSQL_DATADIR=/usr/local/makayal/mysql/data \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_MYISAM_STORAGE_ENGINE=1 \
-DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DWITH_ARCHIVE_STORAGE_ENGINE=1 \
-DWITH_BLACKHOLE_STORAGE_ENGINE=1 \
-DWITH_FEDERATED_STORAGE_ENGINE=0 \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=/MySQL/sources \
-DMYSQL_TCP_PORT=5727 \
-DENABLE_DOWNLOADS=1 \
-DWITH_DEBUG=1

make && make install

mkdir -p /usr/local/makayal/mysql/data/

mkdir -p /usr/local/makayal/mysql/tmp/

/usr/local/makayal/mysql/bin/mysqld --initialize-insecure --user=root --datadir=/usr/local/makayal/mysql/data

/usr/local/makayal/mysql/bin/mysqld --user=root --datadir=/usr/local/makayal/mysql/data --debug='d:t:i:F:L:o,/tmp/mysqld.trace' &

```

------
# 8.0
## OS 명령어
### Docker로 centos 이미지 만들기
```
docker search centos
docker pull centos
docker images -a
docker run -dit --oom-kill-disable=true --oom-score-adj=1  --memory="4g" --hostname C7_compiled_8017 --name centos7_complied_mysql_8017 centos
docker container ls -a
docker exec -it centos7_complied_mysql_8017 /bin/bash
```

## Inside Docker
### MySQL Build에 필요한 유팀 및 의존성 설치
```
echo "sslverify=false" >> /etc/yum.conf
yum -y update
yum -y install epel-release
yum -y install cmake3
yum -y install centos-release-scl
yum -y install devtoolset-7-gcc*
yum -y install wget
yum -y install perl
yum -y install libaio
yum -y install net-tools
yum -y install ncurses-devel
yum -y install openssl
yum -y install openssl-devel
yum -y groupinstall "Development Libraries" "Development Tools"
scl enable devtoolset-7 bash
```

### source 받기 및 make
```
cd / && mkdir MySQL_sources && cd MySQL_sources/

wget https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.17.tar.gz --no-check-certificate

tar xfz mysql-8.0.17.tar.gz

cd mysql-8.0.17

mkdir -p /usr/local/makayal

cmake3 \
-DCMAKE_INSTALL_PREFIX=/usr/local/makayal/mysql \
-DMYSQL_UNIX_ADDR=/usr/local/makayal/mysql/tmp/mysql.sock \
-DDEFAULT_CHARSET=utf8mb4 \
-DDEFAULT_COLLATION=utf8mb4_bin \
-DWITH_EXTRA_CHARSETS=all \
-DMYSQL_DATADIR=/usr/local/makayal/mysql/data \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_MYISAM_STORAGE_ENGINE=1 \
-DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DWITH_ARCHIVE_STORAGE_ENGINE=1 \
-DWITH_BLACKHOLE_STORAGE_ENGINE=1 \
-DWITH_FEDERATED_STORAGE_ENGINE=0 \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=/MySQL/sources \
-DMYSQL_TCP_PORT=8017 \
-DENABLE_DOWNLOADS=1 \
-DFORCE_INSOURCE_BUILD=1 \
-DWITH_SSL=system \
-DWITH_DEBUG=1

make && make install

mkdir -p /usr/local/makayal/mysql/data/

mkdir -p /usr/local/makayal/mysql/tmp/

/usr/local/makayal/mysql/bin/mysqld --initialize-insecure --user=root --datadir=/usr/local/makayal/mysql/data

/usr/local/makayal/mysql/bin/mysqld --user=root --datadir=/usr/local/makayal/mysql/data --debug='d:t:i:F:L:o,/tmp/mysqld.trace' &
```
