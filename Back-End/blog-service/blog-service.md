# blog-service

Complete project snapshot for the `blog-service` folder.

## Project Files

- `.env`
- `.gitattributes`
- `.gitignore`
- `.mvn/wrapper/maven-wrapper.properties`
- `HELP.md`
- `mvnw`
- `mvnw.cmd`
- `pom.xml`
- `src/main/java/com/final_project/blog_service/BlogServiceApplication.java`
- `src/main/java/com/final_project/blog_service/client/FileServiceClient.java`
- `src/main/java/com/final_project/blog_service/client/UserServiceClient.java`
- `src/main/java/com/final_project/blog_service/config/OpenApiConfig.java`
- `src/main/java/com/final_project/blog_service/config/RedisConfig.java`
- `src/main/java/com/final_project/blog_service/config/SecurityConfig.java`
- `src/main/java/com/final_project/blog_service/config/UserServiceFeignConfig.java`
- `src/main/java/com/final_project/blog_service/controller/ArticleController.java`
- `src/main/java/com/final_project/blog_service/controller/FileUploadController.java`
- `src/main/java/com/final_project/blog_service/dto/ArticleBlockType.java`
- `src/main/java/com/final_project/blog_service/dto/CodeBlockDTO.java`
- `src/main/java/com/final_project/blog_service/dto/ContentBlock.java`
- `src/main/java/com/final_project/blog_service/dto/ContentBlockDTO.java`
- `src/main/java/com/final_project/blog_service/dto/DividerBlockDTO.java`
- `src/main/java/com/final_project/blog_service/dto/EmbedBlockDTO.java`
- `src/main/java/com/final_project/blog_service/dto/HeadingBlockDTO.java`
- `src/main/java/com/final_project/blog_service/dto/ImageBlockDTO.java`
- `src/main/java/com/final_project/blog_service/dto/QuoteBlockDTO.java`
- `src/main/java/com/final_project/blog_service/dto/request/ArticleBlockRequest.java`
- `src/main/java/com/final_project/blog_service/dto/request/ContentBlockRequest.java`
- `src/main/java/com/final_project/blog_service/dto/request/CreateArticleRequest.java`
- `src/main/java/com/final_project/blog_service/dto/request/CreateArticleWithFilesRequest.java`
- `src/main/java/com/final_project/blog_service/dto/request/CreateCommentRequest.java`
- `src/main/java/com/final_project/blog_service/dto/request/FlexibleContentBlockRequest.java`
- `src/main/java/com/final_project/blog_service/dto/request/PublishArticleRequest.java`
- `src/main/java/com/final_project/blog_service/dto/request/SearchArticleRequest.java`
- `src/main/java/com/final_project/blog_service/dto/request/UpdateArticleRequest.java`
- `src/main/java/com/final_project/blog_service/dto/response/ArticleBlockResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/ArticlePreviewResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/ArticleResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/AuthorResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/CommentEngagementResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/CommentResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/CommentThreadResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/ContentBlockResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/ContentResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/ErrorResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/FileCdnUrlResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/FileMetadataResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/FileUploadResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/ImageUploadResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/LikeResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/MetadataResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/PaginatedResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/ShareRequest.java`
- `src/main/java/com/final_project/blog_service/dto/response/ShareResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/StatsResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/SuccessResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/UserAuthorResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/UserExistsResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/UserPreferencesResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/UserProfileResponse.java`
- `src/main/java/com/final_project/blog_service/dto/response/VideoUploadResponse.java`
- `src/main/java/com/final_project/blog_service/dto/TextBlockDTO.java`
- `src/main/java/com/final_project/blog_service/dto/UserDTO.java`
- `src/main/java/com/final_project/blog_service/dto/VideoBlockDTO.java`
- `src/main/java/com/final_project/blog_service/exception/FileNotFound.java`
- `src/main/java/com/final_project/blog_service/exception/FileServiceException.java`
- `src/main/java/com/final_project/blog_service/exception/FileUploadException.java`
- `src/main/java/com/final_project/blog_service/exception/GlobalExceptionHandler.java`
- `src/main/java/com/final_project/blog_service/exception/ResourceNotFoundException.java`
- `src/main/java/com/final_project/blog_service/exception/UnauthorizedException.java`
- `src/main/java/com/final_project/blog_service/exception/UserNotFoundException.java`
- `src/main/java/com/final_project/blog_service/exception/UserServiceException.java`
- `src/main/java/com/final_project/blog_service/exception/UserServiceUnavailableException.java`
- `src/main/java/com/final_project/blog_service/model/Article.java`
- `src/main/java/com/final_project/blog_service/model/ArticleStatus.java`
- `src/main/java/com/final_project/blog_service/model/ArticleVisiblity.java`
- `src/main/java/com/final_project/blog_service/model/Comment.java`
- `src/main/java/com/final_project/blog_service/model/CommentStatus.java`
- `src/main/java/com/final_project/blog_service/model/Content.java`
- `src/main/java/com/final_project/blog_service/model/EditHistory.java`
- `src/main/java/com/final_project/blog_service/model/Like.java`
- `src/main/java/com/final_project/blog_service/model/Metadata.java`
- `src/main/java/com/final_project/blog_service/model/ReadingHistory.java`
- `src/main/java/com/final_project/blog_service/model/Seo.java`
- `src/main/java/com/final_project/blog_service/model/Share.java`
- `src/main/java/com/final_project/blog_service/model/SharedPlatform.java`
- `src/main/java/com/final_project/blog_service/model/Stats.java`
- `src/main/java/com/final_project/blog_service/repo/ArticleRepository.java`
- `src/main/java/com/final_project/blog_service/repo/CommentRepository.java`
- `src/main/java/com/final_project/blog_service/repo/LikeRepository.java`
- `src/main/java/com/final_project/blog_service/repo/ReadingHistoryRepository.java`
- `src/main/java/com/final_project/blog_service/repo/ShareRepository.java`
- `src/main/java/com/final_project/blog_service/service/ArticleService.java`
- `src/main/java/com/final_project/blog_service/service/FileUploadService.java`
- `src/main/java/com/final_project/blog_service/service/UserCacheService.java`
- `src/main/java/com/final_project/blog_service/utile/ContentBlockValidator.java`
- `src/main/java/com/final_project/blog_service/utile/ReadTimeCalculator.java`
- `src/main/java/com/final_project/blog_service/utile/SlugUtil.java`
- `src/main/resources/application.yaml`
- `src/test/java/com/final_project/blog_service/BlogServiceApplicationTests.java`

---

## `.env`

```env
KEYCLOAK_SERVER_URL=http://localhost:8444
KEYCLOAK_REALM=final-project
RABBIT_PASSWORD=guest
RABBIT_USERNAME=guest
RABBIT_PORT=5672
RABBIT_HOST=localhost
```

## `.gitattributes`

```gitattributes
/mvnw text eol=lf
*.cmd text eol=crlf
```

## `.gitignore`

```gitignore
HELP.md
target/
.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### STS ###
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### IntelliJ IDEA ###
.idea
*.iws
*.iml
*.ipr

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/

### VS Code ###
.vscode/
```

## `.mvn/wrapper/maven-wrapper.properties`

```properties
wrapperVersion=3.3.4
distributionType=only-script
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.14/apache-maven-3.9.14-bin.zip
```

## `HELP.md`

```md
# Read Me First
The following was discovered as part of building this project:

* The original package name 'com.final_project.blog-service' is invalid and this project uses 'com.final_project.blog_service' instead.

# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/3.5.13/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/3.5.13/maven-plugin/build-image.html)
* [Spring Web](https://docs.spring.io/spring-boot/3.5.13/reference/web/servlet.html)
* [Validation](https://docs.spring.io/spring-boot/3.5.13/reference/io/validation.html)
* [Spring Security](https://docs.spring.io/spring-boot/3.5.13/reference/web/spring-security.html)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Validation](https://spring.io/guides/gs/validating-form-input/)
* [Securing a Web Application](https://spring.io/guides/gs/securing-web/)
* [Spring Boot and OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)
* [Authenticating a User with LDAP](https://spring.io/guides/gs/authenticating-ldap/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

```

## `mvnw`

```text
#!/bin/sh
# ----------------------------------------------------------------------------
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
# ----------------------------------------------------------------------------

# ----------------------------------------------------------------------------
# Apache Maven Wrapper startup batch script, version 3.3.4
#
# Optional ENV vars
# -----------------
#   JAVA_HOME - location of a JDK home dir, required when download maven via java source
#   MVNW_REPOURL - repo url base for downloading maven distribution
#   MVNW_USERNAME/MVNW_PASSWORD - user and password for downloading maven
#   MVNW_VERBOSE - true: enable verbose log; debug: trace the mvnw script; others: silence the output
# ----------------------------------------------------------------------------

set -euf
[ "${MVNW_VERBOSE-}" != debug ] || set -x

# OS specific support.
native_path() { printf %s\\n "$1"; }
case "$(uname)" in
CYGWIN* | MINGW*)
  [ -z "${JAVA_HOME-}" ] || JAVA_HOME="$(cygpath --unix "$JAVA_HOME")"
  native_path() { cygpath --path --windows "$1"; }
  ;;
esac

# set JAVACMD and JAVACCMD
set_java_home() {
  # For Cygwin and MinGW, ensure paths are in Unix format before anything is touched
  if [ -n "${JAVA_HOME-}" ]; then
    if [ -x "$JAVA_HOME/jre/sh/java" ]; then
      # IBM's JDK on AIX uses strange locations for the executables
      JAVACMD="$JAVA_HOME/jre/sh/java"
      JAVACCMD="$JAVA_HOME/jre/sh/javac"
    else
      JAVACMD="$JAVA_HOME/bin/java"
      JAVACCMD="$JAVA_HOME/bin/javac"

      if [ ! -x "$JAVACMD" ] || [ ! -x "$JAVACCMD" ]; then
        echo "The JAVA_HOME environment variable is not defined correctly, so mvnw cannot run." >&2
        echo "JAVA_HOME is set to \"$JAVA_HOME\", but \"\$JAVA_HOME/bin/java\" or \"\$JAVA_HOME/bin/javac\" does not exist." >&2
        return 1
      fi
    fi
  else
    JAVACMD="$(
      'set' +e
      'unset' -f command 2>/dev/null
      'command' -v java
    )" || :
    JAVACCMD="$(
      'set' +e
      'unset' -f command 2>/dev/null
      'command' -v javac
    )" || :

    if [ ! -x "${JAVACMD-}" ] || [ ! -x "${JAVACCMD-}" ]; then
      echo "The java/javac command does not exist in PATH nor is JAVA_HOME set, so mvnw cannot run." >&2
      return 1
    fi
  fi
}

# hash string like Java String::hashCode
hash_string() {
  str="${1:-}" h=0
  while [ -n "$str" ]; do
    char="${str%"${str#?}"}"
    h=$(((h * 31 + $(LC_CTYPE=C printf %d "'$char")) % 4294967296))
    str="${str#?}"
  done
  printf %x\\n $h
}

verbose() { :; }
[ "${MVNW_VERBOSE-}" != true ] || verbose() { printf %s\\n "${1-}"; }

die() {
  printf %s\\n "$1" >&2
  exit 1
}

trim() {
  # MWRAPPER-139:
  #   Trims trailing and leading whitespace, carriage returns, tabs, and linefeeds.
  #   Needed for removing poorly interpreted newline sequences when running in more
  #   exotic environments such as mingw bash on Windows.
  printf "%s" "${1}" | tr -d '[:space:]'
}

scriptDir="$(dirname "$0")"
scriptName="$(basename "$0")"

# parse distributionUrl and optional distributionSha256Sum, requires .mvn/wrapper/maven-wrapper.properties
while IFS="=" read -r key value; do
  case "${key-}" in
  distributionUrl) distributionUrl=$(trim "${value-}") ;;
  distributionSha256Sum) distributionSha256Sum=$(trim "${value-}") ;;
  esac
done <"$scriptDir/.mvn/wrapper/maven-wrapper.properties"
[ -n "${distributionUrl-}" ] || die "cannot read distributionUrl property in $scriptDir/.mvn/wrapper/maven-wrapper.properties"

case "${distributionUrl##*/}" in
maven-mvnd-*bin.*)
  MVN_CMD=mvnd.sh _MVNW_REPO_PATTERN=/maven/mvnd/
  case "${PROCESSOR_ARCHITECTURE-}${PROCESSOR_ARCHITEW6432-}:$(uname -a)" in
  *AMD64:CYGWIN* | *AMD64:MINGW*) distributionPlatform=windows-amd64 ;;
  :Darwin*x86_64) distributionPlatform=darwin-amd64 ;;
  :Darwin*arm64) distributionPlatform=darwin-aarch64 ;;
  :Linux*x86_64*) distributionPlatform=linux-amd64 ;;
  *)
    echo "Cannot detect native platform for mvnd on $(uname)-$(uname -m), use pure java version" >&2
    distributionPlatform=linux-amd64
    ;;
  esac
  distributionUrl="${distributionUrl%-bin.*}-$distributionPlatform.zip"
  ;;
maven-mvnd-*) MVN_CMD=mvnd.sh _MVNW_REPO_PATTERN=/maven/mvnd/ ;;
*) MVN_CMD="mvn${scriptName#mvnw}" _MVNW_REPO_PATTERN=/org/apache/maven/ ;;
esac

# apply MVNW_REPOURL and calculate MAVEN_HOME
# maven home pattern: ~/.m2/wrapper/dists/{apache-maven-<version>,maven-mvnd-<version>-<platform>}/<hash>
[ -z "${MVNW_REPOURL-}" ] || distributionUrl="$MVNW_REPOURL$_MVNW_REPO_PATTERN${distributionUrl#*"$_MVNW_REPO_PATTERN"}"
distributionUrlName="${distributionUrl##*/}"
distributionUrlNameMain="${distributionUrlName%.*}"
distributionUrlNameMain="${distributionUrlNameMain%-bin}"
MAVEN_USER_HOME="${MAVEN_USER_HOME:-${HOME}/.m2}"
MAVEN_HOME="${MAVEN_USER_HOME}/wrapper/dists/${distributionUrlNameMain-}/$(hash_string "$distributionUrl")"

exec_maven() {
  unset MVNW_VERBOSE MVNW_USERNAME MVNW_PASSWORD MVNW_REPOURL || :
  exec "$MAVEN_HOME/bin/$MVN_CMD" "$@" || die "cannot exec $MAVEN_HOME/bin/$MVN_CMD"
}

if [ -d "$MAVEN_HOME" ]; then
  verbose "found existing MAVEN_HOME at $MAVEN_HOME"
  exec_maven "$@"
fi

case "${distributionUrl-}" in
*?-bin.zip | *?maven-mvnd-?*-?*.zip) ;;
*) die "distributionUrl is not valid, must match *-bin.zip or maven-mvnd-*.zip, but found '${distributionUrl-}'" ;;
esac

# prepare tmp dir
if TMP_DOWNLOAD_DIR="$(mktemp -d)" && [ -d "$TMP_DOWNLOAD_DIR" ]; then
  clean() { rm -rf -- "$TMP_DOWNLOAD_DIR"; }
  trap clean HUP INT TERM EXIT
else
  die "cannot create temp dir"
fi

mkdir -p -- "${MAVEN_HOME%/*}"

# Download and Install Apache Maven
verbose "Couldn't find MAVEN_HOME, downloading and installing it ..."
verbose "Downloading from: $distributionUrl"
verbose "Downloading to: $TMP_DOWNLOAD_DIR/$distributionUrlName"

# select .zip or .tar.gz
if ! command -v unzip >/dev/null; then
  distributionUrl="${distributionUrl%.zip}.tar.gz"
  distributionUrlName="${distributionUrl##*/}"
fi

# verbose opt
__MVNW_QUIET_WGET=--quiet __MVNW_QUIET_CURL=--silent __MVNW_QUIET_UNZIP=-q __MVNW_QUIET_TAR=''
[ "${MVNW_VERBOSE-}" != true ] || __MVNW_QUIET_WGET='' __MVNW_QUIET_CURL='' __MVNW_QUIET_UNZIP='' __MVNW_QUIET_TAR=v

# normalize http auth
case "${MVNW_PASSWORD:+has-password}" in
'') MVNW_USERNAME='' MVNW_PASSWORD='' ;;
has-password) [ -n "${MVNW_USERNAME-}" ] || MVNW_USERNAME='' MVNW_PASSWORD='' ;;
esac

if [ -z "${MVNW_USERNAME-}" ] && command -v wget >/dev/null; then
  verbose "Found wget ... using wget"
  wget ${__MVNW_QUIET_WGET:+"$__MVNW_QUIET_WGET"} "$distributionUrl" -O "$TMP_DOWNLOAD_DIR/$distributionUrlName" || die "wget: Failed to fetch $distributionUrl"
elif [ -z "${MVNW_USERNAME-}" ] && command -v curl >/dev/null; then
  verbose "Found curl ... using curl"
  curl ${__MVNW_QUIET_CURL:+"$__MVNW_QUIET_CURL"} -f -L -o "$TMP_DOWNLOAD_DIR/$distributionUrlName" "$distributionUrl" || die "curl: Failed to fetch $distributionUrl"
elif set_java_home; then
  verbose "Falling back to use Java to download"
  javaSource="$TMP_DOWNLOAD_DIR/Downloader.java"
  targetZip="$TMP_DOWNLOAD_DIR/$distributionUrlName"
  cat >"$javaSource" <<-END
	public class Downloader extends java.net.Authenticator
	{
	  protected java.net.PasswordAuthentication getPasswordAuthentication()
	  {
	    return new java.net.PasswordAuthentication( System.getenv( "MVNW_USERNAME" ), System.getenv( "MVNW_PASSWORD" ).toCharArray() );
	  }
	  public static void main( String[] args ) throws Exception
	  {
	    setDefault( new Downloader() );
	    java.nio.file.Files.copy( java.net.URI.create( args[0] ).toURL().openStream(), java.nio.file.Paths.get( args[1] ).toAbsolutePath().normalize() );
	  }
	}
	END
  # For Cygwin/MinGW, switch paths to Windows format before running javac and java
  verbose " - Compiling Downloader.java ..."
  "$(native_path "$JAVACCMD")" "$(native_path "$javaSource")" || die "Failed to compile Downloader.java"
  verbose " - Running Downloader.java ..."
  "$(native_path "$JAVACMD")" -cp "$(native_path "$TMP_DOWNLOAD_DIR")" Downloader "$distributionUrl" "$(native_path "$targetZip")"
fi

# If specified, validate the SHA-256 sum of the Maven distribution zip file
if [ -n "${distributionSha256Sum-}" ]; then
  distributionSha256Result=false
  if [ "$MVN_CMD" = mvnd.sh ]; then
    echo "Checksum validation is not supported for maven-mvnd." >&2
    echo "Please disable validation by removing 'distributionSha256Sum' from your maven-wrapper.properties." >&2
    exit 1
  elif command -v sha256sum >/dev/null; then
    if echo "$distributionSha256Sum  $TMP_DOWNLOAD_DIR/$distributionUrlName" | sha256sum -c - >/dev/null 2>&1; then
      distributionSha256Result=true
    fi
  elif command -v shasum >/dev/null; then
    if echo "$distributionSha256Sum  $TMP_DOWNLOAD_DIR/$distributionUrlName" | shasum -a 256 -c >/dev/null 2>&1; then
      distributionSha256Result=true
    fi
  else
    echo "Checksum validation was requested but neither 'sha256sum' or 'shasum' are available." >&2
    echo "Please install either command, or disable validation by removing 'distributionSha256Sum' from your maven-wrapper.properties." >&2
    exit 1
  fi
  if [ $distributionSha256Result = false ]; then
    echo "Error: Failed to validate Maven distribution SHA-256, your Maven distribution might be compromised." >&2
    echo "If you updated your Maven version, you need to update the specified distributionSha256Sum property." >&2
    exit 1
  fi
fi

# unzip and move
if command -v unzip >/dev/null; then
  unzip ${__MVNW_QUIET_UNZIP:+"$__MVNW_QUIET_UNZIP"} "$TMP_DOWNLOAD_DIR/$distributionUrlName" -d "$TMP_DOWNLOAD_DIR" || die "failed to unzip"
else
  tar xzf${__MVNW_QUIET_TAR:+"$__MVNW_QUIET_TAR"} "$TMP_DOWNLOAD_DIR/$distributionUrlName" -C "$TMP_DOWNLOAD_DIR" || die "failed to untar"
fi

# Find the actual extracted directory name (handles snapshots where filename != directory name)
actualDistributionDir=""

# First try the expected directory name (for regular distributions)
if [ -d "$TMP_DOWNLOAD_DIR/$distributionUrlNameMain" ]; then
  if [ -f "$TMP_DOWNLOAD_DIR/$distributionUrlNameMain/bin/$MVN_CMD" ]; then
    actualDistributionDir="$distributionUrlNameMain"
  fi
fi

# If not found, search for any directory with the Maven executable (for snapshots)
if [ -z "$actualDistributionDir" ]; then
  # enable globbing to iterate over items
  set +f
  for dir in "$TMP_DOWNLOAD_DIR"/*; do
    if [ -d "$dir" ]; then
      if [ -f "$dir/bin/$MVN_CMD" ]; then
        actualDistributionDir="$(basename "$dir")"
        break
      fi
    fi
  done
  set -f
fi

if [ -z "$actualDistributionDir" ]; then
  verbose "Contents of $TMP_DOWNLOAD_DIR:"
  verbose "$(ls -la "$TMP_DOWNLOAD_DIR")"
  die "Could not find Maven distribution directory in extracted archive"
fi

verbose "Found extracted Maven distribution directory: $actualDistributionDir"
printf %s\\n "$distributionUrl" >"$TMP_DOWNLOAD_DIR/$actualDistributionDir/mvnw.url"
mv -- "$TMP_DOWNLOAD_DIR/$actualDistributionDir" "$MAVEN_HOME" || [ -d "$MAVEN_HOME" ] || die "fail to move MAVEN_HOME"

clean || :
exec_maven "$@"
```

