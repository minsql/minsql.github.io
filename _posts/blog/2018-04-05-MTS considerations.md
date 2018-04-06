---
title: MTS considerations
author: min_kim
created: 2018/04/05
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


# MTS considerations
Multi-threaded slave(MTS)를 통해서 slave delay를 줄일수 있을까.

-> YES. https://mysqlhighavailability.com/multi-threaded-replication-performance-in-mysql-5-7/
실제로 slave delay가 발생하는 시스템에서 MTS on/off test결과 효과적인 것을 확인 할 수 있었다.

## MTS on 5.7 how to use
```
stop slave sql_thread;
set global SLAVE_PARALLEL_TYPE='LOGICAL_CLOCK';
set global SLAVE_PARALLEL_WORKERS=8;
start slave sql_thread;
```
## MTS known issues
서비스에서 사용하기 전에 지금 알려진 이슈가 있는지, 안정적인 버전이 어떤 것인지 확인해보자.

### Backup
Slave에서 backup을 수행하는 환경이라면, xtrabackup에는 제약이 있다.
 - The --slave-info option requires GTID enabled for a multi-threaded slave.

### GTID and MTS
GTID replication and parallel replication are independent

### Other Bugs
* binlog_group_commit_sync_delay를 0이상으로 설정하는 경우, slave worker가 느려진다. (Bug #21420180)
-> Bug fixed in 5.7.18, set the binlog_group_commit_sync_delay to 0.

* LOGICAL_CLOCK에서 worker가 hang되는 현상. FK validation의 gap lock때문이다. READ COMMITTED에서도 lock문제가 발생한다. (Bug #25082593)
-> Bug fixed in 5.7.18, set the slave to use READ COMMITTED transaction isolation level. 슬레이브는 READ COMMITTED로 사용할 것.

* relay log 가 rotate 될때 Seconds_Behind_Master값이 부정확한 값으로 나온다.(Bug #23532304)
-> Bug fixed in 5.7.18

* Large packet size 에러. (Bug #21280753, Bug #77406)
-> Bug fixed in 5.7.19
