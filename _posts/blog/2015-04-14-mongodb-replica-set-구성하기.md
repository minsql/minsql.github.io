---
title: MongoDB Replica Set 구성하기
author: min_kim
created: 2015/04/14 13:27:04
modified:
layout: post
tags: Mongo
image:
  feature: mongo.png
categories: blog
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---




# MongoDB Replica Set 구성하기

MongoDB Replica Set 구성하기

## MongoDB three-member replica set 구성하기

> three mongod instance를 사용해서 구성한다. access control은 disable(by default)로 구성함.

### 1\. 개요

Three member replica sets은 redundancy를 제공하고, read operations에 대한 충분한 capacity를 제공한다. Replica set은 항상 홀수개로 구성되어야한다. 이는 election과정을 문제없이 진행하기 위해서이다.

### 2\. 요구사항

  * production목적으로 구성하는 경우, 각 mongod 인스턴스를 분리된 machine에 구성한다.
  * replica set 구성에 앞서 MongoDB를 각 시스템에 install한다.
  * 각 멤버간 network connection이 가능한지 확인한다.

```
    [root@testvm1 mongo]#  mongo --host testvm2 --port 27017
    MongoDB shell version: 2.6.9
    connecting to: testvm2:27017/test
    > exit
    bye
    [root@testvm1 mongo]#  mongo --host testvm3 --port 27017
    MongoDB shell version: 2.6.9
    connecting to: testvm3:27017/test
    connecting to: testvm3:27017/test
    > exit
    bye
```

### 3\. 고려사항

#### 3.1 Architecture

  * production이라면, 각 멤버는 dedicated machine에 구성한다.
  * 가능한한, MongoDB standard port 27017사용한다.
  * bind_ip option을 사용하여 접속허용할 address를 구성한다.
  * 지리적으로 분산된 replica set을 구성한다면, mongod 인스턴스의 과반수이상는 primary site에 위치시킨다.

#### 3.2 Connectivity

  * replica set member간, clients에서 replica set 네트워크 연결을 안전하고 효율적으로 구성한다.
  * 다음과 같은 방법들의 도입을 고려해볼 수 있다.
    * virtual private network 구축 : 멤버들간의 모든 traffic을 하나의 site내에서 route되게 함.
    * access control 구성 : unknown client로 부터의 접근을 차단
    * networking/firwall rules : incoming/outgoing packets의 허용 룰 세팅.
  * 마지막으로, replica set의 각 멤버들이 DNS나 hostname에 의해 resolve가능한지 확인한다.
    * DNS names를 적절하게 구성하거나, /etc/hosts 파일에 정확하게 명시한다.

#### 3.3 Configuration

  * configuration file : **/etc/mongodb.conf** or **/지정한 location/mongod.conf**
  * MongoDB data files를 저장할 directory를 생성한다.
  * 필요한 run time options, configuration options 구성한다.

### 4\. 구성!

#### 4.1 적절한 options와 함께 각 멤버를 startup한다.

  * 각 멤버를 시작할때 **replSet** option을 사용한다. 이 옵션은 replica set name을 지정한다.
  * 모든 멤버를 다음과 같은 방법으로 startup시킨다.
  * command-line option으로 시작하기


    ```mongod --replSet "rs0"```


  * configuration file에 replica set name 지정하고, --config option에서 해당 configuration file명시하기

```
    [mongo@testvm1 ~]$ vi /db/mongo/mongod.conf
    # in replicated mongo databases, specify the replica set name here
    replSet=rs0
    [mongo@testvm1 ~]$ mongod --config /db/mongo/mongod.conf
    about to fork child process, waiting until server is ready for connections.
    forked process: 27797
    child process started successfully, parent exiting
```

  * control script(/etc/rc.d or /etc/init.d)로 process관리한다면 해당 스크립트를 수정한다.

#### 4.2 replica set 멤버에 mongo shell을 통해 접속해보자.

```
    [mongo@testvm1 ~]$ mongo
    MongoDB shell version: 2.6.9
    connecting to: test
    >
```

#### 4.3 replica set 초기화하기

  * **rs.initiate()** 으로 초기화
    * 현재 멤버가 소속된 replica set을 default replica set 구성으로 초기화한다.
  * PRIMARY 에서 커맨드하면 됨

```
    > rs.initiate()
    {
            "info2" : "no configuration explicitly specified -- making one",
            "me" : "testvm1:27017",
            "info" : "Config now saved locally.  Should come online in about a minute.",
            "ok" : 1
    }
    >
```

