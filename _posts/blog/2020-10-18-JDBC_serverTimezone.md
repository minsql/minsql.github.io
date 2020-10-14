---
title: The server time zone value 'KST' is unrecognized or represents more than one time zone.
author: min_cho
created: 2020/10/18
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
* 기존에 사용하던 JDBC connection string을 그대로 8.0 Connector/J를 이용하였더니, 아래와 같은 에러가 발생했다.
```
Exception in thread "main" java.sql.SQLNonTransientConnectionException: Could not create connection to database server. Attempted reconnect 3 times. Giving up.
...
	at java.sql/java.sql.DriverManager.getConnection(DriverManager.java:228)
	at SimpleTest/com.minsql.simpleTestCase.JdbcStringOn8.readDataBase(JdbcStringOn8.java:23)
	at SimpleTest/com.minsql.simpleTestCase.JdbcStringOn8.main(JdbcStringOn8.java:16)
Caused by: com.mysql.cj.exceptions.InvalidConnectionAttributeException: The server time zone value 'KST' is unrecognized or represents more than one time zone. You must configure either the server or JDBC driver (via the 'serverTimezone' configuration property) to use a more specifc time zone value if you want to utilize time zone support.
	at java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance0(Native Method)
	at java.base/jdk.internal.reflect.NativeConstructorAccessorImpl.newInstance(NativeConstructorAccessorImpl.java:62)
	at java.base/jdk.internal.reflect.DelegatingConstructorAccessorImpl.newInstance(DelegatingConstructorAccessorImpl.java:45)
	at java.base/java.lang.reflect.Constructor.newInstanceWithCaller(Constructor.java:500)
	at java.base/java.lang.reflect.Constructor.newInstance(Constructor.java:481)
	at com.mysql.cj.exceptions.ExceptionFactory.createException(ExceptionFactory.java:61)
	at com.mysql.cj.exceptions.ExceptionFactory.createException(ExceptionFactory.java:85)
	at com.mysql.cj.util.TimeUtil.getCanonicalTimezone(TimeUtil.java:132)
	at com.mysql.cj.protocol.a.NativeProtocol.configureTimezone(NativeProtocol.java:2120)
	at com.mysql.cj.protocol.a.NativeProtocol.initServerSession(NativeProtocol.java:2143)
	at com.mysql.cj.jdbc.ConnectionImpl.initializePropsFromServer(ConnectionImpl.java:1310)
	at com.mysql.cj.jdbc.ConnectionImpl.connectWithRetries(ConnectionImpl.java:869)
	... 8 more
```

* 기존에 사용하던 Connection String은 다음과 같다.
```
autoReconnect=true&cacheServerConfiguration=true&useLocalSessionState=true&elideSetAutoCommits=true&connectTimeout=3000&socketTimeout=60000&useSSL=false&useAffectedRows=true&cacheCallableStmts=true&noAccessToProcedureBodies=true&characterEncoding=utf8&characterSetResults=utf8&connectionCollation=utf8mb4_bin
```
-----

