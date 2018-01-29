---
title: PostgreSQL VACUUM main point
author: min_kim
created: 2014/09/25 06:42:00
modified:
layout: post
tags: Postgres
image:
  feature: postgres.png
categories: blog
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# PostgreSQL VACUUM main point

### PostgreSQL VACUUM..

#### 맨날 다시 찾아보게되는 이놈의 청소작업. 좀 정리해두자.
##### 1. reason why VACUUM is needed!
1. 디스크 공간 회수 To recover or reuse disk space occupied by updated or deleted rows.
2. 통계정보 업데이트 To update data statistics used by the PostgreSQL query planner.
3. visibility map 업데이트 To update the visibility map, which speeds up index-only scans.
4. xid wraparound 방지 To protect against loss of very old data due to transaction ID wraparound or multixact ID wraparound.

##### 2. Basics
1. VACUUM을 사용.
  * online가능 (query, dml가능)
  * ALTER TABLE 테이블 정의변경 안됨
  * I/O를 많이 쓰기 때문에 타 세션, 타 테이블 사용에도 성능 영향 있을 수 있음.
2. VACUUM FULL은 안한다.
  * ACCESS EXCLUSIVE lock 잠금. select도 안됨.

##### 3. Details
1. 디스크 공간 회수
Oracle, InnoDB는 rollback segment를 사용하여 MVCC 구현하지만, Postgres에서는 내부페이지를 사용함. 즉 update, delete된 행을 즉시 제거하지 않음. 결국에는 이공간을 VACUUM작업을 통해서 회수해야함.
  * vacuum : dead row marking만 함. OS 상에 공간반환하지는 않음. (테이블 마지막 pages가 완전 비워지고 exclusive table lock을 쉽게 잡을 수 있는 Special한 경우에만 반환이 된다고함. 아마도 목격하기 힘들듯)
  * vacuum full : new version table copy로 동작, 그만큼 여유공간 있어야하고 시간이 오래걸림. 최종적으로는 테이블 크기 줄일 수 있고 OS 디스크 공간 확보 가능
  * autovacuum : vacuum full하지 않고 디스크 무제한 소비를 막으려면, vacuum을 자주해야함. autovacuum은 사실 vacuum만 수행하며 vacuum full 수행하지 않는다. 최소 크기는 아니더라도 적당한 크기로 관리 할 수는 있다.
  * manual하게 관리 싶은 경우 : 완전히 autovacuum을 끄는 것은 바람직하지 못하다. 예상치 못하게 update가 많이 되어 vacuum full이 필요하게 되면 더 문제이다. 완벽하게 workload를 산정할수 있는 경우에만 manual하게 관리해야함.
  * Tip1 : 대규모 update/delete 작업이 있는 경우, vacuum결과가 만족스럽지 못할 수 있음. 이런 경우에는 vacuum full, cluster, table-rewriting하는 ALTER TABLE 작업을 통해서 table rewrite해야함. — 이게 무슨 팀이람.
  * Tip2 : 전체 내용 삭제시에는 TRUNCATE. vacuum full 안해도 disk 반환함. MVCC에는 위배됨.
2. 통계정보 업데이트
통계정보는 ANALYZE 명령어나 VACUUM에 의해 업데이트 된다. 통계정보는 올바른 실행계획을 세울수 있도록 최신으로 관리되어야한다.
  * autovacuum : 일정량 이상의 변경이 발생한 경우 ANALYZE 커맨드를 자동으로 수행한다. 변경이 많은 테이블에 대해서는 통계정보 갱신을 자주 하는 것이 좋다. 통계적으로 분포가 유사하게 업데이트 되는 경우에는 통계정보 업데이트 자주 할 필요가 없을 수도 있다. 예를들어 URL같은 경우, 자주 업데이트 되더라도 통계 분포는 상대적으로 천천히 변경될 것이다. 하지만, timestamp 열과 같이 최대값이 끊임없이 증가하는 경우에는 더 자주 통계를 업데이트 해야한다.
  * ANALYZE : 특정 테이블, 특정 컬럼에 대해서만 analyze돌릴 수 있다. 특성에 따라서 유연하게 통계정보를 관리할 수 있다. 하지만, analyze는 실제로 random sampling하는 것이라 고속으로 동작하기 떄문에 전체 데이터베이스에 대해서 analyze하는 것이 좋다.  
  * Tip1 :  특정 컬럼 analyze가 매우 생산적인건 아니지만, 특별한 경우에는 사용할 수 있다. where조건에 자주 사용되지만, 매우 불규칙한 데이터의 경우, 해당 컬럼만 통계정보 수준을 높여 세밀한 데이터 히스토그램을 관리할 수도 있다. ALTER TABLE SET STATISTICS으로 컬럼별 통계수준을 변경(alter table tablename alter no set statistics 1000; 0-10000까지 가능 default는 -1(system default target 따름) )할 수 있고, 데이터베이스 전체에 대해서는 default_statistics_target 의 기본값(default 100)을 변경할 수도 있다.
  * Tip2 : autovacuum은 forien table에 대해서는 analyze를 수행하지 않는다. foreign table에 대해 통계정보 갱신하려면 manually analyze해야함.
3. visibility map 업데이트
  * visibility map의 용도 : visibility map은 heap page당 one bit를 저장하며, set이면 해당 page에 있는 모든 tuple이 visible한 것임. vacuum할 tuple이 없다는 의미이므로 다음 vacuum시 해당 page는 vacuum 대상에서 제외시길 수 있음. 또한 visibility map은 index-only scan이 index tuple만 읽어도 됨을 의미하는 것으로 heap tuple액세스를 줄일 수 있음.
  * visibility map 업데이트 : visibility map bit는 vacuum에 의해서만 set되며, 해당 페이지에 변경이 발생하면 clear됨.
4. xid wraparound 방지
  * xid에 의한 MVCC : xid comparision rule은 modulo-2^32 연산임. 약 40억 트랜잭션중에 -20억은 현 xid보다 오래된것 +20억은 새로운 트랜잭션이라는 의미임. xid 차원은 원형으로 생각하면됨. 만약 vacuum을 통해 매우 오래된 트랜잭션을 freeze하지 않으면 wraparound되었을때 해당 튜플이 보이지 않게 될수가 있다.(예를들면 6개월전에 1억번으로 xid가 삽입한 행, 지금은 내가 21억이라는 xid를 가짐. 아직은 내 이전 20억이니깐. 근데 내일 내가 22억이 됨. 그럼 난 2억에서 22억까지가 내 과거의 트랜잭션임. 오잉 그럼 1억번이라는 애는 내 미래인것임. 갑자기 안보이게 되는것. ) 이 문제를 방지하려면 20억 이상 시대가 흐르기전에 충분히 오래된 트랜잭션은 frozenid로 freeze해줘야함. frozenid는 어떤 xid와 비교해도 과거의 xid임을 의미함.
