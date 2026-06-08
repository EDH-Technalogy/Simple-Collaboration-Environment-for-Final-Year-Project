# VIC CLI Application

## 1. Project Purpose

`vic` is a Git-like version control command-line application written in Go. It stores local repository data inside a `.vic/` directory and can synchronize commits, objects, refs, and activity events with a remote VIC server.

The application is built with Cobra. The executable starts in `main.go`, enters the root command in `cmd/cmd.go`, and then dispatches to command files under `cmd/`. The command layer calls implementation packages under `internal/`.

## 2. Project Structure

```text
cli_application/
|-- main.go
|-- go.mod
|-- go.sum
|-- cli-application.md
|-- cmd/
|   |-- cmd.go
|   |-- init.go
|   |-- add.go
|   |-- commit.go
|   |-- status.go
|   |-- diff.go
|   |-- log.go
|   |-- branch.go
|   |-- checkout.go
|   |-- merge.go
|   |-- remote.go
|   |-- auth.go
|   |-- clone.go
|   |-- fetch.go
|   |-- pull.go
|   |-- push.go
|   |-- watch.go
|-- internal/
|   |-- repo/
|   |-- objects/
|   |-- index/
|   |-- trees/
|   |-- commits/
|   |-- refs/
|   |-- config/
|   |-- session/
|   |-- authClient/
|   |-- remote/
|   |-- clone/
|   |-- push/
|   |-- merge/
|   |-- worktree/
|   |-- wsClient/
```

## 3. Program Entry Step By Step

### Step 1: `main.go`

`main.go` imports `github.com/elyasahmadi/vic/cmd` and calls:

```go
cmd.Execute()
```

This is the only executable entry point.

### Step 2: `cmd/cmd.go`

`cmd/cmd.go` defines the root Cobra command:

```go
var rootCmd = &cobra.Command{
    Use:   "vic",
    Short: "VIC - a Git-like version control tool",
    Long:  "vic stores snapshots of your files and syncs them with a remote VIC server.",
}
```

The `Execute()` function runs `rootCmd.Execute()`. If Cobra returns an error, it prints the error to `stderr` and exits with status code `1`.

### Step 3: Command Registration

Every command file has an `init()` function. Each `init()` function attaches its command to `rootCmd`.

Examples:

```go
func init() {
    rootCmd.AddCommand(initCmd)
}
```

For nested commands, such as `auth login`, the parent command registers children first and then registers the parent:

```go
authCmd.AddCommand(authLoginCmd)
authCmd.AddCommand(authLogoutCmd)
rootCmd.AddCommand(authCmd)
```

## 4. Local Repository Storage Model

When a repository is initialized, VIC creates this structure:

```text
.vic/
|-- HEAD
|-- config
|-- index
|-- objects/
|   |-- ab/
|   |   |-- cdef...
|-- refs/
|   |-- heads/
|   |-- remotes/
```

### `.vic/HEAD`

`HEAD` either points to a branch:

```text
ref: refs/heads/main
```

or stores a raw 40-character commit hash when the repository is in detached `HEAD` mode.

### `.vic/config`

The config file stores:

- core repository format version
- active server and active user
- named remotes and optional tokens

Example:

```ini
[core]
    repositoryformatversion = 0

[user]
    activeServer = http://localhost:3000
    activeUser = alice

[remote "origin"]
    url = http://localhost:3000/api/repos/alice/demo
```

### `.vic/index`

The index is the staging area. It is stored as JSON and contains entries like:

```json
{
  "version": 1,
  "entries": [
    {
      "path": "main.go",
      "mode": "100644",
      "hash": "..."
    }
  ]
}
```

### `.vic/objects`

Objects are content-addressed by SHA-1. VIC writes objects using Git-style raw bytes:

```text
<type> <size>\0<content>
```

Then it compresses those bytes with zlib and stores them under:

```text
.vic/objects/<first-two-hash-chars>/<remaining-hash-chars>
```

Supported object types used by this project are:

- `blob`: file content
- `tree`: directory structure
- `commit`: commit metadata, parents, tree hash, and message

