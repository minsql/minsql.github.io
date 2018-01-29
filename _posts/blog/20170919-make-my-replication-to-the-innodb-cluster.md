title: Make my replication to the InnoDB Cluster
link: http://minsql.com/mysql/make-my-replication-to-the-innodb-cluster/
author: michaela
description: 
post_id: 984
created: 2017/09/19 05:29:02
created_gmt: 2017/09/19 05:29:02
comment_status: open
post_name: make-my-replication-to-the-innodb-cluster
status: publish
post_type: post

# Make my replication to the InnoDB Cluster

내 리플리케이션을 cluster로 관리해보자. 빈서버를 cluster로 구성하는 것도 유사한 스텝으로 작업한다. 데이터가 있는 경우라면, cluster생성시 첫 인스턴스를 master를 선택하면 된다. 이데이터가 seed가 되어 전체 클러스터에 복제되게 된다. 

> 이번 테스트에서는 기존 5.7에 설치된 mixed replication으로 구성한 서버들을 활용한다.(server1,2,3) 기존의 replication 모두 절체. reset slave, reset master 

## InnoDB cluster Requirements

  * InnoDB cluster uses Group Replication and therefore your server instances must meet the same requirements. See Section 17.7.1, “Group Replication Requirements”. -> Requirements를 모두 만족하는지 확인한다.

  * In addition, the provisioning scripts that MySQL Shell uses to configure servers for use in InnoDB cluster require access to Python (2.7 and above). On Windows MySQL Shell includes Python and no user configuration is required. On Unix Python must be found as part of the environment. To check that your system has Python configured correctly issue: -> 그리고 python이 2.7 이상이 필요하다.

@all servers 
    
    
      [root@server1:~]# git clone https://github.com/pyenv/pyenv.git ~/.pyenv
      Initialized empty Git repository in /root/.pyenv/.git/
      remote: Counting objects: 15428, done.
      remote: Compressing objects: 100% (36/36), done.
      remote: Total 15428 (delta 18), reused 31 (delta 10), pack-reused 15381
      Receiving objects: 100% (15428/15428), 2.77 MiB | 820 KiB/s, done.
      Resolving deltas: 100% (10543/10543), done.
      [root@server1:~]# echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bash_profile
      [root@server1:~]# echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bash_profile
      [root@server1:~]# echo 'eval "$(pyenv init -)"' >> ~/.bash_profile
      [root@server1:~]# pyenv versions
      * system (set by /root/.pyenv/version)
      [root@server1:~]# pyenv install 2.7.13
      Downloading Python-2.7.13.tar.xz...
      -> https://www.python.org/ftp/python/2.7.13/Python-2.7.13.tar.xz
      Installing Python-2.7.13...
      Installed Python-2.7.13 to /root/.pyenv/versions/2.7.13
    
      [root@server1:~]# python --version
      Python 2.6.6
      [root@server1:~]# pyenv versions
      * system (set by /root/.pyenv/version)
        2.7.13
      [root@server1:~]# cd /mysql
    
      [root@server1:/mysql]# pyenv local 2.7.13
      [root@server1:/mysql]# python --version
      Python 2.7.13
    

## Methods of Installing

  * MySQL Server 5.7.17 or higher. For details, see Chapter 2, Installing and Upgrading MySQL. -> ok

  * MySQL Shell 1.0.9 or higher. For details, see Section 19.3.1, “Installing MySQL Shell”. 
    * Installing MySQL Shell from Direct Downloads from the MySQL Developer Zone
    * mysql-shell-1.0.10-linux-glibc2.12-x86-64bit.tar.gz 를 받아서 all servers에 업로드
  * MySQL Router 2.1.3 or higher. For details, see Installation. 
    * Download official MySQL packages: Downloads are available at http://dev.mysql.com/downloads/router.
    * mysql-router-2.1.4-linux-glibc2.12-x86-64bit.tar.gz 를 받아서 all servers에 업로드
@all servers 
    
    
    [root@server1:/mysql]# tar zxf mysql-shell-1.0.10-linux-glibc2.12-x86-64bit.tar.gz
    [root@server1:/mysql]# tar zxf mysql-router-2.1.4-linux-glibc2.12-x86-64bit.tar.gz
    cd /usr/local/bin
    ln -s  /mysql/mysql-shell-1.0.10-linux-glibc2.12-x86-64bit/bin/mysqlsh /usr/local/bin/mysqlsh
    ln -s  /mysql/mysql-router-2.1.4-linux-glibc2.12-x86-64bit/bin/mysqlrouter /usr/local/bin/mysqlrouter
    

## Production Deployment

  * https://dev.mysql.com/doc/refman/5.7/en/mysql-innodb-cluster-working-with-production-deployment.html

