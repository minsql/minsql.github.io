---
title: MySQL sandbox 설치와 이용방법
author: min_cho
created: 2018/01/22 14:54:50
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
# MySQL sandbox 설치와 이용방법

## 개요

  * MySQL 을 이용하여 여러 TEST 를 진행하는 경우, 설치 및 설정하는데 많은 시간이 소요된다. 이러한 수고를 줄이고자 MySQL sandbox (한국에는 놀이터에 없는것 같지만, 외국에는 모래를 가지고 뭔가를 만들고 부셔버리는 모래놀이장이 있는데 이것이 sandbox 라고 불린다) 라는것이 존재하고 아주 유용하다.

  * 해당 sandbox 를 이용하면 손쉽게 다음과 같은일을 진행할 수 있다.
    * instance 통제
    * $HOME/sandboxes 에서 현재 설치된 모든 instance 들을 통제할 수 있다.
    * $HOME/sandboxes/msb_$version 혹은 $HOME/sandboxes/$rsandbox_mysql-$verstion 으로 들어가서 각 instance 를 개별적으로 통제할 수 있다.

    * instance 구성
      * single instance 구성
      * 여러개의 single instance 구성
      * 여러가지 replication 구성

  * 자세한 사용법은 아래를 참고하자. <https://github.com/datacharmer/mysql-sandbox>

## 설치

설치는 간단하다. 소스를 github 에서 받아 설치해주면 된다.
* 아래의 명령어는 sandbox 를 설치하기 위한 명령어이다.


```    
    shell# wget https://github.com/datacharmer/mysql-sandbox/archive/master.zip
    shell# unzip master.zip
    shell# cd mysql-sandbox-master
    shell# perl Makefile.PL

    shell# make
    shell# make test
    shell# make install
```

  * log


