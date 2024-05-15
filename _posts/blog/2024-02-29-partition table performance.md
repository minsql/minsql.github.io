---
title: MySQL Partition Table Performance
author: min_cho
created: 2024/02/29
modified:
layout: post
tags: mysql PartitionTable
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# Partition 테이블 장단점 비교
> 파티션 테이블은 성능이점이 아니라 운영이점에 의해서 선택합니다.   
그런데 성능이점은 과연 있을까 없을까?     
이번 아티클은 성능 관점에서 파티션 테이블의 장단점을 비교해보았습니다.

## Normal vs Partiton 생성
```sql
-- Normal Table
CREATE TABLE `tbl_normal` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int,
  `index_value` varchar(17),
  `col_a` varchar(10),
  `col_b` varchar(10),
  `col_c` varchar(10),
  `col_d` varchar(10),
  `col_e` varchar(10),  
  PRIMARY KEY (`id`),
  KEY `IX_colA` (`index_value`)
);

-- Partition Table
CREATE TABLE `tbl_partition` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `index_value` varchar(17),
  `col_a` varchar(10),
  `col_b` varchar(10),
  `col_c` varchar(10),
  `col_d` varchar(10),
  `col_e` varchar(10),
  PRIMARY KEY (`id`,`group_id`),
  KEY `IX_colA` (`index_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
PARTITION BY RANGE (`group_id`)
(PARTITION p0 VALUES LESS THAN (1),
 PARTITION p1 VALUES LESS THAN (2),
 ...
 PARTITION p10 VALUES LESS THAN MAXVALUE )  ;
```

## 장점
**1. 데이터 관리**

**2. Partition pruning이 잘 된 상태에서 partiton 내부에서 full (table|index) scan을 하는 경우의 성능향상**
```sql
SELECT * FROM tbl_partition WHERE group_id=1 AND index_value='aaa';
```

**3. 대량의 insert작업시, index 경합이 심하게 발생하는 경우 성능향상**
```
/u01/app/percona/bin/mysqlslap --user=kadba -pxxx --concurrency=50 --number-of-queries=50000000 --query="insert into tbl_normal (group_id, index_value, col_a, col_b, col_c, col_d, col_e ) values (round(rand()*10), unix_timestamp(now(6)), 'aaa','bbb','ccc','ddd','eee');"

* Index에 순차적인 데이터를 넣는 경우 unix_timestamp(now(6))
  * normal : 69454 QPS
  * partition : 74183 QPS
    * 6.8% 성능향상

* Index에 random 데이터를 넣는 경우 substring(uuid(),2,17)
  * normal : 69589 QPS
  * partition : 76149 QPS
    * 9.4% 성능향상
```

**4. File per table사용시, Directory 지정하여 File I/O 분산**
```sql
CREATE TABLE IF NOT EXISTS `tbl_partition` (
  `col1` int  NOT NULL)
  PARTITION BY RANGE COLUMNS(`col1`) (
    PARTITION `p_10` VALUES LESS THAN(10) DATA DIRECTORY = '/data1',
    PARTITION `p_20` VALUES LESS THAN(20) DATA DIRECTORY = '/data2',
    PARTITION `p_MAXVALUE` VALUES LESS THAN(MAXVALUE) DATA DIRECTORY = '/data3'
);
```


## 단점
**1.Query에 partition key가 없는 경우**
```sql
SELECT * FROM tbl_partition where index_value=3;
SELECT * FROM tbl t INNER JOIN tbl_partition tp ON t.id=tp.index_value;
```

**2. Unique key 사용의 어려움**
```sql
CREATE TABLE `tbl_partition` (
...
UNIQUE KEY (col_d)
...);

-- 오류발생
ERROR 1503 (HY000): A UNIQUE INDEX must include all columns in the tables partitioning function

