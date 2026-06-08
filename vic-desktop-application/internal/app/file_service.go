package app

import (
	"archive/zip"
	"encoding/base64"
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf8"

	"github.com/elyasahmadi/vic/internal/index"
	"github.com/elyasahmadi/vic/internal/objects"
)

type FileContent struct {
	Name                   string   `json:"name"`
	Path                   string   `json:"path"`
	Relative               string   `json:"relative"`
	Extension              string   `json:"extension"`
	Kind                   string   `json:"kind"`
	Content                string   `json:"content"`
	EncodedContent         string   `json:"encodedContent"`
	PreviewText            string   `json:"previewText"`
	WordCompatibilityNotes []string `json:"wordCompatibilityNotes"`
	Size                   int64    `json:"size"`
	Binary                 bool     `json:"binary"`
	Editable               bool     `json:"editable"`
}

func ReadWorkspaceFile(rootPath, filePath string) (*FileContent, error) {
	root, path, rel, err := workspaceFilePath(rootPath, filePath)
	if err != nil {
		return nil, err
	}
	_ = root
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	if info.IsDir() {
		return nil, fmt.Errorf("cannot open a folder as a file")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	ext := strings.ToLower(filepath.Ext(path))
	kind := fileKind(ext)
	binary := !utf8.Valid(data) || kind != "text"
	content := ""
	encodedContent := ""
	previewText := ""
	wordCompatibilityNotes := []string{}
	if kind == "text" && utf8.Valid(data) {
		content = string(data)
	}
	if kind == "word" {
		encodedContent = base64.StdEncoding.EncodeToString(data)
		if ext == ".docx" {
			previewText, _ = docxPreviewText(path)
			wordCompatibilityNotes, _ = docxCompatibilityNotes(path)
		}
	}
	return &FileContent{
		Name:                   filepath.Base(path),
		Path:                   path,
		Relative:               filepath.ToSlash(rel),
		Extension:              ext,
		Kind:                   kind,
		Content:                content,
		EncodedContent:         encodedContent,
		PreviewText:            previewText,
		WordCompatibilityNotes: wordCompatibilityNotes,
		Size:                   info.Size(),
		Binary:                 binary,
		Editable:               kind == "text",
	}, nil
}

func WriteWorkspaceFile(rootPath, filePath, content string) (*FileContent, error) {
	_, path, _, err := workspaceFilePath(rootPath, filePath)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	if info.IsDir() {
		return nil, fmt.Errorf("cannot save content to a folder")
	}
	if err := os.WriteFile(path, []byte(content), info.Mode().Perm()); err != nil {
		return nil, err
	}
	return ReadWorkspaceFile(rootPath, path)
}

func WriteWorkspaceFileBase64(rootPath, filePath, encodedContent string) (*FileContent, error) {
	_, path, _, err := workspaceFilePath(rootPath, filePath)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	if info.IsDir() {
		return nil, fmt.Errorf("cannot save content to a folder")
	}
	data, err := base64.StdEncoding.DecodeString(encodedContent)
	if err != nil {
		return nil, fmt.Errorf("invalid file content: %w", err)
	}
	if err := os.WriteFile(path, data, info.Mode().Perm()); err != nil {
		return nil, err
	}
	return ReadWorkspaceFile(rootPath, path)
}

func CreateWorkspaceFile(rootPath, parentPath, name string) (*FileContent, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("file name is required")
	}
	parent, err := workspaceDirectoryPath(rootPath, parentPath)
	if err != nil {
		return nil, err
	}
	path := filepath.Join(parent, name)
	_, path, _, err = workspaceFilePath(rootPath, path)
	if err != nil {
		return nil, err
	}
	if _, err := os.Stat(path); err == nil {
		return nil, fmt.Errorf("file already exists: %s", name)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	if err := os.WriteFile(path, []byte{}, 0o644); err != nil {
		return nil, err
	}
	return ReadWorkspaceFile(rootPath, path)
}

func CreateWorkspaceFolder(rootPath, parentPath, name string) (*FolderEntry, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("folder name is required")
	}
	parent, err := workspaceDirectoryPath(rootPath, parentPath)
	if err != nil {
		return nil, err
	}
	path := filepath.Join(parent, name)
	_, path, _, err = workspaceFilePath(rootPath, path)
	if err != nil {
		return nil, err
	}
	if _, err := os.Stat(path); err == nil {
		return nil, fmt.Errorf("folder already exists: %s", name)
	}
	if err := os.MkdirAll(path, 0o755); err != nil {
		return nil, err
	}
	return folderEntry(rootPath, path)
}

