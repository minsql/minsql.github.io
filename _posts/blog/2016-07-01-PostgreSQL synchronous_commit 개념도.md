---
title: PostgreSQL synchronous_commit 개념도
author: min_kim
created: 2016/07/01 14:56:16
modified:
layout: post
tags: postgres postgres_intenal
image:
  feature: postgres.png
categories: Postgres
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# PostgreSQL synchronous_commit 개념도

### synchronous_commit 개념도

> 안정성이냐 성능이냐. PostgreSQL의 synchronous_commit, fsync에 대해서 정리해본다.

![Slide4]({{site_url}}/uploads/Slide4.jpg)
![Slide1]({{site_url}}/uploads/Slide1.jpg)
![Slide2]({{site_url}}/uploads/Slide2.jpg)
![Slide3]({{site_url}}/uploads/Slide3.jpg)

#### synchronous_commit (enum)

  * 트랜잭션 커밋하기전에 WAL 레코드가 disk까지 쓰인다음에 success를 리턴할 것인가 여부.
    * on : default
    * off : 클라이언트에 바로 transaction commit을 보냄. 하지만 실제로 트랜잭션이 안전하게 반영(WAL record가 WAL file에 쓰여짐) 되기까지 딜레이가 존재함. 서버 crash났을때 트랜잭션 손실될 수 있음. (최대 delay는 wal_writer_delay(200ms)의 3배). 하지만 fsync와는 달리 off로 한다고 해서 db 일관성에 문제가 되지는 않음. 최근 커밋되어야하는 트랜잭션이 손실될 수는 있으나 database 상태는 이 트랜잭션들이 정상적으로 롤백된 것과 같아서 일관성에 문제 없음.
  * synchronous 리플리케이션을 사용하는 경우에 트랜잭션 커밋전에 변경WAL이 synchronus standby까지 리플리케이션되기를 기다릴것인지 아닌지를 설정할 수 있음
    * on : 변경WAL레코드가 standby의 WAL file까지 쓰여진 후 커밋 success 리턴해줌
    * remote-write : standby가 WAL을 받아서 os buffer까지 썼다는 것을 의미, disk에 쓰여진것은 보장하지 않음. 이세팅도 충분히 안전함.
    * local : synchronous replication을 사용한다는 것은 일반적으로 master의 disk와 standby에 WAL변경사항을 동시에 적용해야하는게 당연하다. 그렇지 않다면 asynchronus replication인 것이니까 말이다. 그럼에도 불구하고 local disk에까지만 쓰고, standby까지 replication되는 것을 기다리지 않고 싶다면 local로 설정할 수 있다. 이 파라메터는 운영중에 변경가능하므로, sync해야하는 트랜잭션도 있고 async로 해도 되는 트랜잭션도 있는 경우 유용하게 사용할 수 있을 것이다.

#### fsync (boolean)

  * fsync가 on이면, PostgreSQL서버는 fsync()시스템콜을 통해서 변경분을 디스크에 물리적으로 바로 쓴다. 이는 데이터베이스클러스터가 OS나 하드웨어 장애시 consistent한 상태로 복구가 가능함을 보장한다.
  * fsync를 off한다면, OS가 알아서 메모리에 있는 것을 디스크로 내려쓰게 된다. 언제 무엇이 디스크에 쓰여졌는지 아닌지 알수 없다. 그러므로 성능상 이득을 볼수는 있겠지만, 전원장애나 system crash로가 발생했을때 복구가 불가능할수 있다. 만약 전체 데이터베이스를 쉽게 재생성할수 있는 경우에만 off하도록 한다. 예를들어 백업본으로부터 새로운 데이터베이스 클러스트를 초기 구축하는 경우, 버리고 재생성할 데이터베이스의 데이터 처리, 자주 재생성되는 read-only 데이터베이스 복제본으로 failover에 사용되지 않는 데이터베이스인 경우 사용할 수 있다. 고성능의 하드웨어 장비라고해서 fsync를 끄는 것은 올바르지 않다.
    * 성능을 위해서라면 synchronous_commit을 off하는 것만으로 충분할 것이다.
    * 만약 off하기로 했다면, full_page_writes도 off하는 것을 고려하도록 한다.
