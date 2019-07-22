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
- Double에서 대략 15자리까지만 정확하다.

## Decimal사용시 주의할점
- Approximate-value numeric literals을 사용하면 근사값이다.
- 