## 5. Core Internal Packages

### `internal/repo`

This package manages repository discovery and initialization.

Operation steps:

1. `Init(dir)` creates `.vic/`.
2. It creates `.vic/objects`, `.vic/refs/heads`, and `.vic/refs/remotes`.
3. It writes `.vic/HEAD` pointing to `refs/heads/main`.
4. It writes the initial `.vic/config`.
5. `FindRepoRoot(dir)` walks upward until it finds `.vic/`.

### `internal/objects`

This package stores and reads content-addressed objects.

Operation steps:

1. Build canonical bytes with `type`, `size`, null byte, and content.
2. Hash canonical bytes with SHA-1.
3. Compress canonical bytes with zlib.
4. Store compressed bytes under `.vic/objects/xx/yyyy...`.
5. Read objects by reversing the process: read file, decompress, parse header, return type and content.

### `internal/index`

This package manages the staging area.

Operation steps:

1. `Load(vicDir)` reads `.vic/index`.
2. If the file does not exist, it returns an empty index.
3. `Upsert(entry)` adds or replaces a staged path.
4. `Remove(path)` removes a staged path.
5. `Save(vicDir)` writes the JSON index back to disk.

### `internal/trees`

This package converts the flat index into tree objects and reads tree objects back into flat path maps.

Operation steps:

1. Split every staged path into path parts.
2. Build an in-memory directory tree.
3. Sort names for deterministic object hashes.
4. Write child tree objects first.
5. Write the root tree object.
6. Return the root tree hash.

### `internal/commits`

This package creates, reads, and traverses commits.

Operation steps:

1. Validate that a tree hash and commit message exist.
2. Select author name and email from command input or environment defaults.
3. Write commit headers: tree, parent lines, author, committer.
4. Add a blank line and the commit message.
5. Store the result as a `commit` object.
6. Provide graph helpers such as `IsAncestor()` and `MergeBase()`.

### `internal/refs`

This package reads and writes branch pointers and `HEAD`.

Operation steps:

1. `HeadRefPath()` reads `.vic/HEAD`.
2. If `HEAD` begins with `ref:`, it returns the symbolic ref path.
3. Otherwise, it returns the detached commit hash.
4. `ReadRef()` reads a ref file and returns the stored hash.
5. `WriteRef()` creates parent directories and writes a hash.
6. `SetHEADToRef()` writes symbolic `HEAD`.
7. `SetHEADDetached()` writes a commit hash directly to `HEAD`.

## 6. Command Operations

## 6.1 `vic init [directory]`

Code path:

- `cmd/init.go`
- `internal/repo/repo.go`

Operation steps:

1. Read the current working directory with `os.Getwd()`.
2. If a directory argument is provided, create that directory.
3. Call `repo.Init(dir)`.
4. `repo.Init` creates `.vic/objects`, `.vic/refs/heads`, and `.vic/refs/remotes`.
5. Write `.vic/HEAD` with `ref: refs/heads/main`.
6. Write `.vic/config` with the core section.
7. Print the repository path.

Example:

```bash
vic init
vic init my-project
```

## 6.2 `vic add <path>...`

Code path:

- `cmd/add.go`
- `internal/index/index.go`
- `internal/objects/objects.go`

Operation steps:

1. Read the current working directory.
2. Find the repository root by walking upward until `.vic/` is found.
3. Load `.vic/index`.
4. For each command argument, convert relative paths to absolute paths.
5. If the argument is a directory, walk it recursively.
6. Skip `.vic/` during directory walking.
7. For each file, calculate the path relative to the repository root.
8. Reject paths outside the repository.
9. Read the file content.
10. Store the content as a `blob` object.
11. Detect file mode: `100644` for normal files, `100755` for executable files.
12. Upsert the entry into the index.
13. Save the index to `.vic/index`.

Example:

```bash
vic add main.go
vic add cmd internal
```

## 6.3 `vic commit -m "<message>"`

Code path:

