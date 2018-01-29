title: 버젼에 따라 쿼리 실행하기
link: http://minsql.com/mysql/mysql_techtip/%eb%b2%84%ec%a0%bc%ec%97%90-%eb%94%b0%eb%9d%bc-%ec%bf%bc%eb%a6%ac-%ec%8b%a4%ed%96%89%ed%95%98%ea%b8%b0/
author: makayal46
description: 
post_id: 764
created: 2015/12/16 19:14:51
created_gmt: 2015/12/16 10:14:51
comment_status: open
post_name: %eb%b2%84%ec%a0%bc%ec%97%90-%eb%94%b0%eb%9d%bc-%ec%bf%bc%eb%a6%ac-%ec%8b%a4%ed%96%89%ed%95%98%ea%b8%b0
status: publish
post_type: post

# 버젼에 따라 쿼리 실행하기

예전 모니터링 스크립트를 만들때, 회사에는 MySQL 5.1, 5.5, 5.6 모두 존재하여 해당 버젼에 맞춰 스크립트를 짜고는 했다. 먼저 해당 버젼을 가져온 후 파싱하여 버젼에 맞는 쿼리를 실행하는... 예를 들면, 5.5 이상에서만 performance_schema를 실행할 수 있는데. 아래와 같이 명령어를 실행해도 5.1에서는 문제없이 실행된다. ` /_!50503 show engine performance_schema status */;  
/_!50503 select * from performance_schema.threads _/;  
/_!50503 select * from information_schema.innodb_trx */; ` 이와같이 주석코드를 이용하면 이 문제를 해결할 수 있다. 또한 mysqldump 로 sql을 내리면 다음과 같은 코드를 확인할 수 있다. ` ... DROP TABLE IF EXISTS `logs`; /_!40101 SET @saved_cs_client = @@character_set_client */; /_!40101 SET character_set_client = utf8 */; ... ` ** 위와 같은 포맷으로 /*!버젼 명령어 */; 를 명시하면 해당 버젼 이상에서만 쿼리가 실행되고 아닌 경우 에러 없이 0을 return 한다. ** 아래의 예제를 보자. 버젼은 5.6.19 지만 쿼리 앞의 버젼 정보에 따라, 실행이 될 수도 안될 수도 있다. ` ONE> select @@global.version; +------------------+ | @@global.version | +------------------+ | 5.6.19-log | +------------------+ 1 row in set (0.00 sec) ONE> /*!50620 select * from performance_schema.threads */; Query OK, 0 rows affected (0.00 sec) ONE> /*!50619 select * from performance_schema.threads */; +-----------+----------------------------------------+------------+---.. | THREAD_ID | NAME | TYPE | PR.. +-----------+----------------------------------------+------------+---.. | 1 | thread/sql/main | BACKGROUND | .. | 2 | thread/innodb/io_handler_thread | BACKGROUND | .. .. `