```    
[root@localhost sandbox]# wget https://github.com/datacharmer/mysql-sandbox/archive/master.zip
--2017-07-20 04:16:45--  https://github.com/datacharmer/mysql-sandbox/archive/master.zip
Resolving jp-proxy.jp.oracle.com (jp-proxy.jp.oracle.com)... 10.188.53.53
Connecting to jp-proxy.jp.oracle.com (jp-proxy.jp.oracle.com)|10.188.53.53|:80... connected.
Proxy request sent, awaiting response... 302 Found
Location: https://codeload.github.com/datacharmer/mysql-sandbox/zip/master [following]
--2017-07-20 04:16:46--  https://codeload.github.com/datacharmer/mysql-sandbox/zip/master
Connecting to jp-proxy.jp.oracle.com (jp-proxy.jp.oracle.com)|10.188.53.53|:80... connected.
Proxy request sent, awaiting response... 200 OK
Length: unspecified [application/zip]
Saving to: ‘master.zip’

    [  <=>                                                                                                                                   ] 167,877      414KB/s   in 0.4s   

2017-07-20 04:16:48 (414 KB/s) - ‘master.zip’ saved [167877]

[root@localhost sandbox]# ll
total 288
-rw-r--r--. 1 root root  167877 Jul 20 04:16 master.zip
drwxr-xr-x. 6  501 games    197 Jul 20 03:39 MySQL-Sandbox-3.0.66
-rw-r--r--. 1 root root  124076 Aug  8  2015 MySQL-Sandbox-3.0.66.tar.gz

[root@localhost sandbox]# unzip master.zip
Archive:  master.zip
a3d6e43f5c5f8baee3794c98a157ee0c8fe8a2a4
   creating: mysql-sandbox-master/
  inflating: mysql-sandbox-master/Changelog  
  inflating: mysql-sandbox-master/LICENSE  
  inflating: mysql-sandbox-master/MANIFEST  
  inflating: mysql-sandbox-master/Makefile.PL  
  inflating: mysql-sandbox-master/README.md  
   creating: mysql-sandbox-master/bin/
  inflating: mysql-sandbox-master/bin/deploy_to_remote_sandboxes.sh  
  inflating: mysql-sandbox-master/bin/low_level_make_sandbox  
  inflating: mysql-sandbox-master/bin/make_multiple_custom_sandbox  
  inflating: mysql-sandbox-master/bin/make_multiple_sandbox  
  inflating: mysql-sandbox-master/bin/make_replication_sandbox  
  inflating: mysql-sandbox-master/bin/make_sandbox  
  inflating: mysql-sandbox-master/bin/make_sandbox_from_installed  
  inflating: mysql-sandbox-master/bin/make_sandbox_from_source  
  inflating: mysql-sandbox-master/bin/make_sandbox_from_url  
  inflating: mysql-sandbox-master/bin/msandbox  
  inflating: mysql-sandbox-master/bin/msb  
  inflating: mysql-sandbox-master/bin/sbtool  
  inflating: mysql-sandbox-master/bin/test_sandbox  
   creating: mysql-sandbox-master/lib/
   creating: mysql-sandbox-master/lib/MySQL/
  inflating: mysql-sandbox-master/lib/MySQL/Sandbox.pm  
   creating: mysql-sandbox-master/lib/MySQL/Sandbox/
  inflating: mysql-sandbox-master/lib/MySQL/Sandbox/Recipes.pm  
  inflating: mysql-sandbox-master/lib/MySQL/Sandbox/Scripts.pm  
  inflating: mysql-sandbox-master/mkdist.sh  
  inflating: mysql-sandbox-master/repo_list.pl  
   creating: mysql-sandbox-master/t/
  inflating: mysql-sandbox-master/t/01_modules.t  
  inflating: mysql-sandbox-master/t/02_test_binaries.t  
  inflating: mysql-sandbox-master/t/03_test_sandbox.t  
  inflating: mysql-sandbox-master/t/04_test_sbtool.t  
  inflating: mysql-sandbox-master/t/05_test_smoke.t  
  inflating: mysql-sandbox-master/t/06_test_user_defined.t  
  inflating: mysql-sandbox-master/t/07_test_user_defined.t  
  inflating: mysql-sandbox-master/t/08_test_single_port_checking.t  
  inflating: mysql-sandbox-master/t/09_test_multiple_port_checking.t  
  inflating: mysql-sandbox-master/t/10_check_start_restart.t  
  inflating: mysql-sandbox-master/t/11_replication_parameters.t  
  inflating: mysql-sandbox-master/t/12_custom_user_pwd.t  
  inflating: mysql-sandbox-master/t/13_innodb_plugin_install.t  
  inflating: mysql-sandbox-master/t/14_semi_synch_plugin_install.t  
  inflating: mysql-sandbox-master/t/15_user_privileges.t  
  inflating: mysql-sandbox-master/t/16_replication_options.t  
  inflating: mysql-sandbox-master/t/17_replication_flow.t  
  inflating: mysql-sandbox-master/t/18_force_creation.t  
  inflating: mysql-sandbox-master/t/19_replication_gtid.t  
  inflating: mysql-sandbox-master/t/20_add_option.t  
  inflating: mysql-sandbox-master/t/21_replication_gtid_option.t  
  inflating: mysql-sandbox-master/t/22_init_exec_sql.t  
  inflating: mysql-sandbox-master/t/23_mysqlx_plugin.t  
  inflating: mysql-sandbox-master/t/24_dd_expose.t  
  inflating: mysql-sandbox-master/t/Test_Helper.pm  
  inflating: mysql-sandbox-master/t/add_option.sb.pl  
  inflating: mysql-sandbox-master/t/check_replication.sb  
  inflating: mysql-sandbox-master/t/check_single_server.sb  
  inflating: mysql-sandbox-master/t/custom_user_pwd.sb.pl  
  inflating: mysql-sandbox-master/t/dd_expose.sb.pl  
  inflating: mysql-sandbox-master/t/force.sb.pl  
  inflating: mysql-sandbox-master/t/group_port_checking.sb.pl  
  inflating: mysql-sandbox-master/t/init_exec_sql.sb.pl  
  inflating: mysql-sandbox-master/t/innodb_plugin_install.sb.pl  
  inflating: mysql-sandbox-master/t/mysqlx_plugin.sb.pl  
  inflating: mysql-sandbox-master/t/replication_flow.sh  
  inflating: mysql-sandbox-master/t/replication_gtid.sb.pl  
  inflating: mysql-sandbox-master/t/replication_options.sb.pl  
  inflating: mysql-sandbox-master/t/replication_parameters.sb.pl  
  inflating: mysql-sandbox-master/t/semi_synch_plugin_install.sb.pl  
  inflating: mysql-sandbox-master/t/single_port_checking.sb.pl  
  inflating: mysql-sandbox-master/t/start_restart_arguments.sb.pl  
  inflating: mysql-sandbox-master/t/test_init_exec.sh  
  inflating: mysql-sandbox-master/t/user_privileges.sb.pl  
  inflating: mysql-sandbox-master/test_all_latest.sh  
[root@localhost sandbox]# ll
total 288
-rw-r--r--. 1 root root  167877 Jul 20 04:16 master.zip
drwxr-xr-x. 6  501 games    197 Jul 20 03:39 MySQL-Sandbox-3.0.66
-rw-r--r--. 1 root root  124076 Aug  8  2015 MySQL-Sandbox-3.0.66.tar.gz
drwxr-xr-x. 5 root root     184 Jul 18 14:24 mysql-sandbox-master

[root@localhost sandbox]# cd mysql-sandbox-master

[root@localhost mysql-sandbox-master]# ll
total 120
drwxr-xr-x. 2 root root  4096 Jul 18 14:24 bin
-rw-r--r--. 1 root root 41076 Jul 18 14:24 Changelog
drwxr-xr-x. 3 root root    19 Jul 18 14:24 lib
-rw-r--r--. 1 root root 11358 Jul 18 14:24 LICENSE
-rw-r--r--. 1 root root  2927 Jul 18 14:24 Makefile.PL
-rw-r--r--. 1 root root  1498 Jul 18 14:24 MANIFEST
-rwxr-xr-x. 1 root root  1659 Jul 18 14:24 mkdist.sh
-rw-r--r--. 1 root root 33848 Jul 18 14:24 README.md
-rw-r--r--. 1 root root  1011 Jul 18 14:24 repo_list.pl
drwxr-xr-x. 2 root root  4096 Jul 18 14:24 t
-rwxr-xr-x. 1 root root   831 Jul 18 14:24 test_all_latest.sh


[root@localhost mysql-sandbox-master]# perl Makefile.PL 
Checking if your kit is complete...
Looks good
Writing Makefile for MySQL::Sandbox
[root@localhost mysql-sandbox-master]# make
cp lib/MySQL/Sandbox/Scripts.pm blib/lib/MySQL/Sandbox/Scripts.pm
cp lib/MySQL/Sandbox/Recipes.pm blib/lib/MySQL/Sandbox/Recipes.pm
cp repo_list.pl blib/lib/MySQL/repo_list.pl
cp lib/MySQL/Sandbox.pm blib/lib/MySQL/Sandbox.pm
cp bin/deploy_to_remote_sandboxes.sh blib/script/deploy_to_remote_sandboxes.sh
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/deploy_to_remote_sandboxes.sh
cp bin/msandbox blib/script/msandbox
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/msandbox
cp bin/make_replication_sandbox blib/script/make_replication_sandbox
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/make_replication_sandbox
cp bin/make_multiple_sandbox blib/script/make_multiple_sandbox
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/make_multiple_sandbox
cp bin/make_sandbox_from_url blib/script/make_sandbox_from_url
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/make_sandbox_from_url
cp bin/test_sandbox blib/script/test_sandbox
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/test_sandbox
cp bin/make_sandbox blib/script/make_sandbox
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/make_sandbox
cp bin/make_sandbox_from_installed blib/script/make_sandbox_from_installed
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/make_sandbox_from_installed
cp bin/low_level_make_sandbox blib/script/low_level_make_sandbox
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/low_level_make_sandbox
cp bin/msb blib/script/msb
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/msb
cp bin/make_multiple_custom_sandbox blib/script/make_multiple_custom_sandbox
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/make_multiple_custom_sandbox
cp bin/sbtool blib/script/sbtool
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/sbtool
cp bin/make_sandbox_from_source blib/script/make_sandbox_from_source
/usr/bin/perl -MExtUtils::MY -e 'MY-&gt;fixin(shift)' -- blib/script/make_sandbox_from_source
Manifying blib/man3/MySQL::Sandbox::Scripts.3pm
Manifying blib/man3/MySQL::Sandbox::Recipes.3pm
Manifying blib/man3/MySQL::Sandbox.3pm

[root@localhost mysql-sandbox-master]# make test
PERL_DL_NONLAZY=1 /usr/bin/perl "-MExtUtils::Command::MM" "-e" "test_harness(0, 'blib/lib', 'blib/arch')" t/*.t
t/01_modules.t ...................... ok   
t/02_test_binaries.t ................ ok   
t/03_test_sandbox.t ................. ok   
t/04_test_sbtool.t .................. ok   
t/05_test_smoke.t ................... ok   
t/06_test_user_defined.t ............ ok   
t/07_test_user_defined.t ............ ok   
t/08_test_single_port_checking.t .... ok   
t/09_test_multiple_port_checking.t .. ok   
t/10_check_start_restart.t .......... ok   
t/11_replication_parameters.t ....... ok   
t/12_custom_user_pwd.t .............. ok   
t/13_innodb_plugin_install.t ........ ok   
t/14_semi_synch_plugin_install.t .... ok   
t/15_user_privileges.t .............. ok   
t/16_replication_options.t .......... ok   
t/17_replication_flow.t ............. ok   
t/18_force_creation.t ............... ok   
t/19_replication_gtid.t ............. ok   
t/20_add_option.t ................... ok   
t/21_replication_gtid_option.t ...... ok   
t/22_init_exec_sql.t ................ ok   
t/23_mysqlx_plugin.t ................ ok   
t/24_dd_expose.t .................... ok   
All tests successful.
Files=24, Tests=26,  1 wallclock secs ( 0.07 usr  0.02 sys +  0.75 cusr  0.09 csys =  0.93 CPU)
Result: PASS

[root@localhost mysql-sandbox-master]# make install
Installing /usr/local/share/perl5/MySQL/repo_list.pl
Installing /usr/local/share/perl5/MySQL/Sandbox.pm
Installing /usr/local/share/perl5/MySQL/Sandbox/Scripts.pm
Installing /usr/local/share/perl5/MySQL/Sandbox/Recipes.pm
Installing /usr/local/share/man/man3/MySQL::Sandbox::Scripts.3pm
Installing /usr/local/share/man/man3/MySQL::Sandbox::Recipes.3pm
Installing /usr/local/share/man/man3/MySQL::Sandbox.3pm
Installing /usr/local/bin/deploy_to_remote_sandboxes.sh
Installing /usr/local/bin/msandbox
Installing /usr/local/bin/make_replication_sandbox
Installing /usr/local/bin/make_multiple_sandbox
Installing /usr/local/bin/make_sandbox_from_url
Installing /usr/local/bin/test_sandbox
Installing /usr/local/bin/make_sandbox
Installing /usr/local/bin/make_sandbox_from_installed
Installing /usr/local/bin/low_level_make_sandbox
Installing /usr/local/bin/msb
Installing /usr/local/bin/make_multiple_custom_sandbox
Installing /usr/local/bin/sbtool
Installing /usr/local/bin/make_sandbox_from_source
Appending installation info to /usr/lib64/perl5/perllocal.pod
```

