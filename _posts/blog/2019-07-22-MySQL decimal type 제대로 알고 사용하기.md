---
title: MySQL decimal type 제대로 알고 사용하기
author: min_kim
created: 2019/07/22
modified:
layout: post
tags: mysql mysql_data_type
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

# decimal type 제대로 알고 사용하기
> mysql에서 실수를 표현할때는 보통 decimal 혹은 double을 사용하게 된다. 이 둘의 차이점이 무엇이고, decimal 을 사용하는 경우에 주의할 점을 기술한다.


## Decimal vs. double
* 고정소수점, 부동소수점의 차이이다. (컴퓨터개론에서 배울수 있었던 것 같은데..)
* fixed-point type (고정소수점)
  - INT
  - DECIMAL
  - Exact-value numeric literals
    - 정수부과 소수부으로 표시한 실수표현
    - Examples: 1, .2, 3.4, -5, -6.78, +9.10
* floating-point types (부동소수점)
  - FLOAT
  - DOUBLE
  - Approximate-value numeric literals
    - 가수부와 지수부로 표시한 실수표현
    - Examples: 1.2E3, 1.2E-3, -1.2E3, -1.2E-3
    - 범위를 넘어가면 근사값을 저장함.

## 정확한 값을 저장하려면 Decimal
- 정확한 값을 다루고 계산하려면 Decimal타입을 사용한다.
- 단, precision, scale(M,D)자릿수를 정확하게 정의하도록 한다.

## MySQL Float, Double의 accuracy?
- 근사값이다!
- Float는 4bytes, Double은 8bytes
- Double에서 대략 15자리까지만 정확하다.(?)
- **A double-precision floating-point number is accurate to approximately 15 decimal places.**
  - https://dev.mysql.com/doc/refman/5.7/en/numeric-type-overview.html

## Decimal사용시 주의할점
- Approximate-value numeric literals을 사용하면 근사값이다.
```
root@localhost:test 18:47:42>select 1.234567890123456e-1;
+----------------------+
| 1.234567890123456e-1 |
+----------------------+
|   0.1234567890123456 |
+----------------------+
1 row in set (0.00 sec)

root@localhost:test 18:51:17>select 1.2345678901234563e-1, 1.2345678901234564e-1, 1.2345678901234565e-1, 1.2345678901234566e-1, 1.2345678901234567e-1;
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| 1.2345678901234563e-1 | 1.2345678901234564e-1 | 1.2345678901234565e-1 | 1.2345678901234566e-1 | 1.2345678901234567e-1 |
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
|   0.12345678901234564 |   0.12345678901234564 |   0.12345678901234565 |   0.12345678901234566 |   0.12345678901234566 |
+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
1 row in set (0.00 sec)


```
-> 17번째 소수점 자리를 정확하게 저장하는 것을 보장하지 않는다.

```
create table t1 (
id int AUTO_INCREMENT PRIMARY KEY,
dtype varchar(10),
preciseval decimal(24,17) not null
);
insert into t1(dtype, preciseval) values('approx', 1.2345678901234563e-1);
insert into t1(dtype, preciseval) values('approx', 1.2345678901234564e-1);
insert into t1(dtype, preciseval) values('approx', 1.2345678901234565e-1);
insert into t1(dtype, preciseval) values('approx', 1.2345678901234566e-1);
insert into t1(dtype, preciseval) values('approx', 1.2345678901234567e-1);

insert into t1(dtype, preciseval) values('exact', 0.12345678901234564);
insert into t1(dtype, preciseval) values('exact', 0.12345678901234565);
insert into t1(dtype, preciseval) values('exact', 0.12345678901234566);
insert into t1(dtype, preciseval) values('exact', 0.12345678901234567);
insert into t1(dtype, preciseval) values('exact', 0.12345678901234568);


root@localhost:test 19:00:54>select * from t1;
+----+--------+---------------------+
| id | dtype  | preciseval          |
+----+--------+---------------------+
|  1 | approx | 0.12345678901234564 |
|  2 | approx | 0.12345678901234564 |
|  3 | approx | 0.12345678901234565 |
|  4 | approx | 0.12345678901234566 |
|  5 | approx | 0.12345678901234566 |
|  6 | exact  | 0.12345678901234564 |
|  7 | exact  | 0.12345678901234565 |
|  8 | exact  | 0.12345678901234566 |
|  9 | exact  | 0.12345678901234567 |
| 10 | exact  | 0.12345678901234568 |
+----+--------+---------------------+
10 rows in set (0.00 sec)

```
- Approximate-value numeric literals 지수표현을 사용한 value를 DECIMAL에 저장한다면? 정확하게 저장되지 않을 수있다.
- Exact-value numeric literals만을 사용해야한다.