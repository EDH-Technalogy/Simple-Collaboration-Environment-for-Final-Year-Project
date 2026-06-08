package main

import (
	"context"

	vicapp "github.com/elyasahmadi/vic/internal/app"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) InitRepository(path string) (string, error) {
	return vicapp.InitRepository(path)
}

func (a *App) OpenRepositoryFolder() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Open VIC Repository",
	})
}

func (a *App) PickParentFolder() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Choose Parent Folder",
	})
}

func (a *App) ListDesktopProjects() ([]vicapp.ProjectSummary, error) {
	return vicapp.ListDesktopProjects()
}

func (a *App) RememberDesktopProject(path string) (*vicapp.ProjectSummary, error) {
	return vicapp.RememberDesktopProject(path)
}

func (a *App) CreateDesktopProject(parentPath string, name string, initialize bool) (*vicapp.ProjectSummary, error) {
	return vicapp.CreateDesktopProject(parentPath, name, initialize)
}

func (a *App) CloneDesktopProject(url string, parentPath string, directoryName string) (*vicapp.ProjectSummary, error) {
	return vicapp.CloneDesktopProject(url, parentPath, directoryName)
}

func (a *App) RemoveDesktopProject(path string) error {
	return vicapp.RemoveDesktopProject(path)
}

func (a *App) HasRepository(path string) bool {
	return vicapp.HasRepository(path)
}

func (a *App) OpenPath(path string) error {
	return vicapp.OpenPath(path)
}

func (a *App) ReadWorkspaceFile(rootPath string, filePath string) (*vicapp.FileContent, error) {
	return vicapp.ReadWorkspaceFile(rootPath, filePath)
}

func (a *App) WriteWorkspaceFile(rootPath string, filePath string, content string) (*vicapp.FileContent, error) {
	return vicapp.WriteWorkspaceFile(rootPath, filePath, content)
}

func (a *App) WriteWorkspaceFileBase64(rootPath string, filePath string, encodedContent string) (*vicapp.FileContent, error) {
	return vicapp.WriteWorkspaceFileBase64(rootPath, filePath, encodedContent)
}

func (a *App) CreateWorkspaceFile(rootPath string, parentPath string, name string) (*vicapp.FileContent, error) {
	return vicapp.CreateWorkspaceFile(rootPath, parentPath, name)
}

func (a *App) CreateWorkspaceFolder(rootPath string, parentPath string, name string) (*vicapp.FolderEntry, error) {
	return vicapp.CreateWorkspaceFolder(rootPath, parentPath, name)
}

func (a *App) CopyWorkspacePath(rootPath string, sourcePath string) (*vicapp.FolderEntry, error) {
	return vicapp.CopyWorkspacePath(rootPath, sourcePath)
}

func (a *App) DeleteWorkspacePath(rootPath string, targetPath string) error {
	return vicapp.DeleteWorkspacePath(rootPath, targetPath)
}

func (a *App) ListFolder(rootPath string, folderPath string) ([]vicapp.FolderEntry, error) {
	return vicapp.ListFolder(rootPath, folderPath)
}

func (a *App) GetRepositoryTree(repoPath string) (*vicapp.FileTreeNode, error) {
	return vicapp.GetRepositoryTree(repoPath)
}

func (a *App) CurrentUserProfile(repoPath string) (*vicapp.UserProfile, error) {
	return vicapp.CurrentUserProfile(repoPath)
}

func (a *App) EnsureRepositoryAccess(repoPath string, username string, email string) error {
	return vicapp.EnsureRepositoryAccess(repoPath, username, email)
}

func (a *App) SetRepositoryOwner(repoPath string, username string, email string, serverURL string) error {
	return vicapp.SetRepositoryOwner(repoPath, username, email, serverURL)
}

func (a *App) AddFiles(repoPath string, files []string) error {
	return vicapp.AddFiles(repoPath, files)
}

func (a *App) UnstageFiles(repoPath string, files []string) error {
	return vicapp.UnstageFiles(repoPath, files)
}

func (a *App) AddAll(repoPath string) error {
	return vicapp.AddFiles(repoPath, []string{"."})
}

func (a *App) Commit(repoPath string, message string) (*vicapp.CommitResult, error) {
	return vicapp.Commit(repoPath, message)
}

func (a *App) Log(repoPath string) ([]vicapp.CommitHistoryEntry, error) {
	return vicapp.Log(repoPath)
}

func (a *App) Status(repoPath string) (*vicapp.StatusResult, error) {
	return vicapp.Status(repoPath)
}

func (a *App) ListBranches(repoPath string, includeRemote bool) ([]vicapp.Branch, error) {
	return vicapp.ListBranches(repoPath, includeRemote)
}

func (a *App) CreateBranch(repoPath string, name string) error {
	return vicapp.CreateBranch(repoPath, name)
}

func (a *App) Checkout(repoPath string, target string) error {
	return vicapp.Checkout(repoPath, target)
}

func (a *App) CreateAndCheckoutBranch(repoPath string, name string, startPoint string) error {
	return vicapp.CreateAndCheckoutBranch(repoPath, name, startPoint)
}

func (a *App) DeleteBranch(repoPath string, name string) error {
	return vicapp.DeleteBranch(repoPath, name)
}

func (a *App) AddRemote(repoPath string, name string, url string) error {
	return vicapp.AddRemote(repoPath, name, url)
}

func (a *App) SetRemoteToken(repoPath string, name string, token string) error {
	return vicapp.SetRemoteToken(repoPath, name, token)
}

func (a *App) ListRemotes(repoPath string) ([]vicapp.Remote, error) {
	return vicapp.ListRemotes(repoPath)
}

func (a *App) Fetch(repoPath string, remote string) error {
	return vicapp.Fetch(repoPath, remote)
}

func (a *App) Push(repoPath string, remote string, branch string) error {
	return vicapp.Push(repoPath, remote, branch)
}

func (a *App) Pull(repoPath string, remote string, branch string) error {
	return vicapp.Pull(repoPath, remote, branch)
}

func (a *App) Login(repoPath string, serverURL string, identifier string, password string) (*vicapp.DesktopSession, error) {
	return vicapp.LoginWithSession(repoPath, serverURL, identifier, password)
}

func (a *App) Logout(serverURL string) error {
	return vicapp.Logout(serverURL)
}

func (a *App) ListDesktopSessions() ([]vicapp.DesktopSession, error) {
	return vicapp.ListDesktopSessions()
}

func (a *App) VicCommandCatalog() []string {
	return vicapp.VicCommandCatalog()
}

func (a *App) RunVicCommand(repoPath string, args []string) (*vicapp.VicCommandResult, error) {
	return vicapp.RunVicCommand(repoPath, args)
}