func CopyWorkspacePath(rootPath, sourcePath string) (*FolderEntry, error) {
	_, source, _, err := workspaceFilePath(rootPath, sourcePath)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(source)
	if err != nil {
		return nil, err
	}
	dest := availableCopyPath(source)
	if info.IsDir() {
		if err := copyDirectory(source, dest); err != nil {
			return nil, err
		}
	} else {
		if err := copyFile(source, dest, info.Mode().Perm()); err != nil {
			return nil, err
		}
	}
	return folderEntry(rootPath, dest)
}

func DeleteWorkspacePath(rootPath, targetPath string) error {
	_, target, rel, err := workspaceFilePath(rootPath, targetPath)
	if err != nil {
		return err
	}
	if rel == "" || rel == "." {
		return fmt.Errorf("cannot delete the workspace root")
	}
	if filepath.Base(target) == ".vic" {
		return fmt.Errorf("cannot delete the .vic directory")
	}
	return os.RemoveAll(target)
}

func workspaceFilePath(rootPath, filePath string) (string, string, string, error) {
	root, err := filepath.Abs(rootPath)
	if err != nil {
		return "", "", "", err
	}
	path := filePath
	if !filepath.IsAbs(path) {
		path = filepath.Join(root, path)
	}
	path, err = filepath.Abs(path)
	if err != nil {
		return "", "", "", err
	}
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return "", "", "", err
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || filepath.IsAbs(rel) {
		return "", "", "", fmt.Errorf("file is outside the selected workspace")
	}
	return root, path, rel, nil
}

func workspaceDirectoryPath(rootPath, path string) (string, error) {
	root, target, _, err := workspaceFilePath(rootPath, path)
	if err != nil {
		return "", err
	}
	info, err := os.Stat(target)
	if err == nil && info.IsDir() {
		return target, nil
	}
	if err == nil {
		return filepath.Dir(target), nil
	}
	if os.IsNotExist(err) {
		if filepath.IsAbs(path) {
			return filepath.Dir(target), nil
		}
		return root, nil
	}
	return "", err
}

func folderEntry(rootPath, path string) (*FolderEntry, error) {
	root, err := filepath.Abs(rootPath)
	if err != nil {
		return nil, err
	}
	info, err := os.Stat(path)
	if err != nil {
		return nil, err
	}
	rel, err := filepath.Rel(root, path)
	if err != nil {
		rel = filepath.Base(path)
	}
	modified := ""
	if !info.ModTime().IsZero() {
		modified = info.ModTime().Format("2006-01-02T15:04:05Z07:00")
	}
	return &FolderEntry{
		Name:     filepath.Base(path),
		Path:     path,
		Relative: filepath.ToSlash(rel),
		IsDir:    info.IsDir(),
		Size:     info.Size(),
		Modified: modified,
	}, nil
}

func availableCopyPath(source string) string {
	dir := filepath.Dir(source)
	ext := filepath.Ext(source)
	base := strings.TrimSuffix(filepath.Base(source), ext)
	for i := 1; ; i++ {
		suffix := " copy"
		if i > 1 {
			suffix = fmt.Sprintf(" copy %d", i)
		}
		candidate := filepath.Join(dir, base+suffix+ext)
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate
		}
	}
}

func copyFile(source, dest string, mode os.FileMode) error {
	data, err := os.ReadFile(source)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return err
	}
	return os.WriteFile(dest, data, mode)
}

func copyDirectory(source, dest string) error {
	return filepath.WalkDir(source, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.Name() == ".vic" && d.IsDir() {
			return filepath.SkipDir
		}
		rel, err := filepath.Rel(source, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dest, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		info, err := d.Info()
		if err != nil {
			return err
		}
		return copyFile(path, target, info.Mode().Perm())
	})
}

func fileKind(ext string) string {
	switch ext {
	case ".txt", ".md", ".go", ".js", ".jsx", ".ts", ".tsx", ".json", ".css", ".html", ".xml", ".yaml", ".yml", ".toml", ".mod", ".sum", ".gitignore":
		return "text"
	case ".docx", ".doc":
		return "word"
	case ".pdf":
		return "pdf"
	case ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg":
		return "image"
	default:
		return "binary"
	}
}

