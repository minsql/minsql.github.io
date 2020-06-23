---
title: MySQL 8.0 - 기본 CharacterSet 의 변경
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
## 기본 CharacterSet 의 변경 (latin1 > utf8mb4)

버젼별 비교

- 5.7

  ```sql
  mysql 5.7 [localhost] {msandbox} ((none)) > show session variables like '%char%';
  +--------------------------+----------------------------------------+
  | Variable_name            | Value                                  |
  +--------------------------+----------------------------------------+
  | character_set_client     | utf8                                   |
  | character_set_connection | utf8                                   |
  | character_set_database   | latin1                                 |
  | character_set_filesystem | binary                                 |
  | character_set_results    | utf8                                   |
  | character_set_server     | latin1                                 |
  | character_set_system     | utf8                                   |
  | character_sets_dir       | /MySQL/binaries/5.7.24/share/charsets/ |
  +--------------------------+----------------------------------------+
  8 rows in set (0.01 sec)

  mysql 5.7 [localhost] {msandbox} ((none)) > select * from information_schema.COLLATIONS where CHARACTER_SET_NAME='latin1' and IS_DEFAULT='Yes';
  +-------------------+--------------------+----+------------+-------------+---------+
  | COLLATION_NAME    | CHARACTER_SET_NAME | ID | IS_DEFAULT | IS_COMPILED | SORTLEN |
  +-------------------+--------------------+----+------------+-------------+---------+
  | latin1_swedish_ci | latin1             |  8 | Yes        | Yes         |       1 |
  +-------------------+--------------------+----+------------+-------------+---------+
  1 row in set (0.00 sec)
  ```

- 8.0

  ```sql
  mysql 8.0 [localhost] {msandbox} ((none)) >  show session variables like '%char%';
  +--------------------------+----------------------------------------+
  | Variable_name            | Value                                  |
  +--------------------------+----------------------------------------+
  | character_set_client     | utf8mb4                                |
  | character_set_connection | utf8mb4                                |
  | character_set_database   | utf8mb4                                |
  | character_set_filesystem | binary                                 |
  | character_set_results    | utf8mb4                                |
  | character_set_server     | utf8mb4                                |
  | character_set_system     | utf8                                   |
  | character_sets_dir       | /MySQL/binaries/8.0.13/share/charsets/ |
  +--------------------------+----------------------------------------+
  8 rows in set (0.00 sec)

  mysql 8.0 [localhost] {msandbox} ((none)) > select * from information_schema.COLLATIONS where CHARACTER_SET_NAME='utf8mb4' and IS_DEFAULT='Yes';
  +--------------------+--------------------+-----+------------+-------------+---------+---------------+
  | COLLATION_NAME     | CHARACTER_SET_NAME | ID  | IS_DEFAULT | IS_COMPILED | SORTLEN | PAD_ATTRIBUTE |
  +--------------------+--------------------+-----+------------+-------------+---------+---------------+
  | utf8mb4_0900_ai_ci | utf8mb4            | 255 | Yes        | Yes         |       0 | NO PAD        |
  +--------------------+--------------------+-----+------------+-------------+---------+---------------+
  1 row in set (0.01 sec)

  ```



> 드디어 기본 character set 과 collation 이 지긋지긋한 latin1 (latin1_swedish_ci) 에서 utf8mb4 (utf8mb4_0900_ai_ci) 로 변경이 되었고, 모든 작업이 utf8mb4 character set을 기본으로 동작하게 되었다. 기존에는 my.cnf 에 character-set-server = [utf8 | euckr | utf8mb4] 를 넣어 해당 mysqld의 기본 character set 을 지정해야만 했었다.



------
## 기본 collation의 변경

기존의 collation 에서 'ci' (case insensitive (대소문자 구분하지 않음)) 와 'cs 혹은 bin' (case sensitive(대소문자 구분)) 만을 지원하였다면 추가적으로 Accent 에 관해서도 지원하게 되었다. 또한 PAD의 default 값이 변경되어, 사용 혹은 Migration후 주의깊게 사용되어져야 한다.

```txt
MySQL 8.0의 default collation은 utf8mb4_0900_ai_ci 이고, 이는 다음과 같은 내용을 포함한다

   * collation의 character set은 utf8mb4 이다. (utf8mb4)
   * Unicod 9.0의 문자를 표현한다. (0900)
   * Accent Insensitive Mode로 동작한다. (ai)
   * Case Insensitive Mode로 동작한다. (ci)

```

