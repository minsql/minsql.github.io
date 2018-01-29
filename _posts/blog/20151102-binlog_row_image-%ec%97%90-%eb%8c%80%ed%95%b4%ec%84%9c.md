title: binlog_row_image 에 대해서
link: http://minsql.com/mysql/binlog_row_image-%ec%97%90-%eb%8c%80%ed%95%b4%ec%84%9c/
author: michaela
description: 
post_id: 740
created: 2015/11/02 11:23:43
created_gmt: 2015/11/02 02:23:43
comment_status: open
post_name: binlog_row_image-%ec%97%90-%eb%8c%80%ed%95%b4%ec%84%9c
status: publish
post_type: post

# binlog_row_image 에 대해서

> binlog ROW format을 사용하는 경우, 사용할수 있는 binlog_row_image 파라메터에 대해서 알아본다.

### row change event image

  * _ROW based 의 경우, 각 row change event는 2개의 image를 포함한다._
  1. **before** image : update 되기 전의 row image
  2. **after** image : 변경된 row image 
    * delete시에는 before image만 로깅된다. (삭제로 인해 파급되는 다른 변경사항이 없다면)
    * insert시에는 after image만 로깅된다. (존재하는 동일한 row가 없다면)
    * update시에는 before/after image가 둘다 필요하다.

### row image의 최소화

원래 MySQL은 full row(모든 컬럼)를 로깅하는데 사실 두 이미지 모두 모든 컬럼을 포함할 필요는 없다. disk, memory, network 절약을 위해서 필요한 컬럼만 logging할수 있게 설정하는 파라메터를 제공하는데 그것이 binlog_row_image이다. 

#### 각 이미지가 필요로하는 최소 컬럼

  1. **before** image : row를 uniquely identify할 수 있는 컬럼셋 
    * pk가 있다면 pk
    * uk & not null이 있다면 그 uk
    * 없으면 모든 컬럼
  2. **after** image : 변경이 가해진 컬럼

### binlog_row_image 파라메터 설정값

  1. full(default) : 모든 컬럼 로깅
  2. minimal : 최소만 로깅
  3. noblob : row 식별에 불필요하거나 변경되지 않은 BLOB,TEXT 제와한 모든 컬럼 로깅

### binlog_row_images 설정시 주의사항

  * replication 구성시 주의 
    * 5.5 이전에는 full row images만 사용되었다.
    * 만약 5.6이후 master에서 5.5나 그 이전 slave로 replication 구성한다면 반드시 full을 사용한다.
  * minimal이나 noblob을 사용하는 경우 주의 
    * delete, update가 정확하게 잘 동작하려면 다음의 조건을 만족해야한다. 
      * source와 destination table에 모든 컬럼이 존재해야하며 순서와 데이터타입도 동일해야한다.
      * source와 destination table의 PK가 동일해야한다.
      * 다시말해, 테이블 정의가 동일해야한다. (PK가 아닌 secondary index들은 달라도 됨)
    * 만약 위 조건을 만족하지 않는 경우, destination table에서 제대로 match되는 row를 찾지 못할 가능성이 있고, 이 경우 warning이나 error없이 아무도 모르게 데이터가 깨질수가 있다.

## Comments

**[김광수](#10 "2015-12-16 15:50:38"):** 잘 보고 갑니다~ 후후후

**[MIN CHO](#11 "2015-12-16 19:21:33"):** 잘 보고 가세요~ 후후후

