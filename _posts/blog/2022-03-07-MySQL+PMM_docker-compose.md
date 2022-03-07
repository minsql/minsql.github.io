---
title: MySQL+PMM docker-compose
author: min_kim
created: 2022/03/07
modified:
layout: post
tags: mysql pmm docker
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# MySQL PMM docker-compose
> 나만의 MySQL replication and PMM 테스트 환경을 만들자

## docker-compose file작성하기
https://github.com/chrodriguez/mysql-gtid-test 를 참조해서 작성함.
* mysql replication 만 테스트 할것이고 pmm으로 monitoring을 하고 싶다. pmm도 같이 한방에 띄우기 위해 작성하였다.

https://github.com/fabmichaela/mysql_pmm_test/blob/main/docker-compose.yaml

## 시작하기
```
docker compose up -d
```

## replication 구성하기
* 3301를 master로 3302를 slave로 사용한다.
* 첨에 띄우면 그냥 각각 standalone으로 뜬다
* GTID모드를 사용할 것이라, auto_position으로 붙여줄 예정이다.
* 각각의 데이터는 볼륨컨테이너, one, two를 사용하므로 docker restart되어도 유지된다.

### one(master): create replication user
```
mysql -uroot -ptest -h127.0.0.1 -P3301
CREATE USER 'repl'@'%' IDENTIFIED BY 'repl';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%';
exit
```

### two(slave): change master and start slave
```
mysql -uroot -ptest -h127.0.0.1 -P3302
change master to master_host='one',master_port=3306, master_user='repl', \
  master_password='repl', master_auto_position=1;
start slave;
show slave status \G
```


## monitoring using pmm
* 이것이 핵심
* 테스트하면서 지표를 바로 보고 싶다.
* docker-compose에 pmm-server, pmm-client도 같이 생성했다.
* 처음 시작시에 다음과 같이 pmm에 mysql서비스를 등록해준다.

### one(master): create pmm user
```
mysql -uroot -ptest -h127.0.0.1 -P3301
CREATE USER 'pmm'@'%' IDENTIFIED BY 'pmm' WITH MAX_USER_CONNECTIONS 10;
GRANT SELECT, PROCESS, REPLICATION CLIENT, RELOAD, BACKUP_ADMIN ON *.* TO 'pmm'@'%';
```

### pmm-admin add
```
docker exec mysql-replication_pmm-client_1 \
pmm-admin add mysql --cluster=my80replication --replication-set=my80replication --username=pmm --password=pmm --query-source=perfschema  --service-name=one --host=one --port=3306

docker exec mysql-replication_pmm-client_1 \
pmm-admin add mysql --cluster=my80replication --replication-set=my80replication --username=pmm --password=pmm --query-source=perfschema --service-name=two --host=two --port=3306
```

### comment out PMM_AGENT_SETUP=1 on docker-compose.yaml
```
      # - PMM_AGENT_SETUP=1 ## used at first setup only
```

### pmm-server 확인
![pmm-one-two]({{site_url}}/uploads/pmm-one-two.png)

one, two service가 보이면 OK