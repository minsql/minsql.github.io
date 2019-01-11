---
title: unique index with nullable column
author: min_kim
created: 2014/02/14 09:55:00
modified:
layout: post
tags: mysql mysql_index
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---



# unique index with nullable column

```sql
mysql> show create table test1;
+-------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table | Create Table                                                                                                                                                                                 |
+-------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| test1 | CREATE TABLE `test1` (
  `no1` int(11) DEFAULT NULL,
  `no2` int(11) DEFAULT NULL,
  `no3` int(11) DEFAULT NULL,
  UNIQUE KEY `test1_uk1` (`no1`,`no2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 |
+-------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> insert into test1 values(1,1,1);
Query OK, 1 row affected (0.01 sec)

mysql> insert into test1 values(1,2,1);
Query OK, 1 row affected (0.00 sec)

mysql> insert into test1 values(1,null,1);
Query OK, 1 row affected (0.00 sec)

mysql> insert into test1 values(1,null,1);
Query OK, 1 row affected (0.01 sec)

mysql> insert into test1 values(1,null,2);
Query OK, 1 row affected (0.01 sec)

mysql>
```


-.- 복합키에서 nullable컬럼 나머지키 unique보장안됨
* Multi column unique indexes do not work in MySQL if you have a NULL value in row as MySQL treats NULL as a unique value and at least currently has no logic to work around it in multi-column indexes.
* oracle은 unique constraint 위배나옴. OK.
* postgresql에서 그냥 unique index만 걸면 마찬가지임.NG


```alter table test1 add constraint test1_uk1 unique using index test1_uk1;```


* postgresql에서 유니크 constraint 걸어주면? 그래도 안됨.
* NG mssql에서는 NULL중복도 안된다고함. skip.