## MySQL binary 다운로드
- 설치가 완료되었다면, 필요한 MySQL generic tar 본을 받도록 하자. (MySQL sandbox 는 해당 generic tar 에 대해 압축을 풀고 해당 binaries 를 이용하여 MySQL 을 구성한다.)
- log

```
[root@localhost MySQL_bianries]# wget https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-5.7.18-linux-glibc2.5-x86_64.tar.gz
[root@localhost MySQL_bianries]# wget https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-5.7.19-linux-glibc2.12-x86_64.tar.gz
[root@localhost MySQL_bianries]# wget https://dev.mysql.com/get/Downloads/MySQL-5.6/mysql-5.6.37-linux-glibc2.12-x86_64.tar.gz
[root@localhost MySQL_bianries]# wget https://dev.mysql.com/get/Downloads/MySQL-5.5/mysql-5.5.57-linux-glibc2.12-x86_64.tar.gz
```

## SANDBOX 로 설치
- sandbox 를 이용하여, MySQL 을 설치해보자. (SANDBOX 는 root 가 아닌 유저로 올리게 설정되어 있지만, 테스트 용도이니 "export SANDBOX_AS_ROOT=1" 를 통해 ROOT 로 사용할 수 있도록 설정할 수 있다.)
- 아래는 5.7.18 과 5.7.19 를 동시에 설치하는 예제이다.

