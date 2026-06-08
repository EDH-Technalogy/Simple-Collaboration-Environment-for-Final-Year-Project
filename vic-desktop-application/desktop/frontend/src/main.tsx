import './utils/syncfusionLicense'
import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import {
  DocumentEditorContainerComponent,
  Inject,
  Ribbon,
  Toolbar,
} from '@syncfusion/ej2-react-documenteditor'
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  File,
  FileCode2,
  FileImage,
  FileText,
  FileType,
  FolderPlus,
  Folder,
  FolderGit2,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  HardDrive,
  LogIn,
  LogOut,
  MoreHorizontal,
  Moon,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Save,
  Search,
  Send,
  Sun,
  Upload,
  User,
  X,
} from 'lucide-react'
import '@syncfusion/ej2-base/styles/material-dark.css'
import '@syncfusion/ej2-buttons/styles/material-dark.css'
import '@syncfusion/ej2-inputs/styles/material-dark.css'
import '@syncfusion/ej2-lists/styles/material-dark.css'
import '@syncfusion/ej2-dropdowns/styles/material-dark.css'
import '@syncfusion/ej2-popups/styles/material-dark.css'
import '@syncfusion/ej2-navigations/styles/material-dark.css'
import '@syncfusion/ej2-ribbon/styles/material-dark.css'
import '@syncfusion/ej2-splitbuttons/styles/material-dark.css'
import '@syncfusion/ej2-calendars/styles/material-dark.css'
import '@syncfusion/ej2-icons/styles/material.css'
import '@syncfusion/ej2-react-documenteditor/styles/material-dark.css'
import AvatarComponent from './components/Avatar'
import Button from './components/Button'
import Field from './components/Field'
import Select from './components/Select'
import './index.css'

type FileStatus = { path: string; status: string }
type StatusResult = {
  branch: string
  headHash: string
  hasCommit: boolean
  clean: boolean
  staged: FileStatus[]
  unstaged: FileStatus[]
  untracked: string[]
}
type Branch = { name: string; current: boolean; remote: boolean }
type CommitHistoryEntry = {
  hash: string
  shortHash: string
  parents: string[]
  author: string
  date: string
  message: string
  subject: string
}
type RemoteEntry = { name: string; url: string }
type FileTreeNode = {
  name: string
  path: string
  relative: string
  isDir: boolean
  size: number
  modified: string
  status: string
  children: FileTreeNode[]
}
type FileContent = {
  name: string
  path: string
  relative: string
  extension: string
  kind: string
  content: string
  encodedContent: string
  previewText: string
  wordCompatibilityNotes: string[]
  size: number
  binary: boolean
  editable: boolean
}
type UserProfile = {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  image: string
  photoUrl?: string
  status: string
  emailVerified: boolean
  loggedIn: boolean
  roles: string[]
}
type DesktopSession = {
  serverUrl: string
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresAt: number
  profile: UserProfile
}
type ProjectSummary = {
  name: string
  path: string
  tracked: boolean
  lastOpened: string
  modified: string
}

type ThemeMode = 'dark' | 'light'
type LanguageCode = 'en' | 'fa' | 'ps'
type PendingCreate = { kind: 'file' | 'folder'; parentPath: string }
type GitTab = 'log' | 'changes'
type TreeContextMenuState = { x: number; y: number; node: FileTreeNode } | null

const defaultServerURL = 'http://localhost:8080'
const defaultSyncfusionDocumentServiceUrl = 'http://localhost:6002/api/documenteditor/'
const hostedSyncfusionDocumentServiceUrl = 'https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/'
const syncfusionDocumentServiceUrl =
  import.meta.env.VITE_SYNCFUSION_DOC_EDITOR_SERVICE_URL ||
  defaultSyncfusionDocumentServiceUrl

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    loginTitle: 'Sign in to open your repositories',
    username: 'Username or email',
    password: 'Password',
    login: 'Login',
    signingIn: 'Signing in...',
    logout: 'Logout',
    openRepository: 'Open Repository Folder',
    projectsSubtitle: 'Select a project workspace',
    fetch: 'Fetch',
    pull: 'Pull',
    push: 'Push',
    changes: 'Changes',
    stageAll: 'Stage All',
    commitMessage: 'Commit message',
    commit: 'Commit to VIC',
  },
  fa: {
    loginTitle: 'برای باز کردن مخزن‌ها وارد شوید',
    username: 'نام کاربری یا ایمیل',
    password: 'رمز عبور',
    login: 'ورود',
    signingIn: 'در حال ورود...',
    logout: 'خروج',
    openRepository: 'باز کردن پوشه مخزن',
    projectsSubtitle: 'یک فضای کاری پروژه را انتخاب کنید',
    fetch: 'دریافت',
    pull: 'به‌روزرسانی',
    push: 'ارسال',
    changes: 'تغییرات',
    stageAll: 'آماده‌سازی همه',
    commitMessage: 'پیام کامیت',
    commit: 'ثبت در VIC',
  },
  ps: {
    loginTitle: 'د زېرمتونونو پرانیستلو لپاره ننوزئ',
    username: 'کارن نوم يا برېښنالیک',
    password: 'پټ نوم',
    login: 'ننوتل',
    signingIn: 'ننوتل روان دي...',
    logout: 'وتل',
    openRepository: 'د زېرمتون پوښۍ پرانیزئ',
    projectsSubtitle: 'د پروژې کاري ځای وټاکئ',
    fetch: 'راواخلئ',
    pull: 'راکش کړئ',
    push: 'ولېږئ',
    changes: 'بدلونونه',
    stageAll: 'ټول چمتو کړئ',
    commitMessage: 'د کامېټ پیغام',
    commit: 'په VIC کې ثبت کړئ',
  },
}

