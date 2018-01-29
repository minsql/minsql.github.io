---
title: MySQL Cluster Overview
author: min_kim
created: 2014/11/12 00:48:00
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

# MySQL Cluster Overview

shared-nothing system으로 in-memory MySQL databases를 클러스터링해보자.  
* MySQL Cluster는 shared-nothing architecture으로 값싼 hardware를 사용해서 시스템을 구축할 수 있다.  

* MySQL Cluster는 single point of failure가 없는 디자인이다. shared-nothing system에서 각 component는 각각 its own memory and disk를 가진다. shared storage(NFS, SAN)을 사용하는 것은 권장하지도 지원하지도 않는다.  

* MySQL Cluster는 하나이상의 standard MySQL server와 in-memory clustered storage engine 즉 NDB(Network DataBase)를 결합한 시스템이다.  

* MySQL Cluster는 여러개의 host들로 구성되며, 이 호스트는 하나이상의 process를 기동한다. 이 프로세스는 nodes라고 불리고, MySQL server node(NDB 데이타 access하기 위한 인스턴스)들과 data node(데이타 스토리지)들, 하나이상의 Management Server로 구성된다. 다른 특화된 data access programs도 존재할수 있다. 이들 구성요소간의 관계도는 다음과 같다.  
  ![]({{site_url}}/uploads/cluster-components-11.png)


* table과 table data는 data nodes의 NDB storage engine에 저장되고, 이 table들은 모든 다른 MySQL servers(SQL nodes)에서 접근 가능하다.  

* MySQL Cluster SQL node가 mysqld server daemon을 사용하긴하지만, MySQL 5.6 distributions에서 제공하는 binary 버전과 몇가지 critical한 부분이 다르기 때문에 두 버전간에 호환은 안된다.  

* 그리고, MySQL Cluster에 연결되지 않은 MySQL server는 NDB storage engine에 access할 수 없다.  

* MySQL Cluster data node에 저장된 데이터는 mirror될수 있다. 개별 data node의 failure에 대해서, transaction state 손상에 의한 극소수의 transactions의 abort를 제외하곤 다른 영향없이 서비스를 지속할 수 있다. transnational application는 transaction failure에 대한 handling이 가능한 것으로 간주되기 때문에, 이것은 문제가 되지 않는다.  

* 각각의 nodes는 stop되거나 restart될수 있고, cluster system에 rejoin될수 있다. Rolling restart를 통해서 configuration 변경이나 software upgrades가 가능하다. 또한 Rolling restart를 통해 online data node 추가도 가능하다.  

* MySQL Cluster에 대한 backup, restore feature도 제공된다.  

* MySQL Cluster nodes는 노드간 통신 mechanism으로 TCP/IP(100 Mbps이상) 또는 SCI를 사용할 수 있다.
