---
title: MySQL InnoDB architecture - doublewrite buffer
author: min_kim
created: 2015/04/17 13:58:58
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


# MySQL InnoDB architecture - doublewrite buffer

## Doublewrite Buffer

> InnoDB는 file flush관련 독특한 technique을 사용하는데, 그것이 바로 doublewrite buffer이다.

### 1\. 관련파라메터

  * innodb_doublewrite
    * default로 활성화 되어있다.
    * `innodb_doublewrite=ON`

### 2\. 목적

  * 시스템 crash, 전원공급중단 등 장애시 보다 안전한 리커버리
    * 특히 page의 일부분만 쓰다가 장애가 난 경우, 리커버리 어떻게 할 것인가.
    * 예를 들어, 16K innodb page중에 첫 4KB를 썼는데, 갑자기 OS crash가 났다거나 전원공급이 중단되어 나머지는 이전 상태로 남아있는 경우. 대부분의 file system의 default block size는 4k이다.
      * 여기서 내 시스템의 block size가 궁금하다면; : `dumpe2fs /dev/sda1 | grep "^Block size"`
    * 로그파일을 이용해서 복구한다? : InnoDB는 log file에 full pages를 로깅하는 것이 아니라, page number, 변경내용, log sequence 정보를 로깅한다. 하지만, page가 항상 consistent하다는 것을 전제로 한다. 즉, page version이 "현재" 버전이면, page 변경을 skip하고, "이전" 버전이면 변경을 반영한다. page가 inconsistent하다면, 리커버리 할수가 없다.
  * Unix시스템에서 fsync() 콜을 줄임으로써 성능 향상

### 3\. 동작

  * innodb buffer pool의 변경된 pages를 data files로 write하기 전에, InnoDB는 먼저 그 pages들을 doublewrite buffer라는 contiguous tablespace area에 먼저 쓴다.
    * contiguous라는 건 인접한 블럭으로 append하는 식으로 쓰는 형식으로 사용하는 공간을 말한다.
    * InnoDB가 innodb buffer pool로 부터 page를 flush할때 multiple pages를 한번에 flush 하는데 이 pages들이 sequential하게 doublewrite buffer에 쓰여지는 것이다.
  * doublewrite buffer로 write하고 flush까지 한후(fsync())에, InnoDB는 data file의 적절한 position에다가 변경된 pages를 write(2차 fsync())한다.
  * page write중에 만약 OS나 스토리지시스템에 문제가 발생하거나, mysql이 crash되었다면, (partial page write, torn page), InnoDB는 recovery시, doublewrite buffer로부터 해당 page를 찾아서 간단히 복구할 수 있다.
    * 만약 doublewrite buffer의 page가 inconsistent하다면 그냥 버려버리고, 로그파일로 부터 복구하게 된다.
    * 실제 data file의 page가 inconsistent한 경우, doublewrite buffer에서 복구한다.

### 4\. 성능

  * doublewrite를 사용하면 page를 두번 써야하니까 overhead가 있을까?
    * 적어도 두배의 overhead는 아니다.
    * doublewrite buffer는 sequential 하게 쓰여지기때문에 매우 빠르다.
  * fsync()횟수를 줄인다
    * 매 page마다 fsync()를 콜하는게 아니라, multiple page를 한번에 쓰고 fsync()한다.
  * 일반적으로 doublewrite를 활성화에 의해서 발생하는 성능 저하는 5-10%정도라고 본다.

### 5\. 비활성화 할수 있나

  * 데이터가 소중하지 않다면, 혹은 file system 단에서 partial page write가 발생하지 않는다고 보장할수 있다면, disable할수 있다.
  * `innodb_doublewrite=0`
  * 하지만 대부분의 경우, 이런 위험을 감수할 필요는 없다고 본다.