- `cmd/commit.go`
- `internal/index/index.go`
- `internal/trees/trees.go`
- `internal/commits/commits.go`
- `internal/refs/refs.go`
- `internal/session/session.go`

Operation steps:

1. Validate that `-m` is not empty.
2. Find the repository root and `.vic/` directory.
3. Load the index.
4. Stop if the index has no entries.
5. Convert the index into tree objects.
6. Read `HEAD` to find the current branch ref or detached hash.
7. Read the current parent commit hash from the current ref.
8. If `.vic/MERGE_HEAD` exists, append that hash as a second parent.
9. Load the current authenticated user from the repository session.
10. Stop if no active logged-in user exists.
11. Build the author name from first and last name, or from username.
12. Write the commit object.
13. Move the current ref to the new commit hash.
14. Remove merge state files if they exist.
15. Print the branch, short commit hash, message, and staged file count.

Example:

```bash
vic commit -m "Add command documentation"
```

Important behavior:

- This project requires login before committing because commit author data is taken from the active session.
- The index is not cleared after commit; it remains the snapshot used for the next tree comparison.

## 6.4 `vic status`

Code path:

- `cmd/status.go`
- `internal/index`
- `internal/refs`
- `internal/commits`
- `internal/trees`
- `internal/objects`

Operation steps:

1. Find the repository root and `.vic/`.
2. Load the index and create a path-to-entry map.
3. Read `HEAD` and resolve the current commit hash.
4. If `HEAD` has a commit, read the commit tree recursively.
5. Walk every working-tree file except `.vic/`.
6. Hash each working-tree file as a blob without writing it.
7. Print the current branch or detached `HEAD` status.
8. Compare index against `HEAD` tree to find staged changes.
9. Compare working tree hashes against index to find unstaged changes.
10. Find files in the working tree that are not in the index.
11. Print staged, unstaged, and untracked sections.
12. If no changes exist, print that the working tree is clean.

Example:

```bash
vic status
```

## 6.5 `vic diff [paths...]`

Code path:

- `cmd/diff.go`
- `github.com/pmezard/go-difflib/difflib`

Operation steps for unstaged diff:

1. Find the repository root.
2. Load the index.
3. Hash working-tree files.
4. Select changed paths where working-tree hash differs from index hash.
5. Read old content from the staged blob in the object store.
6. Read new content from the working tree.
7. If either side is binary, print a binary-difference message.
8. Otherwise print a unified diff.

Operation steps for staged diff:

1. Load the `HEAD` tree.
2. Compare index entries against the `HEAD` tree.
3. Read old content from the `HEAD` blob.
4. Read new content from the index blob.
5. Print the unified diff.

Examples:

```bash
vic diff
vic diff cmd/status.go
vic diff --staged
```

## 6.6 `vic log`

Code path:

- `cmd/log.go`
- `internal/refs`
- `internal/commits`

Operation steps:

1. Find the repository root.
2. Resolve `HEAD` to the current commit hash.
3. If no commit exists, print `No commits yet.`
4. Read the current commit object.
5. Print commit hash, merge parents, author, parsed date, and first message line.
6. Move to the first parent.
7. Repeat until a commit has no parents.

Example:

```bash
vic log
```

## 6.7 `vic branch`

Code path:

- `cmd/branch.go`
- `internal/refs`

Operation steps for listing local branches:

1. Read `HEAD`.
2. Read files under `.vic/refs/heads`.
3. Sort branch names.
4. Print each branch and mark the current branch with `*`.

Operation steps for creating a branch:

1. Validate the branch name.
2. Resolve the current `HEAD` commit hash.
3. Stop if the repository has no commits.
4. Stop if the branch already exists.
5. Write `.vic/refs/heads/<name>` with the current commit hash.

Operation steps for deleting a branch:

1. Validate the branch name.
2. Stop if the target branch is the current branch.
3. Stop if the branch file does not exist.
4. Remove `.vic/refs/heads/<name>`.

Operation steps for remote branch listing:

1. Walk `.vic/refs/remotes`.
2. Print every remote-tracking branch as `remotes/<remote>/<branch>`.