#### ai, as 의 생성

- ai : Accent Insensitive

- ac : Accent Sensitive

  ```sql
  mysql 8.0 [localhost] {msandbox} ((none)) > SET NAMES utf8mb4;
    Query OK, 0 rows affected (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > SELECT @@session.collation_connection;
    +--------------------------------+
    | @@session.collation_connection |
    +--------------------------------+
    | utf8mb4_0900_ai_ci             |
    +--------------------------------+
    1 row in set (0.00 sec)

  -- 기본 utf8mb4의 collation인 utf8mb4_0900_ai_ci는 Accent Insensitive 모드이다.

    mysql 8.0 [localhost] {msandbox} ((none)) > select if('ê' = 'e','True','False');
    +-------------------------------+
    | if('ê' = 'e','True','False')  |
    +-------------------------------+
    | True                          |
    +-------------------------------+
    1 row in set (0.00 sec)


  --^^ Accent Insensitive 모드에서는 if('ê' = 'e') 의 결과가 참이된다.


    mysql 8.0 [localhost] {msandbox} ((none)) > SET NAMES utf8mb4 COLLATE utf8mb4_0900_as_ci;
    Query OK, 0 rows affected (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > SELECT @@session.collation_connection;
    +--------------------------------+
    | @@session.collation_connection |
    +--------------------------------+
    | utf8mb4_0900_as_ci             |
    +--------------------------------+
    1 row in set (0.00 sec)

  --  Accent sensitive 모드로 변경해보자.

    mysql 8.0 [localhost] {msandbox} ((none)) > select if('ê' = 'e','True','False');
    +-------------------------------+
    | if('ê' = 'e','True','False')  |
    +-------------------------------+
    | False                         |
    +-------------------------------+
    1 row in set (0.00 sec)


  --^^ Accent Sensitive 모드에서는 if('ê' = 'e') 의 결과가 거짓이된다.
  ```



#### PAD의 추가

- MySQL은 전통적으로 데이터 값의 뒤 공백을 제거하고 비교하는 방법을 사용해왔다. 하지만 8.0부터는 Collation 에 따라, ORACLE 과 비슷하게 공백을 제거하지 않고 비교가 가능하다.

  ```sql
  mysql 8.0 [localhost] {msandbox} ((none)) > select * from information_schema.collations where COLLATION_NAME like 'utf8mb4_0900%' or COLLATION_NAME = 'utf8mb4_bin' or COLLATION_NAME like 'utf8mb4_general%';
  +--------------------+--------------------+-----+------------+-------------+---------+---------------+
  | COLLATION_NAME     | CHARACTER_SET_NAME | ID  | IS_DEFAULT | IS_COMPILED | SORTLEN | PAD_ATTRIBUTE |
  +--------------------+--------------------+-----+------------+-------------+---------+---------------+
  | utf8mb4_general_ci | utf8mb4            |  45 |            | Yes         |       1 | PAD SPACE     |
  | utf8mb4_bin        | utf8mb4            |  46 |            | Yes         |       1 | PAD SPACE     |
  | utf8mb4_0900_ai_ci | utf8mb4            | 255 | Yes        | Yes         |       0 | NO PAD        |
  | utf8mb4_0900_as_cs | utf8mb4            | 278 |            | Yes         |       0 | NO PAD        |
  | utf8mb4_0900_as_ci | utf8mb4            | 305 |            | Yes         |       0 | NO PAD        |
  +--------------------+--------------------+-----+------------+-------------+---------+---------------+
  5 rows in set (0.00 sec)
  ```

- **<u>기본적으로 collation을 따로 지정하지 않고 사용하는 경우 5.7과 8.0의 동작방식이 달라질 수 있음을 확인해야한다.</u>**

  5.7의 경우, 뒤에 나오는 모든 공백을 기본적으로 제거하고 비교하지만, 8.0의 경우 utf8mb4 character의 default collation 이 'NO PAD' 형식으로 동작함으로 공백을 제거하지 않고 비교함을 유의해야 한다.

  이는 WAS 의 connection string에서도 꼭 connectionCollation 을 지정해야하는 이유이기도 하다.

  - https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-reference-charsets.html

