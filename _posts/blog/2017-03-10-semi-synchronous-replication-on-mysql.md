---
title: Semi-Synchronous Replication on MySQL
author: min_kim
created: 2017/03/10 05:53:18
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


# Semi-Synchronous Replication on MySQL

## Loss-less Semi-Synchronous Replication on MySQL 5.7.2

* 5.7.2이전, 이후 semi-sync replication방식 비교

<table class="relative-table wrapped confluenceTable"><colgroup> <col /> <col /> <col /></colgroup>
<tbody>
<tr>
<th class="confluenceTh">MySQL Version

rpl_semi_sync_master_wait_point

(introduced from 5.7)</th>
<th class="confluenceTh">MySQL 5.5 and 5.6

AFTER_COMMIT(MySQL 5.7.2)</th>
<th class="confluenceTh">MySQL 5.7.2

AFTER_SYNC(By default on MySQL 5.7.2)</th>
</tr>
<tr>
<th class="confluenceTh"> Feature view</th>
<td class="confluenceTd" width="50%">
<div class="content-wrapper">

<a href="{{site_url}}/uploads/after_commit.png"><img class="alignnone wp-image-927 size-full" src="{{site_url}}/uploads/after_commit.png" alt="" width="400" /></a>

</div></td>
<td class="confluenceTd" width="50%">
<div class="content-wrapper">

<a href="{{site_url}}/uploads/after_sync.png"><img class="alignnone wp-image-928 size-full" src="{{site_url}}/uploads/after_sync.png" alt="" width="400" /></a>

</div></td>
</tr>
<tr>
<th class="confluenceTh" colspan="1">Workflow</th>
<td class="confluenceTd" colspan="1">1. User transaction commit

2. Engine prepare

3. Binlog flush (writing to fscache)

4. Binlog commit (fsync if sync_binlog=1)

5-1. Engine commit (releasing row locks, changes are visible to other users)

5-2. Binlog dump thread send event with ACK Request

6. <strong>semisync wait (AFTER_COMMIT)</strong>

7. User Commit OK</td>
<td class="confluenceTd" colspan="1">1. User transaction commit

2. Engine prepare

3. Binlog flush (writing to fscache)

4. Binlog commit (fsync if sync_binlog=1)

5. Binlog dump thread send event with ACK Request

6.<strong> loss-less semisync wait (AFTER_SYNC)</strong>

7. Engine commit (releasing row locks, changes are visible to other users)

8. User Commit OK</td>
</tr>
<tr>
<th class="confluenceTh" colspan="1">Master crash</th>
<td class="confluenceTd" colspan="1">If master is crashed at step 6.
<ul>
 	<li>Master에 이미 Engine commit됨</li>
 	<li>slave로 부터 ack를 기다리고 있는 중인데, 다른 세션은 해당 데이터를 읽을 수 있다.</li>
 	<li>이 상태에서 master가 crash된다면, slave에는 해당 데이터가 없다. (Phantom Read)</li>
</ul>
</td>
<td class="confluenceTd" colspan="1">If master is crashed at step 6.
<ul>
 	<li>Slave에서 ACK를 받지 못했다면, master에도 commit되지 않는다.</li>
 	<li>Phantom Read가 일어나지 않는다.</li>
</ul>
</td>
</tr>
<tr>
<th class="confluenceTh" colspan="1">Data Integrity - 1. Master에만 존재하고 Slave에 존재하지않는 데이터</th>
<td class="confluenceTd" colspan="1">
<ul>
 	<li>Possible</li>
 	<li>slave에 replicated되지 않고 master에만 commit된 transaction을 manually rollback해야한다.</li>
</ul>
</td>
<td class="confluenceTd" colspan="1">
<ul>
 	<li>None</li>
 	<li>slave에 replicated되지 않고 master에만 commit된 transaction은 없다.</li>
