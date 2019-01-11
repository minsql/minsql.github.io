---
title: MySQL MEMORY 엔진
author: min_cho
created: 2014/01/23 04:52:00
modified:
layout: post
tags: mysql mysql_engine
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL MEMORY 엔진

#### MySQL daemon parameter 설정

  * MySQL Daemon

```sql
[db-dis-mdb][(none)]> show global variables like '%heap%';  
+---------------------+-------------+  
| Variable_name       | Value       |  
+---------------------+-------------+  
| max_heap_table_size | 42949672960 |  
+---------------------+-------------+
```

#### TEST

#### sample data 생성

```
CREATE TABLE `MEM_UTF8` (  
  `DB_SERVER_ID` smallint(5) unsigned NOT NULL DEFAULT '0',  
  `V_NAME` varchar(64) NOT NULL DEFAULT '',  
  `CTIME` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',  
  `V_VALUE` bigint(20) unsigned DEFAULT NULL  
) ENGINE=MEMORY DEFAULT CHARSET=utf8;  

[db-dis-mdb][dis_mysql]> show table statusG  
*************************** 1. row ***************************  
           Name: MEM_UTF8  
         Engine: MEMORY  
        Version: 10  
     Row_format: Fixed  
           Rows: 8388608  
 Avg_row_length: 209  
    Data_length: 1826745184  
Max_data_length: 41557785302  
   Index_length: 0  
      Data_free: 0  
 Auto_increment: NULL  
    Create_time: 2014-01-23 10:57:06  
    Update_time: NULL  
     Check_time: NULL  
      Collation: utf8_general_ci  
       Checksum: NULL  
 Create_options:   
        Comment:   
1 row in set (0.00 sec)
```


#### row_format=DYNAMIC 옵션 추가
  * Memory engine에서 Row_format: Fixed 을 dynamic으로 바꾸고자 한다.
  * dynamic으로 바뀌지 않고 Create_options: row_format=DYNAMIC 에만 추가된다.

```sql
db-dis-mdb][dis_mysql]> CREATE TABLE `MEM_UTF8_DYNAMIC` (  
    ->   `DB_SERVER_ID` smallint(5) unsigned NOT NULL DEFAULT '0',  
    ->   `V_NAME` varchar(64) NOT NULL DEFAULT '',  
    ->   `CTIME` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',  
    ->   `V_VALUE` bigint(20) unsigned DEFAULT NULL  
    -> ) ENGINE=MEMORY ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8;  
Query OK, 0 rows affected (0.00 sec)  

[db-dis-mdb][dis_mysql]> insert into `MEM_UTF8_DYNAMIC` select * from `MEM_UTF8`;  
Query OK, 8388608 rows affected (5.73 sec)  
Records: 8388608  Duplicates: 0  Warnings: 0  

[db-dis-mdb][dis_mysql]> show table statusG  
*************************** 1. row ***************************  
           Name: MEM_UTF8  
         Engine: MEMORY  
        Version: 10  
     Row_format: Fixed  
           Rows: 8388608  
 Avg_row_length: 209  
    Data_length: 1826745184  
Max_data_length: 41557785302  
   Index_length: 0  
      Data_free: 0  
 Auto_increment: NULL  
    Create_time: 2014-01-23 10:57:06  
    Update_time: NULL  
     Check_time: NULL  
      Collation: utf8_general_ci  
       Checksum: NULL  
 Create_options:   
        Comment:   
*************************** 2. row ***************************  
           Name: MEM_UTF8_DYNAMIC  
         Engine: MEMORY  
        Version: 10  
     Row_format: Fixed  
           Rows: 8388608  
 Avg_row_length: 209  
    Data_length: 1826745184  
Max_data_length: 41557785302  
   Index_length: 0  
      Data_free: 0  
 Auto_increment: NULL  
    Create_time: 2014-01-23 11:10:16  
    Update_time: NULL  
     Check_time: NULL  
      Collation: utf8_general_ci  
       Checksum: NULL  
 Create_options: row_format=DYNAMIC  
        Comment:   
2 rows in set (0.00 sec)
```
#### character set에 따른 size 차이
  * row format이 fixed라면, character set에 따라 DATA length는 변경되어야 한다.
  * 각 character set에 따라 DATA length는 변경된다.

