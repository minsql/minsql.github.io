---
title: MySQL convert to character set utf8mb4 using pt-osc
author: min_kim
created: 2019/09/20
modified:
layout: post
tags: mysql mysql_character_set
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# MySQL convert to character set
> mysql 전체 테이블의 character set을 일괄로 변경하고자 할때 온라인으로 변경하는 방법을 설명한다.


## ALTER TABLE .. convert to character set
* [Converting a character set](https://dev.mysql.com/doc/refman/5.7/en/innodb-online-ddl-operations.html#online-ddl-table-operations)
  - inplace : NO
  - Rebuild Table : YES
  - Permits DDL : No
* online ddl이 지원되지 않는다.
* online으로 작업하고 싶다면? **pt-online-schema-change** 를 사용한다.
  - pt-online-schema-change는 데이터를 chunk size 단위로 복사하면서, trigger로 변경분을 current, new table에 동시에 반영한다. 즉, 전체 데이터를 새 테이블에 새로운 character set으로 깔끔하게 쓰게 된다.

## Pre-requites
* character set변경이 가능한지 확인한다.
* 특히 character set 변경으로 character size가 변경되는 경우, (utf8 -> utf8mb4)라면 (3bytes->4bytes)로 크기가 변경되므로, mysql의 max row size, max index size를 초과하게 되지는 않는지 반드시 확인해야한다.

### Check table with no-pk
* pk가 없는 테이블은 pt-online-schema작업이 불가능하다.

```
SELECT
    t.table_schema, t.table_name
FROM information_schema.TABLES t
LEFT JOIN information_schema.KEY_COLUMN_USAGE AS c
ON (
       t.TABLE_NAME = c.TABLE_NAME
   AND c.CONSTRAINT_SCHEMA = t.TABLE_SCHEMA
   AND c.constraint_name = 'PRIMARY'
)
WHERE
    t.table_schema ='your_database_name'
AND c.constraint_name IS NULL;
```

-> pk를 생성해주거나, 그냥 DDL로 작업한다.

### Check table max size over 65536
* mysql table row length limitation : 65536

```
SELECT table_schema, table_name, sum(CHARACTER_MAXIMUM_LENGTH)*4
FROM information_schema.COLUMNS
WHERE  table_schema ='your_database_name'
GROUP BY 1,2
having sum(CHARACTER_MAXIMUM_LENGTH)*4 > 65535
```

-> 테이블 character set변경이 불가능하다. 정말 변환이 필요한 컬럼만 변경하도록 한다.

### Check index max size over 3072
* mysql index key length limitation : 3072 (innodb_large_prefix=ON)
* mysql index key length limitation : 767 (innodb_large_prefix=OFF)
* innodb_large_prefix에 따라서 key length 제한이 다르다. innodb_large_prefix를 사용하도록 미리 설정한다.

```
set global innodb_large_prefix=1;
```

* 그리고 large prefix의 제한도 넘기는 index가 있다면, prefix index가 되므로 constraints에 문제가 없는지 확인한다.

```
select s.table_name, s.index_name,sum(c.CHARACTER_MAXIMUM_LENGTH)*4
from information_schema.statistics s left join information_schema.COLUMNS c on (c.table_schema=s.table_schema and c.table_name=s.table_name and c.column_name=s.column_name)
WHERE  s.table_schema ='pinfo'
GROUP BY 1,2
having sum(c.CHARACTER_MAXIMUM_LENGTH)*4 > 3072
```


## pt-online-schema-change를 사용한 변경
* options들은 적당히 설정한다.
* 아래는 예제 스크립트이니 참조해서 알맞게 작성한다.
  - 다음은 테이블이 여러개일때, 로그와 수행시간 로그를 append하여 기록한다.
  - pt-online-schema-change output : ptosc_convert_charset.out
  - time output : time_ptosc.out

```
TBL_LIST="table1
table2"

for tn in $TBL_LIST;do
        echo $tn;
        \time -ao time_ptosc.out  pt-online-schema-change --alter "convert to character set utf8mb4 collate utf8mb4_general_ci, ROW_FORMAT=DYNAMIC"  D=your_database_name,t=$tn \
        --no-drop-old-table \
        --no-drop-new-table \
        --chunk-size=1000 \
        --sleep=0.01 \
        --defaults-file=/mysql/MyHome/my.cnf \
        --host=your_host \
        --port=your_port \
        --user=your_user \
        --password=your_password \
        --progress=time,30 \
        --max-load="Threads_running=100" \
        --critical-load="Threads_running=200" \
        --chunk-index=PRIMARY \
        --charset=utf8mb4 \
        --set-vars="tx_isolation='repeatable-read',binlog_format='statement'" \
        --no-check-alter \
        --execute >> ptosc_convert_charset.out 2>&1
done
```

## MySQL DDL로 변경
* pk없는 테이블만 대상

```
alter table your_no_pk_table convert to character set utf8mb4 collate utf8mb4_general_ci, ROW_FORMAT=DYNAMIC;
```
