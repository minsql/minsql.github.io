---
title: MySQL explicit_defaults_for_timestamp
author: min_kim
created: 2019/02/19
modified:
layout: post
tags: mysql mysql_variables
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# explicit_defaults_for_timestamp 에 대해서
> [Warning] TIMESTAMP with implicit DEFAULT value is deprecated. Please use --explicit_defaults_for_timestamp server option (see documentation for more details).

-> 이런 로그를 mysql error log에서 만난적이 있다면 참고하세요.

## Default Value: OFF
### 설명
* TIMESTAMP 컬럼의 default 속성을 제어하는 옵션이다.
  * OFF라면,
    - nullable로 선언되지 않았다면, 자동으로 NOT NULL로 선언된다.
    - NULL을 인서트하면, 자동으로 current timestamp가 들어간다.
    - 테이블의 첫 TIMESTAMP 컬럼이 nullable로 선언되지 않았고, default값이나, on update 속성이 선언되지 않았다면, 자동으로 DEFAULT CURRENT_TIMESTAMP and ON UPDATE CURRENT_TIMESTAMP 속성이 선언된다.
    - 두번째 TIMESTAMP컬럼부터는,  nullable로 선언되지 않았고, default값이 선언되지 않았다면, 자동으로 DEFAULT '0000-00-00 00:00:00'로 선언된다. data insert시에 warning나오지 않는다.

```
root@localhost:test 12:27:45>create table timestamptest ( no int auto_increment primary key, b timestamp, c timestamp);
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 12:28:29>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `c` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)

root@localhost:test 12:45:30>insert into timestamptest(no) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:45:37>insert into timestamptest(b) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:45:41>insert into timestamptest(c) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:45:44>select * from timestamptest;
+----+---------------------+---------------------+
| no | b                   | c                   |
+----+---------------------+---------------------+
|  1 | 2019-02-19 12:45:37 | 0000-00-00 00:00:00 |
|  2 | 2019-02-19 12:45:41 | 0000-00-00 00:00:00 |
|  3 | 2019-02-19 12:45:44 | 2019-02-19 12:45:44 |
+----+---------------------+---------------------+
3 rows in set (0.00 sec)

```

- - - strict SQL mode나  NO_ZERO_DATE SQL mode 를 사용한다면,  '0000-00-00 00:00:00'은 invalid한 것으로 주의해야한다.

```

root@localhost:test 12:45:57>set sql_mode='traditional';
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 12:47:43>truncate table timestamptest;
Query OK, 0 rows affected (0.12 sec)

root@localhost:test 12:47:48>insert into timestamptest(no) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:47:50>insert into timestamptest(c) values('0000-00-00 00:00:00');
ERROR 1292 (22007): Incorrect datetime value: '0000-00-00 00:00:00' for column 'c' at row 1
root@localhost:test 12:47:52>select * from timestamptest;
+----+---------------------+---------------------+
| no | b                   | c                   |
+----+---------------------+---------------------+
|  1 | 2019-02-19 12:47:50 | 0000-00-00 00:00:00 |
+----+---------------------+---------------------+
1 row in set (0.00 sec)

```

- - - default로 선언된 zero date는 waring이나 error 없이 들어간다. 그런데 직접 zero date를 인서트하는 것은 sql_mode에 의해서 error가 된다.
* * ON이라면,
    - TIMESTAMP컬럼 속성을 명시하지 않았을때, 혹은 NULL을 인서트했을 때, current timestamp를 자동으로 할당하지 않는다. current timestamp 사용하려면 `NOT NULL DEFAULT CURRENT_TIMESTAMP`를 사용해야한다.
    - TIMESTAMP컬럼이 NOT NULL로 명시되었다면 NULL insert를 허용하지 않는다.
    - zero date의 인서트동작은 SQL mode에 따른다.

```
root@localhost:test 12:48:00>set explicit_defaults_for_timestamp = 1;
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 12:49:34>drop table timestamptest;
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 12:49:51>create table timestamptest ( no int auto_increment primary key, b timestamp, c timestamp);
Query OK, 0 rows affected (0.01 sec)

root@localhost:test 12:49:52>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NULL DEFAULT NULL,
  `c` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)

root@localhost:test 12:50:02>drop table timestamptest;
Query OK, 0 rows affected (0.03 sec)

root@localhost:test 12:51:29>create table timestamptest ( no int auto_increment primary key, b timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, c timestamp NOT NULL DEFAULT '0000-00-00 00:00:00');
Query OK, 0 rows affected (0.01 sec)

root@localhost:test 12:51:31>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `c` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)

root@localhost:test 12:52:26>insert into timestamptest(no) values(null);
Query OK, 1 row affected (0.00 sec)

root@localhost:test 12:52:48>insert into timestamptest(b) values(null);
ERROR 1048 (23000): Column 'b' cannot be null

```

- - - NOT NULL에 default값을 선언하지 않았다면, default값은 SQL mode에 따라 다르다.
      - strict mode라면, ERROR
      - strict mode가 아니면 '0000-00-00 00:00:00' and warning

```
root@localhost:test 12:57:37>create table timestamptest ( no int auto_increment primary key, b timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, c timestamp NOT NULL);
Query OK, 0 rows affected (0.05 sec)

root@localhost:test 12:58:01>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `c` timestamp NOT NULL,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)

root@localhost:test 13:00:47>set sql_mode='traditional';
Query OK, 0 rows affected, 1 warning (0.00 sec)

Warning (Code 3090): Changing sql mode 'NO_AUTO_CREATE_USER' is deprecated. It will be removed in a future release.
root@localhost:test 13:00:54>insert into timestamptest(no) values(null);
ERROR 1364 (HY000): Field 'c' doesn't have a default value
```


