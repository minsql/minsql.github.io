---
title: pg_rewind로 좀더 편해진 Streaming replication Failback
author: min_kim
created: 2016/06/10 12:39:04
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

# pg_rewind로 좀더 편해진 Streaming replication Failback

### pg_rewind

  * 9.5부터 지원되는 feature이다.
  * streaming replication을 사용하다가 마스터가 failure난 경우, 쉽게 슬레이브를 promote하여 서비스를 계속할수 있다. 그럼 마스터를 정상화시킨후 다시 replication의 slave로 failback할수 있는가? 디스크 폴드가 아니라서 크래시 직전까지의 데이터가 온전히 있는 경우에도 백업본 올려서 replication 재구성해야했다. 그 작업이 pg_rewind을 사용해서 단축될수 있다. pg_rewind는 소스디렉터라와 타겟디렉터리의 파일들을 sync해주는 유틸리티이다. pg_controlfile의 정보를 바탕으로 모든 data file을 동기화하는것이다. pg_rewind로 파일 싱크한뒤 recovery.conf작성하여 start하면 recovery모드로 진입해서 wal 적용하고 streaming 받기 시작한다.

### TEST

#### I. streaming replication 구성

##### 1\. server1 준비


    ./bin/initdb --pgdata=/data1/9.5/data -W


##### 2\. server1 postgresql.conf


    listen_addresses = '*'          # what IP address(es) to listen on;
    port = 5435                             # (change requires restart)
    wal_level = hot_standby                 # minimal, archive, hot_standby, or logical
    wal_log_hints = on                      # also do full page writes of non-critical updates
    archive_mode = on               # enables archiving; off, on, or always
    archive_command = 'test ! -f /backup1/9.5/pg_arc/%f && cp %p /backup1/9.5/pg_arc/%f'            # command to use to archive a logfile segment
    max_wal_senders = 3             # max number of walsender processes
    wal_keep_segments = 64          # in logfile segments, 16MB each; 0 disables
    hot_standby = on                        # "on" allows queries during recovery
    logging_collector = on          # Enable capturing of stderr and csvlog


##### 3\. server1 pg_hba.conf


    host    replication     postgres        ::1/128                 trust


##### 4\. server1 start


    pg_ctl -D /data1/9.5/data start


##### 5\. server2 준비


    pg_basebackup  -D /data1/9.5s1/data --xlog --progress --verbose -h localhost -p 5435


##### 6\. server2 postgresql.conf


    listen_addresses = '*'          # what IP address(es) to listen on;
    port = 5445                             # (change requires restart)
    wal_level = hot_standby                 # minimal, archive, hot_standby, or logical
    wal_log_hints = on                      # also do full page writes of non-critical updates
    archive_mode = on               # enables archiving; off, on, or always
    archive_command = 'test ! -f /backup1/9.5s1/pg_arc/%f && cp %p /backup1/9.5s1/pg_arc/%f'                # command to use to archive a logfile segment
    max_wal_senders = 3             # max number of walsender processes
    wal_keep_segments = 64          # in logfile segments, 16MB each; 0 disables
    hot_standby = on                        # "on" allows queries during recovery
    logging_collector = on          # Enable capturing of stderr and csvlog


##### 7\. server2 pg_hba.conf


    host    replication     postgres        ::1/128                 trust


##### 8\. server2 recovery.conf


    standby_mode = 'on'
    primary_conninfo = 'host=localhost port=5435'
    restore_command = 'cp /backup1/9.5/pg_arc/%f %p'
    recovery_target_timeline = 'latest'
    trigger_file = '/tmp/trigger_file_0'


#### II. failover 테스트

  * server1(port=5435) -> server2(port=5445)

##### 1\. master failover하자


    @server 1
    touch /tmp/trigger_file_0
    @server2
    tail -f pg_log/postgresql-2016-06-10_123437.log
    pgbench -i -s 10 postgres


##### 2\. pg_rewind 테스트


    @server1
    [postgres@pgvm1 data]$ pg_ctl stop
    waiting for server to shut down.... done
    server stopped

    [postgres@pgvm1 data]$ pg_rewind --source-server='host=::1 port=5445 user=postgres' --target-pgdata=$PGDATA -P
    connected to server
    servers diverged at WAL position 0/220003E0 on timeline 5
    rewinding from last common checkpoint at 0/22000338 on timeline 5
    reading source file list
    reading target file list
    reading WAL in target
    need to copy 458 MB (total source directory size is 482 MB)
    469734/469734 kB (100%) copied
    creating backup label and updating control file
    Done!


