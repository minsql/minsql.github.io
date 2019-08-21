---
title: MySQL 8.0 - Window function
author: min_cho
created: 2019/01/14
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

## 개요
* MySQL 8.0 부터는 비로소 Window function (https://en.wikipedia.org/wiki/Window_function) 을 지원하게 되었다.
* Filter 조건을 사용하여 추출된 데이터를 그룹핑(GROUP BY)후 aggregate function (예를 들면, sum, avg, max) 을 통해 통계값을 얻어내는 GROUP BY 구문과는 다르게, 추출된 데이터를 하나씩 모두 보여주며 주어진 데이터 그룹(PARTITION BY) 내에서 순서(ORDER BY)를 정한 후 지정된 기준점(ROWS | RANGE BETWEEN)을 중심으로 읽어가며 연산을 해 나가는것이 window function이다.
* Window function을 지원하게 되면서, 추가로 다음과 같은 non-aggregate function 을 window funtion 구문과 함께 사용할 수 있게 되었다.

 * Non-aggregate function

 |Name	| Description|
 |----|-----------|
 CUME_DIST() | 	Cumulative distribution value
 DENSE_RANK() | 	Rank of current row within its partition, without gaps
 FIRST_VALUE() | 	Value of argument from first row of window frame
 LAG() | 	Value of argument from row lagging current row within partition
 LAST_VALUE() | 	Value of argument from last row of window frame
 LEAD() | 	Value of argument from row leading current row within partition
 NTH_VALUE() | 	Value of argument from N-th row of window frame
 NTILE() | 	Bucket number of current row within its partition.
 PERCENT_RANK() | 	Percentage rank value
 RANK() | 	Rank of current row within its partition, with gaps
 ROW_NUMBER() | 	Number of current row within its partition

 * 물론 Window function은 aggregate function 에 대해서도 지원 가능하다.

 Name	| Description
 -----|-------------
 AVG() | 	Return the average value of the argument
 BIT_AND() | 	Return bitwise AND
 BIT_OR() | 	Return bitwise OR
 BIT_XOR() | 	Return bitwise XOR
 COUNT() | 	Return a count of the number of rows returned
 MAX() | 	Return the maximum value
 MIN() | 	Return the minimum value
 STD() | 	Return the population standard deviation
 STDDEV() | 	Return the population standard deviation
 STDDEV_POP() | 	Return the population standard deviation
 STDDEV_SAMP() | 	Return the sample standard deviation
 SUM() | 	Return the sum
 VAR_POP() | 	Return the population standard variance
 VAR_SAMP() | 	Return the sample variance
 VARIANCE() | 	Return the population standard variance

 > [!NOTE]
 > 기본적으로 제공되는 aggregate function중 COUNT(DISTINCT), GROUP_CONCAT(), JSON_ARRAYAGG(), JSON_OBJECTAGG() 는 window function에서 사용될 수 없다.

* Window function 구문과 group by 구문을 사용한 aggregate function 에 대한 결과는 다음과 같다.

```sql
create table du(a int, b int);

insert into du values (1,1),(1,2),(1,3),(1,4),(2,11),(2,12),(3,21),(3,22);

select a, sum(b) from du group by a;

select a, sum(b) over (partition by a) from du;



mysql 8.0 [localhost] {msandbox} (test) >   select a, sum(b) from du group by a;
+------+--------+
| a    | sum(b) |
+------+--------+
|    1 |     10 |
|    2 |     23 |
|    3 |     43 |
+------+--------+
3 rows in set (0.00 sec)

--^^ a로 그룹핑한 결과를 a별로 보여준다.


mysql 8.0 [localhost] {msandbox} (test) >   select a, sum(b) over (partition by a) from du;
+------+------------------------------+
| a    | sum(b) over (partition by a) |
+------+------------------------------+
|    1 |                           10 |
|    1 |                           10 |
|    1 |                           10 |
|    1 |                           10 |
|    2 |                           23 |
|    2 |                           23 |
|    3 |                           43 |
|    3 |                           43 |
+------+------------------------------+
8 rows in set (0.00 sec)
--^^ a로 그룹핑한 결과를 a를 꺼내면서 보여준다.
```

*  Window 안에서 Frame을 지정하여, 지정된 범위(ROWS | RANGE BETWEEN)에서의 결과도 도출해 낼 수 있다. Frame 을 지정해서 사용할 수 있는 function은 다음과 같다.

> [!NOTE]
> 위에 나열된 Aggregate Funtions + [FIRST_VALUE() | LAST_VALUE() | NTH_VALUE()]
>> [!TIP]
>> 위의 3가지 non-aggregate function을 제외하고 다른 non-aggregate function은 쿼리문내에 쓸 수는 있지만 무시된다. 의미가 없기 때문이다.

* 문법을 확인하면 다음과 같다.
 * RANGE 는 BETWEEN 과 항상 함께 사용되며, 특정 프레임을 지정할 수 있다.
 * ROWS 는 기본적으로 현재 행을 기준으로 시작지점을 지정할 수 있지만, BETWEEN 을 사용하게 되면 RANGE와 같은 효과를 낸다.
 * UNBOUNDED PRECEDING 는 Window 내에서 가장 앞선 ROW 이다.
 * UNBOUNDED FOLLOWING 는 Window 내에서 가장 마지막 ROW 이다.
 * CURRENT ROW 는 현재의 ROW이다.
 * n PRECEDING, n FOLLOWING 은 각각 n번째 앞선 값, n번째 뒤에선 값이다.

 ```sql
 select a,b
,'|'
,sum(b)  over (partition by a order by b ) as a0  -- default는 처음부터 현재행까지를 Frame 으로 잡는것이다.
,sum(b)  over (partition by a order by b RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW ) as range_up_c  -- default와 같다.
,sum(b)  over (partition by a order by b RANGE BETWEEN CURRENT ROW and UNBOUNDED FOLLOWING ) as range_c_uf   -- 현재행부터 마지막까지를 Frame으로 설정한다.
,sum(b)  over (partition by a order by b RANGE BETWEEN UNBOUNDED PRECEDING AND  UNBOUNDED FOLLOWING) as range_up_uf  -- 처음부터 마지막까지를 frame으로 설정한다.
,sum(b)  over (partition by a order by b RANGE BETWEEN 1 PRECEDING AND 1 FOLLOWING) as range_p1_f1  -- 현재행을 중심으로 앞,뒤로 한행씩 frame을 설정한다.
,sum(b)  over (partition by a order by b ROWS UNBOUNDED PRECEDING) as rows_up  -- default와 같다.
,sum(b)  over (partition by a order by b ROWS BETWEEN  UNBOUNDED PRECEDING AND CURRENT ROW) as rows_up_c  -- default와 같다.
,sum(b)  over (partition by a order by b ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) as rows_p1_f1   -- 현재행을 중심으로 앞,뒤로 한행씩 frame을 설정한다.
from du;

+------+------+---+------+------------+------------+-------------+-------------+---------+-----------+------------+
| a    | b    | | | a0   | range_up_c | range_c_uf | range_up_uf | range_p1_f1 | rows_up | rows_up_c | rows_p1_f1 |
+------+------+---+------+------------+------------+-------------+-------------+---------+-----------+------------+
|    1 |    1 | | |    1 |          1 |         10 |          10 |           3 |       1 |         1 |          3 |
|    1 |    2 | | |    3 |          3 |          9 |          10 |           6 |       3 |         3 |          6 |
|    1 |    3 | | |    6 |          6 |          7 |          10 |           9 |       6 |         6 |          9 |
|    1 |    4 | | |   10 |         10 |          4 |          10 |           7 |      10 |        10 |          7 |
|    2 |   11 | | |   11 |         11 |         23 |          23 |          23 |      11 |        11 |         23 |
|    2 |   12 | | |   23 |         23 |         12 |          23 |          23 |      23 |        23 |         23 |
|    3 |   21 | | |   21 |         21 |         43 |          43 |          43 |      21 |        21 |         43 |
|    3 |   22 | | |   43 |         43 |         22 |          43 |          43 |      43 |        43 |         43 |
+------+------+---+------+------------+------------+-------------+-------------+---------+-----------+------------+
8 rows in set (0.00 sec)
```


## 사용예제

```sql
DROP TABLE IF EXISTS emp;
DROP TABLE IF EXISTS salary;


CREATE TABLE emp (id int, name varchar(100), birth_year int, manager_id int, joined_year year);
INSERT INTO emp values (1, 'Matheus', 1975, null, 2016);
INSERT INTO emp values (2, 'Cindy', 1978, 1, 2016);
INSERT INTO emp values (3, 'Tim', 1978, 2, 2016);
INSERT INTO emp values (4, 'Chan', 1983, 3, 2016);
INSERT INTO emp values (5, 'Min', 1979, 3, 2018);
INSERT INTO emp values (6, 'Sam', 1976, 2, 2017);
INSERT INTO emp values (7, 'David', 1983, 6, 2016);
INSERT INTO emp values (8, 'Siena', 1985,1, 2016);
INSERT INTO emp values (9, 'Ted', 1980, 6, 2016);
INSERT INTO emp values (10, 'Stray', 1990, 6, 2016);




CREATE TABLE salary (emp_id int, salary int, applied_year year);
INSERT INTO salary values (1, round(rand()*100000)+100000, 2016);
INSERT INTO salary values (1, round(rand()*100000)+100000, 2017);
INSERT INTO salary values (1, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (2, round(rand()*100000)+100000, 2016);
INSERT INTO salary values (2, round(rand()*100000)+100000, 2017);
INSERT INTO salary values (2, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (3, round(rand()*100000)+100000, 2016);
INSERT INTO salary values (3, round(rand()*100000)+100000, 2017);
INSERT INTO salary values (3, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (4, round(rand()*100000)+100000, 2016);
INSERT INTO salary values (4, round(rand()*100000)+100000, 2017);
INSERT INTO salary values (4, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (5, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (6, round(rand()*100000)+100000, 2017);
INSERT INTO salary values (6, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (7, round(rand()*100000)+100000, 2016);
INSERT INTO salary values (7, round(rand()*100000)+100000, 2017);
INSERT INTO salary values (7, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (8, round(rand()*100000)+100000, 2016);
INSERT INTO salary values (8, round(rand()*100000)+100000, 2017);
INSERT INTO salary values (8, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (9, round(rand()*100000)+100000, 2016);
INSERT INTO salary values (9, round(rand()*100000)+100000, 2017);
INSERT INTO salary values (9, round(rand()*100000)+100000, 2018);
INSERT INTO salary values (10, round(rand()*100000)+100000, 2016);
INSERT INTO salary values (10, round(rand()*100000)+100000, 2017);




-- 2016년에 입사한 사람 중 2017년과 2018년 연봉이 가장 높은 순서부터 얼마를 받았는지 알고 싶다.


SELECT e.name
  ,s.applied_year
  ,s.salary
  ,rank() over (PARTITION BY s.applied_year ORDER BY s.salary desc ) as ranking
FROM emp e, salary s
WHERE  e.id=s.emp_id and e.joined_year = 2016 and s.applied_year in (2017,2018);

+---------+--------------+--------+---------+
| name    | applied_year | salary | ranking |
+---------+--------------+--------+---------+
| Matheus |         2017 | 193379 |       1 |
| Ted     |         2017 | 169553 |       2 |
| Siena   |         2017 | 163236 |       3 |
| Stray   |         2017 | 156833 |       4 |
| David   |         2017 | 151457 |       5 |
| Chan    |         2017 | 149216 |       6 |
| Cindy   |         2017 | 136866 |       7 |
| Tim     |         2017 | 128058 |       8 |
| Tim     |         2018 | 175913 |       1 |
| Chan    |         2018 | 159909 |       2 |
| Siena   |         2018 | 146277 |       3 |
| David   |         2018 | 128868 |       4 |
| Cindy   |         2018 | 126411 |       5 |
| Ted     |         2018 | 122733 |       6 |
| Matheus |         2018 | 119889 |       7 |
+---------+--------------+--------+---------+
15 rows in set (0.00 sec)


-- 추가로 순위가 앞, 뒤 인 사람들의 연봉차이를 알고 싶다.

SELECT e.name
  ,s.applied_year
  ,s.salary
  ,rank() over (PARTITION BY s.applied_year ORDER BY s.salary desc ) as ranking
  ,lag(s.salary) over (PARTITION BY s.applied_year ORDER BY s.salary desc ) - s.salary as diff_lag
  ,s.salary - lead(s.salary) over (PARTITION BY s.applied_year ORDER BY s.salary desc ) as diff_lead
FROM emp e, salary s
WHERE  e.id=s.emp_id and e.joined_year = 2016 and s.applied_year in (2017,2018);

+---------+--------------+--------+---------+----------+-----------+
| name    | applied_year | salary | ranking | diff_lag | diff_lead |
+---------+--------------+--------+---------+----------+-----------+
| Matheus |         2017 | 193379 |       1 |     NULL |     23826 |
| Ted     |         2017 | 169553 |       2 |    23826 |      6317 |
| Siena   |         2017 | 163236 |       3 |     6317 |      6403 |
| Stray   |         2017 | 156833 |       4 |     6403 |      5376 |
| David   |         2017 | 151457 |       5 |     5376 |      2241 |
| Chan    |         2017 | 149216 |       6 |     2241 |     12350 |
| Cindy   |         2017 | 136866 |       7 |    12350 |      8808 |
| Tim     |         2017 | 128058 |       8 |     8808 |      NULL |
| Tim     |         2018 | 175913 |       1 |     NULL |     16004 |
| Chan    |         2018 | 159909 |       2 |    16004 |     13632 |
| Siena   |         2018 | 146277 |       3 |    13632 |     17409 |
| David   |         2018 | 128868 |       4 |    17409 |      2457 |
| Cindy   |         2018 | 126411 |       5 |     2457 |      3678 |
| Ted     |         2018 | 122733 |       6 |     3678 |      2844 |
| Matheus |         2018 | 119889 |       7 |     2844 |      NULL |
+---------+--------------+--------+---------+----------+-----------+
15 rows in set (0.00 sec)



--- 반복되는 window function의 경우, 아래와 같이 WINDOW Alias 를 사용할 수 있다.

SELECT e.name
  ,s.applied_year
  ,s.salary
  ,rank() over w as ranking
  ,lag(s.salary) over w - s.salary as diff_lag
  ,s.salary - lead(s.salary) over w as diff_lead
FROM emp e, salary s
WHERE  e.id=s.emp_id and e.joined_year = 2016 and s.applied_year in (2017,2018)
    WINDOW w AS (PARTITION BY s.applied_year ORDER BY s.salary desc );

+---------+--------------+--------+---------+----------+-----------+
| name    | applied_year | salary | ranking | diff_lag | diff_lead |
+---------+--------------+--------+---------+----------+-----------+
| Matheus |         2017 | 193379 |       1 |     NULL |     23826 |
| Ted     |         2017 | 169553 |       2 |    23826 |      6317 |
| Siena   |         2017 | 163236 |       3 |     6317 |      6403 |
| Stray   |         2017 | 156833 |       4 |     6403 |      5376 |
| David   |         2017 | 151457 |       5 |     5376 |      2241 |
| Chan    |         2017 | 149216 |       6 |     2241 |     12350 |
| Cindy   |         2017 | 136866 |       7 |    12350 |      8808 |
| Tim     |         2017 | 128058 |       8 |     8808 |      NULL |
| Tim     |         2018 | 175913 |       1 |     NULL |     16004 |
| Chan    |         2018 | 159909 |       2 |    16004 |     13632 |
| Siena   |         2018 | 146277 |       3 |    13632 |     17409 |
| David   |         2018 | 128868 |       4 |    17409 |      2457 |
| Cindy   |         2018 | 126411 |       5 |     2457 |      3678 |
| Ted     |         2018 | 122733 |       6 |     3678 |      2844 |
| Matheus |         2018 | 119889 |       7 |     2844 |      NULL |
+---------+--------------+--------+---------+----------+-----------+
15 rows in set (0.00 sec)
```

# 적용범위
* MySQL을 사용함에 있어, 가장 아쉬웠던 function 인 lag, lead 를 비롯 (기존에는 복잡한 쿼리를 이용하여 활용) 하여, rank 등을 쉽게 사용할 수 있었다.
* 아래와 같은 예제는 5.7 이하에서 Window function이 존재하지 않아 가장 쓰기 힘들었던 쿼리들을 8.0의 window function으로 구현한 예제이다.

```sql
---- 샘플 데이터 생성
create table window_function_tbl (
month_id tinyint
, month_name varchar(10)
, season enum ('봄','여름','가을','겨율')
, ordering_num tinyint
);

insert into window_function_tbl values
(1,'JAN',4,42),
(2,'FEB',4,43),
(3,'MAR',1,10),
(4,'APR',1,11),
(5,'MAY',1,12),
(6,'JUN',2,21),
(7,'JUL',2,22),
(8,'AUG',2,23),
(9,'SEP',3,31),
(10,'DEC',3,32),
(11,'NOV',3,33),
(12,'DEC',4,41);
```
 * 각 계절의 첫번째 달과 마지막 달을 찾아 보여준다.
   * 5.7

 ```sql
 SELECT wft.*
 , (SELECT month_name FROM window_function_tbl WHERE month_id = at.min_month_id) as first_month_of_season
 , (SELECT month_name FROM window_function_tbl WHERE month_id = at.max_month_id) as last_month_of_season
 FROM window_function_tbl wft
 INNER JOIN
    (SELECT season, MAX(month_id) as max_month_id, MIN(month_id)  as min_month_id
    FROM window_function_tbl
    GROUP BY season) at
 ON wft.season = at.season
 ORDER BY season;
 ```

  * * 8.0

 ```sql

 SELECT *
  , FIRST_VALUE(month_name) OVER (PARTITION BY season ORDER BY month_id RANGE BETWEEN UNBOUNDED PRECEDING AND  UNBOUNDED FOLLOWING ) as first_month_of_season
  , LAST_VALUE(month_name) OVER (PARTITION BY season ORDER BY month_id RANGE BETWEEN UNBOUNDED PRECEDING AND  UNBOUNDED FOLLOWING) as last_month_of_season
 FROM  window_function_tbl;
 ```

 * 각 계절의 앞선달과 다음달을 찾아 보여준다.
   * 5.7

 ```sql
 --- lag

SELECT month_id
   , month_name
   , season
   , prev_month_of_season
FROM
   (SELECT wft.*
      , IF(@season = season, @prev_month, '') as prev_month_of_season
      , @season := season, @prev_month := month_name
   FROM
      window_function_tbl wft,(SELECT @season, @prev_month) tmp
   ORDER BY season, month_id
   ) wrapper;



--- lead

SELECT t1.month_id
   , t1.month_name
   , t1.season
   , IFNULL(t2.month_name,'') AS next_month_of_season
FROM
   (SELECT month_id
        , month_name
        , season
        , @rownum1 := @rownum1 + 1 as r1_val
   FROM window_function_tbl, (select @rownum1 := 0) r1
   ORDER BY season, month_id) t1
LEFT OUTER JOIN
   (SELECT month_id
       , month_name
       , season
       , @rownum2 := @rownum2 + 1 as r2_val
   FROM window_function_tbl, (select @rownum2 := 0) r2
   ORDER BY season, month_id) t2
ON t1.season = t2.season AND t1.r1_val = t2.r2_val-1;
```

  * * 8.0

```sql
SELECT *
 , ifnull(LAG(month_name) OVER (PARTITION BY season ORDER BY month_id ),'') as prev_month_of_season
 , ifnull(LEAD(month_name) OVER (PARTITION BY season ORDER BY month_id ),'') as next_month_of_season
FROM  window_function_tbl;
```

 * 각 계절의 마지막달에 대한 정보를 보여준다. (해당 쿼리는 Window function을 사용하기 가장 적합하면서 요청을 많이 받은 형태의 쿼리였지만, 5.7 까지는 아래와 같은 방법으로 사용해야 했다)
   * 5.7

 ```sql
 SELECT wft.month_id, wft.month_name, wft.season
FROM window_function_tbl wft
INNER JOIN
   (SELECT season, MAX(ordering_num) as max_ordering_num
   FROM window_function_tbl
   GROUP BY season) iv
ON wft.ordering_num = iv.max_ordering_num and  wft.season = iv.season;
```

  * * 8.0

```sql
SELECT month_id, month_name, season
FROM (
 SELECT *
    , RANK() OVER (PARTITION BY season ORDER BY ordering_num desc) as rnk
 FROM  window_function_tbl
) iv WHERE rnk=1;
```
