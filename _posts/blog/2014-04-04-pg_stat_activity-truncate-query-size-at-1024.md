---
title: pg_stat_activity truncate query size at 1024
author: min_kim
created: 2014/04/04 01:56:00
modified:
layout: post
tags: postgres postgres_parameters
image:
  feature: postgres.png
categories: Postgres
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# pg_stat_activity truncate query size at 1024

pg_stat_activity로 쿼리 모니터링을 하는데 짤려서 보임.  
1024까지만 보여주도록 설정되어있기 때문..  
우리의 긴 쿼리에게는 너무 짧은 숫자.  
방법은 해당 parameter늘리거나.  
query식별가능하도록 comment 사용하거나.  


#### 1. tune "track_activity_query_size" parameter..
unfortunately it is not dynamic parameter.
> track_activity_query_size (integer)

> Specifies the number of bytes reserved to track the currently executing command for each active session, for the `pg_stat_activity`.`current_query` field. The default value is 1024. _This parameter can only be set at server start._

```sql
postgres=# show track_activity_query_size;  
 track_activity_query_size   
---------------------------  
 1024  
(1 row)  
```
#### 2. Use query-identified comment
```sql
select /* user statistics */  
col1, col2,...  
from ...
```
