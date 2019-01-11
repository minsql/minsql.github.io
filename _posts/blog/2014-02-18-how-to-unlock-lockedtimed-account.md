---
title: how to unlock LOCKED(TIMED) account
author: min_kim
created: 2014/02/18 06:26:00
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


# how to unlock LOCKED(TIMED) account

## LOCKED(TIMED)된 계정 unlock하기

### unlock LOCKED(TIMED) account

#### 1. user account status check  
```SELECT username, account_status, lock_date FROM dba_users;```

if  
account_status is LOCKED(TIMED),  
that means someone failed to access. ( w/ wrong password )  
#### 2. account unlock
```alter user srchdaum account unlock;```
#### 3. user account status recheck**  
```SELECT username, account_status, lock_date FROM dba_users;```
#### 4. more...
default profile의 FAILED_LOGIN_ATTEMPTS를 변경하고 싶은 경우  
##### 4.1 check dba_profile
```
SELECT u.username, p.profile, p.resource_name, p.limit  
FROM dba_users u, dba_profiles p  
WHERE p.profile = u.profile  
AND   p.resource_name = 'FAILED_LOGIN_ATTEMPTS'  
;
```
##### 4.2. alter default profile
```ALTER PROFILE DEFAULT LIMIT FAILED_LOGIN_ATTEMPTS UNLIMITED;```
