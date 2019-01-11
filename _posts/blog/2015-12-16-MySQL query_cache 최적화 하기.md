---
title: MySQL query_cache 최적화 하기
author: min_cho
created: 2015/12/16 19:44:50
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


# MySQL query_cache 최적화 하기

> **query_cache_type=0;**

일단 위의 세팅으로 최적화 할 수 있다. 만약 실행이 오래걸리고 똑같은 형태의 쿼리가 자주 들어오고 관련 테이블에 대한 DML 이 적다면 쓸만하지만, 대부분의 경우 문제를 일으키는 요소가 된다. query_cache가 예전 core 한 두개와 몇 MB를 가지는 서버에 맞게 예전에 디자인되었었기 때문이다. 문제요소는 다음과 같다.

  1. query_cache 는 single thread로 동작하기 때문에, 여러개의 thread가 동시에 일을 한다면 bottleneck 이 될 수 있다. (single thread lock 이 발생)
  2. query_cache 의 단편화가 발생되기 시작하면, 역시 성능을 떨어트리는 주범이 된다. 쓰려면 32M 정도가 적당하다. 몇 GB로 쓴다면 느려지는 원인이기도 하다 (리니어 서치를 진행)
`적중률 = (Qcache_hits / (Qcache_hits + Qcache_inserts + Qcache_not_cached)) * 100 `