Examples:

```bash
vic branch
vic branch feature/login
vic branch -d old-feature
vic branch -r
vic branch -a
```

## 6.8 `vic checkout <branch|commit>`

Code path:

- `cmd/checkout.go`
- `internal/refs`
- `internal/worktree`

Operation steps for local branch checkout:

1. Resolve the argument against `.vic/refs/heads/<branch>`.
2. Read the target commit hash.
3. Restore the working tree from that commit.
4. Rebuild the index to match the checked-out tree.
5. Set `HEAD` to `ref: refs/heads/<branch>`.

Operation steps for remote-tracking branch checkout:

1. Resolve the argument against `.vic/refs/remotes/<remote>/<branch>`.
2. Restore the working tree from that commit.
3. Rebuild the index.
4. Set `HEAD` directly to the commit hash, creating detached `HEAD`.

Operation steps for full commit hash checkout:

1. Accept the argument if it is 40 characters.
2. Restore the working tree from that commit.
3. Rebuild the index.
4. Set detached `HEAD`.

Operation steps for `checkout -b`:

1. Validate the new branch name.
2. Stop if the branch already exists.
3. Resolve the start point as local branch, remote-tracking branch, or full hash.
4. Write the new branch ref.
5. Set `HEAD` to the new branch.
6. Checkout the start-point commit.

Examples:

```bash
vic checkout main
vic checkout origin/main
vic checkout 0123456789abcdef0123456789abcdef01234567
vic checkout -b feature/auth main
vic checkout -b fix/pull origin/main
```

## 6.9 Worktree Checkout Internals

Code path:

- `internal/worktree/worktree.go`

Operation steps:

1. Read the target commit.
2. Read the target commit tree recursively.
3. Load the old index.
4. Remove files that were tracked before but are not present in the new tree.
5. For every blob in the new tree, read object content.
6. Create parent directories as needed.
7. Write file content to the working tree.
8. Preserve executable mode when tree entry mode is `100755`.
9. Build a new index from the checked-out tree.
10. Save the new index.

## 6.10 `vic merge <branch>`

Code path:

- `cmd/merge.go`
- `internal/merge/merge.go`
- `internal/commits`
- `internal/trees`
- `internal/worktree`

Operation steps:

1. Resolve the current branch and current commit hash.
2. Resolve the target branch from local refs or remote-tracking refs.
3. Stop if either side has no commit.
4. If the target is already an ancestor of the current commit, print `Already up to date.`
5. If the current commit is an ancestor of the target, fast-forward the current ref and checkout the target commit.
6. Otherwise, find the merge base.
7. Read the base tree, current tree, and target tree.
8. Call `merge.MergeTrees(base, ours, theirs)`.
9. Write merged file contents into the working tree.
10. Build and save a new index from the merge result.
11. If conflicts exist, write `.vic/MERGE_HEAD`, `.vic/MERGE_ORIG_HEAD`, and `.vic/MERGE_MSG`, then stop.
12. If no conflicts exist, write a merged tree from the index.
13. Create a merge commit with two parents.
14. Move the current branch ref to the merge commit.
15. Checkout the merge commit.

Conflict marker format for text files:

```text
<<<<<<< ours
...
=======
...
>>>>>>> theirs
```

Binary conflict behavior:

1. Detect binary conflicts by extension, null bytes, or invalid UTF-8.
2. Do not write text conflict markers into binary files.
3. Keep one side as a placeholder.
4. Record the file as a conflict for manual resolution.

Examples:

```bash
vic merge feature-x
vic add conflicted-file.txt
vic commit -m "Resolve merge"
```

## 6.11 `vic merge --continue`

Code path:

- `cmd/merge.go`

Operation steps:

1. Check that `.vic/MERGE_HEAD` exists.
2. Read the merge parent from `MERGE_HEAD`.
3. Read the commit message from `MERGE_MSG` or use `Merge`.
4. Resolve the current branch ref and parent hash.
5. Load the index.
6. Stop if nothing is staged.
7. Write a tree from the staged index.
8. Create a commit with two parents.
9. Move the current branch ref to the merge commit.
10. Checkout the merge commit.
11. Delete merge state files.

