---
title: Error Table "mysql"."innodb_table_stats" not found 는 왜 발생하는가?
author: min_cho
created: 2016/04/06 21:07:19
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
# "Error: Table "mysql"."innodb_table_stats" not found" 는 왜 발생하는가?

## 발생현상


    2016-03-29 09:37:03 7f6c34610700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 09:37:26 7f6c34610700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 09:37:26 7f6c34610700 InnoDB: Error: Fetch of persistent statistics requested for table "aaa"."asaa" but the required system tables mysql.innodb_table_stats and mysql.innodb_index_stats are not present or have unexpected structure. Using transient stats instead.
    2016-03-29 09:37:38 7f6c35a53700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 09:37:38 7f6c35a53700 InnoDB: Recalculation of persistent statistics requested for table "aaa"."asaa" but the required persistent statistics storage is not present or is corrupted. Using transient stats instead.
    2016-03-29 09:38:26 3007 [Warning] InnoDB: Cannot open table mysql/innodb_index_stats from the internal data dictionary of InnoDB though the .frm file for the table exists. See http://dev.mysql.com/doc/refman/5.6/en/innodb-troubleshooting.html for how you can resolve the problem.
    2016-03-29 09:38:42 3007 [Warning] InnoDB: Cannot open table mysql/innodb_index_stats from the internal data dictionary of InnoDB though the .frm file for the table exists. See http://dev.mysql.com/doc/refman/5.6/en/innodb-troubleshooting.html for how you can resolve the problem.
    ....
    2016-03-29 18:00:21 7f263f7fa700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 18:00:21 7f263f7fa700 InnoDB: Error: Fetch of persistent statistics requested for table "aaa"."members_i" /* Partition "n1" */ but the required system tables mysql.innodb_table_stats and mysql.innodb_index_stats are not present or have unexpected structure. Using transient stats instead.
    2016-03-29 18:00:21 7f263f7fa700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 18:00:21 7f263f7fa700 InnoDB: Error: Fetch of persistent statistics requested for table "aaa"."members_i" /* Partition "p1" */ but the required system tables mysql.innodb_table_stats and mysql.innodb_index_stats are not present or have unexpected structure. Using transient stats instead.
    2016-03-29 18:00:21 7f263f7fa700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 18:00:21 7f263f7fa700 InnoDB: Error: Fetch of persistent statistics requested for table "aaa"."members_i" /* Partition "p2" */ but the required system tables mysql.innodb_table_stats and mysql.innodb_index_stats are not present or have unexpected structure. Using transient stats instead.
    2016-03-29 18:00:21 7f263f7fa700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 18:00:21 7f263f7fa700 InnoDB: Error: Fetch of persistent statistics requested for table "aaa"."members_i" /* Partition "p3" */ but the required system tables mysql.innodb_table_stats and mysql.innodb_index_stats are not present or have unexpected structure. Using transient stats instead.
    2016-03-29 18:00:31 7f26361fc700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 18:00:31 7f26361fc700 InnoDB: Recalculation of persistent statistics requested for table "aaa"."members_i" /* Partition "p2" */ but the required persistent statistics storage is not present or is corrupted. Using transient stats instead.
    2016-03-29 18:00:41 7f26361fc700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 18:00:41 7f26361fc700 InnoDB: Recalculation of persistent statistics requested for table "aaa"."members_i" /* Partition "p3" */ but the required persistent statistics storage is not present or is corrupted. Using transient stats instead.
    2016-03-29 18:01:22 7f26361fc700 InnoDB: Error: Table "mysql"."innodb_table_stats" not found.
    2016-03-29 18:01:22 7f26361fc700 InnoDB: Recalculation of persistent statistics requested for table "aaa"."members_i" /* Partition "p3" */ but the required persistent statistics storage is not present or is corrupted. Using transient stats instead.
    2016-03-29 18:01:32 7f26361fc700 InnoDB: Error: Table "mysql"."innodb_table_stats" not foun


## 왜 발생하는가?

  * MySQL 5.6 부터 mysql database 에 통계정보나 slave 관련 정보를 저장하기 위해 새로운 InnoDB table 5개가 추가 되었다. (innodb_index_stats, innodb_table_stats, slave_master_info, slave_relay_log_info, slave_worker_info)
    * <https://dev.mysql.com/doc/refman/5.6/en/innodb-persistent-stats.html>
  * 또한 모든 InnoDB 관련 meta 정보는 ibdata1 (system tablespace) 에 저장된다.

  * 하지만,
    * 5.5 의 data를 5.6 upgrade 한 후, mysql_upgrade를 해주지 않은 경우 이 경우, mysql database 의 구조는 5.5 로 되돌아 간다. 반드시 mysql_upgrade 를 진행해 주어야 한다.
      * <http://dev.mysql.com/doc/refman/5.7/en/mysql-upgrade.html>
    * ibdata1 을 새롭게 구성하는 경우 innodb_file_per_table 를 사용함에도 ibdata1 이 지속적으로 커진 경우 ( undo 로그저장을 위해 지속적으로 커질 수 있음), ibdata1의 사이즈를 줄이고자 MySQL을 중지하고 ibdata1 과 ib_logfile 들을 삭제한 후 다시 시작할 수 있다. 이 경우, ibdata1 이 초기화되며 MySQL 은 모든 mysql database 를 제외한 서비스 databas 의 모든 InnoDB 테이블의 meta 정보를 새롭게 저장하게 된다. 하지만 정작 mysql database 에 새롭게 만들어진 5개의 InnoDB 테이블에 대한 정보는 저장하지 않아, 위와 같은 에러가 발생한다.

## 해결방법은 무엇인가?

  * mysql 에 존재하는 innodb 관련 테이블들을 깨끗하게 지우고 mysql_upgrade 를 통해 새로 생성하는 방법

```
    MySQL startup
        1) 관련된 5개 테이블 삭제
            mysql> use mysql;  drop table innodb_index_stats ; drop table innodb_table_stats; drop table slave_master_info; drop table slave_relay_log_info; drop table slave_worker_info;
                - 테이블이 없다고 에러가 발생하지만, frm 을 삭제하여 다시 MySQL 이 시작될때 해당 테이블의 존재를 알려주지 않기 위함

    MySQL shutdown
        2) mysql database 에 존재하는 ibd 파일 삭제 (frm 은 drop table 시 지워졌음)
            shell$ ls -al *.ibd
            -rw-r--r--. 1 mysql mysql 409600 Mar 10 11:04 innodb_index_stats.ibd
            -rw-r--r--. 1 mysql mysql  98304 Mar 10 11:04 innodb_table_stats.ibd
            -rw-r--r--. 1 mysql mysql  98304 Oct  9 22:01 slave_master_info.ibd
            -rw-r--r--. 1 mysql mysql  98304 Oct  9 22:01 slave_relay_log_info.ibd
            -rw-r--r--. 1 mysql mysql  98304 Oct  9 22:01 slave_worker_info.ibd

            shell$ rm -rf innodb_index_stats.ibd innodb_table_stats.ibd slave_master_info.ibd slave_relay_log_info.ibd  slave_worker_info.ibd
                - 기존의 ibd 파일은 모두 삭제한다. 3번 작업에서 5개의 테이블을 생성시 오류를 피하기 위함

    MySQL startup
        3) mysql 강제 upgrade
            shell$ mysql_upgrade --force -uroot -p
                - 위 작업을 통해 존재하지 않는 5개의 테이블이 새로 생성이 된다.
    MySQL restart
        4) err 로그를 확인하여, 정상적으로 동작하는지 확인.
```
