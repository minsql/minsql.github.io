---
title: Xcode를 통한 MySQL Build 및 Debug
author: min_cho
created: 2019/09/06
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

### Windows를 사용할때 Visual Studio 사용하며 디버깅할때의 편안함을 잊지 못하고 Xcode를 통해 build 하는 방법에 대해 로깅


```
$ cd /Users/MinCHO/CM/MySQL_debug

$ mkdir -p 8.0.17/{src,data} && cd 8.0.17/src

$ pwd
/Users/MinCHO/CM/MySQL_debug/8.0.17/src



$ wget https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.17.tar.gz --no-check-certificate
--2019-09-06 15:00:37--  https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-8.0.17.tar.gz
Resolving dev.mysql.com (dev.mysql.com)... 137.254.60.11
Connecting to dev.mysql.com (dev.mysql.com)|137.254.60.11|:443... connected.
WARNING: cannot verify dev.mysql.com's certificate, issued by ‘emailAddress=pat@somansa.com,CN=Somansa Root CA,OU=NDLP,O=Somansa,ST=Seoul,C=KR’:
  Self-signed certificate encountered.
HTTP request sent, awaiting response... 302 Found
Location: https://cdn.mysql.com//Downloads/MySQL-8.0/mysql-8.0.17.tar.gz [following]
--2019-09-06 15:00:38--  https://cdn.mysql.com//Downloads/MySQL-8.0/mysql-8.0.17.tar.gz
Resolving cdn.mysql.com (cdn.mysql.com)... 23.53.224.54
Connecting to cdn.mysql.com (cdn.mysql.com)|23.53.224.54|:443... connected.
WARNING: cannot verify cdn.mysql.com's certificate, issued by ‘emailAddress=pat@somansa.com,CN=Somansa Root CA,OU=NDLP,O=Somansa,ST=Seoul,C=KR’:
  Self-signed certificate encountered.
HTTP request sent, awaiting response... 200 OK
Length: 190203398 (181M) [application/x-tar-gz]
Saving to: ‘mysql-8.0.17.tar.gz’

mysql-8.0.17.tar.gz                                100%[=============================================================================================================>] 181.39M  8.21MB/s    in 20s

2019-09-06 15:00:59 (9.03 MB/s) - ‘mysql-8.0.17.tar.gz’ saved [190203398/190203398]




$ tar xfz mysql-8.0.17.tar.gz

$ cd mysql-8.0.17 && mkdir bld && cd ./bld

$ pwd
/Users/MinCHO/CM/MySQL_debug/8.0.17/src/mysql-8.0.17/bld



$ sudo /usr/bin/xcode-select --switch /Users/MinCHO/CM/Xcode.app/

$ cmake .. -G Xcode \
-DCMAKE_INSTALL_PREFIX=/Users/MinCHO/CM/MySQL_debug/8.0.17/bin \
-DMYSQL_UNIX_ADDR=/Users/MinCHO/CM/MySQL_debug/8.0.17/data/mysql.sock \
-DDEFAULT_CHARSET=utf8mb4 \
-DDEFAULT_COLLATION=utf8mb4_bin \
-DWITH_EXTRA_CHARSETS=all \
-DMYSQL_DATADIR=/Users/MinCHO/CM/MySQL_debug/8.0.17/data \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_MYISAM_STORAGE_ENGINE=1 \
-DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DWITH_MEMORY_STORAGE_ENGINE=1 \
-DWITH_FEDERATED_STORAGE_ENGINE=0 \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=/MySQL/sources \
-DWITH_READLINE=1 \
-DMYSQL_USER=mysql \
-DMYSQL_TCP_PORT=8017 \
-DENABLE_DOWNLOADS=1 \
-DWITH_DEBUG=1

-- Running cmake version 3.13.4
-- Found Git: /usr/bin/git (found version "2.15.1 (Apple Git-101)")
-- MySQL 8.0.17
-- The C compiler identification is AppleClang 9.1.0.9020039
-- The CXX compiler identification is AppleClang 9.1.0.9020039
-- Check for working C compiler: /Users/MinCHO/CM/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin/clang
.....
-- CMAKE_SHARED_LINKER_FLAGS
-- Configuring done
-- Generating done
CMake Warning:
  Manually-specified variables were not used by the project:

    MYSQL_USER
    WITH_MEMORY_STORAGE_ENGINE
    WITH_READLINE


-- Build files have been written to: /Users/MinCHO/CM/MySQL_debug/8.0.17/src/mysql-8.0.17/bld
```

* Xcode project 를 열어 build 한 후, "command + shift + ," 를 눌러 mysqld 를 --initialize-insecure  인자와 함께 한번 실행 후, 다음번부터는 제거 한다.
 * https://dev.mysql.com/doc/refman/8.0/en/server-options.html#option_mysqld_initialize-insecure
