---
title: MySQL 8.0 - Err 파일의 형식 변경
author: min_cho
created: 2019/01/20
modified:
layout: post
tags: mysql mysql8
image:
  feature: mysql.png
categories: MySQL8
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


------
## 개요

- 기존의 MySQL 5.7이 아래와 같은 포맷을 사용하였다면,

  ```
  timestamp thread_id [severity] message
  ```

- [MySQL 8.0](https://dev.mysql.com/doc/refman/8.0/en/error-log-format.html) 에서는 **[err_code] [subsystem]** 이 추가된 형태의 포맷을 사용한다.

  ```
  timestamp thread_id [severity] [[err|message]code] [subsystem] message
  ```

- 이를 통해,

  1. errcode의 모니터링을 정확히 할 수 있다. 예를 들어 "Sort aborted" 와 같은 에러를 grep으로 해당 문자열을 찾는대신 errcode를 이용할 수 있다.
  2. 해당 메세지가 Server에서 실행된 메세지인지 혹은 MySQL Engine에서 보내온 메세지인지 확인이 가능하다.
  3. 더 많은 메세지와 주석을 통해 기존보다 보다 자세한 메세지를 보여준다.



------

## 사용예제

- 버젼별비교

  - 5.6

    - 아래의 예제는 일반적인 5.6 error message이다.

    ```sql
    2018-09-12 17:50:33 52377 [Note] Server socket created on IP: '127.0.0.1'.
    2018-09-12 17:50:33 52377 [ERROR] Fatal error: Illegal or unknown default time zone 'UTC'
    2018-09-12 17:51:17 52836 [Note] Plugin 'FEDERATED' is disabled.
    2018-09-12 17:51:17 52836 [Note] InnoDB: Using atomics to ref count buffer pool pages
    2018-09-12 17:51:17 52836 [Note] InnoDB: The InnoDB memory heap is disabled
    2018-09-12 17:51:17 52836 [Note] InnoDB: Mutexes and rw_locks use GCC atomic builtins
    2018-09-12 17:51:17 52836 [Note] InnoDB: Memory barrier is not used
    2018-09-12 17:51:17 52836 [Note] InnoDB: Compressed tables use zlib 1.2.3
    2018-09-12 17:51:17 52836 [Note] InnoDB: Using CPU crc32 instructions
    2018-09-12 17:51:17 52836 [Note] InnoDB: Initializing buffer pool, size = 128.0M
    2018-09-12 17:51:17 52836 [Note] InnoDB: Completed initialization of buffer pool
    2018-09-12 17:51:17 52836 [Note] InnoDB: Highest supported file format is Barracuda.
    2018-09-12 17:51:17 52836 [Note] InnoDB: 128 rollback segment(s) are active.
    2018-09-12 17:51:17 52836 [Note] InnoDB: Waiting for purge to start
    2018-09-12 17:51:18 52836 [Note] InnoDB: 5.6.40 started; log sequence number 347942272
    2018-09-12 17:51:18 52836 [Note] Server hostname (bind-address): '127.0.0.1'; port: 5640
    2018-09-12 17:51:18 52836 [Note]   - '127.0.0.1' resolves to '127.0.0.1';
    2018-09-12 17:51:18 52836 [Note] Server socket created on IP: '127.0.0.1'.
    2018-09-12 17:51:18 52836 [Note] Event Scheduler: Loaded 0 events
    2018-09-12 17:51:18 52836 [Note] /MySQL/binaries/5.6.40/bin/mysqld: ready for connections.
    Version: '5.6.40'  socket: '/tmp/mysql_sandbox5640.sock'  port: 5640  MySQL Community Server (GPL)
    ```

  - 5.7

    - 아래의 예제는 일반적인 5.7 error message이다. (5.6에 비해 시간이 ISO 8601 / RFC 3339 포맷 (`YYYY-MM-DDThh:mm:ss.uuuuuu) 을 사용하며, log_timestamp에 의해 UTC 혹은 System Timezone을 사용할 수 있다)`

    ```sql
    2018-12-21T05:07:45.614557Z 0 [Note] InnoDB: 32 non-redo rollback segment(s) are active.
    2018-12-21T05:07:45.614838Z 0 [Note] InnoDB: Waiting for purge to start
    2018-12-21T05:07:45.665614Z 0 [Note] InnoDB: 5.7.24 started; log sequence number 2662131
    2018-12-21T05:07:45.666022Z 0 [Note] InnoDB: Loading buffer pool(s) from /Users/kakaobank/sandboxes/msb_5_7_24/data/ib_buffer_pool
    2018-12-21T05:07:45.666238Z 0 [Note] Plugin 'FEDERATED' is disabled.
    2018-12-21T05:07:45.676530Z 0 [Note] InnoDB: Buffer pool(s) load completed at 181221 14:07:45
    2018-12-21T05:07:45.678123Z 0 [Warning] Failed to set up SSL because of the following SSL library error: SSL context is not usable without certificate and private key
    2018-12-21T05:07:45.678163Z 0 [Note] Server hostname (bind-address): '127.0.0.1'; port: 5724
    2018-12-21T05:07:45.678209Z 0 [Note]   - '127.0.0.1' resolves to '127.0.0.1';
    2018-12-21T05:07:45.678323Z 0 [Note] Server socket created on IP: '127.0.0.1'.
    2018-12-21T05:07:45.770713Z 0 [Note] Event Scheduler: Loaded 0 events
    2018-12-21T05:07:45.770846Z 0 [Note] /MySQL/binaries/5.7.24/bin/mysqld: ready for connections.
    ```

  - 8.0

    - 아래의 예제는 innodb_dedicated_server 의 옵션은 ON하여 자동으로 innodb_buffer_pool_size, innodb_log_file_size 를 조절한 상태의 error message이다.

    ```sql
    2018-12-21T03:22:09.460073Z 9 [System] [MY-013172] [Server] Received SHUTDOWN from user msandbox. Shutting down mysqld (Version: 8.0.13).
    2018-12-21T03:22:11.592222Z 0 [System] [MY-010910] [Server] /MySQL/binaries/8.0.13/bin/mysqld: Shutdown complete (mysqld 8.0.13)  MySQL Community Server - GPL.
    2018-12-21T03:22:11.6NZ mysqld_safe mysqld from pid file /Users/kakaobank/sandboxes/msb_8_0_13/data/mysql_sandbox8013.pid ended

    2018-12-21T05:01:00.6NZ mysqld_safe Logging to '/Users/kakaobank/sandboxes/msb_8_0_13/data/msandbox.err'.
    2018-12-21T05:01:00.6NZ mysqld_safe Starting mysqld daemon with databases from /Users/kakaobank/sandboxes/msb_8_0_13/data
    2018-12-21T05:01:00.647115Z 0 [Warning] [MY-010101] [Server] Insecure configuration for --secure-file-priv: Location is accessible to all OS users. Consider choosing a different directory.
    2018-12-21T05:01:00.647399Z 0 [Note] [MY-010949] [Server] Basedir set to /MySQL/binaries/8.0.13/.
    2018-12-21T05:01:00.647418Z 0 [System] [MY-010116] [Server] /MySQL/binaries/8.0.13/bin/mysqld (mysqld 8.0.13) starting as process 89543
    2018-12-21T05:01:00.653905Z 0 [Note] [MY-010747] [Server] Plugin 'FEDERATED' is disabled.
    2018-12-21T05:01:00.655544Z 1 [Note] [MY-012943] [InnoDB] Mutexes and rw_locks use GCC atomic builtins
    2018-12-21T05:01:00.655583Z 1 [Note] [MY-012944] [InnoDB] Uses event mutexes
    2018-12-21T05:01:00.655618Z 1 [Note] [MY-012945] [InnoDB] GCC builtin __atomic_thread_fence() is used for memory barrier
    2018-12-21T05:01:00.655672Z 1 [Note] [MY-012948] [InnoDB] Compressed tables use zlib 1.2.11
    2018-12-21T05:01:00.656088Z 1 [Note] [MY-011825] [InnoDB] Number of pools: 1
    2018-12-21T05:01:00.656247Z 1 [Note] [MY-012951] [InnoDB] Using CPU crc32 instructions
    2018-12-21T05:01:00.656746Z 1 [Note] [MY-012203] [InnoDB] Directories to scan './;./;./'
    2018-12-21T05:01:00.656907Z 1 [Note] [MY-012204] [InnoDB] Scanning './'
    2018-12-21T05:01:00.666577Z 1 [Note] [MY-012208] [InnoDB] Completed space ID check of 14 files.
    2018-12-21T05:01:00.667577Z 1 [Note] [MY-012955] [InnoDB] Initializing buffer pool, total size = 12.000000G, instances = 8, chunk size =128.000000M
    2018-12-21T05:01:04.087491Z 1 [Note] [MY-012957] [InnoDB] Completed initialization of buffer pool
    2018-12-21T05:01:04.279723Z 1 [Note] [MY-013086] [InnoDB] Starting to parse redo log at lsn = 19811383, whereas checkpoint_lsn = 19811383
    2018-12-21T05:01:04.312758Z 1 [Note] [MY-013083] [InnoDB] Log background threads are being started...
    2018-12-21T05:01:04.313006Z 1 [Note] [MY-012532] [InnoDB] Applying a batch of 0 redo log records ...
    2018-12-21T05:01:04.313042Z 1 [Note] [MY-012535] [InnoDB] Apply batch completed!
    2018-12-21T05:01:04.313238Z 1 [Note] [MY-013041] [InnoDB] Resizing redo log from 2*50331648 to 2*1073741824 bytes, LSN=19811383
    2018-12-21T05:01:04.417143Z 1 [Note] [MY-013084] [InnoDB] Log background threads are being closed...
    2018-12-21T05:01:04.528389Z 1 [Note] [MY-012968] [InnoDB] Starting to delete and rewrite log files.
    2018-12-21T05:01:04.530089Z 1 [Note] [MY-012887] [InnoDB] Setting log file ./ib_logfile101 size to 16777216 MB
    2018-12-21T05:01:04.531055Z 1 [Note] [MY-012651] [InnoDB] Progress in MB:
     100 200 300 400 500 600 700 800 900 1000
    2018-12-21T05:01:05.147668Z 1 [Note] [MY-012887] [InnoDB] Setting log file ./ib_logfile1 size to 16777216 MB
    2018-12-21T05:01:05.147756Z 1 [Note] [MY-012651] [InnoDB] Progress in MB:
     100 200 300 400 500 600 700 800 900 1000
    2018-12-21T05:01:05.709596Z 1 [Note] [MY-012892] [InnoDB] Renaming log file ./ib_logfile101 to ./ib_logfile0
    2018-12-21T05:01:05.710245Z 1 [Note] [MY-012893] [InnoDB] New log files created, LSN=19811852
    2018-12-21T05:01:05.710290Z 1 [Note] [MY-013083] [InnoDB] Log background threads are being started...
    2018-12-21T05:01:05.713517Z 1 [Note] [MY-012910] [InnoDB] Opened 2 existing undo tablespaces.
    2018-12-21T05:01:05.725719Z 1 [Note] [MY-012923] [InnoDB] Creating shared tablespace for temporary tables
    2018-12-21T05:01:05.726009Z 1 [Note] [MY-012265] [InnoDB] Setting file './ibtmp1' size to 12 MB. Physically writing the file full; Please wait ...
    2018-12-21T05:01:05.734424Z 1 [Note] [MY-012266] [InnoDB] File './ibtmp1' size is now 12 MB.
    2018-12-21T05:01:05.734675Z 1 [Note] [MY-011825] [InnoDB] Scanning temp tablespace dir:'./#innodb_temp/'
    2018-12-21T05:01:05.777282Z 1 [Note] [MY-013018] [InnoDB] Created 128 and tracked 128 new rollback segment(s) in the temporary tablespace. 128 are now active.
    2018-12-21T05:01:05.777575Z 1 [Note] [MY-012976] [InnoDB] 8.0.13 started; log sequence number 19811852
    2018-12-21T05:01:05.785998Z 1 [Note] [MY-011089] [Server] Data dictionary restarting version '80013'.
    2018-12-21T05:01:05.852940Z 1 [Note] [MY-012357] [InnoDB] Reading DD tablespace files
    2018-12-21T05:01:05.855022Z 1 [Note] [MY-012356] [InnoDB] Validated 16/16  tablespaces
    2018-12-21T05:01:05.860483Z 0 [Note] [MY-011946] [InnoDB] Loading buffer pool(s) from /Users/kakaobank/sandboxes/msb_8_0_13/data/ib_buffer_pool
    2018-12-21T05:01:05.861110Z 0 [Note] [MY-011946] [InnoDB] Buffer pool(s) load completed at 181221 14:01:05
    2018-12-21T05:01:05.879828Z 1 [Note] [MY-010006] [Server] Using data dictionary with version '80013'.
    2018-12-21T05:01:05.914058Z 0 [Note] [MY-012487] [InnoDB] DDL log recovery : begin
    2018-12-21T05:01:05.914162Z 0 [Note] [MY-012488] [InnoDB] DDL log recovery : end
    2018-12-21T05:01:05.917554Z 0 [Note] [MY-010913] [Server] You have not provided a mandatory server-id. Servers in a replication topology must have unique server-ids. Please refer to the proper server start-up parameters documentation.
    2018-12-21T05:01:05.919566Z 0 [Note] [MY-010182] [Server] Found ca.pem, server-cert.pem and server-key.pem in data directory. Trying to enable SSL support using them.
    2018-12-21T05:01:05.919609Z 0 [Note] [MY-010304] [Server] Skipping generation of SSL certificates as certificate files are present in data directory.
    2018-12-21T05:01:05.921788Z 0 [Warning] [MY-010068] [Server] CA certificate ca.pem is self signed.
    2018-12-21T05:01:05.921886Z 0 [Note] [MY-010308] [Server] Skipping generation of RSA key pair through --sha256_password_auto_generate_rsa_keys as key files are present in data directory.
    2018-12-21T05:01:05.921907Z 0 [Note] [MY-010308] [Server] Skipping generation of RSA key pair through --caching_sha2_password_auto_generate_rsa_keys as key files are present in data directory.
    2018-12-21T05:01:05.922992Z 0 [Note] [MY-010252] [Server] Server hostname (bind-address): '127.0.0.1'; port: 8013
    2018-12-21T05:01:05.923060Z 0 [Note] [MY-010264] [Server]   - '127.0.0.1' resolves to '127.0.0.1';
    2018-12-21T05:01:05.923167Z 0 [Note] [MY-010251] [Server] Server socket created on IP: '127.0.0.1'.
    2018-12-21T05:01:05.936723Z 0 [Note] [MY-011025] [Repl] Failed to start slave threads for channel ''.
    2018-12-21T05:01:05.937752Z 4 [Note] [MY-010051] [Server] Event Scheduler: scheduler thread started with id 4
    2018-12-21T05:01:05.937931Z 0 [System] [MY-010931] [Server] /MySQL/binaries/8.0.13/bin/mysqld: ready for connections. Version: '8.0.13'  socket: '/var/folders/7v/j50shy2154jcrmtvg71x262r0000gn/T/mysql_sandbox8013.sock'  port: 8013  MySQL Community Server - GPL.
    2018-12-21T05:01:06.139934Z 0 [Note] [MY-011240] [Server] Plugin mysqlx reported: 'Using SSL configuration from MySQL Server'
    2018-12-21T05:01:06.140602Z 0 [Note] [MY-011243] [Server] Plugin mysqlx reported: 'Using OpenSSL for TLS connections'
    2018-12-21T05:01:06.140721Z 0 [Note] [MY-011332] [Server] Plugin mysqlx reported: 'IPv6 is available'
    2018-12-21T05:01:06.141502Z 0 [Note] [MY-011323] [Server] Plugin mysqlx reported: 'X Plugin ready for connections. bind-address: '::' port: 33060'
    2018-12-21T05:01:06.141552Z 0 [Note] [MY-011323] [Server] Plugin mysqlx reported: 'X Plugin ready for connections. socket: '/tmp/mysqlx.sock''
    2018-12-21T05:01:06.141597Z 0 [System] [MY-011323] [Server] X Plugin ready for connections. Socket: '/tmp/mysqlx.sock' bind-address: '::' port: 33060
    ```
