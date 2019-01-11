---
title: Oracle 11gR2 Installation on CentOS6
author: min_kim
created: 2014/12/09 01:03:52
modified:
layout: post
tags: oracle
image:
  feature: oracle.png
categories: Oracle
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# Oracle 11gR2 Installation on CentOS6

## 1. Checking the Software Requirements
<https://docs.oracle.com/cd/E11882_01/install.112/e47689/pre_install.htm#BABCFJFG>

Oracle Linux 6 and Red Hat Enterprise Linux 6
The following packages (or later versions) must be installed: binutils-2.20.51.0.2-5.11.el6 (x86_64) compat-libcap1-1.10-1 (x86_64) compat-libstdc++-33-3.2.3-69.el6 (x86_64) compat-libstdc++-33-3.2.3-69.el6.i686 gcc-4.4.4-13.el6 (x86_64) gcc-c++-4.4.4-13.el6 (x86_64) glibc-2.12-1.7.el6 (i686) glibc-2.12-1.7.el6 (x86_64) glibc-devel-2.12-1.7.el6 (x86_64) glibc-devel-2.12-1.7.el6.i686 ksh libgcc-4.4.4-13.el6 (i686) libgcc-4.4.4-13.el6 (x86_64) libstdc++-4.4.4-13.el6 (x86_64) libstdc++-4.4.4-13.el6.i686 libstdc++-devel-4.4.4-13.el6 (x86_64) libstdc++-devel-4.4.4-13.el6.i686 libaio-0.3.107-10.el6 (x86_64) libaio-0.3.107-10.el6.i686 libaio-devel-0.3.107-10.el6 (x86_64) libaio-devel-0.3.107-10.el6.i686 make-3.81-19.el6 sysstat-9.0.4-11.el6 (x86_64)

```
yum install binutils
yum install compat-libcap1
yum install compat-libstdc++
yum install gcc
yum install gcc-c++
yum install glibc
yum install glibc-2.12-1.149.el6.i686
yum install glibc-devel
yum install glibc-devel-2.12-1.149.el6.i686
yum install ksh
yum install libgcc
yum install libgcc-4.4.7-11.el6.i686
yum install libstdc++
yum install libstdc++-4.4.7-11.el6.i686
yum install libstdc++-devel
yum install libstdc++-devel-4.4.7-11.el6.i686
yum install libaio
yum install libaio-0.3.107-10.el6.i686
yum install libaio-devel
yum install libaio-devel-0.3.107-10.el6.i686
yum install sysstat
yum install make
yum install java
```

## 2. Creating Required Operating System Groups and Users

```
groupadd oinstall
groupadd dba
useradd -g oinstall -G dba oracle
passwd oracle
```

## 3\. Configuring OS
### 3.1 Kernel Parameter

```
[root@oravm2 ~]# vi /etc/sysctl.conf
#########
# oracle
#########
fs.aio-max-nr = 1048576
fs.file-max = 6815744
kernel.shmall = 2097152
kernel.shmmax = 536870912
kernel.shmmni = 4096
kernel.sem = 250 32000 100 128
net.ipv4.ip_local_port_range = 9000 65500
net.core.rmem_default = 262144
net.core.rmem_max = 4194304
net.core.wmem_default = 262144
net.core.wmem_max = 1048576

[root@oravm2 ~]# reboot
```

### 3.2 /etc/hosts file

```
[root@oravm2 /]# vi /etc/hosts
127.0.0.1 localhost localhost.localdomain localhost4 localhost4.localdomain4
::1 localhost localhost.localdomain localhost6 localhost6.localdomain6
192.168.56.121 oravm2
[root@oravm2 /]#
```

## 4\. Installing X Server

```
[root@oravm2 ~]$ yum -y groupinstall "Desktop" "Desktop Platform" "X Window System" "Fonts"
[root@oravm2 ~]$ yum install gdm
[root@oravm2 ~]$ vi /etc/inittab
id:5:initdefault:
[root@oravm2 ~]$ init 5
```

## 5\. Configuring the oracle User's Environment

```
[root@oravm2 ~]# chown -R oracle. /db /data1

[root@oravm2 ~]# su - oracle

[oracle@oravm2 ~]# vi ~/.bash_profile
ORACLE_BASE=/db/app/oracle
ORACLE_SID=orcl
export ORACLE_BASE ORACLE_SID
export DISPLAY=:0.0
```

## 6\. run installer

```
[oracle@oravm2 ~]$ cd database/
[oracle@oravm2 ~]$ ./runInstaller
```

## 7\. Installing through GUI Installer blahblah. 8\. Setting Environment

```
[oracle@oravm2 ~]$ vi ~/.bash_profile
# .bash_profile

# Get the aliases and functions
if [ -f ~/.bashrc ]; then
	. ~/.bashrc
fi

# User specific environment and startup programs
ORACLE_BASE=/db/app/oracle
ORACLE_SID=orcl
ORACLE_HOME=$ORACLE_BASE/product/11.2.0/dbhome_1

export ORACLE_BASE ORACLE_SID ORACLE_HOME
export DISPLAY=:0.0

PATH=$PATH:$HOME/bin:$ORACLE_HOME/bin

export PATH
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$ORACLE_HOME/lib
```