## `mvnw.cmd`

```cmd
<# : batch portion
@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script, version 3.3.4
@REM
@REM Optional ENV vars
@REM   MVNW_REPOURL - repo url base for downloading maven distribution
@REM   MVNW_USERNAME/MVNW_PASSWORD - user and password for downloading maven
@REM   MVNW_VERBOSE - true: enable verbose log; others: silence the output
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET __MVNW_ARG0_NAME__=%~nx0)
@SET __MVNW_CMD__=
@SET __MVNW_ERROR__=
@SET __MVNW_PSMODULEP_SAVE=%PSModulePath%
@SET PSModulePath=
@FOR /F "usebackq tokens=1* delims==" %%A IN (`powershell -noprofile "& {$scriptDir='%~dp0'; $script='%__MVNW_ARG0_NAME__%'; icm -ScriptBlock ([Scriptblock]::Create((Get-Content -Raw '%~f0'))) -NoNewScope}"`) DO @(
  IF "%%A"=="MVN_CMD" (set __MVNW_CMD__=%%B) ELSE IF "%%B"=="" (echo %%A) ELSE (echo %%A=%%B)
)
@SET PSModulePath=%__MVNW_PSMODULEP_SAVE%
@SET __MVNW_PSMODULEP_SAVE=
@SET __MVNW_ARG0_NAME__=
@SET MVNW_USERNAME=
@SET MVNW_PASSWORD=
@IF NOT "%__MVNW_CMD__%"=="" ("%__MVNW_CMD__%" %*)
@echo Cannot start maven from wrapper >&2 && exit /b 1
@GOTO :EOF
: end batch / begin powershell #>

$ErrorActionPreference = "Stop"
if ($env:MVNW_VERBOSE -eq "true") {
  $VerbosePreference = "Continue"
}

# calculate distributionUrl, requires .mvn/wrapper/maven-wrapper.properties
$distributionUrl = (Get-Content -Raw "$scriptDir/.mvn/wrapper/maven-wrapper.properties" | ConvertFrom-StringData).distributionUrl
if (!$distributionUrl) {
  Write-Error "cannot read distributionUrl property in $scriptDir/.mvn/wrapper/maven-wrapper.properties"
}

switch -wildcard -casesensitive ( $($distributionUrl -replace '^.*/','') ) {
  "maven-mvnd-*" {
    $USE_MVND = $true
    $distributionUrl = $distributionUrl -replace '-bin\.[^.]*$',"-windows-amd64.zip"
    $MVN_CMD = "mvnd.cmd"
    break
  }
  default {
    $USE_MVND = $false
    $MVN_CMD = $script -replace '^mvnw','mvn'
    break
  }
}

# apply MVNW_REPOURL and calculate MAVEN_HOME
# maven home pattern: ~/.m2/wrapper/dists/{apache-maven-<version>,maven-mvnd-<version>-<platform>}/<hash>
if ($env:MVNW_REPOURL) {
  $MVNW_REPO_PATTERN = if ($USE_MVND -eq $False) { "/org/apache/maven/" } else { "/maven/mvnd/" }
  $distributionUrl = "$env:MVNW_REPOURL$MVNW_REPO_PATTERN$($distributionUrl -replace "^.*$MVNW_REPO_PATTERN",'')"
}
$distributionUrlName = $distributionUrl -replace '^.*/',''
$distributionUrlNameMain = $distributionUrlName -replace '\.[^.]*$','' -replace '-bin$',''

$MAVEN_M2_PATH = "$HOME/.m2"
if ($env:MAVEN_USER_HOME) {
  $MAVEN_M2_PATH = "$env:MAVEN_USER_HOME"
}

if (-not (Test-Path -Path $MAVEN_M2_PATH)) {
    New-Item -Path $MAVEN_M2_PATH -ItemType Directory | Out-Null
}

$MAVEN_WRAPPER_DISTS = $null
if ((Get-Item $MAVEN_M2_PATH).Target[0] -eq $null) {
  $MAVEN_WRAPPER_DISTS = "$MAVEN_M2_PATH/wrapper/dists"
} else {
  $MAVEN_WRAPPER_DISTS = (Get-Item $MAVEN_M2_PATH).Target[0] + "/wrapper/dists"
}

$MAVEN_HOME_PARENT = "$MAVEN_WRAPPER_DISTS/$distributionUrlNameMain"
$MAVEN_HOME_NAME = ([System.Security.Cryptography.SHA256]::Create().ComputeHash([byte[]][char[]]$distributionUrl) | ForEach-Object {$_.ToString("x2")}) -join ''
$MAVEN_HOME = "$MAVEN_HOME_PARENT/$MAVEN_HOME_NAME"

if (Test-Path -Path "$MAVEN_HOME" -PathType Container) {
  Write-Verbose "found existing MAVEN_HOME at $MAVEN_HOME"
  Write-Output "MVN_CMD=$MAVEN_HOME/bin/$MVN_CMD"
  exit $?
}

if (! $distributionUrlNameMain -or ($distributionUrlName -eq $distributionUrlNameMain)) {
  Write-Error "distributionUrl is not valid, must end with *-bin.zip, but found $distributionUrl"
}

# prepare tmp dir
$TMP_DOWNLOAD_DIR_HOLDER = New-TemporaryFile
$TMP_DOWNLOAD_DIR = New-Item -Itemtype Directory -Path "$TMP_DOWNLOAD_DIR_HOLDER.dir"
$TMP_DOWNLOAD_DIR_HOLDER.Delete() | Out-Null
trap {
  if ($TMP_DOWNLOAD_DIR.Exists) {
    try { Remove-Item $TMP_DOWNLOAD_DIR -Recurse -Force | Out-Null }
    catch { Write-Warning "Cannot remove $TMP_DOWNLOAD_DIR" }
  }
}

New-Item -Itemtype Directory -Path "$MAVEN_HOME_PARENT" -Force | Out-Null

# Download and Install Apache Maven
Write-Verbose "Couldn't find MAVEN_HOME, downloading and installing it ..."
Write-Verbose "Downloading from: $distributionUrl"
Write-Verbose "Downloading to: $TMP_DOWNLOAD_DIR/$distributionUrlName"

$webclient = New-Object System.Net.WebClient
if ($env:MVNW_USERNAME -and $env:MVNW_PASSWORD) {
  $webclient.Credentials = New-Object System.Net.NetworkCredential($env:MVNW_USERNAME, $env:MVNW_PASSWORD)
}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$webclient.DownloadFile($distributionUrl, "$TMP_DOWNLOAD_DIR/$distributionUrlName") | Out-Null

# If specified, validate the SHA-256 sum of the Maven distribution zip file
$distributionSha256Sum = (Get-Content -Raw "$scriptDir/.mvn/wrapper/maven-wrapper.properties" | ConvertFrom-StringData).distributionSha256Sum
if ($distributionSha256Sum) {
  if ($USE_MVND) {
    Write-Error "Checksum validation is not supported for maven-mvnd. `nPlease disable validation by removing 'distributionSha256Sum' from your maven-wrapper.properties."
  }
  Import-Module $PSHOME\Modules\Microsoft.PowerShell.Utility -Function Get-FileHash
  if ((Get-FileHash "$TMP_DOWNLOAD_DIR/$distributionUrlName" -Algorithm SHA256).Hash.ToLower() -ne $distributionSha256Sum) {
    Write-Error "Error: Failed to validate Maven distribution SHA-256, your Maven distribution might be compromised. If you updated your Maven version, you need to update the specified distributionSha256Sum property."
  }
}

# unzip and move
Expand-Archive "$TMP_DOWNLOAD_DIR/$distributionUrlName" -DestinationPath "$TMP_DOWNLOAD_DIR" | Out-Null

# Find the actual extracted directory name (handles snapshots where filename != directory name)
$actualDistributionDir = ""

# First try the expected directory name (for regular distributions)
$expectedPath = Join-Path "$TMP_DOWNLOAD_DIR" "$distributionUrlNameMain"
$expectedMvnPath = Join-Path "$expectedPath" "bin/$MVN_CMD"
if ((Test-Path -Path $expectedPath -PathType Container) -and (Test-Path -Path $expectedMvnPath -PathType Leaf)) {
  $actualDistributionDir = $distributionUrlNameMain
}

# If not found, search for any directory with the Maven executable (for snapshots)
if (!$actualDistributionDir) {
  Get-ChildItem -Path "$TMP_DOWNLOAD_DIR" -Directory | ForEach-Object {
    $testPath = Join-Path $_.FullName "bin/$MVN_CMD"
    if (Test-Path -Path $testPath -PathType Leaf) {
      $actualDistributionDir = $_.Name
    }
  }
}

if (!$actualDistributionDir) {
  Write-Error "Could not find Maven distribution directory in extracted archive"
}

Write-Verbose "Found extracted Maven distribution directory: $actualDistributionDir"
Rename-Item -Path "$TMP_DOWNLOAD_DIR/$actualDistributionDir" -NewName $MAVEN_HOME_NAME | Out-Null
try {
  Move-Item -Path "$TMP_DOWNLOAD_DIR/$MAVEN_HOME_NAME" -Destination $MAVEN_HOME_PARENT | Out-Null
} catch {
  if (! (Test-Path -Path "$MAVEN_HOME" -PathType Container)) {
    Write-Error "fail to move MAVEN_HOME"
  }
} finally {
  try { Remove-Item $TMP_DOWNLOAD_DIR -Recurse -Force | Out-Null }
  catch { Write-Warning "Cannot remove $TMP_DOWNLOAD_DIR" }
}

Write-Output "MVN_CMD=$MAVEN_HOME/bin/$MVN_CMD"
```

## `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.5.13</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.final_project</groupId>
	<artifactId>blog-service</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name/>
	<description/>
	<url/>
	<licenses>
		<license/>
	</licenses>
	<developers>
		<developer/>
	</developers>
	<scm>
		<connection/>
		<developerConnection/>
		<tag/>
		<url/>
	</scm>
	<properties>
		<java.version>17</java.version>
		<spring-cloud.version>2025.0.1</spring-cloud.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-redis</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-openfeign</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>

		<dependency>
			<groupId>com.fasterxml.jackson.core</groupId>
			<artifactId>jackson-databind</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<scope>annotationProcessor</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-mongodb</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springdoc</groupId>
			<artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
			<version>2.8.16</version>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-api</artifactId>
			<version>0.12.3</version>
			<scope>compile</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
		</dependency>
		<dependency>
			<groupId>io.github.resilience4j</groupId>
			<artifactId>resilience4j-circuitbreaker</artifactId>
			<version>2.3.0</version>
			<scope>compile</scope>
		</dependency>
		<dependency>
			<groupId>io.github.resilience4j</groupId>
			<artifactId>resilience4j-retry</artifactId>
			<version>2.4.0</version>
			<scope>compile</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-config</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-amqp</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.amqp</groupId>
			<artifactId>spring-rabbit-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
	</dependencies>
	<dependencyManagement>
		<dependencies>
			<dependency>
				<groupId>org.springframework.cloud</groupId>
				<artifactId>spring-cloud-dependencies</artifactId>
				<version>${spring-cloud.version}</version>
				<type>pom</type>
				<scope>import</scope>
			</dependency>
		</dependencies>
	</dependencyManagement>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
		</plugins>
	</build>

</project>
```

## `src/main/java/com/final_project/blog_service/BlogServiceApplication.java`

```java
package com.final_project.blog_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class BlogServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(BlogServiceApplication.class, args);
	}

}
```

## `src/main/java/com/final_project/blog_service/client/FileServiceClient.java`

```java
package com.final_project.blog_service.client;

import com.final_project.blog_service.dto.response.FileCdnUrlResponse;
import com.final_project.blog_service.dto.response.FileMetadataResponse;
import com.final_project.blog_service.dto.response.FileUploadResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(
        name = "file-service",
        url = "http://localhost:8084"
)
public interface FileServiceClient {
    @PostMapping(value = "/file/blog/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    FileUploadResponse uploadBlogFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam("ownerId") String ownerId,
            @RequestParam("article") String article
    );

    @GetMapping("/file/blog/{fileId}")
    FileMetadataResponse getFileMetadata(@PathVariable("fileId") String fileId);

    @GetMapping("/file/blog/{fileId}/url")
    FileCdnUrlResponse getCdnUrl(@PathVariable("fileId") String fileId);

    @DeleteMapping("/file/blog/{fileId}/article/{articleId}")
    void deleteFile(@PathVariable("fileId") String fileId, @PathVariable String articleId);
}
```

## `src/main/java/com/final_project/blog_service/client/UserServiceClient.java`

```java
package com.final_project.blog_service.client;

import com.final_project.blog_service.config.UserServiceFeignConfig;
import com.final_project.blog_service.dto.*;
import com.final_project.blog_service.dto.response.UserAuthorResponse;
import com.final_project.blog_service.dto.response.UserExistsResponse;
import com.final_project.blog_service.dto.response.UserPreferencesResponse;
import com.final_project.blog_service.dto.response.UserProfileResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(
        name = "AUTH-SERVICE",
        url = "http://localhost:8085",
        configuration = UserServiceFeignConfig.class
)
public interface UserServiceClient {

    /**
     * Get user profile by ID
     * Called when article author info is needed
     */
    @GetMapping("/api/v1/users/{userId}")
    UserProfileResponse getUserProfile(@PathVariable String userId);

    @GetMapping("/api/v1/users/{id}/{roleName}")
    UserDTO getUserByIdAndRoleName(@PathVariable String id, @PathVariable String roleName);

    /**
     * Get author by id
     * Called for cross-service validation
     */
    @GetMapping("/api/v1/users/author/{id}")
    UserAuthorResponse getUserAuthor(@PathVariable String id);

    /**
     * Get user by email
     * Called for cross-service validation
     */
    @GetMapping("/api/v1/users/email/{email}")
    UserProfileResponse getUserByEmail(@PathVariable String email);

    /**
     * Verify user exists
     * Called before creating article or comment
     */
    @GetMapping("/api/v1/users/{userId}/exists")
    UserExistsResponse checkUserExists(@PathVariable String userId);

    /**
     * Get multiple user profiles
     * Called for bulk author info retrieval
     */
    @PostMapping("/api/v1/users/batch")
    List<UserProfileResponse> getMultipleUsers(@RequestBody List<String> userIds);

    /**
     * Get user preferences
     * Called for personalization
     */
    @GetMapping("/api/v1/users/{userId}/preferences")
    UserPreferencesResponse getUserPreferences(@PathVariable String userId);
}






```

## `src/main/java/com/final_project/blog_service/config/OpenApiConfig.java`

```java
package com.final_project.blog_service.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI Configuration
 *
 * Configures Swagger/OpenAPI documentation for the Article Service
 *
 * Access at: http://localhost:8081/swagger-ui.html
 * API Docs JSON: http://localhost:8081/v3/api-docs
 * API Docs YAML: http://localhost:8081/v3/api-docs.yaml
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(getApiInfo())
                .components(getComponents())
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }

    /**
     * API Information
     */
    private Info getApiInfo() {
        return new Info()
                .title("Article Service API")
                .version("1.0.0")
                .description("""
                **Medium-Like Blogging Platform - Article Service**
                
                A production-grade Spring Boot microservice for managing blog articles,
                comments, engagement, and user interactions.
                
                ## Features
                - ✅ Create, read, update, and publish articles
                - ✅ Block-based flexible content (text, images, videos, code, quotes, embeds)
                - ✅ Hierarchical threaded comments and replies
                - ✅ Engagement tracking (likes, shares, read metrics)
                - ✅ JWT authentication with User Service integration
                - ✅ User profile caching with fallback mechanism
                - ✅ MongoDB for flexible document storage
                - ✅ Redis caching for performance
                - ✅ Full-text search capabilities
                
                ## Security
                - All write operations require JWT authentication
                - JWT tokens obtained from User Service
                - Only article authors can edit/delete their articles
                - Only comment authors can delete their comments
                - Input validation on all endpoints
                
                ## API Structure
                - **Base Path**: `/api/v1`
                - **Articles**: `/articles` - CRUD operations on blog posts
                - **Comments**: `/articles/{id}/comments` - Threaded discussions
                - **Engagement**: `/articles/{id}/like`, `/articles/{id}/share` - User interactions
                
                ## Content Blocks
                Articles support flexible content blocks:
                - `text` - Rich text content
                - `heading` - Headers with levels 1-6
                - `image` - Images with captions
                - `video` - Video embeds
                - `code` - Code snippets with syntax highlighting
                - `quote` - Quoted text with attribution
                - `embed` - External embeds (YouTube, Twitter, etc.)
                - `divider` - Visual separator
                
                ## Authentication
                All protected endpoints require JWT Bearer token in Authorization header:
                ```
                Authorization: Bearer eyJhbGciOiJIUzUxMiJ9...
                ```
                
                ## Response Format
                - Successful responses include status code and data
                - Error responses include error code, message, and timestamp
                - Paginated responses include pagination metadata
                
                ## Pagination
                List endpoints support pagination with:
                - `page` - Zero-indexed page number (default: 0)
                - `pageSize` - Items per page (default: 20, max: 100)
                
                ## Rate Limiting
                - Read operations: 100 requests/minute per user
                - Write operations: 20 requests/minute per user
                - Publish operations: 5 requests/minute per user
                """)
                .contact(new Contact()
                        .name("Backend Team")
                        .email("backend@blog.com")
                        .url("https://blog.com/support"))
                .license(new License()
                        .name("MIT License")
                        .url("https://opensource.org/licenses/MIT"))
                .termsOfService("https://blog.com/terms");
    }


    /**
     * Security Schemes and Components
     */
    private Components getComponents() {
        return new Components()
                .addSecuritySchemes("bearerAuth",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("""
                        JWT Bearer Token obtained from User Service.
                        
                        **How to get a token:**
                        1. Call User Service login endpoint: POST /api/v1/auth/login
                        2. Provide email and password
                        3. Receive JWT token in response
                        4. Include token in Authorization header for all requests
                        
                        **Token Format:**
                        ```
                        Authorization: Bearer <your_jwt_token_here>
                        ```
                        
                        **Token Claims:**
                        - `sub` (subject) - User ID
                        - `email` - User email
                        - `iat` (issued at) - Token creation timestamp
                        - `exp` (expiration) - Token expiration timestamp (24 hours)
                        """)
                );
    }
}

