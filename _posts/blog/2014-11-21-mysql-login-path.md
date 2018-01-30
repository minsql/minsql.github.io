---
title: MySQL login-path
author: min_cho
created: 2014/11/21 05:08:49
modified:
layout: post
tags: MySQL
image:
  feature: mysql.png
categories: blog
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---



# MySQL login-path

## 소개

Shell program을 이용하여 무언가를 만든다면, 5.6 부터 소개된 'Warning: Using a password on the command line interface can be insecure.' 에 상당한 귀찮음을 느꼈을 것이다.

```
[mysql@alpha ~]$ /db/5.6/bin/mysql -udba -pdba -s -N -e 'select NOW()'

Warning: Using a password on the command line interface can be insecure.
2014-11-20 10:40:03
```

물론 아래와 같이 처리할 수도 있다.

```    
[mysql@alpha ~]$ /db/5.6/bin/mysql -udba -pdba -s -N -e 'select NOW()' 2>1
2014-11-20 10:40:23
```

하지만... login-path 를 사용해보자. 이는 새롭게 추가된 기능으로 필요할때 사용한다면, 아주 효과적이다. Shell 프로그램을 위하여 비밀번호를 숨겨놓지 않아도 되고, 서버의 MySQL password를 어디선가 열심히 찾지 않아도 된다. 해당 유저로 접속만 하면 끝!

## 예제

```    
[mysql@alpha ~]$ /db/5.6/bin/mysql_config_editor print --all
[mysql@alpha ~]$ /db/5.6/bin/mysql_config_editor set --login-path=mincho --host=localhost --user=dba --password
Enter password:
```

* socket도 설정가능하다. remote 서버도 설정 가능하다. 만들어진 유저를 확인해보자.

```    
[mysql@alpha ~]$ /db/5.6/bin/mysql_config_editor print --all
[mincho]
user = dba
password = *****
host = localhost
```

해당 파일은 인코딩되어 유저 홈의 .mylogin.cnf 로 위치한다.

```    
[mysql@alpha ~]$ ls -al ~/.mylogin.cnf
-rw-------. 1 mysql mysql 120 Nov 20 10:42 /home/mysql/.mylogin.cnf

```

이제 login-path를 통하여 MySQL에 접속 후 쿼리를 실행해보자. 물론 login-path는 mysqldump시에도 유용하게 쓰일 수 있다.


```  
[mysql@alpha ~]$ /db/5.6/bin/mysql --login-path=mincho -s -N -e 'select NOW()'
2014-11-20 10:48:34

[root@alpha monitor]# /db/5.6/bin/mysql --login-path=mincho
Welcome to the MySQL monitor. Commands end with ; or g.
Your MySQL connection id is 79
Server version: 5.6.19-log MySQL Community Server (GPL)

Copyright (c) 2000, 2014, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or 'h' for help. Type 'c' to clear the current input statement.

mysql>

[mysql@alpha ~]$ /db/5.6/bin/mysqldump --login-path=mincho --socket=/tmp/mysql.sock --all-databases

```

* 참고 페이지 <http://dev.mysql.com/doc/refman/5.6/en/mysql-config-editor.html>
