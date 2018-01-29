---
title: MongoDB Replica Set status 확인하기
author: min_kim
created: 2015/04/16 14:55:36
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




# MongoDB Replica Set status 확인하기

## MongoDB Replica Set status 확인하기

> Replica Set 상태 확인하는 몇가지 명령어를 알아보자

### 1\. Check Replica Set Status

  * primary에서 **rs.status()** 로 확인

```
    rs0:PRIMARY>  rs.status()
    {
            "set" : "rs0",
            "date" : ISODate("2015-04-15T10:56:27Z"),
            "myState" : 1,
            "members" : [
                    {
                            "_id" : 0,
                            "name" : "testvm1:27017",
                            "health" : 1,
                            "state" : 1,
                            "stateStr" : "PRIMARY",
                            "uptime" : 13616,
                            "optime" : Timestamp(1429084514, 1),
                            "optimeDate" : ISODate("2015-04-15T07:55:14Z"),
                            "electionTime" : Timestamp(1429081894, 1),
                            "electionDate" : ISODate("2015-04-15T07:11:34Z"),
                            "self" : true
                    },
                    {
                            "_id" : 1,
                            "name" : "testvm2:27017",
                            "health" : 1,
                            "state" : 2,
                            "stateStr" : "SECONDARY",
                            "uptime" : 10873,
                            "optime" : Timestamp(1429084514, 1),
                            "optimeDate" : ISODate("2015-04-15T07:55:14Z"),
                            "lastHeartbeat" : ISODate("2015-04-15T10:56:25Z"),
                            "lastHeartbeatRecv" : ISODate("2015-04-15T10:56:26Z"),
                            "pingMs" : 0,
                            "syncingTo" : "testvm1:27017"
                    },
                    {
                            "_id" : 2,
                            "name" : "testvm3:27017",
                            "health" : 1,
                            "state" : 2,
                            "stateStr" : "SECONDARY",
                            "uptime" : 10873,
                            "optime" : Timestamp(1429084514, 1),
                            "optimeDate" : ISODate("2015-04-15T07:55:14Z"),
                            "lastHeartbeat" : ISODate("2015-04-15T10:56:25Z"),
                            "lastHeartbeatRecv" : ISODate("2015-04-15T10:56:26Z"),
                            "pingMs" : 0,
                            "syncingTo" : "testvm1:27017"
                    }
            ],
            "ok" : 1
    }
```

### 2\. Check the Replication Lag

  * primary에서 **rs.printSlaveReplicationInfo()**

```
    rs0:PRIMARY> rs.printSlaveReplicationInfo()
    source: testvm2:27017
            syncedTo: Wed Apr 15 2015 17:55:14 GMT+1000 (EST)
            0 secs (0 hrs) behind the primary
    source: testvm3:27017
            syncedTo: Wed Apr 15 2015 17:55:14 GMT+1000 (EST)
            0 secs (0 hrs) behind the primary
    rs0:PRIMARY>
```

### 3\. Check the Size of the Oplog

  * 멤버별로 체크 가능함. **rs.printReplicationInfo()**

```
    rs0:PRIMARY> rs.printReplicationInfo()
    configured oplog size:   990MB
    log length start to end: 1605625secs (446.01hrs)
    oplog first event time:  Sat Mar 28 2015 04:54:49 GMT+1100 (EST)
    oplog last event time:   Wed Apr 15 2015 17:55:14 GMT+1000 (EST)
    now:                     Wed Apr 15 2015 21:14:28 GMT+1000 (EST)
```

  * oplog사이즈는 replication lag를 얼마나 허용할 건지에 따라서 용량을 산정해야한다.
  * 위 예제환경의 경우, oplog사이즈가 990MB이고 446시간정도의 transaction을 저장할수 있다. 이 사이즈가 발생가능한 가장 긴 secondary downtime을 커버할수 있는지 체크하면 된다.
