title: 유용한 mysql client tool 옵션 (my.cnf 에 설정)
link: http://minsql.com/mysql/%ec%9c%a0%ec%9a%a9%ed%95%9c-mysql-client-tool-%ec%98%b5%ec%85%98-my-cnf-%ec%97%90-%ec%84%a4%ec%a0%95/
author: makayal46
description: 
post_id: 778
created: 2015/12/17 20:36:06
created_gmt: 2015/12/17 11:36:06
comment_status: open
post_name: %ec%9c%a0%ec%9a%a9%ed%95%9c-mysql-client-tool-%ec%98%b5%ec%85%98-my-cnf-%ec%97%90-%ec%84%a4%ec%a0%95
status: publish
post_type: post

# 유용한 mysql client tool 옵션 (my.cnf 에 설정)

현재 내가 사용하는 my.cnf 에는 다음과 같은 내용이 명시되어 있다. [mysqld] 가 아닌 [mysql] 에 명시해야 한다. 
    
    
    my.cnf
    
    [mysql]
    prompt=(\U) {\h}[\d] \R:\m:\s>_
    pager=head -n 50
    show-warnings
    i-am-a-dummy
    no-auto-rehash
    

### prompt=(\\U) {\\h}[\\d] \\R:\\m:\\s>\_

  * 접속 시 prompt 에 보여 줄 내용을 명시한다. default 로는 mysql (자세한 옵션은 아래 메뉴얼에 존재한다.) Host 정보를 통해 실수를 줄이거나 실행시간을 체크해 볼 수 있다. TEST DB로 착각하고 데이터베이스를 drop 한 기억이... ㄷㄷㄷ 
    * <http://dev.mysql.com/doc/refman/5.6/en/mysql-commands.html>
  * my.cnf에 명시할 수도 있고, mysql에서 직접 필요할때만 (시간측정을 통한 test) 실행할 수 도 있다. 
    * 직접 실행하는 경우는 mysql client tool 에서 `mysql> prompt (U) {h}[d] R:m:s>_ `를 실행한다.
    
    
    [root@testvm2 ~]# /db/5.6/bin/mysql --defaults-file=/db/5.6/conf/my.cnf -uroot --host=192.168.74.203
    Welcome to the MySQL monitor.  Commands end with ; or g.
    Your MySQL connection id is 1152
    Server version: 5.6.27-enterprise-commercial-advanced-log MySQL Enterprise Server - Advanced Edition (Commercial)
    
    Copyright (c) 2000, 2014, Oracle and/or its affiliates. All rights reserved.
    
    Oracle is a registered trademark of Oracle Corporation and/or its
    affiliates. Other names may be trademarks of their respective
    owners.
    
    Type 'help;' or 'h' for help. Type 'c' to clear the current input statement.
    
    (root@192.168.74.202) {192.168.74.203}[(none)] 07:33:36> 
    (root@192.168.74.202) {192.168.74.203}[(none)] 07:34:55> use test
    Database changed
    (root@192.168.74.202) {192.168.74.203}[test] 07:34:56> 
    
    

### pager=head -n 50

  * pager는 결과값을 OS 명령어를 통해 이용할 수 있게 해준다. 잘 이용하면 아주 유익하게 사용할 수 있다. 결과만을 다른 파일로 저장할 수도 있고 less 를 사용하여 스크롤을 안 할 수 있다. 나는 주로 많은 양의 데이터를 테스트할때 이용하는데, 10000 row가 select 되었더라도 화면에 뿌려지는 것은 앞에서 50개로 자를 수 있다. 
    * 직접 실행하는 경우는 mysql client tool 에서 `mysql> pager less -n -i -F -X -E` 를 실행한다.
    * <http://dev.mysql.com/doc/refman/5.6/en/mysql-commands.html>
    * 물론 head, less, cat | > 등도 모두 사용가능하다.
    * 해당내용은 mysql>s 를 통해 확인가능하다. (s, status 명령어는 통계를 잽싸게 보는데도 유리하다.)
    
    
    
    (root@192.168.74.202) {192.168.74.203}[test] 07:40:49> select * from test.abcd limit 10000;
    +------+------------------------------------------------------------------------------------------------------+
    | a    | b                                                                                                    |
    +------+------------------------------------------------------------------------------------------------------+
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv |
    |    2 | cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc |
    |    2 | dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd |
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv |
    |    2 | cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc |
    |    2 | dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd |
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv |
    |    2 | cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc |
    |    2 | dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd |
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv |
    |    2 | cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc |
    |    2 | dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd |
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv |
    |    2 | cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc |
    |    2 | dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd |
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv |
    |    2 | cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc |
    |    2 | dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd |
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv |
    |    2 | cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc |
    |    2 | dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd |
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv |
    |    2 | cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc |
    |    2 | dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd |
    |    1 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    |    2 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |