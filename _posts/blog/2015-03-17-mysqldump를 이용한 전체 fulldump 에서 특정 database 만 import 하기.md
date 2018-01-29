---
title: mysqldump를 이용한 전체 fulldump 에서 특정 database 만 import 하기
author: min_cho
created: 2015/03/17 15:05:24
modified:
layout: post
tags: MySQL
image:
  feature: mysql.png
categories: blog
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---



# mysqldump를 이용한 전체 fulldump 에서 특정 database 만 import 하기

위에는 3가지 방법이 있다. * mysql client 툴의 --one-database 옵션을 쓰는 방법 * dump를 필요한 해당 database 만 sed로 잘라내는 방법 * 권한을 이용하여 다른 테이블에 access를 막는 방법

### 데이터 준비

  * 데이터를 만들어 보자! abc 와 def database를 만들고, abc에는 aaa,bbb 테이블을 만든다. def에는 aaa 만 만들어보자. mysql.innodb_table_stats 의 last_updated를 잘 살펴보길 바란다.

```
    mysql> create database abc;
    Query OK, 1 row affected (0.01 sec)

    mysql> create database def;
    Query OK, 1 row affected (0.00 sec)

    mysql> create table abc.aaa (a int);
    Query OK, 0 rows affected (0.03 sec)

    mysql> create table abc.bbb (a int);
    Query OK, 0 rows affected (0.02 sec)

    mysql> create table def.aaa (a int);
    Query OK, 0 rows affected (0.04 sec)

    mysql> insert into abc.aaa values (1),(2),(3);
    Query OK, 3 rows affected (0.04 sec)
    Records: 3  Duplicates: 0  Warnings: 0

    mysql> insert into abc.bbb values (1),(2),(3);
    Query OK, 3 rows affected (0.02 sec)
    Records: 3  Duplicates: 0  Warnings: 0

    mysql> insert into def.aaa values (1),(2),(3);
    Query OK, 3 rows affected (0.02 sec)
    Records: 3  Duplicates: 0  Warnings: 0

    mysql>  select database_name,table_name,last_update from mysql.innodb_table_stats where table_name in ('aaa','bbb');
    +---------------+------------+---------------------+
    | database_name | table_name | last_update         |
    +---------------+------------+---------------------+
    | abc           | aaa        | 2004-07-20 22:20:51 |
    | abc           | bbb        | 2004-07-20 22:20:56 |
    | def           | aaa        | 2004-07-20 22:21:00 |
    +---------------+------------+---------------------+
    3 rows in set (0.05 sec)
```

  * mysqldump를 이용하여, fulldump를 내린다.

```
    [mysql@testvm1 db]$ /db/5.6/bin/mysqldump -uroot --opt --single-transaction --all-databases > fulldump.sql
    [mysql@testvm1 db]$ ls -al fulldump.sql
    -rw-rw-r--. 1 mysql mysql 658532 Jul 20 22:22 fulldump.sql
```

