title: Semi-Synchronous Replication on MySQL
link: http://minsql.com/mysql/semi-synchronous-replication-on-mysql/
author: michaela
description: 
post_id: 925
created: 2017/03/10 05:53:18
created_gmt: 2017/03/10 05:53:18
comment_status: open
post_name: semi-synchronous-replication-on-mysql
status: publish
post_type: post

# Semi-Synchronous Replication on MySQL

# Loss-less Semi-Synchronous Replication on MySQL 5.7.2

  * 5.7.2이전, 이후 semi-sync replication방식 비교

MySQL Version rpl_semi_sync_master_wait_point (introduced from 5.7) MySQL 5.5 and 5.6 AFTER_COMMIT(MySQL 5.7.2) MySQL 5.7.2 AFTER_SYNC(By default on MySQL 5.7.2)

 Feature view

![](/wp-content/uploads/2017/03/after_commit.png)

![](/wp-content/uploads/2017/03/after_sync.png)

Workflow
1. User transaction commit 2\. Engine prepare 3\. Binlog flush (writing to fscache) 4\. Binlog commit (fsync if sync_binlog=1) 5-1. Engine commit (releasing row locks, changes are visible to other users) 5-2. Binlog dump thread send event with ACK Request 6\. **semisync wait (AFTER_COMMIT)** 7\. User Commit OK
1. User transaction commit 2\. Engine prepare 3\. Binlog flush (writing to fscache) 4\. Binlog commit (fsync if sync_binlog=1) 5\. Binlog dump thread send event with ACK Request 6.** loss-less semisync wait (AFTER_SYNC)** 7\. Engine commit (releasing row locks, changes are visible to other users) 8\. User Commit OK

Master crash
If master is crashed at step 6. 

  * Master에 이미 Engine commit됨
  * slave로 부터 ack를 기다리고 있는 중인데, 다른 세션은 해당 데이터를 읽을 수 있다.
  * 이 상태에서 master가 crash된다면, slave에는 해당 데이터가 없다. (Phantom Read)
If master is crashed at step 6. 

  * Slave에서 ACK를 받지 못했다면, master에도 commit되지 않는다.
  * Phantom Read가 일어나지 않는다.

Data Integrity - 1. Master에만 존재하고 Slave에 존재하지않는 데이터

  * Possible
  * slave에 replicated되지 않고 master에만 commit된 transaction을 manually rollback해야한다.

  * None
  * slave에 replicated되지 않고 master에만 commit된 transaction은 없다.

Data Integrity - 2. Slave에만 존재하고 Master에 존재하지않는 데이터

  * workflow단계 중 3, 4 단계에서 master가 crash된 경우, master의 binlog에는 쓰여지지 않았는데, slave에는 이미 데이터가 전송되었을 가능성이 있었다.
  * → 5.6.17이후 fix됨(3 단계에서 user session 이 binlog lock(LOCK_log)를 hold 한다.

  * None

Strong Durability설정에서 binlog와 redo log(ib_logfile)관계 1\. sync_binlog=1 2. innodb_flush_log_at_trx_commit=1 3\. innodb_support_xa=1

  * sync_binlog=1이라면, Binlog commit 단계에서 바로 file로 fsync한다.
  * innodb_flush_log_at_trx_commit=1이라면, Engine commit단계에서 바로 redo log file 로 flush한다.
  * binlog와 redo log의 synchronize를 manage하는 옵션이 innodb_support_xa=1이다. crash recovery시 redo log뿐 아니라 binary log까지 참조하여 transaction event를 recovery해준다. 
    * 세부 내용은 하단 참조.

Strong Durability설정에서 Crashed master recovery

  * Binlog commit 후 Binlog dump가 slave IO thread에 binlog event를 전달한다. (binlog commit 완료)
  * ACK 를 받지 않은 상태에서 master가 crash되었다면, slave에 데이터가 있을 수도 있고 없을 수도 있다.
  * Master에는 binlog commit까지 된것이므로 recovery 시 데이터 복구 된다.

## Strong Durability

1\. sync_binlog=1 2\. innodb_flush_log_at_trx_commit=1 3\. innodb_support_xa=1 

## Distributed Transaction Processing Using XA

  * In version 5.0, the server uses XA internally to coordinate the binary log and the storage engines.
  * XA protocol을 사용한 트랜잭션에 대해서 2 phase commit을 지원하는 기능이지만, 내부적으로 MySQL은 이 기능을 사용해서 binary log와 storage engines의 commit 프로세스를 2 PC로 수행한다. 
    * XA includes a _transaction manager_ that coordinates a set of _resource managers_ so that they commit a global transaction as an atomic unit. Each transaction is assigned a unique XID, which is used by the transaction manager and the resource managers. When used internally in the MySQL server, the transaction manager is usually the binary log and the resource managers are the storage engines.

### 2 Phase commit

![](/wp-content/uploads/2017/03/msha_0408.png)  

  * Phase 1. Innodb prepare 
    * Error : rollback
    * OK : Phase 2
  * Before Phase 2. Binlog commit (XID 저장하고 있음)
  * Phase 2. InnoDB commit 
    * 이때 commit이 fail하는 일은 보통 일어나지 않는다. phase1에서 prepare를 했다는 이야기는 commit을 할 수 있다는 것을 확인한 것이다. 그러므로 fail했을때에 대한 로직이 없다.
    * 하지만 여전히 HW fail은 발생할 수 있다. 다음의 Crash safety에서 recovery 단계를 살펴본다.
  * After phase 2. XA cleanup. Binary log do nothing.

### Crash safety

![](/wp-content/uploads/2017/03/msha_0409-300x261.png)

  * InnoDB crash recovery. 
    * Phase 2의 InnoDB commit까지 일어났다면, 변경분이 redo에 정상적으로 저장되었으므로 recover된다.
    * InnoDB commit되기전, binlog에만 써진 변경사항이 존재할 수 있다.
  * The last binary log recovery. 
    * 마지막 binary log를 연다.
    * `Format_description` event를 확인하여 `binlog-in-use` flag 가 설정되었다면, binlog가 제대로 쓰여졌다는 것을 의미한다. 그 Xid들에 대해서는 recovery해준다.
    * binlog-in-use=0 이라면 제대로 쓰고 닫힌 것으로 볼수 없으므로  truncate한다.