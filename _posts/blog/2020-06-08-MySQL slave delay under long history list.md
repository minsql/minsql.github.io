---
title: MySQL slave delay under long history list
author: min_kim
created: 2020/06/08
modified:
layout: post
tags: mysql
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# MySQL MVCC history list 
> MySQL은 default REPEATABLE READ라서, InnoDB 모든 변경을 undo에 마구마구 기록하게 됩니다.
https://blog.jcole.us/2014/04/16/the-basics-of-the-innodb-undo-logging-and-history-system/
그리고 오래된 트랜잭션때문에 history list가 커지면 성능저하가 발생하게 됩니다.
https://www.percona.com/blog/2017/05/08/chasing-a-hung-transaction-in-mysql-innodb-history-length-strikes-back/

## MySQL Replication 에서 long running transaction의 문제
* slave에서도 예외는 아닙니다.
* 그러므로 slave에서 long running transaction, 혹은 hung transaction이 생기면 예상치 못한 slave delay가 발생할 수 있습니다.

### How to repeat
* Master
- 빈번히 변경되는 sequence 발번 테이블 작성하고 계속 발번한다.

```
create table seq_t1 (seq int auto_increment primary key, no tinyint , unique key no_key (no));
mysqlslap --login-path=local --delimiter=";"  --query="replace into test2.seq_t1(no) values(1);select sleep(0.01)" --concurrency=1 --iterations=100000;
```

* Slave
- 아무생각없이 트랜잭션 열고 아무 테이블이나 access한다.

```
begin;
select * from t1;
```

- 어마어마하게 history length 증가함

```
select name, count from information_schema.INNODB_METRICS where name like '%hist%';
```

- 트랜잭션을 종료하면 사라짐

```
root@localhost:test 11:28:13>begin;
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 11:28:17>select count(1) from ttt;
+----------+
| count(1) |
+----------+
|     1007 |
+----------+
1 row in set (0.00 sec)

root@localhost:test 11:28:25>select name, count from information_schema.INNODB_METRICS where name like '%hist%';
+----------------------+-------+
| name                 | count |
+----------------------+-------+
| trx_rseg_history_len |   111 |
+----------------------+-------+
1 row in set (0.00 sec)

root@localhost:test 11:28:40>select name, count from information_schema.INNODB_METRICS where name like '%hist%';
+----------------------+-------+
| name                 | count |
+----------------------+-------+
| trx_rseg_history_len |  1077 |
+----------------------+-------+
1 row in set (0.00 sec)

root@localhost:test 11:28:41>rollback;
Query OK, 0 rows affected (0.00 sec)

root@localhost:test 11:29:03>select name, count from information_schema.INNODB_METRICS where name like '%hist%';
+----------------------+-------+
| name                 | count |
+----------------------+-------+
| trx_rseg_history_len |     6 |
+----------------------+-------+
1 row in set (0.00 sec)
```

### slave에 트랜잭션이 닫히지 않는다면 slave는 점점 느려지고 slave delay발생한다.
![history_length]({{site_url}}/uploads/slave_delay_and_history_length-hisory_length.png)
![replication_lag]({{site_url}}/uploads/slave_delay_and_history_length-replication_lag.png)

## Conclusion
* Slave에서 transaction을 꼭 써야하나? 
* Slave에서 repeatable_read 를 써야하나? 
* tranasction을 잘 닫자.
* transaction을 짧게 가져가자.