##### 3\. recovery.conf 생성

  * pg_rewind가 recovery.conf생성해주진 않는다
  * server2꺼 recovery.done sync된것이 있으니 이걸 활용해서 변경

```
[postgres@pgvm1 data]$ cp recovery.done recovery.conf
[postgres@pgvm1 data]$ vi recovery.conf
standby_mode = 'on'
primary_conninfo = 'host=localhost port=5445'
restore_command = 'cp /backup1/9.5s1/pg_arc/%f %p'
recovery_target_timeline = 'latest'
trigger_file = '/tmp/trigger_file_0'
```

##### 4\. postgresql.conf 변경

  * pg_rewind가 postgresql.conf를 덮어쓴다 변경해야할 파라메터들은 변경하자
  * 내경우엔 port랑 archive command

```
[postgres@pgvm1 data]$ vi postgresql.conf
listen_addresses = '*'          # what IP address(es) to listen on;
port = 5435                             # (change requires restart)
wal_level = hot_standby                 # minimal, archive, hot_standby, or logical
wal_log_hints = on                      # also do full page writes of non-critical updates
archive_mode = on               # enables archiving; off, on, or always
archive_command = 'test ! -f /backup1/9.5/pg_arc/%f && cp %p /backup1/9.5/pg_arc/%f'            # command to use to archive a logfile segment
max_wal_senders = 3             # max number of walsender processes
wal_keep_segments = 64          # in logfile segments, 16MB each; 0 disables
hot_standby = on                        # "on" allows queries during recovery
logging_collector = on          # Enable capturing of stderr and csvlog
```

##### 5\. failback

```
[postgres@pgvm1 data]$ pg_ctl start
server starting
```

##### 6\. failback 확인

```
@server1(new slave)
#pg_log/로그파일 확인
LOG:  database system was interrupted while in recovery at log time 2016-06-10 12:35:31 GMT-10
HINT:  If this has occurred more than once some data might be corrupted and you might need to choose an earlier recovery target.
cp: cannot stat `/backup1/9.5s1/pg_arc/00000007.history': No such file or directory
LOG:  entering standby mode
LOG:  restored log file "00000006.history" from archive
LOG:  restored log file "000000060000000000000022" from archive
cp: cannot stat `/backup1/9.5s1/pg_arc/00000005.history': No such file or directory
LOG:  redo starts at 0/22000300
LOG:  restored log file "000000060000000000000023" from archive
LOG:  restored log file "000000060000000000000024" from archive
LOG:  restored log file "000000060000000000000025" from archive
LOG:  restored log file "000000060000000000000026" from archive
LOG:  restored log file "000000060000000000000027" from archive
LOG:  restored log file "000000060000000000000028" from archive
cp: cannot stat `/backup1/9.5s1/pg_arc/000000060000000000000029': No such file or directory
LOG:  consistent recovery state reached at 0/29B41898
LOG:  database system is ready to accept read only connections
LOG:  invalid record length at 0/29B41898
LOG:  started streaming WAL from primary at 0/29000000 on timeline 6

@server2(new master)
[postgres@pgvm1 data]$ psql
Timing is on.
psql (9.5.1)
Type "help" for help.

postgres=# select * from pg_stat_replication ;
 pid  | usesysid | usename  | application_name | client_addr | client_hostname | client_port |         backend_start         | backend_xmin |   state   | sent_l ocation | write_location | flush_location | replay_location | sync_priority | sync_state
------+----------+----------+------------------+-------------+-----------------+ -------------+-------------------------------+--------------+-----------+------- --------+----------------+----------------+-----------------+---------------+------------
 2692 |       10 | postgres | wal_receiver1    | ::1         |                 | 48059 | 2016-06-10 12:39:21.203712+10 |              | streaming | 0/29B4 2588    | 0/29B42588     | 0/29B42588     | 0/29B418C8      |             0 | async
(1 row)

Time: 6.919 ms
postgres=#
```
