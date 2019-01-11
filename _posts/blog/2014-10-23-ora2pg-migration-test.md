---
title: ora2pg migration test
author: min_kim
created: 2014/10/23 05:48:00
modified:
layout: post
tags: postgres postgres_migration
image:
  feature: postgres.png
categories: Postgres
toc: true
toc_label: "My Table of Contents"
toc_icon: "cog"
---


# ora2pg migration test

### ora2pg

#### oracle to postgresql migration tool  
<http://ora2pg.darold.net/>

![]({{site_url}}/uploads/ora2pg1.jpg)



어차피 function code는 검토해야하는 할테니, 사용할 만할 듯합니다.

데이터없이 스키마만 변경해본 내용입니다.

데이터는 COPY나 Insert 문으로 extract가능합니다.




##### manager에게 reporting한 내용...


For migrating with ora2pg, there are few concerns as follows.

Schema list
* For case-sensitivity, some schemas may need to be created with double-quotes. Need to check that both of the lower and upper case schemas are in use.
* There are locked schemas in Oracle database. Need to check if they need to be migrated.
  * Synonym : not compatible
  * Trigger
* AFTER LOGON ON TRIGGER – not compatible
* Need to verify the codes
  * Package
* The packages will be migrated to the functions on separated schema named oracle package name. So the duplicated packages  may need to be renamed.
* Need to verify the codes
  * Column name
* Column name with reserved keyword need to be renamed.
* Ora2pg would generate incoherent scripts when it comes to case-sensitivity. We may need to verify the scripts regarding case-sensitivity.
  * Date/Time Functions
* Oracle systimestamp is not compatible with postgresql. We may need to verify its functionality and switch to postgresql function.
Share this:
