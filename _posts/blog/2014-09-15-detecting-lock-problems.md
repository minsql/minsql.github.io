---
title: Detecting lock problems
author: min_kim
created: 2014/09/15
modified:
layout: post
tags: postgres, postgres_lock
image:
  feature: postgres.png
categories: Postgres
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# Detecting lock problems

* Find blocking SQL Queries

```sql
SELECT bl.pid as blocked_pid, a.usename as blocked_user, kl.pid as blocking_pid, ka.usename as blocking_user, a.query as blocked_statement
from pg_catalog.pg_locks bl join pg_catalog.pg_stat_activity a on bl.pid = a.pid join pg_catalog.pg_locks kl join pg_catalog.pg_stat_activity ka on kl.pid = ka.pid on bl.transactionid = kl.transactionid and bl.pid != kl.pid
where not bl.granted;  
```


> Reference: <https://wiki.postgresql.org/wiki/Lock_Monitoring>



  * Find a stuck lock

```sql
SELECT quote_ident(nspname) || '.' || quote_ident(relname) as table, a.query from pg_class c, pg_namespace n, pg_locks l, pg_stat_activity a  
where c.relnamespace = n.oid and l.relation = c.oid and l.granted = 't' and l.pid = a.pid and relation in (SELECT relation from pg_locks where granted = 'f');  
```

  * Running queries can be terminated with

    ```pg_cancel_backend(backend pid)```  





  * Un-responsive backends can be terminated with

    ```pg_terminate_backend (backend pid)```