- 버젼별 비교

  - 5.7

    ```sql
    -- 5.7의 경우, PADDING에 대한 옵션이 존재하지 않음으로 모두 PAD SPACE (뒤의 공백제거) 로 처리된다.


    mysql 5.7 [localhost] {msandbox} (test) > SET NAMES utf8mb4;
    Query OK, 0 rows affected (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > SELECT @@session.collation_connection;
    +--------------------------------+
    | @@session.collation_connection |
    +--------------------------------+
    | utf8mb4_general_ci             |
    +--------------------------------+
    1 row in set (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > SELECT hex('a ' ), hex ('a'), 'a ' = 'a';
    +------------+-----------+------------+
    | hex('a ' ) | hex ('a') | 'a ' = 'a' |
    +------------+-----------+------------+
    | 6120       | 61        |          1 |
    +------------+-----------+------------+
    1 row in set (0.01 sec)

    --^^ PAD SPACE로 사용됨으로 'a ' = 'a' 가 같음을 유의하자.




    mysql 5.7 [localhost] {msandbox} (test) > SET NAMES utf8mb4 COLLATE utf8mb4_bin;
    Query OK, 0 rows affected (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > SELECT @@session.collation_connection;
    +--------------------------------+
    | @@session.collation_connection |
    +--------------------------------+
    | utf8mb4_bin                    |
    +--------------------------------+
    1 row in set (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > SELECT hex('a ' ), hex ('a'), 'a ' = 'a';
    +------------+-----------+------------+
    | hex('a ' ) | hex ('a') | 'a ' = 'a' |
    +------------+-----------+------------+
    | 6120       | 61        |          1 |
    +------------+-----------+------------+
    1 row in set (0.00 sec)
    ```

  - 8.0

    ```sql
    -- 8.0의 경우, PADDING에 대한 옵션이 collation마다 다름으로 주의가 필요하다.


    mysql 8.0 [localhost] {msandbox} ((none)) > SET NAMES utf8mb4;
    Query OK, 0 rows affected (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > SELECT @@session.collation_connection;
    +--------------------------------+
    | @@session.collation_connection |
    +--------------------------------+
    | utf8mb4_0900_ai_ci             |
    +--------------------------------+
    1 row in set (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > SELECT hex('a ' ), hex ('a'), 'a ' = 'a';
    +------------+-----------+------------+
    | hex('a ' ) | hex ('a') | 'a ' = 'a' |
    +------------+-----------+------------+
    | 6120       | 61        |          0 |
    +------------+-----------+------------+
    1 row in set (0.00 sec)

    --^^ NO PAD로 사용됨으로 'a ' = 'a' 가 다름을 유의하자.



    mysql 8.0 [localhost] {msandbox} ((none)) > SET NAMES utf8mb4 COLLATE utf8mb4_bin;
    Query OK, 0 rows affected (0.01 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > SELECT @@session.collation_connection;
    +--------------------------------+
    | @@session.collation_connection |
    +--------------------------------+
    | utf8mb4_bin                    |
    +--------------------------------+
    1 row in set (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > SELECT hex('a ' ), hex ('a'), 'a ' = 'a';
    +------------+-----------+------------+
    | hex('a ' ) | hex ('a') | 'a ' = 'a' |
    +------------+-----------+------------+
    | 6120       | 61        |          1 |
    +------------+-----------+------------+
    1 row in set (0.00 sec)

    ```



#### SMP (Supplementary Multilingual Plane) 의 확장

- MySQL 을 사용함에 있어서 아주 유명한 Bug가 존재했다.  (Case Insensitive  collation을 사용할때, 많은 이모지들이 같은 값으로 치부되는 버그)

  - https://bugs.mysql.com/bug.php?id=87700



- 이를 해결하기 위해서는 5.2 이상의 unicode를 지원하는 utf8mb4_unicode_520_ci collation을 사용하거나, binary 형태로 변경하여 사용을 해야하는 번거로움이 있었습니다.  하지만 8.0의 기본 collation 인 utf8mb4_0900_ai_ci 가 unicode 9.0을 지원하면서 부터 많은 추가적인 emoji의 연산이 가능해졌다.

