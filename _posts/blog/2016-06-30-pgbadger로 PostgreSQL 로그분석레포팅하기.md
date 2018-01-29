---
title: pgbadger로 PostgreSQL 로그분석레포팅하기
author: min_kim
created: 2016/06/30 13:39:49
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

# pgbadger로 PostgreSQL 로그분석레포팅하기

## pgBadger - a fast PostgreSQL log analysis report

> 너무 간단해서 쓸것도 없지만, 기록을 남겨두겠음

### 1\. 설치

  * 최신버전 다운로드 후 압축해제: https://github.com/dalibo/pgbadger/releases/latest

```
wget https://github.com/dalibo/pgbadger/archive/v8.1.tar.gz
tar xzf pgbadger-8.1.tar.gz
```

  * 설치
    * root user로

```
# cd pgbadger-8.1
# perl Makefile.PL
Checking if your kit is complete...
Looks good
Writing Makefile for pgBadger
Writing MYMETA.yml and MYMETA.json
# make && make install
Installing /usr/local/share/man/man1/pgbadger.1p
Installing /usr/local/bin/pgbadger
Appending installation info to /usr/lib64/perl5/perllocal.pod
```

### 2\. PostgreSQL 관련 파라메터 설정

  * log_min_durtion_statement를 0 이상으로 설정하자. 0은 모든 문장을 로깅하므로, 서비스서버에서는 알맞는 duration을 지정한다.
  * log_line_prefix
    * 'stderr' log format을 사용하는 경우, log_line_prefix에 최소한 '%t [%p]: [%l-1] '(timestamp,process id,session line number)를 설정해야한다. user, dbname, application name, client ip까지 로깅하기를 원한다면, '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '을 사용하자.
    * syslog log format을 사용하는 경우, 'user=%u,db=%d,app=%aclient=%h '로 설정하자.

```
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

  * 추가 정보를 로깅하고 싶다면 다음의 파라메터를 활성화할수 있다.

```
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
log_error_verbosity = default
```

  * log_statement은 pgBadger로 parse되지 않으니 사용하지 않는다.
  * lc_messages는 C로 한다

```
lc_messages='C'
```

  * [Note] log_min_duration_statement, log_duration 설정관련 참조
    * 수행된 쿼리문장까지 로깅하고 싶다면 log_min_duration_statement 을 0이상으로 설정하여 사용한다. 쿼리문은 로깅하지 않고, 단지 수행시간과 횟수만 로깅하고 싶다면 log_min_duration_statement는 -1로 설정하여 disable하고, log_duration을 사용한다.
    * log_min_duration_statement을 사용하면 가장 수행시간이 많이 걸리는 쿼리에 대한 레포트를 생성할수 있다.

### 3\. 레포트생성

```
$ pgbadger  --prefix='%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '  logfile-Wed.log
[=============>           ] Parsed 1639250 bytes of 2842188 (57.68%), queries: 8
[========================>] Parsed 2842188 bytes of 2842188 (100.00%), queries: 17221, events: 21
LOG: Ok, generating html report...
```

간단하게 html output을 뽑아 볼수 있다.
![pgbadger_out](/wp-content/uploads/2016/06/pgbadger_out.png) 다른 옵션들은 필요하다면 사용해보시길.
* github 참조 <https://github.com/dalibo/pgbadger>
