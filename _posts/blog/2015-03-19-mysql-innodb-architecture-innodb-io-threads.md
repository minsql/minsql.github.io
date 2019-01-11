---
title: MySQL InnoDB architecture – InnoDB I/O threads
author: min_kim
created: 2015/03/19 14:01:19
modified:
layout: post
tags: mysql mysql_internal
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---



# MySQL InnoDB architecture – InnoDB I/O threads

## InnoDB I/O threads

> InnoDB는 I/O requests를 처리하기 위해 background threads를 사용한다.

### 관련 파라메터

  * _innodb_read_io_threads_ : default 4이며, 1-64로 조정가능하다.
  * _innodb_write_io_threads_ : default 4이며, 1-64로 조정가능하다.
  * 혹시 innodb_file_io_threads 파라메터를 기억한다면, 이것은 위 두 파라메터로 대체되고 deprecated 되었다.

### 왜 필요한가.

  * high end system에서 원할하게 IO 자원을 사용하기 위해서 제공되는 feature라고 할수 있다.
  * 각각의 background thread는 256개 까지의 pending I/O requests를 처리한다.
  * 특히 innodb_read_io_threads의 주된 목적은 **read-ahead** requests이다.
  * InnoDB는 IO request를 background threads에 가능한한 동등하게 분배한다.
  * 동일한 extent에 대한 read requests는 동일한 thread에게 할당한다.

### 모니터링 & 튜닝

  * `SHOW ENGINE INNODB STATUS` 에서 pending read requests가 64 x _innodb_read_io_threads_이상이라면, _innodb_read_io_threads_를 더 할당하는 것을 고려해볼수 있다.

### read-ahead란??

  * 하나의 extent(64개 pages group)을 모두 buffer pool에 prefetch하는 작업. (asynchronous request임)
  * 이들 페이지도 곧 읽혀질거라는 가정하에 모두 버퍼에 올리는 것이다.
  * 알고리즘
    * **linear** read-ahead technique
      * buffer pool내에 sequentially 읽혀진 pages 개수로 판단.
      * 관련 파라메터 : _innodb_read_ahead_threshold_로 sensitiveness 조정 가능하다. : default 56, (1-64) 조정가능
      * 즉, 만약 하나의 extent내에서 sequentially 읽혀진 pages 개수가 _innodb_read_ahead_threshold_이상이면 다음 extent전체 페이지를 read-ahead 한다.
    * **random** read-ahead technique
      * buffer pool내에 존재하는 pages의 개수로 판단. pages가 sequentially read되어있는지 여부와 무관하게.
      * 만약 한 extent내의 13개의 연속된 pages가 buffer pool에 존재한다면, 해당 extent의 나머지 pages들을 read-ahead한다.
      * 이 알고리즘은 5.5에서 없어졌다가 5.6에서 다시 소개되었다.
      * 관련 파라메터 : _innodb_random_read_ahead_ : default disbled.
    * statistics정보
      * `SHOW ENGINE INNODB STATUS`
      * Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
      * global status variables로 확인

```
    mysql> show global status like 'innodb_buffer_pool_read_ahead%';
    +---------------------------------------+-------+
    | Variable_name                         | Value |
    +---------------------------------------+-------+
    | Innodb_buffer_pool_read_ahead_rnd     | 100   |
    | Innodb_buffer_pool_read_ahead         | 6656  |
    | Innodb_buffer_pool_read_ahead_evicted | 0     |
    +---------------------------------------+-------+
    3 rows in set (0.00 sec)
```
