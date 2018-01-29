---
title: MongoDB Installation
author: min_kim
created: 2015/04/10 14:59:58
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



# MongoDB Installation

### 1.yum install mongodb


    [root@testvm3 ~]# yum install mongodb
    Loaded plugins: fastestmirror
    Determining fastest mirrors
    ...
    ================================================================================
     Package                  Arch      Version                    Repository  Size
    ================================================================================
    Installing:
     mongodb                  x86_64    2.4.12-3.el6               epel        35 M
    ...


: repository에 있는 버전은 2.4.6임 **최신버전을 깔겠음. repository update후 다시 yum install**


    [root@testvm1 ~]# cd /etc/yum.repos.d/
    [root@testvm1 yum.repos.d]# vi mongodb.repo
    [mongodb]
    name=MongoDB Repository
    baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64/
    gpgcheck=0
    enabled=1

    [root@testvm1 yum.repos.d]#
    [root@testvm1 yum.repos.d]# yum install mongodb-org
    Loaded plugins: fastestmirror
    Loading mirror speeds from cached hostfile
     * base: centos.mirror.crucial.com.au
     * epel: epel.syd.au.glomirror.com.au
     * extras: centos.mirror.crucial.com.au
     * updates: centos.mirror.crucial.com.au
    mongodb                                                                                                                                        |  951 B     00:00     
    mongodb/primary                                                                                                                                |  37 kB     00:00     
    mongodb                                                                                                                                                       240/240
    Setting up Install Process
    Resolving Dependencies
    --> Running transaction check
    ---> Package mongodb-org.x86_64 0:2.6.5-1 will be installed
    --> Processing Dependency: mongodb-org-shell = 2.6.5 for package: mongodb-org-2.6.5-1.x86_64
    --> Processing Dependency: mongodb-org-server = 2.6.5 for package: mongodb-org-2.6.5-1.x86_64
    --> Processing Dependency: mongodb-org-mongos = 2.6.5 for package: mongodb-org-2.6.5-1.x86_64
    --> Processing Dependency: mongodb-org-tools = 2.6.5 for package: mongodb-org-2.6.5-1.x86_64
    --> Running transaction check
    ---> Package mongodb-org-mongos.x86_64 0:2.6.5-1 will be installed
    ---> Package mongodb-org-server.x86_64 0:2.6.5-1 will be installed
    ---> Package mongodb-org-shell.x86_64 0:2.6.5-1 will be installed
    ---> Package mongodb-org-tools.x86_64 0:2.6.5-1 will be installed
    --> Finished Dependency Resolution

    Dependencies Resolved

    ======================================================================================================================================================================
     Package                                         Arch                                Version                               Repository                            Size
    ======================================================================================================================================================================
    Installing:
     mongodb-org                                     x86_64                              2.6.5-1                               mongodb                              4.6 k
    Installing for dependencies:
     mongodb-org-mongos                              x86_64                              2.6.5-1                               mongodb                              6.8 M
     mongodb-org-server                              x86_64                              2.6.5-1                               mongodb                              9.0 M
     mongodb-org-shell                               x86_64                              2.6.5-1                               mongodb                              4.3 M
     mongodb-org-tools                               x86_64                              2.6.5-1                               mongodb                               89 M

    Transaction Summary
    ======================================================================================================================================================================
    Install       5 Package(s)

    Total download size: 109 M
    Installed size: 276 M
    Is this ok [y/N]: y
    Downloading Packages:
    (1/5): mongodb-org-2.6.5-1.x86_64.rpm                                                                                                          | 4.6 kB     00:00     
    (2/5): mongodb-org-mongos-2.6.5-1.x86_64.rpm                                                                                                   | 6.8 MB     00:08     
    (3/5): mongodb-org-server-2.6.5-1.x86_64.rpm                                                                                                   | 9.0 MB     00:09     
    (4/5): mongodb-org-shell-2.6.5-1.x86_64.rpm                                                                                                    | 4.3 MB     00:06     
    (5/5): mongodb-org-tools-2.6.5-1.x86_64.rpm                                                                                                    |  89 MB     01:57     
    ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    Total                                                                                                                                 733 kB/s | 109 MB     02:32     
    Running rpm_check_debug
    Running Transaction Test
    Transaction Test Succeeded
    Running Transaction
    Warning: RPMDB altered outside of yum.
      Installing : mongodb-org-server-2.6.5-1.x86_64                                                                                                                  1/5
      Installing : mongodb-org-shell-2.6.5-1.x86_64                                                                                                                   2/5
      Installing : mongodb-org-tools-2.6.5-1.x86_64                                                                                                                   3/5
      Installing : mongodb-org-mongos-2.6.5-1.x86_64                                                                                                                  4/5
      Installing : mongodb-org-2.6.5-1.x86_64                                                                                                                         5/5
      Verifying  : mongodb-org-mongos-2.6.5-1.x86_64                                                                                                                  1/5
      Verifying  : mongodb-org-tools-2.6.5-1.x86_64                                                                                                                   2/5
      Verifying  : mongodb-org-shell-2.6.5-1.x86_64                                                                                                                   3/5
      Verifying  : mongodb-org-2.6.5-1.x86_64                                                                                                                         4/5
      Verifying  : mongodb-org-server-2.6.5-1.x86_64                                                                                                                  5/5

    Installed:
      mongodb-org.x86_64 0:2.6.5-1                                                                                                                                        

    Dependency Installed:
      mongodb-org-mongos.x86_64 0:2.6.5-1      mongodb-org-server.x86_64 0:2.6.5-1      mongodb-org-shell.x86_64 0:2.6.5-1      mongodb-org-tools.x86_64 0:2.6.5-1     

    Complete!