-- col_d 만으로는 unique key를 설정할 수 없음.
CREATE TABLE `tbl_partition` (
...
UNIQUE KEY (col_d,group_id)
...);
```

**3. order by limit 1 쿼리의 한계**
```sql
SELECT * FROM tbl_partition WHERE index_value=10 ORDER BY group_id desc LIMIT 1;
```
* 예상 : 위와 같은 쿼리는 Partition key인 group_id 를 desc로 읽어 limit를 통해 원하는 row 가 확보되면 멈추는 쿼리로 대부분 마지막 최근 Partition 1개만 읽고 결과를 바로 낼것이라고 판단

* 실제 동작 : MySQL은 실행계획을 세우는 단계에서 모든 Partition들의 index에 존재하는 branch block을 읽어 대략적으로 return될 수 있는 값을 optimizer에게 전달하는 단계가 존재했고, 이때 많은 File I/O가 발생하며 느려지는것을 확인
```
T@4: | | | | | | | | | | | | | <ha_innopart::set_partition 1541
T@4: | | | | | | | | | | | | | >btr_cur_search_to_nth_level
T@4: | | | | | | | | | | | | | <btr_cur_search_to_nth_level 1964
T@4: | | | | | | | | | | | | | >btr_cur_search_to_nth_level
T@4: | | | | | | | | | | | | | <btr_cur_search_to_nth_level 1964
T@4: | | | | | | | | | | | | | info: part_id 0 rows 0
T@4: | | | | | | | | | | | | | >btr_cur_search_to_nth_level
T@4: | | | | | | | | | | | | | <btr_cur_search_to_nth_level 1964
T@4: | | | | | | | | | | | | | >btr_cur_search_to_nth_level
T@4: | | | | | | | | | | | | | <btr_cur_search_to_nth_level 1964
T@4: | | | | | | | | | | | | | info: part_id 1 rows 0 (0)
...
파티션 갯수만큼 btr_estimate_n_rows_in_range function에 의해 btr_cur_search_to_nth_level 호출 후 결과를 저장함.
...
T@4: | | | | | | | | | | | | | info: part_id 33 rows 0 (1)
T@4: | | | | | | | | | | | | | >btr_cur_search_to_nth_level
T@4: | | | | | | | | | | | | | <btr_cur_search_to_nth_level 1964
T@4: | | | | | | | | | | | | | >btr_cur_search_to_nth_level
T@4: | | | | | | | | | | | | | <btr_cur_search_to_nth_level 1964
T@4: | | | | | | | | | | | | | info: part_id 34 rows 0 (1)
T@4: | | | | | | | | | | | | | >btr_cur_search_to_nth_level
T@4: | | | | | | | | | | | | | <btr_cur_search_to_nth_level 1964
T@4: | | | | | | | | | | | | | >btr_cur_search_to_nth_level
T@4: | | | | | | | | | | | | | <btr_cur_search_to_nth_level 1964
T@4: | | | | | | | | | | | | | info: part_id 35 rows 1 (2)
T@4: | | | | | | | | | | | | <ha_innopart::records_in_range 3409
```

ha_innopart.cc
```c++
if (mode1 != PAGE_CUR_UNSUPP && mode2 != PAGE_CUR_UNSUPP) {
    n_rows = btr_estimate_n_rows_in_range(index, range_start, mode1, range_end,
                                          mode2);
    DBUG_PRINT("info", ("part_id %u rows %ld", part_id, (long int)n_rows));
    for (part_id = m_part_info->get_next_used_partition(part_id);
         part_id < m_tot_parts;
         part_id = m_part_info->get_next_used_partition(part_id)) {
      index = m_part_share->get_index(part_id, keynr);
      /* Individual partitions can be discarded
      we need to check each partition */
      if (index == NULL || dict_table_is_discarded(index->table) ||
          !index->is_usable(m_prebuilt->trx)) {
        n_rows = HA_POS_ERROR;
        mem_heap_free(heap);
        goto func_exit;
      }
      int64_t n = btr_estimate_n_rows_in_range(index, range_start, mode1,
                                               range_end, mode2);
      n_rows += n;
      DBUG_PRINT("info", ("part_id %u rows %ld (%ld)", part_id, (long int)n,
                          (long int)n_rows));
    }
  } else {
    n_rows = HA_POS_ERROR;
  }
```
*  Partition 을 한개만 탐색하게 하도록 소스 변경 후 업무에 적용
	* 3~4배 이상의 성능 향상


# TPC-C 성능비교
## 데이터 생성

```
--tables=1 --scale=100
+--------------------+------------+----------+---------+------------+
| TABLE_NAME         | TABLE_ROWS | DATA     | IDX     | TOTAL_SIZE |
+--------------------+------------+----------+---------+------------+
| sample.stock1      |    9792395 | 3330.00M | 168.77M | 3498.77M   |
| sample.order_line1 |   29500697 | 1974.00M | 893.00M | 2867.00M   |
| sample.customer1   |    2865234 | 1980.00M | 199.00M | 2179.00M   |
| sample.history1    |    2926527 | 270.80M  | 112.38M | 383.17M    |
| sample.orders1     |    3022653 | 134.80M  | 87.67M  | 222.47M    |
| sample.new_orders1 |     878216 | 28.56M   | 0.00M   | 28.56M     |
| sample.item1       |      99571 | 10.52M   | 0.00M   | 10.52M     |
| sample.district1   |       1000 | 0.25M    | 0.00M   | 0.25M      |
| sample.warehouse1  |        100 | 0.02M    | 0.00M   | 0.02M      |
+--------------------+------------+----------+---------+------------+
```

### Large Table (scale=1000)
```
./tpcc.lua --mysql-user=sysbench --mysql-password=sysbench --mysql-socket=/data1/mysql/mysql.sock --mysql-db=normal --threads=20 --tables=1 --scale=1000 prepare
```
### Sharding Table (tables=10)
```
./tpcc.lua --mysql-user=sysbench --mysql-password=sysbench --mysql-socket=/data1/mysql/mysql.sock --mysql-db=sharding --threads=20 --tables=10 --scale=100 prepare
```

### Partition Table

```sql
create table partition.customer1   like normal.customer1  ;  
create table partition.district1   like normal.district1  ;  
create table partition.history1    like normal.history1   ;  
create table partition.item1       like normal.item1      ;  
create table partition.new_orders1 like normal.new_orders1;  
create table partition.order_line1 like normal.order_line1;  
create table partition.orders1     like normal.orders1    ;  
create table partition.stock1      like normal.stock1     ;  
create table partition.warehouse1  like normal.warehouse1 ;  

