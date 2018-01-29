---
title: skip-name-resolve 와 unauthenticated user
author: min_cho
created: 2016/04/18 21:35:24
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


# skip-name-resolve 와 unauthenticated user

## 문제발생

MySQL 을 사용하다보면, DNS 서버가 응답을 하지 않음으로서 MySQL 이 커넥션을 빠르게 처리하지 못하고 show processlist 에 많은 수의 'unauthenticated user' 가 발생할 수 있다. 이는 error log 에 아래와 같이 나타나며,


    [Warning] IP address '192.168.74.202' could not be resolved: Temporary failure in name resolution
    [Warning] IP address '192.168.74.202' could not be resolved: Name or service not known


porcesslist에는 다음과 같이 나타날 수 있다.


    +-----+----------------------+----------------------+--------------------+---------+------+-------+------------------+
    | Id  | User                 | Host                 | db                 | Command | Time | State | Info             |
    +-----+----------------------+----------------------+--------------------+---------+------+-------+------------------+
    | 160 | unauthenticated user | 192.168.74.202:52305 | NULL               | Connect | NULL | login | NULL             |
    +-----+----------------------+----------------------+--------------------+---------+------+-------+------------------+


## 원인

MySQL 은 connection 에서 요청이 들어오면, DNS 를 확인하여 해당 host가 무엇인지를 확인한다. 비록 user 생성시에 hostname이 아닌 IP로 유저를 만들었다 할지라도 들어온 IP에 대해 look up을 하고 hostname 을 알아낸 다음 해당 정보를 다시 사용하거나 관리하기 위하여 performance_schema.host_cache 에 저장한다. 이 과정에서 DNS 서버가 문제가 생긴다면, hostname 을 알아오려는 문제때문에 접속시에 시간이 오래걸릴뿐 아니라 커넥션들이 쌓이며 문제가 발생할 수 있다. 만약 user를 단순히 IP 로서 지정하거나 IP 를 통해 접속을 한다면, skip-name-resolve 를 my.cnf 에 주어 오버헤드를 막을 수 있다.

## 문제 재현


    root@localhost:(none) 23:13:43> show global variables like 'skip_name_resolve';
    +-------------------+-------+
    | Variable_name     | Value |
    +-------------------+-------+
    | skip_name_resolve | OFF   |
    +-------------------+-------+
    1 row in set (0.01 sec)


            [root@testvm2 cert]# time /db/5.6/bin/mysql -uau -pau --host="192.168.74.203" -e "select 1"
            Warning: Using a password on the command line interface can be insecure.
            +---+
            | 1 |
            +---+
            | 1 |
            +---+

            real    0m28.071s
            user    0m0.006s
            sys 0m0.013s
            ^^^ 접속시 대략 30초 정도의 시간이 걸렸다. DNS 를 lookup 했지만, 현재 DNS가 빨리 응답을 못하고 있다.


    root@localhost:performance_schema 23:16:22> show processlist;
    +-----+----------------------+----------------------+--------------------+---------+------+-------+------------------+
    | Id  | User                 | Host                 | db                 | Command | Time | State | Info             |
    +-----+----------------------+----------------------+--------------------+---------+------+-------+------------------+
    | 151 | root                 | localhost            | performance_schema | Query   |    0 | init  | show processlist |
    | 160 | unauthenticated user | 192.168.74.202:52305 | NULL               | Connect | NULL | login | NULL             |
    +-----+----------------------+----------------------+--------------------+---------+------+-------+------------------+
    2 rows in set (0.00 sec)
    ^^^ 해당 순간의 processlist 이다.


    root@localhost:performance_schema 23:18:58> select * from performance_schema.host_cacheG
    *************************** 1. row ***************************
                                            IP: 192.168.74.202
                                          HOST: NULL
                                HOST_VALIDATED: NO
                            SUM_CONNECT_ERRORS: 0
                     COUNT_HOST_BLOCKED_ERRORS: 0
               COUNT_NAMEINFO_TRANSIENT_ERRORS: 6
               COUNT_NAMEINFO_PERMANENT_ERRORS: 0
                           COUNT_FORMAT_ERRORS: 0
               COUNT_ADDRINFO_TRANSIENT_ERRORS: 0
               COUNT_ADDRINFO_PERMANENT_ERRORS: 0
                           COUNT_FCRDNS_ERRORS: 0
                         COUNT_HOST_ACL_ERRORS: 0
                   COUNT_NO_AUTH_PLUGIN_ERRORS: 0
                      COUNT_AUTH_PLUGIN_ERRORS: 0
                        COUNT_HANDSHAKE_ERRORS: 0
                       COUNT_PROXY_USER_ERRORS: 0
                   COUNT_PROXY_USER_ACL_ERRORS: 0
                   COUNT_AUTHENTICATION_ERRORS: 0
                              COUNT_SSL_ERRORS: 0
             COUNT_MAX_USER_CONNECTIONS_ERRORS: 0
    COUNT_MAX_USER_CONNECTIONS_PER_HOUR_ERRORS: 0
                 COUNT_DEFAULT_DATABASE_ERRORS: 0
                     COUNT_INIT_CONNECT_ERRORS: 0
                            COUNT_LOCAL_ERRORS: 0
                          COUNT_UNKNOWN_ERRORS: 0
                                    FIRST_SEEN: 2016-04-14 21:37:38
                                     LAST_SEEN: 2016-04-14 23:19:03
                              FIRST_ERROR_SEEN: 2016-04-14 21:37:38
                               LAST_ERROR_SEEN: 2016-04-14 23:19:03
    1 row in set (0.00 sec)
    ^^^ host_cache 테이블에는 IP만 존재할 뿐 HOST는 NULL 로 되어있다. DNS로부터 HOST 값을 정확히 얻어내지 못했다. host_cache 에 HOST_VALIDATED 값이 NO 라면, 다음번 접속시에도 똑같이 느린 현상이 발생한다.
    만약 제대로 HOST 값이 저장된다면, 해당 테이블이 truncate 되기 전까지는 빠른 접속이 가능하다.
        - https://dev.mysql.com/doc/refman/5.6/en/host-cache-table.html