#### 4.4 replica set configuration 확인하기

  * **rs.conf()**

```
    rs0:PRIMARY> rs.conf()
    {
            "_id" : "rs0",
            "version" : 1,
            "members" : [
                    {
                            "_id" : 0,
                            "host" : "testvm1:27017"
                    }
            ]
    }
```

#### 4.5 다른 멤버들을 replica set으로 추가하자.

  * **rs.add()**

```
    rs0:PRIMARY> rs.add("testvm2:27017")
    { "ok" : 1 }
    rs0:PRIMARY> rs.add("testvm3:27017")
    { "ok" : 1 }

```

#### 4.6 status check

  * **rs.status()**

```
    rs0:PRIMARY> rs.status()
    {
            "set" : "rs0",
            "date" : ISODate("2015-03-27T18:08:25Z"),
            "myState" : 1,
            "members" : [
                    {
                            "_id" : 0,
                            "name" : "testvm1:27017",
                            "health" : 1,
                            "state" : 1,
                            "stateStr" : "PRIMARY",
                            "uptime" : 1173,
                            "optime" : Timestamp(1427479681, 1),
                            "optimeDate" : ISODate("2015-03-27T18:08:01Z"),
                            "electionTime" : Timestamp(1427478890, 1),
                            "electionDate" : ISODate("2015-03-27T17:54:50Z"),
                            "self" : true
                    },
                    {
                            "_id" : 1,
                            "name" : "testvm2:27017",
                            "health" : 1,
                            "state" : 2,
                            "stateStr" : "SECONDARY",
                            "uptime" : 26,
                            "optime" : Timestamp(1427479681, 1),
                            "optimeDate" : ISODate("2015-03-27T18:08:01Z"),
                            "lastHeartbeat" : ISODate("2015-03-27T18:08:25Z"),
                            "lastHeartbeatRecv" : ISODate("2015-03-27T18:08:24Z"),
                            "pingMs" : 5,
                            "syncingTo" : "testvm1:27017"
                    },
                    {
                            "_id" : 2,
                            "name" : "testvm3:27017",
                            "health" : 1,
                            "state" : 2,
                            "stateStr" : "SECONDARY",
                            "uptime" : 24,
                            "optime" : Timestamp(1427479681, 1),
                            "optimeDate" : ISODate("2015-03-27T18:08:01Z"),
                            "lastHeartbeat" : ISODate("2015-03-27T18:08:23Z"),
                            "lastHeartbeatRecv" : ISODate("2015-03-27T18:08:24Z"),
                            "pingMs" : 1,
                            "syncingTo" : "testvm1:27017"
                    }
            ],
            "ok" : 1
    }
```


### 5\. Simple test

#### 5.1 secondary에서 write

  * wrietError 난다

```
    rs0:SECONDARY> db.test.insert({'message':'secondary'});
    WriteResult({ "writeError" : { "code" : undefined, "errmsg" : "not master" } })
```


#### 5.2 primary에서 write

```
    rs0:PRIMARY> db
    test
    rs0:PRIMARY> for (var i = 1; i <= 10; i++) {
    ...    db.test.insert( { x : i } )
    ... }
    WriteResult({ "nInserted" : 1 })
    rs0:PRIMARY>
```

#### 5.3 secondary에서 find

  * slave read 허용이 안되어있음

```
    rs0:SECONDARY> db.test.find()
    error: { "$err" : "not master and slaveOk=false", "code" : 13435 }
    rs0:SECONDARY>
```

  * slave read 허용 후 확인

```
rs0:SECONDARY> rs.slaveOk()
rs0:SECONDARY> db.test.find()
{ "_id" : ObjectId("55159e012f98258995d11a1b"), "x" : 1 }
{ "_id" : ObjectId("55159e012f98258995d11a1c"), "x" : 2 }
{ "_id" : ObjectId("55159e012f98258995d11a1d"), "x" : 3 }
{ "_id" : ObjectId("55159e012f98258995d11a1e"), "x" : 4 }
{ "_id" : ObjectId("55159e012f98258995d11a1f"), "x" : 5 }
{ "_id" : ObjectId("55159e012f98258995d11a20"), "x" : 6 }
{ "_id" : ObjectId("55159e012f98258995d11a21"), "x" : 7 }
{ "_id" : ObjectId("55159e012f98258995d11a22"), "x" : 8 }
{ "_id" : ObjectId("55159e012f98258995d11a23"), "x" : 9 }
{ "_id" : ObjectId("55159e012f98258995d11a24"), "x" : 10 }
```