```

## `src/main/java/com/final_project/blog_service/config/RedisConfig.java`

```java
package com.final_project.blog_service.config;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.blog_service.dto.response.UserProfileResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(stringSerializer);

        return template;
    }
    @Bean
    public RedisTemplate<String, UserProfileResponse> userProfileRedisTemplate(
            RedisConnectionFactory connectionFactory,
            ObjectMapper objectMapper
    ) {
        RedisTemplate<String, UserProfileResponse> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer keySerializer = new StringRedisSerializer();

        Jackson2JsonRedisSerializer<UserProfileResponse> valueSerializer =
                new Jackson2JsonRedisSerializer<>(objectMapper, UserProfileResponse.class);

        template.setKeySerializer(keySerializer);
        template.setHashKeySerializer(keySerializer);
        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);

        template.afterPropertiesSet();
        return template;
    }
}
```

## `src/main/java/com/final_project/blog_service/config/SecurityConfig.java`

```java
package com.final_project.blog_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.time.Duration;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Uncomment this to enable @PreAuthorize
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri}")
    private String jwkSetUri;
    @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}")
    private String issuerUri;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/health", "/actuator/**", "/swagger-ui/**").permitAll()
                        .anyRequest().authenticated() // Ensure requests MUST be authenticated
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder())
                                .jwtAuthenticationConverter(jwtAuthenticationConverter())
                        )
                );
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();

        jwtDecoder.setJwtValidator(token -> {
            try {
                // This forces validation and helps us catch the error
                System.out.println("Validating token from issuer: " + token.getIssuer());
                return OAuth2TokenValidatorResult.success();
            } catch (Exception e) {
                System.err.println("JWT Validation Error: " + e.getMessage());
                return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", e.getMessage(), null));
            }
        });

        return jwtDecoder;
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter defaultAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            // 1. Get default SCOPE_ authorities (e.g., SCOPE_profile)
            Collection<GrantedAuthority> authorities = defaultAuthoritiesConverter.convert(jwt);

            // 2. Extract Realm Roles
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
                authorities.addAll(roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .toList());
            }

            return authorities;
        });
        return converter;
    }
}
```

## `src/main/java/com/final_project/blog_service/config/UserServiceFeignConfig.java`

```java
package com.final_project.blog_service.config;

import com.final_project.blog_service.exception.UnauthorizedException;
import com.final_project.blog_service.exception.UserNotFoundException;
import com.final_project.blog_service.exception.UserServiceException;
import com.final_project.blog_service.exception.UserServiceUnavailableException;
import feign.RequestInterceptor;
import feign.codec.ErrorDecoder;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Configuration
public class UserServiceFeignConfig {
    @Bean
    public RequestInterceptor bearerRequestInterceptor() {
        return template -> {
            ServletRequestAttributes attributes =(ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null){
                return ;
            }
            HttpServletRequest request = attributes.getRequest();
            String authorizationHeader = request.getHeader("Authorization");
            if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
                template.header("Authorization", authorizationHeader);
            }
        };
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return (methodKey, response) -> {
            log.error("User Service error: {} {}", response.status(), response.reason());

            switch (response.status()) {
                case 400:
                    return new UserServiceException("Bad request to User Service");
                case 401:
                case 403:
                    return new UnauthorizedException("Unauthorized access to User Service");
                case 404:
                    return new UserNotFoundException("User not found in User Service");
                case 500:
                case 502:
                case 503:
                case 504:
                    return new UserServiceUnavailableException("User Service is unavailable");
                default:
                    return new UserServiceException("User Service error: " + response.reason());
            }
        };
    }
}

```

## `src/main/java/com/final_project/blog_service/controller/ArticleController.java`

```java
package com.final_project.blog_service.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.blog_service.dto.request.*;
import com.final_project.blog_service.dto.response.*;
import com.final_project.blog_service.service.ArticleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.tags.Tags;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
@Tags({
        @Tag(
                name = "Articles",
                description = "Article management endpoints - create, read, update, publish articles"
        )
})
public class ArticleController {

    private final ArticleService articleService;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/with-files/author/{author}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Create article with files",
            description = "Creates a flexible article and uploads cover/inline files through file-service"
    )
    public ResponseEntity<ArticleResponse> createArticleWithFiles(
            @RequestPart("title") String title,
            @RequestPart(value = "description", required = false) String description,
            @RequestPart("blocks") String blocksJson,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
            @RequestPart(value = "inlineFiles", required = false) List<MultipartFile> inlineFiles,
            @PathVariable String author
    ) {
        ArticleResponse response = articleService.createArticleWithFiles(
                title,
                description,
                blocksJson,
                coverImage,
                inlineFiles,
                author
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Create article with JSON only.
     *
     * Endpoint:
     * POST /api/v1/articles
     */
    @PostMapping(value = "/{userId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Create article with JSON",
            description = "Creates an article using application/json.",
            tags = {"Articles"},
            operationId = "createArticleJson"
    )
    public ResponseEntity<ArticleResponse> createArticleJson(
            @Valid @RequestBody CreateArticleRequest request,
            @PathVariable String userId
    ) {
        ArticleResponse response = articleService.createArticle(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Create draft article for a specific user.
     *
     * Endpoint:
     * POST /api/v1/articles/drafts/users/{userId}
     */
    @PostMapping("/drafts/users/{userId}")
    @Operation(
            summary = "Create draft article for user",
            description = "Creates a new draft article for a specific user.",
            tags = {"Articles"},
            operationId = "createDraftArticleForUser"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Article created successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ArticleResponse.class)
                    )
            ),
            @ApiResponse(responseCode = "400", description = "Invalid request - validation failed"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ArticleResponse> createDraftArticleForUser(
            @Valid @RequestBody CreateArticleRequest request,
            @PathVariable String userId
    ) {
        ArticleResponse response = articleService.createArticle(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get published articles feed.
     *
     * Endpoint:
     * GET /api/v1/articles?page=0&pageSize=20
     */
    @GetMapping
    @Operation(
            summary = "Get published articles",
            description = "Retrieves a paginated list of all published articles.",
            tags = {"Articles"},
            operationId = "getPublishedArticles"
    )
    public ResponseEntity<PaginatedResponse<ArticlePreviewResponse>> getPublishedArticles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        PaginatedResponse<ArticlePreviewResponse> response = articleService.getPublishedArticles(page, pageSize);
        return ResponseEntity.ok(response);
    }

    /**
     * Get article by ID.
     *
     * Endpoint:
     * GET /api/v1/articles/{articleId}
     */
    @GetMapping("/{articleId}")
    @Operation(
            summary = "Get article by ID",
            description = "Retrieves a single article by its ID.",
            tags = {"Articles"},
            operationId = "getArticleById"
    )
    public ResponseEntity<ArticleResponse> getArticleById(
            @PathVariable String articleId
    ) {
        ArticleResponse response = articleService.getArticleById(articleId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get article by slug.
     *
     * Endpoint:
     * GET /api/v1/articles/slug/{slug}
     */
    @GetMapping("/slug/{slug}")
    @Operation(
            summary = "Get article by slug",
            description = "Retrieves an article using its URL-friendly slug.",
            tags = {"Articles"},
            operationId = "getArticleBySlug"
    )
    public ResponseEntity<ArticleResponse> getArticleBySlug(
            @PathVariable String slug
    ) {
        ArticleResponse response = articleService.getArticleBySlug(slug);
        return ResponseEntity.ok(response);
    }

    /**
     * Update article with multipart/form-data.
     *
     * Endpoint:
     * PUT /api/v1/articles/{articleId}
     */
    @PutMapping(value = "/{articleId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Update article with files",
            description = "Updates an article using multipart/form-data.",
            tags = {"Articles"},
            operationId = "updateArticleWithFiles"
    )
    public ResponseEntity<ArticleResponse> updateArticleWithFiles(
            @PathVariable String articleId,
            @RequestPart("article") String articleJsonString,
            @RequestPart(value = "coverImage", required = false) MultipartFile coverImage,
            @RequestPart(value = "files", required = false) MultipartFile[] additionalFiles,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();

        try {
            UpdateArticleRequest request = objectMapper.readValue(
                    articleJsonString,
                    UpdateArticleRequest.class
            );

            ArticleResponse response = articleService.updateArticle(articleId, userId, request);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            throw new IllegalArgumentException("Invalid article JSON format", e);
        }
    }

    /**
     * Update article with JSON only.
     *
     * Endpoint:
     * PUT /api/v1/articles/{articleId}
     */
    @PutMapping(value = "/{articleId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
            summary = "Update article with JSON",
            description = "Updates an existing article using application/json.",
            tags = {"Articles"},
            operationId = "updateArticleJson"
    )
    public ResponseEntity<ArticleResponse> updateArticleJson(
            @PathVariable String articleId,
            @Valid @RequestBody UpdateArticleRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        ArticleResponse response = articleService.updateArticle(articleId, userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Publish article.
     *
     * Endpoint:
     * PATCH /api/v1/articles/{articleId}/publish
     */
    @PatchMapping("/{articleId}/publish")
    @Operation(
            summary = "Publish article",
            description = "Publishes a draft article.",
            tags = {"Articles"},
            operationId = "publishArticle"
    )
    public ResponseEntity<ArticleResponse> publishArticle(
            @PathVariable String articleId,
            @Valid @RequestBody PublishArticleRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        ArticleResponse response = articleService.publishArticle(articleId, userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete/archive article.
     *
     * Endpoint:
     * DELETE /api/v1/articles/{articleId}
     */
    @DeleteMapping("/{articleId}")
    @Operation(
            summary = "Delete article",
            description = "Soft deletes or archives an article.",
            tags = {"Articles"},
            operationId = "deleteArticle"
    )
    public ResponseEntity<Void> deleteArticle(
            @PathVariable String articleId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        articleService.deleteArticle(articleId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get author's articles.
     *
     * Endpoint:
     * GET /api/v1/articles/authors/{authorId}?page=0&pageSize=20
     */
    @GetMapping("/authors/{authorId}")
    @Operation(
            summary = "Get author's articles",
            description = "Retrieves all published articles by a specific author.",
            tags = {"Articles"},
            operationId = "getAuthorArticles"
    )
    public ResponseEntity<PaginatedResponse<ArticlePreviewResponse>> getAuthorArticles(
            @PathVariable String authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        PaginatedResponse<ArticlePreviewResponse> response = articleService.getUserArticles(authorId, page, pageSize);
        return ResponseEntity.ok(response);
    }

    /**
     * Get author's specific article.
     *
     * Endpoint:
     * GET /api/v1/articles/authors/{authorId}/articles/{articleId}
     */
    @GetMapping("/authors/{authorId}/articles/{articleId}")
    @Operation(
            summary = "Get author's specific article",
            description = "Retrieves a specific article by author ID and article ID.",
            tags = {"Articles"},
            operationId = "getAuthorArticleById"
    )
    public ResponseEntity<ArticleResponse> getAuthorArticleById(
            @PathVariable String authorId,
            @PathVariable String articleId
    ) {
        ArticleResponse response = articleService.getArticleByAuthorAndId(authorId, articleId);
        return ResponseEntity.ok(response);
    }

    /**
     * Post comment.
     *
     * Endpoint:
     * POST /api/v1/articles/{articleId}/comments
     */
    @PostMapping("/{articleId}/comments")
    @Operation(
            summary = "Post comment",
            description = "Posts a top-level comment on an article.",
            tags = {"Comments"},
            operationId = "postComment"
    )
    public ResponseEntity<CommentResponse> postComment(
            @PathVariable String articleId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        CommentResponse response = articleService.postComment(articleId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get article comments.
     *
     * Endpoint:
     * GET /api/v1/articles/{articleId}/comments?page=0&pageSize=10
     */
    @GetMapping("/{articleId}/comments")
    @Operation(
            summary = "Get article comments",
            description = "Retrieves all comments on an article.",
            tags = {"Comments"},
            operationId = "getArticleComments"
    )
    public ResponseEntity<PaginatedResponse<CommentThreadResponse>> getArticleComments(
            @PathVariable String articleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        PaginatedResponse<CommentThreadResponse> response = articleService.getArticleComments(articleId, page, pageSize);
        return ResponseEntity.ok(response);
    }

    /**
     * Reply to comment.
     *
     * Endpoint:
     * POST /api/v1/articles/{articleId}/comments/{parentCommentId}/replies
     */
    @PostMapping("/{articleId}/comments/{parentCommentId}/replies")
    @Operation(
            summary = "Reply to comment",
            description = "Posts a reply to an existing comment.",
            tags = {"Comments"},
            operationId = "replyToComment"
    )
    public ResponseEntity<CommentResponse> replyToComment(
            @PathVariable String articleId,
            @PathVariable String parentCommentId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        CommentResponse response = articleService.replyToComment(articleId, parentCommentId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Delete comment.
     *
     * Endpoint:
     * DELETE /api/v1/articles/comments/{commentId}
     */
    @DeleteMapping("/comments/{commentId}")
    @Operation(
            summary = "Delete comment",
            description = "Soft deletes a comment.",
            tags = {"Comments"},
            operationId = "deleteComment"
    )
    public ResponseEntity<Void> deleteComment(
            @PathVariable String commentId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        articleService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Like article.
     *
     * Endpoint:
     * POST /api/v1/articles/{articleId}/likes
     */
    @PostMapping("/{articleId}/likes")
    @Operation(
            summary = "Like article",
            description = "Adds a like to an article.",
            tags = {"Engagement"},
            operationId = "likeArticle"
    )
    public ResponseEntity<LikeResponse> likeArticle(
            @PathVariable String articleId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        LikeResponse response = articleService.likeArticle(articleId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Unlike article.
     *
     * Endpoint:
     * DELETE /api/v1/articles/{articleId}/likes
     */
    @DeleteMapping("/{articleId}/likes")
    @Operation(
            summary = "Unlike article",
            description = "Removes a like from an article.",
            tags = {"Engagement"},
            operationId = "unlikeArticle"
    )
    public ResponseEntity<Void> unlikeArticle(
            @PathVariable String articleId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        articleService.unlikeArticle(articleId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Share article.
     *
     * Endpoint:
     * POST /api/v1/articles/{articleId}/shares
     */
    @PostMapping("/{articleId}/shares")
    @Operation(
            summary = "Share article",
            description = "Tracks sharing of an article.",
            tags = {"Engagement"},
            operationId = "shareArticle"
    )
    public ResponseEntity<ShareResponse> shareArticle(
            @PathVariable String articleId,
            @Valid @RequestBody ShareRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();
        ShareResponse response = articleService.shareArticle(articleId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private CreateArticleWithFilesRequest processAndMapFiles(
            CreateArticleWithFilesRequest request,
            MultipartFile coverImage,
            MultipartFile[] additionalFiles,
            String userId
    ) {
        if (coverImage != null && !coverImage.isEmpty()) {
            log.debug("Cover image provided but should be uploaded separately");
        }

        return request;
    }
}
```

## `src/main/java/com/final_project/blog_service/controller/FileUploadController.java`

```java
package com.final_project.blog_service.controller;

import com.final_project.blog_service.dto.response.FileUploadResponse;
import com.final_project.blog_service.dto.response.ImageUploadResponse;
import com.final_project.blog_service.dto.response.VideoUploadResponse;
import com.final_project.blog_service.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * File Upload Controller
 *
 * Handles file uploads for article content
 * Supports images, videos, and other media files
 * Integrates with File Service (MinIO)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Tag(
        name = "File Uploads",
        description = "File upload endpoints for article content (images, videos, etc.)"
)
public class FileUploadController {

    private final FileUploadService fileUploadService;

    /**
     * Upload an image file
     */
    @PostMapping(value = "/upload/image/{userId}/article/{articleId}", consumes = "multipart/form-data")
    @Operation(
            summary = "Upload image",
            description = "Uploads an image file for use in article content blocks. Supports JPEG, PNG, WebP, GIF.",
            tags = {"File Uploads"},
            operationId = "uploadImage"
    )
    @Parameters({
            @Parameter(
                    name = "file",
                    description = "Image file (JPEG, PNG, WebP, GIF). Max size: 10MB",
                    required = true,
                    in = ParameterIn.QUERY
            ),
            @Parameter(
                    name = "alt",
                    description = "Alternative text for accessibility",
                    required = false,
                    in = ParameterIn.QUERY
            ),
            @Parameter(
                    name = "caption",
                    description = "Image caption",
                    required = false,
                    in = ParameterIn.QUERY
            )
    })
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Image uploaded successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ImageUploadResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid file or parameters"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized - JWT missing"
            ),
            @ApiResponse(
                    responseCode = "413",
                    description = "File too large (max 10MB)"
            ),
            @ApiResponse(
                    responseCode = "415",
                    description = "Unsupported media type"
            )
    })
    public ResponseEntity<FileUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @PathVariable String userId,
            @PathVariable String articleId

    ) {
        log.info("POST /api/v1/files/upload/image - Upload image");

        FileUploadResponse response = fileUploadService.uploadArticleImage(file,userId,articleId );

        return ResponseEntity.ok(response);
    }

    /**
     * Upload a video file
     * not yet implemented!
     */
    @PostMapping(value = "/upload/video/{userId}/article/{articleId}", consumes = "multipart/form-data")
    @Operation(
            summary = "Upload video",
            description = "Uploads a video file for use in article content blocks. Supports MP4, WebM, Ogg, MOV.",
            tags = {"File Uploads"},
            operationId = "uploadVideo"
    )
    @Parameters({
            @Parameter(
                    name = "file",
                    description = "Video file (MP4, WebM, Ogg, MOV). Max size: 500MB",
                    required = true,
                    in = ParameterIn.QUERY
            ),
            @Parameter(
                    name = "title",
                    description = "Video title",
                    required = false,
                    in = ParameterIn.QUERY
            ),
            @Parameter(
                    name = "description",
                    description = "Video description",
                    required = false,
                    in = ParameterIn.QUERY
            )
    })
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Video uploaded successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = VideoUploadResponse.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid file or parameters"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized"
            ),
            @ApiResponse(
                    responseCode = "413",
                    description = "File too large (max 500MB)"
            ),
            @ApiResponse(
                    responseCode = "415",
                    description = "Unsupported media type"
            )
    })
    public ResponseEntity<FileUploadResponse> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @PathVariable String userId,
            @PathVariable String articleId
    ) {
        FileUploadResponse response = fileUploadService.uploadArticleVideo(file,userId,articleId);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a file
     */
    @DeleteMapping("/{fileId}/author/{articleId}")
    @Operation(
            summary = "Delete file",
            description = "Deletes a file from storage. Only the uploader can delete their files.",
            tags = {"File Uploads"},
            operationId = "deleteFile"
    )
    @Parameters({
            @Parameter(
                    name = "fileId",
                    description = "The ID of the file to delete",
                    required = true,
                    in = ParameterIn.PATH
            )
    })
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "File deleted successfully"
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "Unauthorized"
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "Forbidden - not the file uploader"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "File not found"
            )
    })
    public ResponseEntity<Void> deleteFile(
            @PathVariable String fileId,
            @PathVariable String articleId
    ) {
        fileUploadService.deleteFile(fileId, articleId);
        return ResponseEntity.noContent().build();
    }
}
```

## `src/main/java/com/final_project/blog_service/dto/ArticleBlockType.java`

```java
package com.final_project.blog_service.dto;

public enum ArticleBlockType {
    TEXT("text"),
    HEADING("heading"),
    IMAGE("image"),
    VIDEO("video"),
    CODE("code"),
    QUOTE("quote"),
    EMBED("embed"),
    DIVIDER("divider");
    private final String type;
    ArticleBlockType(String type){
        this.type=type.toLowerCase();
    }
    public String getType(){
        return type.toUpperCase();
    }

}
```

## `src/main/java/com/final_project/blog_service/dto/CodeBlockDTO.java`

```java
package com.final_project.blog_service.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Code Block - Code snippets with syntax highlighting
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Code Block",
        description = "Code snippet with language specification",
        example = "{\"type\": \"code\", \"data\": {\"language\": \"javascript\", \"code\": \"const x = 1;\"}}"
)
public class CodeBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "Code content is required")
    @Size(max = 50000, message = "Code must not exceed 50000 characters")
    @Schema(
            title = "Code Content",
            description = "The code snippet",
            example = "const greeting = 'Hello, World!';\\nconsole.log(greeting);"
    )
    private String code;

    @Size(max = 100, message = "Language must not exceed 100 characters")
    @Schema(
            title = "Programming Language",
            description = "Language for syntax highlighting",
            example = "javascript",
            allowableValues = {
                    "javascript", "python", "java", "cpp", "csharp", "go", "rust",
                    "ruby", "php", "swift", "kotlin", "typescript", "sql", "html",
                    "css", "bash", "shell", "plaintext"
            }
    )
    private String language;

    @Builder.Default
    @Schema(
            title = "Show Line Numbers",
            description = "Whether to display line numbers",
            example = "true"
    )
    private Boolean showLineNumbers = false;

    public CodeBlockDTO(String type, String code, String language) {
        this.type = type;
        this.code = code;
        this.language = language;
    }
}
```

## `src/main/java/com/final_project/blog_service/dto/ContentBlock.java`

```java
package com.final_project.blog_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;


@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class ContentBlock {
    private ArticleBlockType type;
    private Integer order;
    private Map<String, Object> data;
}
```

## `src/main/java/com/final_project/blog_service/dto/ContentBlockDTO.java`

```java
package com.final_project.blog_service.dto;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Base Content Block with Type Discriminator
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        property = "type",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = TextBlockDTO.class, name = "text"),
        @JsonSubTypes.Type(value = HeadingBlockDTO.class, name = "heading"),
        @JsonSubTypes.Type(value = ImageBlockDTO.class, name = "image"),
        @JsonSubTypes.Type(value = VideoBlockDTO.class, name = "video"),
        @JsonSubTypes.Type(value = CodeBlockDTO.class, name = "code"),
        @JsonSubTypes.Type(value = QuoteBlockDTO.class, name = "quote"),
        @JsonSubTypes.Type(value = EmbedBlockDTO.class, name = "embed"),
        @JsonSubTypes.Type(value = DividerBlockDTO.class, name = "divider")
})
@Schema(
        title = "Content Block",
        description = "Flexible content block for article composition",
        oneOf = {
                TextBlockDTO.class,
                HeadingBlockDTO.class,
                ImageBlockDTO.class,
                VideoBlockDTO.class,
                CodeBlockDTO.class,
                QuoteBlockDTO.class,
                EmbedBlockDTO.class,
                DividerBlockDTO.class
        }
)
public class ContentBlockDTO {
    @NotBlank(message = "Block type is required")
    @Pattern(
            regexp = "^(text|heading|image|video|code|quote|embed|divider)$",
            message = "Invalid block type"
    )
    @Schema(
            title = "Block Type",
            example = "text",
            allowableValues = {"text", "heading", "image", "video", "code", "quote", "embed", "divider"}
    )
    protected String type;

}

```

## `src/main/java/com/final_project/blog_service/dto/DividerBlockDTO.java`

```java
package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Divider Block - Visual separator
 */
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Divider Block",
        description = "Visual divider/separator",
        example = "{\"type\": \"divider\", \"data\": {}}"
)
public class DividerBlockDTO extends ContentBlockDTO {

    public DividerBlockDTO(String type) {
        this.type = type;
    }
}
```

## `src/main/java/com/final_project/blog_service/dto/EmbedBlockDTO.java`

```java
package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Embed Block - External embeds (YouTube, Twitter, etc.)
 */
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Embed Block",
        description = "External content embed",
        example = "{\"type\": \"embed\", \"data\": {\"provider\": \"youtube\", \"embedUrl\": \"https://www.youtube.com/embed/dQw4w9WgXcQ\"}}"
)
public class EmbedBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "Provider is required")
    @Pattern(
            regexp = "^(youtube|twitter|vimeo|codepen|gist|instagram)$",
            message = "Invalid provider"
    )
    @Schema(
            title = "Provider",
            description = "Embed service provider",
            example = "youtube",
            allowableValues = {"youtube", "twitter", "vimeo", "codepen", "gist", "instagram"}
    )
    private String provider;

    @NotBlank(message = "Embed URL is required")
    @Schema(
            title = "Embed URL",
            description = "URL to embed content",
            example = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    )
    private String embedUrl;

    @Size(max = 500, message = "Title must not exceed 500 characters")
    @Schema(
            title = "Title",
            description = "Embed title",
            example = "Tutorial video"
    )
    private String title;

    public EmbedBlockDTO(String type, String provider, String embedUrl) {
        this.type = type;
        this.provider = provider;
        this.embedUrl = embedUrl;
    }
}
```

## `src/main/java/com/final_project/blog_service/dto/HeadingBlockDTO.java`

```java
package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Heading Block - Section headers
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Heading Block",
        description = "Section heading (h1-h6)",
        example = "{\"type\": \"heading\", \"data\": {\"level\": 2, \"text\": \"Section Title\"}}"
)
public class HeadingBlockDTO extends ContentBlockDTO {

