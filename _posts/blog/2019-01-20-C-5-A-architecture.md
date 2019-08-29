---
title: MySQL 8.0 - InnoDB Architecture 변경사항
author: min_cho
created: 2019/01/20
modified:
layout: post
tags: mysql mysql8
image:
  feature: mysql.png
categories: MySQL8
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


------
## 5.6

![MySQL 5.6 InnoDB Architecture](https://dev.mysql.com/doc/refman/5.6/en/images/innodb-architecture.png)



------

## 5.7

![MySQL 5.7 InnoDB Architecture](https://dev.mysql.com/doc/refman/5.7/en/images/innodb-architecture.png)

### 주요변경사항

- 5.6까지는 Undo logs가 무조건 System tablespace (ibdata1) 내에 존재해야 했다. 이는 Undo logs가 많이 사용되면 System tablespace 를 지속적으로 크게 사용할 수 있음을 의미하고  System tablespace 의 경우 shrink(사용하지 않는부분에 대해 사이즈를 줄일 수 있는) 가 불가능하여 전체 MySQL을 재구성해야 하는 어려움이 있었다. 이를 해결하고자 선택적으로 undo tablepsace를 System tablespace가 아닌 다른 영역에 둘 수 있도록 변경되었다.
- 5.6까지는 mysqld가 특정작업 (예를 들면, sort, aggregation..) 시에 지정된 temp 영역에 파일을 만들고 완료되면 지우는 일을 반복했다. 이는 많은 비용이 필요한 작업(file 생성 및 삭제)이었다. 5.7부터는 `temp 를 사용하는 테이블이 MyISAM에서 InnoDB로 변경됨 (internal_tmp_disk_storage_engine 로 조절가능) 에 따라 설정을 통해 이미 만들어 둔 ibd (ibtmp1) 를 사용할 수 있게되었다.`
- General Tablespace를 통해, 예전 System tablespace 의 장점 (데이터 파일 분산)을 지속적으로 사용가능하도록 만들면서, InnoDB Data Dictionary와 undo logs의 문제로 인해 데이터까지 사용할 수 없는 System tablespace의 단점을 보완하였다.



------

## 8.0

![MySQL 8.0 InnoDB Architecture](https://dev.mysql.com/doc/refman/8.0/en/images/innodb-architecture.png)



### 주요변경사항

- 5.7까지 System tablespace내에 존재하던 InnoDB Data Dictionary 가 내부적인 transaction 이 가능한 파일로 저장하게 되었다. 이로서, 가장 심각한 문제였던 "table이 alter되는 순간 crush" 를 rollback 가능하게 하였다.
- 5.7까지 선택적으로 제공되었던 Undo tablespace 의 위치를 필수적으로 system tablespace 밖으로 꺼내고 System이 사용하는 영역과 User가 사용하는 영역을 따로 두어 user undo tablspace에서 crash가발생시 해당 여파가 System 에 대해 영향을 주지 않도록 변경되었다.
- temp tablespace 역시, global과 session을 따로 만들어 관리의 효율성을 높였다.
