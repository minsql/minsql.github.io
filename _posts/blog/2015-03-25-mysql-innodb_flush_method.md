---
title: MySQL innodb_flush_method
author: min_kim
created: 2015/03/25 10:06:08
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


# MySQL innodb_flush_method

## innodb_flush_method

> InnoDB가 dafa files, log files로 data를 flush하는 방법

### On Unix and Linux

  * options
    * fsync(default)
    * O_DSYNC
    * O_DIRECT
    * O_DIRECT_NO_FSYNC
  * 각 옵션별 logfile, data file flush method 표
  <table>
  <thead>
  <tr>
    <th>Method</th>
    <th>log file open</th>
    <th>logfile flush</th>
    <th>data file open</th>
    <th>data file flush</th>
    <th>설명</th>
  </tr>
  </thead>
  <tbody>
  <tr>
    <td>fsync</td>
    <td>normal</td>
    <td>fsync()</td>
    <td>normal</td>
    <td>fsync()</td>
    <td>default</td>
  </tr>
  <tr>
    <td>O_DSYNC</td>
    <td>O_SYNC</td>
    <td>O_SYNC</td>
    <td>normal</td>
    <td>fsync()</td>
    <td>이름은 O_DSYNC인데 실제론 O_SYNC임. O_DSYNC를 쓰기에는 몇몇 Unix시스템에서 문제가 있었다고함. <em>synchronized I/O</em>로서, write작업시 hardware단까지 fsync함.</td>
  </tr>
  <tr>
    <td>O_DIRECT</td>
    <td>normal</td>
    <td>fsync()</td>
    <td>O_DIRECT</td>
    <td>fsync()</td>
    <td>OS caching을 하지 않고 <em>direct I/O</em>로 innodb_buffer_pool에서 file로 I/O함. direct I/O을 지원하는 GNU/Linux versions, FreeBSD, and Solaris에서 사용가능</td>
  </tr>
  <tr>
    <td>O_DIRECT_NO_FSYNC</td>
    <td>normal</td>
    <td>fsync()</td>
    <td>O_DIRECT</td>
    <td>skip fsync()</td>
    <td>O_DIRECT와는 달리 flush를 위해서 fsync()함수를 호출하지 않음. 원래 O_DIRECT는 data를 file까지 direct하게 쓰지만 완전한 synchronous I/O를 보장하지는 않으므로, 내부적으로 flush를 위해서 fsync()를 호출했었는데, 이 옵션에서는 fsync()호출을 생략한다. 이는 file system type에 따라 적합 여부를 확인해야한다. (XFS에는 사용하면 안됨)</td>
  </tr>
  </tbody>
  </table>

  * O_DIRECT, O_DIRCET_NO_FSYNC 부연설명
    * O_DIRECT는 pache cache, buffer cache는 directly하게 write bypass하지만, inode cache, directory cache, metadata는 따로 fsync()를 호출해서 flush해줘야한다.
    * kernel과 file system이 발전하면서, 몇몇 file system에서는 O_DIRECT가 fsync()없이도 metadata까지 synchronize되는 걸 보장한다. 그래서 InnoDB가 O_DIRECT_NO_FSYNC를 추가하게 된것이다.
  * 각 옵션별 logfile, data file flush method 그림으로 이해하기
    * ![innodb_flush_method1]({{site_url}}/uploads/innodb_flush_method11.jpg)
    * ![innodb_flush_method2]({{site_url}}/uploads/innodb_flush_method21.jpg)

### On Windows

  * async_unbuffered
  * 변경 불가능함

### 튜닝

  * SAN 스토리지가 아니고, hardware RAID controller 와 battery-backed write cache(배터리로 캐쉬 보존 가능)가 있는 스토리지를 사용중이라면, O_DIRECT를 사용할 것을 고려할수 있다.
    * O_DIRECT를 사용하면 **double buffering(InnoDB buffer pool과 OS file system cache에 두번 캐쉬)을 하지 않기 떄문에 성능향상**을 기대할 수 있다.
