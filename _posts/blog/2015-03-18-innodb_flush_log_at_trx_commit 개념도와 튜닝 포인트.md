---
title: innodb_flush_log_at_trx_commit 개념도와 튜닝 포인트
author: min_cho
created: 2015/03/18 20:12:54
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

# innodb_flush_log_at_trx_commit 개념도와 튜닝 포인트

![]({{site_url}}/uploads/innodb_flush_log_at_trx_commit.png)
[5.6 메뉴얼 : innodb_flush_log_at_trx_commit](\\"http://dev.mysql.com/doc/refman/5.6/en/innodb-parameters.html#sysvar_innodb_flush_log_at_trx_commit\\")

  * 위의 그림에서 알 수 있듯이, 해당 값에 따라 순간적인 장애시 트랜잭션을 잃을 수 있다.
    * 0 인 경우, MySQL 이나 OS가 갑자기 crash 된다면 최대 1초동안의 트랜잭션을 잃을 수 있다.
    * 1 인 경우, 안전하다.
    * 2 인 경우, OS가 갑자기 crash 된다면 최대 1초동안의 트랜잭션을 잃을 수 있다. 하지만 MySQL 장애시에는 이미 OS 영역으로 데이터는 넘어갔기 때문에 안전할 수 있다.
  * 각 값에 따라, 엄청난 성능을 보일 수 있다.
    * 지난번에 엄청난 양의 log를 위하여 MySQL을 사용하는 팀이 있었는데, 해당값을 1에서 0으로 수정함에 따라 성능이 7배 빨라지기도 했다.
    * 단순 select용의 slave나, 최대 1초정도의 트랜잭션은 무시할 수 있는 서비스 혹은 log를 저장할 서버라면 해당값을 1에서 0으로 변경할 수 있다.
    * MySQL을 가장 빠르고 쉽게 튜닝할 수 있는 parameter 중의 하나이다.
