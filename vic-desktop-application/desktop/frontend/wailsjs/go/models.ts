export namespace app {
	
	export class Branch {
	    name: string;
	    current: boolean;
	    remote: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Branch(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.current = source["current"];
	        this.remote = source["remote"];
	    }
	}
	export class CommitHistoryEntry {
	    hash: string;
	    shortHash: string;
	    parents: string[];
	    author: string;
	    date: string;
	    message: string;
	    subject: string;
	
	    static createFrom(source: any = {}) {
	        return new CommitHistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.shortHash = source["shortHash"];
	        this.parents = source["parents"];
	        this.author = source["author"];
	        this.date = source["date"];
	        this.message = source["message"];
	        this.subject = source["subject"];
	    }
	}
	export class CommitResult {
	    hash: string;
	    shortHash: string;
	    branch: string;
	    message: string;
	    stagedCount: number;
	
	    static createFrom(source: any = {}) {
	        return new CommitResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.shortHash = source["shortHash"];
	        this.branch = source["branch"];
	        this.message = source["message"];
	        this.stagedCount = source["stagedCount"];
	    }
	}
	export class UserProfile {
	    id: string;
	    username: string;
	    email: string;
	    firstName: string;
	    lastName: string;
	    displayName: string;
	    image: string;
	    photoUrl: string;
	    status: string;
	    emailVerified: boolean;
	    roles: string[];
	    loggedIn: boolean;
	
	    static createFrom(source: any = {}) {
	        return new UserProfile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.username = source["username"];
	        this.email = source["email"];
	        this.firstName = source["firstName"];
	        this.lastName = source["lastName"];
	        this.displayName = source["displayName"];
	        this.image = source["image"];
	        this.photoUrl = source["photoUrl"];
	        this.status = source["status"];
	        this.emailVerified = source["emailVerified"];
	        this.roles = source["roles"];
	        this.loggedIn = source["loggedIn"];
	    }
	}
	export class DesktopSession {
	    serverUrl: string;
	    accessToken: string;
	    refreshToken: string;
	    tokenType: string;
	    expiresAt: number;
	    profile?: UserProfile;
	
	    static createFrom(source: any = {}) {
	        return new DesktopSession(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serverUrl = source["serverUrl"];
	        this.accessToken = source["accessToken"];
	        this.refreshToken = source["refreshToken"];
	        this.tokenType = source["tokenType"];
	        this.expiresAt = source["expiresAt"];
	        this.profile = this.convertValues(source["profile"], UserProfile);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FileContent {
	    name: string;
	    path: string;
	    relative: string;
	    extension: string;
	    kind: string;
	    content: string;
	    encodedContent: string;
	    previewText: string;
	    wordCompatibilityNotes: string[];
	    size: number;
	    binary: boolean;
	    editable: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FileContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.relative = source["relative"];
	        this.extension = source["extension"];
	        this.kind = source["kind"];
	        this.content = source["content"];
	        this.encodedContent = source["encodedContent"];
	        this.previewText = source["previewText"];
	        this.wordCompatibilityNotes = source["wordCompatibilityNotes"];
	        this.size = source["size"];
	        this.binary = source["binary"];
	        this.editable = source["editable"];
	    }
	}
	export class FileStatus {
	    path: string;
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new FileStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.status = source["status"];
	    }
	}
	export class FileTreeNode {
	    name: string;
	    path: string;
	    relative: string;
	    isDir: boolean;
	    size: number;
	    modified: string;
	    status: string;
	    children: FileTreeNode[];
	
	    static createFrom(source: any = {}) {
	        return new FileTreeNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.relative = source["relative"];
	        this.isDir = source["isDir"];
	        this.size = source["size"];
	        this.modified = source["modified"];
	        this.status = source["status"];
	        this.children = this.convertValues(source["children"], FileTreeNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FolderEntry {
	    name: string;
	    path: string;
	    relative: string;
	    isDir: boolean;
	    size: number;
	    modified: string;
	
	    static createFrom(source: any = {}) {
	        return new FolderEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.relative = source["relative"];
	        this.isDir = source["isDir"];
	        this.size = source["size"];
	        this.modified = source["modified"];
	    }
	}
	export class ProjectSummary {
	    name: string;
	    path: string;
	    tracked: boolean;
	    lastOpened: string;
	    modified: string;
	
	    static createFrom(source: any = {}) {
	        return new ProjectSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.tracked = source["tracked"];
	        this.lastOpened = source["lastOpened"];
	        this.modified = source["modified"];
	    }
	}
	export class Remote {
	    name: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new Remote(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	    }
	}
	export class StatusResult {
	    branch: string;
	    headHash: string;
	    hasCommit: boolean;
	    clean: boolean;
	    staged: FileStatus[];
	    unstaged: FileStatus[];
	    untracked: string[];
	
	    static createFrom(source: any = {}) {
	        return new StatusResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.branch = source["branch"];
	        this.headHash = source["headHash"];
	        this.hasCommit = source["hasCommit"];
	        this.clean = source["clean"];
	        this.staged = this.convertValues(source["staged"], FileStatus);
	        this.unstaged = this.convertValues(source["unstaged"], FileStatus);
	        this.untracked = source["untracked"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class VicCommandResult {
	    command: string[];
	    stdout: string;
	    stderr: string;
	    exitCode: number;
	
	    static createFrom(source: any = {}) {
	        return new VicCommandResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.command = source["command"];
	        this.stdout = source["stdout"];
	        this.stderr = source["stderr"];
	        this.exitCode = source["exitCode"];
	    }
	}

}

