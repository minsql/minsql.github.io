---
title: MySQL 8.0 - 추가된 GIS functions
author: min_cho
created: 2019/01/19
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
## 개요

- Mobile과 APP의 중요성이 커지면서 한층 강화된 GIS 관련 function이 생성되었다.



------
## 사용예제

### ST_Distance_Sphere

```sql
MySQL  localhost:33060+ ssl  test  SQL > SELECT ST_Distance_Sphere(ST_GeomFromText('POINT(121.628530 38.915751)') , ST_GeomFromText('POINT(126.280975 33.348885)')) /1000 'From Seoul to Jeju (Km)';
+-------------------------+
| From Seoul to Jeju (Km) |
+-------------------------+
|       746.5614043137098 |
+-------------------------+
1 row in set (0.0004 sec)
```

진행중....