### 1\. mysql client 툴의 --one-database 을 이용하는 방법

  * 해당 옵션은 지정된 database를 제외하고는 다른 database에 대해서는 무시한다. (위의 옵션은 4.X 때부터 존재하는 옵션이다) [MySQL Manual](http://dev.mysql.com/doc/refman/5.6/en/mysql-command-options.html#option_mysql_one-database)

```
    [mysql@testvm1 db]$ /db/5.6/bin/mysql -uroot --one-database abc

    mysql> source fulldump.sql
    Query OK, 0 rows affected (0.00 sec)

    Query OK, 3 rows affected (0.01 sec)  -- 지정된 database는 잘 적용된다!
    Records: 3  Duplicates: 0  Warnings: 0

    Query OK, 0 rows affected (0.00 sec)

    Query OK, 0 rows affected (0.00 sec)
    ....
    Database changed
    Ignoring query to other database  -- 지정된 database가 아닌경우 모든 쿼리를 무시한다!
    Ignoring query to other database
    Ignoring query to other database
    Ignoring query to other databa


    --- mysql 재접속후. last_update 가 바뀐것을 알 수 있다. 잘 적용이 되었다.

    mysql> select database_name,table_name,last_update from mysql.innodb_table_stats where table_name in ('aaa','bbb');
    +---------------+------------+---------------------+
    | database_name | table_name | last_update         |
    +---------------+------------+---------------------+
    | abc           | aaa        | 2004-07-20 22:24:07 |
    | abc           | bbb        | 2004-07-20 22:24:07 |
    | def           | aaa        | 2004-07-20 22:21:00 |
    +---------------+------------+---------------------+
```

### 2\. full dump에서 특정 database 만 자르는 방법

  * 이방법은 전체 dump파일에서 필요한 database만을 자르는 방법이다. (def 데이터베이스만 자를 것이다)

```
    [mysql@testvm1 db]$ sed -n '/^-- Current Database: `def`/,/^-- Current Database: `/p' fulldump.sql > def_from_full.sql
    [mysql@testvm1 db]$ cat def_from_full.sql
    -- Current Database: `def`
    --

    CREATE DATABASE /*!32312 IF NOT EXISTS*/ `def` /*!40100 DEFAULT CHARACTER SET latin1 */;

    USE `def`;

    --
    -- Table structure for table `aaa`
    --

    DROP TABLE IF EXISTS `aaa`;
    /*!40101 SET @saved_cs_client     = @@character_set_client */;
    /*!40101 SET character_set_client = utf8 */;
    CREATE TABLE `aaa` (
      `a` int(11) DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=latin1;
    /*!40101 SET character_set_client = @saved_cs_client */;

    --
    -- Dumping data for table `aaa`
    --

    LOCK TABLES `aaa` WRITE;
    /*!40000 ALTER TABLE `aaa` DISABLE KEYS */;
    INSERT INTO `aaa` VALUES (1),(2),(3);
    /*!40000 ALTER TABLE `aaa` ENABLE KEYS */;
    UNLOCK TABLES;

    --
    -- Current Database: `mysql`



    -- mysql에 접속하여 확인해보자! last_update가 바뀐것으로 봐서 잘 적용되었다.
    mysql> select database_name,table_name,last_update from mysql.innodb_table_stats where table_name in ('aaa','bbb');
    +---------------+------------+---------------------+
    | database_name | table_name | last_update         |
    +---------------+------------+---------------------+
    | abc           | aaa        | 2004-07-20 22:24:07 |
    | abc           | bbb        | 2004-07-20 22:24:07 |
    | def           | aaa        | 2004-07-20 22:35:12 |
    +---------------+------------+---------------------+
    3 rows in set (0.00 sec)
```

### 3\. 번외 (특정 테이블만 import 할 수는 없을까?)

  * 가능하다! 특정 테이블의 권한이 있는 user를 통해 할 수 해당 table만을 import 시킬 수 있다.
    * 물론 database 단위로도 가능하다.
abc.bbb 테이블만 access 할 수 있는 테이블을 만들어보자!

```sql
    mysql>  GRANT DROP, CREATE, INSERT, ALTER ON `abc`.`bbb` TO 'abc_bbb'@'localhost' identified by 'abc_bbb';
    Query OK, 0 rows affected (0.07 sec)
```

이번에는 source 말고 직접 넣어보자. 중요한것은 --force를 사용하지 않는다면 에러가 나는 순간 해당작업은 실패할 것이다.

```
    [root@beta db]# /db/5.6/bin/mysql -ulim -plim --one-database test1 --force < /tmp/all_dump.sql
    [mysql@testvm1 db]$ /db/5.6/bin/mysql -uabc_bbb -pabc_bbb --one-database abc --force < ./fulldump.sql
    Warning: Using a password on the command line interface can be insecure.
    ERROR 1227 (42000) at line 18: Access denied; you need (at least one of) the SUPER privilege(s) for this operation
    ERROR 1227 (42000) at line 24: Access denied; you need (at least one of) the SUPER privilege(s) for this operation
    ERROR 1044 (42000) at line 30: Access denied for user 'abc_bbb'@'localhost' to database 'abc'
    ERROR 1142 (42000) at line 38: DROP command denied to user 'abc_bbb'@'localhost' for table 'aaa'
    ERROR 1142 (42000) at line 41: CREATE command denied to user 'abc_bbb'@'localhost' for table 'aaa'
    ERROR 1044 (42000) at line 50: Access denied for user 'abc_bbb'@'localhost' to database 'abc'
    ERROR 1142 (42000) at line 51: ALTER command denied to user 'abc_bbb'@'localhost' for table 'aaa'
    ERROR 1142 (42000) at line 52: INSERT command denied to user 'abc_bbb'@'localhost' for table 'aaa'
```

뭐 이래저래 에러가 쭈욱 나오지만 다른 테이블에는 권한이 없거나, 변수들을 setting 할 수 없기 때문이다. MySQL에 접속하여 다시 시간을 확인해보자

```sql
    mysql> select database_name,table_name,last_update from mysql.innodb_table_stats where table_name in ('aaa','bbb');
    +---------------+------------+---------------------+
    | database_name | table_name | last_update         |
    +---------------+------------+---------------------+
    | abc           | aaa        | 2004-07-20 22:24:07 |
    | abc           | bbb        | 2004-07-20 22:40:00 |
    | def           | aaa        | 2004-07-20 22:35:12 |
    +---------------+------------+---------------------+
    -- abc 데이터베이스의 bbb 테이블의 last_update가 변경되었다!
```