    @NotNull(message = "Heading level is required")
    @Min(value = 1, message = "Heading level must be 1-6")
    @Max(value = 6, message = "Heading level must be 1-6")
    @Schema(
            title = "Heading Level",
            description = "h1 to h6",
            example = "2",
            minimum = "1",
            maximum = "6"
    )
    private Integer level;

    @NotBlank(message = "Heading text is required")
    @Size(max = 500, message = "Heading must not exceed 500 characters")
    @Schema(
            title = "Heading Text",
            example = "Section Title"
    )
    private String text;

    public HeadingBlockDTO(String type, Integer level, String text) {
        this.type = type;
        this.level = level;
        this.text = text;
    }
}
```

## `src/main/java/com/final_project/blog_service/dto/ImageBlockDTO.java`

```java
package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Image Block - Images with metadata
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Image Block",
        description = "Image content with metadata",
        example = "{\"type\": \"image\", \"data\": {\"fileId\": \"image_123\", \"fileUrl\": \"https://cdn.../image.jpg\", \"alt\": \"Description\"}}"
)
public class ImageBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "File ID is required")
    @Schema(
            title = "File ID",
            description = "ID returned from file upload endpoint",
            example = "image_12345"
    )
    private String fileId;

    @NotBlank(message = "File URL is required")
    @Schema(
            title = "File URL",
            description = "CDN URL from file upload response",
            example = "https://cdn.example.com/files/image_12345.jpg"
    )
    private String fileUrl;

    @Size(max = 500, message = "Alt text must not exceed 500 characters")
    @Schema(
            title = "Alt Text",
            description = "Alternative text for accessibility",
            example = "Article cover image"
    )
    private String alt;

    @Size(max = 1000, message = "Caption must not exceed 1000 characters")
    @Schema(
            title = "Caption",
            description = "Image caption",
            example = "Figure 1: Example image"
    )
    private String caption;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to thumbnail version",
            example = "https://cdn.example.com/files/image_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Min(value = 1, message = "Width must be positive")
    @Schema(
            title = "Width",
            description = "Image width in pixels",
            example = "1920",
            minimum = "1"
    )
    private Integer width;

    @Min(value = 1, message = "Height must be positive")
    @Schema(
            title = "Height",
            description = "Image height in pixels",
            example = "1080",
            minimum = "1"
    )
    private Integer height;

    public ImageBlockDTO(String type, String fileId, String fileUrl, String alt) {
        this.type = type;
        this.fileId = fileId;
        this.fileUrl = fileUrl;
        this.alt = alt;
    }
}
```

## `src/main/java/com/final_project/blog_service/dto/QuoteBlockDTO.java`

```java
package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Quote Block - Quoted text with attribution
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Quote Block",
        description = "Quoted text with optional attribution",
        example = "{\"type\": \"quote\", \"data\": {\"text\": \"Life is 10% what happens and 90% how you react\", \"attribution\": \"Charles Swindoll\"}}"
)
public class QuoteBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "Quote text is required")
    @Size(max = 2000, message = "Quote must not exceed 2000 characters")
    @Schema(
            title = "Quote Text",
            example = "Life is 10% what happens to you and 90% how you react to it"
    )
    private String text;

    @Size(max = 500, message = "Attribution must not exceed 500 characters")
    @Schema(
            title = "Attribution",
            description = "Quote author or source",
            example = "Charles R. Swindoll"
    )
    private String attribution;

    public QuoteBlockDTO(String type, String text, String attribution) {
        this.type = type;
        this.text = text;
        this.attribution = attribution;
    }
}
```

## `src/main/java/com/final_project/blog_service/dto/request/ArticleBlockRequest.java`

```java
package com.final_project.blog_service.dto.request;

import com.final_project.blog_service.dto.ArticleBlockType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Flexible article content block")
public class ArticleBlockRequest {
    @NotNull
    @Schema(
            description = "Block type",
            example = "TEXT",
            allowableValues = {"TEXT", "HEADING", "IMAGE", "VIDEO", "CODE", "QUOTE", "EMBED", "DIVIDER"}
    )
    private ArticleBlockType type;

    @PositiveOrZero
    @Schema(description = "Block order in article", example = "0")
    private Integer order;

    @NotNull
    @Schema(description = "Flexible block payload. Required fields depend on block type.")
    private Map<String, Object> data;
}
```

## `src/main/java/com/final_project/blog_service/dto/request/ContentBlockRequest.java`

```java
package com.final_project.blog_service.dto.request;


import com.fasterxml.jackson.databind.JsonNode;
import com.final_project.blog_service.dto.ArticleBlockType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Content Block Request",
        description = "A single content block (text, image, video, code, quote, embed, etc.)",
        example = "{\"type\": \"text\", \"data\": {\"text\": \"Your content here\"}}"
)
public class ContentBlockRequest {

    @NotBlank(message = "Block type is required")
    @Pattern(
            regexp = "^(text|heading|image|video|code|quote|embed|divider)$",
            message = "Block type must be one of: text, heading, image, video, code, quote, embed, divider"
    )
    @Schema(
            title = "Block Type",
            description = "The type of content block",
            example = "text",
            allowableValues = {"text", "heading", "image", "video", "code", "quote", "embed", "divider"},
            type = "string"
    )
    private ArticleBlockType type;

    @Schema(
            title = "Block Data",
            description = "Block-specific data structure (varies by type)",
            example = "{\"text\": \"This is a text block\"}"
    )
    private JsonNode data;
}
```

## `src/main/java/com/final_project/blog_service/dto/request/CreateArticleRequest.java`

```java
package com.final_project.blog_service.dto.request;

import com.final_project.blog_service.model.ArticleVisiblity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Create Article Request",
        description = "Request body for creating a new blog article",
        example = "{\"title\": \"My First Blog Post\", \"subtitle\": \"An exciting journey\", \"blocks\": [...], \"category\": \"Technology\", \"tags\": [\"javascript\", \"web-dev\"], \"description\": \"A comprehensive guide\"}"
)
public class CreateArticleRequest {

    @NotBlank
    @Size(max = 180)
    @Schema(example = "How to use microservices in university systems")
    private String title;

    @Size(max = 500)
    @Schema(example = "A practical article about Spring Boot microservices.")
    private String description;

    @Builder.Default
    @Valid
    @Schema(description = "Flexible content blocks: text, image, video, code, quote, embed, divider")
    private List<ArticleBlockRequest> blocks = new ArrayList<>();

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private ArticleVisiblity visibility = ArticleVisiblity.PUBLIC;

    @Schema(description = "Optional cover image file id from file-service")
    private String coverImageFileId;

    @Schema(description = "Optional cover image URL returned by file-service")
    private String coverImageUrl;

}
```

## `src/main/java/com/final_project/blog_service/dto/request/CreateArticleWithFilesRequest.java`

```java
package com.final_project.blog_service.dto.request;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

/**
 * Create Article with Files Request
 *
 * Supports flexible content blocks including images and videos
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Create Article with Files Request",
        description = "Request to create article with flexible content blocks (text, images, videos, etc.)",
        example = """
        {
          "title": "My Article with Images",
          "subtitle": "A complete guide",
          "blocks": [
            {
              "type": "heading",
              "level": 2,
              "text": "Introduction"
            },
            {
              "type": "text",
              "text": "This is an introduction paragraph"
            },
            {
              "type": "image",
              "fileId": "image_12345",
              "fileUrl": "https://cdn.example.com/files/image_12345.jpg",
              "alt": "Screenshot",
              "caption": "Figure 1"
            },
            {
              "type": "code",
              "language": "javascript",
              "code": "const x = 1;"
            },
            {
              "type": "video",
              "fileId": "video_12345",
              "fileUrl": "https://cdn.example.com/files/video_12345.mp4",
              "duration": 120
            }
          ],
          "category": "Technology",
          "tags": ["javascript", "tutorial"]
        }
        """
)
public class CreateArticleWithFilesRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    @Schema(
            title = "Article Title",
            example = "My Article with Images and Videos"
    )
    private String title;

    @Size(max = 500, message = "Subtitle must not exceed 500 characters")
    @Schema(
            title = "Article Subtitle",
            example = "A comprehensive guide with rich media"
    )
    private String subtitle;

    @NotEmpty(message = "Article must have at least one content block")
    @Valid
    @Schema(
            title = "Content Blocks",
            description = "Flexible array of content blocks (text, images, videos, code, quotes, embeds, etc.)",
            type = "array"
    )
    private List<FlexibleContentBlockRequest> blocks;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    @Schema(
            title = "Category",
            example = "Technology"
    )
    private String category;

    @Schema(
            title = "Tags",
            example = "[\"javascript\", \"tutorial\", \"web-development\"]"
    )
    private List<String> tags;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    @Schema(
            title = "Description",
            example = "SEO meta description for the article"
    )
    private String description;

    @Schema(
            title = "Cover Image URL",
            description = "URL to cover image from file upload",
            example = "https://cdn.example.com/files/cover_12345.jpg"
    )
    private String coverImageUrl;
}
```

## `src/main/java/com/final_project/blog_service/dto/request/CreateCommentRequest.java`

```java
package com.final_project.blog_service.dto.request;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Create Comment Request",
        description = "Request to post a comment on an article"
)
public class CreateCommentRequest {

    @NotBlank(message = "Comment body is required")
    @Size(min = 1, max = 5000, message = "Comment must be between 1 and 5000 characters")
    @Schema(
            title = "Comment Body",
            description = "The text content of the comment",
            example = "Great article! Very informative.",
            minLength = 1,
            maxLength = 5000
    )
    private String body;
}
```

## `src/main/java/com/final_project/blog_service/dto/request/FlexibleContentBlockRequest.java`

```java
package com.final_project.blog_service.dto.request;
import com.final_project.blog_service.dto.ArticleBlockType;
import jakarta.validation.constraints.*;
import lombok.*;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Flexible Content Block Request
 *
 * Polymorphic JSON structure supporting multiple block types
 * Each block type has specific required/optional fields
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Flexible Content Block",
        description = "Flexible content block supporting multiple types with block-specific data"
)
public class FlexibleContentBlockRequest {
    @NotBlank(message = "Block type is required")
    @Pattern(
            regexp = "^(text|heading|image|video|code|quote|embed|divider)$",
            message = "Block type must be: text, heading, image, video, code, quote, embed, or divider"
    )
    @Schema(
            title = "Block Type",
            description = "Type of content block",
            example = "text",
            allowableValues = {"text", "heading", "image", "video", "code", "quote", "embed", "divider"}
    )
    private ArticleBlockType type;

    // Text Block Fields
    @Schema(
            title = "Text Content (for text blocks)",
            example = "Paragraph content"
    )
    private String text;

    // Heading Block Fields
    @Schema(
            title = "Heading Level (for heading blocks)",
            example = "2",
            minimum = "1",
            maximum = "6"
    )
    private Integer level;

    // Image Block Fields
    @Schema(
            title = "File ID (for image/video blocks)",
            description = "ID returned from file upload endpoint",
            example = "image_12345"
    )
    private String fileId;

    @Schema(
            title = "File URL (for image/video blocks)",
            description = "CDN URL from file upload response",
            example = "https://cdn.example.com/files/image_12345.jpg"
    )
    private String fileUrl;

    @Schema(
            title = "Alternative Text (for image blocks)",
            example = "Image description"
    )
    private String alt;

    @Schema(
            title = "Caption (for image/video blocks)",
            example = "Figure 1: Example"
    )
    private String caption;

    @Schema(
            title = "Thumbnail URL",
            example = "https://cdn.example.com/files/image_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Schema(
            title = "Width (for image blocks)",
            example = "1920"
    )
    private Integer width;

    @Schema(
            title = "Height (for image blocks)",
            example = "1080"
    )
    private Integer height;

    @Schema(
            title = "Duration (for video blocks, in seconds)",
            example = "120"
    )
    private Integer duration;

    @Schema(
            title = "Title (for video/embed blocks)",
            example = "Tutorial"
    )
    private String title;

    @Schema(
            title = "Description (for video blocks)",
            example = "A tutorial on..."
    )
    private String description;

    // Code Block Fields
    @Schema(
            title = "Code Content (for code blocks)",
            example = "const x = 1;"
    )
    private String code;

    @Schema(
            title = "Programming Language (for code blocks)",
            example = "javascript",
            allowableValues = {
                    "javascript", "python", "java", "cpp", "csharp", "go", "rust",
                    "ruby", "php", "swift", "kotlin", "typescript", "sql", "html",
                    "css", "bash", "shell", "plaintext"
            }
    )
    private String language;

    @Schema(
            title = "Show Line Numbers (for code blocks)",
            example = "true"
    )
    private Boolean showLineNumbers;

    // Quote Block Fields
    @Schema(
            title = "Attribution (for quote blocks)",
            example = "Steve Jobs"
    )
    private String attribution;

    // Embed Block Fields
    @Schema(
            title = "Provider (for embed blocks)",
            example = "youtube",
            allowableValues = {"youtube", "twitter", "vimeo", "codepen", "gist", "instagram"}
    )
    private String provider;

    @Schema(
            title = "Embed URL (for embed blocks)",
            example = "https://www.youtube.com/embed/dQw4w9WgXcQ"
    )
    private String embedUrl;
}
```

## `src/main/java/com/final_project/blog_service/dto/request/PublishArticleRequest.java`

```java
package com.final_project.blog_service.dto.request;

import com.final_project.blog_service.model.ArticleVisiblity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Publish Article Request",
        description = "Request to publish an article"
)
public class PublishArticleRequest {

    @NotBlank(message = "Visibility is required")
    @Pattern(
            regexp = "^(PUBLIC|PRIVATE|UNLISTED)$",
            message = "Visibility must be one of: PUBLIC, PRIVATE, UNLISTED"
    )
    @Schema(
            title = "Visibility",
            description = "Who can see this article",
            example = "PUBLIC",
            allowableValues = {"PUBLIC", "PRIVATE", "UNLISTED"}
    )
    private ArticleVisiblity visibility;
}
```

## `src/main/java/com/final_project/blog_service/dto/request/SearchArticleRequest.java`

```java
package com.final_project.blog_service.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Search Article Request",
        description = "Request for full-text search on articles"
)
public class SearchArticleRequest {

    @NotBlank(message = "Search query is required")
    @Schema(
            title = "Query",
            description = "The search query string",
            example = "spring boot mongodb",
            minLength = 1
    )
    private String query;

    @Schema(
            title = "Tags",
            description = "Filter by specific tags",
            example = "[\"java\", \"spring\"]"
    )
    private List<String> tags;

    @Schema(
            title = "Category",
            description = "Filter by category",
            example = "Technology"
    )
    private String category;

    @Min(value = 0, message = "Page must be >= 0")
    @Schema(
            title = "Page",
            description = "Page number (zero-indexed)",
            example = "0",
            minimum = "0"
    )
    private Integer page;

    @Min(value = 1, message = "Page size must be >= 1")
    @Max(value = 100, message = "Page size must be <= 100")
    @Builder.Default
    @Schema(
            title = "Page Size",
            description = "Number of results per page",
            example = "20",
            minimum = "1",
            maximum = "100"
    )
    private Integer pageSize = 20;

    @Pattern(
            regexp = "^(relevance|recent|trending)$",
            message = "Sort by must be one of: relevance, recent, trending"
    )
    @Builder.Default
    @Schema(
            title = "Sort By",
            description = "Sort order for results",
            example = "relevance",
            allowableValues = {"relevance", "recent", "trending"}
    )
    private String sortBy = "relevance";
}
```

## `src/main/java/com/final_project/blog_service/dto/request/UpdateArticleRequest.java`

```java
package com.final_project.blog_service.dto.request;
import com.final_project.blog_service.model.ArticleVisiblity;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Update Article Request",
        description = "Request body for updating an existing blog article"
)
public class UpdateArticleRequest {

    @Size(max = 180)
    private String title;

    @Size(max = 500)
    private String description;

    @Valid
    private List<ArticleBlockRequest> blocks;

    private List<String> tags;

    private ArticleVisiblity visibility;

    private String coverImageFileId;

    private String coverImageUrl;
}


/**
 * ============= RESPONSE DTOs =============
 */









/**
 * ============= COMMENT DTOs =============
 */






/**
 * ============= ENGAGEMENT DTOs =============
 */




/**
 * ============= PAGINATION RESPONSE =============
 */


/**
 * ============= SEARCH DTOs =============
 */


/**
 * ============= ERROR RESPONSE =============
 */



/**
 * ============= SUCCESS RESPONSE =============
 */
```

## `src/main/java/com/final_project/blog_service/dto/response/ArticleBlockResponse.java`

```java
package com.final_project.blog_service.dto.response;

import com.final_project.blog_service.dto.ArticleBlockType;

import java.util.Map;

public class ArticleBlockResponse {
    private ArticleBlockType type;
    private Integer order;
    private Map<String, Object> data;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/ArticlePreviewResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Article Preview Response",
        description = "Summary view of an article for lists and feeds"
)
public class ArticlePreviewResponse {

    @Schema(
            title = "Article ID",
            example = "6507a1b2c3d4e5f6g7h8i9j0"
    )
    private String id;
    @Schema(
            title = "Article Slug",
            example = "my-first-blog-post"
    )
    private String slug;
    @Schema(
            title = "Article Title",
            example = "My First Blog Post"
    )
    private String title;
    @Schema(
            title = "Article Subtitle",
            example = "An exciting journey"
    )
    private String subtitle;
    @Schema(
            title = "Cover Image URL",
            example = "https://cdn.example.com/cover.jpg"
    )
    private String coverImageUrl;
    @Schema(
            title = "Article Description",
            description = "Short description or excerpt"
    )
    private String description;
    @Schema(
            title = "Article Statistics",
            description = "Engagement metrics"
    )
    private StatsResponse stats;
    @Schema(
            title = "Article Author",
            description = "Author information"
    )
    private AuthorResponse author;
    @Schema(
            title = "Published Date",
            example = "2024-01-15T10:30:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime publishedAt;
    @Schema(
            title = "Estimated Read Time",
            description = "Minutes to read",
            example = "5"
    )
    private Integer estimatedReadTime;
    @Schema(
            title = "Tags",
            example = "[\"javascript\", \"web-dev\"]"
    )
    private List<String> tags;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/ArticleResponse.java`

```java
package com.final_project.blog_service.dto.response;

import com.final_project.blog_service.model.ArticleStatus;
import com.final_project.blog_service.model.ArticleVisiblity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Article Response",
        description = "Complete article details with content, metadata, and engagement stats"
)
public class ArticleResponse {

    @Schema(
            title = "Article ID",
            description = "Unique identifier for the article (MongoDB ObjectId)",
            example = "6507a1b2c3d4e5f6g7h8i9j0"
    )
    private String id;

    @Schema(
            title = "Article Slug",
            description = "URL-friendly identifier for the article",
            example = "my-first-blog-post",
            pattern = "^[a-z0-9]+(-[a-z0-9]+)*$"
    )
    private String slug;

    @Schema(
            title = "Article Title",
            example = "My First Blog Post"
    )
    private String title;

    @Schema(
            title = "Article Subtitle",
            example = "An exciting journey into blogging"
    )
    private String subtitle;

    @Schema(
            title = "Article Content",
            description = "Structured content blocks"
    )
    private ContentResponse content;

    @Schema(
            title = "Article Metadata",
            description = "Tags, category, SEO information"
    )
    private MetadataResponse metadata;

    @Schema(
            title = "Article Status",
            description = "Current status of the article",
            example = "PUBLISHED",
            allowableValues = {"DRAFT", "PUBLISHED", "ARCHIVED"}
    )
    private ArticleStatus status;

    @Schema(
            title = "Article Visibility",
            description = "Who can access this article",
            example = "PUBLIC",
            allowableValues = {"PUBLIC", "PRIVATE", "UNLISTED"}
    )
    private ArticleVisiblity visibility;

