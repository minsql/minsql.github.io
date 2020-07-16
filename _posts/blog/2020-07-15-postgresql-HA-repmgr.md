---
title: PostgreSQL 2nodes HA using repmgr
author: min_kim
created: 2020/07/15 10:28:00
modified:
layout: post
tags: postgres
image:
  feature: postgres.png
categories: Postgres
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# PostgreSQL 2nodes HA using repmgr

## PostgreSQL 2nodes HA 
> 3노드까지 필요없고 connection도 크게 많이 붙지 않는 경우(주로 솔루션의 백엔드 DB로 사용하는 경우) 2노드로 간단하게 HA를 구성하고 싶다. 
다만, switchover시에 master는 찾아야하니까 DNS서버에 업데이트 하는 스크립트 정도는 추가되어야한다. 
DNS를 쓰지 않는다면 pgbouncer + repmgr을 사용하면 된다.
connection 관리가 필요하다면 pg-poolII를 사용해도 된다.

## Architecture : repmgr + powerdns
![repmgr_and_powerdns]({{site_url}}/uploads/repmgr_and_powerdns.png){:width="400px"}

## Postgresql installation
- Prepare 2 postgres instances

### ALL: Add the PostgreSQL 9.6 Repository (as a root user)
```
# yum install https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
```
 
### ALL: Install PostgreSQL 9.6 (as a root user)
– To install PostgreSQL 9.6 just run the below command:
```
# yum install postgresql96 postgresql96-server postgresql96-contrib postgresql96-libs -y
```

### ALL : repmgr installation (as a root user)
```
curl https://dl.2ndquadrant.com/default/release/get/9.6/rpm | sudo bash
yum install repmgr96-5.1.0-1.el7  
chown -R postgres. /etc/repmgr/9.6
```

### ALL: Create pgdata (as a root user)
```
# usermod -d /home/postgres postgres
# mkdir -p /home/postgres/pgsql/9.6/data
# chown -R postgres:postgres /home/postgres
```
### ALL: Write bash_profile (as a postgres user)
```
# su - postgres
$ vi ~/.bashrc
# .bashrc

# Source global definitions
if [ -f /etc/bashrc ]; then
        . /etc/bashrc
fi

$ vi ~/.bash_profile
# .bash_profile

# Get the aliases and functions
if [ -f ~/.bashrc ]; then
        . ~/.bashrc
fi

# User specific environment and startup programs

PATH=$PATH:$HOME/.local/bin:$HOME/bin

export PATH

PGHOME=/usr/pgsql-9.6
PGDATA=/home/postgres/pgsql/9.6/data
PGPORT=5432
export PGDATA PGPORT PGHOME
export PATH=$PGHOME/bin:$PATH
export MANPATH=$PGHOME/share/man:$MANPATH
export LD_LIBRARY_PATH=$PGHOME/lib:$LD_LIBRARY_PATH
export PGCLIENTENCODING=UTF8

# source ~/.bash_profile
```


### Primary: init db (as a postgres user)
– Initialize PostgreSQL 9.6 by executing the following command:
- LC_COLLATE, LC_CTYPE = 'C'

```
$ initdb -D ${PGDATA} --encoding='UTF8' --lc-collate='C' --lc-ctype='C'
```

### Primary: start db (as a root user)
– Start/Enable PostgreSQL:
```
# systemctl edit  postgresql-9.6.service
[Service]
Environment=PGDATA=/home/postgres/pgsql/9.6/data

# systemctl enable postgresql-9.6.service
# systemctl start postgresql-9.6.service
```

### Primary: Accessing Database (as a postgres user)
– Switch into the postgres user:
```
# su – postgres
$ psql
```

## Configure repmgr streaming replication
### ALL: postgresql.conf
```
$ vi postgresql.conf
listen_addresses = '*'
shared_buffers = 2GB   # 25% of your mem
shared_preload_libraries = 'repmgr'   
wal_level = replica  
wal_log_hints = on  
wal_buffers = 16MB   
checkpoint_completion_target = 0.9 
archive_mode = on
archive_command = '/bin/true'
max_wal_senders = 3  
max_replication_slots = 1  
hot_standby = on 
log_checkpoints = on

$ pg_ctl restart
```