- 버젼별비교

  - 5.7

    ```sql
    mysql 5.7 [localhost] {msandbox} (test) > SET NAMES utf8mb4;
    Query OK, 0 rows affected (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > show session variables like 'collation_connection';
    +----------------------+--------------------+
    | Variable_name        | Value              |
    +----------------------+--------------------+
    | collation_connection | utf8mb4_general_ci |
    +----------------------+--------------------+
    1 row in set (0.01 sec)

    mysql 5.7 [localhost] {msandbox} (test) > select HEX('🍣'), WEIGHT_STRING('🍣'), HEX(WEIGHT_STRING('🍣')),
    HEX('🍺'), WEIGHT_STRING('🍺'), HEX(WEIGHT_STRING('🍺')), '🍣' = '🍺' \G
    *************************** 1. row ***************************
                   HEX('?'): F09F8DA3
         WEIGHT_STRING('?'): ��
    HEX(WEIGHT_STRING('?')): FFFD
                   HEX('?'): F09F8DBA
         WEIGHT_STRING('?'): ��
    HEX(WEIGHT_STRING('?')): FFFD
                  '?' = '?': 1
    1 row in set (0.00 sec)

    --^^ 5.7까지 utf8mb4의 기본 collation의 emoji 비교가 정상적으로 이루어지지 않았다. HEX값이 다르더라도, collation을 비교할 수 있는 WEIGHT_STRING이 값을 처리하지 못했다.


    mysql 5.7 [localhost] {msandbox} (test) > set names utf8mb4 collate utf8mb4_unicode_ci;
    Query OK, 0 rows affected (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > show session variables like 'collation_connection';
    +----------------------+--------------------+
    | Variable_name        | Value              |
    +----------------------+--------------------+
    | collation_connection | utf8mb4_unicode_ci |
    +----------------------+--------------------+
    1 row in set (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > select HEX('🍣'), WEIGHT_STRING('🍣'), HEX(WEIGHT_STRING('🍣')),
    HEX('🍺'), WEIGHT_STRING('🍺'), HEX(WEIGHT_STRING('🍺')), '🍣' = '🍺' \G
    *************************** 1. row ***************************
                   HEX('?'): F09F8DA3
         WEIGHT_STRING('?'): ��
    HEX(WEIGHT_STRING('?')): FFFD
                   HEX('?'): F09F8DBA
         WEIGHT_STRING('?'): ��
    HEX(WEIGHT_STRING('?')): FFFD
                  '?' = '?': 1
    1 row in set (0.00 sec)

    --^^ 기본으로 제공되는 unicode에서도 같은 문제가 발생되었다.


    mysql 5.7 [localhost] {msandbox} (test) > set names utf8mb4 collate utf8mb4_unicode_520_ci;
    Query OK, 0 rows affected (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > show session variables like 'collation_connection';
    +----------------------+------------------------+
    | Variable_name        | Value                  |
    +----------------------+------------------------+
    | collation_connection | utf8mb4_unicode_520_ci |
    +----------------------+------------------------+
    1 row in set (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > select HEX('🍣'), WEIGHT_STRING('🍣'), HEX(WEIGHT_STRING('🍣')),
    HEX('🍺'), WEIGHT_STRING('🍺'), HEX(WEIGHT_STRING('🍺')), '🍣' = '🍺' \G
    *************************** 1. row ***************************
                   HEX('?'): F09F8DA3
         WEIGHT_STRING('?'): ���c
    HEX(WEIGHT_STRING('?')): FBC3F363
                   HEX('?'): F09F8DBA
         WEIGHT_STRING('?'): ���z
    HEX(WEIGHT_STRING('?')): FBC3F37A
                  '?' = '?': 0
    1 row in set (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > set names utf8mb4 collate utf8mb4_bin;
    Query OK, 0 rows affected (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > show session variables like 'collation_connection';
    +----------------------+-------------+
    | Variable_name        | Value       |
    +----------------------+-------------+
    | collation_connection | utf8mb4_bin |
    +----------------------+-------------+
    1 row in set (0.00 sec)

    mysql 5.7 [localhost] {msandbox} (test) > select HEX('🍣'), WEIGHT_STRING('🍣'), HEX(WEIGHT_STRING('🍣')),
    HEX('🍺'), WEIGHT_STRING('🍺'), HEX(WEIGHT_STRING('🍺')), '🍣' = '🍺' \G
    *************************** 1. row ***************************
                   HEX('?'): F09F8DA3
         WEIGHT_STRING('?'): �c
    HEX(WEIGHT_STRING('?')): 01F363
                   HEX('?'): F09F8DBA
         WEIGHT_STRING('?'): �z
    HEX(WEIGHT_STRING('?')): 01F37A
                  '?' = '?': 0
    1 row in set (0.00 sec)

    --^^ 해당문제를 피하기 위해서는 unicod 5.2가 구현된 utf8mb4_unicode_520_ci 혹은 binary 형태로 사용해야 했다.
    ```

  - 8.0

    ```sql
    mysql 8.0 [localhost] {msandbox} ((none)) > SET NAMES utf8mb4;
    Query OK, 0 rows affected (0.01 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > show session variables like 'collation_connection';
    +----------------------+--------------------+
    | Variable_name        | Value              |
    +----------------------+--------------------+
    | collation_connection | utf8mb4_0900_ai_ci |
    +----------------------+--------------------+
    1 row in set (0.03 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > select HEX('🍣'), WEIGHT_STRING('🍣'), HEX(WEIGHT_STRING('🍣')),
    HEX('🍺'), WEIGHT_STRING('🍺'), HEX(WEIGHT_STRING('🍺')), '🍣' = '🍺' \G
    *************************** 1. row ***************************
                   HEX('?'): F09F8DA3
         WEIGHT_STRING('?'):

    HEX(WEIGHT_STRING('?')): 130C
                   HEX('?'): F09F8DBA
         WEIGHT_STRING('?'): #
    HEX(WEIGHT_STRING('?')): 1323
                  '?' = '?': 0
    1 row in set (0.00 sec)

    --^^ 8.0의 경우, 기본적으로 unicode9.0을 사용함으로, 해당문제를 해결하였다.




    mysql 8.0 [localhost] {msandbox} ((none)) > set names utf8mb4 collate utf8mb4_unicode_ci;
    Query OK, 0 rows affected (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > show session variables like 'collation_connection';
    +----------------------+--------------------+
    | Variable_name        | Value              |
    +----------------------+--------------------+
    | collation_connection | utf8mb4_unicode_ci |
    +----------------------+--------------------+
    1 row in set (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > select HEX('🍣'), WEIGHT_STRING('🍣'), HEX(WEIGHT_STRING('🍣')),
    HEX('🍺'), WEIGHT_STRING('🍺'), HEX(WEIGHT_STRING('🍺')), '🍣' = '🍺' \G
    *************************** 1. row ***************************
                   HEX('?'): F09F8DA3
         WEIGHT_STRING('?'): ��
    HEX(WEIGHT_STRING('?')): FFFD
                   HEX('?'): F09F8DBA
         WEIGHT_STRING('?'): ��
    HEX(WEIGHT_STRING('?')): FFFD
                  '?' = '?': 1
    1 row in set (0.00 sec)

    --^^ 여전히 기본으로 제공되는 unicode에서도 문제가 발생된다. 이는 하위 호환성을 위함이다.


    mysql 8.0 [localhost] {msandbox} ((none)) > set names utf8mb4 collate utf8mb4_unicode_520_ci;
    Query OK, 0 rows affected (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > show session variables like 'collation_connection';
    +----------------------+------------------------+
    | Variable_name        | Value                  |
    +----------------------+------------------------+
    | collation_connection | utf8mb4_unicode_520_ci |
    +----------------------+------------------------+
    1 row in set (0.01 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > select HEX('🍣'), WEIGHT_STRING('🍣'), HEX(WEIGHT_STRING('🍣')),
    HEX('🍺'), WEIGHT_STRING('🍺'), HEX(WEIGHT_STRING('🍺')), '🍣' = '🍺' \G
    *************************** 1. row ***************************
                   HEX('?'): F09F8DA3
         WEIGHT_STRING('?'): ���c
    HEX(WEIGHT_STRING('?')): FBC3F363
                   HEX('?'): F09F8DBA
         WEIGHT_STRING('?'): ���z
    HEX(WEIGHT_STRING('?')): FBC3F37A
                  '?' = '?': 0
    1 row in set (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > set names utf8mb4 collate utf8mb4_bin;
    Query OK, 0 rows affected (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > show session variables like 'collation_connection';
    +----------------------+-------------+
    | Variable_name        | Value       |
    +----------------------+-------------+
    | collation_connection | utf8mb4_bin |
    +----------------------+-------------+
    1 row in set (0.00 sec)

    mysql 8.0 [localhost] {msandbox} ((none)) > select HEX('🍣'), WEIGHT_STRING('🍣'), HEX(WEIGHT_STRING('🍣')),
    HEX('🍺'), WEIGHT_STRING('🍺'), HEX(WEIGHT_STRING('🍺')), '🍣' = '🍺' \G
    *************************** 1. row ***************************
                   HEX('?'): F09F8DA3
         WEIGHT_STRING('?'): �c
    HEX(WEIGHT_STRING('?')): 01F363
                   HEX('?'): F09F8DBA
         WEIGHT_STRING('?'): �z
    HEX(WEIGHT_STRING('?')): 01F37A
                  '?' = '?': 0
    1 row in set (0.00 sec)
    ```
