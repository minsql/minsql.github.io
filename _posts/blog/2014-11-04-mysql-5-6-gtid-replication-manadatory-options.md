---
title: MySQL 5.6 gtid replication manadatory options
author: min_kim
created: 2014/11/04 02:19:00
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


# MySQL 5.6 gtid replication manadatory options

## GTID 필수 옵션에 대해서


ref : <http://dev.mysql.com/doc/refman/5.6/en/replication-gtids-howto.html>  
에 따르면 간단히 다음과 같이 정리할 수 있습니다.  


> GTID(global transactio identifier)를 사용하기 위한 필수옵션은 다음 네가지입니다. Master, Slaves 모두 (적어도) 네가지 옵션이 주어져야합니다.  
> ```shell> mysqld_safe --gtid_mode=ON --log-bin --log-slave-updates --enforce-gtid-consistency &```

> --gtid-mode는 ON/OFF 값을 주어야합니다. 0/1 사용하지 마세요.

| Options| Comments |
|----|----|
|`--gtid_mode=ON ` | GTID 쓸꺼면 ON하면 됩니다. enumeration이라니 아마도 ON/OFF외에 다른 값도 받을수 있는듯. 살펴봅시다.|
|`--log-bin` | 이것도 물론 켜야겠죠.|
|`--log-slave-updates`|이거 살짝 curious하네요. 지금까지는 chained replication 구성할때 사용했었는데요. 살펴봅시다.|
|`--enforce-gtid-consistency`|gtid를 쓰면 unsafe한 케이스가 있나봅니다. 살펴봅시다.|



### gtid_mode=ON
<table>
<tbody><tr><td><span class="bold"><strong>Introduced</strong></span></td><td colspan="3">5.6.5</td></tr><tr><td><span class="bold"><strong>Command-Line Format</strong></span></td><td colspan="3"><code class="literal">--gtid-mode=MODE</code></td></tr><tr><td rowspan="3"><span class="bold"><strong>System Variable</strong></span></td><td><span class="bold"><strong>Name</strong></span></td><td colspan="2"><code class="literal"><a class="link" href="replication-options-gtids.html#sysvar_gtid_mode">gtid_mode</a></code></td></tr><tr><td><span class="bold"><strong>Scope</strong></span></td><td colspan="2">Global</td></tr><tr><td><span class="bold"><strong>Dynamic</strong></span></td><td colspan="2">No</td></tr><tr><td rowspan="6"><span class="bold"><strong>Permitted Values</strong></span></td><td><span class="bold"><strong>Type</strong></span></td><td colspan="2">enumeration</td></tr><tr><td><span class="bold"><strong>Default</strong></span></td><td colspan="2"><code class="literal">OFF</code></td></tr><tr><td rowspan="4" valign="top"><span class="bold"><strong>Valid Values</strong></span></td><td colspan="2"><code class="literal">OFF</code></td></tr><tr><td colspan="2"><code class="literal">UPGRADE_STEP_1</code></td></tr><tr><td colspan="2"><code class="literal">UPGRADE_STEP_2</code></td></tr><tr><td colspan="2"><code class="literal">ON</code></td></tr></tbody>
</table>
* 물론 global 변수고, dynamic아니고, 네가지 값을 가질수 있네요.
* ON/OFF할때 주의해야합니다. 실행중이던 트랜잭션이 남아있던 경우에 이 옵션이 켜지거나 꺼지면 문제가 될수 있다고 합니다.
* Boolean아니니 0/1주면 안됩니다. UPGRADE_STEP_1 , UPGRADE_STEP_2 은 지금은 사용안되고 추후에 추가될 예정이라고합니다. 지금 버젼에서는 이 두개 쓰면 startup 실패합니다.
* 버젼별 주의사항(gtid_mode=ON일때)
* MySQL 5.6.7 미만 : mysql_upgrade 사용안됨, mysql_upgrade하려면 –skip-write-binlog을 명시해야함.
* MySQL 5.6.7 이후 : mysql_upgrade 실행가능하지만 MyISAM을 사용하는MySQL system tables에 영향이 있을 수 있으므로 사용하지 않는 것이 좋다. (–write-binlog가 default였는데 5.6.7이후부터 –skip-write-binlog* 가 default임)
* MySQL 5.6.10 미만 : sql_slave_skip_couter=1 을 설정이 동작하지 않음. slave position을 넘기기 위해서는 CHANGE MASTER TO … MASTER_LOG_FILE = …, MASTER_LOG_POS = …, MASTER_AUTO_POSITION = 0 를 사용해야함.

### log-bin
* Enable binary logging

### log-slave-updates
* slave binlog에 master로 부터 받은 변경사항도 쓰도록 하는 옵션.
* gtid-mode에서 log-slave-updates를 사용하지 않으면 다음과 같은 에러가 발생한다고 합니다.

