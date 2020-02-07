---
title: Connect/J Version에 따른 Character set JDBC옵션
author: min_cho
created: 2019/12/15
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
# 사전지식

**일반적으로 emoji를 사용하기 위해서는 MySQL의 character_set_server를 utf8mb4 로 설정하고, JDBC로 접속시 connection String에 characterset에 관한 값을 설정하지 않게하여 자동으로 character_set_server 의 값을 확인하여 connection의 characterset과 collation을 세팅하게하는것이 기본이다.**

> The character encoding between client and server is automatically detected upon connection (provided that the Connector/J connection properties characterEncoding and connectionCollation are not set). You specify the encoding on the server using the system variable character_set_server (for more information, see Server Character Set and Collation). The driver automatically uses the encoding specified by the server. For example, to use the 4-byte UTF-8 character set with Connector/J, configure the MySQL server with character_set_server=utf8mb4, and leave characterEncoding and connectionCollation out of the Connector/J connection string. Connector/J will then autodetect the UTF-8 setting.
>
> https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-reference-charsets.html

- 하지만 이는 다음과 같은 문제를 야기할 수 있다.

  1. Emoji를 사용하기 위해서는 항상 MySQL의 character_set_server 은 utf8mb4로 설정해야 한다. (character_set_server 는 database를 만들때 영향을 주게됨으로, 특별한 옵션이 없으면 database생성시 utf8mb4가 된다. 이는 euckr을 주로 사용하며, 특정 컬럼만 emoji를 사용하는 경우 부합하지 않는다.)

  2. connectionCollation 을 지정하지 않으면, 실행계획이 엉망이 될 수 있다.

  3. '똠' 혹은 '쀍' 과 같은 MS949에서는 지원하는 한글완성형 글자를 euckr의 MySQL 컬럼에 저장하기 위해서는 utf8로의 통신이 필요함으로, connector/J에서 자동으로 detecting 하는것을 사용할 수 없다. (MySQL의 euckr은 MS949를 지원하지만, JAVA의 euckr은 그렇지 않음으로 해당값의 코드를 MySQL에게 전달이 안될뿐아니라 저장된 값을 준다고 해도 정상적으로 JAVA에서 해석하지 못한다. ??? 로 나타나거나 저장되는 이유이다.)



**일반적으로 Connector/J 와 MySQL은 아래와 같은 이름의 변수 규칙을 이용한다.**

- Connector/J JAVA parameter
  - characterEncoding 과 같은 camel style 표기법 사용
  - value로는 UTF-8 과 같 Official name 사용
- MySQL variable parameter
  - character_set_server와 같이 snake style 표기법 사용
  - value로는 utf8 과 같 Non-Official name 사용



**Emoji를 넣고 빼기 위해서는 다음과 같은 두가지가 필요하다.**
- 저장되어야 할 컬럼이 utf8mb4를 가져야 한다.
- Connection의 character_set_client가 utf8mb4 이어야 한다.
- Connection의 character_set_results가 utf8mb4 이어야 한다.

**'똠' '쀍'을 넣고 빼기 위해서는 다음과 같은 두가지가 필요하다.**
- 저장되어야 할 컬럼이 [euckr|utf8|utf8mb4]를 가져야 한다.
- Connection의 character_set_client가 [utf8|utf8mb4] 이어야 한다.
- Connection의 character_set_results가 [utf8|utf8mb4] 이어야 한다.

------

# Connector/J 5.1.47 이후 변경사항

## characterEncoding

#### Connector/J < 5.1.47
  - UTF-8로 설정하면 mysqld의 character_set_server=utf8mb4인 경우 설정된 값을 참고하여 character_set_client를 세팅한다.
    - character_set_server=utf8mb4이외의 값(utf8,euckr) : character_set_client=utf8
    - character_set_server=utf8mb4 : character_set_client=utf8mb4

#### Connector/J >= 5.1.47
  - UTF-8로 설정하면, mysqld의 character_set_server에 설정된 값과 상관없이 character_set_client를 utf8mb4로 세팅한다.

> Notes
> For Connector/J 5.1.46 and earlier: In order to use the utf8mb4 character set for the connection, the server MUST be configured with character_set_server=utf8mb4; if that is not the case, when UTF-8 is used for characterEncoding in the connection string, it will map to the MySQL character set name utf8, which is an alias for utf8mb3.
>
> For Connector/J 5.1.47 and later:
>
>  \* When UTF-8 is used for characterEncoding in the connection string, it maps to the MySQL character set name utf8mb4.
>
>  \* If the connection option connectionCollation is also set alongside characterEncoding and is incompatible with it, characterEncoding will be overridden with the encoding corresponding to connectionCollation.
>
>  \* Because there is no Java-style character set name for utfmb3 that you can use with the connection option charaterEncoding, the only way to use utf8mb3 as your connection character set is to use a utf8mb3 collation (for example, utf8_general_ci) for the connection option connectionCollation, which forces a utf8mb3 character set to be used, as explained in the last bullet.
>
> https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-reference-charsets.html



## connectionCollation

#### Connector/J < 5.1.47
  - connectionCollation을 지정하는것과 관계없이 characterEncoding은 설정된다.

