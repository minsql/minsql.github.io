---
title: MySQL 8.0 - 추가된 String functions
author: min_cho
created: 2019/01/19
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

- MySQL 8.0 부터는 Regular Expression에 대한 String function 이 추가로 제공된다.
  - REGEXP_REPLACE()  : Regular Expression 으로 검색된 부분에 대해 정해진 값으로 치환한다.
  - REGEXP_INSTR() : Regular Expression 으로 검색된 부분의 문자의 위치를 나타낸다.
  - REGEXP_LIKE() : Regular Expression 으로 검색된 부분의 유무에 따라 TRUE, FALSE (1,0) 를 반환한다.
  - REGEXP_SUBSTR() : 특정위치부터 Regular Expression 으로 검색된 부분의 횟수를 통해 결과를 반환한다.



------
## 사용예제

### REGEXP_REPLACE

```sql
mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_REPLACE('010-2446-0111','[0-9]','*');
+---------------------------------------------+
| REGEXP_REPLACE('010-2446-0111','[0-9]','*') |
+---------------------------------------------+
| ***-****-****                               |
+---------------------------------------------+
1 row in set (0.00 sec)

--^^ 데이터중, 숫자를 찾게 되면, '*' 로 치환해라.


mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_REPLACE('010-2446-0111','[$&+,:;=?@#|<>.^*()%!-]','');
+--------------------------------------------------------------+
| REGEXP_REPLACE('010-2446-0111','[$&+,:;=?@#|<>.^*()%!-]','') |
+--------------------------------------------------------------+
| 01024460111                                                  |
+--------------------------------------------------------------+
1 row in set (0.00 sec)

--^^ 데이터중, 특수문자를 모두 제거해라.


mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_REPLACE('010-2446-0111','[0-9]','*',10);
+------------------------------------------------+
| REGEXP_REPLACE('010-2446-0111','[0-9]','*',10) |
+------------------------------------------------+
| 010-2446-****                                  |
+------------------------------------------------+
1 row in set (0.00 sec)

--^^ 데이터중, 10번째 자리 이후부터는 모두 '*' 로 치환해라.


mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_REPLACE('010-2446-0111','[0-9]','*',10,3);
+--------------------------------------------------+
| REGEXP_REPLACE('010-2446-0111','[0-9]','*',10,3) |
+--------------------------------------------------+
| 010-2446-01*1                                    |
+--------------------------------------------------+
1 row in set (0.00 sec)

--^^ 데이터중, 10번째 자리 이후부터는 숫자로 된 값을 찾아 3번째 값을 '*' 로 치환해라.
```



### REGEXP_INSTR

