---
title: MySQL architecture - Adaptive Hash Indexes
author: min_kim
created: 2015/04/20 11:04:00
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



# MySQL architecture - Adaptive Hash Indexes

## Adaptive Hase Index(AHI)

> workload와 충분한 buffer pool memory의 적절한 조합하에서, transactional 특성이나 reliability에 위배되지 않는 선에서, InnoDB를 in-memory database처럼 동작하게 한다.

### 1\. 관련 파라메터

  * **innodb_adaptive_hash_index**
    * default : ON
    * Scope : Global
    * dynamic Variable : Yes
    * turn off option : --skip-innodb_adaptive_hash_index
    * disable하면 hash table을 즉시 비운다. hash table을 사용하여 실행중이던 쿼리는 B-tree 인덱스를 직접 access하여 처리된다.

### 2\. 동작

  * MySQL은 search 패턴을 고려하여 index prefix로 hash index를 만든다
    * 인덱스 페이지가 자주 access 되는 경우 필요시 hash index가 생성된다.
    * hash index는 자주 access되는 인덱스 페이지에 대해서만 부분적으로 생성될 수도 있다.
  * 만약 테이블 전체가 메모리에 들어갈수 있는 사이즈인 경우, hash index는 쿼리 속도를 향상시킨다. 인덱스를 pointer와 같이 동작하게 해서 원하는 로우를 바로 다이렉트하게 찾을수 있다.
  * InnoDB는 index search 패턴을 모니터링하는 메커니즘을 가지고 있다. 해당 쿼리가 hash index를 사용하면 이익이라고 판단되면, 자동으로 hash index를 생성한다.
  * workload에 따라, hash index를 통한 속도향상이 hash index를 유지관리하는 비용보다 더 이득일수도 있고 아닐수도 있다.
    * heavy workload하에서는(such as multiple concurrent joins), adaptive has index를 접근할때 획득하는 read/write lock이 contention의 원인이 되기도 한다.
    * LIKE % 쿼리의 경우에도 AHI로 별 이득을 얻지 못한다.
    * AHI가 필요없는 workload하에서는 이를 disable해서 불필요한 overhead를 줄이도록 한다.

### 3\. monitoring

  * adaptive hash index로 인한 contention 확인하는 방법
    * **SHOW ENGINE INNODB STATUS**
    * **SEMAPHORE** 섹션에 RW-latch를 대기하는 thread가 여러개 있다면, adaptive hash indexing을 disable하는 것이 더 좋을 수도 있다.
