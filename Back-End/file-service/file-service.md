# File Service

## 1. Folder Structure

```text
file-service/
  .env
  .gitattributes
  .gitignore
  .mvn/
    wrapper/
      maven-wrapper.properties
  HELP.md
  mvnw
  mvnw.cmd
  pom.xml
  src/
    main/
      java/
        com/
          final_project/
            file_service/
              api/
                controller/
                  BlogController.java
                  DepartmentController.java
                  EmployeeController.java
                  FacultyController.java
                  GlobalExceptionController.java
                  StudentController.java
                  TeacherController.java
                  UniversityController.java
                dto/
                  BaseUploadRequest.java
                  Blog.java
                  ErrorResponse.java
                  StudentRequest.java
                  TeacherRequest.java
              domain/
                model/
                  FileCategory.java
                  FileMetadata.java
                  FileRecord.java
                  OwnerType.java
                ports/
                  BucketStrategy.java
                  FileStoragePort.java
                repo/
                  FileRecordRepository.java
                service/
                  BucketCreationFail.java
                  FileNotFound.java
                  FileRecordService.java
                  FileService.java
                  NotDeleteException.java
                  NotDownloadException.java
                  NotGenerateURLException.java
                  NotUploadException.java
              FileServiceApplication.java
              infrastructure/
                config/
                  AppConfig.java
                minio/
                  MinioStorageAdapter.java
                stradegy/
                  UniversalBucketStrategy.java
      resources/
        application.yaml
    test/
      java/
        com/
          final_project/
            file_service/
              FileServiceApplicationTests.java
```

## 2. File Contents

The sections below embed the current file contents from the file-service microservice. Generated build output under target/ is excluded.

### .env

`$lang
ENDPOINT=http://localhost:9000
USERNAME=admin
PASSWORD=password123
RABBIT_PASSWORD=guest
RABBIT_USERNAME=guest
RABBIT_HOST=localhost
RABBIT_PORT=5672
```

### .gitattributes

`$lang
/mvnw text eol=lf
*.cmd text eol=crlf
```

### .gitignore

`$lang
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

### .mvn/wrapper/maven-wrapper.properties

`$lang
wrapperVersion=3.3.4
distributionType=only-script
distributionUrl=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.14/apache-maven-3.9.14-bin.zip
```

### HELP.md

`$lang
# Read Me First
The following was discovered as part of building this project:

* The original package name 'com.final_project.file-service' is invalid and this project uses 'com.final_project.file_service' instead.

