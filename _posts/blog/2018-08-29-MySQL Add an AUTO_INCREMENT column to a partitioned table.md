---
title: MySQL Add an AUTO_INCREMENT column to a partitioned table
author: min_kim
created: 2018/08/29
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


# Add an AUTO_INCREMENT column to a partitioned table
> 사용중인 파티션테이블에 AI column을 추가하려고한다. 이때 AUTO_INCREMENT속성으로 add column, ALGORITHM=INPLACE 하면 에러가 발생한다. 현상을 살펴보자.

## MySQL partitioned table without AUTO_INCREMENT column
## Creating a test table
```
CREATE TABLE `aitest` (
  `no` int(11) NOT NULL,
  `name` varchar(10) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`no`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4
PARTITION BY RANGE (unix_timestamp(created_at))
(PARTITION p20180601 VALUES LESS THAN (1530370800) ENGINE = InnoDB,
 PARTITION p20180701 VALUES LESS THAN (1533049200) ENGINE = InnoDB,
 PARTITION p20180801 VALUES LESS THAN (1535727600) ENGINE = InnoDB,
 PARTITION p20180901 VALUES LESS THAN (1538319600 ) ENGINE = InnoDB);


insert into aitest values(100,'a','2018-06-01');
insert into aitest values(200,'b','2018-07-01');
insert into aitest values(300,'c','2018-08-01');
```


## Add AI column
### Add AI column with ALGORITHM=INPLACE
* AI column을 add 하는 것은 LOCK=NONE으로 안되고, AI column은 PK이거나 UK여야한다. PK는 기존에 쓰고 있는 것이 있으니 UK로 선언한다.

```
alter table `aitest`
add column `seq` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, add unique key seq_uk(seq, created_at), ALGORITHM=INPLACE, LOCK=SHARED;
```

#### Don't panic, you will see this -.-.
```
root@localhost:test 18:10:36>select * from aitest;
+-----+------+---------------------+-----+
| no  | name | created_at          | seq |
+-----+------+---------------------+-----+
| 100 | a    | 2018-06-01 00:00:00 |   1 |
| 200 | b    | 2018-07-01 00:00:00 |   1 |
| 300 | c    | 2018-08-01 00:00:00 |   1 |
+-----+------+---------------------+-----+
3 rows in set (0.00 sec)
```
* 왜이럴까. T.T 분명 partitioned table에서도 AI컬럼 썼었는데, sequential하게 증가했었는데,...
* add column하면 각 partition에 초기값부터 넣게 되는 것 같은데.
* drop 한다.
```
alter table `aitest`
drop column `seq` , drop index seq_uk, ALGORITHM=INPLACE, LOCK=NONE;
```

## Add AI column with ALGORITHM=COPY
* column을 먼저 만들고 AI 속성을 변경시킨다. FYI, 속성변경은 ALGORITHM=COPY.

```
alter table `aitest`
add column `seq` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, add unique key seq_uk(seq, created_at), ALGORITHM=COPY, LOCK=SHARED;
```

#### YES, it works!
```
root@localhost:test 18:20:24>select * from aitest;
+-----+------+---------------------+-----+
| no  | name | created_at          | seq |
+-----+------+---------------------+-----+
| 100 | a    | 2018-06-01 00:00:00 |   1 |
| 200 | b    | 2018-07-01 00:00:00 |   2 |
| 300 | c    | 2018-08-01 00:00:00 |   3 |
+-----+------+---------------------+-----+
3 rows in set (0.00 sec)
```

#### Bug related to ALGORITHM
* ALGORITHM에 따라서 다르게 동작한다. Bug로 등록함. https://bugs.mysql.com/bug.php?id=92241
* **ALGORITHM=COPY**로 사용해야한다.

```
alter table `aitest`
add column `seq` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, add unique key seq_uk(seq, created_at), ALGORITHM=COPY, LOCK=SHARED;
```

## Conclusion
- **AUTO_INCREMENT column을 Partitioned table에 추가할때에 ALGORITHM=COPY를 사용한다!!!**