    @Schema(
            title = "Article Statistics",
            description = "Engagement and view statistics"
    )
    private StatsResponse stats;

    @Schema(
            title = "Article Author",
            description = "Author profile information"
    )
    private AuthorResponse author;

    @Schema(
            title = "Published Date",
            description = "When the article was published",
            example = "2024-01-15T10:30:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime publishedAt;

    @Schema(
            title = "Updated Date",
            description = "When the article was last updated",
            example = "2024-01-15T15:45:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime updatedAt;

    @Schema(
            title = "Created Date",
            description = "When the article was created",
            example = "2024-01-15T10:00:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime createdAt;

    @Schema(
            title = "Estimated Read Time",
            description = "Estimated time to read the article in minutes",
            example = "5",
            minimum = "1"
    )
    private Integer estimatedReadTime;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/AuthorResponse.java`

```java
package com.final_project.blog_service.dto.response;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Author Response",
        description = "Author profile information"
)
public class AuthorResponse {

    @Schema(
            title = "Author ID",
            example = "user_123"
    )
    private String id;

    @Schema(
            title = "Author Display Name",
            example = "John Doe"
    )
    private String displayName;

    @Schema(
            title = "Author Profile Image",
            example = "https://cdn.example.com/profiles/john.jpg"
    )
    private String profileImageUrl;

    @Schema(
            title = "Total Articles",
            description = "Number of articles written by this author",
            example = "15"
    )
    private Long totalArticles;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/CommentEngagementResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Comment Engagement Response",
        description = "Engagement metrics for a comment"
)
public class CommentEngagementResponse {

    @Schema(
            title = "Likes",
            description = "Number of likes on this comment",
            example = "5"
    )
    private Long likes;

    @Schema(
            title = "Reply Count",
            description = "Number of replies to this comment",
            example = "2"
    )
    private Long replyCount;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/CommentResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Comment Response",
        description = "Complete comment details"
)
public class CommentResponse {

    @Schema(
            title = "Comment ID",
            example = "comment_123"
    )
    private String id;

    @Schema(
            title = "Article ID",
            description = "The article this comment belongs to",
            example = "article_123"
    )
    private String articleId;

    @Schema(
            title = "Parent Comment ID",
            description = "If this is a reply, the ID of the parent comment",
            example = "comment_122",
            nullable = true
    )
    private String parentCommentId;

    @Schema(
            title = "Comment Body",
            example = "Great article!"
    )
    private String body;

    @Schema(
            title = "Comment Author",
            description = "Author profile information"
    )
    private AuthorResponse author;

    @Schema(
            title = "Comment Engagement",
            description = "Likes and reply count"
    )
    private CommentEngagementResponse engagement;

    @Schema(
            title = "Created At",
            example = "2024-01-15T10:35:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime createdAt;

    @Schema(
            title = "Edited At",
            description = "When the comment was last edited",
            example = "2024-01-15T11:00:00",
            type = "string",
            format = "date-time",
            nullable = true
    )
    private LocalDateTime editedAt;

    @Schema(
            title = "Reply Count",
            description = "Number of direct replies to this comment",
            example = "3"
    )
    private Integer replyCount;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/CommentThreadResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Comment Thread Response",
        description = "A comment with its nested replies (threaded structure)"
)
public class CommentThreadResponse {

    @Schema(
            title = "Comment",
            description = "The main comment"
    )
    private CommentResponse comment;

    @ArraySchema(
            schema = @Schema(implementation = CommentThreadResponse.class),
            arraySchema = @Schema(
                    title = "Replies",
                    description = "Nested replies to this comment"
            )
    )
    private List<CommentThreadResponse> replies;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/ContentBlockResponse.java`

```java
package com.final_project.blog_service.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.final_project.blog_service.dto.ArticleBlockType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Content Block Response",
        description = "A single content block in response"
)
public class ContentBlockResponse {

    @Schema(
            title = "Block Type",
            example = "text"
    )
    private ArticleBlockType type;

    @Schema(
            title = "Block Data",
            example = "{\"text\": \"Content here\"}"
    )
    private JsonNode data;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/ContentResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Content Response",
        description = "Article content with blocks and metadata"
)
public class ContentResponse {

    @ArraySchema(
            schema = @Schema(implementation = ContentBlockResponse.class),
            minItems = 1
    )
    private List<ContentBlockResponse> blocks;

    @Schema(
            title = "Estimated Read Time",
            description = "Time to read in minutes",
            example = "5"
    )
    private Integer estimatedReadTime;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/ErrorResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Error Response",
        description = "Standard error response format"
)
public class ErrorResponse {

    @Schema(
            title = "Error Code",
            description = "Error type/code",
            example = "RESOURCE_NOT_FOUND"
    )
    private String error;

    @Schema(
            title = "Error Message",
            description = "Human-readable error message",
            example = "Article not found with ID: article_123"
    )
    private String message;

    @Schema(
            title = "Timestamp",
            description = "When the error occurred",
            example = "2024-01-15T10:50:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime timestamp;

    @Schema(
            title = "Request Path",
            description = "The API path that caused the error",
            example = "/api/v1/articles/article_123"
    )
    private String path;

    @Schema(
            title = "HTTP Status Code",
            description = "HTTP status code",
            example = "404"
    )
    private Integer status;

    @Schema(
            title = "Details",
            description = "Additional error details (for validation errors)",
            example = "{\"title\": \"Title is required\"}",
            nullable = true
    )
    private Object details;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/FileCdnUrlResponse.java`

```java
package com.final_project.blog_service.dto.response;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * File CDN URL Response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Schema(
        title = "File CDN URL Response",
        description = "CDN URL and metadata for a file"
)
public class FileCdnUrlResponse {

    @Schema(title = "File ID")
    private String fileId;

    @Schema(
            title = "CDN URL",
            description = "Public CDN URL to access the file"
    )
    private String cdnUrl;

    @Schema(
            title = "Thumbnail URL",
            description = "Thumbnail URL (if available)"
    )
    private String thumbnailUrl;

    @Schema(
            title = "URL Expiration",
            description = "When the URL expires (if applicable)",
            example = "2024-01-15T10:30:00"
    )
    private LocalDateTime expiresAt;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/FileMetadataResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Schema(
        title = "File Metadata Response",
        description = "Metadata information about a file"
)
public class FileMetadataResponse {

    @Schema(title = "File ID")
    private String fileId;

    @Schema(title = "Original Filename")
    private String originalFilename;

    @Schema(title = "File Size")
    private Long fileSize;

    @Schema(title = "MIME Type")
    private String mimeType;

    @Schema(title = "CDN URL")
    private String cdnUrl;

    @Schema(title = "Thumbnail URL")
    private String thumbnailUrl;

    @Schema(title = "Upload Timestamp")
    private LocalDateTime uploadedAt;

    @Schema(title = "Image Width")
    private Integer imageWidth;

    @Schema(title = "Image Height")
    private Integer imageHeight;

    @Schema(title = "Video Duration")
    private Integer videoDurationSeconds;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/FileUploadResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

/**
 * File Upload Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Schema(
        title = "File Upload Response",
        description = "Response after successfully uploading a file"
)
public class FileUploadResponse {

    @Schema(
            title = "File ID",
            description = "Unique identifier for the uploaded file",
            example = "file_12345"
    )
    private String fileId;

    @Schema(
            title = "Original Filename",
            example = "article-cover.jpg"
    )
    private String originalFilename;

    @Schema(
            title = "File Size",
            description = "Size in bytes",
            example = "2048576"
    )
    private Long fileSize;

    @Schema(
            title = "MIME Type",
            example = "image/jpeg"
    )
    private String mimeType;

    @Schema(
            title = "CDN URL",
            description = "Public CDN URL to access the file",
            example = "https://cdn.example.com/files/file_12345.jpg"
    )
    private String cdnUrl;

    @Schema(
            title = "File Type",
            description = "Type of file: image, video, document",
            example = "image",
            allowableValues = {"image", "video", "document"}
    )
    private String fileType;

    @Schema(
            title = "Upload Timestamp",
            example = "2024-01-15T10:30:00"
    )
    private LocalDateTime uploadedAt;

    // For images
    @Schema(
            title = "Image Width",
            description = "Only for image files",
            example = "1920"
    )
    private Integer imageWidth;

    @Schema(
            title = "Image Height",
            description = "Only for image files",
            example = "1080"
    )
    private Integer imageHeight;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to thumbnail image (if available)",
            example = "https://cdn.example.com/files/file_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    // For videos
    @Schema(
            title = "Video Duration",
            description = "Duration in seconds (only for video files)",
            example = "120"
    )
    private Integer videoDurationSeconds;

    @Schema(
            title = "Processing Status",
            description = "Video processing status",
            example = "COMPLETED",
            allowableValues = {"PENDING", "PROCESSING", "COMPLETED", "FAILED"}
    )
    private String processingStatus;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/ImageUploadResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Image Upload Response",
        description = "Response after uploading an image"
)
public class ImageUploadResponse {

    @Schema(
            title = "File ID",
            description = "Unique identifier for the image",
            example = "image_12345"
    )
    private String fileId;

    @Schema(
            title = "File URL",
            description = "CDN URL to access the image",
            example = "https://cdn.example.com/files/image_12345.jpg"
    )
    private String fileUrl;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to thumbnail version",
            example = "https://cdn.example.com/files/image_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Schema(
            title = "Width",
            description = "Image width in pixels",
            example = "1920"
    )
    private Integer width;

    @Schema(
            title = "Height",
            description = "Image height in pixels",
            example = "1080"
    )
    private Integer height;

    @Schema(
            title = "Alt Text",
            description = "Alternative text for accessibility",
            example = "Article cover image"
    )
    private String alt;

    @Schema(
            title = "Caption",
            description = "Image caption"
    )
    private String caption;

    @Schema(
            title = "MIME Type",
            example = "image/jpeg"
    )
    private String mimeType;

    @Schema(
            title = "File Size",
            description = "Size in bytes",
            example = "2048576"
    )
    private Long fileSize;

    @Schema(
            title = "Uploaded At",
            example = "2024-01-15T10:30:00"
    )
    private LocalDateTime uploadedAt;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/LikeResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Like Response",
        description = "Response after liking an article"
)
public class LikeResponse {

    @Schema(
            title = "Like ID",
            example = "like_123"
    )
    private String id;

    @Schema(
            title = "User ID",
            description = "Who liked the article",
            example = "user_123"
    )
    private String userId;

    @Schema(
            title = "Article ID",
            description = "Which article was liked",
            example = "article_123"
    )
    private String articleId;

    @Schema(
            title = "Created At",
            example = "2024-01-15T10:40:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime createdAt;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/MetadataResponse.java`

```java
package com.final_project.blog_service.dto.response;


import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Metadata Response",
        description = "Article metadata including tags, category, and SEO info"
)
public class MetadataResponse {

    @ArraySchema(
            schema = @Schema(
                    title = "Tag",
                    example = "javascript",
                    type = "string"
            )
    )
    private List<String> tags;

    @Schema(
            title = "Category",
            example = "Technology"
    )
    private String category;

    @Schema(
            title = "Description",
            description = "SEO meta description"
    )
    private String description;

    @ArraySchema(
            schema = @Schema(
                    title = "Keyword",
                    example = "spring-boot",
                    type = "string"
            )
    )
    private List<String> keywords;

    @Schema(
            title = "Cover Image URL",
            example = "https://cdn.example.com/cover.jpg"
    )
    private String coverImageUrl;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/PaginatedResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Paginated Response",
        description = "Generic paginated response wrapper"
)
public class PaginatedResponse<T> {

    @ArraySchema(
            schema = @Schema(implementation = Object.class),
            arraySchema = @Schema(
                    title = "Data",
                    description = "Array of items on this page"
            )
    )
    private List<T> data;

    @Schema(
            title = "Pagination",
            description = "Pagination metadata"
    )
    private PaginationMetadata pagination;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @Schema(
            title = "Pagination Metadata",
            description = "Metadata about pagination"
    )
    public static class PaginationMetadata {

        @Schema(
                title = "Current Page",
                description = "Zero-indexed page number",
                example = "0"
        )
        private Integer page;

        @Schema(
                title = "Page Size",
                description = "Number of items per page",
                example = "20"
        )
        private Integer pageSize;

        @Schema(
                title = "Total Count",
                description = "Total number of items across all pages",
                example = "150"
        )
        private Long totalCount;

        @Schema(
                title = "Total Pages",
                description = "Total number of pages",
                example = "8"
        )
        private Integer totalPages;

        @Schema(
                title = "Has Next",
                description = "Whether there are more pages",
                example = "true"
        )
        private Boolean hasNext;

        @Schema(
                title = "Has Previous",
                description = "Whether there are previous pages",
                example = "false"
        )
        private Boolean hasPrevious;

        @Schema(
                title = "Next Cursor",
                description = "Cursor for next page (if using cursor pagination)",
                example = "article_150",
                nullable = true
        )
        private String nextCursor;

        @Schema(
                title = "Previous Cursor",
                description = "Cursor for previous page",
                example = "article_20",
                nullable = true
        )
        private String previousCursor;
    }
}
```

## `src/main/java/com/final_project/blog_service/dto/response/ShareRequest.java`

```java
package com.final_project.blog_service.dto.response;

import com.final_project.blog_service.model.SharedPlatform;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Share Request",
        description = "Request to track sharing of an article"
)
public class ShareRequest {

    @NotBlank(message = "Platform is required")
    @Pattern(
            regexp = "^(TWITTER|FACEBOOK|LINKEDIN|COPY_LINK|EMAIL)$",
            message = "Platform must be one of: TWITTER, FACEBOOK, LINKEDIN, COPY_LINK, EMAIL"
    )
    @Schema(
            title = "Platform",
            description = "The platform where the article was shared",
            example = "TWITTER",
            allowableValues = {"TWITTER", "FACEBOOK", "LINKEDIN", "COPY_LINK", "EMAIL"}
    )
    private SharedPlatform platform;

    @Size(max = 500, message = "Custom message must not exceed 500 characters")
    @Schema(
            title = "Custom Message",
            description = "Optional custom message when sharing",
            example = "Check out this amazing article!",
            maxLength = 500
    )
    private String customMessage;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/ShareResponse.java`

```java
package com.final_project.blog_service.dto.response;


import com.final_project.blog_service.model.SharedPlatform;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Share Response",
        description = "Response after sharing an article"
)
public class ShareResponse {

    @Schema(
            title = "Share ID",
            example = "share_123"
    )
    private String id;

    @Schema(
            title = "User ID",
            description = "Who shared the article",
            example = "user_123"
    )
    private String userId;

    @Schema(
            title = "Article ID",
            description = "Which article was shared",
            example = "article_123"
    )
    private String articleId;

    @Schema(
            title = "Platform",
            example = "TWITTER"
    )
    private SharedPlatform platform;

    @Schema(
            title = "Created At",
            example = "2024-01-15T10:45:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime createdAt;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/StatsResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Statistics Response",
        description = "Engagement and view statistics for an article"
)
public class StatsResponse {

    @Schema(
            title = "Views",
            description = "Total page views",
            example = "234",
            minimum = "0"
    )
    private Long views;

    @Schema(
            title = "Reads",
            description = "Engaged reads (2+ minutes on page)",
            example = "189",
            minimum = "0"
    )
    private Long reads;

    @Schema(
            title = "Likes",
            description = "Number of likes/hearts",
            example = "45",
            minimum = "0"
    )
    private Long likes;

    @Schema(
            title = "Comment Count",
            description = "Total number of comments",
            example = "12",
            minimum = "0"
    )
    private Long commentCount;

    @Schema(
            title = "Share Count",
            description = "Total shares across all platforms",
            example = "8",
            minimum = "0"
    )
    private Long shareCount;

    @Schema(
            title = "Last Engaged At",
            description = "Timestamp of last engagement (like, comment, share)",
            example = "2024-01-15T15:45:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime lastEngagedAt;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/SuccessResponse.java`

```java
package com.final_project.blog_service.dto.response;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Success Response",
        description = "Generic success response wrapper"
)
public class SuccessResponse<T> {

    @Schema(
            title = "Status",
            description = "Response status",
            example = "success"
    )
    private String status;

    @Schema(
            title = "Message",
            description = "Optional success message",
            example = "Article created successfully"
    )
    private String message;

    @Schema(
            title = "Data",
            description = "Response data"
    )
    private T data;

    @Schema(
            title = "Timestamp",
            example = "2024-01-15T10:30:00",
            type = "string",
            format = "date-time"
    )
    private LocalDateTime timestamp;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/UserAuthorResponse.java`

```java
package com.final_project.blog_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class UserAuthorResponse  {
    private String id;
    private String userName;
    private String email;
    private String profile;
    private String entityId;
    private String userType;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/UserExistsResponse.java`

```java
package com.final_project.blog_service.dto.response;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserExistsResponse {
    private String userId;
    private boolean exists;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/UserPreferencesResponse.java`

```java
package com.final_project.blog_service.dto.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferencesResponse {
    private String userId;
    private Boolean emailNotifications;
    private Boolean allowComments;
    private String defaultPublishStatus;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/UserProfileResponse.java`

```java
package com.final_project.blog_service.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public  class UserProfileResponse {
    private String id;
    private String username;
    private String email;
    private String displayName;
    private String profileImageUrl;
    private String bio;
    private Long totalArticles;
    private LocalDateTime createdAt;
}
```

## `src/main/java/com/final_project/blog_service/dto/response/VideoUploadResponse.java`

```java
package com.final_project.blog_service.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(
        title = "Video Upload Response",
        description = "Response after uploading a video"
)
public class VideoUploadResponse {

    @Schema(
            title = "File ID",
            example = "video_12345"
    )
    private String fileId;

    @Schema(
            title = "File URL",
            description = "CDN URL to access the video",
            example = "https://cdn.example.com/files/video_12345.mp4"
    )
    private String fileUrl;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to video thumbnail",
            example = "https://cdn.example.com/files/video_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Schema(
            title = "Duration",
            description = "Video duration in seconds",
            example = "120"
    )
    private Integer duration;

    @Schema(
            title = "Title",
            description = "Video title"
    )
    private String title;

    @Schema(
            title = "Description",
            description = "Video description"
    )
    private String description;

    @Schema(
            title = "MIME Type",
            example = "video/mp4"
    )
    private String mimeType;

    @Schema(
            title = "File Size",
            description = "Size in bytes",
            example = "52428800"
    )
    private Long fileSize;

    @Schema(
            title = "Processing Status",
            description = "Video processing status",
            example = "PROCESSING",
            allowableValues = {"PENDING", "PROCESSING", "COMPLETED", "FAILED"}
    )
    private String processingStatus;

    @Schema(
            title = "Uploaded At",
            example = "2024-01-15T10:30:00"
    )
    private LocalDateTime uploadedAt;
}
```

## `src/main/java/com/final_project/blog_service/dto/TextBlockDTO.java`

```java
package com.final_project.blog_service.dto;


import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;


/**
 * Text Block - Simple text content
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Text Block",
        description = "Rich text content block",
        example = "{\"type\": \"text\", \"data\": {\"text\": \"Paragraph text here\"}}"
)
public class TextBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "Text content is required")
    @Size(max = 10000, message = "Text must not exceed 10000 characters")
    @Schema(
            title = "Text Content",
            description = "The text content",
            example = "This is a paragraph of article content"
    )
    private String text;

    public TextBlockDTO(String type, String text) {
        this.type = type;
        this.text = text;
    }
}





```

## `src/main/java/com/final_project/blog_service/dto/UserDTO.java`

```java
package com.final_project.blog_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Data Transfer Objects for User API endpoints.
 */

/**
 * UserDTO - Response DTO for user information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User information response")
public class UserDTO {

    @JsonProperty("id")
    @Schema(description = "User unique identifier", example = "550e8400-e29b-41d4-a716-446655440000")
    private String id;

    @JsonProperty("user_name")
    @Schema(description = "User username", example = "john.doe")
    private String username;

    @JsonProperty("email")
    @Schema(description = "User email address", example = "john.doe@example.com")
    private String email;

    @JsonProperty("first_name")
    @Schema(description = "User first name", example = "John")
    private String firstName;

    @JsonProperty("last_name")
    @Schema(description = "User last name", example = "Doe")
    private String lastName;

    @JsonProperty("phone_number")
    @Schema(description = "User phone number", example = "+1234567890")
    private String phoneNumber;

    @JsonProperty("status")
    @Schema(description = "User account status", example = "ACTIVE")
    private String status;

    @JsonProperty("email_verified")
    @Schema(description = "Whether email is verified", example = "true")
    private Boolean emailVerified;

    @JsonProperty("two_factor_enabled")
    @Schema(description = "Whether two-factor authentication is enabled", example = "false")
    private Boolean twoFactorEnabled;

    @JsonProperty("roles")
    @Schema(description = "Realm roles")
    private Set<String> roles;


}

```

## `src/main/java/com/final_project/blog_service/dto/VideoBlockDTO.java`

```java
package com.final_project.blog_service.dto;


import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Video Block - Videos with metadata
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Schema(
        title = "Video Block",
        description = "Video content with metadata",
        example = "{\"type\": \"video\", \"data\": {\"fileId\": \"video_123\", \"fileUrl\": \"https://cdn.../video.mp4\", \"duration\": 120}}"
)
public class VideoBlockDTO extends ContentBlockDTO {

    @NotBlank(message = "File ID is required")
    @Schema(
            title = "File ID",
            description = "ID returned from file upload endpoint",
            example = "video_12345"
    )
    private String fileId;

    @NotBlank(message = "File URL is required")
    @Schema(
            title = "File URL",
            description = "CDN URL from file upload response",
            example = "https://cdn.example.com/files/video_12345.mp4"
    )
    private String fileUrl;

    @Schema(
            title = "Thumbnail URL",
            description = "URL to video thumbnail",
            example = "https://cdn.example.com/files/video_12345_thumb.jpg"
    )
    private String thumbnailUrl;

    @Min(value = 1, message = "Duration must be positive")
    @Schema(
            title = "Duration",
            description = "Video duration in seconds",
            example = "120",
            minimum = "1"
    )
    private Integer duration;

    @Size(max = 500, message = "Title must not exceed 500 characters")
    @Schema(
            title = "Title",
            description = "Video title",
            example = "Tutorial video"
    )
    private String title;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    @Schema(
            title = "Description",
            description = "Video description",
            example = "A tutorial on how to do something"
    )
    private String description;

    public VideoBlockDTO(String type, String fileId, String fileUrl, Integer duration) {
        super();
        this.type = type;
        this.fileId = fileId;
        this.fileUrl = fileUrl;
        this.duration = duration;
    }
}

```

## `src/main/java/com/final_project/blog_service/exception/FileNotFound.java`

```java
package com.final_project.blog_service.exception;

public class FileNotFound extends RuntimeException {
    public FileNotFound(String message) {
        super(message);
    }
}
```

## `src/main/java/com/final_project/blog_service/exception/FileServiceException.java`

```java
package com.final_project.blog_service.exception;

public class FileServiceException extends RuntimeException {
    public FileServiceException(String message) {
        super(message);
    }

    public FileServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## `src/main/java/com/final_project/blog_service/exception/FileUploadException.java`

```java
package com.final_project.blog_service.exception;

public class FileUploadException extends RuntimeException {
    public FileUploadException(String message) {
        super(message);
    }

    public FileUploadException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## `src/main/java/com/final_project/blog_service/exception/GlobalExceptionHandler.java`

```java
package com.final_project.blog_service.exception;


import com.final_project.blog_service.dto.response.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex,
            WebRequest request
    ) {
        log.warn("Resource not found: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .error("RESOURCE_NOT_FOUND")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(
            UnauthorizedException ex,
            WebRequest request
    ) {
        log.warn("Unauthorized access: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .error("UNAUTHORIZED")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex,
            WebRequest request
    ) {
        log.warn("Invalid state: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .error("INVALID_STATE")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex,
            WebRequest request
    ) {
        log.warn("Validation error: {}", ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("error", "VALIDATION_ERROR");
        response.put("message", "Validation failed");
        response.put("errors", errors);
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex,
            WebRequest request
    ) {
        log.error("Unexpected error: ", ex);

        ErrorResponse error = ErrorResponse.builder()
                .error("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred")
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

## `src/main/java/com/final_project/blog_service/exception/ResourceNotFoundException.java`

```java
package com.final_project.blog_service.exception;


public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## `src/main/java/com/final_project/blog_service/exception/UnauthorizedException.java`

```java
package com.final_project.blog_service.exception;

public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## `src/main/java/com/final_project/blog_service/exception/UserNotFoundException.java`

```java
package com.final_project.blog_service.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## `src/main/java/com/final_project/blog_service/exception/UserServiceException.java`

```java
package com.final_project.blog_service.exception;

public class UserServiceException extends RuntimeException {
    public UserServiceException(String message) {
        super(message);
    }

    public UserServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## `src/main/java/com/final_project/blog_service/exception/UserServiceUnavailableException.java`

```java
package com.final_project.blog_service.exception;

public class UserServiceUnavailableException extends RuntimeException {
    public UserServiceUnavailableException(String message) {
        super(message);
    }

    public UserServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## `src/main/java/com/final_project/blog_service/model/Article.java`

```java
package com.final_project.blog_service.model;


import com.final_project.blog_service.dto.ContentBlock;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "articles")
@CompoundIndexes({
        @CompoundIndex(name = "author_published_idx", def = "{'authorId': 1, 'publishedAt': -1}"),
        @CompoundIndex(name = "status_published_idx", def = "{'status': 1, 'publishedAt': -1}"),
        @CompoundIndex(name = "tags_published_idx", def = "{'metadata.tags': 1, 'publishedAt': -1}")
})
public class Article {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;  // URL-friendly identifier

    @Indexed
    private String authorId;

    private String title;

    private String subtitle;

    private Content content;

    private Metadata metadata;

    @Builder.Default
    private ArticleStatus status = ArticleStatus.PUBLISHED;

    @Builder.Default
    private ArticleVisiblity visibility = ArticleVisiblity.PUBLIC;

    private Stats stats;

    private Seo seo;

    @Builder.Default
    private List<EditHistory> editHistory = new ArrayList<>();

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;

    private LocalDateTime archivedAt;

    private String coverImageFileId;
    private String coverImageUrl;

    /**
     * Flexible content block structure
     * Supports: text, heading, image, video, code, quote, embed, divider
     */
    /**
     * Block type definitions for reference:
     *
     * TEXT:
     * { type: "text", data: { text: "Your text here" } }
     *
     * HEADING:
     * { type: "heading", data: { level: 1, text: "Heading" } }
     *
     * IMAGE:
     * { type: "image", data: {
     *     fileId: "file_123",
     *     fileUrl: "https://cdn.../image.jpg",
     *     alt: "alt text",
     *     caption: "caption",
     *     width: 800, height: 600
     *   } }
     *
     * VIDEO:
     * { type: "video", data: {
     *     fileId: "video_123",
     *     videoUrl: "https://cdn.../video.mp4",
     *     thumbnailUrl: "https://cdn.../thumb.jpg",
     *     duration: 120
     *   } }
     *
     * CODE:
     * { type: "code", data: {
     *     language: "javascript",
     *     code: "const x = 1;",
     *     showLineNumbers: true
     *   } }
     *
     * QUOTE:
     * { type: "quote", data: {
     *     text: "Quote text",
     *     attribution: "Author name"
     *   } }
     *
     * EMBED:
     * { type: "embed", data: {
     *     provider: "youtube|twitter|codepen|gist",
     *     embedUrl: "https://...",
     *     title: "Embed title"
     *   } }
     *
     * DIVIDER:
     * { type: "divider", data: {} }
     */
}
```

## `src/main/java/com/final_project/blog_service/model/ArticleStatus.java`

```java
package com.final_project.blog_service.model;

public enum ArticleStatus {

    DRAFT("DRAFT"), PUBLISHED("PUBLISHED"), ARCHIVED("ARCHIVED");
    private final String status;
    ArticleStatus(String status) {
        this.status = status.toUpperCase();
    }
    public String getStatus() {
        return this.status;
    }
}
```

## `src/main/java/com/final_project/blog_service/model/ArticleVisiblity.java`

```java
package com.final_project.blog_service.model;

public enum ArticleVisiblity {
    PUBLIC("PUBLIC"), PRIVATE("PRIVATE"), UNLISTED("UNLISTED");
    private final String ArticleVisiblity;
    ArticleVisiblity(String ArticleVisiblity) {
        this.ArticleVisiblity = ArticleVisiblity.toUpperCase();
    }

    public String visiblity(){
        return this.ArticleVisiblity;
    }
}
```

## `src/main/java/com/final_project/blog_service/model/Comment.java`

```java
package com.final_project.blog_service.model;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import java.time.LocalDateTime;

/**
 * Comment entity representing blog post comments and replies
 * Supports threaded/nested comments (replies to comments)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "comments")
@CompoundIndexes({
        @CompoundIndex(name = "article_created_idx", def = "{'articleId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "parent_created_idx", def = "{'parentCommentId': 1, 'createdAt': -1}")
})
public class Comment {

    @Id
    private String id;

    @Indexed
    private String articleId;  // the article being commented on

    @Indexed
    private String parentCommentId;  // null for top-level comments, objectId for replies

    @Indexed
    private String authorId;

    private Author author;  // denormalized for quick access

    private String body;

    private Engagement engagement;

    @Builder.Default
    private CommentStatus status = CommentStatus.PUBLISHED;  // PUBLISHED, DELETED

    private LocalDateTime editedAt;

    private LocalDateTime createdAt;

    /**
     * Denormalized author info
     * Updated when user profile changes (async event)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Author {
        private String displayName;
        private String profileImageUrl;
    }

    /**
     * Engagement stats
     * Likes and reply counts for this comment
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Engagement {

        @Builder.Default
        private Long likes = 0L;

        @Builder.Default
        private Long replyCount = 0L;  // number of direct replies to this comment
    }
}
```

## `src/main/java/com/final_project/blog_service/model/CommentStatus.java`

```java
package com.final_project.blog_service.model;

public enum CommentStatus {
    DELETE("DELETE"), PUBLISHED("PUBLISHED"), EDITED("EDITED");
    private final String status;
    CommentStatus( String status){
        this.status = status.toUpperCase();
    }
    public String getStatus(){
        return this.status;
    }
}
```

## `src/main/java/com/final_project/blog_service/model/Content.java`

```java
package com.final_project.blog_service.model;

import com.final_project.blog_service.dto.ContentBlock;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public  class Content {

    @Builder.Default
    private List<ContentBlock> blocks = new ArrayList<>();

    @Builder.Default
    private Integer estimatedReadTime = 1;  // in minutes
}
```

## `src/main/java/com/final_project/blog_service/model/EditHistory.java`

```java
package com.final_project.blog_service.model;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public  class EditHistory {
    private Integer version;
    private LocalDateTime updatedAt;
    private String editorId;
    private String summary;
}
```

## `src/main/java/com/final_project/blog_service/model/Like.java`

```java
package com.final_project.blog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Like entity representing user likes on articles
 * Separate collection for better scalability and independence
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "likes")
@CompoundIndexes({
        @CompoundIndex(name = "user_article_unique_idx", def = "{'userId': 1, 'articleId': 1}", unique = true),
        @CompoundIndex(name = "article_idx", def = "{'articleId': 1, 'createdAt': -1}")
})
public class Like {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String articleId;

    private LocalDateTime createdAt;
}

```

## `src/main/java/com/final_project/blog_service/model/Metadata.java`

```java
package com.final_project.blog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public  class Metadata {

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private String category;

    private String description;  // SEO meta description

    @Builder.Default
    private List<String> keywords = new ArrayList<>();  // SEO keywords

    private String coverImageUrl;  // from file service
}
```

## `src/main/java/com/final_project/blog_service/model/ReadingHistory.java`

```java
package com.final_project.blog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Reading history entity for tracking user engagement
 * Optional - for future features like recommendations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "reading_history")
public class ReadingHistory {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String articleId;

    private LocalDateTime readAt;

    // Time spent reading in seconds
    private Integer timeSpentSeconds;

    // Scroll depth percentage (0-100)
    private Float scrollDepth;

    @Builder.Default
    private Boolean wasRead = false;  // true if spent 2+ minutes
}
```

## `src/main/java/com/final_project/blog_service/model/Seo.java`

```java
package com.final_project.blog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public  class Seo {
    private String publishedUrl;
}
```

## `src/main/java/com/final_project/blog_service/model/Share.java`

```java
package com.final_project.blog_service.model;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Share entity tracking social shares and sharing activity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "shares")
public class Share {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed
    private String articleId;


    private SharedPlatform platform;

    private Metadata metadata;

    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Metadata {
        private String customMessage;  // optional message when sharing
        private LocalDateTime timestamp;
    }
}
```

## `src/main/java/com/final_project/blog_service/model/SharedPlatform.java`

```java
package com.final_project.blog_service.model;

public enum SharedPlatform {
    TWITTER("TWITTER"), FACEBOOK("FACEBOOK"), LINKEDIN("LINKEDIN"), COPY_LINK("COPYLINK"), EMAIL("EMAIL");

    private final String platform;
    SharedPlatform( String platform){
        this.platform = platform.toUpperCase();
    }
    public String getPlatform(){
        return this.platform.toUpperCase();
    }
}
```

## `src/main/java/com/final_project/blog_service/model/Stats.java`

```java
package com.final_project.blog_service.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public  class Stats {

    @Builder.Default
    private Long views = 0L;  // page views

    @Builder.Default
    private Long reads = 0L;  // engaged reads (2+ minutes)

    @Builder.Default
    private Long likes = 0L;

    @Builder.Default
    private Long commentCount = 0L;

    @Builder.Default
    private Long shareCount = 0L;

    private LocalDateTime lastEngagedAt;
}
```

## `src/main/java/com/final_project/blog_service/repo/ArticleRepository.java`

```java
package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.Article;
import com.final_project.blog_service.model.ArticleStatus;
import com.final_project.blog_service.model.ArticleVisiblity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Article Repository - handles article persistence
 */
@Repository
public interface ArticleRepository extends MongoRepository<Article, String> {

    // Find by slug (for URL routing)
    Optional<Article> findBySlug(String slug);

    // Find published articles by author
    Page<Article> findByAuthorIdAndStatusOrderByPublishedAtDesc(
            String authorId,
            ArticleStatus status,
            Pageable pageable
    );

    // Find all published articles (for feed)
    @Query("{ 'status': 'PUBLISHED', 'visibility': 'PUBLIC' }")
    Page<Article> findPublishedArticles(Pageable pageable);

    // Find articles by tags
    Page<Article> findByMetadataTagsInAndStatusAndVisibility(
            List<String> tags,
            ArticleStatus status,
            ArticleVisiblity visibility,
            Pageable pageable
    );

    // Find articles by category
    Page<Article> findByMetadataCategoryAndStatusAndVisibility(
            String category,
            ArticleStatus status,
            ArticleVisiblity visibility,
            Pageable pageable
    );

    // Find articles by author and status
    List<Article> findByAuthorIdAndStatus(String authorId, ArticleStatus status);

    // Count articles by author
    Long countByAuthorIdAndStatus(String authorId, ArticleStatus status);

    // Find articles published after a date
    List<Article> findByPublishedAtAfterAndStatusOrderByPublishedAtDesc(
            LocalDateTime publishedAt,
            ArticleStatus status
    );

    // Delete soft-deleted articles (archives older than 30 days)
    @Query("{ 'status': 'ARCHIVED', 'archivedAt': { $lt: ?0 } }")
    void deleteOldArchives(LocalDateTime threshold);

    Optional<Article> findArticleByIdAndAuthorId(String articleId, String authorId);
}



```

## `src/main/java/com/final_project/blog_service/repo/CommentRepository.java`

```java
package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.Comment;
import com.final_project.blog_service.model.CommentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Comment Repository - handles comment persistence
 */
@Repository
public interface CommentRepository extends MongoRepository<Comment, String> {

    // Get all top-level comments for an article
    Page<Comment> findByArticleIdAndParentCommentIdIsNullAndStatusOrderByCreatedAtDesc(
            String articleId,
            CommentStatus status,
            Pageable pageable
    );

    // Get all replies to a specific comment
    Page<Comment> findByParentCommentIdAndStatusOrderByCreatedAtAsc(
            String parentCommentId,
            CommentStatus status,
            Pageable pageable
    );

    // Count total comments on an article
    Long countByArticleIdAndStatus(String articleId, CommentStatus status);

    // Count replies to a comment
    Long countByParentCommentIdAndStatus(String parentCommentId, CommentStatus status);

    // Get comments by user
    Page<Comment> findByAuthorIdAndStatusOrderByCreatedAtDesc(
            String authorId,
            CommentStatus status,
            Pageable pageable
    );

    // Find deleted comments for cleanup
    List<Comment> findByStatusAndEditedAtBefore(CommentStatus status, LocalDateTime threshold);

    // Check if comment exists
    boolean existsByIdAndStatus(String id, CommentStatus status);
}
```

## `src/main/java/com/final_project/blog_service/repo/LikeRepository.java`

```java
package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.Like;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Like Repository - handles like persistence
 */
@Repository
public interface LikeRepository extends MongoRepository<Like, String> {

    // Check if user has liked article
    Optional<Like> findByUserIdAndArticleId(String userId, String articleId);

    // Get all likes for an article
    Page<Like> findByArticleIdOrderByCreatedAtDesc(String articleId, Pageable pageable);

    // Get all likes by a user
    Page<Like> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    // Count likes for article
    Long countByArticleId(String articleId);

    // Count likes by user
    Long countByUserId(String userId);

    // Delete like
    void deleteByUserIdAndArticleId(String userId, String articleId);

    // Get user's liked articles (for reading list)
    @Query("{ 'userId': ?0 }")
    Page<Like> getUserLikedArticles(String userId, Pageable pageable);
}
```

## `src/main/java/com/final_project/blog_service/repo/ReadingHistoryRepository.java`

```java
package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.ReadingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ReadingHistory Repository - tracks user reading engagement
 */
@Repository
public interface ReadingHistoryRepository extends MongoRepository<ReadingHistory, String> {

    // Check if user has read article
    Optional<ReadingHistory> findByUserIdAndArticleId(String userId, String articleId);

    // Get user's reading history
    Page<ReadingHistory> findByUserIdOrderByReadAtDesc(String userId, Pageable pageable);

    // Get article's readers
    Page<ReadingHistory> findByArticleIdOrderByReadAtDesc(String articleId, Pageable pageable);

    // Get articles read by user
    @Query("{ 'userId': ?0, 'wasRead': true }")
    List<ReadingHistory> getUserReadArticles(String userId);

    // Count readers
    Long countByArticleId(String articleId);

    // Count articles read by user
    @Query("{ 'userId': ?0, 'wasRead': true }")
    Long countUserReadArticles(String userId);
}
```

## `src/main/java/com/final_project/blog_service/repo/ShareRepository.java`

```java
package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.Share;
import com.final_project.blog_service.model.SharedPlatform;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Share Repository - handles share tracking
 */
@Repository
public interface ShareRepository extends MongoRepository<Share, String> {

    // Get all shares for an article
    Page<Share> findByArticleIdOrderByCreatedAtDesc(String articleId, Pageable pageable);

    // Get all shares by a user
    Page<Share> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    // Count total shares for article
    Long countByArticleId(String articleId);

    // Count shares by platform
    Long countByArticleIdAndPlatform(String articleId, SharedPlatform platform);

    // Get shares for article by platform
    List<Share> findByArticleIdAndPlatformOrderByCreatedAtDesc(String articleId, SharedPlatform platform);
}

```

## `src/main/java/com/final_project/blog_service/service/ArticleService.java`

```java
package com.final_project.blog_service.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.blog_service.client.FileServiceClient;
import com.final_project.blog_service.client.UserServiceClient;
import com.final_project.blog_service.dto.request.*;
import com.final_project.blog_service.dto.response.*;
import com.final_project.blog_service.exception.ResourceNotFoundException;
import com.final_project.blog_service.exception.UnauthorizedException;
import com.final_project.blog_service.utile.ContentBlockValidator;
import com.final_project.blog_service.utile.ReadTimeCalculator;
import com.final_project.blog_service.utile.SlugUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.final_project.blog_service.dto.*;
import  com.final_project.blog_service.model.*;
import com.final_project.blog_service.repo.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import static java.util.stream.Collectors.toList;

/**
 * Article Service - Core business logic for article management
 * Handles: create, update, publish, delete articles and comments
 */
@Slf4j
@Service
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final ShareRepository shareRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final FileServiceClient fileServiceClient;
    private final UserServiceClient userServiceClient;
    private final UserCacheService userCacheService;
    private final ObjectMapper objectMapper;
    private final ContentBlockValidator contentBlockValidator;
    private final ReadTimeCalculator readTimeCalculator;
    private final FileUploadService fileUploadService;
    public ArticleService(ArticleRepository articleRepository,
                          CommentRepository commentRepository,
                          ReadTimeCalculator readTimeCalculator,
                          LikeRepository likeRepository,
                          RedisTemplate<String, String> redisTemplate,
                          FileServiceClient fileServiceClient,
                          UserServiceClient userServiceClient,
                          UserCacheService userCacheService,
                          ObjectMapper objectMapper,
                          ShareRepository shareRepository,
                          ContentBlockValidator contentBlockValidator,
                          FileUploadService fileUploadService

    ){
        this.fileUploadService = fileUploadService;
        this.readTimeCalculator = readTimeCalculator;
        this.contentBlockValidator = contentBlockValidator;
        this.articleRepository = articleRepository;
        this.commentRepository = commentRepository;
        this.fileServiceClient = fileServiceClient;
        this.likeRepository = likeRepository;
        this.objectMapper = objectMapper;
        this.shareRepository = shareRepository;
        this.redisTemplate = redisTemplate;
        this.userServiceClient = userServiceClient;
        this.userCacheService = userCacheService;
    }

    private static final String ARTICLE_CACHE_KEY = "article:";
    private static final String ARTICLE_STATS_CACHE_KEY = "article:stats:";
    private static final int CACHE_TTL_MINUTES = 5;
    /**
     * Create a new draft article
     */

    @Transactional
    public ArticleResponse createArticle(CreateArticleRequest request, String authorId) {
        contentBlockValidator.validate(request.getBlocks());
        validateFileReferences(request.getBlocks());

        Article article = Article.builder()
                .authorId(authorId)
                .title(request.getTitle())
                .slug(generateUniqueSlug(request.getTitle()))
                .content(
                        Content
                                .builder()
                                .estimatedReadTime(
                                        readTimeCalculator.calculateFromBlocks(request.getBlocks()))
                                .blocks(request
                                        .getBlocks()
                                        .stream()
                                        .map((req) ->
                                                ContentBlock
                                                        .builder()
                                                        .type(req.getType())
                                                        .order(req.getOrder())
                                                        .data(req.getData())
                                                        .build()
                                        ).toList()
                                )
                                .build()
                )
                .coverImageFileId(request.getCoverImageFileId())
                .coverImageUrl(request.getCoverImageUrl())
                .visibility(request.getVisibility())
                .status(ArticleStatus.DRAFT)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Article saved = articleRepository.save(article);
        return mapToResponse(saved);
    }

    /**
     * Update article (draft or published)
     */
    @Transactional
    public ArticleResponse updateArticle(String articleId, String authorId, UpdateArticleRequest request) {
        Article article = getArticleByIdOrThrow(articleId);
        validateAuthor(article, authorId);


        article.setTitle(request.getTitle());
        article
                .getContent()
                        .setBlocks(
                                request
                                        .getBlocks()
                                        .stream()
                                        .map((req) -> ContentBlock
                                                .builder()
                                                .order(req.getOrder())
                                                .type(req.getType())
                                                .data(req.getData())
                                                .build()
                                        ).toList()
                        );
        article.getContent().setEstimatedReadTime(readTimeCalculator.calculateFromBlocks(request.getBlocks()));
        article.getMetadata().setTags(request.getTags());
        article.getMetadata().setDescription(request.getDescription());
        article.getMetadata().setCoverImageUrl(request.getCoverImageUrl());
        article.setUpdatedAt(LocalDateTime.now());
        addEditHistory(article, authorId, "Updated content");
        Article updated = articleRepository.save(article);
        invalidateCache(articleId);
        return mapToResponse(updated);
    }

    /**
     * Publish an article (transition from DRAFT to PUBLISHED)
     */
    @Transactional
    public ArticleResponse publishArticle(String articleId, String authorId, PublishArticleRequest request) {
        Article article = getArticleByIdOrThrow(articleId);
        validateAuthor(article, authorId);
        if (!ArticleStatus.DRAFT.equals(article.getStatus())) {
            throw new IllegalStateException("Only draft articles can be published");
        }

        article.setStatus(ArticleStatus.PUBLISHED);
        article.setVisibility(request.getVisibility());
        article.setPublishedAt(LocalDateTime.now());
        article.setUpdatedAt(LocalDateTime.now());
        addEditHistory(article, authorId, "Published article");
        Article published = articleRepository.save(article);
        invalidateCache(articleId);

        // TODO: Trigger publish event for notifications
        // publishEvent(new ArticlePublishedEvent(published));

        return mapToResponse(published);
    }

    /**
     * Get article by ID (with cache)
     */
    @Transactional(readOnly = true)
    public ArticleResponse getArticleById(String articleId) {
        String cacheKey = ARTICLE_CACHE_KEY + articleId;

        // Try cache first
        String cachedArticle = redisTemplate.opsForValue().get(cacheKey);
        if (cachedArticle != null) {
            log.debug("Cache hit for article: {}", articleId);
            // Would deserialize here in production
        }

        Article article = getArticleByIdOrThrow(articleId);

        // Cache the result
        redisTemplate.opsForValue().set(cacheKey, article.getId(), CACHE_TTL_MINUTES, TimeUnit.MINUTES);

        // Increment views asynchronously
        incrementViewsAsync(articleId);

        return mapToResponse(article);
    }

    /**
     * Get article by slug (for URL routing)
     */
    @Transactional(readOnly = true)
    public ArticleResponse getArticleBySlug(String slug) {
        Article article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found: " + slug));

        return mapToResponse(article);
    }

    /**
     * Get user's articles with pagination
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<ArticlePreviewResponse> getUserArticles(String authorId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<Article> articles = articleRepository.findByAuthorIdAndStatusOrderByPublishedAtDesc(
                authorId,
                ArticleStatus.PUBLISHED,
                pageable
        );

        return mapToPaginatedResponse(articles, page, pageSize);
    }

    /**
     * Get published articles feed (paginated)
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<ArticlePreviewResponse> getPublishedArticles(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<Article> articles = articleRepository.findPublishedArticles(pageable);

        return mapToPaginatedResponse(articles, page, pageSize);
    }

    /**
     * Soft delete article (archive)
     */
    @Transactional
    public void deleteArticle(String articleId, String authorId) {
        Article article = getArticleByIdOrThrow(articleId);
        validateAuthor(article, authorId);

        log.info("Archiving article: {}", articleId);

        article.setStatus(ArticleStatus.ARCHIVED);
        article.setArchivedAt(LocalDateTime.now());
        article.setUpdatedAt(LocalDateTime.now());

        articleRepository.save(article);
        invalidateCache(articleId);
    }


    /**
     * Post a comment on an article
     */
    @Transactional
    public CommentResponse postComment(String articleId, String authorId, CreateCommentRequest request) {
        Article article = getArticleByIdOrThrow(articleId);

        Comment comment = Comment.builder()
                .articleId(articleId)
                .parentCommentId(null)  // Top-level comment
                .authorId(authorId)
                .body(request.getBody())
                .status(CommentStatus.PUBLISHED)
                .engagement(Comment.Engagement.builder()
                        .likes(0L)
                        .replyCount(0L)
                        .build()
                )
                .createdAt(LocalDateTime.now())
                .build();

        Comment saved = commentRepository.save(comment);

        // Update article comment count
        article.getStats().setCommentCount(article.getStats().getCommentCount() + 1);
        articleRepository.save(article);
        invalidateCache(articleId);

        log.info("Comment posted on article: {}", articleId);

        return mapCommentToResponse(saved);
    }

    /**
     * Reply to a comment
     */
    @Transactional
    public CommentResponse replyToComment(String articleId, String parentCommentId,
                                          String authorId, CreateCommentRequest request) {
        Article article = getArticleByIdOrThrow(articleId);
        Comment parentComment = getCommentByIdOrThrow(parentCommentId);

        Comment reply = Comment.builder()
                .articleId(articleId)
                .parentCommentId(parentCommentId)
                .authorId(authorId)
                .body(request.getBody())
                .status(CommentStatus.PUBLISHED)
                .engagement(Comment.Engagement.builder()
                        .likes(0L)
                        .replyCount(0L)
                        .build()
                )
                .createdAt(LocalDateTime.now())
                .build();

        Comment saved = commentRepository.save(reply);

        // Update parent comment reply count
        parentComment.getEngagement().setReplyCount(parentComment.getEngagement().getReplyCount() + 1);
        commentRepository.save(parentComment);

        // Update article comment count
        article.getStats().setCommentCount(article.getStats().getCommentCount() + 1);
        articleRepository.save(article);
        invalidateCache(articleId);

        log.info("Reply posted on comment: {}", parentCommentId);

        return mapCommentToResponse(saved);
    }

    /**
     * Get comments for an article (threaded)
     */
    @Transactional(readOnly = true)
    public PaginatedResponse<CommentThreadResponse> getArticleComments(String articleId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<Comment> comments = commentRepository.findByArticleIdAndParentCommentIdIsNullAndStatusOrderByCreatedAtDesc(
                articleId,
                CommentStatus.PUBLISHED,
                pageable
        );

        List<CommentThreadResponse> threads = comments.getContent().stream()
                .map(this::buildCommentThread)
                .toList();

        return PaginatedResponse.<CommentThreadResponse>builder()
                .data(threads)
                .pagination(PaginatedResponse.PaginationMetadata.builder()
                        .page(page)
                        .pageSize(pageSize)
                        .totalCount(comments.getTotalElements())
                        .totalPages(comments.getTotalPages())
                        .hasNext(comments.hasNext())
                        .hasPrevious(comments.hasPrevious())
                        .build()
                )
                .build();
    }

    /**
     * Delete a comment (soft delete)
     */
    @Transactional
    public void deleteComment(String commentId, String authorId) {
        Comment comment = getCommentByIdOrThrow(commentId);

        if (!comment.getAuthorId().equals(authorId)) {
            throw new UnauthorizedException("Not authorized to delete this comment");
        }

        log.info("Deleting comment: {}", commentId);

        comment.setStatus(CommentStatus.DELETE);
        comment.setEditedAt(LocalDateTime.now());

        commentRepository.save(comment);
    }

    // ============= ENGAGEMENT MANAGEMENT =============

    /**
     * Like an article
     */
    @Transactional
    public LikeResponse likeArticle(String articleId, String userId) {
        Article article = getArticleByIdOrThrow(articleId);

        // Check if already liked
        Optional<Like> existingLike = likeRepository.findByUserIdAndArticleId(userId, articleId);
        if (existingLike.isPresent()) {
            throw new IllegalStateException("Article already liked");
        }

        Like like = Like.builder()
                .userId(userId)
                .articleId(articleId)
                .createdAt(LocalDateTime.now())
                .build();

        Like saved = likeRepository.save(like);

        // Update article like count
        article.getStats().setLikes(article.getStats().getLikes() + 1);
        article.getStats().setLastEngagedAt(LocalDateTime.now());
        articleRepository.save(article);
        invalidateCache(articleId);

        log.info("Article liked: {}", articleId);

        return mapLikeToResponse(saved);
    }

    /**
     * Unlike an article
     */
    @Transactional
    public void unlikeArticle(String articleId, String userId) {
        Article article = getArticleByIdOrThrow(articleId);

        likeRepository.deleteByUserIdAndArticleId(userId, articleId);

        // Update article like count
        article.getStats().setLikes(Math.max(0, article.getStats().getLikes() - 1));
        articleRepository.save(article);
        invalidateCache(articleId);

        log.info("Article unliked: {}", articleId);
    }

    /**
     * Track share
     */
    @Transactional
    public ShareResponse shareArticle(String articleId, String userId, ShareRequest request) {
        Article article = getArticleByIdOrThrow(articleId);

        Share share = Share.builder()
                .userId(userId)
                .articleId(articleId)
                .platform(request.getPlatform())
                .metadata(Share.Metadata.builder()
                        .customMessage(request.getCustomMessage())
                        .timestamp(LocalDateTime.now())
                        .build()
                )
                .createdAt(LocalDateTime.now())
                .build();

        Share saved = shareRepository.save(share);

        // Update article share count
        article.getStats().setShareCount(article.getStats().getShareCount() + 1);
        article.getStats().setLastEngagedAt(LocalDateTime.now());
        articleRepository.save(article);
        invalidateCache(articleId);

        log.info("Article shared: {} on {}", articleId, request.getPlatform());

        return mapShareToResponse(saved);
    }


    private String generateUniqueSlug(String title) {
        String baseSlug = SlugUtil.generateSlug(title);
        String slug = baseSlug;
        int counter = 1;

        while (articleRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter++;
        }

        return slug;
    }

    private Integer calculateReadTime(List<ContentBlockRequest> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return 1;
        }

        int wordCount = blocks.stream()
                .mapToInt(block -> {
                    if ("text".equalsIgnoreCase(block.getType().getType()) && block.getData().has("text")) {
                        return block.getData().get("text").asText().split("\\s+").length;
                    }
                    return 0;
                })
                .sum();

        // Average reading speed: 200 words per minute
        return Math.max(1, (wordCount + 199) / 200);
    }

    private List<ContentBlock> mapContentBlocks(List<ContentBlockRequest> requests) {
        if (requests == null) {
            return new ArrayList<>();
        }

        return requests.stream()
                .map(req ->
                        ContentBlock.
                                builder()
                                .type(req.getType())
                                .data(objectMapper.convertValue(req.getData(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}))
                                .build()
                )
                .toList();
    }

    private void addEditHistory(Article article, String editorId, String summary) {
        EditHistory history = new EditHistory();
        history.setVersion((int) (articleRepository.countByAuthorIdAndStatus(article.getAuthorId(), article.getStatus()) + 1));
        history.setUpdatedAt(LocalDateTime.now());
        history.setEditorId(editorId);
        history.setSummary(summary);

        article.getEditHistory().add(history);
    }

    private void incrementViewsAsync(String articleId) {
        // TODO: Implement async increment (use event bus/message queue)
        log.debug("Incrementing views for article: {}", articleId);
    }

    private void validateAuthor(Article article, String userId) {
        if (!article.getAuthorId().equals(userId)) {
            throw new UnauthorizedException("Not authorized to modify this article");
        }
    }

    private void invalidateCache(String articleId) {
        redisTemplate.delete(ARTICLE_CACHE_KEY + articleId);
        redisTemplate.delete(ARTICLE_STATS_CACHE_KEY + articleId);
    }

    private CommentThreadResponse buildCommentThread(Comment comment) {
        Pageable pageable = PageRequest.of(0, 10);

        Page<Comment> replies = commentRepository.findByParentCommentIdAndStatusOrderByCreatedAtAsc(
                comment.getId(),
                CommentStatus.PUBLISHED,
                pageable
        );

        List<CommentThreadResponse> replyThreads = replies.getContent().stream()
                .map(this::buildCommentThread)
                .toList();

        return CommentThreadResponse.builder()
                .comment(mapCommentToResponse(comment))
                .replies(replyThreads)
                .build();
    }

    private Article getArticleByIdOrThrow(String id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found: " + id));
    }
    private Comment getCommentByIdOrThrow(String id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + id));
    }
    private ArticleResponse mapToResponse(Article article) {
        return ArticleResponse.builder()
                .id(article.getId())
                .slug(article.getSlug())
                .title(article.getTitle())
                .subtitle(article.getSubtitle())
                .metadata(MetadataResponse.builder()
                        .tags(article.getMetadata().getTags())
                        .category(article.getMetadata().getCategory())
                        .description(article.getMetadata().getDescription())
                        .coverImageUrl(article.getMetadata().getCoverImageUrl())
                        .build()
                )
                .status(article.getStatus())
                .visibility(article.getVisibility())
                .stats(StatsResponse.builder()
                        .views(article.getStats().getViews())
                        .reads(article.getStats().getReads())
                        .likes(article.getStats().getLikes())
                        .commentCount(article.getStats().getCommentCount())
                        .shareCount(article.getStats().getShareCount())
                        .lastEngagedAt(article.getStats().getLastEngagedAt())
                        .build()
                )
                .publishedAt(article.getPublishedAt())
                .updatedAt(article.getUpdatedAt())
                .createdAt(article.getCreatedAt())
                .estimatedReadTime(article.getContent().getEstimatedReadTime())
                .build();
    }
    private PaginatedResponse<ArticlePreviewResponse> mapToPaginatedResponse(Page<Article> page, int pageNum, int pageSize) {
        List<ArticlePreviewResponse> previews = page.getContent().stream()
                .map(this::mapToPreview)
                .toList();
        return PaginatedResponse.<ArticlePreviewResponse>builder()
                .data(previews)
                .pagination(PaginatedResponse.PaginationMetadata.builder()
                        .page(pageNum)
                        .pageSize(pageSize)
                        .totalCount(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .hasNext(page.hasNext())
                        .hasPrevious(page.hasPrevious())
                        .build()
                )
                .build();
    }

    private ArticlePreviewResponse mapToPreview(Article article) {
        return ArticlePreviewResponse.builder()
                .id(article.getId())
                .slug(article.getSlug())
                .title(article.getTitle())
                .subtitle(article.getSubtitle())
                .coverImageUrl(article.getMetadata().getCoverImageUrl())
                .description(article.getMetadata().getDescription())
                .stats(StatsResponse.builder()
                        .views(article.getStats().getViews())
                        .reads(article.getStats().getReads())
                        .likes(article.getStats().getLikes())
                        .commentCount(article.getStats().getCommentCount())
                        .shareCount(article.getStats().getShareCount())
                        .build()
                )
                .publishedAt(article.getPublishedAt())
                .estimatedReadTime(article.getContent().getEstimatedReadTime())
                .tags(article.getMetadata().getTags())
                .build();
    }

    private CommentResponse mapCommentToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .articleId(comment.getArticleId())
                .parentCommentId(comment.getParentCommentId())
                .body(comment.getBody())
                .engagement(CommentEngagementResponse.builder()
                        .likes(comment.getEngagement().getLikes())
                        .replyCount(comment.getEngagement().getReplyCount())
                        .build()
                )
                .createdAt(comment.getCreatedAt())
                .editedAt(comment.getEditedAt())
                .build();
    }

    private LikeResponse mapLikeToResponse(Like like) {
        return LikeResponse.builder()
                .id(like.getId())
                .userId(like.getUserId())
                .articleId(like.getArticleId())
                .createdAt(like.getCreatedAt())
                .build();
    }

    private ShareResponse mapShareToResponse(Share share) {
        return ShareResponse.builder()
                .id(share.getId())
                .userId(share.getUserId())
                .articleId(share.getArticleId())
                .platform(share.getPlatform())
                .createdAt(share.getCreatedAt())
                .build();
    }
    public ArticleResponse getArticleByAuthorAndId(String authorId, String articleId) {
        Article article = articleRepository.findArticleByIdAndAuthorId(authorId, articleId)
                .orElseThrow(() -> new  ResourceNotFoundException("This Article by this user"));
        return mapToResponse(article);


    }

    @Transactional
    public ArticleResponse createArticleWithFiles(
            String title,
            String description,
            String blocksJson,
            MultipartFile coverImage,
            List<MultipartFile> inlineFiles,
            String authorId
    ) {
        try {
            List<ArticleBlockRequest> blocks = objectMapper.readValue(
                    blocksJson,
                    new com.fasterxml.jackson.core.type.TypeReference<List<ArticleBlockRequest>>() {}
            );

            String coverFileId = null;
            String coverUrl = null;

            if (coverImage != null && !coverImage.isEmpty()) {
                FileUploadResponse cover = fileUploadService.uploadArticleImage(coverImage, authorId, "drafts");
                coverFileId = cover.getFileId();
                coverUrl = cover.getCdnUrl();
            }

            if (inlineFiles != null && !inlineFiles.isEmpty()) {
                for (ArticleBlockRequest block : blocks) {
                    if ((block.getType() == ArticleBlockType.IMAGE || block.getType() == ArticleBlockType.VIDEO)
                            && block.getData().containsKey("uploadIndex")) {

                        int index = ((Number) block.getData().get("uploadIndex")).intValue();
                        MultipartFile file = inlineFiles.get(index);

                        FileUploadResponse uploaded = block.getType() == ArticleBlockType.IMAGE
                                ? fileUploadService.uploadArticleImage(file, authorId, "drafts")
                                : fileUploadService.uploadArticleVideo(file, authorId, "drafts");

                        block.getData().put("fileId", uploaded.getFileId());
                        block.getData().put("url", uploaded.getCdnUrl());
                        block.getData().remove("uploadIndex");
                    }
                }
            }

            CreateArticleRequest request = CreateArticleRequest.builder()
                    .title(title)
                    .description(description)
                    .blocks(blocks)
                    .coverImageFileId(coverFileId)
                    .coverImageUrl(coverUrl)
                    .build();

            return createArticle(request, authorId);

        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid multipart article request: " + ex.getMessage(), ex);
        }
    }
    /**
     * Process content blocks and validate file references
     */
    private List<ContentBlock> processContentBlocks(List<FlexibleContentBlockRequest> blocks) {
        return blocks.stream()
                .map(block -> {
                    // Validate block data based on type
                    validateBlock(block);
                    // For image/video blocks, validate file exists
                    if ("image".equalsIgnoreCase(block.getType().getType()) || "video".equalsIgnoreCase(block.getType().getType())) {
                        validateFileReference(block.getFileId());
                    }
                    // Convert to entity
                    return
                            ContentBlock
                            .builder()
                            .type(block.getType())
                            .build();
                })
                .collect(toList());
    }

    /**
     * Validate individual content block
     */
    private void validateBlock(FlexibleContentBlockRequest block) {
        switch (block.getType()) {
            case TEXT:
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Text block requires 'text' field");
                }
                break;
            case HEADING:
                if (block.getLevel() == null || block.getLevel() < 1 || block.getLevel() > 6) {
                    throw new IllegalArgumentException("Heading block requires valid 'level' (1-6)");
                }
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Heading block requires 'text' field");
                }
                break;
            case IMAGE:
            case VIDEO:
                if (block.getFileId() == null || block.getFileUrl() == null) {
                    throw new IllegalArgumentException(
                            block.getType() + " block requires 'fileId' and 'fileUrl' fields"
                    );
                }
                break;
            case CODE:
                if (block.getCode() == null || block.getCode().isBlank()) {
                    throw new IllegalArgumentException("Code block requires 'code' field");
                }
                break;
            case QUOTE:
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Quote block requires 'text' field");
                }
                break;
            case EMBED:
                if (block.getProvider() == null || block.getEmbedUrl() == null) {
                    throw new IllegalArgumentException(
                            "Embed block requires 'provider' and 'embedUrl' fields"
                    );
                }
                break;
            case DIVIDER:
                // No specific validation needed
                break;
            default:
                throw new IllegalArgumentException("Unknown block type: " + block.getType());
        }
    }