Example:

```bash
vic merge --continue
```

## 6.12 `vic merge --abort`

Code path:

- `cmd/merge.go`

Operation steps:

1. Check that `.vic/MERGE_HEAD` exists.
2. Read the original commit hash from `.vic/MERGE_ORIG_HEAD`.
3. Move the current branch ref back to the original hash.
4. Checkout the original commit.
5. Delete merge state files.

Example:

```bash
vic merge --abort
```

## 6.13 `vic remote`

Code path:

- `cmd/remote.go`
- `internal/config/config.go`

### `vic remote add <name> <url>`

Operation steps:

1. Validate name and URL.
2. Load `.vic/config`.
3. Stop if the remote name already exists.
4. Add the remote URL.
5. Save `.vic/config`.

### `vic remote list`

Operation steps:

1. Load `.vic/config`.
2. If no remotes exist, print `No remotes configured.`
3. Sort remote names.
4. Print each name and URL.

### `vic remote get-url <name>`

Operation steps:

1. Load `.vic/config`.
2. Look up the remote by name.
3. Print the configured URL.

### `vic remote set-token <name> <token>`

Operation steps:

1. Load `.vic/config`.
2. Look up the remote.
3. Store the token on that remote entry.
4. Save `.vic/config`.

Examples:

```bash
vic remote add origin http://localhost:3000/api/repos/acme/demo
vic remote list
vic remote get-url origin
vic remote set-token origin <token>
```

## 6.14 `vic auth login <server-url>`

Code path:

- `cmd/auth.go`
- `internal/authClient/client.go`
- `internal/session/session.go`
- `internal/config/config.go`

Operation steps:

1. Normalize the server URL to scheme and host.
2. Prompt for username or email.
3. Prompt for password.
4. Send `POST <server-url>/auth/login`.
5. Decode access token, refresh token, expiry, token type, and user data.
6. Store the session in the user-level file `~/.vic/sessions.json`.
7. If the command is run inside a VIC repository, load `.vic/config`.
8. Set `activeServer` and `activeUser`.
9. Save `.vic/config`.

Example:

```bash
vic auth login http://localhost:3000
```

## 6.15 `vic auth logout <server-url>`

Code path:

- `cmd/auth.go`
- `internal/session/session.go`

Operation steps:

1. Normalize the server URL.
2. Load `~/.vic/sessions.json`.
3. Delete every session key for that server.
4. Save the session file.

Example:

```bash
vic auth logout http://localhost:3000
```

## 6.16 Session Handling

Code path:

- `internal/session/session.go`

Operation steps:

1. Store sessions in `~/.vic/sessions.json`.
2. Use a session key in this form: `<server-url>|<username-or-email>`.
3. Normalize server URLs to scheme and host.
4. For authenticated operations, read `activeServer` and `activeUser` from `.vic/config`.
5. Load the matching session.
6. If the token expires soon, call `POST <server-url>/auth/refresh`.
7. Save the refreshed session.
8. Return the access token and user data.

## 6.17 `vic clone <url> [directory]`

Code path:

- `cmd/clone.go`
- `internal/remote/client.go`
- `internal/clone/download.go`
- `internal/worktree/worktree.go`

Operation steps:

1. Read the remote repository URL.
2. If no target directory is provided, derive it from the last URL path segment.
3. Stop if the target directory already exists.
4. Create the target directory.
5. Initialize a new VIC repository in the target directory.
6. Look for saved sessions for the remote server.
7. If exactly one saved user exists, reuse that token and active user.
8. Create a remote client for the repository URL.
9. Fetch remote refs with `GET /info/refs`.
10. Pick the remote `HEAD`, defaulting to `refs/heads/main` if missing.
11. Write advertised refs locally.
12. Write remote-tracking refs under `refs/remotes/origin/`.
13. Set local `HEAD` to the remote `HEAD` ref.
14. Save `origin` in `.vic/config`.
15. If the repository is empty, finish.
16. Download every object reachable from the head commit.
17. Checkout the head commit into the working tree.
18. Rebuild the index.