```sql
mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_INSTR('한국 korea홧팅 (1센터)','[가-힣]');
+----------------------------------------------------------+
| REGEXP_INSTR('한국 korea홧팅 (1센터)','[가-힣]')         |
+----------------------------------------------------------+
|                                                        1 |
+----------------------------------------------------------+
1 row in set (0.00 sec)

--^^ 데이터중 한글은 첫번째 자리에서 확인된다.


mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_INSTR('한국 korea홧팅 (1센터)','[가-힣]',3);
+------------------------------------------------------------+
| REGEXP_INSTR('한국 korea홧팅 (1센터)','[가-힣]',3)         |
+------------------------------------------------------------+
|                                                          9 |
+------------------------------------------------------------+
1 row in set (0.01 sec)
--^^ 3번째 이후 데이터중 한글은 9번째 자리에서 확인된다.


mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_INSTR('한국 korea홧팅 (1센터)','[A-Za-z]');
+---------------------------------------------------------+
| REGEXP_INSTR('한국 korea홧팅 (1센터)','[A-Za-z]')       |
+---------------------------------------------------------+
|                                                       4 |
+---------------------------------------------------------+
1 row in set (0.00 sec)

--^^ 데이터중 알파벳은 네번째 자리에서 확인된다.


mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_INSTR('한국 korea홧팅 (1센터)','[A-Z]');
+------------------------------------------------------+
| REGEXP_INSTR('한국 korea홧팅 (1센터)','[A-Z]')       |
+------------------------------------------------------+
|                                                    4 |
+------------------------------------------------------+
1 row in set (0.00 sec)

--^^ korea는 대문자가 아님에도 불구하고 네번째 자리의 결과를 나타낸다.


mysql 8.0 [localhost] {msandbox} ((none)) > select @@session.collation_connection;
+--------------------------------+
| @@session.collation_connection |
+--------------------------------+
| utf8mb4_0900_ai_ci             |
+--------------------------------+
1 row in set (0.00 sec)


mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_INSTR('한국 korea홧팅 (1센터)' COLLATE utf8mb4_bin,'[A-Z]');
+--------------------------------------------------------------------------+
| REGEXP_INSTR('한국 korea홧팅 (1센터)' COLLATE utf8mb4_bin,'[A-Z]')       |
+--------------------------------------------------------------------------+
|                                                                        0 |
+--------------------------------------------------------------------------+
1 row in set (0.00 sec)

--^^ 이유는 위와 같이 현재의 default collation이 Case Insensitive (utf8mb4_0900_ai_ci) 이기 때문이다.


mysql 8.0 [localhost] {msandbox} ((none)) > set names utf8mb4 collate utf8mb4_bin;
Query OK, 0 rows affected (0.00 sec)

mysql 8.0 [localhost] {msandbox} ((none)) > select @@session.collation_connection;
+--------------------------------+
| @@session.collation_connection |
+--------------------------------+
| utf8mb4_bin                    |
+--------------------------------+
1 row in set (0.00 sec)

mysql 8.0 [localhost] {msandbox} ((none)) > SELECT REGEXP_INSTR('한국 korea홧팅 (1센터)','[A-Z]');
+------------------------------------------------------+
| REGEXP_INSTR('한국 korea홧팅 (1센터)','[A-Z]')       |
+------------------------------------------------------+
|                                                    0 |
+------------------------------------------------------+
1 row in set (0.00 sec)

--^^ Collation을 Case Sensitive (utf8mb4_bin) 로 변경하면, 원하던 정상적인 결과가 나타난다.
```



### REGEXP_LIKE

```sql
-- 위의 3개의 CASE 와는 달리 비교적 WHERE 구문에 자주 쓰일 수 있는 function이다. 이미 이전 버젼에서도 regexp 혹은 rlike 구문을 통해 사용가능했다.


-- 테스트를 위해 '010-2446-0111' 와 '010-2446-0113' 를 갖는 임시테이블 cte를 생성한다.


mysql 8.0 [localhost] {msandbox} ((none)) > WITH cte (phone_number) AS
    -> (SELECT '010-2446-0111' UNION ALL SELECT '010-2446-0113')
    -> SELECT * FROM cte WHERE REGEXP_LIKE (phone_number, '[1]{3}');
+---------------+
| phone_number  |
+---------------+
| 010-2446-0111 |
+---------------+
1 row in set (0.00 sec)


--^^ '1'이라는 숫자가 연속 3번 들어간 전화번호를 패턴매칭을 이용하여 찾는다.


mysql 8.0 [localhost] {msandbox} ((none)) > WITH cte (phone_number) AS
    -> (SELECT '010-2446-0111' UNION ALL SELECT '010-2446-0113')
    -> SELECT * FROM cte WHERE phone_number REGEXP '[1]{3}';
+---------------+
| phone_number  |
+---------------+
| 010-2446-0111 |
+---------------+
1 row in set (0.00 sec)


--^^ 이는 예전버젼에서 REGEXP 혹은 RLIKE를 통해 패턴매칭을 이용할 수 있었다.



mysql 8.0 [localhost] {msandbox} ((none)) > WITH cte (phone_number) AS
    -> (SELECT '010-2446-0111' UNION ALL SELECT '010-2446-0113')
    -> SELECT * FROM cte WHERE NOT REGEXP_LIKE (phone_number, '[1]{3}');
+---------------+
| phone_number  |
+---------------+
| 010-2446-0113 |
+---------------+
1 row in set (0.01 sec)


--^^ NOT 구문을 통해 '1'이 3번 연속 나오지 않는 전화번호를 찾을 수도 있다.
```
