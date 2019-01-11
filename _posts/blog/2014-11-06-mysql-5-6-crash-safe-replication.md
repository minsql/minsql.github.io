---
title: MySQL 5.6 Crash-safe replication
author: min_kim
created: 2014/11/06 03:45:00
modified:
layout: post
tags: mysql mysql_replication
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL 5.6 Crash-safe replication

## Crash-safe replication
slave의 crash safety를 위해서는, 다음 옵션을 사용하면 된다.
* **relay-log-info-repository=TABLE**
* **relay-log-recovery=1**
* **relay-log-purge=1**

### 버젼별 주의사항(MySQL 5.6.6 미만에서 주의할 점)

* MySQL 5.6.6 미만에는, replication logging table을 초기화할수 없으면, slave를 start할 수 없었지만, MySQL 5.6.6 부터는 warning 일뿐 start가능하다. 이런 상황은 slave logging table을 지원하지 않는 버전에서 지원하는 버전으로 upgrade했을 때 발생하곤 한다.
* replication이 crash-safe이려면, logging과 information에 사용되는 테이블들이 InnoDB 같은 transactional storage engine을 사용해야하만 한다. MySQL 5.6.5 미만에는, slave_master_info와 slave_relay_log_info table이 MyISAM이라서, replication 시작하기전에 수동으로 InnoDB로 alter table해줬어야했다. replication동작중에 alter하면 안된다. MySQL 5.6.3 부터 replication 동작중에 이 테이블을 alter하는 작업이 허용되지 않고, MySQL 5.6.4부터는 이 테이블에 write lock을 거는 어떤 statement도 허용되지 않고, 읽기만 허용된다. MySQL 5.6.6 부터는 이 테이블들이 InnoDB로 생성된다. (중요: slave_master_info, slave_relay_log_info 테이블을 수동으로 update, insert하지 마시오.)
* MySQL 5.6.5 미만에는, mysqldump가 이들 replication log table을 dump하지 않는다. table name을 명시하고 --master-data 옵션을 사용해야만 dump한다.

