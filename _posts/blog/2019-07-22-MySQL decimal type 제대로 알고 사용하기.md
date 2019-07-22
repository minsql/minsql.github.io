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

## Exact-value vs. Approximate-value numeric literals
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

- test : 17번째 자리수의 값을 0-9로 변화시켜본다.
- table column의 데이터type을 decimal로 생성했다고 해서 decimal로 정확한 값을 저장하는 것이 아니다. 지수표현을 사용했다면 double의 accuracy를 가지는 근사치를 저장한다.

```
create table t1 (
id int AUTO_INCREMENT PRIMARY KEY,
exact_val decimal(24,18),
exponent_val decimal(24,18) not null
);

insert into t1(exact_val, exponent_val) values(0.12345678901234560, 0.12345678901234560e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234561, 0.12345678901234561e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234562, 0.12345678901234562e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234563, 0.12345678901234563e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234564, 0.12345678901234564e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234565, 0.12345678901234565e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234566, 0.12345678901234566e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234567, 0.12345678901234567e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234568, 0.12345678901234568e0);
insert into t1(exact_val, exponent_val) values(0.12345678901234569, 0.12345678901234569e0);

insert into t1(exact_val, exponent_val) values(0.92345678901234560, 0.92345678901234560e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234561, 0.92345678901234561e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234562, 0.92345678901234562e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234563, 0.92345678901234563e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234564, 0.92345678901234564e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234565, 0.92345678901234565e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234566, 0.92345678901234566e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234567, 0.92345678901234567e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234568, 0.92345678901234568e0);
insert into t1(exact_val, exponent_val) values(0.92345678901234569, 0.92345678901234569e0);

root@localhost:test 22:00:31>select id, exact_val, exponent_val, exact_val=exponent_val from t1;
+----+----------------------+----------------------+------------------------+
| id | exact_val            | exponent_val         | exact_val=exponent_val |
+----+----------------------+----------------------+------------------------+
|  1 | 0.123456789012345600 | 0.123456789012345600 |                      1 |
|  2 | 0.123456789012345610 | 0.123456789012345610 |                      1 |
|  3 | 0.123456789012345620 | 0.123456789012345620 |                      1 |
|  4 | 0.123456789012345630 | 0.123456789012345640 |                      0 |
|  5 | 0.123456789012345640 | 0.123456789012345640 |                      1 |
|  6 | 0.123456789012345650 | 0.123456789012345650 |                      1 |
|  7 | 0.123456789012345660 | 0.123456789012345660 |                      1 |
|  8 | 0.123456789012345670 | 0.123456789012345660 |                      0 |
|  9 | 0.123456789012345680 | 0.123456789012345680 |                      1 |
| 10 | 0.123456789012345690 | 0.123456789012345690 |                      1 |
| 11 | 0.923456789012345600 | 0.923456789012345600 |                      1 |
| 12 | 0.923456789012345610 | 0.923456789012345600 |                      0 |
| 13 | 0.923456789012345620 | 0.923456789012345600 |                      0 |
| 14 | 0.923456789012345630 | 0.923456789012345600 |                      0 |
| 15 | 0.923456789012345640 | 0.923456789012345600 |                      0 |
| 16 | 0.923456789012345650 | 0.923456789012345600 |                      0 |
| 17 | 0.923456789012345660 | 0.923456789012345600 |                      0 |
| 18 | 0.923456789012345670 | 0.923456789012345600 |                      0 |
| 19 | 0.923456789012345680 | 0.923456789012345600 |                      0 |
| 20 | 0.923456789012345690 | 0.923456789012345700 |                      0 |
+----+----------------------+----------------------+------------------------+
20 rows in set (0.00 sec)
```

-> Exact-value numeric로 표현한 값과, 지수표현을 사용한 Approximate-value numeric literals을 decimal(24,18)에 저장해보았다.
- 지수표현을 사용한 경우에는 의도한 값이 제대로 반영되지 않았다는 것을 확인할 수 있다.
- id 20의 값을 비교해보자, 0.92345678901234569e0의 값을 입력한 것인데, 15자리까지는 정확하지만, 16,17자리는 입력한 값과 다름.



## Decimal 사용시 주의할 점
- Approximate-value numeric literals 지수표현을 사용한 value를 DECIMAL에 저장한다면? 정확하게 저장되지 않을 수있다.
- Exact-value numeric literals만을 사용해야한다.