### Create user

  * instance 관리를 위한 user account가 필요하다. root일 필요는 없다. 하지만 많은 권한을 가져야한다. SUPER포함.. 
    * The user account used to administer an instance does not have to be the root account, however the user needs to be assigned full read and write privileges on the Metadata tables in addition to full MySQL administrator privileges (SUPER, GRANT OPTION, CREATE, DROP and so on). To give the user your_user the privileges needed to administer InnoDB cluster issue:
  * grgr@ip 유저를 활용한다.

@all servers 
    
    
    SET SQL_LOG_BIN=0;
    create user 'grgr'@'192.168.73.123' identified by 'grgr';
    
    GRANT ALL PRIVILEGES ON mysql_innodb_cluster_metadata.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
    GRANT RELOAD, SHUTDOWN, PROCESS, FILE, SUPER, REPLICATION SLAVE, REPLICATION CLIENT, CREATE USER ON *.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
    GRANT SELECT ON performance_schema.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
    GRANT SELECT ON sys.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
    GRANT SELECT, INSERT, UPDATE, DELETE ON mysql.* TO grgr@'192.168.73.123' WITH GRANT OPTION;
    
    create user 'grgr'@'192.168.81.192' identified by 'grgr';
    GRANT ALL PRIVILEGES ON mysql_innodb_cluster_metadata.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
    GRANT RELOAD, SHUTDOWN, PROCESS, FILE, SUPER, REPLICATION SLAVE, REPLICATION CLIENT, CREATE USER ON *.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
    GRANT SELECT ON performance_schema.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
    GRANT SELECT ON sys.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
    GRANT SELECT, INSERT, UPDATE, DELETE ON mysql.* TO grgr@'192.168.81.192' WITH GRANT OPTION;
    SET SQL_LOG_BIN=1;
    

  * 위처럼 멤버의 모든 아이피를 넣어줘야하지만, 유연한 변경을 위해서 %를 사용한다.
    
    
    SET SQL_LOG_BIN=0;
    create user 'grgr'@'192.168.%' identified by 'grgr';
    GRANT ALL PRIVILEGES ON mysql_innodb_cluster_metadata.* TO grgr@'192.168.%' WITH GRANT OPTION;
    GRANT RELOAD, SHUTDOWN, PROCESS, FILE, SUPER, REPLICATION SLAVE, REPLICATION CLIENT, CREATE USER ON *.* TO grgr@'192.168.%' WITH GRANT OPTION;
    GRANT SELECT ON performance_schema.* TO grgr@'192.168.%' WITH GRANT OPTION;
    GRANT SELECT ON sys.* TO grgr@'192.168.%' WITH GRANT OPTION;
    GRANT SELECT, INSERT, UPDATE, DELETE ON mysql.* TO grgr@'192.168.%' WITH GRANT OPTION;
    SET SQL_LOG_BIN=1;
    

  * 전체서버가 아직 클러스터 그룹이 되지 않은 상태이기 때문에, 모든 서버에 따로 변경을 가하는 경우에 SET SQL_LOG_BIN=0;을 잊지 않도록 한다. 나중에 dup에러를 만나지 않기 위해서. 물론 첫 구성이니 reset master로 해결할 수 있겠지만, 귀찮아지기 싫다면 SET SQL_LOG_BIN=0;로 작업한다. > 기존 사용하던 database가 추가되어있는 경우,
    
    
    * Checking compliance of existing tables... FAIL
    ERROR: 6 table(s) do not have a Primary Key or Primary Key Equivalent (non-null unique key).
    

위와 같은 에러를 만날 수 있다. PK가 모두 존재하더라도.. 이건 user가 해당 데이터베이스에 권한이 없기 때문이었다. 만약 database가 사용자데이터베이스를 사용중이라면 권한을 추가해야한다. `GRANT SELECT ON test.* TO grgr@'192.168.%' WITH GRANT OPTION;` or 여러개라면, 그리고 귀찮다면 `GRANT SELECT ON *.* TO grgr@'192.168.%' WITH GRANT OPTION;`

### working with mysqlsh

  * When working with a production deployment it is a good idea to configure verbose logging for MySQL Shell initially. This is helpful in finding and resolving any issues that may arise when you are preparing the server to work as part of InnoDB cluster. To start MySQL Shell with a verbose logging level type: -> production에서 작업할때는 log-level을 높여서 작업하면 이슈를 찾기가 쉽다.

  * `shell> mysqlsh --log-level=DEBUG3`

  * The log file is located in ~/.mysqlsh/mysqlsh.log for Unix-based systems. On Microsoft Windows systems it is located in %APPDATA%\MySQL\mysqlsh\mysqlsh.log. See Section 18.5, “MySQL Shell Application Log”.

### Checking Instance State