# Getting Started

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/3.5.13/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/3.5.13/maven-plugin/build-image.html)
* [Spring Web](https://docs.spring.io/spring-boot/3.5.13/reference/web/servlet.html)
* [Config Client](https://docs.spring.io/spring-cloud-config/reference/client.html)
* [Eureka Discovery Client](https://docs.spring.io/spring-cloud-netflix/reference/spring-cloud-netflix.html#_service_discovery_eureka_clients)
* [Spring Boot Actuator](https://docs.spring.io/spring-boot/3.5.13/reference/actuator/index.html)
* [Spring for RabbitMQ](https://docs.spring.io/spring-boot/3.5.13/reference/messaging/amqp.html)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Service Registration and Discovery with Eureka and Spring Cloud](https://spring.io/guides/gs/service-registration-and-discovery/)
* [Building a RESTful Web Service with Spring Boot Actuator](https://spring.io/guides/gs/actuator-service/)
* [Messaging with RabbitMQ](https://spring.io/guides/gs/messaging-rabbitmq/)

### Maven Parent overrides

Due to Maven's design, elements are inherited from the parent POM to the project POM.
While most of the inheritance is fine, it also inherits unwanted elements like `<license>` and `<developers>` from the parent.
To prevent this, the project POM contains empty overrides for these elements.
If you manually switch to a different parent and actually want the inheritance, you need to remove those overrides.

```

### mvnw

`$lang
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

### mvnw.cmd

`$lang
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

### pom.xml

`$lang
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
	<artifactId>file-service</artifactId>
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
		<spring-cloud.version>2025.0.2</spring-cloud.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-actuator</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-amqp</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>io.minio</groupId>
			<artifactId>minio</artifactId>
			<version>8.5.7</version>
		</dependency>

		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-config</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.cloud</groupId>
			<artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
		</dependency>

		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.amqp</groupId>
			<artifactId>spring-rabbit-test</artifactId>
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

### src/main/java/com/final_project/file_service/api/controller/BlogController.java

`$lang
package com.final_project.file_service.api.controller;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Controller
@AllArgsConstructor
@RequestMapping("/file/blog")
public class BlogController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;

    private final FileStoragePort fileStoragePort;
    @PostMapping("/post/{postId}")
    public String upload(@RequestParam MultipartFile file, String postId) throws IOException {
        FileMetadata fileMetadata = new  FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                postId,
                OwnerType.USER,
                FileCategory.BLOG,
                null

        );
        return fileService.upload(fileMetadata, file.getInputStream());
    }

    @GetMapping("/post/{postId}")
    public String getBlogPost(@PathVariable String postId) throws IOException{
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(postId, FileCategory.BLOG);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getFileName());
    }


}
```

### src/main/java/com/final_project/file_service/api/controller/DepartmentController.java

`$lang
package com.final_project.file_service.api.controller;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@AllArgsConstructor
@RequestMapping("/file/department")
public class DepartmentController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/logo/{id}")
    public String uploadProfile(@RequestParam MultipartFile file,
                                @PathVariable String id) throws IOException {
        FileMetadata fileMetadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.FACULTY,
                FileCategory.LOGO,
                null
        );
        return fileService.upload(fileMetadata, file.getInputStream());
    }

    @GetMapping("/logo/{id}")
    public String getProfile(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey());
    }
}
```

### src/main/java/com/final_project/file_service/api/controller/EmployeeController.java

`$lang
package com.final_project.file_service.api.controller;


import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/file/employee")
@AllArgsConstructor
public class EmployeeController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/profile")
    public String uploadProfile(@RequestParam MultipartFile file,
                                @PathVariable String id) throws IOException {
        FileMetadata fileMetadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.EMPLOYEE,
                FileCategory.PROFILE,
                null
        );
        return fileService.upload(fileMetadata, file.getInputStream());
    }

    @GetMapping("/profile/{id}")
    public String getProfile(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.PROFILE);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey());
    }
}
```

### src/main/java/com/final_project/file_service/api/controller/FacultyController.java

`$lang
package com.final_project.file_service.api.controller;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@AllArgsConstructor
@RequestMapping("/file/faculty")
public class FacultyController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/logo/{id}")
    public String uploadProfile(@RequestParam MultipartFile file,
                                @PathVariable String id) throws IOException {
        FileMetadata fileMetadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.FACULTY,
                FileCategory.LOGO,
                null
        );
        return fileService.upload(fileMetadata, file.getInputStream());
    }

    @GetMapping("/logo/{id}")
    public String getProfile(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey());
    }
}
```

### src/main/java/com/final_project/file_service/api/controller/GlobalExceptionController.java

`$lang
package com.final_project.file_service.api.controller;

import com.final_project.file_service.api.dto.ErrorResponse;
import com.final_project.file_service.domain.service.*;
import io.minio.messages.Bucket;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionController {


    @ExceptionHandler(value = { NotDownloadException.class })
    public ResponseEntity<ErrorResponse> downloadError(NotDownloadException e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.NOT_ACCEPTABLE.value(), LocalDateTime.now()),
                HttpStatus.NOT_ACCEPTABLE
        );
    }
    @ExceptionHandler(value = { NotUploadException.class })
    public ResponseEntity<ErrorResponse> uploadError(NotUploadException e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now()),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
    @ExceptionHandler(value = NotGenerateURLException.class)
    public ResponseEntity<ErrorResponse> generateURLError(NotGenerateURLException e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND.value(), LocalDateTime.now()),
                HttpStatus.NOT_FOUND
        );
    }

    @ExceptionHandler(value = BucketCreationFail.class)
    public ResponseEntity<ErrorResponse> bucketCreationFail(BucketCreationFail e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now()),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }

    @ExceptionHandler(value = FileNotFound.class)
    public ResponseEntity<ErrorResponse> get(FileNotFound e) {
        return new ResponseEntity<>(
                new ErrorResponse(e.getMessage(), HttpStatus.NOT_FOUND.value(), LocalDateTime.now()),
                HttpStatus.NOT_FOUND
        );
    }


}
```

### src/main/java/com/final_project/file_service/api/controller/StudentController.java

`$lang
package com.final_project.file_service.api.controller;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;

@RestController
@AllArgsConstructor
@RequestMapping("/file/student")
public class StudentController {
    private final FileService fileService;
    private final FileRecordService  fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/profile/{id}")
    public String uploadProfile(@RequestParam MultipartFile file,
                                @PathVariable String id) throws IOException {
        FileMetadata metadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.STUDENT,
                FileCategory.PROFILE,
                null
        );

        return fileService.upload(metadata, file.getInputStream());
    }

    @GetMapping("/profile/{id}")
    public String getProfile(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.PROFILE);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey());
    }
}
```

### src/main/java/com/final_project/file_service/api/controller/TeacherController.java

`$lang
package com.final_project.file_service.api.controller;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@AllArgsConstructor
@RequestMapping("/file/teacher")
public class TeacherController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/profile/{id}")
    public String uploadProfile(@RequestParam MultipartFile file,
                                @PathVariable String id) throws IOException {
        FileMetadata fileMetadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.TEACHER,
                FileCategory.PROFILE,
                null
        );
        return fileService.upload(fileMetadata, file.getInputStream());
    }

    @GetMapping("/profile/{id}")
    public String getProfile(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.PROFILE);
        return fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey());
    }
}
```

### src/main/java/com/final_project/file_service/api/controller/UniversityController.java

`$lang
package com.final_project.file_service.api.controller;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import lombok.AllArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@RestController
@AllArgsConstructor
@RequestMapping("/file/university")
public class UniversityController {
    private final FileService fileService;
    private final FileRecordService fileRecordService;
    private final FileStoragePort fileStoragePort;
    @PostMapping("/logo/{id}")
    public ResponseEntity<String> uploadLogo(@RequestParam MultipartFile file, @PathVariable String id) throws IOException {
        FileMetadata fileMetadata = new FileMetadata(
                file.getOriginalFilename(),
                file.getContentType(),
                id,
                OwnerType.UNIVERSITY,
                FileCategory.LOGO,
                null
        );
        return new  ResponseEntity<>(fileService.upload(fileMetadata, file.getInputStream()), HttpStatus.CREATED);
    }

    @GetMapping("/logo/{id}")
    public ResponseEntity<String> getLogo(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);
        return new ResponseEntity<>(fileStoragePort.generatePresignedUrl(file.getBucket(), file.getObjectKey()), HttpStatus.OK);
    }
    @DeleteMapping("/logo/{id}")
    public ResponseEntity<Void>   deleteLogo(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);
        fileStoragePort.delete(file.getBucket(), file.getObjectKey());
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    @GetMapping("/logo/{id}/download")
    public ResponseEntity<byte[]> downloadLogo(@PathVariable String id) throws IOException {
        FileRecord file = fileRecordService.findByOwnerIdAndCategory(id, FileCategory.LOGO);

        InputStream stream = fileStoragePort.download(file.getBucket(), file.getObjectKey());
        byte[] content = stream.readAllBytes();
        return ResponseEntity
                .ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(content);
    }
}
```

### src/main/java/com/final_project/file_service/api/dto/BaseUploadRequest.java

`$lang
package com.final_project.file_service.api.dto;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.OwnerType;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class BaseUploadRequest {
    private MultipartFile file;
    private String ownerId;
    private OwnerType ownerType;
    private FileCategory fileCategory;
    private String subFolder;
}
```

### src/main/java/com/final_project/file_service/api/dto/Blog.java

`$lang
package com.final_project.file_service.api.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class Blog {
    public MultipartFile file;
    private String userId;
    private String blogId;
}

```

### src/main/java/com/final_project/file_service/api/dto/ErrorResponse.java

`$lang
package com.final_project.file_service.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ErrorResponse {
    private String message;
    private int code;
    private LocalDateTime timestamp;
}
```

### src/main/java/com/final_project/file_service/api/dto/StudentRequest.java

`$lang
package com.final_project.file_service.api.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class StudentRequest {
    private MultipartFile file;
    private String studentId;
    private String eventId;
}
```

### src/main/java/com/final_project/file_service/api/dto/TeacherRequest.java

`$lang
package com.final_project.file_service.api.dto;

import org.springframework.web.multipart.MultipartFile;

public class TeacherRequest {
    private MultipartFile file;
    private String teacherId;
}
```

### src/main/java/com/final_project/file_service/domain/model/FileCategory.java

`$lang
package com.final_project.file_service.domain.model;

public enum FileCategory {
    PROFILE, DOCUMENT,EVENT, BLOG, MEDIA, PRIVATE, LOGO
}
```

### src/main/java/com/final_project/file_service/domain/model/FileMetadata.java

`$lang
package com.final_project.file_service.domain.model;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;


@Data
public  class FileMetadata {
    private String id = UUID.randomUUID().toString();
    private final String fileName;
    private final String contentType;
    private final Instant uploadedAt = Instant.now();
    private final  String ownerId;
    private final OwnerType ownerType;
    private final FileCategory category;
    private final String subFolder;

    public FileMetadata(String fileName, String contentType,
                        String ownerId, OwnerType ownerType,
                        FileCategory category, String subFolder) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.ownerId = ownerId;
        this.ownerType = ownerType;
        this.category = category;
        this.subFolder = subFolder;
    }
}
```

### src/main/java/com/final_project/file_service/domain/model/FileRecord.java

`$lang
package com.final_project.file_service.domain.model;


import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@AllArgsConstructor
@Document(collection = "file_record")
public class FileRecord {
    @Id
    private String id;
    private String fileName;

    private String bucket;
    private String objectKey;

    private String ownerId;
    private OwnerType ownerType;
    private FileCategory category;
    private String subFolder;
    private Instant uploadedAt;
}
```

### src/main/java/com/final_project/file_service/domain/model/OwnerType.java

`$lang
package com.final_project.file_service.domain.model;

public enum OwnerType {
    STUDENT,
    TEACHER, EMPLOYEE,
    ADMIN,
    UNIVERSITY,
    FACULTY,
    DEPARTMENT,
    PUBLIC,
    USER
}
```

### src/main/java/com/final_project/file_service/domain/ports/BucketStrategy.java

`$lang
package com.final_project.file_service.domain.ports;

import com.final_project.file_service.domain.model.FileMetadata;

public interface BucketStrategy {
    String resolveBucket(FileMetadata fileMetadata);
    String resolveKey(FileMetadata fileMetadata);
}
```

### src/main/java/com/final_project/file_service/domain/ports/FileStoragePort.java

`$lang
package com.final_project.file_service.domain.ports;

import java.io.InputStream;

public interface FileStoragePort {
    void upload(String buket, String key, InputStream stream, String contentType);
    InputStream download(String buket, String key);
    void delete(String buket, String key);
    String generatePresignedUrl(String buket, String key);
}
```

### src/main/java/com/final_project/file_service/domain/repo/FileRecordRepository.java

`$lang
package com.final_project.file_service.domain.repo;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface FileRecordRepository extends MongoRepository<FileRecord, String > {
    Optional<FileRecord> findFirstByOwnerIdAndCategory(String ownerId, FileCategory category);
}
```

### src/main/java/com/final_project/file_service/domain/service/BucketCreationFail.java

`$lang
package com.final_project.file_service.domain.service;

public class BucketCreationFail extends RuntimeException {
    public BucketCreationFail(String message) {
        super(message);
    }
}
```

### src/main/java/com/final_project/file_service/domain/service/FileNotFound.java

`$lang
package com.final_project.file_service.domain.service;

public class FileNotFound extends RuntimeException {
    public FileNotFound(String message) {
        super(message);
    }
}
```

### src/main/java/com/final_project/file_service/domain/service/FileRecordService.java

`$lang
package com.final_project.file_service.domain.service;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.repo.FileRecordRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class FileRecordService {
    private final FileRecordRepository fileRecordRepository;
    public void add(FileRecord fileRecord) {
        fileRecordRepository.save(fileRecord);
    }

    public void remove(FileRecord fileRecord) {
        fileRecordRepository.delete(fileRecord);
    }
    public FileRecord findByOwnerIdAndCategory(String ownerId, FileCategory category) {
        FileRecord file =  fileRecordRepository.findFirstByOwnerIdAndCategory(ownerId, category)
                .orElseThrow(() -> new FileNotFound("File Not Found"));
        return file;
    }
    public FileRecord updateFileName(String ownerId, FileCategory category, String fileName) {
        FileRecord file = fileRecordRepository.findFirstByOwnerIdAndCategory(ownerId, category)
                .orElseThrow(() -> new FileNotFound("File Not Found"));
        file.setFileName(fileName);
        fileRecordRepository.save(file);
        return file;
    }
}
```

### src/main/java/com/final_project/file_service/domain/service/FileService.java

`$lang
package com.final_project.file_service.domain.service;

import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.FileRecord;
import com.final_project.file_service.domain.ports.BucketStrategy;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.repo.FileRecordRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.Instant;

@Service
@AllArgsConstructor
public class FileService {
    @Qualifier("fileStoragePort")
    private final FileStoragePort storage;
    @Qualifier("bucketStrategy")
    private final BucketStrategy strategy;

    private final FileRecordService fileRecordService;
    public String upload(FileMetadata metadata, InputStream stream) {
        String bucket = strategy.resolveBucket(metadata);
        String key = strategy.resolveKey(metadata);
        FileRecord record = new FileRecord(
                null,
                metadata.getFileName(),
                bucket,
                key,
                metadata.getOwnerId(),
                metadata.getOwnerType(),
                metadata.getCategory(),
                metadata.getSubFolder(),
                Instant.now()
        );
        fileRecordService.add(record);
        storage.upload(bucket, key, stream, metadata.getContentType());
        return storage.generatePresignedUrl(bucket, key);
    }
    public InputStream download(FileMetadata metadata) {
        return storage.download(
                strategy.resolveBucket(metadata),
                strategy.resolveKey(metadata)
        );
    }

    public void delete(FileMetadata metadata) {
        storage.delete(
                strategy.resolveBucket(metadata),
                strategy.resolveKey(metadata)
        );
    }
}
```

### src/main/java/com/final_project/file_service/domain/service/NotDeleteException.java

`$lang
package com.final_project.file_service.domain.service;

public class NotDeleteException extends RuntimeException {
    public NotDeleteException(String message) {
        super(message);
    }
}
```

### src/main/java/com/final_project/file_service/domain/service/NotDownloadException.java

`$lang
package com.final_project.file_service.domain.service;

public class NotDownloadException extends RuntimeException {
    public NotDownloadException(String message) {
        super(message);
    }
}
```

### src/main/java/com/final_project/file_service/domain/service/NotGenerateURLException.java

`$lang
package com.final_project.file_service.domain.service;

public class NotGenerateURLException extends RuntimeException {
    public NotGenerateURLException(String message) {
        super(message);
    }
}
```

### src/main/java/com/final_project/file_service/domain/service/NotUploadException.java

`$lang
package com.final_project.file_service.domain.service;

public class NotUploadException extends RuntimeException {
    public NotUploadException(String message) {
        super(message);
    }
}
```

### src/main/java/com/final_project/file_service/FileServiceApplication.java

`$lang
package com.final_project.file_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FileServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(FileServiceApplication.class, args);
	}

}
```

### src/main/java/com/final_project/file_service/infrastructure/config/AppConfig.java

`$lang
package com.final_project.file_service.infrastructure.config;

import com.final_project.file_service.domain.ports.BucketStrategy;
import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.FileRecordService;
import com.final_project.file_service.domain.service.FileService;
import com.final_project.file_service.infrastructure.minio.MinioStorageAdapter;
import com.final_project.file_service.infrastructure.stradegy.UniversalBucketStrategy;
import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Value("${storage.url}")
    private String url;
    @Value("${storage.accessKey}")
    private String accessKey;
    @Value("${storage.secretKey}")
    private  String secretKey;

    @Bean
    public MinioClient minioClient(){
        return MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey, secretKey).build();
    }

    @Bean
    public BucketStrategy bucketStrategy(){
        return new UniversalBucketStrategy();
    }

    @Bean
    public FileStoragePort fileStoragePort(MinioClient client){
        return new MinioStorageAdapter(client);
    }
    @Bean
    public FileService fileService(FileStoragePort fileStoragePort, BucketStrategy bucketStrategy, FileRecordService fileRecordService){
        return new FileService(fileStoragePort,bucketStrategy, fileRecordService);
    }

}
```

### src/main/java/com/final_project/file_service/infrastructure/minio/MinioStorageAdapter.java

`$lang
package com.final_project.file_service.infrastructure.minio;

import com.final_project.file_service.domain.ports.FileStoragePort;
import com.final_project.file_service.domain.service.*;
import io.minio.*;
import io.minio.http.Method;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@AllArgsConstructor
public class MinioStorageAdapter implements FileStoragePort {
    private final MinioClient minioClient;
    @Override
    public void upload(String buket, String key, InputStream stream, String contentType) {
        try {
            ensureBucketExist(buket);
            minioClient.putObject(
                    PutObjectArgs
                            .builder()
                            .bucket(buket)
                            .object(key)
                            .stream(stream,-1,10485760)
                            .contentType(contentType)
                            .build()
            );
        }
        catch (Exception e) {
            throw new NotUploadException(e.getMessage());
        }
    }

    @Override
    public InputStream download(String buket, String key) {
        try{
            return minioClient.getObject(
                    GetObjectArgs
                            .builder()
                            .bucket(buket)
                            .object(key)
                            .build()
            );
        }catch (Exception e) {
            throw new NotDownloadException(e.getMessage());
        }
    }

    @Override
    public void delete(String buket, String key) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(buket)
                            .object(key)
                            .build()
            );
        }catch (Exception e) {
            throw new NotDeleteException(e.getMessage());
        }
    }


    @Override
    public String generatePresignedUrl(String buket, String key) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs
                            .builder()
                            .bucket(buket)
                            .object(key)
                            .method(Method.GET)
                            .build()
            );
        }
        catch (Exception e) {
            throw new NotGenerateURLException(e.getMessage());
        }
    }

    private boolean ensureBucketExist(String bucket)  {
        try {
            boolean found = minioClient.bucketExists(
                    BucketExistsArgs
                            .builder()
                            .bucket(bucket)
                            .build()
            );
            if(!found){
                minioClient.makeBucket(
                        MakeBucketArgs
                                .builder()
                                .bucket(bucket)
                                .build()
                );
            }
            return true;
        }catch (Exception e) {
            throw new BucketCreationFail(e.getMessage());
        }
    }
}
```

### src/main/java/com/final_project/file_service/infrastructure/stradegy/UniversalBucketStrategy.java

`$lang
package com.final_project.file_service.infrastructure.stradegy;

import com.final_project.file_service.domain.model.FileCategory;
import com.final_project.file_service.domain.model.FileMetadata;
import com.final_project.file_service.domain.model.OwnerType;
import com.final_project.file_service.domain.ports.BucketStrategy;
import org.springframework.stereotype.Service;

@Service
public class UniversalBucketStrategy implements BucketStrategy {
    @Override
    public String resolveBucket(FileMetadata m) {
        if (m.getCategory() == FileCategory.BLOG) return "blogs";

        switch (m.getOwnerType()) {
            case UNIVERSITY:
            case FACULTY:
            case DEPARTMENT:
                return "university-core";
            default:
                return "user-content";
        }
    }

    @Override
    public String resolveKey(FileMetadata m) {

        if (m.getCategory() == FileCategory.BLOG) {
            return "user/" + m.getOwnerId() + "/" + m.getSubFolder() + "/" + m.getFileName();
        }
        if (isUser(m.getOwnerType())) {
            String base = m.getOwnerType().name().toLowerCase() + "/" + m.getOwnerId() + "/";

            switch (m.getCategory()) {
                case PROFILE:
                    return base + "profile/" + m.getFileName();
                case DOCUMENT:
                    return base + "documents/" + m.getFileName();
                case EVENT:
                    return base + "events/" + m.getSubFolder() + "/" + m.getFileName();
                case PRIVATE:
                    return base + "private/" + m.getFileName();
                case LOGO:
                    return base + "logo/" + m.getFileName();
                default:
                    return base + "misc/" + m.getFileName();
            }
        }
        return "university/" + m.getOwnerId() + "/" + m.getCategory().name().toLowerCase() + "/" + m.getFileName();
    }
    private boolean isUser(OwnerType type) {
        return type == OwnerType.STUDENT ||
                type == OwnerType.TEACHER ||
                type == OwnerType.EMPLOYEE ||
                type == OwnerType.ADMIN ||
                type == OwnerType.USER;
    }
}
```

### src/main/resources/application.yaml

`$lang
spring:
  application:
    name: file-service
  config:
    import: optional:configserver:http://localhost:8888

```

### src/test/java/com/final_project/file_service/FileServiceApplicationTests.java

`$lang
package com.final_project.file_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class FileServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
```


