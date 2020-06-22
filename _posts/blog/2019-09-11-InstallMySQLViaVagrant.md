---
title: Vagrant를 이용한 MySQL Source 설치하기
author: min_cho
created: 2019/09/11
modified:
layout: post
tags: mysql
image:
  feature: mysql.png
categories: MySQL
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---

------
# MySQL compile용 BOX 만들기

## vagrant & virtual box install

## box 만들기

```bash
$ vagrant box add centos/7 --insecure


$ vagrant box list
cent7           (virtualbox, 0)
centos/7        (virtualbox, 1905.1)
generic/oracle7 (virtualbox, 2.0.6)


$ vagrant init


$ cat Vagrantfile
# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://vagrantcloud.com/search.
  config.vm.box = "centos/7"
  config.vm.define "MySQL_Compile" do |db|
    db.vm.hostname = "MySQL-compile"
    #db.vm.provision "shell", path: "bootstrap-dev.sh"
  end

  config.vm.provider "virtualbox" do |vb|
    vb.cpus = "4"
    vb.memory = "4096"
  end
  #config.vm.name="MySQL_compile"
  #config.vm.hostname="MySQL-compile"

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  # config.vm.box_check_update = false

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  # config.vm.network "forwarded_port", guest: 80, host: 8080

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine and only allow access
  # via 127.0.0.1 to disable public access
  # config.vm.network "forwarded_port", guest: 80, host: 8080, host_ip: "127.0.0.1"

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network "private_network", ip: "192.168.33.10"

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network "public_network"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.
  # config.vm.synced_folder "../data", "/vagrant_data"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  #
  # View the documentation for the provider you are using for more
  # information on available options.

  # Enable provisioning with a shell script. Additional provisioners such as
  # Puppet, Chef, Ansible, Salt, and Docker are also available. Please see the
  # documentation for more information about their specific syntax and use.
  # config.vm.provision "shell", inline: <<-SHELL
  #   apt-get update
  #   apt-get install -y apache2
  # SHELL
end



$ vagrant up
Bringing machine 'MySQL_Compile' up with 'virtualbox' provider...
==> MySQL_Compile: Importing base box 'centos/7'...
==> MySQL_Compile: Matching MAC address for NAT networking...
==> MySQL_Compile: Checking if box 'centos/7' version '1905.1' is up to date...
==> MySQL_Compile: There was a problem while downloading the metadata for your box
==> MySQL_Compile: to check for updates. This is not an error, since it is usually due
==> MySQL_Compile: to temporary network problems. This is just a warning. The problem
==> MySQL_Compile: encountered was:
==> MySQL_Compile:
==> MySQL_Compile: SSL certificate problem: self signed certificate in certificate chain
==> MySQL_Compile:
==> MySQL_Compile: If you want to check for box updates, verify your network connection
==> MySQL_Compile: is valid and try again.
==> MySQL_Compile: Setting the name of the VM: vagrant_files_MySQL_Compile_1592544311816_95056
==> MySQL_Compile: Clearing any previously set network interfaces...
==> MySQL_Compile: Preparing network interfaces based on configuration...
    MySQL_Compile: Adapter 1: nat
==> MySQL_Compile: Forwarding ports...
    MySQL_Compile: 22 (guest) => 2222 (host) (adapter 1)
==> MySQL_Compile: Booting VM...
==> MySQL_Compile: Waiting for machine to boot. This may take a few minutes...
    MySQL_Compile: SSH address: 127.0.0.1:2222
    MySQL_Compile: SSH username: vagrant
    MySQL_Compile: SSH auth method: private key
    MySQL_Compile:
    MySQL_Compile: Vagrant insecure key detected. Vagrant will automatically replace
    MySQL_Compile: this with a newly generated keypair for better security.
    MySQL_Compile:
    MySQL_Compile: Inserting generated public key within guest...
    MySQL_Compile: Removing insecure key from the guest if it's present...
    MySQL_Compile: Key inserted! Disconnecting and reconnecting using new SSH key...
==> MySQL_Compile: Machine booted and ready!
==> MySQL_Compile: Checking for guest additions in VM...
    MySQL_Compile: No guest additions were detected on the base box for this VM! Guest
    MySQL_Compile: additions are required for forwarded ports, shared folders, host only
    MySQL_Compile: networking, and more. If SSH fails on this machine, please install
    MySQL_Compile: the guest additions and repackage the box to continue.
    MySQL_Compile:
    MySQL_Compile: This is not an error message; everything may continue to work properly,
    MySQL_Compile: in which case you may ignore this message.
==> MySQL_Compile: Setting hostname...
==> MySQL_Compile: Rsyncing folder: /Users/min.cho/vagrant_files/ => /vagrant




$ vagrant global-status
id       name          provider   state   directory
------------------------------------------------------------------------------
dab7d23  MySQL_Compile virtualbox running /Users/min.cho/vagrant_files

The above shows information about all known Vagrant environments
on this machine. This data is cached and may not be completely
up-to-date (use "vagrant global-status --prune" to prune invalid
entries). To interact with any of the machines, you can go to that
directory and run Vagrant, or you can use the ID directly with
Vagrant commands from any directory. For example:
"vagrant destroy 1a2b3c4d"

$ vagrant ssh dab7d23
Last login: Fri Jun 19 05:29:08 2020 from 10.0.2.2
-bash: warning: setlocale: LC_CTYPE: cannot change locale (UTF-8): No such file or directory


```