Error log


    [Warning] IP address '192.168.74.202' could not be resolved: Temporary failure in name resolution
    [Warning] IP address '192.168.74.202' could not be resolved: Name or service not known
    ^^^ error log 에 다음과 같이 찍힐 수 있다.


## 해결방법

#### 1\. hosts 파일에 추가

만약 DNS에서 자주 문제가 생긴다면, /etc/hosts 에 해당 서버로 접속하는 서버들에 대해 host를 명시해 줄 수 있다.
```
[root@testvm3 certs]# cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
192.168.74.203  testvm3
192.168.74.202  testvm2

[root@testvm2 cert]# time /db/5.6/bin/mysql -uau -pau --host="192.168.74.203" -e "select 1"
Warning: Using a password on the command line interface can be insecure.
+---+
| 1 |
+---+
| 1 |
+---+

real    0m0.021s
user    0m0.003s
sys 0m0.009s
^^^ DNS를 lookup 하기 전에 /etc/hosts 파일에서 해당 hostname을 가지고 오기 때문에 아주 빠르다.

root@localhost:(none) 23:22:09> select * from performance_schema.host_cacheG
*************************** 1. row ***************************
                                        IP: 192.168.74.202
                                      HOST: testvm2
                            HOST_VALIDATED: YES
                        SUM_CONNECT_ERRORS: 0
                 COUNT_HOST_BLOCKED_ERRORS: 0
           COUNT_NAMEINFO_TRANSIENT_ERRORS: 6
           COUNT_NAMEINFO_PERMANENT_ERRORS: 0
                       COUNT_FORMAT_ERRORS: 0
           COUNT_ADDRINFO_TRANSIENT_ERRORS: 0
           COUNT_ADDRINFO_PERMANENT_ERRORS: 0
                       COUNT_FCRDNS_ERRORS: 0
                     COUNT_HOST_ACL_ERRORS: 0
               COUNT_NO_AUTH_PLUGIN_ERRORS: 0
                  COUNT_AUTH_PLUGIN_ERRORS: 0
                    COUNT_HANDSHAKE_ERRORS: 0
                   COUNT_PROXY_USER_ERRORS: 0
               COUNT_PROXY_USER_ACL_ERRORS: 0
               COUNT_AUTHENTICATION_ERRORS: 0
                          COUNT_SSL_ERRORS: 0
         COUNT_MAX_USER_CONNECTIONS_ERRORS: 0
COUNT_MAX_USER_CONNECTIONS_PER_HOUR_ERRORS: 0
             COUNT_DEFAULT_DATABASE_ERRORS: 0
                 COUNT_INIT_CONNECT_ERRORS: 0
                        COUNT_LOCAL_ERRORS: 0
                      COUNT_UNKNOWN_ERRORS: 0
                                FIRST_SEEN: 2016-04-14 21:37:38
                                 LAST_SEEN: 2016-04-14 23:22:01
                          FIRST_ERROR_SEEN: 2016-04-14 21:37:38
                           LAST_ERROR_SEEN: 2016-04-14 23:19:03
1 row in set (0.00 sec)
^^^ host_cache 의 HOST 에도 testvm2 라고 저장된다.


root@localhost:(none) 23:22:36> show processlist;
+-----+------+---------------+------+---------+------+-------+------------------+
| Id  | User | Host          | db   | Command | Time | State | Info             |
+-----+------+---------------+------+---------+------+-------+------------------+
| 167 | root | localhost     | NULL | Query   |    0 | init  | show processlist |
| 168 | au   | testvm2:52593 | NULL | Sleep   |    9 |       | NULL             |
+-----+------+---------------+------+---------+------+-------+------------------+
2 rows in set (0.00 sec)
```

#### 2. my.cnf 의 [mysqld] 섹션에 skip_name_resolve 를 추가하고 restart

```
root@localhost:(none) 23:24:56> show global variables like 'skip_name_resolve';
+-------------------+-------+
| Variable_name     | Value |
+-------------------+-------+
| skip_name_resolve | ON    |
+-------------------+-------+
1 row in set (0.02 sec)

[root@testvm2 cert]# time /db/5.6/bin/mysql -uau -pau --host="192.168.74.203" -e "select 1"
Warning: Using a password on the command line interface can be insecure.
+---+
| 1 |
+---+
| 1 |
+---+

real    0m0.025s
user    0m0.009s
sys 0m0.010s
^^^ hostname 을 알아오려는 시도를 하지 않기 때문에 빠르다.

root@localhost:(none) 23:25:57> show processlist;
+----+------+----------------------+------+---------+------+-------+------------------+
| Id | User | Host                 | db   | Command | Time | State | Info             |
+----+------+----------------------+------+---------+------+-------+------------------+
|  1 | root | localhost            | NULL | Query   |    0 | init  | show processlist |
| 26 | au   | 192.168.74.202:54301 | NULL | Sleep   |    4 |       | NULL             |
+----+------+----------------------+------+---------+------+-------+------------------+
2 rows in set (0.00 sec)
^^^ 만약 접속하게 된다면, hostname 대신 192.168.74.202 가 나타나는것이 관찰된다.


root@localhost:(none) 23:25:57> select * from performance_schema.host_cacheG
Empty set (0.00 sec)
^^^ 물론 host_cache 테이블에는 아무것도 존재하지 않는다.
```
