title: mysql client utility 와 -A 옵션
link: http://minsql.com/mysql/mysql-client-utility-%ec%99%80-a-%ec%98%b5%ec%85%98/
author: makayal46
description: 
post_id: 853
created: 2016/04/06 21:17:41
created_gmt: 2016/04/06 12:17:41
comment_status: open
post_name: mysql-client-utility-%ec%99%80-a-%ec%98%b5%ec%85%98
status: publish
post_type: post

# mysql client utility 와 -A 옵션

mysql client utility 는 기본적으로 데이터베이스를 use 하는 순간, 해당 database의 테이블을 비롯하여 컬럼까지 읽어들여 캐시에 저장한 후 자동완성 기능을 제공한다. \- <http://dev.mysql.com/doc/refman/5.6/en/mysql-command-options.html#option_mysql_auto-rehash> 이를 막고자, 접속시에 --no-auto-rehash 옵션을 두거나, -A 옵션을 사용할 수 있다. \- <http://dev.mysql.com/doc/refman/5.6/en/mysql-command-options.html#option_mysql_no-auto-rehash> 이때문에 간편하기도 하지만 테이블이 많아진다면, mysql client에서 use database; 시에 몇 초동안이나 기다려야 할 수도 있다. 서버가 바쁜경우는 더욱 오래걸린다. 아래는 간단한 예제이다. 
    
    
    ---- #no-auto-rehash (해당 옵션을 사용하지 않은 경우)
        [root@testvm2 db]# m
        Welcome to the MySQL monitor.  Commands end with ; or g.
        Your MySQL connection id is 34983
        Server version: 5.6.19-log MySQL Community Server (GPL)
    
        Copyright (c) 2000, 2014, Oracle and/or its affiliates. All rights reserved.
    
        Oracle is a registered trademark of Oracle Corporation and/or its
        affiliates. Other names may be trademarks of their respective
        owners.
    
        Type 'help;' or 'h' for help. Type 'c' to clear the current input statement.
    
        root@localhost:(none) 17:00:48>use test
        Reading table information for completion of table and column names
        You can turn off this feature to get a quicker startup with -A       <---- 익숙한 메세지지만, 내용인 즉 -A 를 사용해서 자동완성기능을 끌 수 있다는 것이다.
    
        Database changed
        root@localhost:test 17:00:55>      <-- tab을 두번 연속으로 누르게 된다면, mysql client tool 에서 실행할 수 있는 모든 명령어 및 table, column 들에 대한 정보들를 볼 수 있다.
        Display all 11054 possibilities? (y or n)  <--- table 이 100개 정도 되니.. 어마어마한 숫자가 캐시되었다.
    
    
    ---- no-auto-rehash (해당 옵션을 사용한 경우)
        [root@testvm2 db]# /db/5.6/bin/mysql -uroot
        Welcome to the MySQL monitor.  Commands end with ; or g.
        Your MySQL connection id is 357
        Server version: 5.6.19-log MySQL Community Server (GPL)
    
        Copyright (c) 2000, 2014, Oracle and/or its affiliates. All rights reserved.
    
        Oracle is a registered trademark of Oracle Corporation and/or its
        affiliates. Other names may be trademarks of their respective
        owners.
    
        Type 'help;' or 'h' for help. Type 'c' to clear the current input statement.
    
        root@localhost:(none) 17:07:07>use test
        Database changed
        root@localhost:test 17:07:10>       <-- tab을 눌러도 아무런 변화가 없습니다.
    

이와 같이 굳이 자동완성기능을 사용하지 않는경우, -A 옵션을 주는 것이 일반적이다. 또한 사용되지도 않을 테이블들을 모두 열어야 하기 때문에 서버가 바쁜경우라면 더욱 문제가 될 수 있다. 장애로 이어질 수도... 아래의 예제를 확인해보자 
    
    
    ---- no-auto-rehash
        root@localhost:test 17:08:48>show open tables;
        ...
        70 rows in set (0.00 sec)
    
        root@localhost:test 17:08:51> use test;
        Database changed
    
        root@localhost:test 17:08:55>show open tables;
        ...
        70 rows in set (0.00 sec) <-- 여전히 처음 시작할때의 70 개의 table 만을 열고 있다.
    
    
    ---- #no-auto-rehash
        root@localhost:(none) 17:10:53>show open tables;
        ...
        70 rows in set (0.01 sec)
    
        root@localhost:(none) 17:10:55> use test;
        Reading table information for completion of table and column names
        You can turn off this feature to get a quicker startup with -A
    
        Database changed
        root@localhost:test 17:11:02>show open tables;
        ...
        861 rows in set (0.02 sec) <-- 대략 800개의 테이블을 추가로 열었다.
    
        test database 의 모든 테이블을 열었다. 이는 엄청난 오버헤드를 발생시킨다.
            - http://dev.mysql.com/doc/refman/5.7/en/table-cache.html
    

혹은 범용적으로 사용될 수 있는 my.cnf 인 /etc/my.cnf 의 [mysql] 항목에 아래와 같이 명시하여, mysql client 가 실행될때 아래의 옵션에 따라 실행될 수 있도록 조절할 수 있다. 이 경우에는 굳이 -A 옵션을 주지 않아도 자동으로 비활성화 된다. 
    
    
    [mysql]
    no-auto-rehash
    show-warnings
    prompt=u@h:d_R:m:\s>
    

추가로 show-warnings 는 warning 이 발생하였을시, show warnings 로 확인하는 것이 아닌 바로 warning을 볼 수 있게 해주는 옵션이다 show warnings 를 치기 귀찮은 사람은 강추. prompt 옵션은 mysql> 대신 좀 더 유익한 정보를 찍어주는 옵션이다. 현재 접속된 host 및 database, 시간등...