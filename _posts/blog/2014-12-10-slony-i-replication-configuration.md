---
title: Slony-I Replication Configuration
author: min_kim
created: 2014/12/10 03:01:32
modified:
layout: post
tags: postgres, postgres_replication
image:
  feature: postgres.png
categories: Postgres
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---    


# Slony-I Replication Configuration

## Slony-I 구성해보자. 왜 ?

  * PostgreSQL 9.0부터 streaming replication이 지원되었다. 보통의 경우 streaming이 더 간단하다.
  * 그럼 Slony-I이 필요한 경우는 ?
    * WAL-based replication구성이 불가능한 경우, 예를 들어 서로다른 버전간의 repliaction.
    * 부분 replication. (일부 테이블만 지정가능)
    * slave에서 추가 작업하려는 경우.

## Installation


    [postgres@testvm1 ~]$ bzip2 -d slony1-2.2.3.tar.bz2
    [postgres@testvm1 ~]$ tar xf slony1-2.2.3.tar
    [postgres@testvm1 ~]$ cd slony1-2.2.3
    [postgres@testvm1 slony1-2.2.3]$ ./configure --prefix=$PGHOME --with-pgconfigdir=$PGHOME/bin --with-perltools
    [postgres@testvm1 slony1-2.2.3]$ gmake all; gmake install

## Replication Configuration

* Master : testvm1
* Slave : testvm2
* cluster name : slony1
* master db name : pgbench
* slave db name : pgbench
* replication user : slony
* pgbench user : pgbench


### 0\. Create replication user


    [postgres@testvm1 ~]$ createuser -s slony -W
    Password:
    [postgres@testvm1 ~]$ vi $PGDATA/pg_hba.conf
    host	all	slony	testvm1	trust
    host	all	slony	testvm2	trust
    [postgres@testvm1 ~]$ pg_ctl reload
    LOG:  received SIGHUP, reloading configuration files
    server signaled



    [postgres@testvm2 slony1-2.2.3]$ createuser -s slony -W
    Password:
    postgres@testvm1 ~]$ vi $PGDATA/pg_hba.conf
    host	all	slony	testvm1	trust
    host	all	slony	testvm2	trust
    [postgres@testvm1 ~]$ pg_ctl reload
    LOG:  received SIGHUP, reloading configuration files
    server signaled


### 1\. Creating pgbench user and DB


    [postgres@testvm1 ~]$ createuser -SRD pgbench -W
    Password:
    [postgres@testvm1 ~]$ createdb -O pgbench pgbench



    [postgres@testvm2 ~]$ createuser -SRD pgbench -W
    Password:
    [postgres@testvm2 ~]$ createdb -O pgbench pgbench


### 2\. Preparing pgbench DB
* Master에서만 pgbench tool 설치후 data 생성
* Slony-I에서는 PK가 필수임. PK가 없는 테이블(pgbench_history)에 PK추가해줘야함.

```
[postgres@testvm1 ~]$ cd /db/postgres-9.3.5/contrib/pgbench/
[postgres@testvm1 pgbench]$ make install
/bin/mkdir -p '/db/postgres/bin'
/usr/bin/install -c  pgbench '/db/postgres/bin'
[postgres@testvm1 pgbench]$ pgbench -i -s 1 -U pgbench pgbench
NOTICE:  table "pgbench_history" does not exist, skipping
NOTICE:  table "pgbench_tellers" does not exist, skipping
NOTICE:  table "pgbench_accounts" does not exist, skipping
NOTICE:  table "pgbench_branches" does not exist, skipping
creating tables...
100000 of 100000 tuples (100%) done (elapsed 0.41 s, remaining 0.00 s).
vacuum...
set primary keys...
done.
[postgres@testvm1 pgbench]$ psql -U pgbench pgbench
psql (9.3.5)
Type "help" for help.

pgbench=> d+ pgbench_history;
                              Table "public.pgbench_history"
 Column |            Type             | Modifiers | Storage  | Stats target | Description
--------+-----------------------------+-----------+----------+--------------+-------------
 tid    | integer                     |           | plain    |              |
 bid    | integer                     |           | plain    |              |
 aid    | integer                     |           | plain    |              |
 delta  | integer                     |           | plain    |              |
 mtime  | timestamp without time zone |           | plain    |              |
 filler | character(22)               |           | extended |              |
Has OIDs: no

pgbench=> begin;
BEGIN
pgbench=> alter table pgbench_history add column id serial;
ALTER TABLE
pgbench=> update pgbench_history set id=nextval('pgbench_history_id_seq');
UPDATE 0
pgbench=> alter table pgbench_history add primary key(id);
ALTER TABLE
pgbench=> commit;
COMMIT
pgbench=>

```

* Slony-I에서 pl/pgSQL 을 사용함. 없다면 install 해줘야한다. 설치되어 있었다면 스킵.

