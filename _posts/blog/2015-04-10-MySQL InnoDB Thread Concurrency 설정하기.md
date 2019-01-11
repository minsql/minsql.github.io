---
title: MySQL InnoDB Thread Concurrency 설정하기
author: min_kim
created: 2015/04/10 09:57:18
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



# MySQL InnoDB Thread Concurrency 설정하기


*  Ref. [Configuring Thread Concurrency for InnoDB](https://dev.mysql.com/doc/refman/5.6/en/innodb-performance-thread_concurrency.html)
* InnoDB는 user transaction의 request를 처리하기 위해서 OS threads를 사용한다. (Transaction은 commit이나 rollback전에 InnoDB에 다수의 request를 발행한다)
* 요즘 OS, Server는 multi-core processor이고, context switching도 효율적으로 처리하고 있기 때문에, 일반적인 workloads에서는 concurrent threads를 제한하지 않아도 무방하다.
* context switching을 최소화시켜야하는 상황인 경우, InnoDB에서 동시 수행 쓰레드 개수를 제한하는 몇가지 방법을 사용할수 있다.

## Notes
* InnoDB가 제한된 개수 이상의 쓰레드 요청을 받은 경우, 새로운 request는 잠시동안 sleep했다가 재시도 하게 된다. 재시도시에도 실행되지 못한 request는 FIFO queue에 들어가고, 추후에 실행된다.
* lock을 대기하는 thread는 동시 수행 쓰레드 개수에 카운트 되지 않는다.


  1. **innodb_thread_concurency**
    * 동시 쓰레드 개수 제한
    * 이 제한에 도달하면, 새로운 thread는 **innodb_thread_sleep_delay**동안 sleep한다.
    * default : 버전별로 다름. MySQL 5.6에서는 0(제한없음)
    * **innodb_thread_concurrency**가 0인경우, **innodb_thread_sleep_delay**는 무시된다.
    * **innodb_thread_concurrency**가 0이상인 경우에도 context switching overhead를 줄이기 위해서 하나의 SQL문에서 여러개의 request를 요청하는 경우, innodb_thread_concurrency의 설정을 준수하지 않고 허용한다. 예를들면 join문 같은 경우 multiple row operations을 수행하게 될텐데 이때 할당받은 "tickets"을 사용하여 overhead없이 반복적으로 쓰레드를 실행할수 있다. 새로운 SQL문이 시작되었을때는 무조건 innodb_thread_concurrency 설정을 확인하고 준수한다. 이 쓰레드가 실행될 권한을 얻게 되면, 부수적인 row operations를 위한 **innodb_concurrency_tickets**에 설정된 개수만큼의 티켓을 얻게 된다. 티켓이 다 소진되면, 이 쓰레드는 다시 innodb_thread_concurrency 를 다시 재확인하고 재실행되거나, 큐잉된다.
  2. **innodb_thread_sleep_delay**
    * InnoDB queue에 들어가기전에 얼마나 sleep할것인가.
    * default : 10000(microseconds)
    * 이전버전에서는 workload에 따라 적정한 value가 무엇인지 시험해봐야했다.
    * MySQL 5.6.3부터는 **innodb_adaptive_max_sleep_delay**를 사용해서 최대값을 지정할 수 있고, **innodb_thread_sleep_delay**는 InnoDB가 자동으로 조정한다.
  3. **innodb_adaptive_max_sleep_delay**
    * 이 값을 0 이상의 값으로 지정하면, InnoDB가 innodb_thread_sleep_delay를 자동으로 조정한다.
    * default : 150000(microseconds)
    * MySQL 5.6.3버전부터 소개됨.
  4. **innodb_concurrency_tickets**
    * 한번 스케줄링된 쓰레드는 설정된 티켓개수만큼 자유롭게 InnoDB를 사용할수 있다.
    * default : 5000(>= 5.6.6), 500(<= 5.6.5)