Example:

```bash
vic clone http://localhost:3000/api/repos/acme/demo
vic clone http://localhost:3000/api/repos/acme/demo demo-local
```

## 6.18 Remote Client Contract

Code path:

- `internal/remote/client.go`

The CLI talks to these server endpoints:

```text
GET  /info/refs
HEAD /objects/{hash}
GET  /objects/{hash}
POST /objects/{hash}
POST /refs/heads/{branch}
```

Operation details:

1. `GetInfoRefs()` downloads `HEAD` and the remote refs map.
2. `HasObject()` sends `HEAD` to check if the remote already has an object.
3. `DownloadObject()` downloads raw zlib object bytes.
4. `UploadObject()` uploads raw zlib object bytes.
5. `UpdateBranchRef()` advances the remote branch after object upload.
6. If a token exists, every request includes `Authorization: Bearer <token>`.

## 6.19 Reachable Object Download

Code path:

- `internal/clone/download.go`

Operation steps:

1. Start from a commit hash.
2. Skip empty hashes and hashes already seen.
3. Skip objects already stored locally.
4. Download the commit object from the server.
5. Store the raw compressed object locally.
6. Read the commit to find its tree and parents.
7. Download the tree recursively.
8. For every tree entry, download child trees and blobs.
9. Recursively download parent commits.

## 6.20 `vic fetch <remote>`

Code path:

- `cmd/fetch.go`
- `cmd.remoteClient()`
- `internal/clone/download.go`
- `internal/refs`

Operation steps:

1. Find the repository root.
2. Load the remote URL from `.vic/config`.
3. Derive the server base URL from the remote URL.
4. Require an active user in the repository config.
5. Ensure the saved session is valid and refresh it if needed.
6. Create an authenticated remote client.
7. Fetch remote refs with `GET /info/refs`.
8. For every advertised ref, download reachable objects.
9. For every remote branch, write `refs/remotes/<remote>/<branch>`.
10. Print that the fetch completed.

Example:

```bash
vic fetch origin
```

## 6.21 `vic pull <remote> <branch>`

Code path:

- `cmd/pull.go`
- `internal/clone`
- `internal/commits`
- `internal/refs`
- `internal/worktree`

Operation steps:

1. Authenticate using the same `remoteClient()` helper used by fetch.
2. Fetch remote refs.
3. Download reachable objects for every advertised ref.
4. Update remote-tracking refs.
5. Read the local branch ref.
6. Read the remote-tracking ref.
7. If the local branch does not exist, create it at the remote hash and checkout that commit.
8. If the remote hash is already an ancestor of the local hash, print `Already up to date.`
9. Check whether the local hash is an ancestor of the remote hash.
10. If not, stop and tell the user to run `vic merge <remote>/<branch>`.
11. If yes, write the local branch ref to the remote hash.
12. Checkout the remote hash into the working tree.

Example:

```bash
vic pull origin main
```

## 6.22 `vic push <remote> <branch>`

Code path:

- `cmd/push.go`
- `internal/push/upload.go`
- `internal/remote`
- `internal/commits`
- `internal/refs`

Operation steps:

1. Find the repository root.
2. Load the remote from `.vic/config`.
3. Derive the server base URL.
4. Require an active user.
5. Ensure the active user's session is valid.
6. Read the local branch hash.
7. Stop if the branch has no commits.
8. Fetch remote refs.
9. Read the remote branch hash.
10. If remote and local hashes match, print `Everything up-to-date.`
11. If the remote hash exists, ensure it is an ancestor of the local hash.
12. Stop on non-fast-forward push.
13. Upload every reachable object the server does not already have.
14. Advance the remote branch ref.

Example:

```bash
vic push origin main
```

## 6.23 Reachable Object Upload

Code path:

- `internal/push/upload.go`

Operation steps:

