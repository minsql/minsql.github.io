---
title: MySQL Bug when using server-side prepared statements
author: min_kim
created: 2019/01/21
modified:
layout: post
tags: mysql mysql_bug
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL Bug when using server-side prepared statements

## MySQL Fractional timestamp 불일치 현상
- server-side prepared statement를 사용하는 경우 timestamp 의 fractional part가 binary log에 보존되지 않는다.
- Reference : https://bugs.mysql.com/bug.php?id=74550

## server-side prepared statements
- JDBC connection / connection pool datasource properties 에서 useServerPrepStmts=true 로 설정한 경우, 버그에 영향을 받을 수 있다.

### Reproduce bug
#### create table
```sql
CREATE TABLE `test_history` (
 `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
 `name` varchar(20),
 `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE `test_history_fr` (
 `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(20),
 `created_at` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
);
```

#### insert
jdbc connection 으로 데이터 입력

```bash
# vi TestConn.java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.PreparedStatement;
import java.sql.Timestamp;

public class TestConn {
            public static void main(String args[]) {
            Connection conn = null;
            try {
                  Class.forName("com.mysql.jdbc.Driver");
                  conn = DriverManager.getConnection(
                  "jdbc:mysql://localhost:3306/test?useServerPrepStmts=true", "mytest", "mytest"); // Test DB
                  System.out.println("Connected.");
                  PreparedStatement stmt = conn.prepareStatement("INSERT INTO test_history(name,created_at) values (?,?)");
                  stmt.setString(1, "jdbc");
                  stmt.setTimestamp(2, new Timestamp(1548036718501L));
                  stmt.execute();
                  PreparedStatement stmt2= conn.prepareStatement("INSERT INTO test_history_fr(name,created_at) values (?,?)");
                  stmt2.setString(1, "jdbc");
                  stmt2.setTimestamp(2, new Timestamp(1548036718501L));
                  stmt2.execute();
                  System.out.println("Executed.");
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (SQLException e) {
                e.printStackTrace();
            }

        }
}

# javac TestConn.java

# java -cp .:/usr/share/java/mysql-connector-java.jar  TestConn
Connected.
Executed.

```


#### binary log
```
#190121 15:32:36 server id 176118997  end_log_pos 24690394 CRC32 0x9f0a3a26     Intvar
SET INSERT_ID=1/*!*/;
#190121 15:32:36 server id 176118997  end_log_pos 24690558 CRC32 0x18424c02     Query   thread_id=70964 exec_time=0     error_code=0
SET TIMESTAMP=1548052356/*!*/;
INSERT INTO test_history_fr(name,created_at) values ('jdbc','2019-01-21 11:11:58')
/*!*/;

...
#190121 15:32:36 server id 176118997  end_log_pos 24690394 CRC32 0x9f0a3a26     Intvar
SET INSERT_ID=1/*!*/;
#190121 15:32:36 server id 176118997  end_log_pos 24690558 CRC32 0x18424c02     Query   thread_id=70964 exec_time=0     error_code=0
SET TIMESTAMP=1548052356/*!*/;
INSERT INTO test_history_fr(name,created_at) values ('jdbc','2019-01-21 11:11:58')
/*!*/;

```

### data
* @master

```sql
root@localhost:test 15:33:44>select * from test_history;
+----+------+---------------------+
| id | name | created_at          |
+----+------+---------------------+
|  1 | jdbc | 2019-01-21 11:11:59 |
+----+------+---------------------+
1 row in set (0.00 sec)

root@localhost:test 15:33:49>select * from test_history_fr;
+----+------+-------------------------+
| id | name | created_at              |
+----+------+-------------------------+
|  1 | jdbc | 2019-01-21 11:11:58.501 |
+----+------+-------------------------+
1 row in set (0.00 sec)

```

* @slave

```sql
root@localhost:test 15:32:26>select * from test_history;
+----+------+---------------------+
| id | name | created_at          |
+----+------+---------------------+
|  1 | jdbc | 2019-01-21 11:11:58 |
+----+------+---------------------+
1 row in set (0.00 sec)

root@localhost:test 15:33:30>select * from test_history_fr;
+----+------+-------------------------+
| id | name | created_at              |
+----+------+-------------------------+
|  1 | jdbc | 2019-01-21 11:11:58.000 |
+----+------+-------------------------+
1 row in set (0.00 sec)

```

> master, slave가 다른 timestamp 값을 가지게 된다.

1. 1548036718501,즉 2019-01-21 11:11:58.501의 시간을 PreparedStatement에 넘겨주었다.
2. master commit시, master는 timestamp(0)에 담기 위해서 데이터를 반올림한다. timestamp(3)인 경우, 그대로 저장한다.
3. binlog에 fractional part를 truncate한 값이 쓰인다. '2019-01-21 11:11:58'
4. slave는 truncate 된 timestamp값을 저장한다.


## Conclusion
- Do not use Server-side prepared statement: useServerPrepStmts=false
- ROW based replication
- Version Upgrade, Bug fixed in 5.6.36, 5.7.18