##  1. relay-log-info-repository=TABLE
<table>
<tbody><tr><td><span class="bold"><strong>Introduced</strong></span></td><td colspan="3">5.6.3</td></tr><tr><td><span class="bold"><strong>Command-Line Format</strong></span></td><td colspan="3"><code class="literal">--slave-parallel-workers=#</code></td></tr><tr><td rowspan="3"><span class="bold"><strong>System Variable</strong></span></td><td><span class="bold"><strong>Name</strong></span></td><td colspan="2"><code class="literal"><a class="link" href="replication-options-slave.html#sysvar_slave_parallel_workers">slave_parallel_workers</a></code></td></tr><tr><td><span class="bold"><strong>Scope</strong></span></td><td colspan="2">Global</td></tr><tr><td><span class="bold"><strong>Dynamic</strong></span></td><td colspan="2">Yes</td></tr><tr><td rowspan="4"><span class="bold"><strong>Permitted Values</strong></span></td><td><span class="bold"><strong>Type</strong></span></td><td colspan="2">integer</td></tr><tr><td><span class="bold"><strong>Default</strong></span></td><td colspan="2"><code class="literal">0</code></td></tr><tr><td><span class="bold"><strong>Minimum</strong></span></td><td colspan="2"><code class="literal">0</code></td></tr><tr><td><span class="bold"><strong>Maximum</strong></span></td><td colspan="2"><code class="literal">1024</code></td></tr></tbody>
</table>
* relay log info를 file에 저장할지 table에 저장할지 지정한다.
* default value는 FILE이며, file default name이 relay-log.info이다. –relay-log-info-file 옵션을 통해서 file name을 변경할 수 있다.
* TABLE을 선택하면 mysql database 내에 slave_relay_log_info 테이블에 relay log info가 저장된다
* crash-safe replication을 위해서는 이옵션이 TABLE이어야하며, –relay-log-recovery옵션을 활성화해야한다.
* info log table 추가 설명
  * master-info-repository=TABLE
    * 이건 crash-safe 에 필수 옵션은 아니지만, relay-log-info-repository와 마찬가지로 5.6부터 지원된 옵션이다. master info를 TABLE에 저장할수 있도록 한다.
  * 이들 info log table( mysql.slave_master_info, mysql.slave_relay_log_info ) 은 해당 MySQL 서버에 종속되는 내용으로, MySQL 5.6.9이상에서는 이 테이블이 replicate되지 않고, 변경사항이 binary log에 쓰이지도 않는다.
  * 성능상 이점.
    * 벤치마크결과 (https://blogs.oracle.com/MySQL/entry/benchmarking_mysql_replication_with_multi)에 따르면
    * ```relay-log-info-repository=TABLE```
    * ```master-info-repository=TABLE```
    * 이 옵션 사용시, 기존 FILE info log 대비 2.3배의 성능향상이 있었다고한다.(5개 이상의 worker사용환경에서)

## 2. relay_log_recovery=1
<table>
<tbody><tr><td><span class="bold"><strong>Command-Line Format</strong></span></td><td colspan="3"><code class="literal">--relay-log-recovery</code></td></tr><tr><td rowspan="2"><span class="bold"><strong>Permitted Values</strong></span></td><td><span class="bold"><strong>Type</strong></span></td><td colspan="2">boolean</td></tr><tr><td><span class="bold"><strong>Default</strong></span></td><td colspan="2"><code class="literal">FALSE</code></td></tr></tbody>
</table>
* 서버 시작시 자동으로 relay log recovery를 한다.
* recovery process
  1. 새로운 relay log file 생성
  2. SQL thread position을 새로운 relay log로 초기화
  3. I/O thread를 SQL thread position으로 초기화.
  4. Master로 부터 relay log를 읽기 시작한다.
  * -> 무슨말이냐면, 만약 slave가 crash된 경우, IO thread는 relay log에 변경내용을 썼는데, SQL thread가 execute 안한 작업이 있을 수 있음. 이런 경우를 대비해서, SQL thread가 적용한 position으로 IO thread를 다시 돌려서 master로 부터 다시 읽어온다는 것임.
* MySQL 5.6.5 이전에는, dynamic하게 변경가능했지만, MySQL 5.6.6부터는 read-only variable로 변경되었다.
* default값은 0(disabled)이다.
* crash-proof slave를 위해서는, 이 옵션이 enabled(1)되어야하고, –relay-log-info-repository=TABLE이어야한다. 그리고 relay-log-purge가 enable되어야한다. 만약 relay-log-purge가 disabled인 채로 relay-log-recovery만 enabled되면, purge되지 않은 relay log파일을 읽는 위험이 있을 수 있다. 이는 데이터 불일치를 야기시킬수 있고 이건 crash-safe하지 않다.
* 버젼별 주의사항(MySQL 5.6.6 미만에서 주의할 점)
  * MySQL 5.6.6 미만에서, multi-threaded slave에 대해서 이 옵션을 사용하다가 slave가 error로 실패한 경우, CHANGE MASTER TO문을 실행할 수 없었다. MySQL 5.6.6 이상에서는, START SLAVE UNTIL SQL_AFTER_MTS_GAPS를 수행해서 relay log에 multi-threaded로 인한 gap이 없게 한후, CHANGE MASTER TO 문을 수행해서 slave를 다시 master에 붙일 수 있다.

## 3. relay-log-purge=1
<table>
<tbody><tr><td><span class="bold"><strong>Command-Line Format</strong></span></td><td colspan="3"><code class="literal">--relay-log-purge</code></td></tr><tr><td rowspan="3"><span class="bold"><strong>System Variable</strong></span></td><td><span class="bold"><strong>Name</strong></span></td><td colspan="2"><code class="literal"><a class="link" href="server-system-variables.html#sysvar_relay_log_purge">relay_log_purge</a></code></td></tr><tr><td><span class="bold"><strong>Scope</strong></span></td><td colspan="2">Global</td></tr><tr><td><span class="bold"><strong>Dynamic</strong></span></td><td colspan="2">Yes</td></tr><tr><td rowspan="2"><span class="bold"><strong>Permitted Values</strong></span></td><td><span class="bold"><strong>Type</strong></span></td><td colspan="2">boolean</td></tr><tr><td><span class="bold"><strong>Default</strong></span></td><td colspan="2"><code class="literal">TRUE</code></td></tr></tbody>
</table>
* relay log 자동 purge 여부를 지정한다.
* default는 1(enabled)이다.
* crash-safe를 위해 –relay-log-recovery를 활성화한 환경에서 relay log purge를 끄는 것은 데이터 불일치 위험을 내포한다.
