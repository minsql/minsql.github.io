---
title: MongoDB Filesystem snapshot을 사용한 백업리스토어
author: min_kim
created: 2015/04/16 10:28:50
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


# MongoDB Filesystem snapshot을 사용한 백업/리스토어

MongoDB Filesystem snapshot을 사용한 백업/리스토어

## MongoDB Filesystem snapshot을 사용한 백업/리스토어

> system-level 툴을 사용하여 MongoDB의 백업을 생성해보자. Filesystem snapshot("block-level" backup)은 system level 툴을 사용하여 생성한 MongoDB의 데이터파일의 copy본을 의미한다. 이 방식은 빠르고 신뢰할만 하지만 MongoDB외의 system 관련 구성이 필요하다. 간단하게 Linux system 의 LVM을 사용하여 백업을 진행해 보자.

### 1\. Create a Snapshot

  * lvcreate 명령을 사용한다 다음의 옵션을 확인한다.
    * 예시 : `lvcreate --size 100M --snapshot --name mdb-snap01 /dev/vg_vm3/lv_data`
    * LVM 스냅샷을 생성한다. : **\--snapshot** option
    * 스냅샷 이름 : mdb-snap01
    * 스냅샷 받을 볼륨 그룹 : /dev/vg_vm2/lv_data
    * size : 이건 전체 스냅샷의 사이즈를 의미하는 것이 아니라 현재 볼륨과 snapshot볼륨간의 difference를 저장할 용량을 의미한다.
    * 스냅샷 위치 : /dev/vg_vm2/mdb-snap01
  * 생성해보자
    * ([필요시에만..) 사용중인 볼륨 사이즈를 조정한다. 지금 100%에 대해 logical volumn생성한 상태인데, vgreduce를 통해 줄인다.

```
    [root@testvm1 ~]# lvreduce --size 9.5G /dev/vg_vm3/lv_data
      WARNING: Reducing active and open logical volume to 9.50 GiB
      THIS MAY DESTROY YOUR DATA (filesystem etc.)
    Do you really want to reduce lv_data? [y/n]: y
      Reducing logical volume lv_data to 9.50 GiB
      Logical volume lv_data successfully resized
    [root@testvm1 ~]# umount /data1
    [root@testvm1 ~]# e2fsck -f /dev/vg_vm3/lv_data
    [root@testvm1 ~]# resize2fs /dev/vg_vm3/lv_data
```


  * 그리고 스냅샷 볼륨을 생성해본다.

```
    [root@testvm1 ~]# lvcreate --size 100M --snapshot --name mdb-snap01 /dev/vg_vm3/lv_data
      Logical volume "mdb-snap01" created
```

  * 만약 스냅샷 볼륨의 공간이 부족하게 되면, 이 스냅샷 이미지는 못쓰게 된다. 버리고 다시 생성해야한다.
  * 스냅샷이 백업을 빠르게 생성하는 방법이긴 하지만, 사실 백업 데이터를 보관하는데에는 좋은 포맷이 아니다. 오리지널과 동일한 storage환경에서만 동작하기 때문에, 이 스냅샷을 별도 장비에 archive하는 것은 좋은 방법이 아니다.

### 2\. Archive a Snapshot

  * shapshot을 mount하고, 다른 시스템을 copy할 수 있다.
  * 또는, backup image를 압축해서 옮길수도 있다.

```
    [root@testvm1 ~]# dd if=/dev/vg_vm3/mdb-snap01 | gzip > /db/mongo/mdb-snap01.gz &
    19922944+0 records in
    19922944+0 records out
    10200547328 bytes (10 GB) copied, 169.867 s, 60.1 MB/s
```

### 3\. Restore a Snapshot

  * snapshot을 restore해보자
    * 새로운 logical volume lv_backupsnap을 만들고, 거기에 snapshot을 restore한다.
    * 사이즈는 original file system 사이즈와 같거나 더 커야한다.

```
    [root@testvm1 ~]# lvcreate -l 100%FREE --name lv_backupsnap vg_vm4
      Logical volume "lv_backupsnap" created
    [root@testvm1 ~]# gzip -d -c /db/mongo/mdb-snap01.gz  | dd of=/dev/vg_vm4/lv_backupsnap
    19922944+0 records in
    19922944+0 records out
    10200547328 bytes (10 GB) copied, 343.295 s, 29.7 MB/s

    [root@testvm1 ~]# mount /dev/vg_vm4/lv_backupsnap /backupsnap/
```

### 4\. Remove a Snapshot

  * 스냅샷 볼륨을 정리한다.

```
    [root@testvm1 ~]#  lvremove /dev/vg_vm3/mdb-snap01
    Do you really want to remove active logical volume mdb-snap01? [y/n]: y
      Logical volume "mdb-snap01" successfully removed
    [root@testvm1 ~]#
```