```
[root@localhost MySQL_bianries]# export SANDBOX_AS_ROOT=1
[root@localhost MySQL_bianries]# make_sandbox /MySQL_bianries/mysql-5.7.19-linux-glibc2.12-x86_64.tar.gz 
.... sandbox server started

[root@localhost MySQL_bianries]# make_sandbox /MySQL_bianries/mysql-5.7.18-linux-glibc2.5-x86_64.tar.gz 
.... sandbox server started

unpacking /MySQL_bianries/mysql-5.7.18-linux-glibc2.5-x86_64.tar.gz


[root@localhost MySQL_bianries]# ps -ef | grep mysql
root     23972     1  0 04:02 pts/2    00:00:00 /bin/sh /MySQL_bianries/5.7.19/bin/mysqld_safe --defaults-file=/root/sandboxes/msb_5_7_19/my.sandbox.cnf
root     24171 23972  0 04:02 pts/2    00:00:01 /MySQL_bianries/5.7.19/bin/mysqld --defaults-file=/root/sandboxes/msb_5_7_19/my.sandbox.cnf --basedir=/MySQL_bianries/5.7.19 --datadir=/root/sandboxes/msb_5_7_19/data --plugin-dir=/MySQL_bianries/5.7.19/lib/plugin --user=root --log-error=msandbox.err --pid-file=/root/sandboxes/msb_5_7_19/data/mysql_sandbox5719.pid --socket=/tmp/mysql_sandbox5719.sock --port=5719
root     24444     1  0 04:25 pts/2    00:00:00 /bin/sh bin/mysqld_safe --defaults-file=/root/sandboxes/msb_5_7_18/my.sandbox.cnf
root     24629 24444  3 04:25 pts/2    00:00:00 /MySQL_bianries/5.7.18/bin/mysqld --defaults-file=/root/sandboxes/msb_5_7_18/my.sandbox.cnf --basedir=/MySQL_bianries/5.7.18 --datadir=/root/sandboxes/msb_5_7_18/data --plugin-dir=/MySQL_bianries/5.7.18/lib/plugin --user=root --log-error=/root/sandboxes/msb_5_7_18/data/msandbox.err --pid-file=/root/sandboxes/msb_5_7_18/data/mysql_sandbox5718.pid --socket=/tmp/mysql_sandbox5718.sock --port=5718
root     24682 23578  0 04:25 pts/2    00:00:00 grep --color=auto mysql



[root@localhost msb_5_7_18]# pwd
/root/sandboxes/msb_5_7_18


[root@localhost msb_5_7_18]# ./use
Welcome to the MySQL monitor.  Commands end with ; or g.
Your MySQL connection id is 5
Server version: 5.7.18 MySQL Community Server (GPL)

Copyright (c) 2000, 2017, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or 'h' for help. Type 'c' to clear the current input statement.

mysql [localhost] {msandbox} ((none)) &gt; show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
| test               |
+--------------------+
5 rows in set (0.01 sec)
```

