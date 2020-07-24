---
title: procedure 호출을 통한 set 명령어실행
author: min_cho
created: 2020/06/28
modified:
layout: post
tags: mysql mysql_lock
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---



## 개요

* 특정사용자들에게는 접속한 세션에 대해서 super권한이 없음에도 불구하고 sql_log_bin, binlog_format, explicit_defaults_for_timestamp 등을 조절하여 사용해야하는 필요성이 생겼다.

  * application user가 batch를 돌리기전 binlog_format을 STATEMENT로 변경
  * 작업을 위한 Temp성 테이블을 생성하기 위하여 [sql_log_bin](https://dev.mysql.com/doc/refman/en/set-sql-log-bin.html)을 off로 변경
  * airflow 같은 특정 Application을 위해 테이블 생성시 [explicit_defaults_for_timestamp](https://dev.mysql.com/doc/refman/en/server-system-variables.html#sysvar_explicit_defaults_for_timestamp) 를 on으로 변경


* 하지만, 해당 사용자들에게 [set command](https://dev.mysql.com/doc/refman/en/set-variable.html#set-variable-system-variables)를 실행시키기 위해 [SUPER](https://dev.mysql.com/doc/refman/en/privileges-provided.html#priv_super) 권한을 준다면 이는 매우 위험한 일이다.

* super 권한을 주지 않고 procedure의 SQL SECURITY를 이용하여, 해당 문제를 해결할 수 있다. **PROCEDURE 호출은은 SUPER권한이 없어 SET을 실행할 수 없는 유저이지만, 실행은 PROCEDURE를 정의한 USER의 SUPER권한을 이용하는 방법이다.**

  * SQL SECURITY DEFINER - 해당 프로시져의 DEFINER권한으로 PROCEDURE를 실행한다.
  * SQL SECURITY INVOKER - 호출하는 USER의 권한으로 PROCEDURE를 실행한다.


------

## 스크립트

### procedure 생성
```sql
CREATE DATABASE common_db;

USE common_db;

 Delimiter $$

 drop procedure `set_explicitDefaultsForTimestamp`$$

 CREATE DEFINER=`root`@`localhost` PROCEDURE `set_explicitDefaultsForTimestamp`(value tinyint)
 SQL SECURITY DEFINER
 BEGIN
    set session explicit_defaults_for_timestamp=value;
 END$$



 drop procedure `set_sqlLogBin`$$

 CREATE DEFINER=`root`@`localhost` PROCEDURE `set_sqlLogBin`(value tinyint)
 SQL SECURITY DEFINER
 BEGIN
    set session sql_log_bin=value;
 END$$



drop procedure `set_binlogFormat`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `set_binlogFormat`(value varchar(10))
SQL SECURITY DEFINER
BEGIN
   set session binlog_format=value;
END$$

delimiter ;


```


### 예제

```sql
mysql> show grants;
+---------------------------------------------------------------------------------+
| Grants for user_C@%                                                             |
+---------------------------------------------------------------------------------+
| GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE, SHOW VIEW ON *.* TO 'user_C'@'%' |
+---------------------------------------------------------------------------------+
1 row in set (0.00 sec)

-- ^^^ super 권한을 가지고 있지않다. 하지만 EXECUTE 권한을 가지고 있으니 프로시져를 호출할 수 있다. 참고로 super권한이 있더라도 *.* 가 아닌 db1.* 과 같이 특정 database에 대한 super권한이라면 set 명령어시 권한부족의 에러가 발생한다.

-- ^^^ *.* 영역에 EXECUTE 권한이 굳이 필요없어도 된다. GRANT EXECUTE ON common_db.* to user_C; 와 같이 common_db에만 EXECUTE권한을 줄 수 있다.

mysql> select current_user(), @@session.sql_log_bin,@@session.binlog_format,@@session.explicit_defaults_for_timestamp;
+----------------+-----------------------+-------------------------+-------------------------------------------+
| current_user() | @@session.sql_log_bin | @@session.binlog_format | @@session.explicit_defaults_for_timestamp |
+----------------+-----------------------+-------------------------+-------------------------------------------+
| user_C@%       |                     1 | ROW                     |                                         0 |
+----------------+-----------------------+-------------------------+-------------------------------------------+
1 row in set (0.00 sec)

mysql> set session sql_log_bin=0;
ERROR 1227 (42000): Access denied; you need (at least one of) the SUPER privilege(s) for this operation

mysql> set session binlog_format='STATEMENT';
ERROR 1227 (42000): Access denied; you need (at least one of) the SUPER privilege(s) for this operation

mysql>  set session explicit_defaults_for_timestamp=1;
ERROR 1227 (42000): Access denied; you need (at least one of) the SUPER privilege(s) for this operation

-- ^^^ super 권한이 없음으로 실패한다.



mysql> call common_db.set_sqlLogBin(0);
Query OK, 0 rows affected (0.01 sec)

mysql> call common_db.set_binlogFormat('STATEMENT');
Query OK, 0 rows affected (0.00 sec)

mysql> call common_db.set_explicitDefaultsForTimestamp(1);
Query OK, 0 rows affected (0.00 sec)

mysql> select current_user(), @@session.sql_log_bin,@@session.binlog_format,@@session.explicit_defaults_for_timestamp;
+----------------+-----------------------+-------------------------+-------------------------------------------+
| current_user() | @@session.sql_log_bin | @@session.binlog_format | @@session.explicit_defaults_for_timestamp |
+----------------+-----------------------+-------------------------+-------------------------------------------+
| user_C@%       |                     0 | STATEMENT               |                                         1 |
+----------------+-----------------------+-------------------------+-------------------------------------------+
1 row in set (0.00 sec)

-- ^^^ 필요한 procedure를 호출하여, 해당 세션의 속성을 변경시킬 수 있다.


mysql> connect
Connection id:    6
Current database: *** NONE ***

mysql> select current_user(), @@session.sql_log_bin,@@session.binlog_format,@@session.explicit_defaults_for_timestamp;
+----------------+-----------------------+-------------------------+-------------------------------------------+
| current_user() | @@session.sql_log_bin | @@session.binlog_format | @@session.explicit_defaults_for_timestamp |
+----------------+-----------------------+-------------------------+-------------------------------------------+
| user_C@%       |                     1 | ROW                     |                                         0 |
+----------------+-----------------------+-------------------------+-------------------------------------------+
1 row in set (0.01 sec)

-- ^^^ 새로운 세션에서는 원래대로 global값으로 할당받는다.

```
