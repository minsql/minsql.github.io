---
title: BLOB 저장방식 in InnoDB
author: min_kim
created: 2015/01/09 02:16:00
modified:
layout: post
tags: mysql mysql_innodb
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# BLOB 저장방식 in InnoDB

> 참고원문 : <http://www.percona.com/blog/2010/02/09/blob-storage-in-innodb/>

저장방식 부분에서 볼때, InnoDB에서는 BLOB, TEXT, long VARCHAR가 같은 방식으로 처리된다. 이하 BLOB으로 통일. InnoDB에 blob데이터가 어떻게 저장되나? 3가지 factor에 의해서 달라진다. _\- BLOB size_ _\- Full row size_ _\- InnoDB row format_ **row format이 COMPACT, REDUNDANT인 경우**

  * InnoDB 는 InnoDB page에 전체 row를 저장하려고 시도한다. 적어도 2 rows + some page data가 하나의 page에 들어갈수 있어야한다. 따라서 limit을 8000 bytes이다.(innodb_page_size가 default 16kb인 경우) 만약 row가 완벽하게 저장될수 있다면 innodb는 external blob storage pages를 사용하지 않고 원래 row Page에 데이터를 저장한다. 즉, 7KB의 blob은 하나의 page에 들어갈수 있다. 2개의 7KB blob을 가지는 rows를 생각해보자. 전체 row가 해당 page에 들어갈수 없으니, innodb는 일부분을 external blob pages에 저장해야한다. external blob page를 사용하더라도 각 blob의 first 768bytes씩은 row page에 저장된다. 결과적으로 2개의 7KB blob중 하나의 blob은 row page에 저장되고, 다른 하나는 768bytes는 row page에 나머지는 external page에 저장하게 될것이다.
  * first 768 bytes만 저장하는 방식은 어디에서 나왔을까. 사실 MySQL 내부적으로 blob의 일부분만 읽는 것이 최적화되어있지 않다. blob은 전체를 읽거나 읽지 않거나이다. blob조회가 일어나면 무조건 external page까지 읽는다. 아마 이 방식은 기존 코드에서 blob을 지원할때 코드를 simple하게 유지하기 위해서 나온 방식일 듯하다.
  * blob의 prefix가 row page에 저장되기 때문에 blob은 prefix index를 가질수 있다.
    * BLOB 및 TEXT 컬럼에 인덱스를 걸때는 prefix length를 지정해야한다.
      * CREATE TABLE test (blob_col BLOB, INDEX(blob_col(10)));
      * Prefixe는 최대 1000 bytes 까지 가능하다. (InnoDB table에서는 최대 767 bytes 임)
      * innodb_large_prefix 옵션이 5.6.3부터 나왔는데 3072 byte까지 올릴 수 있다. 테이블 row format을 ROW_FORMAT=DYNAMIC or ROW_FORMAT=COMPRESSED으로 생성한 경우 (물론 innodb_file_format=barracuda, innodb_file_per_table=true이어야함).
  * 또한 이 방식은 이상한 "bugs"를 일으키기도 한다. 200K blob은 쉽게 저장가능하지만, 10k blob 20개는 저장할 수 없다. 왜냐하면, 각 blob의 768bytes를 row page에 저장해야하는데 사이즈가 맞지 않기 때문이다.

```
    CREATE TABLE `staff_image20` (
    `staff_id` tinyint(3) unsigned NOT NULL,
    `first_name` varchar(45) NOT NULL,
    `last_name` varchar(45) NOT NULL,
    `image1` blob,
    `image2` blob,
    `image3` blob,
    `image4` blob,
    `image5` blob,
    `image6` blob,
    `image7` blob,
    `image8` blob,
    `image9` blob,
    `image10` blob,
    `image11` blob,
    `image12` blob,
    `image13` blob,
    `image14` blob,
    `image15` blob,
    `image16` blob,
    `image17` blob,
    `image18` blob,
    `image19` blob,
    `image20` blob
     );

    mysql> insert into staff_image20 (staff_id, first_name, last_name, image1)
        -> select 1, first_name, last_name, picture from sakila.staff where staff_id=1;
    cture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture from sakila.staff where staff_id=1;Query OK, 1 row affected (0.01 sec)
    Records: 1  Duplicates: 0  Warnings: 0

    mysql> insert into staff_image20
        -> select 2, first_name, last_name, picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture from sakila.staff where staff_id=1;
    ERROR 1118 (42000): Row size too large (> 8126). Changing some columns to TEXT or BLOB or using ROW_FORMAT=DYNAMIC or ROW_FORMAT=COMPRESSED may help. In current row format, BLOB prefix of 768 bytes is stored inline.

    mysql> insert into staff_image20 (staff_id, first_name, last_name, image1)
        -> select 3, first_name, last_name, concat(picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture,picture) from sakila.staff where staff_id=1;
    Query OK, 1 row affected, 1 warning (0.11 sec)
    Records: 1  Duplicates: 0  Warnings: 1
```

  *  한가지 더 염두해야하는 것은 external blob pages는 blobs 사이에서 shared가능하지 않다는 것이다. 각 blob은 1byte만 담고 있을지라도 16K 의 할당된 page를 혼자서 사용한다. 이는 비효율적이므로 한로우당 여러개의 blob컬럼을 가지기보다는 하나의 large blob으로 combine하는것을 권장한다. (compress해서 저장하는 방법이 있을수 있겠다)
  * 로우가 하나의 page에 저장될수 없으면 innodb는 자동으로 그중 몇몇을 externally 저장한다고 했다. 이부분은 document화되어있지 않아서 알수 없다. 게다가 column size에 따라서 row마다 저장방식이 다를 수도 있을 것이다. 어떤 컬럼을 inline store에 넣고 어떤 컬럼을 external storage에 넣을지 튜닝이 가능하도록 되길 바란다.
**row format이 DYNAMIC, COMPRESSED 경우**

  * BLOB 은 REDUNDANT(MySQL 4.1이하)와 COMPACT(MySQL 5.0 이상) format에서 비효율적이다. Barracuda InnoDB Plugin에서의 ROW_FORMAT=DYNAMIC 에서 향상이 있었다. 이 format에서는 전체 blob을 row page에 저장하거나 only 20 bytes의 BLOB pointer만을 저장한다. 여전히 BLOB은 prefix index를 가질 수 있다. 이 prefix 부분이 row page에 저장되어 있지 않아도 external page에 저장되어있더라도 prefix index를 생성할수 있는 것이다.
  * COMPRESSED row format은 blob handling에 있어 DYNAMIC과 비슷하다. 다만 이 포맷은 row page에 안들어가는 blob을 compress한다. (KEY_BLOCK_SIZE나 normal data, index page에 대한 compression이 활성화되어있지 않아도)
