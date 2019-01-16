---
title: slave_sql_verify_checksum 성능에 미치는 영향
author: min_cho
created: 2013/12/17
modified:
layout: post
tags: mysql mysql_variables
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
---

# slave_sql_verify_checksum 성능에 미치는 영향

### slave_sql_verify_checksum 

#### 이유

  * MySQL 5.6 신기능으로서, slave 의 sql이 정확한지 checksum 하는 기능
  * 해당기능이 cpu 사용량을 높일 수 있다는 가정으로 진행




#### 적용

  * 2013-12-11 오후 1:09

```sql
[db296][(none)]> set global slave_sql_verify_checksum=OFF;  
Query OK, 0 rows affected (0.00 sec)  
```

#### 결과

  * 크게 차이나지 않음 -_-;
