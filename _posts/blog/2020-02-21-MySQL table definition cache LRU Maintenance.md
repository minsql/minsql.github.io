---
title: MySQL table definition cache LRU Maintenance
author: min_kim
created: 2020/02/21
modified:
layout: post
tags: mysql
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# MySQL InnoDB table definition cache LRU Maintenance
> InnoDB에서는 table definition cache를 server(frm) 와 engine level(InnoDB system table)에서 모두 관리합니다. sql을 실행할때마다, table definition 을 접근해야합니다. 이것을 frm file이나 system table에서 매번 가져와야한다면 엄청 느리겠지요. 그래서 MySQL은 이를 캐시하는 영역이 있습니다. table definition cache. 이를 어떻게 관리하는지 설명합니다.

## Server layer table definition cache
* The server layer table definition cache 는 hash table(table_def_cache)과 old_unused_share라는 linked list로 구성된다.
* Old_unused_share linked list 관리
  - 총 cache 수가 table_definition_cache 크기를 초과하는 경우 old_unused_share 목록 끝에서 제거합니다.

## InnoDB layer table definition cache
* 이것도 hash table과 LRU linked list로 구성된다.
* hash table 2개 : by name and id
* table_non_LRU
  - LRU list로 관리하지 않는 테이블. 이 테이블들은 캐시에서 제거되지 않는다.
  - System tables, such as sys_tables sys_columns sys_fields SYS_INDEXES, etc.
  - Tables with reference relationships (dict_foreign_add_to_cache)
  - Tables with full-text index (fts_optimize_add_table)
* table_LRU
  - table_non_LRU list에 포함되지 않는 테이블은 table_LRU list에 추가된다.
* LRU maintenance
  - 가장 자주 사용되는 테이블은 LRU head로 옮겨집니다. (dict_move_to_mru)
  - 그럼 어떤 테이블이 제거될까?
    - table reference count가 0인 것 (table->n_ref_count == 0)。
    - 해당 테이블의 인덱스의  adaptive hash reference count가 0인것 (btr_search_t->ref_count=0)。
  - 언제 제거하나?
    - main thread는 매 47 (SRV_MASTER_DICT_LRU_INTERVAL) 초마다 LRU list의 절반을 체크한다.
    - 총 cache 수가 table_definition_cache 크기를 초과하는 경우 eviction으로 marking한다.
    - LRU 끝에서 시작하여 eviction으로 marking된 테이블을 제거한다.(dict_make_room_in_cache)。

## Ref
http://www.programmersought.com/article/76881479806/
