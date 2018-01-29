---
title: MySQL open_files_limit 변경하기
author: min_kim
created: 2015/03/27 13:45:14
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


# MySQL open_files_limit 변경하기

## open_files_limit

> mysql이 오픈할수 있는 file(정확히는 file descripter)개수

  * default : 5000, with possible adjustment
    * 가능하면 5000으로 설정하는데 OS limit에 따라 재조정 될수 있다.
    * 내 머신을 확인해보면, 1024로 설정되었다.

```
    mysql> show variables like 'open_files_limit';
    +------------------+-------+
    | Variable_name    | Value |
    +------------------+-------+
    | open_files_limit | 1024  |
    +------------------+-------+
    1 row in set (0.00 sec)
```

  * 왜냐? OS ulimit을 확인하자.
  * 사실 OS limit은 두가지가 있다.

### OS open files limit

  1. Hard limit (-H)
    * 해당 유저에게 허용되는 최대값. root만 수정가능하다.
  2. Soft limit (-S)
    * 해당 유저의 현재 설정된 최대값. user가 직접 변경가능하고, hard limit까지 늘릴 수 있다.

```
    [mysql@testvm1 mysql]$ ulimit -H -n
    4096
    [mysql@testvm1 mysql]$ ulimit -S -n
    1024
```

  * **즉, 내 머신의 open_files_limit은 1024~4096의 값으로 설정할수 있다.**

### OS open files limit 변경하기

  * 현재 세션에서 변경하기
    * ulimit -n 값
    * 다른 세션에는 영향없음
    * 재로긴하면 원복
    * Hard limit은 유저가 변경 불가

```
    [mysql@testvm1 ~]$ ulimit -Sn
    1024
    [mysql@testvm1 ~]$ ulimit -Hn
    4096
    [mysql@testvm1 ~]$ ulimit -n 2048
    [mysql@testvm1 ~]$ ulimit -Hn 65536
    -bash: ulimit: open files: cannot modify limit: Operation not permitted
    [mysql@testvm1 ~]$ ulimit -n
    2048
    [mysql@testvm1 ~]$ exit
    logout
    [root@testvm1 ~]# su - mysql
    [mysql@testvm1 ~]$ ulimit -n
    1024
    [mysql@testvm1 ~]$

```

  * 영구적으로 변경적용하기
    * **/etc/security/limits.conf**

```
    [root@testvm1 ~]# vi /etc/security/limits.conf
    # mysql open-files
    mysql soft nofile 2048
    mysql hard nofile 65536
    [root@testvm1 ~]# su - mysql
    [mysql@testvm1 ~]$ ulimit -Sn
    2048
    [mysql@testvm1 ~]$ ulimit -Hn
    65536
```

### MySQL open_files_limit 변경하기

  1. my.cnf `open_files_limit = 5000`
  2. restart
  3. 확인

```
    mysql> show variables like 'open_files_limit';
    +------------------+-------+
    | Variable_name    | Value |
    +------------------+-------+
    | open_files_limit | 5000  |
    +------------------+-------+
    1 row in set (0.00 sec)
```
