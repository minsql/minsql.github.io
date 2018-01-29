---
title: MySQL to PostgreSQL Migration tool
author: min_kim
created: 2015/06/12 09:47:12
modified:
layout: post
tags: Postgres
image:
  feature: postgres.png
categories: blog
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---    



# MySQL to PostgreSQL Migration tool

> py-mysql2pgsql - A tool for migrating/converting/exporting data from MySQL to PostgreSQL https://github.com/philipsoutham/py-mysql2pgsql

### 1\. py-mysql2pgsql 설치

#### 1.1 requirements, pip설치


    [root@pgvm1 ~]# wget https://bitbucket.org/pypa/setuptools/raw/bootstrap/ez_setup.py

    [root@pgvm1 ~]# python ez_setup.py

    [root@pgvm1 ~]# easy_install pip

    [root@pgvm1 ~]# yum install MySQL-python

    [root@pgvm1 ~]# yum install postgresql-devel

    [root@pgvm1 ~]# yum install python-devel

    [root@pgvm1 ~]# yum install python-psycopg2




#### 1.2 py-mysql2pgsql 설치



    [root@pgvm1 ~]# pip install py-mysql2pgsql

    [root@pgvm1 ~]# which py-mysql2pgsql
    /usr/bin/py-mysql2pgsql


### 2\. Configuration

#### 2.1 Usage 확인


    [postgres@pgvmll1 ~]$ py-mysql2pgsql -h
    usage: py-mysql2pgsql [-h] [-v] [-f FILE] [-V]

    Tool for migrating/converting data from mysql to postgresql.

    optional arguments:
      -h, --help            show this help message and exit
      -v, --verbose         Show progress of data migration.
      -f FILE, --file FILE  Location of configuration file (default:
                            mysql2pgsql.yml). If none exists at that path, one
                            will be created for you.
      -V, --version         Print version and exit.

    https://github.com/philipsoutham/py-mysql2pgsql


#### 2.2 mysql2pgsql.yml 생성


    [postgres@pgvm1 py-mysql2pgsql]$ mkdir output
    [postgres@pgvm1 py-mysql2pgsql]$ vi mysql2pgsql.yml
    mysql:
     hostname: 192.168.56.111
     port: 3355
     socket:
     username: michaela
     password: michaela
     database: core
     compress: false
    destination:
     # if file is given, output goes to file, else postgres
     file: output/results-pgsql.sql
     postgres:
      hostname: localhost
      port: 5434
      username: incarta
      password: incarta
      database: incartadb



#### 2.3 target user/tablespace/database/schema 생성


    [postgres@pgvm1 9.4]$ mkdir -p pg_data/incarta_data



    CREATE ROLE incarta LOGIN
      PASSWORD 'incarta'
      NOSUPERUSER INHERIT NOCREATEDB NOCREATEROLE NOREPLICATION;

    CREATE TABLESPACE incarta_data
      OWNER postgres
      LOCATION '/data1/9.4/pg_data/incarta_data';
    COMMENT ON TABLESPACE incarta_data
      IS 'incarta data tablespace';

    GRANT ALL ON TABLESPACE incarta_data TO incarta;


    CREATE DATABASE incartadb
      WITH OWNER = incarta
           ENCODING = 'UTF8'
           TABLESPACE = incarta_data
           LC_COLLATE = 'en_US.UTF-8'
           LC_CTYPE = 'en_US.UTF-8'
           CONNECTION LIMIT = -1;

    COMMENT ON DATABASE incartadb
      IS 'incarta database';

     alter database incartadb set default_tablespace ='incarta_data';

    GRANT ALL ON DATABASE incartadb to incarta;


    postgres=# c incartadb incarta
    You are now connected to database "incartadb" as user "incarta".
    incartadb=> show default_tablespace ;
     default_tablespace
    --------------------
     incarta_data
    (1 row)

    incartadb=>


    CREATE SCHEMA core
      AUTHORIZATION incarta;

    alter database incartadb SET search_path TO core;



### 3\. py-mysql2pgsql 실행


    py-mysql2pgsql -v -f mysql2pgsql.yml


  * socket을 주면 localhost의 socket 통신을 함.
  * remote server접속을 위해서는 host, port을 주고 socket은 명시하지 않아야함.
  * destination file 주면 file로 export, file 없을 때 명시된 postgresql 로 migrating함

### 4\. 동작 결과

  * file로 exporting하는 경우
    * 이슈없음
  * target postgresql로 migration 하는 경우
    * mysql의 각 database를 postgresql schema로 이관하기 위해서는, 이관하기전에 search_path을 원하는 스키마로 설정한 후 진행.