```
[postgres@testvm1 ~]$ createlang plpgsql pgbench
createlang: language "plpgsql" is already installed in database "pgbench"

```
* Slony-I은 table definition을 copy주진 않는다. slave에 pg_dump로 밀 schema 카피해줘야함.

```
[postgres@testvm1 ~]$ pg_dump -s pgbench | psql -U slony -h testvm2 pgbench
SET
SET
SET
SET
SET
SET
CREATE EXTENSION
COMMENT
SET
SET
SET
CREATE TABLE
ALTER TABLE
CREATE TABLE
ALTER TABLE
CREATE TABLE
ALTER TABLE
CREATE SEQUENCE
ALTER TABLE
ALTER SEQUENCE
CREATE TABLE
ALTER TABLE
ALTER TABLE

ALTER TABLE
ALTER TABLE
ALTER TABLE
ALTER TABLE
REVOKE
REVOKE
GRANT
GRANT
```

### 3\. Configuring the database for replication
* slonik tool을 사용하여 configuration tool, stored procedures, triggers를 생성하고 구성해야한다. slonik command를 바로 날릴 수도 있지만, 보통은 slonik script를 작성해주는 tool 을 사용한다.
  * altperl Scripts : perl script, 하나의 slon_tools.conf를 기반으로 slonik script를 생성
  * mkslonconf.sh : shell script, 입력받은 변수 및 환경변수를 기반으로 전체 cluster에 대한 slonik scripts를 생성.

#### 3.1 slonik_build_env slon_tools.conf을 작성하는 파일
* option은 host:database:user[:password:port]
* output slon_tools.conf 을 확인 후, @PKEYEDTABLES, @SEQUENCES의 ()을 []로 변경한다.

```
[postgres@testvm1 pgdba]$ vi slon_build.sh
#!/bin/sh
SLONDIR=/db/pgdba/slony1
mkdir -p $SLONDIR/conf
mkdir -p $SLONDIR/logs
CONF=/db/pgdba/slony1/conf/slon_tools.conf
cat << EOF > $CONF
$CLUSTER_NAME = 'slony1';
$LOGDIR = '$SLONDIR/logs';
$PIDFILE_DIR = '$SLONDIR';
$MASTERNODE = 1;
EOF
slonik_build_env
-node testvm1:pgbench:slony:slony
-node testvm2:pgbench:slony:slony >> $CONF
cat << EOF >> $CONF
$SLONY_SETS = {
    "set1" => {
        "set_id" => 1,
        "table_id" => 1,
        "sequence_id" => 1,
        "pkeyedtables" => @PKEYEDTABLES,
        "sequences" => @SEQUENCES,
    }
}
EOF

[postgres@testvm1 pgdba]$ sh +x slon_build.sh
[postgres@testvm1 pgdba]$ vi slony1/conf/slon_tools.conf
$CLUSTER_NAME = 'slony1';
$LOGDIR = '/db/pgdba/slony1/logs';
$PIDFILE_DIR = '/db/pgdba/slony1';
$MASTERNODE = 1;
&add;_node(host => 'testvm1', dbname => 'pgbench', port =>5432,
        user=>'slony', password=>'slony', node=>1 );
&add;_node(host => 'testvm2', dbname => 'pgbench', port =>5432,
        user=>'slony', password=>'slony', node=>2 , parent=>1);
@PKEYEDTABLES=(
	"public.pgbench_accounts",
	"public.pgbench_branches",
	"public.pgbench_history",
	"public.pgbench_tellers",
);
@SEQUENCES=(
	"public.pgbench_history_id_seq",
);
$SLONY_SETS = {
    "set1" => {
        "set_id" => 1,
        "table_id" => 1,
        "sequence_id" => 1,
        "pkeyedtables" => @PKEYEDTABLES,
        "sequences" => @SEQUENCES,
    }
}
```

#### 3.2 initialize cluster \- _slony schema 및 table 생성

```
[postgres@testvm1 pgdba]$ slonik_init_cluster --config=/db/pgdba/slony1/conf/slon_tools.conf |slonik
:10: Set up replication nodes
:13: Next: configure paths for each node/origin
:16: Replication nodes prepared
:17: Please start a slon replication daemon for each node
[postgres@testvm1 pgdba]$
```

#### 3.3 start slon

```
[postgres@testvm1 pgdba]$  slon_start --config=/db/pgdba/slony1/conf/slon_tools.conf 1
Invoke slon for node 1 - /db/postgres/bin/slon -p /db/pgdba/slony1/slony1_node1.pid -s 1000 -d0  slony1 'host=testvm1 dbname=pgbench user=slony port=5432 password=slony' > /db/pgdba/slony1/logs/node1/pgbench-2014-12-09.log 2>&1 &
Slon successfully started for cluster slony1, node node1
PID [32334]
Start the watchdog process as well...
[postgres@testvm1 pgdba]$  slon_start --config=/db/pgdba/slony1/conf/slon_tools.conf 2
```
