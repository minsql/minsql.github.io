---
title: MySQL sandbox 설치와 이용방법
author: min_cho
created: 2018/01/22 14:54:50
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
# MySQL sandbox 설치와 이용방법

### 개요

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

### 설치

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
```