    private ContentBlock convertFlexibleBlockToEntity(
            FlexibleContentBlockRequest blockRequest
    ) {
        if (blockRequest == null) {
            throw new IllegalArgumentException("Content block cannot be null");
        }


        // Validate block
        validateFlexibleContentBlock(blockRequest);

        // For image/video blocks, validate file exists in File Service
        if ("image".equalsIgnoreCase(blockRequest.getType().getType()) || "video".equals(blockRequest.getType().getType().toLowerCase())) {
            validateFileReference(blockRequest.getFileId());
        }

        // Convert DTO to JsonNode for flexible MongoDB storage
        JsonNode blockData = objectMapper.valueToTree(blockRequest);
        Map<String, Object> data = objectMapper.convertValue(blockData,new  com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>(){});
        // Create and return entity
        return ContentBlock.builder()
                .type(blockRequest.getType())
                .data(data)
                .build();
    }

    private ContentBlock convertContentBlockRequestToEntity(
            ContentBlockRequest blockRequest
    ) {
        if (blockRequest == null) {
            throw new IllegalArgumentException("Content block cannot be null");
        }

        JsonNode blockData = objectMapper.valueToTree(blockRequest);
        Map<String , Object> data = objectMapper.convertValue(blockData, new com.fasterxml.jackson.core.type.TypeReference<Map<String , Object>>(){});

        return ContentBlock.builder()
                .type(blockRequest.getType())
                .data(data)
                .build();
    }


