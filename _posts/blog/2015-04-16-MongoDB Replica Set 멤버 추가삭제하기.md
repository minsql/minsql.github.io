---
title: MongoDB Replica Set 멤버 추가삭제하기
author: min_kim
created: 2015/04/16 10:32:05
modified:
layout: post
tags: mongo
image:
  feature: mongo.png
categories: Mongo
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---



# MongoDB Replica Set 멤버 추가/삭제하기

## MongoDB Replica Set 멤버 추가/삭제하기

> 운영중인 replica set에 멤버를 추가/삭제해보자.

### 1\. 개요

#### 1.1 Maximum Voting Members

voting member는 최대 7개까지 구성할수 있다. 이미 7개의 votes가 존재하는 replica set에 멤버를 추가하는 경우에는, 추가할 멤버를 non-voting member로 설정하거나, 기존 멤버에서 votes를 제거해야한다.

#### 1.2 Control Scripts

control script를 사용한다면 이 스크립트도 수정한다.

#### 1.3 Existing Members

remove한 멤버를 다시 추가할수도 있다. 만약 remove했던 멤버의 데이터가 최신이었다면, recover, catch up을 쉽게 할수 있다.

#### 1.4 Data Files

기존멤버의 백업이나 스냅샷이 있는 경우, 해당 data files를 copy해서 바로 new member로 추가할 수 있다. * 정상적인 백업파일이어야한다. * filesystem snapshot을 사용하도록 한다. * **mongodump** 나 **mongorestore**을 사용하지 않는다. * 가장 오래된 primary의 oplog보다 최근의 백업파일이어야한다. * 새로 추가된 멤버가 primary의 oplog를 적용해서 최신상태로 따라와야한다. * **참조** : [MongoDB 스냅샷백업](/uncategorized/mongodb-filesystem-snapshot%ec%9d%84-%ec%82%ac%ec%9a%a9%ed%95%9c-%eb%b0%b1%ec%97%85%eb%a6%ac%ec%8a%a4%ed%86%a0%ec%96%b4/)

### 2\. 필수요건

  * 운영중인 replica set
  * 새로운 MongoDB 시스템. replica set과 네트워크 연결 가능한 시스템
    * **참조** : [MongoDB 설치](/others/mongodb-installation-2/)

### 3\. 프로세스

#### 3.1 Data Directory 준비

새로운 멤버를 기존의 replica set에 추가하기전에, data directory를 단계에 따라 준비한다. * data directory를 준비. 다른 데이터를 포함하지 않은 빈 디렉터리여야한다.

```
    [root@testvm4 ~]# mkdir /db/mongo
    [root@testvm4 ~]# chown -R mongo. /db/mongo
    [root@testvm4 ~]# mkdir /data1/mongo
    [root@testvm4 ~]# chown -R mongo. /data1/mongo
```

  * 수동으로 기존의 멤버의 data directory를 copy한다.
    * 새멤버를 secondary member로 추가하게 되면 replica set의 현상태를 따라잡게 된다.

```
    [mongo@testvm4 ~]$ cd /data1/mongo
    [mongo@testvm4 mongo]$ ll
    total 0
    [mongo@testvm4 mongo]$ scp -pr testvm1:/backupsnap/mongo/* . #스냅샷백업본에서 카피
    ...
```

#### 3.2 기존의 repica set으로 mongod instanace 시작한다.

  * configuration file 생성하고 시작한다.

```
    [mongo@testvm4 ~]$ cd /db/mongo
    [mongo@testvm4 mongo]$ scp testvm1:/db/mongo/mongod.conf .
    mongo@testvm1's password:
    mongod.conf                                   100% 1513     1.5KB/s   00:00
    [root@testvm4 mongo]# grep "replSet" mongod.conf            # 기존 replSet으로 지정
    replSet=rs0
    [root@testvm4 mongo]#  mongod -f /db/mongo/mongod.conf
    about to fork child process, waiting until server is ready for connections.
    forked process: 2131
    child process started successfully, parent exiting
```

#### 3.3 replica set의 primary로 접속

```
    [mongo@testvm1 ~]$ mongo
    MongoDB shell version: 2.6.9
    connecting to: test
    rs0:PRIMARY> db.isMaster()
    {
            "setName" : "rs0",
            "setVersion" : 3,
            "ismaster" : true,
            "secondary" : false,
            "hosts" : [
                    "testvm1:27017",
                    "testvm3:27017",
                    "testvm2:27017"
            ],
            "primary" : "testvm1:27017",
            "me" : "testvm1:27017",
            "maxBsonObjectSize" : 16777216,
            "maxMessageSizeBytes" : 48000000,
            "maxWriteBatchSize" : 1000,
            "localTime" : ISODate("2015-04-15T07:12:02.755Z"),
            "maxWireVersion" : 2,
            "minWireVersion" : 0,
            "ok" : 1
    }
```


#### 3.4 멤버 추가 명령

  * 추가하기전에 변경발생시켜두자

```
    rs0:PRIMARY> for (var i = 1; i <= 100000; i++) {    db.test1.insert( { x : i } ) }
    WriteResult({ "nInserted" : 1 })
```

  * 멤버추가

```
    rs0:PRIMARY> rs.add("testvm4:27017")
    { "ok" : 1 }
```

#### 3.5 확인

  * rs.conf()확인

```
    rs0:PRIMARY> rs.conf()
    {
            "_id" : "rs0",
            "version" : 4,
            "members" : [
                    {
                            "_id" : 0,
                            "host" : "testvm1:27017"
                    },
                    {
                            "_id" : 1,
                            "host" : "testvm2:27017"
                    },
                    {
                            "_id" : 2,
                            "host" : "testvm3:27017"
                    },
                    {
                            "_id" : 3,
                            "host" : "testvm4:27017"
                    }
            ]
    }
```

  * 슬레이브 catch up확인

```
    [root@testvm4 ~]# mongo
    MongoDB shell version: 2.6.9
    connecting to: test
    rs0:SECONDARY> rs.slaveOk()
    rs0:SECONDARY> db.test1.count()
    90018
    rs0:SECONDARY> db.test1.count()
    100000
```

### 4\. 멤버 삭제하기

#### 4.1 rs.remove()

  * 삭제할 멤버의 인스턴스를 shutdown한다.

```
    rs0:SECONDARY> use admin
    switched to db admin
    rs0:SECONDARY>  db.shutdownServer()
    2015-04-16T11:08:33.496+1000 DBClientCursor::init call() failed
    server should be down...
    2015-04-16T11:08:33.503+1000 trying reconnect to 127.0.0.1:27017 (127.0.0.1) failed
    2015-04-16T11:08:33.511+1000 warning: Failed to connect to 127.0.0.1:27017, reason: errno:111 Connection refused
    2015-04-16T11:08:33.511+1000 reconnect 127.0.0.1:27017 (127.0.0.1) failed failed couldn't connect to server 127.0.0.1:27017 (127.0.0.1), connection attempt failed
    >
```

  * primary로 접속하여 rs.remove() 명령한다.

```
    rs0:PRIMARY> rs.remove("testvm4:27017")
    2015-04-15T17:21:48.106+1000 DBClientCursor::init call() failed
    2015-04-15T17:21:48.108+1000 Error: error doing query: failed at src/mongo/shell/query.js:81
    2015-04-15T17:21:48.110+1000 trying reconnect to 127.0.0.1:27017 (127.0.0.1) failed
    2015-04-15T17:21:48.112+1000 reconnect 127.0.0.1:27017 (127.0.0.1) ok
    rs0:PRIMARY>
```