## 원인
* Connector/J 소스 안을 들여다 보면, Server가 가지고 있는 Timezone을 가져와 Client의 Canonical Timezone을 세팅하는 부분이있다. (Canonical Timezone은 Timezone의 Primary값으로, 한국시간의 Canonical Timezone은 Asia/Seoul이고 Alias는 ROK이다. (현재 ROK는 depreated단계))

  * 5.1.xx의 경우, canonicalTimezone을 세팅하는 `canonicalTimezone = TimeUtil.getCanonicalTimezone(configuredTimeZoneOnServer, getExceptionInterceptor())` 부분이 JDBC property인 `useTimezone(default:false)`, `useLegacyDatetimeCode(default:true)` 값에 의해 Skip 되는 반면,
    - https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-reference-configuration-properties.html

    ```JAVA
    ...
    private void configureTimezone() throws SQLException {
         String configuredTimeZoneOnServer = this.serverVariables.get("timezone");

         if (configuredTimeZoneOnServer == null) {
             configuredTimeZoneOnServer = this.serverVariables.get("time_zone");

             if ("SYSTEM".equalsIgnoreCase(configuredTimeZoneOnServer)) {
                 configuredTimeZoneOnServer = this.serverVariables.get("system_time_zone");
             }
         }

         String canonicalTimezone = getServerTimezone();

         if ((getUseTimezone() || !getUseLegacyDatetimeCode()) && configuredTimeZoneOnServer != null) {
             // user can override this with driver properties, so don't detect if that's the case
             if (canonicalTimezone == null || StringUtils.isEmptyOrWhitespaceOnly(canonicalTimezone)) {
                 try {
                     canonicalTimezone = TimeUtil.getCanonicalTimezone(configuredTimeZoneOnServer, getExceptionInterceptor());
                 } catch (IllegalArgumentException iae) {
                     throw SQLError.createSQLException(iae.getMessage(), SQLError.SQL_STATE_GENERAL_ERROR, getExceptionInterceptor());
                 }
             }
         }
    ...
    ```
    - https://github.com/mysql/mysql-connector-j/blob/release/5.1/src/com/mysql/jdbc/ConnectionImpl.java#L1956


  * 8.0.xx의 경우, `useTimezone`, `useLegacyDatetimeCode` 의 properties가 사라지면  해당부분이 실행되고 exception을 발생시킨다.
    - https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-properties-changed.html

    ```JAVA
    ...
    public void configureTimezone() {
        String configuredTimeZoneOnServer = this.serverSession.getServerVariable("time_zone");

        if ("SYSTEM".equalsIgnoreCase(configuredTimeZoneOnServer)) {
            configuredTimeZoneOnServer = this.serverSession.getServerVariable("system_time_zone");
        }

        String canonicalTimezone = getPropertySet().getStringProperty(PropertyKey.serverTimezone).getValue();

        if (configuredTimeZoneOnServer != null) {
            // user can override this with driver properties, so don't detect if that's the case
            if (canonicalTimezone == null || StringUtils.isEmptyOrWhitespaceOnly(canonicalTimezone)) {
                try {
                    canonicalTimezone = TimeUtil.getCanonicalTimezone(configuredTimeZoneOnServer, getExceptionInterceptor());
                } catch (IllegalArgumentException iae) {
                    throw ExceptionFactory.createException(WrongArgumentException.class, iae.getMessage(), getExceptionInterceptor());
                }
            }
        }
    ...
    ```
    - https://github.com/mysql/mysql-connector-j/blob/release/8.0/src/main/protocol-impl/java/com/mysql/cj/protocol/a/NativeProtocol.java#L2116


* 또한 Canonical timezone을 가져오는 과정을 살펴보면,
  * 일반적으로 time_zone 관련되어 mysqld에 세팅을 하지 않는 경우 아래와 같이 나타나게 되는데,
      ```sql
    mysql [localhost] {msandbox} ((none)) > show global variables like '%time_zone%';
    +------------------+--------+
    | Variable_name    | Value  |
    +------------------+--------+
    | system_time_zone | KST    |
    | time_zone        | SYSTEM |
    +------------------+--------+
    2 rows in set (0.00 sec)
    ```

  * mysqld는 time_zone의 값을 SYSTEM으로 가지고 있고, system_time_zone값은 `KST`를 가지고 있음으로 Connector/J는 `KST`에 대한 Canonical Timezone을 찾으려고 하지만, mapping된 Canonical timezone이 없어 해당문제를 발생시키게 된다.

    - https://en.wikipedia.org/wiki/List_of_tz_database_time_zones


------

## 해결방법
1. 해결방법으로는 여러가지가 존재하는데, 첫번째로 JDBC String에 `serverTimezone` property를 추가하여 해석가능한  Canonical timezone으로 세팅할 수 있다.
  ```
	 JDBC connection String
  ....&serverTimezone=Asia/Seoul
  ```

1. 두번째 방법으로는 my.cnf의 mysqld section에 아래와 같이 추가하여, Connector/J가 Canonical timezone을 세팅할 수 있도록 한다. (물론, mysql_tzinfo_to_sql을 이용하여, timezone테이블을 활성화시키고 정확히 mysqld에서 '+09:00'대신 'Asia/Seoul'로 세팅할 수 있다.)
  ```
  default_time_zone='+09:00'
  ```
  ```sql
  mysql [localhost] {msandbox} ((none)) > show global variables like 'time_zone';
  +---------------+--------+
  | Variable_name | Value  |
  +---------------+--------+
  | time_zone     | +09:00 |
  +---------------+--------+
  1 row in set (0.00 sec)
  ```