insert into partition.customer1   select * from  normal.customer1  ;  
insert into partition.district1   select * from  normal.district1  ;  
insert into partition.history1    select * from  normal.history1   ;  
insert into partition.item1       select * from  normal.item1      ;  
insert into partition.new_orders1 select * from  normal.new_orders1;  
insert into partition.order_line1 select * from  normal.order_line1;  
insert into partition.orders1     select * from  normal.orders1    ;  
insert into partition.stock1      select * from  normal.stock1     ;  
insert into partition.warehouse1  select * from  normal.warehouse1 ;  

alter table order_line1 partition by range(ol_w_id)(
    partition p0 values less than (10),
    partition p1 values less than (20),
    partition p2 values less than (30),
    partition p3 values less than (40),
    partition p4 values less than (50),
    partition p5 values less than (60),
    partition p6 values less than (70),
    partition p7 values less than (80),
    partition p8 values less than (90),
    partition p9 values less than (100),
    partition p10 values less than maxvalue
);

alter table stock1 partition by range(s_w_id)(
    partition p0 values less than (10),
    partition p1 values less than (20),
    partition p2 values less than (30),
    partition p3 values less than (40),
    partition p4 values less than (50),
    partition p5 values less than (60),
    partition p6 values less than (70),
    partition p7 values less than (80),
    partition p8 values less than (90),
    partition p9 values less than (100),
    partition p10 values less than maxvalue
);
```

## 실행
```sh
$ nohup /bin/sh min.sh &

### 같은 테스트를 각각 5번실행
### Threads갯수는 2 4 8 16 32 64 로 테스트
### Table 형식은 normal sharding partition
### 하나의 테스트당 1800초 진행 후 100초 sleep
### 5 * 6 * 3 * 1900 초 필요  = 대얄 2일

ITERATIONS=(1 2 3 4 5)
THREADS=(2 4 8 16 32 64)

MYSQL_DB=(normal sharding partition)
TABLES=""
SCALE=""
ti="1800"

for (( i = 0 ; i < ${#ITERATIONS[@]} ; i++ ))
do
   for (( j = 0 ; j < ${#THREADS[@]} ; j++ ))
   do
      for (( k = 0 ; k < ${#MYSQL_DB[@]} ; k++ ))
      do
         if [ "sysbench" == "${MYSQL_DB[$k]}" ]; then
            SCALE=100
            TABLES=10
         else
            SCALE=1000
            TABLES=1
         fi
            echo `date`
            /usr/share/sysbench/tpcc.lua --mysql-user=sysbench --mysql-password=sysbench --mysql-socket=/data1/mysql/mysql.sock --mysql-db=${MYSQL_DB[$k]}  --threads=${THREADS[$j]}  --tables=$TABLES --scale=$SCALE  --time=${ti} --report-interval=1 run > /tmp/db_${MYSQL_DB[$k]}-thread_${THREADS[$j]}-iterate_${ITERATIONS[$i]}
            echo `date` >>  /tmp/db_${MYSQL_DB[$k]}-thread_${THREADS[$j]}-iterate_${ITERATIONS[$i]}
            sleep 100
       done
   done
done
```

## 결과
```sql
select table_struct,threads,avg(val) from result group by table_struct,threads order by 2,1;
  
+--------------+---------+------------+
| table_struct | threads | avg(val)   |
+--------------+---------+------------+
| normal       |       2 | 10435.0000 |
| partition    |       2 | 10558.2000 |
| shard        |       2 | 10210.4000 |
| normal       |       4 | 20475.6000 |
| partition    |       4 | 20529.2000 |
| shard        |       4 | 20775.6000 |
| normal       |       8 | 33098.4000 |
| partition    |       8 | 32694.6000 |
| shard        |       8 | 33175.8000 |
| normal       |      16 | 45337.2000 |
| partition    |      16 | 44803.2000 |
| shard        |      16 | 45769.8000 |
| normal       |      32 | 49930.2000 |
| partition    |      32 | 49510.2000 |
| shard        |      32 | 50330.4000 |
| normal       |      64 | 48988.4000 |
| partition    |      64 | 48933.6000 |
| shard        |      64 | 49145.6000 |
+--------------+---------+------------+
18 rows in set (0.00 sec)
```

