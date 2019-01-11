---
title: Linux 의 OOM (Out of memory) killer 로 인한 mysqld shutdown 피하기
author: min_cho
created: 2015/04/21 19:22:22
modified:
layout: post
tags: mysql mysql_tips
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# Linux 의 OOM (Out of memory) killer 로 인한 mysqld shutdown 피하기

> 갑자기 MySQL 이 kill 되는 수가 있다. 이는 여러가지 원인이 있을 수 있다.

### 1\. 해당 원인은 크게 3가지로 나눈다. 여기서 볼것은 oom으로 인해 O/S가 mysqld 를 죽인 경우이다.

  * 3가지는 다음과 같다.
    * 메모리 부족으로 인해 OS 가 kill 을 시킨 경우 (이는 /var/log/message 를 확인함으로서 알 수 있다.)
    * Hardware fault로 stop 된 경우 (이는 /var/log 및의 여러로그를 확인함으로서 알 수 있다.)
    * bug로 인해 restart 된 경우 (이는 mysql error log file 을 확인함으로서 알 수 있다.)
  * 대부분의 경우 mysql 이 restart 되면 /var/log/message 를 확인하지 않는 경우가 많고 갑자기 죽었다고 생각하는데 대부분의 경우 OOM killer에 의해 죽게된다.
    * err 을 살펴보자

```
    150317 11:21:46 mysqld_safe Number of processes running now: 0
    150317 11:21:46 mysqld_safe mysqld restarted
    2015-03-17 11:21:49 14235 [Note] Plugin 'FEDERATED' is disabled.
    2015-03-17 11:21:49 14235 [Note] InnoDB: Using atomics to ref count buffer pool pages
    2015-03-17 11:21:49 14235 [Note] InnoDB: The InnoDB memory heap is disabled
    2015-03-17 11:21:49 14235 [Note] InnoDB: Mutexes and rw_locks use GCC atomic builtins
    2015-03-17 11:21:49 14235 [Note] InnoDB: Compressed tables use zlib 1.2.3
    2015-03-17 11:21:49 14235 [Note] InnoDB: Using Linux native AIO
    2015-03-17 11:21:49 14235 [Note] InnoDB: Using CPU crc32 instructions
    2015-03-17 11:21:49 14235 [Note] InnoDB: Initializing buffer pool, size = 24.0G
    2015-03-17 11:21:51 14235 [Note] InnoDB: Completed initialization of buffer pool
    2015-03-17 11:21:51 14235 [Note] InnoDB: Highest supported file format is Barracuda.
    2015-03-17 11:21:51 14235 [Note] InnoDB: Log scan progressed past the checkpoint lsn 2603553789682
    2015-03-17 11:21:51 14235 [Note] InnoDB: Database was not shutdown normally!
    2015-03-17 11:21:51 14235 [Note] InnoDB: Starting crash recovery.
    2015-03-17 11:21:51 14235 [Note] InnoDB: Reading tablespace information from the .ibd files...
    2015-03-17 11:22:03 14235 [Note] InnoDB: Restoring possible half-written data pages
    2015-03-17 11:22:03 14235 [Note] InnoDB: from the doublewrite buffer...
    InnoDB: Doing recovery: scanned up to log sequence number 2603559032320
    InnoDB: Doing recovery: scanned up to log sequence number 2603564275200
    InnoDB: Doing recovery: scanned up to log sequence number 2603569518080
    --- 죽었다는 메세지 없이 다시 시작되었다.
```

  * system의 log message 를 살펴보자

```
    vi /var/log/message
    ....
    Mar 17 11:21:42 testvm1 kernel: mysqld invoked oom-killer: gfp_mask=0x200da, order=0, oom_adj=0, oom_score_adj=0
    Mar 17 11:21:42 testvm1 kernel: [ pid ]   uid  tgid total_vm      rss cpu oom_adj oom_score_adj name
    Mar 17 11:21:42 testvm1 kernel: [ 4144]   497  4144 10443009  7862020   0       0             0 mysqld
    Mar 17 11:21:42 testvm1 kernel: Out of memory: Kill process 4144 (mysqld) score 963 or sacrifice child
    Mar 17 11:21:42 testvm1 kernel: Killed process 4144, UID 497, (mysqld) total-vm:41772036kB, anon-rss:31443592kB, file-rss:4512kB
    ...
    --- OOM-Killer 에 의해 죽은것이 관찰된다.
```

