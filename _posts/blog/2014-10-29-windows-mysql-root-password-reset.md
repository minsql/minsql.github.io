---
title: Windows MySQL root password reset
author: min_kim
created: 2014/10/29 05:56:00
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


# Windows MySQL root password reset

### Windows MySQL root reset
<http://dev.mysql.com/doc/refman/5.5/en/resetting-permissions.html>

*  [--init-file](http://dev.mysql.com/doc/refman/5.5/en/server-options.html#option_mysqld_init-file)옵션을 사용하여 root password 를 reset 할수 있다. linux에서는  [--skip-grant-tables](http://dev.mysql.com/doc/refman/5.5/en/server-options.html#option_mysqld_skip-grant-tables) 을 주고 띄운 다음 mysql.user 업데이트하곤 했었는데, 윈도우즈는 매뉴얼 찾아보니 대안이 있으니 사용해 보자.

#####  1.  mysql-init.txt 파일을 생성

```sql
UPDATE mysql.user SET Password=PASSWORD('newpasswd') WHERE User='root';
FLUSH PRIVILEGES;
```


#####  2. stop instance
#####  3. start mysql instance with init-file option

```
"C:Program FilesMySQLMySQL Server 5.5binmysqld" --defaults-file="C:Program FilesMySQLMySQL Server 5.5my.ini" --init-file="C:Program FilesMySQLMySQL Server 5.5mysql-init.txt"
```

#####  4. root access 잘되는지 확인
#####  5. 잘되면, stop/start mysql instance without init-file option
