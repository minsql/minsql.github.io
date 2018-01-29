title: Slave 에서 mysqldump의 dump-slave 옵션을 이용하여 백업 혹은 다른 slave 구성하기
link: http://minsql.com/mysql/slave-%ec%97%90%ec%84%9c-mysqldump%ec%9d%98-dump-slave-%ec%98%b5%ec%85%98%ec%9d%84-%ec%9d%b4%ec%9a%a9%ed%95%98%ec%97%ac-%eb%b0%b1%ec%97%85-%ed%98%b9%ec%9d%80-%eb%8b%a4%eb%a5%b8-slave-%ea%b5%ac/
author: makayal46
description: 
post_id: 718
created: 2015/08/04 20:54:21
created_gmt: 2015/08/04 11:54:21
comment_status: open
post_name: slave-%ec%97%90%ec%84%9c-mysqldump%ec%9d%98-dump-slave-%ec%98%b5%ec%85%98%ec%9d%84-%ec%9d%b4%ec%9a%a9%ed%95%98%ec%97%ac-%eb%b0%b1%ec%97%85-%ed%98%b9%ec%9d%80-%eb%8b%a4%eb%a5%b8-slave-%ea%b5%ac
status: publish
post_type: post

# Slave 에서 mysqldump의 dump-slave 옵션을 이용하여 백업 혹은 다른 slave 구성하기

### Goal

  * Slave에서 mysqldump의 dump-slave 옵션을 이용하면, master의 backup 스냅샷을 받을 수 있다. 데이터는 slave에서 받지만, 해당 snapshot의 정보는 master의 정보이다. (물론 replication filtering을 적용하지 않은 slave에서 가능하다)
  * Slave를 구성하는 방법은 여러가지가 존재한다.
  1. 가장 쉽게는 Master에서 mysqldump의 master-data 옵션을 이용하여 새로운 slave를 구성할 수 있다.
  2. 하나의 slave를 선택하여 shutdown 후 모든 데이터파일과 로그파일을 새로운 slave에 복사하고 master.info의 파일(stop 되었을때의 master binlog ,position 정보)을 이용하여 구성할 수 있다.
  3. 하나의 slave를 선택하여 mysqldump의 dump-slave 옵션을 이용하여 master의 스냅샷을 이용하는 방법 
    * 위 방법은 직접 master에 접근하는것이 아닌, 순간적으로 slave에서 STOP SLAVE SQL_THREAD; 시키고 master의 binlog와 position을 알아낸 다음 snapshot을 받는 방법이다.
    * 위의 옵션을 이용하면, 굳이 master에서 백업을 받지 않고 특정 slave에서 snapshot을 받을 수 있으며 그 snapshot은 master의 binlog와 position 을 이용한 snapshot이 된다.
    * 해당 옵션은 5.5 부터 추가되었다. http://dev.mysql.com/doc/refman/5.5/en/mysqldump.html#option_mysqldump_dump-slave

### General log 확인
    
    
        General-log
        /*
        141216  1:50:43    50 Connect   root@localhost on 
                   50 Query /*!40100 SET @@SQL_MODE='' */
                   50 Query /*!40103 SET TIME_ZONE='+00:00' */
                   50 Query SHOW SLAVE STATUS
                   50 Query STOP SLAVE SQL_THREAD
                   ...
                   ...
    

### 각 옵션에 따른 dump결과 비교

  * 일반적인 dump 
    * /db/5.6/bin/mysqldump -uroot --single-transaction --opt --all-databases > ori.sql
    
    
        /*
        SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
        SET @@SESSION.SQL_LOG_BIN= 0;
    
        --
        -- Current Database: `cm`
        --
    
        CREATE DATABASE /*!32312 IF NOT EXISTS*/ `cm` /*!40100 DEFAULT CHARACTER SET latin1 */;
    
        USE `cm`;
        */
    

  * dump-slave 이용  

    * /db/5.6/bin/mysqldump -uroot --single-transaction --opt --all-databases --dump-slave=2 > d2.sql
    * 해당값은 master-data와 마찬가지로 0,1,2 를 줄 수 있다. 2는 주석
    * slave에서 백업을 받지만 CHANGE MASTER TO MASTER_LOG_FILE=xxx 라는 명령어를 볼 수 있다.
    
    
        /*
        SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
        SET @@SESSION.SQL_LOG_BIN= 0;
    
        --
        -- Position to start replication or point-in-time recovery from (the master of this slave)
        --
    
        -- CHANGE MASTER TO MASTER_LOG_FILE='mysql-bin.000015', MASTER_LOG_POS=682;
    
        --
        -- Current Database: `cm`
        --
    
        CREATE DATABASE /*!32312 IF NOT EXISTS*/ `cm` /*!40100 DEFAULT CHARACTER SET latin1 */;
    
        USE `cm`;
        */
    

  * dump-slave 와 apply-slave-statements 옵션 추가 
    * dump 결과에 stop slave 및 추가적으로 slave를 구성하기 위한 구문이 적혀있다.
    
    
        /*
        --
        -- stop slave statement to make a recovery dump)
        --
    
        STOP SLAVE;
        SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
        SET @@SESSION.SQL_LOG_BIN= 0;
    
    
        --
        -- Position to start replication or point-in-time recovery from (the master of this slave)
        --
    
        -- CHANGE MASTER TO MASTER_LOG_FILE='mysql-bin.000015', MASTER_LOG_POS=682;
    
        --
        -- Current Database: `cm`
        --
    
        CREATE DATABASE /*!32312 IF NOT EXISTS*/ `cm` /*!40100 DEFAULT CHARACTER SET latin1 */;
    
        USE `cm`;
        */
    

  * dump-slave 와 apply-slave-statements , include-master-host-port 옵션 추가 
    * dump 결과에 stop slave 및 추가적으로 slave를 구성하기 위한 구문이 적혀있다.
    * Change master 구문에서 추가로 MASTER_HOST='xxx.xxx.xxx.xxx', MASTER_PORT=3306 항목을 볼 수 있다. (이 정보들은 show slave status 에서 가져온다.)
    
    
        /*
        --
        -- stop slave statement to make a recovery dump)
        --
    
        STOP SLAVE;
        SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
        SET @@SESSION.SQL_LOG_BIN= 0;
    
    
        --
        -- Position to start replication or point-in-time recovery from (the master of this slave)
        --
    
        -- CHANGE MASTER TO MASTER_HOST='192.168.74.202', MASTER_PORT=3306, MASTER_LOG_FILE='mysql-bin.000015', MASTER_LOG_POS=682;
    
        --
        -- Current Database: `cm`
        --
    
        CREATE DATABASE /*!32312 IF NOT EXISTS*/ `cm` /*!40100 DEFAULT CHARACTER SET latin1 */;
    
        USE `cm`;
        */