    /**
     * Validate flexible content block structure
     */
    private void validateFlexibleContentBlock(FlexibleContentBlockRequest block) {


        switch (block.getType()) {
            case TEXT:
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Text block requires non-empty 'text' field");
                }
                if (block.getText().length() > 10000) {
                    throw new IllegalArgumentException("Text block exceeds maximum length");
                }
                break;

            case HEADING:
                if (block.getLevel() == null || block.getLevel() < 1 || block.getLevel() > 6) {
                    throw new IllegalArgumentException("Heading level must be 1-6");
                }
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Heading block requires 'text'");
                }
                break;

            case IMAGE:
                if (block.getFileId() == null || block.getFileId().isBlank()) {
                    throw new IllegalArgumentException("Image block requires 'fileId'");
                }
                if (block.getFileUrl() == null || block.getFileUrl().isBlank()) {
                    throw new IllegalArgumentException("Image block requires 'fileUrl'");
                }
                if (block.getAlt() == null || block.getAlt().isBlank()) {
                    throw new IllegalArgumentException("Image block requires 'alt' text for accessibility");
                }
                break;

            case VIDEO:
                if (block.getFileId() == null || block.getFileId().isBlank()) {
                    throw new IllegalArgumentException("Video block requires 'fileId'");
                }
                if (block.getFileUrl() == null || block.getFileUrl().isBlank()) {
                    throw new IllegalArgumentException("Video block requires 'fileUrl'");
                }
                if (block.getDuration() == null || block.getDuration() < 1) {
                    throw new IllegalArgumentException("Video block requires valid 'duration'");
                }
                break;

