---
title: MySQL Transaction isolation level
author: min_cho
created: 2014/07/10 06:24:00
modified:
layout: post
tags: Mysql
image:
  feature: mysql.png
categories: blog
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# MySQL Transaction isolation level

### Transaction level 확인

```sql
13:14:16-[(none)]> show global variables like 'tx_isolation';
+---------------+-----------------+
| Variable_name | Value           |
+---------------+-----------------+
| tx_isolation  | REPEATABLE-READ |
+---------------+-----------------+
1 row in set (0.00 sec)
```
 

### READ_UNCOMMITED

| Session 1 | Session 2 |
|---------|--------|
|`13:31:24-[test]> start transaction;`| |
|`Query OK, 0 rows affected (0.00 sec)`| |
|`13:31:30-[test]> insert into xxx values (1);`| |
|`Query OK, 1 row affected (0.00 sec)` | |
| |`13:32:12-[test]> select * from xxx;`|
| |`+------+`|
| |`| a    |`|
| |`+------+`|
| |`|    1 |`|
| |`+------+`|
| |`1 row in set (0.00 sec)`|
|`13:32:20-[test]> rollback;`| |
|`Query OK, 0 rows affected (0.00 sec)`| |
| |`13:32:32-[test]> select * from xxx;`|
| |`Empty set (0.00 sec)`|

 

### READ-COMMITED

| Session 1 | Session 2 |
|---------|--------|
|`13:59:52-[test]> start transaction;`| |
|`Query OK, 0 rows affected (0.00 sec)`| |
|`14:00:06-[test]> select * from xxx;`| |
|`Empty set (0.00 sec)   `| |
|`14:00:13-[test]> insert into xxx values (1); `| |
|`Query OK, 1 row affected (0.00 sec)   `| |
|`14:00:29-[test]> select * from xxx; `| |
|`+------+ `| |
|`| a    | `| |
|`+------+ `| |
|`|    1 | `| |
|`+------+ `| |
|`1 row in set (0.00 sec)`| |
| |`14:00:37-[test]> start transaction; `|
| |`Query OK, 0 rows affected (0.00 sec)   `|
| |`14:00:45-[test]> select * from xxx; `|
| |`Empty set (0.00 sec)   `|
| |`14:00:51-[test]> insert into xxx values (2); `|
| |`Query OK, 1 row affected (0.00 sec)   `|
| |`14:01:03-[test]> commit; `|
| |`Query OK, 0 rows affected (0.00 sec)   `|
| |`14:01:11-[test]> select * from xxx; `|
| |`+------+ `|
| |`| a    | `|
| |`+------+ `|
| |`|    2 | `|
| |`+------+ `|
| |`1 row in set (0.00 sec)`|
|`14:00:34-[test]>`| |
|`14:01:19-[test]> select * from xxx;`| |
|`+------+ `| |
|`| a    | `| |
|`+------+ `| |
|`|    1 | `| |
|`|    2 | `| |
|`+------+ `| |
|`2 rows in set (0.00 sec)`| |
|`14:01:22-[test]> commit;`| |
|`Query OK, 0 rows affected (0.00 sec)`| |


### log-bin 과 tx_isolation 과의 관계
* ```log-bin=mysql-bin```

```sql
14:32:13-[test]> start transaction;
Query OK, 0 rows affected (0.00 sec)

14:32:20-[test]> insert into xxx values (1);
ERROR 1665 (HY000): Cannot execute statement: impossible to write to binary log since BINLOG_FORMAT = STATEMENT and at least one table uses a storage engine limited to row-based logging. InnoDB is limited to row-logging when transaction isolation level is READ COMMITTED or READ UNCOMMITTED.
```