function App() {
  const [session, setSession] = useState<DesktopSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [repoPath, setRepoPath] = useState('')
  const [repoTree, setRepoTree] = useState<FileTreeNode | null>(null)
  const [status, setStatus] = useState<StatusResult | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [remotes, setRemotes] = useState<RemoteEntry[]>([])
  const [commitHistory, setCommitHistory] = useState<CommitHistoryEntry[]>([])
  const [openedFiles, setOpenedFiles] = useState<FileContent[]>([])
  const [activeFilePath, setActiveFilePath] = useState('')
  const [dirtyFilePaths, setDirtyFilePaths] = useState<Set<string>>(new Set())
  const [selectedTreeNode, setSelectedTreeNode] = useState<FileTreeNode | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [pendingCreate, setPendingCreate] = useState<PendingCreate | null>(null)
  const [pendingCreateName, setPendingCreateName] = useState('')
  const [quickCreateKind, setQuickCreateKind] = useState<PendingCreate['kind'] | null>(null)
  const [quickCreateName, setQuickCreateName] = useState('')
  const [quickCreateError, setQuickCreateError] = useState('')
  const [treeContextMenu, setTreeContextMenu] = useState<TreeContextMenuState>(null)
  const [activeGitTab, setActiveGitTab] = useState<GitTab>('log')
  const [branchPopupOpen, setBranchPopupOpen] = useState(false)
  const [commitPanelOpen, setCommitPanelOpen] = useState(true)
  const [selectedCommitHash, setSelectedCommitHash] = useState('')
  const [query, setQuery] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const [newBranchName, setNewBranchName] = useState('')
  const [mergeBranchName, setMergeBranchName] = useState('')
  const [remoteName, setRemoteName] = useState('origin')
  const [clonePanelOpen, setClonePanelOpen] = useState(false)
  const [dashboardActionsOpen, setDashboardActionsOpen] = useState(false)
  const [cloneUrl, setCloneUrl] = useState('')
  const [cloneParentPath, setCloneParentPath] = useState('')
  const [cloneDirectoryName, setCloneDirectoryName] = useState('')
  const [cloneBusy, setCloneBusy] = useState(false)
  const [notice, setNotice] = useState('Sign in to load your VIC projects.')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('vic-theme') as ThemeMode) || 'dark')
  const [language, setLanguage] = useState<LanguageCode>(() => (localStorage.getItem('vic-language') as LanguageCode) || 'en')
  const workspaceGenerationRef = useRef(0)
  const dashboardActionsRef = useRef<HTMLDivElement | null>(null)

  const t = translations[language]
  const activeFile = openedFiles.find((file) => file.path === activeFilePath) ?? null
  const repoName = repoPath ? repoPath.split(/[\\/]/).filter(Boolean).pop() ?? repoPath : 'No repository'
  const branch = status?.branch || 'main'
  const tracked = Boolean(status)
  const statusByPath = useMemo(() => buildStatusMap(status), [status])
  const allChangedFiles = useMemo(() => collectChangedFiles(status), [status])
  const selectedCommit = commitHistory.find((commit) => commit.hash === selectedCommitHash) ?? commitHistory[0] ?? null

  async function callBackend<T>(name: string, run: () => Promise<T>, options: { silentSuccess?: boolean } = {}) {
    try {
      const result = await run()
      if (!options.silentSuccess) setNotice(`${name} completed`)
      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setNotice(message)
      return null
    }
  }

  async function loadProjects() {
    const backend = await import('../wailsjs/go/main/App')
    const result = await callBackend('Projects refresh', () => backend.ListDesktopProjects(), { silentSuccess: true })
    setProjects(Array.isArray(result) ? (result as ProjectSummary[]) : [])
  }

  async function refreshRepository(path = repoPath) {
    if (!path) return
    const backend = await import('../wailsjs/go/main/App')
    const hasRepo = await backend.HasRepository(path)
    const tree = await callBackend('File tree refresh', () => backend.GetRepositoryTree(path))
    if (tree) {
      setRepoTree(tree as FileTreeNode)
      setExpanded((previous) => new Set([...previous, path]))
    }
    if (hasRepo) {
      const nextStatus = await callBackend('Status refresh', () => backend.Status(path))
      if (nextStatus) setStatus(normalizeStatus(nextStatus as StatusResult))
      const nextBranches = await callBackend('Branches refresh', () => backend.ListBranches(path, true))
      setBranches(Array.isArray(nextBranches) ? (nextBranches as Branch[]) : [])
      const nextRemotes = await callBackend('Remotes refresh', () => backend.ListRemotes(path), { silentSuccess: true })
      const remoteList = Array.isArray(nextRemotes) ? (nextRemotes as RemoteEntry[]) : []
      setRemotes(remoteList)
      if (remoteList.some((remote) => remote.name === 'origin')) setRemoteName('origin')
      else if (remoteList.length > 0 && !remoteList.some((remote) => remote.name === remoteName)) setRemoteName(remoteList[0].name)
      const nextHistory = await callBackend('Commit history refresh', () => backend.Log(path))
      setCommitHistory(Array.isArray(nextHistory) ? (nextHistory as CommitHistoryEntry[]) : [])
    } else {
      setStatus(null)
      setBranches([])
      setRemotes([])
      setCommitHistory([])
      setNotice('This folder is not initialized. Start tracking to create .vic.')
    }
    await loadProjects()
  }

  async function reloadProject(path = repoPath) {
    if (!path) return
    workspaceGenerationRef.current += 1
    setRepoTree(null)
    setStatus(null)
    setBranches([])
    setRemotes([])
    setCommitHistory([])
    setOpenedFiles([])
    setActiveFilePath('')
    setDirtyFilePaths(new Set())
    setSelectedTreeNode(null)
    setSelectedCommitHash('')
    setExpanded(new Set([path]))
    await refreshRepository(path)
  }

  async function openProject(path: string, options: { skipAccessCheck?: boolean } = {}) {
    if (!path) return
    const backend = await import('../wailsjs/go/main/App')
    const user = profile ?? session?.profile ?? null
    if (user?.loggedIn && !options.skipAccessCheck) {
      try {
        await backend.EnsureRepositoryAccess(path, user.username, user.email)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setNotice(`${message}. Opening in this desktop session anyway.`)
      }
    }
    const remembered = await callBackend('Remember project', () => backend.RememberDesktopProject(path), { silentSuccess: true })
    if (remembered === null) return
    setRepoPath(path)
    setOpenedFiles([])
    setActiveFilePath('')
    setSelectedTreeNode(null)
    setExpanded(new Set([path]))
    await refreshRepository(path)
  }

  async function openFolder() {
    const backend = await import('../wailsjs/go/main/App')
    const selected = await callBackend('Open repository', () => backend.OpenRepositoryFolder())
    if (typeof selected === 'string' && selected) await openProject(selected)
  }

  async function createDashboardFolder(initialize: boolean) {
    const backend = await import('../wailsjs/go/main/App')
    const parent = await callBackend('Choose parent folder', () => backend.PickParentFolder(), { silentSuccess: true })
    if (typeof parent !== 'string' || !parent) return
    const name = window.prompt(initialize ? 'New project name' : 'New folder name', initialize ? 'new-project' : 'new-folder')?.trim()
    if (!name) return
    const created = await callBackend(initialize ? 'Create project' : 'Create folder', () => backend.CreateDesktopProject(parent, name, initialize))
    if (!created) return
    const project = created as ProjectSummary
    if (initialize && session?.profile) {
      await callBackend('Set repository owner', () => backend.SetRepositoryOwner(project.path, session.profile.username, session.profile.email, session.serverUrl), { silentSuccess: true })
    }
    await loadProjects()
    await openProject(project.path, { skipAccessCheck: true })
  }

  async function removeRecentProject(path: string) {
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Remove recent project', () => backend.RemoveDesktopProject(path))
    setProjects((items) => items.filter((item) => item.path !== path))
  }

  async function pickCloneParentFolder() {
    const backend = await import('../wailsjs/go/main/App')
    const selected = await callBackend('Choose clone destination', () => backend.PickParentFolder(), { silentSuccess: true })
    if (typeof selected === 'string') setCloneParentPath(selected)
  }

  async function submitClone(event: FormEvent) {
    event.preventDefault()
    if (!cloneUrl.trim()) {
      setNotice('Repository URL is required.')
      return
    }
    if (!cloneParentPath.trim()) {
      setNotice('Choose a destination folder before cloning.')
      return
    }
    setCloneBusy(true)
    const backend = await import('../wailsjs/go/main/App')
    const cloned = await callBackend('Clone project', () => backend.CloneDesktopProject(cloneUrl, cloneParentPath, cloneDirectoryName))
    setCloneBusy(false)
    if (!cloned) return
    const project = cloned as ProjectSummary
    if (session?.profile) {
      await callBackend('Set repository owner', () => backend.SetRepositoryOwner(project.path, session.profile.username, session.profile.email, session.serverUrl), { silentSuccess: true })
    }
    setCloneUrl('')
    setCloneParentPath('')
    setCloneDirectoryName('')
    setClonePanelOpen(false)
    await loadProjects()
    await openProject(project.path, { skipAccessCheck: true })
  }

  async function startTracking() {
    if (!repoPath) return
    const backend = await import('../wailsjs/go/main/App')
    const initialized = await callBackend('Initialize repository', () => backend.InitRepository(repoPath))
    if (initialized && session?.profile) {
      await callBackend('Set repository owner', () => backend.SetRepositoryOwner(repoPath, session.profile.username, session.profile.email, session.serverUrl), { silentSuccess: true })
    }
    await refreshRepository(repoPath)
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setLoginBusy(true)
    const backend = await import('../wailsjs/go/main/App')
    const result = await callBackend('Login', () => backend.Login(repoPath, defaultServerURL, identifier, password))
    setLoginBusy(false)
    if (result) {
      const nextSession = result as DesktopSession
      setSession(nextSession)
      setProfile(nextSession.profile)
      setPassword('')
      setNotice(`Signed in as ${displayName(nextSession.profile)}`)
      await loadProjects()
    }
  }

  async function logout() {
    if (!session?.serverUrl) return
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Logout', () => backend.Logout(session.serverUrl))
    setSession(null)
    setProfile(null)
    closeProject()
  }

  function closeProject() {
    setRepoPath('')
    setRepoTree(null)
    setStatus(null)
    setOpenedFiles([])
    setActiveFilePath('')
    setSelectedTreeNode(null)
    setDirtyFilePaths(new Set())
    setExpanded(new Set())
    setCommitHistory([])
    setSelectedCommitHash('')
    setBranches([])
    setBranchPopupOpen(false)
    setCommitPanelOpen(false)
    setTreeContextMenu(null)
  }

  async function openFile(node: FileTreeNode) {
    if (!repoPath || node.isDir) return
    const backend = await import('../wailsjs/go/main/App')
    const result = await callBackend('Open file', () => backend.ReadWorkspaceFile(repoPath, node.path))
    if (!result) return
    const nextFile = result as FileContent
    setOpenedFiles((files) => {
      const exists = files.some((file) => file.path === nextFile.path)
      return exists ? files.map((file) => (file.path === nextFile.path ? nextFile : file)) : [...files, nextFile]
    })
    setActiveFilePath(nextFile.path)
  }

  async function saveFile(file: FileContent, expectedGeneration?: number) {
    if (expectedGeneration !== undefined && expectedGeneration !== workspaceGenerationRef.current) return
    if (!file.editable) return
    const backend = await import('../wailsjs/go/main/App')
    const saved = await callBackend('Save file', () => backend.WriteWorkspaceFile(repoPath, file.path, file.content))
    if (saved) {
      const nextFile = saved as FileContent
      setOpenedFiles((files) => files.map((item) => (item.path === nextFile.path ? nextFile : item)))
      setDirtyFilePaths((paths) => {
        const next = new Set(paths)
        next.delete(nextFile.path)
        return next
      })
      await refreshRepository(repoPath)
    }
  }

  async function saveBinaryFile(file: FileContent, encodedContent: string) {
    const backend = await import('../wailsjs/go/main/App')
    const saved = await callBackend('Save file', () => backend.WriteWorkspaceFileBase64(repoPath, file.path, encodedContent))
    if (saved) {
      const nextFile = saved as FileContent
      setOpenedFiles((files) => files.map((item) => (item.path === nextFile.path ? { ...nextFile, content: item.content } : item)))
      setDirtyFilePaths((paths) => {
        const next = new Set(paths)
        next.delete(nextFile.path)
        return next
      })
      await refreshRepository(repoPath)
    }
  }

  async function stageFile(path: string) {
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Stage file', () => backend.AddFiles(repoPath, [path]))
    await refreshRepository(repoPath)
  }

  async function unstageFile(path: string) {
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Unstage file', () => backend.UnstageFiles(repoPath, [path]))
    await refreshRepository(repoPath)
  }

  async function setFileStaged(path: string, staged: boolean) {
    if (staged) await stageFile(path)
    else await unstageFile(path)
  }

  async function showDiff(path: string, staged = false) {
    if (!repoPath || !path) return
    const backend = await import('../wailsjs/go/main/App')
    const args = staged ? ['diff', '--staged', path] : ['diff', path]
    const result = await callBackend('Show diff', () => backend.RunVicCommand(repoPath, args), { silentSuccess: true })
    if (result) {
      const commandResult = result as { stdout?: string; stderr?: string }
      const output = commandResult.stdout || commandResult.stderr || 'No diff output'
      setNotice(output.length > 260 ? `${output.slice(0, 260)}...` : output)
      setActiveGitTab('changes')
    }
  }

  function createParentPath() {
    if (!selectedTreeNode) return ''
    if (selectedTreeNode.isDir) return selectedTreeNode.relative || ''
    const parts = selectedTreeNode.relative.split(/[\\/]/)
    parts.pop()
    return parts.join('/') || ''
  }

  function beginCreate(kind: PendingCreate['kind']) {
    if (!repoPath) return
    const parentPath = createParentPath()
    setPendingCreate({ kind, parentPath })
    setPendingCreateName('')
    if (selectedTreeNode?.isDir) {
      setExpanded((previous) => new Set([...previous, selectedTreeNode.path]))
    }
  }

  async function submitPendingCreate(event: FormEvent) {
    event.preventDefault()
    if (!pendingCreate) return
    const name = pendingCreateName.trim()
    if (!name) return
    const created = pendingCreate.kind === 'file'
      ? await createFile(name, pendingCreate.parentPath)
      : await createFolder(name, pendingCreate.parentPath)
    if (created) {
      setPendingCreate(null)
      setPendingCreateName('')
    }
  }

  async function createFile(name: string, parentPath?: string) {
    if (!repoPath) {
      setNotice('Open a project before creating files.')
      setQuickCreateError('Open a project before creating files.')
      return false
    }
    if (!name) {
      setQuickCreateError('File name is required.')
      return false
    }
    const parent = parentPath || createParentPath()
    const backend = await import('../wailsjs/go/main/App')
    try {
      const file = await backend.CreateWorkspaceFile(repoPath, parent, name)
      await refreshRepository(repoPath)
      const nextFile = file as FileContent
      setOpenedFiles((files) => files.some((item) => item.path === nextFile.path) ? files : [...files, nextFile])
      setActiveFilePath(nextFile.path)
      setSelectedTreeNode(null)
      setNotice('Create file completed')
      setQuickCreateError('')
      return true
    } catch (error) {
      const message = errorMessage(error)
      setNotice(message)
      setQuickCreateError(message)
      return false
    }
  }

  function openQuickCreate(kind: PendingCreate['kind']) {
    setQuickCreateKind(kind)
    setQuickCreateName(suggestCreateName(kind, selectedTreeNode, repoTree))
    setQuickCreateError('')
  }

  async function submitQuickCreate(event: FormEvent) {
    event.preventDefault()
    const name = quickCreateName.trim()
    if (!quickCreateKind) return
    if (!name) {
      setQuickCreateError('Name is required.')
      return
    }
    const created = quickCreateKind === 'file' ? await createFile(name) : await createFolder(name)
    if (created) {
      setQuickCreateKind(null)
      setQuickCreateName('')
      setQuickCreateError('')
    }
  }

  async function createFolder(name: string, parentPath?: string) {
    if (!repoPath) {
      setNotice('Open a project before creating folders.')
      setQuickCreateError('Open a project before creating folders.')
      return false
    }
    if (!name) {
      setQuickCreateError('Folder name is required.')
      return false
    }
    const parent = parentPath || createParentPath()
    const backend = await import('../wailsjs/go/main/App')
    try {
      await backend.CreateWorkspaceFolder(repoPath, parent, name)
      await refreshRepository(repoPath)
      setNotice('Create folder completed')
      setQuickCreateError('')
      return true
    } catch (error) {
      const message = errorMessage(error)
      setNotice(message)
      setQuickCreateError(message)
      return false
    }
  }

  async function addRemote(name: string, url: string) {
    if (!repoPath) return
    if (!name.trim() || !url.trim()) {
      setNotice('Remote name and URL are required.')
      return
    }
    const backend = await import('../wailsjs/go/main/App')
    const added = await callBackend('Add remote', () => backend.AddRemote(repoPath, name, url))
    if (added !== null) {
      setRemoteName(name)
      await refreshRepository(repoPath)
    }
  }

  async function setRemoteToken(name: string, token: string) {
    if (!repoPath) return
    if (!name.trim() || !token.trim()) {
      setNotice('Remote name and token are required.')
      return
    }
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Set remote token', () => backend.SetRemoteToken(repoPath, name, token))
  }

  async function copySelectedPath() {
    if (!repoPath || !selectedTreeNode) return
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Copy item', () => backend.CopyWorkspacePath(repoPath, selectedTreeNode.path))
    await refreshRepository(repoPath)
  }

  async function deleteSelectedPath() {
    if (!repoPath || !selectedTreeNode) return
    if (!window.confirm(`Delete ${selectedTreeNode.name}?`)) return
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Delete item', () => backend.DeleteWorkspacePath(repoPath, selectedTreeNode.path))
    setOpenedFiles((files) => files.filter((file) => file.path !== selectedTreeNode.path))
    if (activeFilePath === selectedTreeNode.path) setActiveFilePath('')
    setSelectedTreeNode(null)
    await refreshRepository(repoPath)
  }

  async function stageAll() {
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Stage all', () => backend.AddAll(repoPath))
    await refreshRepository(repoPath)
  }

  async function commit() {
    if (!commitMessage.trim()) {
      setNotice('Commit message is required.')
      return
    }
    const backend = await import('../wailsjs/go/main/App')
    const result = await callBackend('Commit', () => backend.Commit(repoPath, commitMessage))
    if (result) {
      setCommitMessage('')
      await reloadProject(repoPath)
    }
  }

  async function commitAndPush() {
    if (!commitMessage.trim()) {
      setNotice('Commit message is required.')
      return
    }
    const backend = await import('../wailsjs/go/main/App')
    const result = await callBackend('Commit', () => backend.Commit(repoPath, commitMessage))
    if (!result) return
    setCommitMessage('')
    await callBackend('Push', () => backend.Push(repoPath, remoteName, branch))
    await reloadProject(repoPath)
  }

  async function checkoutTarget(target: string) {
    if (!repoPath || !target) return
    const backend = await import('../wailsjs/go/main/App')
    const checkedOut = await callBackend('Checkout', () => backend.Checkout(repoPath, target))
    if (checkedOut !== null) {
      setBranchPopupOpen(false)
      await reloadProject(repoPath)
    }
  }

  async function createAndSwitchBranch() {
    const name = newBranchName.trim()
    if (!repoPath || !name) return
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Create branch', () => backend.CreateAndCheckoutBranch(repoPath, name, ''))
    setNewBranchName('')
    setBranchPopupOpen(false)
    await reloadProject(repoPath)
  }

  async function mergeBranch() {
    const target = mergeBranchName.trim()
    if (!repoPath || !target) return
    const backend = await import('../wailsjs/go/main/App')
    await callBackend('Merge branch', () => backend.RunVicCommand(repoPath, ['merge', target]))
    setMergeBranchName('')
    await refreshRepository(repoPath)
    setBranchPopupOpen(false)
  }

  async function sync(action: 'fetch' | 'pull' | 'push') {
    const backend = await import('../wailsjs/go/main/App')
    if (action === 'fetch') await callBackend('Fetch', () => backend.Fetch(repoPath, remoteName))
    if (action === 'pull') await callBackend('Pull', () => backend.Pull(repoPath, remoteName, branch))
    if (action === 'push') await callBackend('Push', () => backend.Push(repoPath, remoteName, branch))
    await refreshRepository(repoPath)
  }

  useEffect(() => {
    async function boot() {
      const backend = await import('../wailsjs/go/main/App')
      const sessions = (await backend.ListDesktopSessions()) as DesktopSession[]
      if (sessions.length > 0) {
        setSession(sessions[0])
        setProfile(sessions[0].profile)
        setNotice(`Signed in as ${displayName(sessions[0].profile)}`)
      }
      await loadProjects()
    }
    void boot()
  }, [])

  useEffect(() => {
    localStorage.setItem('vic-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('vic-language', language)
    document.documentElement.lang = language
    document.documentElement.dir = language === 'en' ? 'ltr' : 'rtl'
  }, [language])

  useEffect(() => {
    if (!notice || notice === 'Sign in to load your VIC projects.' || notice.startsWith('Signed in as') || notice.includes('not initialized')) return
    const timeout = window.setTimeout(() => setNotice(''), 3800)
    return () => window.clearTimeout(timeout)
  }, [notice])

  useEffect(() => {
    function closeFloatingMenus() {
      setTreeContextMenu(null)
    }
    window.addEventListener('click', closeFloatingMenus)
    return () => window.removeEventListener('click', closeFloatingMenus)
  }, [])

  useEffect(() => {
    function closeDashboardActions(event: MouseEvent) {
      if (!dashboardActionsRef.current?.contains(event.target as Node)) setDashboardActionsOpen(false)
    }
    document.addEventListener('mousedown', closeDashboardActions)
    return () => document.removeEventListener('mousedown', closeDashboardActions)
  }, [])

  useEffect(() => {
    function handleSaveShortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return
      event.preventDefault()
      if (!activeFile) return
      if (activeFile.kind === 'word') {
        window.dispatchEvent(new CustomEvent('vic-save-docx', { detail: { path: activeFile.path } }))
        return
      }
      if (activeFile.editable) void saveFile(activeFile)
    }
    window.addEventListener('keydown', handleSaveShortcut, true)
    return () => window.removeEventListener('keydown', handleSaveShortcut, true)
  }, [activeFile, repoPath])

  useEffect(() => {
    if (!activeFile?.editable || !dirtyFilePaths.has(activeFile.path)) return
    const generationAtSchedule = workspaceGenerationRef.current
    const timeout = window.setTimeout(() => {
      void saveFile(activeFile, generationAtSchedule)
    }, 1200)
    return () => window.clearTimeout(timeout)
  }, [activeFile?.path, activeFile?.content, dirtyFilePaths])

  if (!session?.profile?.loggedIn) {
    return (
      <main className={`login-screen ${theme}`}>
        <header className="login-topbar">
          <div className="brand-block login-page-brand">
            <div className="brand-mark"><FolderGit2 size={20} /></div>
            <div className="min-w-0">
              <div className="brand-title">VIC Desktop</div>
              <div className="brand-subtitle">Version control workspace</div>
            </div>
          </div>
          <ShellPreferences theme={theme} language={language} onThemeChange={setTheme} onLanguageChange={setLanguage} compact />
        </header>
        <main className="login-content">
          <section className="login-panel">
            <div className="login-panel-header">
              <div className="login-avatar-preview"><User size={22} /></div>
              <div>
                <p className="login-eyebrow">Sign in</p>
                <h1>{t.loginTitle}</h1>
                <p>Use your auth-service account to continue.</p>
              </div>
            </div>
            <form className="login-form" onSubmit={handleLogin}>
              <div className="server-pill">Server: {defaultServerURL}</div>
              <Field
                label={t.username}
                value={identifier}
                onValueChange={setIdentifier}
                placeholder="you@example.com"
                iconD="M20 21a8 8 0 10-16 0M12 13a4 4 0 100-8 4 4 0 000 8"
                autoComplete="email"
              />
              <Field
                label={t.password}
                value={password}
                onValueChange={setPassword}
                type="password"
                iconD="M6 10V8a6 6 0 1112 0v2M5 10h14v12H5zM12 15v3"
                autoComplete="current-password"
              />
              <Button type="submit" icon={<LogIn size={16} />} loading={loginBusy} fullWidth>
                {loginBusy ? t.signingIn : t.login}
              </Button>
            </form>
            {notice ? <div className="notice-line login-notice">{notice}</div> : null}
          </section>
        </main>
      </main>
    )
  }

  if (!repoPath) {
    return (
      <main className={`project-dashboard ${theme}`}>
        <header className="dashboard-header">
          <div className="brand-block dashboard-brand">
            <div className="brand-mark"><FolderGit2 size={18} /></div>
            <div>
              <div className="brand-title">VIC Desktop</div>
              <div className="brand-subtitle">{t.projectsSubtitle}</div>
            </div>
          </div>
          <div className="header-actions">
            <div ref={dashboardActionsRef} className="toolbar-menu">
              <button className="icon-button" onClick={() => setDashboardActionsOpen((open) => !open)} title="Project actions"><MoreHorizontal size={17} /></button>
              {dashboardActionsOpen ? (
                <div className="toolbar-menu-panel dashboard-actions-menu">
                  <button onClick={() => { setDashboardActionsOpen(false); openFolder() }}><Plus size={14} /> {t.openRepository}</button>
                  <button onClick={() => { setDashboardActionsOpen(false); setClonePanelOpen((open) => !open) }}><Download size={14} /> Clone Project</button>
                  <button onClick={() => { setDashboardActionsOpen(false); void createDashboardFolder(true) }}><FolderGit2 size={14} /> Create Project</button>
                  <button onClick={() => { setDashboardActionsOpen(false); void createDashboardFolder(false) }}><FolderPlus size={14} /> Create Folder</button>
                  <div className="toolbar-menu-separator" />
                  <button onClick={() => { setDashboardActionsOpen(false); void logout() }}><LogOut size={14} /> {t.logout}</button>
                </div>
              ) : null}
            </div>
            <ShellPreferences theme={theme} language={language} onThemeChange={setTheme} onLanguageChange={setLanguage} compact />
            <button className="icon-button" title="Refresh projects" onClick={loadProjects}><RefreshCw size={17} /></button>
            <ProfileChip profile={profile} caption={session.serverUrl} />
          </div>
        </header>
        {notice ? <AppNotice message={notice} onDismiss={() => setNotice('')} /> : null}
        <section className="projects-view">
          {clonePanelOpen ? (
            <form className="clone-project-panel" onSubmit={submitClone}>
              <div className="clone-panel-header">
                <Download size={18} />
                <strong>Clone Project</strong>
              </div>
              <label>
                Repository URL
                <input value={cloneUrl} onChange={(event) => setCloneUrl(event.target.value)} placeholder="https://server/repository.git" />
              </label>
              <label>
                Destination folder
                <div className="clone-destination-row">
                  <input value={cloneParentPath} onChange={(event) => setCloneParentPath(event.target.value)} placeholder="Choose where to clone" />
                  <button type="button" onClick={pickCloneParentFolder}>Browse</button>
                </div>
              </label>
              <label>
                Project folder name
                <input value={cloneDirectoryName} onChange={(event) => setCloneDirectoryName(event.target.value)} placeholder="Auto from URL" />
              </label>
              <div className="clone-actions">
                <button type="button" className="ghost-button" onClick={() => setClonePanelOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={cloneBusy}>
                  <Download size={15} /> {cloneBusy ? 'Cloning...' : 'Clone'}
                </button>
              </div>
            </form>
          ) : null}
          {projects.map((project) => (
            <article className="project-card" key={project.path}>
              <button className="project-card-main" onClick={() => openProject(project.path)}>
                <div className="project-card-icon">{project.tracked ? <FolderGit2 size={20} /> : <Folder size={20} />}</div>
                <div className="min-w-0">
                  <strong>{project.name}</strong>
                  <span>{project.path}</span>
                </div>
                <small className={project.tracked ? 'tracked-pill' : 'plain-pill'}>
                  {project.tracked ? 'VIC repository' : 'Not initialized'}
                </small>
              </button>
              <button
                className="project-card-remove"
                title="Remove from recent projects"
                onClick={() => void removeRecentProject(project.path)}
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </section>
      </main>
    )
  }

  const staged = status?.staged ?? []
  const unstaged = status?.unstaged ?? []
  const untracked = status?.untracked ?? []

  return (
    <main className={`desktop-shell github-shell ${theme} ${activeFile?.kind === 'word' ? 'word-focus-shell' : ''}`}>
      <TopBar
        repoName={repoName}
        repoPath={repoPath}
        branch={branch}
        profile={profile}
        session={session}
        theme={theme}
        language={language}
        remoteName={remoteName}
        remotes={remotes}
        onRemoteChange={setRemoteName}
        onThemeChange={setTheme}
        onLanguageChange={setLanguage}
        onOpenProjects={closeProject}
        onCloseProject={closeProject}
        onLogout={logout}
        onFetch={() => sync('fetch')}
        onPull={() => sync('pull')}
        onPush={() => sync('push')}
        onCommit={() => setCommitPanelOpen((open) => !open)}
        onBranch={() => setBranchPopupOpen((open) => !open)}
        onRefresh={() => refreshRepository(repoPath)}
        onAddRemote={addRemote}
        onSetRemoteToken={setRemoteToken}
        labels={t}
      />
      {branchPopupOpen ? (
        <BranchPopup
          branch={branch}
          branches={branches}
          newBranchName={newBranchName}
          mergeBranchName={mergeBranchName}
          onNewBranchNameChange={setNewBranchName}
          onMergeBranchNameChange={setMergeBranchName}
          onCreateBranch={createAndSwitchBranch}
          onCheckout={checkoutTarget}
          onMerge={mergeBranch}
          onClose={() => setBranchPopupOpen(false)}
        />
      ) : null}
      {notice ? <AppNotice message={notice} onDismiss={() => setNotice('')} /> : null}

      <aside className="file-tree-sidebar">
        <div className="tree-toolbar">
          <button className="open-folder-button compact" onClick={openFolder}><Folder size={16} /> Open</button>
          <button className="icon-button" title="Refresh tree" onClick={() => refreshRepository(repoPath)}><RefreshCw size={16} /></button>
        </div>
        <div className="tree-action-bar">
          <button title="New file" onClick={() => openQuickCreate('file')}><File size={14} /> File</button>
          <button title="New folder" onClick={() => openQuickCreate('folder')}><FolderPlus size={14} /> Folder</button>
          <button title="Copy selected item" onClick={copySelectedPath} disabled={!selectedTreeNode}><Copy size={14} /> Copy</button>
          <button title="Delete selected item" onClick={deleteSelectedPath} disabled={!selectedTreeNode}><Trash2 size={14} /> Delete</button>
        </div>
        {quickCreateKind ? (
          <form className="quick-create-card" onSubmit={submitQuickCreate}>
            <label>{quickCreateKind === 'file' ? 'New file' : 'New folder'}</label>
            <small>Location: {createParentLabel(selectedTreeNode)}</small>
            <div>
              <input
                autoFocus
                value={quickCreateName}
                onChange={(event) => setQuickCreateName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setQuickCreateKind(null)
                    setQuickCreateName('')
                    setQuickCreateError('')
                  }
                }}
              />
              <button type="submit">Create</button>
            </div>
            {quickCreateError ? <p>{quickCreateError}</p> : null}
          </form>
        ) : null}
        <div className="search-box tree-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files" />
        </div>
        <div className="tree-root-label">
          <FolderGit2 size={15} />
          <span>{repoName}</span>
        </div>
        <div className="tree-scroll">
          {pendingCreate ? (
            <form className="inline-create-row" onSubmit={submitPendingCreate}>
              {pendingCreate.kind === 'file' ? <File size={15} /> : <FolderPlus size={15} />}
              <input
                autoFocus
                value={pendingCreateName}
                onChange={(event) => setPendingCreateName(event.target.value)}
                onBlur={() => {
                  if (!pendingCreateName.trim()) setPendingCreate(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setPendingCreate(null)
                    setPendingCreateName('')
                  }
                }}
                placeholder={pendingCreate.kind === 'file' ? 'filename.ext' : 'folder-name'}
              />
            </form>
          ) : null}
          {repoTree ? (
            <FileTree
              node={repoTree}
              query={query}
              expanded={expanded}
              statusByPath={statusByPath}
              selectedPath={selectedTreeNode?.path || activeFilePath}
              root
              onToggle={(path) => {
                setExpanded((previous) => {
                  const next = new Set(previous)
                  next.has(path) ? next.delete(path) : next.add(path)
                  return next
                })
              }}
              onSelect={setSelectedTreeNode}
              onOpenFile={openFile}
              onContextMenu={(event, node) => {
                event.preventDefault()
                setSelectedTreeNode(node)
                setTreeContextMenu({ x: event.clientX, y: event.clientY, node })
              }}
            />
          ) : (
            <div className="empty-state">Open a repository to load files.</div>
          )}
        </div>
        {treeContextMenu ? (
          <ProjectContextMenu
            state={treeContextMenu}
            onStage={(path) => void stageFile(path)}
            onDiff={(path) => void showDiff(path)}
            onHistory={() => setActiveGitTab('log')}
            onNewFile={() => beginCreate('file')}
            onNewDirectory={() => beginCreate('folder')}
            onDelete={() => void deleteSelectedPath()}
          />
        ) : null}
      </aside>

      <section className="editor-column">
        {!tracked ? (
          <section className="empty-repo-view embedded-empty">
            <HardDrive size={34} />
            <h2>{repoName}</h2>
            <p>This folder does not contain a `.vic` directory yet.</p>
            <button className="primary-button" onClick={startTracking}><CheckCircle2 size={16} /> Start Tracking</button>
          </section>
        ) : (
          <>
            <FileTabBar files={openedFiles} activePath={activeFilePath} onSelect={setActiveFilePath} onClose={(path) => {
              setOpenedFiles((files) => files.filter((file) => file.path !== path))
              if (activeFilePath === path) setActiveFilePath(openedFiles.find((file) => file.path !== path)?.path ?? '')
            }} dirtyPaths={dirtyFilePaths} />
            <EditorArea
              file={activeFile}
              onChange={(content) => {
                if (!activeFile) return
                setDirtyFilePaths((paths) => new Set([...paths, activeFile.path]))
                setOpenedFiles((files) => files.map((file) => file.path === activeFile.path ? { ...file, content } : file))
              }}
              onSave={() => activeFile && saveFile(activeFile)}
              onOpenExternal={(path) => {
                const backend = import('../wailsjs/go/main/App')
                void backend.then((api) => callBackend('Open file externally', () => api.OpenPath(path), { silentSuccess: true }))
              }}
              onSaveBinary={(encodedContent) => {
                if (!activeFile) return
                return saveBinaryFile(activeFile, encodedContent)
              }}
            />
          </>
        )}
      </section>

      {commitPanelOpen && activeFile?.kind !== 'word' ? (
        <CommitToolWindow
          staged={staged}
          unstaged={unstaged}
          untracked={untracked}
          commitMessage={commitMessage}
          onCommitMessageChange={setCommitMessage}
          onStageAll={stageAll}
          onSetFileStaged={setFileStaged}
          onCommit={commit}
          onCommitAndPush={commitAndPush}
        />
      ) : null}
      <BottomGitToolWindow
        activeTab={activeGitTab}
        onTabChange={setActiveGitTab}
        commitHistory={commitHistory}
        selectedCommit={selectedCommit}
        onSelectCommit={setSelectedCommitHash}
        changedFiles={allChangedFiles}
        onDiff={showDiff}
        onStage={stageFile}
        onCheckoutCommit={checkoutTarget}
      />
    </main>
  )
}

function AppNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const isProblem = !message.toLowerCase().includes('completed') && !message.startsWith('Signed in as')
  return (
    <div className={`app-notice ${isProblem ? 'app-notice-problem' : ''}`} role="status">
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss notice">×</button>
    </div>
  )
}