#### Connector/J >= 5.1.47
  - connectionCollation을 설정하면, characterEncoding은 무시된다.

> connectionCollation
>
> If set, tells the server to use this collation in SET NAMES charset COLLATE connectionCollation. Also overrides the characterEncoding with those corresponding to character set of this collation.
>
> Since version: 3.0.13
>
> https://dev.mysql.com/doc/connector-j/5.1/en/connector-j-reference-configuration-properties.html


------

# Connector/J 표준권고 사항
#### Connector/J < 5.1.47

  - ###### character_set_server=euckr
    ```JAVA
    characterEncoding=UTF-8
    characterSetResults=UTF-8
    connectionCollation=euckr_bin
    ```
    - characterEncoding=UTF-8 : '똠'을 사용하기 위해 mysqld로 보내주는 character encoding (character_set_client)을 utf8로 설정한다.

    - characterSetResults : '똠'을 사용하기 위해 mysqld에 보내주는 character encoding (character_set_client)을 utf8로 설정한다.

    - connectionCollation : 실행계획을 잘 만들기 위해 명시한다



  - ##### character_set_server=utf8mb4
    ```JAVA
    characterEncoding=UTF-8
    characterSetResults=UTF-8
    connectionCollation=utf8mb4_bin
    ```
    - characterEncoding=UTF-8 : 자동으로 character_set_server의 값인 utf8mb4를 읽어 character encoding (character_set_client)을 utf8mb4로 설정한다

    - characterSetResults : 자동으로 character_set_server의 값인 utf8mb4를 읽어 mysqld에 보내주는 character encoding (character_set_client)을 utf8mb4로 설정한다.

    - connectionCollation : 실행계획을 잘 만들기 위해 명시한다



#### Connector/J >= 5.1.47

  - ##### character_set_server=euckr
    ```JAVA
    characterEncoding=UTF-8
    characterSetResults=UTF-8
    // connectionCollation=euckr_bin
    ```
    - characterEncoding=UTF-8 : 자동으로 utf8mb4와 매핑되고 connectionCollation을 명시하였으므로 해당값은 무시되지만 통일성을 위해 명시한다.

    - characterSetResults : 자동으로 utf8mb4와 매핑되지만 통일성을 위해 명시한다. (컬럼을 euckr로 설정하고 '쀍' 을 사용하고 싶다면, UTF-8로 꼭 명시한다. MySQL은 정상적으로 저장된다.)

    - connectionCollation
      - '똠'을 사용하기 위해서는 connectionCollation을 지정하면 안된다. (connectionCollation에 의해 characterEncoding이 무시되어 autodetect를 통해 character_set_client가 euckr로 세팅된다)
      - 실행계획을 잘 사용하기 위해서는 connectionCollation을 euckr_bin으로 지정한다.


  - ##### character_set_server=utf8mb4
    ```JAVA
    characterEncoding=UTF-8
    characterSetResults=UTF-8
    connectionCollation=utf8mb4_bin
    ```
    - characterEncoding=UTF-8 : 자동으로 utf8mb4와 매핑되고 connectionCollation을 명시하였으므로 해당값은 무시되지만 통일성을 위해 명시한다.

    - characterSetResults : 자동으로 utf8mb4와 매핑되지만 통일성을 위해 명시한다. (컬럼을 euckr로 설정하고 '쀍' 을 사용하고 싶다면, UTF-8로 꼭 명시한다. MySQL은 정상적으로 저장된다.)

    - connectionCollation : 실행계획을 잘 만들기 위해 명시한다



------

# Connector/J 논의사항

- Connector/J >= 5.1.47의 connectionCollation 세팅에 따른 배타적인 사항.
- euckr 혹은 utf8에서 emoji를 사용하려는 경우
  - Connector/J < 5.1.47 는 character_set_server=utf8mb4 로 사용해야지만 가능하다. 이는 여러문제점(database를 characterset 없이 생성하는 경우 character_set_server를 따름)
  - Connector/J >= 5.1.47 의 경우, characterEncoding=UTF-8 로 설정한다면, character_set_server의 값과 관계없이 character_set_client가 utf8mb4로 세팅됨으로, character_set_server의 값과 관계없이 emoji를 사용할 수 있다.



------

# 데이터오류



```
????
```

- utf8('똠'), utf8mb4(emoji) character를 저장되어야 할 euckr 컬럼으로 변경시에 매핑하는 과정에서 정상적으로 매핑을 못하며 \x3F 의 값으로 저장하는데 해당 문자는 ? 로 보여진다.

- 예를 들면, Application에서는 '똠'을 보내지만 character_set_client 가 euckr인 경우 MySQL은 JAVA의 EUC-KR에는 해당 값이 없다고 판단하여 \3F로 매핑하여 저장하는 경우이다.



```
Incorrect string value: ``'\xF0\x9F\x8D\xA3'` `for` `column ``'str2'` `at row ``1
```

- 컬럼에 저장하는 단계에서 발생하는 에러로서,  **컬럼의 character_set 사이즈 < 들어온 character_set의 사이즈** 인 경우 발생한다.
- 예를 들면 , utf8을 저장할 수 있는 컬럼에 emoji가 들어오는 경우이다.