            case CODE:
                if (block.getCode() == null || block.getCode().isBlank()) {
                    throw new IllegalArgumentException("Code block requires 'code'");
                }
                if (block.getLanguage() == null) {
                    throw new IllegalArgumentException("Code block requires 'language'");
                }
                break;

            case QUOTE:
                if (block.getText() == null || block.getText().isBlank()) {
                    throw new IllegalArgumentException("Quote block requires 'text'");
                }
                break;

            case EMBED:
                if (block.getProvider() == null || block.getProvider().isBlank()) {
                    throw new IllegalArgumentException("Embed block requires 'provider'");
                }
                if (block.getEmbedUrl() == null || block.getEmbedUrl().isBlank()) {
                    throw new IllegalArgumentException("Embed block requires 'embedUrl'");
                }
                break;

            case DIVIDER:
                // No validation needed
                break;

            default:
                throw new IllegalArgumentException("Unknown block type: ");
        }
    }

    /**
     * Validate file reference exists in File Service
     */
    private void validateFileReference(String fileId) {
        if (fileId == null || fileId.isBlank()) {
            throw new IllegalArgumentException("File ID cannot be null");
        }
        try {
            // Call File Service to verify file exists
            fileServiceClient.getFileMetadata(fileId);
            log.debug("File validated: {}", fileId);
        } catch (Exception e) {
            log.error("File validation failed: {} - {}", fileId, e.getMessage());
            throw new IllegalArgumentException(
                    "File not found or inaccessible: " + fileId + ". Upload file first."
            );
        }
    }

    private List<ContentBlock> mapBlocks(List<ArticleBlockRequest> requests) {
        return requests.stream()
                .map(block -> ContentBlock.builder()
                        .type(block.getType())
                        .order(block.getOrder())
                        .data(block.getData())
                        .build())
                .toList();
    }

    private void validateFileReferences(List<ArticleBlockRequest> blocks) {
        for (ArticleBlockRequest block : blocks) {
            if (block.getType() == ArticleBlockType.IMAGE || block.getType() == ArticleBlockType.VIDEO) {
                Object fileId = block.getData().get("fileId");
                if (fileId == null || fileId.toString().isBlank()) {
                    throw new IllegalArgumentException(block.getType() + " block requires fileId");
                }
                fileServiceClient.getFileMetadata(fileId.toString());
            }
        }
    }
    /**
     * Extract keywords from title and description
     */
    private List<String> extractKeywords(String title, String description) {
        if (title == null && description == null) {
            return List.of();
        }

        String combined = (title != null ? title : "") + " " + (description != null ? description : "");

        return Stream.of(combined.split("\\s+"))
                .filter(word -> word.length() > 3)
                .distinct()
                .limit(10)
                .collect(toList());
    }

    // ============= RESPONSE MAPPING =============

    /**
     * Map Article entity to ArticleResponse DTO
     */
    private ArticleResponse mapToResponse(Article article, UserProfileResponse author) {
        return ArticleResponse.builder()
                .id(article.getId())
                .slug(article.getSlug())
                .title(article.getTitle())
                .subtitle(article.getSubtitle())
                .content(mapContentToResponse(article.getContent()))
                .metadata(mapMetadataToResponse(article.getMetadata()))
                .status(article.getStatus())
                .visibility(article.getVisibility())
                .stats(mapStatsToResponse(article.getStats()))
                .author(mapAuthorResponse(author))
                .publishedAt(article.getPublishedAt())
                .updatedAt(article.getUpdatedAt())
                .createdAt(article.getCreatedAt())
                .estimatedReadTime(article.getContent().getEstimatedReadTime())
                .build();
    }

    private ContentResponse mapContentToResponse(Content content) {
        return ContentResponse.builder()
                .blocks(content.getBlocks()
                        .stream()
                        .map(block ->
                                ContentBlockResponse.builder()
                                .type(block.getType())
                                .data((JsonNode) block.getData())
                                .build()
                        )
                        .collect(toList())
                )
                .estimatedReadTime(content.getEstimatedReadTime())
                .build();
    }

    private MetadataResponse mapMetadataToResponse(Metadata metadata) {
        return MetadataResponse.builder()
                .tags(metadata.getTags())
                .category(metadata.getCategory())
                .description(metadata.getDescription())
                .keywords(metadata.getKeywords())
                .coverImageUrl(metadata.getCoverImageUrl())
                .build();
    }

    private StatsResponse mapStatsToResponse(Stats stats) {
        return StatsResponse.builder()
                .views(stats.getViews())
                .reads(stats.getReads())
                .likes(stats.getLikes())
                .commentCount(stats.getCommentCount())
                .shareCount(stats.getShareCount())
                .lastEngagedAt(stats.getLastEngagedAt())
                .build();
    }

    private AuthorResponse mapAuthorResponse(UserProfileResponse user) {
        return AuthorResponse.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .profileImageUrl(user.getProfileImageUrl())
                .totalArticles(user.getTotalArticles() != null ? user.getTotalArticles() : 0L)
                .build();
    }
}

```

## `src/main/java/com/final_project/blog_service/service/FileUploadService.java`

```java
package com.final_project.blog_service.service;
import com.final_project.blog_service.client.FileServiceClient;
import com.final_project.blog_service.dto.response.FileUploadResponse;
import com.final_project.blog_service.exception.FileUploadException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadService {
    private final FileServiceClient fileServiceClient;
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    private static final long MAX_VIDEO_SIZE = 500 * 1024 * 1024;

    private static final Set<String> IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final Set<String> VIDEO_TYPES = Set.of(
            "video/mp4", "video/webm", "video/ogg", "video/quicktime"
    );

    public FileUploadResponse uploadArticleImage(MultipartFile file ,String authorId, String articleId) {
        validate(file, IMAGE_TYPES, MAX_IMAGE_SIZE, "image");
        return upload(file, authorId, articleId, "image");
    }
    public FileUploadResponse uploadArticleVideo(MultipartFile file, String authorId, String articleId) {
        validate(file, VIDEO_TYPES, MAX_VIDEO_SIZE, "video");
        return upload(file, authorId, articleId, "video");
    }
    private FileUploadResponse upload(MultipartFile file, String authorId, String articleId, String subFolder) {
        try {
            return fileServiceClient.uploadBlogFile(
                    file,
                    authorId,
                    articleId != null ? articleId : "drafts"
            );
        } catch (Exception ex) {
            log.error("File-service upload failed", ex);
            throw new FileUploadException("Failed to upload " + subFolder + " file");
        }
    }

    public void deleteFile(String fileId, String articleId) {
        try {
            fileServiceClient.deleteFile(fileId, articleId);
        } catch (Exception ex) {
            log.warn("Failed to delete file {} from file-service", fileId, ex);
        }
    }

    private void validate(MultipartFile file, Set<String> allowedTypes, long maxSize, String label) {
        if (file == null || file.isEmpty()) {
            throw new FileUploadException(label + " file is required");
        }

        if (file.getSize() > maxSize) {
            throw new FileUploadException(label + " file is too large");
        }

        if (file.getContentType() == null || !allowedTypes.contains(file.getContentType())) {
            throw new FileUploadException("Unsupported " + label + " type: " + file.getContentType());
        }

        String filename = file.getOriginalFilename();
        if (    filename == null
                || filename.contains("..")
                || filename.contains("/")
        ) {
            throw new FileUploadException("Invalid filename");
        }

    }

}
```

## `src/main/java/com/final_project/blog_service/service/UserCacheService.java`

```java
package com.final_project.blog_service.service;
import com.final_project.blog_service.client.UserServiceClient;
import com.final_project.blog_service.dto.response.UserProfileResponse;
import com.final_project.blog_service.exception.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserCacheService {
    private final UserServiceClient userServiceClient;
    private final RedisTemplate<String, UserProfileResponse> redisTemplate;

    private static final String USER_CACHE_KEY = "user:";
    private static final String USER_EMAIL_CACHE_KEY = "user:email:";
    private static final int CACHE_TTL_MINUTES = 30;

    /**
     * Get user profile with caching
     * Tries cache first, then calls User Service, falls back to empty profile
     */
    public UserProfileResponse getUserProfile(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        String cacheKey = USER_CACHE_KEY + userId;

        // Try cache first
        try {
            UserProfileResponse cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("User cache hit: {}", userId);
                return cached;
            }
        } catch (Exception e) {
            log.warn("Cache read error for user {}: {}", userId, e.getMessage());
        }

        // Cache miss - call User Service
        try {
            log.debug("Fetching user profile from User Service: {}", userId);
            UserProfileResponse profile = userServiceClient.getUserProfile(userId);

            // Cache the result
            cacheUserProfile(userId, profile);

            return profile;
        } catch (UserNotFoundException e) {
            log.error("User not found in User Service: {}", userId);
            throw e;
        } catch (Exception e) {
            log.error("User Service call failed for user {}: {}", userId, e.getMessage());

            // Try fallback: return user ID as profile
            return createFallbackProfile(userId);
        }
    }

    /**
     * Get user by email
     */
    public UserProfileResponse getUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null");
        }

        String cacheKey = USER_EMAIL_CACHE_KEY + email.toLowerCase();

        try {
            UserProfileResponse cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                log.debug("User cache hit by email: {}", email);
                return cached;
            }
        } catch (Exception e) {
            log.warn("Cache read error for email {}: {}", email, e.getMessage());
        }

        try {
            UserProfileResponse profile = userServiceClient.getUserByEmail(email);
            cacheUserProfile(profile.getId(), profile);
            return profile;
        } catch (Exception e) {
            log.error("User Service call failed for email {}: {}", email, e.getMessage());
            throw new UserNotFoundException("User not found: " + email);
        }
    }

    /**
     * Get multiple user profiles efficiently with caching
     */
    public Map<String, UserProfileResponse> getUserProfiles(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return new HashMap<>();
        }

        Map<String, UserProfileResponse> result = new HashMap<>();
        List<String> uncachedUserIds = new ArrayList<>();

        // Check cache for each user
        for (String userId : userIds) {
            String cacheKey = USER_CACHE_KEY + userId;
            try {
                UserProfileResponse cached = redisTemplate.opsForValue().get(cacheKey);
                if (cached != null) {
                    result.put(userId, cached);
                } else {
                    uncachedUserIds.add(userId);
                }
            } catch (Exception e) {
                uncachedUserIds.add(userId);
            }
        }

        // Batch fetch uncached users
        if (!uncachedUserIds.isEmpty()) {
            try {
                log.debug("Batch fetching {} users from User Service", uncachedUserIds.size());
                List<UserProfileResponse> profiles = userServiceClient.getMultipleUsers(uncachedUserIds);

                for (UserProfileResponse profile : profiles) {
                    result.put(profile.getId(), profile);
                    cacheUserProfile(profile.getId(), profile);
                }

                // Add fallback profiles for missing users
                Set<String> fetchedIds = profiles.stream()
                        .map(UserProfileResponse::getId)
                        .collect(Collectors.toSet());

                uncachedUserIds.stream()
                        .filter(id -> !fetchedIds.contains(id))
                        .forEach(id -> result.put(id, createFallbackProfile(id)));

            } catch (Exception e) {
                log.error("Batch fetch failed: {}", e.getMessage());

                // Fallback: return all as fallback profiles
                uncachedUserIds.forEach(id -> result.put(id, createFallbackProfile(id)));
            }
        }

        return result;
    }

    /**
     * Invalidate user cache (call when user updates profile)
     */
    public void invalidateUserCache(String userId) {
        if (userId == null) return;

        String cacheKey = USER_CACHE_KEY + userId;
        try {
            redisTemplate.delete(cacheKey);
            log.debug("User cache invalidated: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to invalidate cache for user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Invalidate user cache by email
     */
    public void invalidateUserCacheByEmail(String email) {
        if (email == null) return;

        String cacheKey = USER_EMAIL_CACHE_KEY + email.toLowerCase();
        try {
            redisTemplate.delete(cacheKey);
            log.debug("User cache invalidated by email: {}", email);
        } catch (Exception e) {
            log.warn("Failed to invalidate cache for email {}: {}", email, e.getMessage());
        }
    }

    // ============= PRIVATE METHODS =============

    private void cacheUserProfile(String userId, UserProfileResponse profile) {
        String cacheKey = USER_CACHE_KEY + userId;
        try {
            redisTemplate.opsForValue().set(
                    cacheKey,
                    profile,
                    CACHE_TTL_MINUTES,
                    TimeUnit.MINUTES
            );
            log.debug("User profile cached: {}", userId);
        } catch (Exception e) {
            log.warn("Failed to cache user profile: {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Create fallback profile when User Service is unavailable
     */
    private UserProfileResponse createFallbackProfile(String userId) {
        log.warn("Creating fallback profile for user: {}", userId);

        return UserProfileResponse.builder()
                .id(userId)
                .displayName("[User Service Unavailable]")
                .username("user_" + userId.substring(0, Math.min(8, userId.length())))
                .email(null)
                .profileImageUrl(null)
                .bio(null)
                .totalArticles(0L)
                .createdAt(null)
                .build();
    }
}

```

## `src/main/java/com/final_project/blog_service/utile/ContentBlockValidator.java`

```java
package com.final_project.blog_service.utile;

import com.final_project.blog_service.dto.request.ArticleBlockRequest;
import com.final_project.blog_service.dto.ArticleBlockType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ContentBlockValidator {

    public void validate(List<ArticleBlockRequest> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            throw new IllegalArgumentException("Article must contain at least one content block");
        }

        for (ArticleBlockRequest block : blocks) {
            validateBlock(block);
        }
    }

    private void validateBlock(ArticleBlockRequest block) {
        if (block.getType() == null) {
            throw new IllegalArgumentException("Block type is required");
        }

        if (block.getData() == null) {
            throw new IllegalArgumentException("Block data is required");
        }

        Map<String, Object> data = block.getData();
        ArticleBlockType type = block.getType();

        switch (type) {
            case TEXT -> requireText(data, "text", "Text block requires text");
            case HEADING -> {
                requireText(data, "text", "Heading block requires text");
                Object level = data.get("level");
                if (!(level instanceof Number number) || number.intValue() < 1 || number.intValue() > 6) {
                    throw new IllegalArgumentException("Heading level must be between 1 and 6");
                }
            }
            case IMAGE -> {
                requireText(data, "fileId", "Image block requires fileId");
                requireText(data, "url", "Image block requires url");
                requireText(data, "alt", "Image block requires alt text");
            }
            case VIDEO -> {
                requireText(data, "fileId", "Video block requires fileId");
                requireText(data, "url", "Video block requires url");
            }
            case CODE -> {
                requireText(data, "code", "Code block requires code");
                requireText(data, "language", "Code block requires language");
            }
            case QUOTE -> requireText(data, "text", "Quote block requires text");
            case EMBED -> {
                requireText(data, "provider", "Embed block requires provider");
                requireText(data, "url", "Embed block requires url");
            }
            case DIVIDER -> {
                // no required fields
            }
        }
    }

    private void requireText(Map<String, Object> data, String key, String message) {
        Object value = data.get(key);
        if (!(value instanceof String text) || text.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
```

## `src/main/java/com/final_project/blog_service/utile/ReadTimeCalculator.java`

```java
package com.final_project.blog_service.utile;


import com.final_project.blog_service.dto.request.ArticleBlockRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReadTimeCalculator {

    private static final int WORDS_PER_MINUTE = 200;

    public int calculateFromBlocks(List<ArticleBlockRequest> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return 1;
        }

        int words = 0;

        for (ArticleBlockRequest block : blocks) {
            if (block.getData() == null) continue;

            Object text = block.getData().get("text");
            if (text instanceof String value && !value.isBlank()) {
                words += value.trim().split("\s+").length;
            }

            Object code = block.getData().get("code");
            if (code instanceof String value && !value.isBlank()) {
                words += value.trim().split("\s+").length / 2;
            }
        }

        return Math.max(1, (int) Math.ceil(words / 200.0));
    }
}
```

## `src/main/java/com/final_project/blog_service/utile/SlugUtil.java`

```java
package com.final_project.blog_service.utile;


import org.apache.commons.lang3.StringUtils;

public class SlugUtil {

    public static String generateSlug(String title) {
        if (StringUtils.isBlank(title)) {
            throw new IllegalArgumentException("Title cannot be blank");
        }

        return title
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    public static String slugify(String input) {
        return generateSlug(input);
    }
}

```

## `src/main/resources/application.yaml`

```yaml
spring:
  application:
    name: blog-service
  config:
    import:
      - optional:configserver:http://localhost:8888
  data:
    mongodb:
      uri: mongodb://localhost:27017/blog_db
      auto-index-creation: true
    redis:
      host: localhost
      port: 6379
      connect-timeout: 2000
      jedis:
        pool:
          max-active: 20
          max-idle: 10
          min-idle: 5
  rabbitmq:
    password: ${RABBIT_PASSWORD:guest}
    username: ${RABBIT_USERNAME:guest}
    host: ${RABBIT_HOST:localhost}
    port: ${RABBIT_PORT:5672}
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri:  http://localhost:8444/realms/final-project
          jwk-set-uri: http://localhost:8444/realms/final-project/protocol/openid-connect/certs
  jackson:
    default-property-inclusion: non_null
    serialization:
      write-dates-as-timestamps: false
      indent-output: true

eureka:
  instance:
    prefer-ip-address: true
    ip-address: 127.0.0.1
    hostname: localhost
  client:
    register-with-eureka: true
    fetch-registry: true
    service-url:
      defaultZone: http://localhost:8761/eureka/
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    operations-sorter: method
    tags-sorter: alpha
    display-request-duration: true
server:
  port: 8087
  error:
    include-message: always
    include-stacktrace: on_param
    include-exception: false
    include-binding-errors: always
logging:
  level:
    root: info
    com:
      final_project:
        blog_service:
          model:
            Article: DEBUG
    org:
      springframework:
        web: INFO
        data:
          mongodb: DEBUG
        security: TRACE



app:
  file-upload:
    max-image-size: 10485760
    max-video-size: 536870912
  service:
    auth-url: http://auth-service
    file-url: http://file-service
management:
  endpoints:
    web:
      exposure:
        include: '*'
```

## `src/test/java/com/final_project/blog_service/BlogServiceApplicationTests.java`

```java
package com.final_project.blog_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class BlogServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
```