```sql
[db-dis-mdb][dis_mysql]> CREATE TABLE `MEM_latin1` (  
    ->   `DB_SERVER_ID` smallint(5) unsigned NOT NULL DEFAULT '0',  
    ->   `V_NAME` varchar(64) NOT NULL DEFAULT '',  
    ->   `CTIME` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',  
    ->   `V_VALUE` bigint(20) unsigned DEFAULT NULL  
    -> ) ENGINE=MEMORY DEFAULT CHARSET=latin1;  
Query OK, 0 rows affected (0.00 sec)  

[db-dis-mdb][dis_mysql]>   
[db-dis-mdb][dis_mysql]> CREATE TABLE `MEM_euckr` (  
    ->   `DB_SERVER_ID` smallint(5) unsigned NOT NULL DEFAULT '0',  
    ->   `V_NAME` varchar(64) NOT NULL DEFAULT '',  
    ->   `CTIME` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',  
    ->   `V_VALUE` bigint(20) unsigned DEFAULT NULL  
    -> ) ENGINE=MEMORY DEFAULT CHARSET=euckr;  
Query OK, 0 rows affected (0.00 sec)  

[db-dis-mdb][dis_mysql]>   
[db-dis-mdb][dis_mysql]> insert into `MEM_latin1` select * from `MEM_UTF8`;  
Query OK, 8388608 rows affected (5.85 sec)  
Records: 8388608  Duplicates: 0  Warnings: 0  

[db-dis-mdb][dis_mysql]> insert into `MEM_euckr` select * from `MEM_UTF8`;  
Query OK, 8388608 rows affected (5.91 sec)  
Records: 8388608  Duplicates: 0  Warnings: 0  

[db-dis-mdb][dis_mysql]>   
[db-dis-mdb][dis_mysql]> show table statusG  
*************************** 1. row ***************************  
           Name: MEM_UTF8  
         Engine: MEMORY  
        Version: 10  
     Row_format: Fixed  
           Rows: 8388608  
 Avg_row_length: 209  
    Data_length: 1826745184  
Max_data_length: 41557785302  
   Index_length: 0  
      Data_free: 0  
 Auto_increment: NULL  
    Create_time: 2014-01-23 10:57:06  
    Update_time: NULL  
     Check_time: NULL  
      Collation: utf8_general_ci  
       Checksum: NULL  
 Create_options:   
        Comment:   
*************************** 2. row ***************************  
           Name: MEM_euckr  
         Engine: MEMORY  
        Version: 10  
     Row_format: Fixed  
           Rows: 8388608  
 Avg_row_length: 145  
    Data_length: 1285522208  
Max_data_length: 40971727365  
   Index_length: 0  
      Data_free: 0  
 Auto_increment: NULL  
    Create_time: 2014-01-23 11:11:35  
    Update_time: NULL  
     Check_time: NULL  
      Collation: euckr_korean_ci  
       Checksum: NULL  
 Create_options:   
        Comment:   
*************************** 3. row ***************************  
           Name: MEM_latin1  
         Engine: MEMORY  
        Version: 10  
     Row_format: Fixed  
           Rows: 8388608  
 Avg_row_length: 81  
    Data_length: 744283568  
Max_data_length: 39533221665  
   Index_length: 0  
      Data_free: 0  
 Auto_increment: NULL  
    Create_time: 2014-01-23 11:11:30  
    Update_time: NULL  
     Check_time: NULL  
      Collation: latin1_swedish_ci  
       Checksum: NULL  
 Create_options:   
        Comment:   
3 rows in set (0.00 sec)
```

#### varchar,char에 따른 size차이
* row format이 fixed라면 varchar, char 도 같은 Data length를 가질 수도 있다.
* varchar(64), varchar(40) 은 다른 Data length를 가진다.
* varchar(40), char(40) 은 값은 Data length를 가진다.

```sql
[db-dis-mdb][dis_mysql]> CREATE TABLE `MEM_UTF8_varchar40` (
    ->   `DB_SERVER_ID` smallint(5) unsigned NOT NULL DEFAULT '0',
    ->   `V_NAME` varchar(40) NOT NULL DEFAULT '',
    ->   `CTIME` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
    ->   `V_VALUE` bigint(20) unsigned DEFAULT NULL
    -> ) ENGINE=MEMORY DEFAULT CHARSET=utf8;
Query OK, 0 rows affected (0.00 sec)

[db-dis-mdb][dis_mysql]> CREATE TABLE `MEM_UTF8_char40` (
    ->   `DB_SERVER_ID` smallint(5) unsigned NOT NULL DEFAULT '0',
    ->   `V_NAME` char(40) NOT NULL DEFAULT '',
    ->   `CTIME` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
    ->   `V_VALUE` bigint(20) unsigned DEFAULT NULL
    -> ) ENGINE=MEMORY DEFAULT CHARSET=utf8;
Query OK, 0 rows affected (0.00 sec)

[db-dis-mdb][dis_mysql]>
[db-dis-mdb][dis_mysql]> insert into `MEM_UTF8_varchar40` select * from `MEM_UTF8`;
Query OK, 8388608 rows affected (5.33 sec)
Records: 8388608  Duplicates: 0  Warnings: 0

[db-dis-mdb][dis_mysql]>
[db-dis-mdb][dis_mysql]> insert into `MEM_UTF8_char40` select * from `MEM_UTF8`;
Query OK, 8388608 rows affected (5.94 sec)
Records: 8388608  Duplicates: 0  Warnings: 0

[db-dis-mdb][dis_mysql]>
[db-dis-mdb][dis_mysql]> show table statusG
*************************** 1. row ***************************
           Name: MEM_UTF8
         Engine: MEMORY
        Version: 10
     Row_format: Fixed
           Rows: 8388608
 Avg_row_length: 209
    Data_length: 1826745184
Max_data_length: 41557785302
   Index_length: 0
      Data_free: 0
 Auto_increment: NULL
    Create_time: 2014-01-23 10:57:06
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
*************************** 2. row ***************************
           Name: MEM_UTF8_char40
         Engine: MEMORY
        Version: 10
     Row_format: Fixed
           Rows: 8388608
 Avg_row_length: 136
    Data_length: 1217787104
Max_data_length: 40563579912
   Index_length: 0
      Data_free: 0
 Auto_increment: NULL
    Create_time: 2014-01-23 11:14:18
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
*************************** 3. row ***************************
           Name: MEM_UTF8_varchar40
         Engine: MEMORY
        Version: 10
     Row_format: Fixed
           Rows: 8388608
 Avg_row_length: 137
    Data_length: 1217787104
Max_data_length: 40861841529
   Index_length: 0
      Data_free: 0
 Auto_increment: NULL
    Create_time: 2014-01-23 11:14:10
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
3 rows in set (0.00 sec)

```

#### DML을 통한 사이즈 확인
* Delete 및 Insert 후의 Data length 확인

```sql
[db-dis-mdb][dis_mysql]> show table statusG
*************************** 1. row ***************************
           Name: MEM_UTF8
         Engine: MEMORY
        Version: 10
     Row_format: Fixed
           Rows: 7388608
 Avg_row_length: 209
    Data_length: 1826745184
Max_data_length: 41557785302
   Index_length: 0
      Data_free: 209000000
 Auto_increment: NULL
    Create_time: 2014-01-23 11:26:28
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
1 row in set (0.00 sec)

[db-dis-mdb][dis_mysql]> insert into `MEM_UTF8` select * from `MEM_UTF8` limit 1000000;
Query OK, 1000000 rows affected (1.59 sec)
Records: 1000000  Duplicates: 0  Warnings: 0

[db-dis-mdb][dis_mysql]> show table statusG
*************************** 1. row ***************************
           Name: MEM_UTF8
         Engine: MEMORY
        Version: 10
     Row_format: Fixed
           Rows: 8388608
 Avg_row_length: 209
    Data_length: 1826745184
Max_data_length: 41557785302
   Index_length: 0
      Data_free: 0
 Auto_increment: NULL
    Create_time: 2014-01-23 11:26:28
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
1 row in set (0.00 sec)

[db-dis-mdb][dis_mysql]> delete from `MEM_UTF8` limit 1000000;
Query OK, 1000000 rows affected (0.51 sec)

[db-dis-mdb][dis_mysql]> show table statusG
*************************** 1. row ***************************
           Name: MEM_UTF8
         Engine: MEMORY
        Version: 10
     Row_format: Fixed
           Rows: 7388608
 Avg_row_length: 209
    Data_length: 1826745184
Max_data_length: 41557785302
   Index_length: 0
      Data_free: 209000000
 Auto_increment: NULL
    Create_time: 2014-01-23 11:26:28
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
1 row in set (0.00 sec)

[db-dis-mdb][dis_mysql]> OPTIMIZE TABLE `MEM_UTF8`;
+--------------------+----------+----------+-----------------------------------------------------------+
| Table              | Op       | Msg_type | Msg_text                                                  |
+--------------------+----------+----------+-----------------------------------------------------------+
| dis_mysql.MEM_UTF8 | optimize | note     | The storage engine for the table doesn't support optimize |
+--------------------+----------+----------+-----------------------------------------------------------+
1 row in set (0.00 sec)

[db-dis-mdb][dis_mysql]> alter table `MEM_UTF8` ENGINE=MEMORY;
Query OK, 7388608 rows affected (3.23 sec)
Records: 7388608  Duplicates: 0  Warnings: 0

[db-dis-mdb][dis_mysql]>  show table statusG
*************************** 1. row ***************************
           Name: MEM_UTF8
         Engine: MEMORY
        Version: 10
     Row_format: Fixed
           Rows: 7388608
 Avg_row_length: 209
    Data_length: 1608949440
Max_data_length: 41557785302
   Index_length: 0
      Data_free: 0
 Auto_increment: NULL
    Create_time: 2014-01-23 11:36:47
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
1 row in set (0.00 sec)

[db-dis-mdb][dis_mysql]> insert into `MEM_UTF8` select * from `MEM_UTF8` limit 1000000;
Query OK, 1000000 rows affected (1.56 sec)
Records: 1000000  Duplicates: 0  Warnings: 0

[db-dis-mdb][dis_mysql]>  show table statusG
*************************** 1. row ***************************
           Name: MEM_UTF8
         Engine: MEMORY
        Version: 10
     Row_format: Fixed
           Rows: 8388608
 Avg_row_length: 209
    Data_length: 1826745184
Max_data_length: 41557785302
   Index_length: 0
      Data_free: 0
 Auto_increment: NULL
    Create_time: 2014-01-23 11:36:47
    Update_time: NULL
     Check_time: NULL
      Collation: utf8_general_ci
       Checksum: NULL
 Create_options:
        Comment:
1 row in set (0.00 sec)
```