### 2\. 그렇다면 OOM killer를 피할 수 있는방법을 생각해보자

  * oom_score_adj 의 값을 조정함으로서 해결 할 수 있다.
  * 해당값은 1000 ~ -1000 까지 줄 수 있다. oom_score_adj 에 대한 공식이 궁금하다면 구글링을 해보자.
  * -1000 으로 값을 설정한다면, oom killer 는 해당 process를 죽이지 않을것이다.

```
    cat /proc/[pid]/oom_score_adj
    echo "-1000" > /proc/self/oom_score_adj
```

### 3\. 그렇다면, mysqld에 대한 process id를 띄울때마다 확인해서 해당 작업을 해야하는것일까?

  * mysql 은 mysqld가 시작되기전에 특정 script를 호출할 수 있다.
  * my.cnf의 mysqld_safe section에 mysqld=xxx.sh 를 추가함으로서 mysqld 가 시작될때 해당 script를 실행시킬 수 있다.
  * https://dev.mysql.com/doc/refman/5.6/en/mysqld-safe.html#option_mysqld_safe_mysqld

```
    [root@testvm1 bin]# cat /db/5.6/conf/my.cnf
    ...
    [mysqld_safe]
    mysqld=pre_mysqld_safe.sh
    user=mysql
    ...

    [root@testvm1 bin]# pwd
    /db/5.6/bin
    [root@testvm1 bin]# ls -al pre_mysqld_safe.sh
    -rwxr-xr-x. 1 root root 94 Mar 31 01:38 pre_mysqld_safe.sh
    -- mysqld와 같은 디렉토리에 해당 sh를 놓자.

    [root@testvm1 bin]# cat pre_mysqld_safe.sh
    #!/bin/sh
    echo "-1000" > /proc/self/oom_score_adj
    BIN_DIR=$(dirname "$0")
    exec "$BIN_DIR/mysqld" "$@"


    [root@testvm1 db]# cd /db/5.6
    [root@testvm1 5.6]# ./bin/mysqld_safe --defaults-file=/db/5.6/conf/my.cnf &
    [1] 27626
    [root@testvm1 5.6]# 150331 01:42:07 mysqld_safe Logging to '/data1/5.6/data/mysql.err'.
    150331 01:42:07 mysqld_safe Starting pre_mysqld_safe.sh daemon with databases from /data1/5.6/data
    -- pre_mysqld_safe.sh 로 시작되었음을 알려준다.

    [root@testvm1 5.6]# ps -ef | grep mysql
    root     27626 27539  0 01:42 pts/0    00:00:00 /bin/sh ./bin/mysqld_safe --defaults-file=/db/5.6/conf/my.cnf
    mysql    27986 27626  0 01:42 pts/0    00:00:00 /db/5.6/bin/mysqld --defaults-file=/db/5.6/conf/my.cnf --basedir=/db/5.6 --datadir=/data1/5.6/data --plugin-dir=/db/5.6/lib/plugin --user=mysql --log-error=/data1/5.6/data/mysql.err --pid-file=/data1/5.6/data/testvm1.pid --socket=/tmp/mysql.sock --port=3306
    root     28011 27539  0 01:42 pts/0    00:00:00 grep mysql
    -- mysqld 의 process id 는 27986 이다. user 는 mysql로 뜬것도 확인할 수 있다.

    [root@testvm1 5.6]# cat /proc/27986/oom_score_adj
    -1000
    -- 값이 -1000 이 된것을 알 수 있다.
```

### 4\. 해당 스크립트 이외에 또 어떤것을 쓸 수 있나?

  * ulimit 명령어로 해당 값을 조절할 수 있다. (echo "-1000" > /proc/self/oom_score_adj 대신 아래의 명령어를 사용한다)
    * ulimit -u 10000
    * ulimit -c unlimited
  * NUMA 도 조절가능하다.
    * exec /usr/bin/numactl --interleave all "BIN_DIR/mysqld" "$@"