* * *

### 2\. mongo유저로 구성,관리되도록 환경 구성

#### 2.1. 유저,디렉터리 준비(root)


    [root@testvm1 db]# useradd mongo
    [root@testvm1 db]# passwd mongo

    [root@testvm1 db]# mkdir /db/mongo
    [root@testvm1 db]# mkdir /data1/mongo

    [root@testvm1 db]# mv /etc/mongod.conf /db/mongo/
    [root@testvm1 db]# chown -R mongo. /db/mongo
    [root@testvm1 db]# chown -R mongo. /data1/mongo


#### 2.2. configuration file 수정(mongo user)


    [mongo@testvm1 ~]$ vi /db/mongo/mongod.conf
    # mongod.conf

    #where to log

    logappend=true

    # fork and run in background
    fork=true

    #port=27017

    dbpath=/data1/mongo

    # location of pidfile
    pidfilepath=/db/mongo/mongod.pid

    # Listen to local interface only. Comment out to listen on all interfaces.
    #bind_ip=127.0.0.1

    ...

#### 2.3 startup

    [mongo@testvm1 journal]$ mongod -f /db/mongo/mongod.conf
    about to fork child process, waiting until server is ready for connections.
    forked process: 3894
    child process started successfully, parent exiting

#### 2.4 shutdown

    [mongo@testvm1 journal]$ mongod -f /db/mongo/mongod.conf --shutdown
    killing process with pid: 3894

### 3. 간단 CRUD

#### 3.1 insert, select

    [mongo@testvm1 db]$ mongo
    MongoDB shell version: 2.6.9
    connecting to: test
    Welcome to the MongoDB shell.
    For interactive help, type "help".
    For more comprehensive documentation, see
            http://docs.mongodb.org/
    Questions? Try the support group
            http://groups.google.com/group/mongodb-user
    > db
    test
    > db.test.find();
    > db.test.insert({'message':'hello'});
    WriteResult({ "nInserted" : 1 })
    > db.test.find();
    { "_id" : ObjectId("5510b4b76f965f5632f726dc"), "message" : "hello" }
    > db.test.count();


#### 3.2 update

    > db.test.update({'message':'hello'},{'message':'bye'});
    WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })
    > db.test.find();
    { "_id" : ObjectId("5510b4b76f965f5632f726dc"), "message" : "bye" }
    >

#### 3.3 remove
    > db.test.remove({ "_id" : ObjectId("5510b4b76f965f5632f726dc")});
    WriteResult({ "nRemoved" : 1 })
    > db.test.count();
    0
