---
title: MySQL 8.0 - Replication By Channel
author: min_cho
created: 2019/01/19
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

- MySQL 5.7 에서 Multi-source replication (n개의 Master와 1개의 Slave) 이 가능해졌지만, Master가 가지고 있는 같은 이름의 database 로는 Slave에서 Multi-source replication 이 안된다는 아쉬운 점이 있었다. (모든 replication filter를 비록하여, REPLICATE_REWRITE_DB (source와 target의 database 이름을 다르게 적용) 라는 filter가 channel단위가 아닌 모두 global로 적용되었기 때문이었다.)

  ```
  아래와 같은 경우 Multi-source replication 이 불가능했었다.

  MASTER 1 : min_sql_db → SLAVE : shad1_min_sql_db

  MASTER 2 : min_sql_db → SLAVE : shad2_min_sql_db



  오직 아래와 같은 replication이 가능했으며, 이는 data conflict 의 원인이 되기도 했다.

  MASTER 1 : min_sql_db → SLAVE : min_sql_db

  MASTER 2 : min_sql_db → SLAVE : min_sql_db
  ```

- MariaDB 10에서는 이미 적용한 기능이었고, Feature Request로 가장 많이 요청된 항목이기도 하다. 이로써, 여러 Sources 에서 같은 이름의 database 를 하나의 slave replication 을 걸어 사용하는것이 가능해졌다.



------

## 사용예제

