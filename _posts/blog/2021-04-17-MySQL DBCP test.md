---
title: MySQL DBCP test
author: min_kim
created: 2021/04/17
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


# MySQL DBCP test
> DBCP reuse policy는 LIFO이다.

Let's test Apache Commons DBCP on MySQL

## Understanding DBCP
이거 보면됨.
https://d2.naver.com/helloworld/5102792

## MySQL and DBCP
- **CP(connection pool)의 개수설정**(initialSize, maxTotal, maxIdle등)은 서비스트래픽에 맞게 설정한다.
- DB instance에 물릴 **총 cp개수**(AP서버대수 x maxTotal)가 너무 과도하지 않은지를 체크한다.
  - 당연히 max_connections 보다 작아야한다.
  - concurrency가 높아졌을때 per session memory x concurrent session count 만큼 리소스가 할당되었을때 문제가 없을지 확인한다.
- **validation check** 를 적절하게 한다.
  - mysql은 wait_timeout설정에 따라 (default)8시간동안 아무작업하지 않는 세션은 kill한다.
  - NW에서도 정책에따라,L4에 따라 TCP timeout설정이 존재한다.
  - validation check주기를 mysql/L4등의 timeout보다 짧게 설정해야 cp의 수명을 제대로 연장할 수 있다.
    - testWhileIdle=true && timeBetweenEvictionRunMillis > 0 && timeBetweenEvictionRunMillis < min(TCP timeout setting, MySQL wait_timeout)

## TEST
### Env
- VSCode
  - java extention pack
  - maven for java
- MySQL
  - local docker image

### Test code
- https://github.com/minsql/dbcp-test
- Example Java code를 기반으로 한것이다. 원본은 https://knpcode.com/java/apache-dbcp-connection-pooling-java-example/


### Test result1
- DBCP사용해서 cp 만들고 하나씩 연결했다 반환했다 테스트해보자.

```
mysql> show processlist;
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
| Id | User            | Host             | db   | Command | Time | State                  | Info             |
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
|  5 | event_scheduler | localhost        | NULL | Daemon  | 3590 | Waiting on empty queue | NULL             |
| 14 | root            | 172.17.0.1:55938 | NULL | Query   |    0 | init                   | show processlist |
| 16 | root            | 172.17.0.1:55946 | test | Sleep   |    8 |                        | NULL             |
| 17 | root            | 172.17.0.1:55950 | test | Sleep   |    7 |                        | NULL             |
| 18 | root            | 172.17.0.1:55954 | test | Sleep   |    7 |                        | NULL             |
| 19 | root            | 172.17.0.1:55958 | test | Sleep   |    7 |                        | NULL             |
| 20 | root            | 172.17.0.1:55962 | test | Sleep   |    0 |                        | NULL             |
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
7 rows in set (0.00 sec)

mysql> show processlist;
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
| Id | User            | Host             | db   | Command | Time | State                  | Info             |
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
|  5 | event_scheduler | localhost        | NULL | Daemon  | 3601 | Waiting on empty queue | NULL             |
| 14 | root            | 172.17.0.1:55938 | NULL | Query   |    0 | init                   | show processlist |
| 16 | root            | 172.17.0.1:55946 | test | Sleep   |   19 |                        | NULL             |
| 17 | root            | 172.17.0.1:55950 | test | Sleep   |   18 |                        | NULL             |
| 18 | root            | 172.17.0.1:55954 | test | Sleep   |   18 |                        | NULL             |
| 19 | root            | 172.17.0.1:55958 | test | Sleep   |   18 |                        | NULL             |
| 20 | root            | 172.17.0.1:55962 | test | Sleep   |    1 |                        | NULL             |
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
7 rows in set (0.00 sec)
```

- 5개 잘 만들어져서 유지된다. 그런데.. 하나만 쓴다 자꾸... 왜 그럴까?

```
no: 0
pid: 20
no: 1
pid: 20
no: 2
...
no: 25
pid: 20
```
^^^ pid찍어보니 진짜 하나만 씀..

### configuration을 잘 읽어본다.
- reuse policy가 뭔지.. 어디에 써있나.
- https://commons.apache.org/proper/commons-dbcp/configuration.html

- 진짜 잘 안보이지만, 써있다.
![dbcp_lifo]({{site_url}}/uploads/dbcp_lifo.png)

- 즉, **last in first out**, 방금썼던애를 쓰라고 준다는 것임.

> 그러니 validation check 가 중요하다.

- 썼던애만 쓰니, cp개수보다 concurrency가 낮으면, 계속 안쓰이고 연결만 되어있는 세션이 남게 된다.
- 그러다 갑자기 부하가 높아져서 만들어놓은 maxTotal만큼 connection을 쓰고 싶어지면, 사실 그 세션은 사용할 수 없는 상태일수도 있다.
- retry 로직이 잘되어있으면 이것도 방어할 수 있겠지만, 그렇지 않으면 누가 끊었나, 설정이 뭐가 잘못인가 갑자기 보려면 진땀을 뺄수 있다.


### Test result2 : basicDS.setLifo(false);
- fifo로 바꾸고 테스트해보자.

```
mysql> show processlist;
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
| Id | User            | Host             | db   | Command | Time | State                  | Info             |
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
|  5 | event_scheduler | localhost        | NULL | Daemon  | 4458 | Waiting on empty queue | NULL             |
| 14 | root            | 172.17.0.1:55938 | NULL | Query   |    0 | init                   | show processlist |
| 28 | root            | 172.17.0.1:55994 | test | Sleep   |    4 |                        | NULL             |
| 29 | root            | 172.17.0.1:55998 | test | Sleep   |    3 |                        | NULL             |
| 30 | root            | 172.17.0.1:56002 | test | Sleep   |    2 |                        | NULL             |
| 31 | root            | 172.17.0.1:56006 | test | Sleep   |    1 |                        | NULL             |
| 32 | root            | 172.17.0.1:56010 | test | Sleep   |    0 |                        | NULL             |
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
7 rows in set (0.00 sec)

mysql> show processlist;
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
| Id | User            | Host             | db   | Command | Time | State                  | Info             |
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
|  5 | event_scheduler | localhost        | NULL | Daemon  | 4459 | Waiting on empty queue | NULL             |
| 14 | root            | 172.17.0.1:55938 | NULL | Query   |    0 | init                   | show processlist |
| 28 | root            | 172.17.0.1:55994 | test | Sleep   |    5 |                        | NULL             |
| 29 | root            | 172.17.0.1:55998 | test | Sleep   |    4 |                        | NULL             |
| 30 | root            | 172.17.0.1:56002 | test | Sleep   |    3 |                        | NULL             |
| 31 | root            | 172.17.0.1:56006 | test | Sleep   |    2 |                        | NULL             |
| 32 | root            | 172.17.0.1:56010 | test | Sleep   |    1 |                        | NULL             |
+----+-----------------+------------------+------+---------+------+------------------------+------------------+
7 rows in set (0.00 sec)
```

- 하나씩 돌아가면서 쓰는 것이 보인다.

```
no: 0
pid: 28
no: 1
pid: 29
no: 2
pid: 30
no: 3
pid: 31
no: 4
pid: 32
no: 5
pid: 28
no: 6
pid: 29
no: 7
pid: 30
```

## Conclusion
- 결론 : 다시한번 dbcp를 mechanism을 이해할 수 있었다. cp 수명관리 잘하자.