```
[ERROR] --gtid-mode=ON or UPGRADE_STEP_1 or UPGRADE_STEP_2 requires --log-bin and --log-slave-updates
```
* Master와 Slave binlog에 같은 GTID가 기록되기 때문에 slave는 자신이 최근 적용한 GTID를 가지고 master의 position을 찾아갈수 있음. 즉, auto-positioning을 위해서는 –log-slave-updates가 반드시 활성화되어야함.

### enforce-gtid-consistency
<table>
<tbody><tr><td><span class="bold"><strong>Introduced</strong></span></td><td colspan="3">5.6.9</td></tr><tr><td><span class="bold"><strong>Command-Line Format</strong></span></td><td colspan="3"><code class="literal">--enforce-gtid-consistency[=value]</code></td></tr><tr><td rowspan="3"><span class="bold"><strong>System Variable</strong></span></td><td><span class="bold"><strong>Name</strong></span></td><td colspan="2"><code class="literal"><a class="link" href="replication-options-gtids.html#sysvar_enforce_gtid_consistency">enforce_gtid_consistency</a></code></td></tr><tr><td><span class="bold"><strong>Scope</strong></span></td><td colspan="2">Global</td></tr><tr><td><span class="bold"><strong>Dynamic</strong></span></td><td colspan="2">No</td></tr><tr><td rowspan="2"><span class="bold"><strong>Permitted Values</strong></span></td><td><span class="bold"><strong>Type</strong></span></td><td colspan="2">boolean</td></tr><tr><td><span class="bold"><strong>Default</strong></span></td><td colspan="2"><code class="literal">false</code></td></tr></tbody>
</table>
* transsactionally safe한 문장만 실행을 허용한다.
* GTID 모드를 사용하기 전에 이 옵션을 켜서 테스트해볼수 있습니다.
* transactionally safe한 문장이 어떤걸까. unsafe하다는 걸 보면 알수 있을지도 모르겠네요.
* 허용되지 않는 문장.
  * CREATE TABLE … SELECT statements

```sql
mysql> create table tt_copy select * from tt;
ERROR 1786 (HY000): CREATE TABLE ... SELECT is forbidden when @@GLOBAL.ENFORCE_GTID_CONSISTENCY = 1.
```
*  * CREATE TEMPORARY TABLE statements inside transactions

```sql
mysql> start transaction;
Query OK, 0 rows affected (0.00 sec)

mysql> create temporary table no_temp (no int);
ERROR 1787 (HY000): When @@GLOBAL.ENFORCE_GTID_CONSISTENCY = 1, the statements CREATE TEMPORARY TABLE and DROP TEMPORARY TABLE can be executed in a non-transactional context only, and require that AUTOCOMMIT = 1.
Transactions or statements that update both transactional and nontransactional tables
mysql>  select table_name, engine from information_schema.tables where table_schema='reptest';
+------------+--------+
| table_name | engine |
+------------+--------+
| tt         | InnoDB |
| tt_myisam  | MyISAM |
+------------+--------+
2 rows in set (0.01 sec)

mysql> select * from tt, tt_myisam where tt.no=tt_myisam.no and tt.no=100;
+-----+---------------+-----+---------------+
| no  | name          | no  | name          |
+-----+---------------+-----+---------------+
| 100 | please update | 100 | please update |
+-----+---------------+-----+---------------+
1 row in set (0.00 sec)

mysql> update tt, tt_myisam set tt.name='update innodb!!', tt_myisam.name='update myisam!!' where tt.no=tt_myisam.no and tt.no=100;
ERROR 1785 (HY000): When @@GLOBAL.ENFORCE_GTID_CONSISTENCY = 1, updates to non-transactional tables can only be done in either autocommitted statements or single-statement transactions, and never in the same statement as updates to transactional tables.
mysql>
```

* 버젼별 주의사항(enforce-gtid-consistency)
  * MySQL 5.6.9 미만 : 옵션 이름이 –disable-gtid-unsafe-statements 이었음.
  * MySQL 5.6.7 미만 : 이 옵션을 사용하면 temporary tables에 대한  nontransactional DML문이 실패했었음. 심지어 row-based binary logging 사용 환경에서 temporary tables가 로깅될 필요가 없는 경우에도 에러를 발생했었음.
  * MySQL 5.6.7 이후: –disable-gtid-unsafe-statements ( MySQL 5.6.9 이후, –enforce-gtid-consistency) 을 사용하면 temporary tables에 대한  nontransactional DML문이 허용됨
  * MySQL 5.6.7 미만 : mysql_upgrade 사용안됨, mysql_upgrade하려면 –skip-write-binlog을 명시해야함.
  * MySQL 5.6.7 이후 : mysql_upgrade 실행가능하지만 MyISAM을 사용하는 MySQL system tables에 영향이 있을 수 있으므로 사용하지 않는 것이 좋다. (–write-binlog가 default였는데 5.6.7이후부터 –skip-write-binlog가 default임)
  * MySQL 5.6.9 미만 : –disable-gtid-unsafe-statements을 사용하면 nontransactional tables(MyISAM) 에 대한 변경이 불가능했음
  * MySQL 5.6.9 이후 : nontransactional tables(MyISAM) 에 대한 single statement는 가능함.