function TopBar({
  repoName,
  repoPath,
  branch,
  profile,
  session,
  theme,
  language,
  remoteName,
  remotes,
  onRemoteChange,
  onThemeChange,
  onLanguageChange,
  onOpenProjects,
  onCloseProject,
  onLogout,
  onFetch,
  onPull,
  onPush,
  onCommit,
  onBranch,
  onRefresh,
  onAddRemote,
  onSetRemoteToken,
  labels,
}: {
  repoName: string
  repoPath: string
  branch: string
  profile: UserProfile | null
  session: DesktopSession | null
  theme: ThemeMode
  language: LanguageCode
  remoteName: string
  remotes: RemoteEntry[]
  onRemoteChange: (value: string) => void
  onThemeChange: (value: ThemeMode) => void
  onLanguageChange: (value: LanguageCode) => void
  onOpenProjects: () => void
  onCloseProject: () => void
  onLogout: () => void
  onFetch: () => void
  onPull: () => void
  onPush: () => void
  onCommit: () => void
  onBranch: () => void
  onRefresh: () => void
  onAddRemote: (name: string, url: string) => void
  onSetRemoteToken: (name: string, token: string) => void
  labels: Record<string, string>
}) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const [remoteFormName, setRemoteFormName] = useState('origin')
  const [remoteFormURL, setRemoteFormURL] = useState('')
  const [remoteToken, setRemoteTokenValue] = useState('')
  const actionsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setRemoteFormName(remoteName || 'origin')
  }, [remoteName])

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!actionsRef.current?.contains(event.target as Node)) setActionsOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <header className="top-bar">
      <button className="repo-identity" onClick={onOpenProjects}>
        <FolderGit2 size={18} />
        <span>
          <strong>VIC Desktop</strong>
          <small>{repoName} · {repoPath}</small>
        </span>
      </button>
      <button className="top-branch" onPointerDown={(event) => event.stopPropagation()} onClick={onBranch}><GitBranch size={15} /> <span>{branch}</span></button>
      <button className="toolbar-button" onPointerDown={(event) => event.stopPropagation()} onClick={onBranch}><GitBranch size={15} /> Branch</button>
      <div ref={actionsRef} className="toolbar-menu">
        <button className="icon-button" onClick={() => setActionsOpen((open) => !open)} title="More Git actions"><MoreHorizontal size={16} /></button>
        {actionsOpen ? (
          <div className="toolbar-menu-panel">
            <button onClick={() => { setActionsOpen(false); onCloseProject() }}><X size={14} /> Close Project</button>
            <div className="toolbar-menu-separator" />
            <label className="toolbar-menu-remote">
              <span>Active remote</span>
              <input value={remoteName} onChange={(event) => onRemoteChange(event.target.value)} aria-label="Remote name" />
            </label>
            <button onClick={() => { setActionsOpen(false); onPull() }}><RefreshCw size={14} /> Update Project</button>
            <button onClick={() => { setActionsOpen(false); onCommit() }}><GitCommitHorizontal size={14} /> Commit</button>
            <button onClick={() => { setActionsOpen(false); onPush() }}><Send size={14} /> {labels.push}</button>
            <div className="toolbar-menu-separator" />
            <div className="toolbar-remote-setup" onClick={(event) => event.stopPropagation()}>
              <strong>Remote Setup</strong>
              <input value={remoteFormName} onChange={(event) => setRemoteFormName(event.target.value)} placeholder="origin" />
              <input value={remoteFormURL} onChange={(event) => setRemoteFormURL(event.target.value)} placeholder="https://server/repository.git" />
              <button type="button" onClick={() => { onAddRemote(remoteFormName, remoteFormURL); setRemoteFormURL('') }}>
                <Upload size={14} /> Add remote
              </button>
              <input value={remoteToken} onChange={(event) => setRemoteTokenValue(event.target.value)} placeholder="Bearer token" type="password" />
              <button type="button" onClick={() => { onSetRemoteToken(remoteFormName, remoteToken); setRemoteTokenValue('') }}>
                <Upload size={14} /> Set token
              </button>
              <div className="toolbar-remote-list">
                {remotes.length === 0 ? <span>No remotes configured</span> : remotes.map((remote) => (
                  <button key={remote.name} type="button" onClick={() => { onRemoteChange(remote.name); setRemoteFormName(remote.name); setRemoteFormURL(remote.url) }}>
                    <b>{remote.name}</b>
                    <small>{remote.url}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="toolbar-menu-separator" />
            <button onClick={() => { setActionsOpen(false); onPull() }}><GitPullRequest size={14} /> {labels.pull}</button>
            <button onClick={() => { setActionsOpen(false); onFetch() }}><RefreshCw size={14} /> {labels.fetch}</button>
            <button onClick={() => { setActionsOpen(false); onRefresh() }}><RefreshCw size={14} /> Refresh Workspace</button>
          </div>
        ) : null}
      </div>
      <ShellPreferences theme={theme} language={language} onThemeChange={onThemeChange} onLanguageChange={onLanguageChange} compact />
      <button className="login-button" onClick={onLogout}><LogOut size={15} /> {labels.logout}</button>
      <ProfileChip profile={profile} caption={session?.serverUrl ?? ''} />
    </header>
  )
}

function FileTree({
  node,
  query,
  expanded,
  statusByPath,
  selectedPath,
  root = false,
  depth = 0,
  onToggle,
  onSelect,
  onOpenFile,
  onContextMenu,
}: {
  node: FileTreeNode
  query: string
  expanded: Set<string>
  statusByPath: Map<string, string>
  selectedPath: string
  root?: boolean
  depth?: number
  onToggle: (path: string) => void
  onSelect: (node: FileTreeNode) => void
  onOpenFile: (node: FileTreeNode) => void
  onContextMenu: (event: React.MouseEvent, node: FileTreeNode) => void
}) {
  const visibleChildren = (node.children ?? []).filter((child) => matchesTreeQuery(child, query))
  const open = root || expanded.has(node.path)
  if (root) {
    return (
      <div>
        {visibleChildren.map((child) => (
          <FileTree key={child.path} node={child} query={query} expanded={expanded} statusByPath={statusByPath} selectedPath={selectedPath} depth={0} onToggle={onToggle} onSelect={onSelect} onOpenFile={onOpenFile} onContextMenu={onContextMenu} />
        ))}
      </div>
    )
  }
  const status = node.status || statusByPath.get(node.relative) || ''
  const Icon = node.isDir ? Folder : fileIcon(node)
  return (
    <div>
      <button
        className={`tree-row tree-row-${statusClass(status)} ${selectedPath === node.path ? 'tree-row-active' : ''}`}
        style={{ paddingLeft: 10 + depth * 14 }}
        onContextMenu={(event) => onContextMenu(event, node)}
        onClick={() => {
          onSelect(node)
          node.isDir ? onToggle(node.path) : onOpenFile(node)
        }}
      >
        {node.isDir ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="tree-spacer" />}
        <Icon size={15} />
        <span>{node.name}</span>
        {status ? <small className={`status-badge status-${statusClass(status)}`}>{statusLabel(status)}</small> : null}
      </button>
      {node.isDir && open ? (
        <div>
          {visibleChildren.map((child) => (
            <FileTree key={child.path} node={child} query={query} expanded={expanded} statusByPath={statusByPath} selectedPath={selectedPath} depth={depth + 1} onToggle={onToggle} onSelect={onSelect} onOpenFile={onOpenFile} onContextMenu={onContextMenu} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FileTabBar({ files, activePath, dirtyPaths, onSelect, onClose }: { files: FileContent[]; activePath: string; dirtyPaths: Set<string>; onSelect: (path: string) => void; onClose: (path: string) => void }) {
  if (files.length === 0) return <div className="tab-bar empty-tabs">Open a file from the tree to start editing.</div>
  return (
    <div className="tab-bar">
      {files.map((file) => (
        <button key={file.path} className={`file-tab ${file.path === activePath ? 'file-tab-active' : ''}`} onClick={() => onSelect(file.path)}>
          <File size={14} />
          <span>{file.name}</span>
          {dirtyPaths.has(file.path) ? <i className="dirty-dot" title="Unsaved changes" /> : null}
          <b onClick={(event) => { event.stopPropagation(); onClose(file.path) }}>×</b>
        </button>
      ))}
    </div>
  )
}

type DocxEditorHandle = { save: () => Promise<void>; setFontColor: (color: string) => void }

function EditorArea({
  file,
  onChange,
  onSave,
  onOpenExternal,
  onSaveBinary,
}: {
  file: FileContent | null
  onChange: (content: string) => void
  onSave: () => void
  onOpenExternal: (path: string) => void
  onSaveBinary: (encodedContent: string) => void | Promise<void>
}) {
  const docxEditorRef = useRef<DocxEditorHandle | null>(null)
  const [fontColor, setFontColor] = useState('#d92d20')
  const [wordMode, setWordMode] = useState<'safe' | 'syncfusion'>('safe')

  useEffect(() => {
    setWordMode('safe')
  }, [file?.path])
  if (!file) {
    return (
      <section className="editor-empty">
        <FileCode2 size={40} />
        <h2>No file selected</h2>
        <p>Select a file from the repository tree to preview or edit it.</p>
      </section>
    )
  }
  return (
    <section className="editor-area">
      <div className="editor-header">
        <div>
          <h2>{file.name}</h2>
          <p>{file.relative}</p>
        </div>
        {file.editable || file.kind === 'word' ? (
          <div className="editor-actions">
            {file.kind === 'word' && wordMode === 'syncfusion' ? (
              <label className="word-color-tool" title="Font color">
                <span>A</span>
                <input
                  type="color"
                  value={fontColor}
                  onChange={(event) => {
                    const nextColor = event.target.value
                    setFontColor(nextColor)
                    docxEditorRef.current?.setFontColor(nextColor)
                  }}
                />
              </label>
            ) : null}
            {file.kind === 'word' && wordMode === 'safe' ? (
              <>
                <button className="ghost-button" onClick={() => onOpenExternal(file.path)}>
                  <ExternalLink size={15} /> Edit in Word
                </button>
                <button className="ghost-button" onClick={() => setWordMode('syncfusion')}>
                  Lossy Syncfusion Edit
                </button>
              </>
            ) : (
              <>
                {file.kind === 'word' ? (
                  <button className="ghost-button" onClick={() => setWordMode('safe')}>Safe view</button>
                ) : null}
                <button className="primary-button" onClick={() => file.kind === 'word' ? void docxEditorRef.current?.save() : onSave()}>
                  <Save size={15} /> Save
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
      {file.kind === 'text' ? (
        <textarea className="text-editor" value={file.content} onChange={(event) => onChange(event.target.value)} />
      ) : file.kind === 'word' && wordMode === 'safe' ? (
        <WordSafePreview file={file} onOpenExternal={() => onOpenExternal(file.path)} onEdit={() => setWordMode('syncfusion')} />
      ) : file.kind === 'word' ? (
        <DocxEditor ref={docxEditorRef} file={file} onSave={onSaveBinary} />
      ) : file.kind === 'image' ? (
        <ImagePreview file={file} />
      ) : (
        <UnsupportedPreview file={file} />
      )}
    </section>
  )
}

const DocxEditor = React.forwardRef<DocxEditorHandle, { file: FileContent; onSave: (encodedContent: string) => void | Promise<void> }>(function DocxEditor({ file, onSave }, ref) {
  const editorRef = useRef<DocumentEditorContainerComponent | null>(null)
  const autosaveTimerRef = useRef<number | null>(null)
  const readyForAutosaveRef = useRef(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [documentServiceUrl, setDocumentServiceUrl] = useState(syncfusionDocumentServiceUrl)

  async function saveDocument() {
    const editor = editorRef.current?.documentEditor
    if (!editor || saving) return
    if (file.wordCompatibilityNotes?.length) {
      const shouldContinue = window.confirm(
        `This document contains ${file.wordCompatibilityNotes.join(', ')}. Syncfusion may remove or flatten those parts when saving. Continue saving?`,
      )
      if (!shouldContinue) return
    }
    setSaving(true)
    try {
      const blob = await editor.saveAsBlob('Docx')
      await Promise.resolve(onSave(await blobToBase64(blob)))
    } finally {
      setSaving(false)
    }
  }

  function setFontColor(color: string) {
    const editor = editorRef.current?.documentEditor
    if (!editor) return
    editor.focusIn()
    editor.isReadOnly = false
    if (editor.selection) {
      editor.selection.characterFormat.fontColor = color
    }
  }

  React.useImperativeHandle(ref, () => ({ save: saveDocument, setFontColor }), [saving, file.path, file.wordCompatibilityNotes])

  useEffect(() => {
    const container = editorRef.current
    const editor = container?.documentEditor
    if (!editor) return
    const documentEditor = editor
    let cancelled = false
    documentEditor.enableAllModules()
    documentEditor.isReadOnly = false
    container.enableTrackChanges = false
    documentEditor.enableTrackChanges = false
    readyForAutosaveRef.current = false
    setLoadError('')
    documentEditor.openBlank()

    async function loadDocument() {
      try {
        const importedDocument = await importWordDocument(file)
        if (cancelled) return
        if (importedDocument.document) {
          setDocumentServiceUrl(importedDocument.serviceUrl)
          documentEditor.open(importedDocument.document)
        } else {
          throw new Error('This Word file has no binary content to import')
        }
        documentEditor.isReadOnly = false
        documentEditor.enableTrackChanges = false
        documentEditor.fitPage('FitPageWidth')
      } catch (error) {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : 'Could not import this Word document')
        documentEditor.openBlank()
      } finally {
        window.setTimeout(() => {
          if (!cancelled) readyForAutosaveRef.current = true
        }, 400)
      }
    }

    void loadDocument()
    return () => {
      cancelled = true
    }
  }, [file.path, file.previewText, file.encodedContent])

  useEffect(() => {
    function handleDocxSave(event: Event) {
      const detail = (event as CustomEvent<{ path?: string }>).detail
      if (detail?.path && detail.path !== file.path) return
      void saveDocument()
    }
    window.addEventListener('vic-save-docx', handleDocxSave)
    return () => window.removeEventListener('vic-save-docx', handleDocxSave)
  }, [file.path, saving])

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current)
    }
  }, [])

  return (
    <div className="syncfusion-document-editor syncfusion-document-shell">
      <div className="docx-save-indicator">{loadError || (saving ? 'Saving...' : file.wordCompatibilityNotes?.length ? 'Complex Word content' : 'Ready')}</div>
      <DocumentEditorContainerComponent
        ref={(scope: DocumentEditorContainerComponent | null) => { editorRef.current = scope }}
        height="100%"
        serviceUrl={documentServiceUrl}
        enableToolbar
        toolbarMode="Ribbon"
        ribbonLayout="Classic"
        showPropertiesPane
        enableTrackChanges={false}
        enableComment
        enableLocalPaste
        contentChange={() => {
          if (!readyForAutosaveRef.current) return
        }}
        toolbarClick={(args: any) => {
          const id = String(args?.item?.id ?? '').toLowerCase()
          const text = String(args?.item?.text ?? '').toLowerCase()
          if (id.includes('save') || text === 'save') {
            args.cancel = true
            void saveDocument()
          }
        }}
      >
        <Inject services={[Toolbar, Ribbon]} />
      </DocumentEditorContainerComponent>
    </div>
  )
})

function ImagePreview({ file }: { file: FileContent }) {
  const src = `file:///${file.path.replace(/\\/g, '/')}`
  return (
    <div className="image-preview">
      <img src={src} alt={file.name} />
    </div>
  )
}

function WordSafePreview({ file, onOpenExternal, onEdit }: { file: FileContent; onOpenExternal: () => void; onEdit: () => void }) {
  return (
    <section className="word-safe-preview">
      <FileText size={44} />
      <h3>Edit this DOCX in Word to preserve the original styling</h3>
      <p>
        This desktop app cannot display the original Microsoft Word layout inside Syncfusion without conversion.
        Syncfusion changes or ignores some Word styling, so use Word/default app for accurate viewing and editing.
      </p>
      {file.wordCompatibilityNotes?.length ? (
        <small>Detected complex content: {file.wordCompatibilityNotes.join(', ')}</small>
      ) : null}
      <div className="word-safe-actions">
        <button className="primary-button" onClick={onOpenExternal}>
          <ExternalLink size={15} /> Edit in Word
        </button>
        <button className="ghost-button" onClick={onEdit}>
          Lossy Syncfusion Edit
        </button>
      </div>
    </section>
  )
}

function UnsupportedPreview({ file }: { file: FileContent }) {
  return (
    <div className="binary-file-message">
      <FileType size={34} />
      <strong>{file.kind === 'pdf' ? 'PDF preview will be added in the next milestone.' : 'Preview is not available for this file type.'}</strong>
      <p>{file.relative}</p>
    </div>
  )
}

function CommitToolWindow({
  staged,
  unstaged,
  untracked,
  commitMessage,
  onCommitMessageChange,
  onStageAll,
  onSetFileStaged,
  onCommit,
  onCommitAndPush,
}: {
  staged: FileStatus[]
  unstaged: FileStatus[]
  untracked: string[]
  commitMessage: string
  onCommitMessageChange: (value: string) => void
  onStageAll: () => void
  onSetFileStaged: (path: string, staged: boolean) => void
  onCommit: () => void
  onCommitAndPush: () => void
}) {
  const unstagedFiles = [...unstaged, ...untracked.map((path) => ({ path, status: 'untracked' }))]
  return (
    <aside className="commit-tool-window">
      <div className="changes-header">
        <h2>Commit Changes</h2>
        <button className="ghost-button" onClick={onStageAll}><Upload size={14} /> Stage All</button>
      </div>
      <CommitFileGroup title="Included" files={staged} checked onToggle={onSetFileStaged} />
      <CommitFileGroup title="Not Included" files={unstagedFiles} checked={false} onToggle={onSetFileStaged} />
      <div className="commit-box">
        <label className="field-label">Commit message</label>
        <textarea value={commitMessage} onChange={(event) => onCommitMessageChange(event.target.value)} placeholder="Summary of changes" />
        <label className="commit-option"><input type="checkbox" /> Reformat code</label>
        <label className="commit-option"><input type="checkbox" /> Optimize imports</label>
        <label className="commit-option"><input type="checkbox" /> Run tests before commit</label>
        <div className="commit-actions">
          <button className="primary-button" onClick={onCommit}><GitCommitHorizontal size={15} /> Commit</button>
          <button className="ghost-button" onClick={onCommitAndPush}><Send size={15} /> Commit and Push</button>
        </div>
      </div>
    </aside>
  )
}

function CommitFileGroup({ title, files, checked, onToggle }: { title: string; files: FileStatus[]; checked: boolean; onToggle: (path: string, staged: boolean) => void }) {
  return (
    <div className="commit-file-group">
      <h3>{title}</h3>
      {files.length === 0 ? <p>No files</p> : files.map((file) => (
        <label className="commit-file-row" key={`${title}-${file.path}`}>
          <input type="checkbox" checked={checked} onChange={(event) => onToggle(file.path, event.target.checked)} />
          <span className={`change-kind status-${statusClass(file.status)}`}>{statusLabel(file.status)}</span>
          <strong title={file.path}>{file.path}</strong>
        </label>
      ))}
    </div>
  )
}

function BranchPopup({
  branch,
  branches,
  newBranchName,
  mergeBranchName,
  onNewBranchNameChange,
  onMergeBranchNameChange,
  onCreateBranch,
  onCheckout,
  onMerge,
  onClose,
}: {
  branch: string
  branches: Branch[]
  newBranchName: string
  mergeBranchName: string
  onNewBranchNameChange: (value: string) => void
  onMergeBranchNameChange: (value: string) => void
  onCreateBranch: () => void
  onCheckout: (target: string) => void
  onMerge: () => void
  onClose: () => void
}) {
  const popupRef = useRef<HTMLElement | null>(null)
  const currentBranch = branches.find((branch) => branch.current)
  const localBranches = branches.filter((item) => !item.remote)
  const remoteBranches = branches.filter((item) => item.remote)
  const mergeOptions = branches.filter((item) => !item.current)

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!popupRef.current?.contains(event.target as Node)) onClose()
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [onClose])

  return (
    <section className="branch-popup" ref={popupRef}>
      <div className="branch-popup-header">
        <h2>Git Branches</h2>
        <button onClick={onClose}>×</button>
      </div>
      <div className="branch-section">
        <h3>Current Branch</h3>
        <button className="branch-row branch-current"><span>✓</span>{currentBranch?.name || branch}</button>
      </div>
      <div className="branch-section">
        <h3>Local Branches</h3>
        {localBranches.map((item) => (
          <button key={item.name} className="branch-row" onClick={() => onCheckout(item.name)}>{item.current ? '✓' : ''}<span>{item.name}</span></button>
        ))}
      </div>
      <div className="branch-section">
        <h3>Remote Branches</h3>
        {remoteBranches.length === 0 ? <p>No remote branches</p> : remoteBranches.map((item) => (
          <button key={item.name} className="branch-row" onClick={() => onCheckout(item.name)}><span>{item.name}</span></button>
        ))}
      </div>
      <div className="branch-section">
        <h3>Actions</h3>
        <div className="control-row">
          <input value={newBranchName} onChange={(event) => onNewBranchNameChange(event.target.value)} placeholder="feature-dashboard" />
          <button onClick={onCreateBranch}><Plus size={14} /> New Branch</button>
        </div>
        <div className="control-row">
          <Select value={mergeBranchName} placeholder="Merge branch" onChange={onMergeBranchNameChange} options={mergeOptions.map((item) => ({ value: item.name, label: item.name }))} />
          <button onClick={onMerge}><GitPullRequest size={14} /> Merge into Current</button>
        </div>
        <button className="branch-action" disabled={!mergeBranchName}>Compare with Current</button>
        <button className="branch-action" disabled={!mergeBranchName}>Show Diff</button>
        <button className="branch-action" disabled={!mergeBranchName}>Delete</button>
      </div>
    </section>
  )
}

function ProjectContextMenu({
  state,
  onStage,
  onDiff,
  onHistory,
  onNewFile,
  onNewDirectory,
  onDelete,
}: {
  state: NonNullable<TreeContextMenuState>
  onStage: (path: string) => void
  onDiff: (path: string) => void
  onHistory: () => void
  onNewFile: () => void
  onNewDirectory: () => void
  onDelete: () => void
}) {
  const node = state.node
  return (
    <div
      className="project-context-menu"
      style={{ left: state.x, top: state.y }}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="context-menu-title">Git</div>
      <button disabled={node.isDir} onClick={() => onStage(node.relative)}><span>Add</span></button>
      <button disabled={node.isDir} onClick={() => onDiff(node.relative)}><span>Compare with HEAD</span></button>
      <button onClick={onHistory}><span>Show History</span></button>
      <button disabled><span>Revert</span></button>
      <div className="context-menu-separator" />
      <button onClick={onNewFile}><span>New File</span></button>
      <button onClick={onNewDirectory}><span>New Directory</span></button>
      <button disabled><span>Rename</span></button>
      <button className="danger-menu-item" onClick={onDelete}><span>Delete</span></button>
    </div>
  )
}

function BottomGitToolWindow({
  activeTab,
  onTabChange,
  commitHistory,
  selectedCommit,
  onSelectCommit,
  changedFiles,
  onDiff,
  onStage,
  onCheckoutCommit,
}: {
  activeTab: GitTab
  onTabChange: (tab: GitTab) => void
  commitHistory: CommitHistoryEntry[]
  selectedCommit: CommitHistoryEntry | null
  onSelectCommit: (hash: string) => void
  changedFiles: FileStatus[]
  onDiff: (path: string) => void
  onStage: (path: string) => void
  onCheckoutCommit: (hash: string) => void
}) {
  const [checkoutHash, setCheckoutHash] = useState('')
  return (
    <section className="git-tool-window">
      <div className="git-tool-tabs">
        <button className={activeTab === 'log' ? 'active' : ''} onClick={() => onTabChange('log')}>Log</button>
        <button className={activeTab === 'changes' ? 'active' : ''} onClick={() => onTabChange('changes')}>Local Changes</button>
      </div>
      {activeTab === 'log' ? (
        <div className="git-log-layout">
          <div className="git-log-table">
            <div className="git-log-head"><span>Graph</span><span>Commit Message</span><span>Author</span><span>Date</span></div>
            {commitHistory.length === 0 ? <p className="tool-empty">No commits yet.</p> : commitHistory.map((commit) => (
              <button
                key={commit.hash}
                className={`git-log-row ${selectedCommit?.hash === commit.hash ? 'git-log-row-active' : ''}`}
                onClick={() => onSelectCommit(commit.hash)}
              >
                <span className="commit-dot">●</span>
                <strong>{commit.subject || commit.message}</strong>
                <span>{commit.author}</span>
                <span>{commit.date}</span>
              </button>
            ))}
          </div>
          <aside className="commit-detail">
            {selectedCommit ? (
              <>
                <h3>{selectedCommit.subject || selectedCommit.message}</h3>
                <p><strong>Hash</strong><span>{selectedCommit.hash}</span></p>
                <p><strong>Author</strong><span>{selectedCommit.author}</span></p>
                <p><strong>Date</strong><span>{selectedCommit.date}</span></p>
                <div className="commit-detail-actions">
                  <button onClick={() => onCheckoutCommit(selectedCommit.hash)}>Checkout this version</button>
                </div>
                <pre>{selectedCommit.message}</pre>
              </>
            ) : <p className="tool-empty">Select a commit to inspect it.</p>}
          </aside>
        </div>
      ) : null}
      {activeTab === 'changes' ? (
        <div className="local-changes-view">
          <form className="checkout-version-row" onSubmit={(event) => {
            event.preventDefault()
            if (checkoutHash.trim()) onCheckoutCommit(checkoutHash.trim())
          }}>
            <span>Checkout version</span>
            <input value={checkoutHash} onChange={(event) => setCheckoutHash(event.target.value)} placeholder="Commit hash or branch name" />
            <button type="submit">Checkout</button>
          </form>
          <div className="changelist-block">
            <h3>Default Changelist</h3>
            {changedFiles.length === 0 ? <p className="tool-empty">No local changes.</p> : changedFiles.map((file) => (
              <div className="local-change-row" key={`${file.status}-${file.path}`}>
                <File size={14} />
                <span className={`change-kind status-${statusClass(file.status)}`}>{statusLabel(file.status)}</span>
                <strong title={file.path}>{file.path}</strong>
                <button onClick={() => onDiff(file.path)}>Show Diff</button>
                <button onClick={() => onStage(file.path)}>Add to Git</button>
              </div>
            ))}
          </div>
          <div className="changelist-block muted-block">
            <h3>Unversioned Files</h3>
            <p className="tool-empty">Untracked files are listed in the default changelist until custom changelists are enabled.</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function ShellPreferences({
  theme,
  language,
  compact = false,
  onThemeChange,
  onLanguageChange,
}: {
  theme: ThemeMode
  language: LanguageCode
  compact?: boolean
  onThemeChange: (value: ThemeMode) => void
  onLanguageChange: (value: LanguageCode) => void
}) {
  return (
    <div className={`shell-preferences ${compact ? 'shell-preferences-compact' : ''}`}>
      <Button
        type="button"
        variant="ghost"
        className="preference-icon-button"
        title="Toggle theme"
        onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </Button>
      <div className="language-select-shell">
        <Select
          value={language}
          onChange={(value) => onLanguageChange(value as LanguageCode)}
          options={[
            { value: 'en', label: 'EN' },
            { value: 'fa', label: 'FA' },
            { value: 'ps', label: 'PS' },
          ]}
        />
      </div>
    </div>
  )
}

function ChangeGroup({ title, files, staged = false, onStageFile }: { title: string; files: FileStatus[]; staged?: boolean; onStageFile: (path: string) => void }) {
  return (
    <div className="change-group">
      <h3>{title}</h3>
      {files.length === 0 ? <p>No files</p> : files.map((file) => (
        <div className="change-row" key={`${title}-${file.path}`}>
          <span>{statusLabel(file.status)}</span>
          <strong title={file.path}>{file.path}</strong>
          {!staged ? <button onClick={() => onStageFile(file.path)}>Stage</button> : null}
        </div>
      ))}
    </div>
  )
}

function ProfileChip({ profile, caption }: { profile: UserProfile | null; caption: string }) {
  return (
    <div className="header-profile" title={profile ? `${displayName(profile)} - ${profile.email}` : 'Guest user'}>
      <Avatar profile={profile} />
      <div className="min-w-0">
        <div className="profile-name">
          {profile ? displayName(profile) : 'Guest user'}
          {profile?.status ? <span className="profile-status">{profile.status.toLowerCase()}</span> : null}
        </div>
        <div className="profile-email">{profile?.email || caption}</div>
      </div>
    </div>
  )
}

function Avatar({ profile }: { profile: UserProfile | null }) {
  return (
    <AvatarComponent
      className="avatar"
      src={profileImageURL(profile)}
      alt={profile ? displayName(profile) : 'Guest user'}
      initials={profile ? initialsFor(displayName(profile), profile.email) : 'GU'}
    />
  )
}

function buildStatusMap(status: StatusResult | null) {
  const map = new Map<string, string>()
  if (!status) return map
  for (const item of status.staged ?? []) map.set(item.path, item.status)
  for (const item of status.unstaged ?? []) map.set(item.path, item.status)
  for (const path of status.untracked ?? []) map.set(path, 'untracked')
  return map
}

function collectChangedFiles(status: StatusResult | null) {
  const seen = new Map<string, FileStatus>()
  if (!status) return []
  for (const item of status.staged ?? []) seen.set(item.path, item)
  for (const item of status.unstaged ?? []) seen.set(item.path, item)
  for (const path of status.untracked ?? []) seen.set(path, { path, status: 'untracked' })
  return [...seen.values()]
}

function suggestCreateName(kind: PendingCreate['kind'], selectedNode: FileTreeNode | null, rootNode: FileTreeNode | null) {
  const base = kind === 'file' ? 'untitled' : 'new-folder'
  const ext = kind === 'file' ? '.txt' : ''
  const parent = selectedNode?.isDir ? selectedNode : findTreeParent(rootNode, selectedNode?.path || '')
  const names = new Set((parent?.children ?? rootNode?.children ?? []).map((child) => child.name.toLowerCase()))
  let index = 0
  while (true) {
    const name = index === 0 ? `${base}${ext}` : `${base}-${index}${ext}`
    if (!names.has(name.toLowerCase())) return name
    index += 1
  }
}

function findTreeParent(root: FileTreeNode | null, childPath: string): FileTreeNode | null {
  if (!root || !childPath) return null
  if ((root.children ?? []).some((child) => child.path === childPath)) return root
  for (const child of root.children ?? []) {
    const found = findTreeParent(child, childPath)
    if (found) return found
  }
  return null
}

function createParentLabel(selectedNode: FileTreeNode | null) {
  if (!selectedNode) return 'Project root'
  if (selectedNode.isDir) return selectedNode.relative || 'Project root'
  const parts = selectedNode.relative.split(/[\\/]/)
  parts.pop()
  return parts.join('/') || 'Project root'
}

function normalizeStatus(status: StatusResult): StatusResult {
  return {
    ...status,
    staged: Array.isArray(status?.staged) ? status.staged : [],
    unstaged: Array.isArray(status?.unstaged) ? status.unstaged : [],
    untracked: Array.isArray(status?.untracked) ? status.untracked : [],
  }
}

function matchesTreeQuery(node: FileTreeNode, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (node.name.toLowerCase().includes(q) || node.relative.toLowerCase().includes(q)) return true
  return (node.children ?? []).some((child) => matchesTreeQuery(child, q))
}

function fileIcon(node: FileTreeNode) {
  const ext = node.name.toLowerCase().split('.').pop() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return FileImage
  if (['doc', 'docx', 'pdf'].includes(ext)) return FileText
  if (['go', 'ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html', 'md', 'java', 'kt', 'py', 'cs', 'cpp', 'c', 'h', 'xml', 'yaml', 'yml', 'toml', 'mod', 'sum', 'sh', 'ps1', 'sql'].includes(ext)) return FileCode2
  return File
}

function statusClass(status: string) {
  const normalized = status.toLowerCase()
  if (!normalized) return 'clean'
  if (normalized.includes('ignored')) return 'ignored'
  if (normalized.includes('new') || normalized.includes('untracked')) return 'added'
  if (normalized.includes('delete')) return 'deleted'
  if (normalized.includes('conflict')) return 'conflict'
  return 'modified'
}

function statusLabel(status: string) {
  if (status === 'new file') return 'added'
  return status
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.includes(',') ? result.split(',')[1] : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(encodedContent: string, contentType: string) {
  const binary = atob(encodedContent)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: contentType })
}

function syncfusionServiceEndpoint(serviceUrl: string, action: string) {
  return `${serviceUrl.replace(/\/?$/, '/')}${action}`
}

type ImportedWordDocument = { document: string; serviceUrl: string }

async function importWordDocument(file: FileContent) {
  if (!file.encodedContent) return { document: '', serviceUrl: syncfusionDocumentServiceUrl }
  const formData = new FormData()
  const type = file.extension.toLowerCase() === '.doc'
    ? 'application/msword'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  formData.append('files', base64ToBlob(file.encodedContent, type), file.name)

  try {
    return await importWordDocumentWithService(syncfusionDocumentServiceUrl, formData)
  } catch (error) {
    const canTryHostedService =
      syncfusionDocumentServiceUrl === defaultSyncfusionDocumentServiceUrl &&
      window.confirm('The local Syncfusion document service is not running, so styled DOCX import cannot work locally. Use Syncfusion hosted demo service for this import? This uploads the document to Syncfusion.')
    if (!canTryHostedService) {
      throw error
    }
    return importWordDocumentWithService(hostedSyncfusionDocumentServiceUrl, formData)
  }
}

async function importWordDocumentWithService(serviceUrl: string, formData: FormData): Promise<ImportedWordDocument> {
  const response = await fetch(syncfusionServiceEndpoint(serviceUrl, 'Import'), {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    throw new Error(`Syncfusion import failed (${response.status})`)
  }
  return { document: await response.text(), serviceUrl }
}

function displayName(profile: UserProfile) {
  return profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || profile.email
}

function profileImageURL(profile: UserProfile | null) {
  const raw = (profile?.photoUrl || profile?.image || '').trim()
  if (!raw) return ''
  if (/^(https?:|data:|file:|blob:)/i.test(raw)) return raw
  try {
    return new URL(raw, defaultServerURL).toString()
  } catch {
    return raw
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return 'Operation failed.'
  }
}

function initialsFor(name: string, email: string) {
  const source = name || email || 'User'
  return source.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('')
}

const rootElement = document.getElementById('root')!
const root = window.__vicRoot ?? ReactDOM.createRoot(rootElement)
window.__vicRoot = root
root.render(<App />)

declare global {
  interface Window {
    __vicRoot?: ReactDOM.Root
  }
}
