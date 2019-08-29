---
title: MySQL 8.0 - Authentication_plugin 의 변경
author: min_cho
created: 2019/01/20
modified:
layout: post
tags: mysql mysql8
image:
  feature: mysql.png
categories: MySQL8
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


------
## 개요

- MySQL 8.0부터는 default_authentication_plugin 이 mysql_native_password 에서 caching_sha2_password 로 변경되었다. (MySQL 5.7까지는 mysql_native_password이 default 값이었으며,  sha2를 쓰기 위해서는 별도의 plugin 설치가 필요했다)

- mysql_native_password 의 경우 저장되어 있는 HASH code를 탈취하면, 취약점을 이용해 비록 시간이 걸리겠지만 비밀번호를 알아낼 수 있는 문제가 있었다.

  - 5.7까지의 MySQL의 mysql.user.authentication_string (5.6에서는 mysql.user.password) 의 값은 아래의 규칙을 따른다.

    ```sql
    SELECT CONCAT(``'*'``,UPPER(SHA1(UNHEX(SHA1(``"some_strings"``)))));
    ```

    > String을 SHA1으로 암호화 하고, 해당 내용을 UNHEX후 다시 SHA1으로 암호화하지만, SHA1 알고리즘은 충돌기법과 rainbow테이블을 이용하여 비밀번호가 노출될 수 있다. [[NIST Policy](https://csrc.nist.gov/Projects/Hash-Functions/NIST-Policy-on-Hash-Functions)] [[관련기사](http://www.zdnet.co.kr/view/?no=20170224153403)]

- 이를 막고자 MySQL 8.0부터는 좀 더 고도화된 SHA2암호화 기법을 기반으로 RSA key를 이용한 salt 추가 방법으로 더욱 보안을 강화시켰다. 이로서, 비밀번호가 같더라도 각기 다른 HASH code를 저장하게 되어 해당 HASH code가 탈취된다 하더라도 비밀번호를 알아내는것은 불가능에 가까워졌다.

- 하지만 단점으로는 여러번의 연산이 필요한데, 이를 보완하고자 MySQL은 sha2_password plugin이 아닌 caching_sha2_password plugin을 default plugin으로 사용한다. 차이점은 관련된 보안관련 key와 정보를 메모리에 저장하는가 아닌가에 대한 차이이다.



------

## 사용예제

- 8.0에서 password를 생성하는 예제이다.

  ```sql
  mysql> CREATE USER 'min_native_password1'@'localhost' IDENTIFIED WITH mysql_native_password BY 'min';
  Query OK, 0 rows affected (0.05 sec)

  mysql> CREATE USER 'min_native_password2'@'localhost' IDENTIFIED WITH mysql_native_password BY 'min';
  Query OK, 0 rows affected (0.00 sec)


  mysql> CREATE USER 'min_sha256_password1'@'localhost' IDENTIFIED WITH sha256_password BY 'min';
  Query OK, 0 rows affected (0.04 sec)

  mysql> CREATE USER 'min_sha256_password2'@'localhost' IDENTIFIED WITH sha256_password BY 'min';
  Query OK, 0 rows affected (0.11 sec)


  mysql> CREATE USER 'min_caching_sha2_password1'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'min';
  Query OK, 0 rows affected (0.04 sec)

  mysql> CREATE USER 'min_caching_sha2_password2'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'min';
  Query OK, 0 rows affected (0.00 sec)

  mysql> select user,host, plugin, authentication_string from mysql.user where user like 'min%' order by password_last_changed;
  +----------------------------+-----------+-----------------------+------------------------------------------------------------------------+
  | user                       | host      | plugin                | authentication_string                                                  |
  +----------------------------+-----------+-----------------------+------------------------------------------------------------------------+
  | min_native_password1       | localhost | mysql_native_password | *9E21D7C9BFE2F869A7DB7488D13C47E395408C1B                              |
  | min_native_password2       | localhost | mysql_native_password | *9E21D7C9BFE2F869A7DB7488D13C47E395408C1B                              |
  | min_sha256_password1       | localhost | sha256_password       | $5$Ye~8 %    2O*}F9B$BIwDvMezr1GCqbAs7BTinaYhXt2xvWP.mrr5FkbvWV9    |
  | min_sha256_password2       | localhost | sha256_password       | $5$-H[6\zs1)zH]PF
                                                                                      :*$ch/PKE0rKRDmzolsMtr9gZJsRJxKRm9goWNTXvn.y91    |
  1j8*D8n;r3RUUWK5keDdwWFjHqsOH3eNJ/RU/wCqzSzeNC6YfpI6 |2_password | $A$005$F}cJK{
  | min_caching_sha2_password2 | localhost | caching_sha2_password | $A$005$tD=atb4k2p    NmI
                                                                                             S8Id.qr.iHc/P6q9abb6RLKRyy7lMl3sy0o5M4N2tXM/ |
  +----------------------------+-----------+-----------------------+------------------------------------------------------------------------+

  6 rows in set (0.00 sec)

  --^^ min_sha256_password1, min_sha256_password2, min_caching_sha2_password1, min_caching_sha2_password2 는 모두 같은 패스워드 'min' 이지만, authentication_string은 다름을 유의하자.



  mysql> SELECT CONCAT('*',UPPER(SHA1(UNHEX(SHA1("min")))));
  +---------------------------------------------+
  | CONCAT('*',UPPER(SHA1(UNHEX(SHA1("min"))))) |
  +---------------------------------------------+
  | *9E21D7C9BFE2F869A7DB7488D13C47E395408C1B   |
  +---------------------------------------------+
  1 row in set (0.00 sec)

  --^^ min_native_password1, min_native_password2 는 plugin 이 mysql_native_password 로서 같은 authentication_string 을 갖는다.
  ----  authentication_string 의 값과 UPPER(SHA1(UNHEX(SHA1("min")))) 의 값은 동일하다.
  ---- salt가 없음으로 각 계정의 authentication_string 이 같다면, 각 계정은 같은 패스워드를 쓴다고 알 수 있다.
  ```



------

## 적용범위

- 일반적으로 caching_sha2_password plugin을 적용 (defult) 하는것이 mysql.user.authentication_string 의 HASH code가 노출되었을때, 보안상 안전하다.

- 낮은 버젼의 mysql client 혹은 library 사용하는 경우, caching_sha2_password plugin을 지원하지 못해 아래와 같은 에러를 만날 수 있다.

  ```bash
  MINCHO$ /MySQL/binaries/5.6.40/bin/mysql --user umin_caching_sha2_password1 -pmin --socket=/var/folders/7v/j50shy2154jcrmtvg71x262r0000gn/T/mysql_sandbox8013.sock

   Warning: Using a password on the command line interface can be insecure.
   ERROR 2059 (HY000): Authentication plugin 'caching_sha2_password' cannot be loaded: dlopen(/usr/local/mysql/lib/plugin/caching_sha2_password.so, 2): image not found
  ```

  1. 이때는 mysqld daemon과 같은 버젼의 mysql client tool을 혹은 sha2 password를 지원하는 최신버젼의 library를 사용한다.

  2. 이미 생성된 user의 plugin을 mysql_native_password 으로 아래와 같이 변경해주고

     ```sql
     ALTER USER 'username'@'ip_address' IDENTIFIED WITH mysql_native_password BY 'password';
     ```

     my.cnf 파일에 아래와 같이 추가하여, 새롭게 만들어진 계정이 caching_sha2_password plugin을 사용하지 못하도록 한다.

     ```
     [mysqld]
     ...
     default_authentication_plugin=mysql_native_password
     ```

- 부분을 추가하여, 새롭게 만들어진 계정이 caching_sha2_password plugin을 사용하지 못하도록 한다.