## timestamp를 포함하는 테이블 생성, 변경시 binary log
- timestamp를 포함하는 테이블을 생성하거나, timestamp 컬럼을 변경하면, binary log에 `SET @@session.explicit_defaults_for_timestamp=0/*!*/;` 와 같이 explicit_defaults_for_timestamp 변수 설정하는 문장이 남는다.

```
# at 3590370
#190725 10:59:50 server id 1  end_log_pos 3590535 CRC32 0xfe951368      Query   thread_id=9363  exec_time=0     error_code=0
SET TIMESTAMP=1564019990/*!*/;
SET @@session.explicit_defaults_for_timestamp=0/*!*/;
create table timestamptest ( no int auto_increment primary key, b timestamp, c timestamp)
/*!*/;

# at 3617396
#190725 11:06:14 server id 1  end_log_pos 3617553 CRC32 0xc42ef384      Query   thread_id=9363  exec_time=0     error_code=0
use `test`/*!*/;
SET TIMESTAMP=1564020374/*!*/;
/*!\C utf8mb4 *//*!*/;
SET @@session.character_set_client=45,@@session.collation_connection=45,@@session.collation_server=45/*!*/;
SET @@session.explicit_defaults_for_timestamp=0/*!*/;
alter table timestamptest modify `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
/*!*/;
```

- master와 slave의 explicit_defaults_for_timestamp값이 다르다면 default절이 서로 다르게 생성될수 있으므로, MySQL이 일부러 이 문장을 남긴다.

### 여기서 주의할 점!!
- 1) 만약 session level에서 explicit_defaults_for_timestamp을 조정하고,테이블을 생성하거나,변경했다면 문제가 될 수 있다.

```
root@localhost:test 11:08:50>set session explicit_defaults_for_timestamp=1;
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 11:10:40>alter table timestamptest modify `c` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;
Query OK, 0 rows affected (0.00 sec)
Records: 0  Duplicates: 0  Warnings: 0


root@localhost:test 11:11:12>show create table timestamptest\G
*************************** 1. row ***************************
       Table: timestamptest
Create Table: CREATE TABLE `timestamptest` (
  `no` int(11) NOT NULL AUTO_INCREMENT,
  `b` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `c` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
1 row in set (0.00 sec)


# at 3638542
#190725 11:11:12 server id 1  end_log_pos 3638699 CRC32 0xd873c9a7      Query   thread_id=9363  exec_time=0     error_code=0
use `test`/*!*/;
SET TIMESTAMP=1564020672/*!*/;
/*!\C utf8mb4 *//*!*/;
SET @@session.character_set_client=45,@@session.collation_connection=45,@@session.collation_server=45/*!*/;
SET @@session.explicit_defaults_for_timestamp=1/*!*/;
alter table timestamptest modify `c` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
/*!*/;
```

- 2) `SET @@session.explicit_defaults_for_timestamp=1/*!*/;` 설정이 binary log에 남게되고, slave는 이를 reply하게 된다. 지금부터 slave의 sql_thread는 explicit_defaults_for_timestamp가 1인 상태로 돌게된다.

- 3) 이때 master에서 explicit_defaults_for_timestamp=0인 세션에서 timestamp값에 null을 인서트하려고 한다면?

```
root@localhost:test 11:17:23>set session explicit_defaults_for_timestamp=0;
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 11:22:07>insert into timestamptest(b,c) values(now(),null);
Query OK, 1 row affected (0.00 sec)
```

- 4) master에서는 OK이지만, slave에서 explicit_defaults_for_timestamp로 동작하기때문에 binlog_format이 MIXED or STATEMENT라면 해당 insert를 수행하지 못하고 ERROR가 나게된다.


```
root@localhost:test 11:22:41>show slave status\G
*************************** 1. row ***************************
               Slave_IO_State: Waiting for master to send event
...
             Slave_IO_Running: Yes
            Slave_SQL_Running: No
...
                   Last_Errno: 1048
                   Last_Error: Error 'Column 'c' cannot be null' on query. Default database: 'test'. Query: 'insert into timestamptest(b,c) values(now(),null)'
```

- 5) slave를 다시 시작해주어야한다. 그럼 global 변수값으로 다시 동작하게 되니 문장을 실행할 수 있게된다.

- 참고로, binlog_format이 ROW라면, 다음과 같이  row format으로 binlog가 남기때문에 문제 없다.

```
# at 3666093
#190725 11:17:32 server id 1  end_log_pos 3666141 CRC32 0x44febd19      Write_rows: table id 348 flags: STMT_END_F

BINLOG '
PBE5XR0BAAAAQQAAAHHwNwCAAClpbnNlcnQgaW50byB0aW1lc3RhbXB0ZXN0KGMpIHZhbHVlcyhu
dWxsKV5iDG0=
PBE5XRMBAAAAPAAAAK3wNwAAAFwBAAAAAAEABHRlc3QADXRpbWVzdGFtcHRlc3QAAwMREQIAAAAp
an0F
PBE5XR4BAAAAMAAAAN3wNwAAAFwBAAAAAAEAAgADB/gDAAAAXTkRPF05ETwZvf5E
'/*!*/;
### INSERT INTO `test`.`timestamptest`
### SET
###   @1=3 /* INT meta=0 nullable=0 is_null=0 */
###   @2=1564021052 /* TIMESTAMP(0) meta=0 nullable=0 is_null=0 */
###   @3=1564021052 /* TIMESTAMP(0) meta=0 nullable=0 is_null=0 */
```