## Box 안에서

### compile에 필요한 package 설치

```bash
sudo yum -y install cmake
sudo yum -y install gcc-c++
sudo yum -y install wget
sudo yum -y install perl
sudo yum -y install libaio
sudo yum -y install net-tools
sudo yum -y install ncurses-devel
sudo yum -y groupinstall "Development Libraries" "Development Tools"
sudo yum -y install openssl-devel.x86_64
sudo yum -y install readline-devel
sudo yum -y install libcurl-devel


## MySQL 8.0 Compile을 위해 (cmake3 , gcc >= 5.3)

echo "sslverify=false" >> /etc/yum.conf
yum -y install epel-release
yum -y install centos-release-scl
yum -y install cmake3
yum -y install devtoolset-7

echo "source scl_source enable devtoolset-7" >> ~/.bashrc
source ~/.bash_profile
```




### 사용 스크립트

```bash

[root@MySQL-compile~]# tail -n +1 *.sh
==> compile57.sh <==
#/bin/bash


SCRIPT_NAME=$(basename $0)
SCRIPT_BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

source ${SCRIPT_BASEDIR}/config.sh

VERSION=${MYSQL_VERSION}

mkdir -p /mysql_sources/${VERSION} && cd /mysql_sources/${VERSION}

wget https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-${VERSION}.tar.gz --no-check-certificate

tar xvfz mysql-${VERSION}.tar.gz

mkdir -p /mysql_sources/${VERSION}/compile/mysql/tmp
mkdir -p /mysql_sources/${VERSION}/compile/mysql/data

cd mysql-${VERSION}/

cmake \
-DCMAKE_INSTALL_PREFIX=/mysql_sources/${VERSION}/compile/mysql \
-DMYSQL_UNIX_ADDR=/mysql_sources/${VERSION}/compile/mysql/tmp/mysql.sock \
-DDEFAULT_CHARSET=utf8mb4 \
-DDEFAULT_COLLATION=utf8mb4_bin \
-DWITH_EXTRA_CHARSETS=all \
-DMYSQL_DATADIR=/mysql_sources/${VERSION}/compile/mysql/data \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_MYISAM_STORAGE_ENGINE=1 \
-DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DWITH_ARCHIVE_STORAGE_ENGINE=1 \
-DWITH_BLACKHOLE_STORAGE_ENGINE=1 \
-DWITH_FEDERATED_STORAGE_ENGINE=0 \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=/mysql_sources \
-DMYSQL_TCP_PORT=5728 \
-DENABLE_DOWNLOADS=1 \
-DWITH_DEBUG=1

make && make install

/mysql_sources/${VERSION}/compile/mysql/bin/mysqld --initialize-insecure --user=root --datadir=/mysql_sources/${VERSION}/compile/mysql/data

/mysql_sources/${VERSION}/compile/mysql/bin/mysqld --user=root --datadir=/mysql_sources/${VERSION}/compile/mysql/data --socket=/mysql_sources/${VERSION}/compile/mysql/tmp/mysql.sock --debug='d:t:i:F:L:o,/tmp/57_mysqld.trace' &





==> compile80.sh <==
#/bin/bash

SCRIPT_NAME=$(basename $0)
SCRIPT_BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

source ${SCRIPT_BASEDIR}/config.sh

VERSION=${MYSQL_VERSION}

mkdir -p /mysql_sources/${VERSION} && cd /mysql_sources/${VERSION}

wget https://dev.mysql.com/get/Downloads/MySQL-8.0/mysql-${VERSION}.tar.gz --no-check-certificate

tar xvfz mysql-${VERSION}.tar.gz

mkdir -p /mysql_sources/${VERSION}/compile/mysql/tmp
mkdir -p /mysql_sources/${VERSION}/compile/mysql/data

cd mysql-${VERSION}/

cmake3 \
-DCMAKE_INSTALL_PREFIX=/mysql_sources/${VERSION}/compile/mysql \
-DMYSQL_UNIX_ADDR=/mysql_sources/${VERSION}/compile/mysql/tmp/mysql.sock \
-DDEFAULT_CHARSET=utf8mb4 \
-DDEFAULT_COLLATION=utf8mb4_bin \
-DWITH_EXTRA_CHARSETS=all \
-DMYSQL_DATADIR=/mysql_sources/${VERSION}/compile/mysql/data \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_MYISAM_STORAGE_ENGINE=1 \
-DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DWITH_ARCHIVE_STORAGE_ENGINE=1 \
-DWITH_BLACKHOLE_STORAGE_ENGINE=1 \
-DWITH_FEDERATED_STORAGE_ENGINE=0 \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=/mysql_sources \
-DMYSQL_TCP_PORT=8018 \
-DENABLE_DOWNLOADS=1 \
-DFORCE_INSOURCE_BUILD=1 \
-DWITH_SSL=system \
-DWITH_DEBUG=1

make && make install

#scl enable devtoolset-7 bash | make && make install
#source scl_source enable devtoolset-7
#make && make install

#chown -R mysql:mysql /mysql_sources

/mysql_sources/${VERSION}/compile/mysql/bin/mysqld --initialize-insecure --user=root --datadir=/mysql_sources/${VERSION}/compile/mysql/data

/mysql_sources/${VERSION}/compile/mysql/bin/mysqld --user=root --datadir=/mysql_sources/${VERSION}/compile/mysql/data --socket=/mysql_sources/${VERSION}/compile/mysql/tmp/mysql.sock --debug='d:t:i:F:L:o,/tmp/80_mysqld.trace' &






==> compile_percona57.sh <==
#/bin/bash

SCRIPT_NAME=$(basename $0)
SCRIPT_BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

source ${SCRIPT_BASEDIR}/config.sh

VERSION=${MYSQL_VERSION}

mkdir -p /mysql_sources/${VERSION} && cd /mysql_sources/${VERSION}

#wget https://dev.mysql.com/get/Downloads/MySQL-5.7/mysql-${VERSION}.tar.gz --no-check-certificate
wget https://www.percona.com/downloads/Percona-Server-5.7/Percona-Server-${VERSION}/source/tarball/percona-server-${VERSION}.tar.gz --no-check-certificate

tar xvfz percona-server-${VERSION}.tar.gz

mkdir -p /mysql_sources/${VERSION}/compile/mysql/tmp
mkdir -p /mysql_sources/${VERSION}/compile/mysql/data

cd percona-server-${VERSION}/

cmake \
-DCMAKE_INSTALL_PREFIX=/mysql_sources/${VERSION}/compile/mysql \
-DMYSQL_UNIX_ADDR=/mysql_sources/${VERSION}/compile/mysql/tmp/mysql.sock \
-DDEFAULT_CHARSET=utf8mb4 \
-DDEFAULT_COLLATION=utf8mb4_bin \
-DWITH_EXTRA_CHARSETS=all \
-DMYSQL_DATADIR=/mysql_sources/${VERSION}/compile/mysql/data \
-DENABLED_LOCAL_INFILE=1 \
-DWITH_MYISAM_STORAGE_ENGINE=1 \
-DWITH_INNOBASE_STORAGE_ENGINE=1 \
-DWITH_ARCHIVE_STORAGE_ENGINE=1 \
-DWITH_BLACKHOLE_STORAGE_ENGINE=1 \
-DWITH_FEDERATED_STORAGE_ENGINE=0 \
-DDOWNLOAD_BOOST=1 \
-DWITH_BOOST=/mysql_sources \
-DMYSQL_TCP_PORT=5799 \
-DENABLE_DOWNLOADS=1 \
-DWITH_DEBUG=1

make && make install

/mysql_sources/${VERSION}/compile/mysql/bin/mysqld --initialize-insecure --user=root --datadir=/mysql_sources/${VERSION}/compile/mysql/data

/mysql_sources/${VERSION}/compile/mysql/bin/mysqld --user=root --datadir=/mysql_sources/${VERSION}/compile/mysql/data --socket=/mysql_sources/${VERSION}/compile/mysql/tmp/mysql.sock --debug='d:t:i:F:L:o,/tmp/57_mysqld.trace' &





==> config.sh <==
#export MYSQL_VERSION="5.7.23-23"
#export MYSQL_VERSION="5.7.28"
#export MYSQL_VERSION="5.7.30"
export MYSQL_VERSION="5.7.30"
export MYSQL_VERSION="5.7.30-33"
export MYSQL_VERSION="8.0.20"
export MYSQL_PATH="/mysql_sources/${MYSQL_VERSION}/compile/mysql"





==> mysql.sh <==
#!/bin/bash

SCRIPT_NAME=$(basename $0)
SCRIPT_BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

source ${SCRIPT_BASEDIR}/config.sh

${MYSQL_PATH}/bin/mysql -uroot -S ${MYSQL_PATH}/tmp/mysql.sock

#${MYSQL_BIN_HOME}/bin/mysql -uroot -S ${MYSQL_DATA_HOME}/mysql.sock





==> shutdown.sh <==
#!/bin/bash

SCRIPT_NAME=$(basename $0)
SCRIPT_BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

source ${SCRIPT_BASEDIR}/config.sh

${MYSQL_PATH}/bin/mysqladmin shutdown -S ${MYSQL_PATH}/tmp/mysql.sock -uroot





==> starup.sh <==
#!/bin/bash

SCRIPT_NAME=$(basename $0)
SCRIPT_BASEDIR="$( cd "$( dirname "$0" )" && pwd )"

source ${SCRIPT_BASEDIR}/config.sh

#${MYSQL_BIN_HOME}/bin/mysqld --datadir=${MYSQL_DATA_HOME} --socket=${MYSQL_DATA_HOME}/mysql.sock &
${MYSQL_PATH}/bin/mysqld --user=root --datadir=${MYSQL_PATH}/data --socket=${MYSQL_PATH}/tmp/mysql.sock --debug='d:t:i:F:L:o,/tmp/mysqld.trace' &

```