</ul>
</td>
</tr>
<tr>
<th class="confluenceTh" colspan="1">Data Integrity - 2. Slave에만 존재하고 Master에 존재하지않는 데이터</th>
<td class="confluenceTd" colspan="1">
<ul>
 	<li>workflow단계 중 3, 4 단계에서 master가 crash된 경우, master의 binlog에는 쓰여지지 않았는데, slave에는 이미 데이터가 전송되었을 가능성이 있었다.</li>
 	<li>→ 5.6.17이후 fix됨(3 단계에서 user session 이 binlog lock(LOCK_log)를 hold 한다.</li>
</ul>
</td>
<td class="confluenceTd" colspan="1">
<div class="content-wrapper">
<ul>
 	<li>None</li>
</ul>
</div></td>
</tr>
<tr>
<th class="confluenceTh" colspan="1">Strong Durability설정에서 binlog와 redo log(ib_logfile)관계

1. sync_binlog=1

2. innodb_flush_log_at_trx_commit=1

3. innodb_support_xa=1</th>
<td class="confluenceTd" colspan="2">
<ul>
 	<li>sync_binlog=1이라면, Binlog commit 단계에서 바로 file로 fsync한다.</li>
 	<li>innodb_flush_log_at_trx_commit=1이라면, Engine commit단계에서 바로 redo log file 로 flush한다.</li>
 	<li>binlog와 redo log의 synchronize를 manage하는 옵션이 innodb_support_xa=1이다. crash recovery시 redo log뿐 아니라 binary log까지 참조하여 transaction event를 recovery해준다.
<ul>
 	<li>세부 내용은 하단 참조.</li>
</ul>
</li>
</ul>
</td>
</tr>
<tr>
<th class="confluenceTh" colspan="1">Strong Durability설정에서 Crashed master recovery</th>
<td class="confluenceTd" colspan="2">
<ul>
 	<li>Binlog commit 후 Binlog dump가 slave IO thread에 binlog event를 전달한다. (binlog commit 완료)</li>
 	<li>ACK 를 받지 않은 상태에서 master가 crash되었다면, slave에 데이터가 있을 수도 있고 없을 수도 있다.</li>
 	<li>Master에는 binlog commit까지 된것이므로 recovery 시 데이터 복구 된다.</li>
</ul>
</td>
</tr>
</tbody>
</table>


## Strong Durability
1. sync_binlog=1
2. innodb_flush_log_at_trx_commit=1
3. innodb_support_xa=1

##  Distributed Transaction Processing Using XA
* In version 5.0, the server uses XA internally to coordinate the binary log and the storage engines.
* XA protocol을 사용한 트랜잭션에 대해서 2 phase commit을 지원하는 기능이지만, 내부적으로 MySQL은 이 기능을 사용해서 binary log와 storage engines의 commit 프로세스를 2 PC로 수행한다.
  * XA includes a transaction manager that coordinates a set of resource managers so that they commit a global transaction as an atomic unit. Each transaction is assigned a unique XID, which is used by the transaction manager and the resource managers. When used internally in the MySQL server, the transaction manager is usually the binary log and the resource managers are the storage engines.

### 2 Phase commit


![]({{site_url}}/uploads/msha_0408.png){:width="400px"}

* Phase 1. Innodb prepare
  * Error : rollback
  * OK : Phase 2
* Before Phase 2. Binlog commit (XID 저장하고 있음)
* Phase 2. InnoDB commit
  * 이때 commit이 fail하는 일은 보통 일어나지 않는다. phase1에서 prepare를 했다는 이야기는 commit을 할 수 있다는 것을 확인한 것이다. 그러므로 fail했을때에 대한 로직이 없다.
  * 하지만 여전히 HW fail은 발생할 수 있다. 다음의 Crash safety에서 recovery 단계를 살펴본다.
* After phase 2. XA cleanup. Binary log do nothing.

### Crash safety

![]({{site_url}}/uploads/msha_0409.png){:width="400px"}

  * InnoDB crash recovery.
    * Phase 2의 InnoDB commit까지 일어났다면, 변경분이 redo에 정상적으로 저장되었으므로 recover된다.
    * InnoDB commit되기전, binlog에만 써진 변경사항이 존재할 수 있다.
  * The last binary log recovery.
    * 마지막 binary log를 연다.
    * `Format_description` event를 확인하여 `binlog-in-use` flag 를 확인한다. binlog를 쓰기 시작할때 binlog-in-use flag가 설정되고, 닫을 때 clear한다.
    * binlog-in-use가 설정되어있다면 server crash가 일어난 것을 의미하며, 이 경우 XA recovery가 필요하다.
    * binary log에 쓰인 모든 Xid 를 읽는다.
    * 각 storage engine(InnoDB) prepare되었는데 commit이 안된 xid 이벤트는 commit한다.
    * storage engine(InnoDB)에 prepare되었는데, binlog xid list에 없었다면, binary log를 쓰지 못하고 crash된 것이기 때문에 rollback된다.
    