- 아래의 예제는 Source1, Source2 의 min_sql_db 라는 database를 특정 slave에 shad1_min_sql_db, shad2_min_sql_db 로 각각 rewrite 시킨 후 Data를 동기화하는 예제이다.

  ```sql
  slave2 [localhost] {msandbox} (shad1_min_sql_db) > CHANGE MASTER TO
      ->  MASTER_HOST='127.0.0.1'
      ->  ,MASTER_PORT=21621
      ->  ,MASTER_USER='rsandbox'
      ->  ,MASTER_PASSWORD='rsandbox'
      ->  ,MASTER_LOG_FILE='mysql-bin.000002'
      ->  ,MASTER_LOG_POS=784936952
      ->  FOR CHANNEL 'shad1';
  Query OK, 0 rows affected, 2 warnings (0.04 sec)

  slave2 [localhost] {msandbox} (shad1_min_sql_db) > CHANGE REPLICATION FILTER REPLICATE_DO_DB = (shad1_min_sql_db), REPLICATE_REWRITE_DB = ((min_sql_db, shad1_min_sql_db)) FOR CHANNEL 'shad1';
  Query OK, 0 rows affected (0.00 sec)


  --^^ 중요한것은 REPLICATE_DO_DB 는 shad1_min_sql_db 가 되어야 한다. Source database의 이름인 min_sql_db 를 입력하게 되면 위의 구문은 아무런 Data도 동기화하지 않는다.
  --^^ 해당 이유는 slave 의 sql_thread 는 relay-log를 읽어 REPLICATE_REWRITE_DB 로 먼저 DATABASE 이름을 치환하고 그 후 REPLICATE_DO_DB를 통해 SLAVE에서 filtering하기 때문이다.


  slave2 [localhost] {msandbox} (shad1_min_sql_db) > CHANGE MASTER TO
      ->   MASTER_HOST='127.0.0.1'
      ->   ,MASTER_PORT=8013
      ->   ,MASTER_USER='rsandbox'
      ->   ,MASTER_PASSWORD='rsandbox'
      ->   ,MASTER_LOG_FILE='binlog.000002'
      ->   ,MASTER_LOG_POS=6996
      ->   FOR CHANNEL 'shad2';
  Query OK, 0 rows affected, 2 warnings (0.06 sec)

  slave2 [localhost] {msandbox} (shad1_min_sql_db) > CHANGE REPLICATION FILTER REPLICATE_DO_DB = (shad2_min_sql_db), REPLICATE_REWRITE_DB = ((min_sql_db, shad2_min_sql_db)) FOR CHANNEL 'shad2';
  Query OK, 0 rows affected (0.00 sec)

  slave2 [localhost] {msandbox} (shad1_min_sql_db) > start slave;
  Query OK, 0 rows affected (0.12 sec)



  slave2 [localhost] {msandbox} (shad1_min_sql_db) > show slave status\G
  *************************** 1. row ***************************
                 Slave_IO_State: Waiting for master to send event
                    Master_Host: 127.0.0.1
                    Master_User: rsandbox
                    Master_Port: 21621
                  Connect_Retry: 60
                Master_Log_File: mysql-bin.000002
            Read_Master_Log_Pos: 784936952
                 Relay_Log_File: mysql-relay-shad1.000002
                  Relay_Log_Pos: 322
          Relay_Master_Log_File: mysql-bin.000002
               Slave_IO_Running: Yes
              Slave_SQL_Running: Yes
                Replicate_Do_DB: shad1_min_sql_db
            Replicate_Ignore_DB:
             Replicate_Do_Table:
         Replicate_Ignore_Table:
        Replicate_Wild_Do_Table:
    Replicate_Wild_Ignore_Table:
                     Last_Errno: 0
                     Last_Error:
                   Skip_Counter: 0
            Exec_Master_Log_Pos: 784936952
                Relay_Log_Space: 532
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
               Master_Server_Id: 1
                    Master_UUID: 00021621-1111-1111-1111-111111111111
               Master_Info_File: mysql.slave_master_info
                      SQL_Delay: 0
            SQL_Remaining_Delay: NULL
        Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
             Master_Retry_Count: 86400
                    Master_Bind:
        Last_IO_Error_Timestamp:
       Last_SQL_Error_Timestamp:
                 Master_SSL_Crl:
             Master_SSL_Crlpath:
             Retrieved_Gtid_Set:
              Executed_Gtid_Set:
                  Auto_Position: 0
           Replicate_Rewrite_DB: (min_sql_db,shad1_min_sql_db)
                   Channel_Name: shad1
             Master_TLS_Version:
         Master_public_key_path:
          Get_master_public_key: 0
  *************************** 2. row ***************************
                 Slave_IO_State: Waiting for master to send event
                    Master_Host: 127.0.0.1
                    Master_User: rsandbox
                    Master_Port: 8013
                  Connect_Retry: 60
                Master_Log_File: binlog.000002
            Read_Master_Log_Pos: 6996
                 Relay_Log_File: mysql-relay-shad2.000002
                  Relay_Log_Pos: 319
          Relay_Master_Log_File: binlog.000002
               Slave_IO_Running: Yes
              Slave_SQL_Running: Yes
                Replicate_Do_DB: shad2_min_sql_db
            Replicate_Ignore_DB:
             Replicate_Do_Table:
         Replicate_Ignore_Table:
        Replicate_Wild_Do_Table:
    Replicate_Wild_Ignore_Table:
                     Last_Errno: 0
                     Last_Error:
                   Skip_Counter: 0
            Exec_Master_Log_Pos: 6996
                Relay_Log_Space: 529
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
               Master_Server_Id: 1
                    Master_UUID: bfceb728-ebde-11e8-8ec1-544e8aca585a
               Master_Info_File: mysql.slave_master_info
                      SQL_Delay: 0
            SQL_Remaining_Delay: NULL
        Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
             Master_Retry_Count: 86400
                    Master_Bind:
        Last_IO_Error_Timestamp:
       Last_SQL_Error_Timestamp:
                 Master_SSL_Crl:
             Master_SSL_Crlpath:
             Retrieved_Gtid_Set:
              Executed_Gtid_Set:
                  Auto_Position: 0
           Replicate_Rewrite_DB: (min_sql_db,shad2_min_sql_db)
                   Channel_Name: shad2
             Master_TLS_Version:
         Master_public_key_path:
          Get_master_public_key: 0
  2 rows in set (0.01 sec)


  --^^ 각 channel에 따른 2개의 slave 상태가 나타난다.



  -- Master 1번에서 데이터를 넣는다.

  master [localhost] {msandbox} (min_sql_db) > insert into min_sql_db.tblA values (1);
  Query OK, 1 row affected (0.06 sec)


  -- Master 2번에서 데이터를 넣는다.

  mysql [localhost] {msandbox} (min_sql_db) > insert into min_sql_db.tblA values (2);
  Query OK, 1 row affected (0.06 sec)


  -- slave 데이터를 확인하자.

  slave2 [localhost] {msandbox} (shad1_min_sql_db) > show databases;
  +--------------------+
  | Database           |
  +--------------------+
  | information_schema |
  | mysql              |
  | performance_schema |
  | shad1_min_sql_db   |
  | shad2_min_sql_db   |
  | sys                |
  | test               |
  | test_xyz           |
  +--------------------+
  8 rows in set (0.00 sec)


  slave2 [localhost] {msandbox} (shad1_min_sql_db) > select * from shad1_min_sql_db.tblA;
  +------+
  | a    |
  +------+
  |    1 |
  +------+
  1 row in set (0.01 sec)

  slave2 [localhost] {msandbox} (shad1_min_sql_db) > select * from shad2_min_sql_db.tblA;
  +------+
  | a    |
  +------+
  |    2 |
  +------+
  1 row in set (0.00 sec)


  --^^ Master 1번과 2번에 적용된 데이터가 정상적으로 filter가 적용되어 shad1_min_sql_db.tblA 와  shad2_min_sql_db.tblA 로 들어가는것이 확인된다.
  ```



------

## 적용범위

- 위의 예제처럼 multi-source channel을 이용한 slave 를 적용시에 각각의 filter를 적용할 수 있어, 다음과 같은 경우에 유용하게 쓰일 수 있다.
  - Shard 된 Service를 하나의 slave 로 엮어 통계를 위한 서버로 구축할 수 있다.
  - Shard 된 서비스를 다시, 임의로 split & merge 시에 아주 유용하게 쓰여질 수 있다.