- 아래는 5.7.19 이용하는 replication 을 구성을 진행하는 예제이다.
  - default 로 master 1대와 slave 2대로 구성되며, 이는 조절될 수 있다.
  - enable_gtid 이라는 스크립트를 통해, gtid 를 통한 replication 구성을 만들 수 있다.
  - 위의 스크립트 외에도 initialize_slaves 혹은 check_slaves 로, 초기화 및 체크를 진행할 수 있다.
  
```
[root@localhost sandboxes]# make_replication_sandbox /MySQL_bianries/mysql-5.7.19-linux-glibc2.12-x86_64.tar.gz 
installing and starting master
installing slave 1
installing slave 2
starting slave 1
... sandbox server started
starting slave 2
.... sandbox server started
initializing slave 1
initializing slave 2
replication directory installed in $HOME/sandboxes/rsandbox_mysql-5_7_19

[root@localhost rsandbox_mysql-5_7_19]# pwd
/root/sandboxes/rsandbox_mysql-5_7_19
[root@localhost rsandbox_mysql-5_7_19]# ./m
Welcome to the MySQL monitor.  Commands end with ; or g.
Your MySQL connection id is 7
Server version: 5.7.19-log MySQL Community Server (GPL)

Copyright (c) 2000, 2017, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or 'h' for help. Type 'c' to clear the current input statement.

master [localhost] {msandbox} ((none)) &gt; show master status;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000001 |     4823 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
1 row in set (0.00 sec)

master [localhost] {msandbox} ((none)) &gt; exit
Bye
[root@localhost rsandbox_mysql-5_7_19]# ./s1
Welcome to the MySQL monitor.  Commands end with ; or g.
Your MySQL connection id is 7
Server version: 5.7.19-log MySQL Community Server (GPL)

Copyright (c) 2000, 2017, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or 'h' for help. Type 'c' to clear the current input statement.

slave1 [localhost] {msandbox} ((none)) &gt; show slave statusG
    *************************** 1. row ***************************
               Slave_IO_State: Waiting for master to send event
              Master_Host: 127.0.0.1
              Master_User: rsandbox
              Master_Port: 20594
            Connect_Retry: 60
              Master_Log_File: mysql-bin.000001
          Read_Master_Log_Pos: 4823
               Relay_Log_File: mysql-relay.000002
            Relay_Log_Pos: 5036
        Relay_Master_Log_File: mysql-bin.000001
             Slave_IO_Running: Yes
            Slave_SQL_Running: Yes
              Replicate_Do_DB: 
          Replicate_Ignore_DB: 
           Replicate_Do_Table: 
           Replicate_Ignore_Table: 
          Replicate_Wild_Do_Table: 
      Replicate_Wild_Ignore_Table: 
               Last_Errno: 0
               Last_Error: 
             Skip_Counter: 0
          Exec_Master_Log_Pos: 4823
              Relay_Log_Space: 5239
              Until_Condition: None
               Until_Log_File: 
            Until_Log_Pos: 0
           Master_SSL_Allowed: No
           Master_SSL_CA_File: 
           Master_SSL_CA_Path: 
              Master_SSL_Cert: 
            Master_SSL_Cipher: 
               Master_SSL_Key: 
        Seconds_Behind_Master: 0
    Master_SSL_Verify_Server_Cert: No
            Last_IO_Errno: 0
            Last_IO_Error: 
               Last_SQL_Errno: 0
               Last_SQL_Error: 
      Replicate_Ignore_Server_Ids: 
             Master_Server_Id: 1
              Master_UUID: 00020594-1111-1111-1111-111111111111
             Master_Info_File: /root/sandboxes/rsandbox_mysql-5_7_19/node1/data/master.info
                SQL_Delay: 0
          SQL_Remaining_Delay: NULL
          Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
           Master_Retry_Count: 86400
              Master_Bind: 
          Last_IO_Error_Timestamp: 
         Last_SQL_Error_Timestamp: 
               Master_SSL_Crl: 
           Master_SSL_Crlpath: 
           Retrieved_Gtid_Set: 
            Executed_Gtid_Set: 
            Auto_Position: 0
         Replicate_Rewrite_DB: 
             Channel_Name: 
           Master_TLS_Version: 
    1 row in set (0.00 sec)
```