func docxPreviewText(path string) (string, error) {
	reader, err := zip.OpenReader(path)
	if err != nil {
		return "", err
	}
	defer reader.Close()

	for _, file := range reader.File {
		if file.Name != "word/document.xml" {
			continue
		}
		rc, err := file.Open()
		if err != nil {
			return "", err
		}
		defer rc.Close()
		return wordXMLText(rc)
	}
	return "", fmt.Errorf("docx document body not found")
}

func docxCompatibilityNotes(path string) ([]string, error) {
	reader, err := zip.OpenReader(path)
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	seen := map[string]bool{}
	for _, file := range reader.File {
		name := file.Name
		switch {
		case strings.HasPrefix(name, "word/charts/") || strings.Contains(name, "/charts/"):
			seen["charts"] = true
		case strings.HasPrefix(name, "word/embeddings/") || strings.Contains(name, "/embeddings/"):
			seen["embedded objects"] = true
		case strings.HasPrefix(name, "word/diagrams/") || strings.Contains(name, "/diagrams/"):
			seen["SmartArt diagrams"] = true
		case strings.HasPrefix(name, "word/activeX/") || strings.Contains(name, "/activeX/"):
			seen["ActiveX controls"] = true
		}
	}

	notes := make([]string, 0, len(seen))
	for _, note := range []string{"charts", "embedded objects", "SmartArt diagrams", "ActiveX controls"} {
		if seen[note] {
			notes = append(notes, note)
		}
	}
	return notes, nil
}

func wordXMLText(r io.Reader) (string, error) {
	decoder := xml.NewDecoder(r)
	var parts []string
	var paragraph strings.Builder
	inText := false
	for {
		token, err := decoder.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", err
		}
		switch t := token.(type) {
		case xml.StartElement:
			if t.Name.Local == "t" {
				inText = true
			}
		case xml.CharData:
			if inText {
				paragraph.WriteString(string(t))
			}
		case xml.EndElement:
			switch t.Name.Local {
			case "t":
				inText = false
			case "p":
				text := strings.TrimSpace(paragraph.String())
				if text != "" {
					parts = append(parts, text)
				}
				paragraph.Reset()
			}
		}
	}
	return strings.Join(parts, "\n\n"), nil
}

func AddFiles(repoPath string, files []string) error {
	if len(files) == 0 {
		return fmt.Errorf("at least one file is required")
	}
	root, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	idx, err := index.Load(vicDir)
	if err != nil {
		return err
	}
	for _, file := range files {
		abs := file
		if !filepath.IsAbs(abs) {
			abs = filepath.Join(root, file)
		}
		if err := addPath(root, vicDir, idx, abs); err != nil {
			return err
		}
	}
	return idx.Save(vicDir)
}

func UnstageFiles(repoPath string, files []string) error {
	if len(files) == 0 {
		return fmt.Errorf("at least one file is required")
	}
	_, vicDir, err := repoDirs(repoPath)
	if err != nil {
		return err
	}
	idx, err := index.Load(vicDir)
	if err != nil {
		return err
	}
	for _, file := range files {
		file = filepath.ToSlash(strings.TrimSpace(file))
		if file != "" {
			idx.Remove(file)
		}
	}
	return idx.Save(vicDir)
}

func addPath(root, vicDir string, idx *index.Index, abs string) error {
	info, err := os.Stat(abs)
	if err != nil {
		return err
	}
	if info.IsDir() {
		return filepath.WalkDir(abs, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if d.IsDir() && d.Name() == ".vic" {
				return filepath.SkipDir
			}
			if d.IsDir() {
				return nil
			}
			return addFile(root, vicDir, idx, path)
		})
	}
	return addFile(root, vicDir, idx, abs)
}

func addFile(root, vicDir string, idx *index.Index, absFile string) error {
	rel, err := filepath.Rel(root, absFile)
	if err != nil {
		return err
	}
	if strings.HasPrefix(rel, "..") {
		return fmt.Errorf("add: path %s is outside the repository", absFile)
	}
	rel = filepath.ToSlash(rel)

	content, err := os.ReadFile(absFile)
	if err != nil {
		return err
	}
	hash, err := objects.WriteObject(vicDir, "blob", content)
	if err != nil {
		return err
	}
	mode := "100644"
	if fi, err := os.Stat(absFile); err == nil && fi.Mode()&0o111 != 0 {
		mode = "100755"
	}
	idx.Upsert(index.Entry{Path: rel, Mode: mode, Hash: hash})
	return nil
}
