---
title: MySQL InnoDB architecture - change buffer
author: min_kim
created: 2015/03/18 13:42:32
modified:
layout: post
tags: mysql mysql_internal
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL InnoDB architecture - change buffer

## change buffer(insert buffer)

> secondary index의 변경사항을 저장한다.

### **왜?**

  * DML에 의해서 secondary index의 컬럼 값이 변경되는 경우, secondary index의 leaf node를 update하려면, 디스크로부터 index page를 읽어서 변경해야하는데 이는 부수적으로 추가 IO가 필요한 작업이다. innodb는 인덱스 leaf node를 업데이트하지 않고 buffer만 해두는데 이때 change buffer(insert buffer)를 사용한다.
  * 이를 change buffering이라고 하며, 이는 insert buffering, delete buffering, purge buffering을 포함한다.

### change buffering 조건

  * **secondary non-unique indexes**에 대한 변경사항을 저장한다.
    * 변경사항 merge가 일어나지 않으면 uniqueness를 체크 할수가 없지 않은가.
  * 변경작업에 **해당하는 page가 buffer pool에 존재하지 않을때**만 change buffer에 변경을 저장한다.

### merge일어나는 경우

  * **해당 page가 다른 read operation에 의해서 buffer pool로 불려읽혀졌을 때**
    * change buffer에 저장해둔 변경사항이 아직 반영되지 않은 채로 해당 page가 buffer pool에 로드된 경우, 먼저 change buffer에 cache되어있던 변경사항을 buffer pool에 불려진 page에 적용(merge)해야한다. 이후, 업데이트된 page는 flush mechanism에 따라 flush 되게 될 것이다.
  * background thread에 의한 주기적인 merge 작업
    * **system이 거의 idle일 때**
      * DB를 안쓰고 IO작업도 안하고 있는데, high IO load를 목격했다면, 내부적으로 merge operation이 진행중인 것일 수 있다.
    * **slow shutdown 시**

### change buffer status 확인

  * `SHOW ENGINE INNODB STATUSG`
    * INSERT BUFFER AND ADAPTIVE HASH INDEX항목에서 확인할 수 있다.

### change buffer 장점

  * 매번 인덱스를 업데이트 하는 것보다 하나의 page내의 여러 update를 한번에 수행할 수 있으므로 효율적이다.
  * disk reads, writes를 줄일 수 있어 특히 I/O bound workload가 많은 경우 유리하다.

### 물리적 structure

  * 물리적으로, change buffer는 system tablespace에 위치한다. 그러므로 DB restart가 발생하더라도 buffered된 변경사항은 유지 보관된다.

### 관련 parameter

  * **innodb_change_buffering**
    * _all_ : The default value: buffer inserts, delete-marking operations, and purges.
    * none : Do not buffer any operations.
    * inserts : Buffer insert operations.
    * deletes : Buffer delete-marking operations.
    * changes : Buffer both inserts and delete-marking.
    * purges : Buffer the physical deletion operations that happen in the background.
  * **innodb_change_buffer_max_size**
    * a percentage of the total size of the buffer pool