1. Start from the local branch tip commit.
2. Skip empty hashes and hashes already seen.
3. Ask the server whether it already has the commit.
4. Read the commit locally.
5. Upload parent commits first.
6. Upload the commit tree.
7. Upload all blobs reachable from the tree.
8. Upload the commit object itself if the server does not have it.
9. Upload raw zlib object bytes exactly as stored locally.

## 6.24 `vic watch`

Code path:

- `cmd/watch.go`
- `internal/wsClient/client.go`

Operation steps:

1. Find the repository root.
2. Load `.vic/config`.
3. Require an `origin` remote.
4. Derive the server base URL from `origin`.
5. Require an active user.
6. Ensure the saved session is valid.
7. Extract owner and repository name from the remote URL.
8. Create a WebSocket client.
9. Convert `http` to `ws` or `https` to `wss`.
10. Connect to `/ws/native` with the token.
11. Register handlers for `push`, `pull_request`, and `activity`.
12. Subscribe to `/repo/<owner>/<repo>/push`.
13. Print incoming notifications until the user presses `Ctrl+C`.

Example:

```bash
vic watch
```

## 7. Complete Local Workflow

This is the normal local operation order:

```bash
vic init my-project
cd my-project
vic auth login http://localhost:3000
vic add .
vic status
vic diff --staged
vic commit -m "Initial commit"
vic log
```

What happens internally:

1. `init` creates `.vic/`.
2. `auth login` stores a session and writes active user config.
3. `add` writes blob objects and updates `.vic/index`.
4. `status` compares `HEAD`, index, and working tree.
5. `diff --staged` compares `HEAD` tree against index.
6. `commit` writes tree objects, writes a commit object, and updates the current branch ref.
7. `log` follows parent commits from `HEAD`.

## 8. Complete Remote Workflow

```bash
vic remote add origin http://localhost:3000/api/repos/acme/demo
vic push origin main
vic fetch origin
vic pull origin main
vic watch
```

What happens internally:

1. `remote add` writes the remote URL into `.vic/config`.
2. `push` uploads reachable objects and advances the server branch ref.
3. `fetch` downloads remote objects and updates remote-tracking refs.
4. `pull` fetches and fast-forwards the local branch if possible.
5. `watch` connects to the server by WebSocket and listens for repository activity.

## 9. Complete Branch And Merge Workflow

```bash
vic branch feature-x
vic checkout feature-x
vic add .
vic commit -m "Work on feature"
vic checkout main
vic merge feature-x
```

Fast-forward case:

1. `merge` sees that `main` is an ancestor of `feature-x`.
2. It moves `main` to the feature commit.
3. It checks out the feature commit.

Three-way merge case:

1. `merge` finds a merge base.
2. It reads base, ours, and theirs trees.
3. It merges every path.
4. It writes merged files and index entries.
5. It creates a two-parent merge commit if there are no conflicts.

Conflict case:

```bash
vic merge feature-x
vic add resolved-file.txt
vic merge --continue
```

Abort case:

```bash
vic merge --abort
```

## 10. Build And Run

Build the CLI:

```bash
go build -o vic.exe .
```

Run directly with Go:

```bash
go run . status
```

Run tests for all packages:

```bash
go test ./...
```

## 11. Dependency Summary

The project uses these main dependencies:

- `github.com/spf13/cobra`: command-line command and flag framework
- `github.com/pmezard/go-difflib`: unified diff generation
- `github.com/gorilla/websocket`: WebSocket connection for `vic watch`

## 12. Important Constraints

- Repository commands must run inside a directory that has `.vic/` or below it.
- `commit`, `fetch`, `pull`, `push`, and `watch` require an active authenticated user.
- Remote operations require a configured remote URL.
- `pull` only performs fast-forward updates. Diverged history must be resolved with `merge`.
- Remote-tracking branches are stored under `.vic/refs/remotes/<remote>/<branch>`.
- Detached `HEAD` is supported when checking out a remote-tracking branch or full commit hash.
- Binary merge conflicts do not receive text conflict markers.