### ALL: pg_hba.conf
Add primary, standby
```
$ vi pg_hba.conf

local   replication   repmgr                              trust
host    replication   repmgr      127.0.0.1/32            trust
host    replication     repmgr        your_primary_ip/32            trust
host    replication     repmgr        your_standby_ip/32            trust

local   repmgr        repmgr                              trust
host    repmgr        repmgr      127.0.0.1/32            trust
host    repmgr     repmgr        your_primary_ip/32            trust
host    repmgr     repmgr        your_standby_ip/32            trust
$ pg_ctl reload
```

### Primary: Create replication role
```
$ createuser -s repmgr
$ createdb repmgr -O repmgr
```

### ALL: Write update_dns.sh
powerdns를 업데이트하는 쉘스크립트를 작성했다.
이건 환경마다 다를것이라 주요 동작방식만 기술한다.
```
$ vi update_dns.sh
...
DNS_NAME='your_dns_address'
NODE1='your_primary_node'
NODE2='your_standby_node'
case $1  in
    1) NODENAME="$NODE1" ;;
    2) NODENAME="$NODE2" ;;
esac
...
```
> node id를 인자로 받았다. 
repmgr.conf에서 event_notification standby_promote인 경우에 이 스크립트를 호출할텐데, dns를 올바르게 업데이트하기 위해서 필요하더라..

### ALL: Edit repmgr.conf
- event_notification_command
- event_notifications
>  standby_promote이벤트가 발생한경우 command를 수행할 수 있다. 이때 DNS업데이트를 진행했다.

```
$ vi /etc/repmgr/9.6/repmgr.conf
cluster='your_cluster_name'

node_id=1
node_name=your_primary_node 
conninfo='host=your_primary_node  user=repmgr dbname=repmgr connect_timeout=2'
data_directory='/home/postgres/pgsql/9.6/data'
failover=automatic
reconnect_attempts=3 
reconnect_interval=5  
promote_command='/usr/pgsql-9.6/bin/repmgr standby promote --log-to-file'    
follow_command='/usr/pgsql-9.6/bin/repmgr standby follow --log-to-file --upstream-node-id=%n'
log_file='/home/postgres/repmgr/repmgrd-9.6.log'   
event_notification_command='/home/postgres/repmgr/update_dns.sh %n'
event_notifications='standby_promote'  
pg_bindir='/usr/pgsql-9.6/bin/' 
```


### Primary: Register the primary server

```
$ repmgr primary register 
$ repmgr cluster show

 ID | Name                      | Role    | Status    | Upstream | Location | Priority | Timeline | Connection string
----+---------------------------+---------+-----------+----------+----------+----------+----------+-----------------------------------------------------------------------------
 1  | your_primary_node | primary | * running |          | default  | 100      | 1        | host=your_primary_node  user=repmgr dbname=repmgr connect_timeout=2
 
```

### Standby: Build/clone the standby server 
```
$ repmgr -h your_primary_node  -U repmgr -d repmgr standby clone --dry-run
$ repmgr -h your_primary_node -U repmgr -d repmgr standby clone 
$ pg_ctl start
```

### Standby: Register the standby server
```
$ repmgr standby register 
$ repmgr cluster show

ID | Name                      | Role    | Status    | Upstream | Location | Priority | Timeline | Connection string
----+---------------------------+---------+-----------+----------+----------+----------+----------+-----------------------------------------------------------------------------
1  | your_primary_node | primary | * running |          | default  | 100      | 1        | host=your_primary_node  user=repmgr dbname=repmgr connect_timeout=2
2  | your_standby_node | standby |   running | your_primary_node | default  | 100      | 1       | host=your_standby_node  user=repmgr dbname=repmgr connect_timeout=2
```

### ALL: Start repmgrd daemon process (as a root user)

```
systemctl enable  repmgr96.service
systemctl start  repmgr96.service
```

### ALL: setup passwordless SSH connection
- repmgr을 통한 switchover를 위해서는 passwordless SSH connection이 필요함.
- 서로의 key를 등록해주자.

```
ssh-keygen 
## set id_rsa.pub to authorized_keys
vi ~/.ssh/authorized_keys
```

### Test
#### Standby: manual switchover

```
repmgr cluster show
repmgr standby switchover
repmgr cluster show
```