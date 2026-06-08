import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  MessageSquarePlus,
  Pencil,
  RotateCcw,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createRepositoryFileNote,
  deleteRepositoryFileNote,
  fetchRepositoryFileNotes,
  updateRepositoryFileNote,
} from "../../services/versionControlService";

function textNodesUnder(root) {
  if (!root) return [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node = walker.nextNode();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  return nodes;
}

function textOffset(root, targetNode, targetOffset) {
  if (!root || !targetNode) return null;
  try {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(targetNode, targetOffset);
    return range.toString().length;
  } catch {
    let offset = 0;
    for (const node of textNodesUnder(root)) {
      if (node === targetNode) return offset + targetOffset;
      offset += node.textContent?.length ?? 0;
    }
    return null;
  }
}

function rangeFromOffsets(root, start, end) {
  if (!root || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return null;
  }
  const range = document.createRange();
  let cursor = 0;
  let started = false;

  for (const node of textNodesUnder(root)) {
    const length = node.textContent?.length ?? 0;
    const next = cursor + length;
    if (!started && start >= cursor && start <= next) {
      range.setStart(node, Math.max(0, start - cursor));
      started = true;
    }
    if (started && end >= cursor && end <= next) {
      range.setEnd(node, Math.max(0, end - cursor));
      return range;
    }
    cursor = next;
  }

  return null;
}

function firstTextRange(root, text) {
  const needle = String(text ?? "").trim();
  if (!root || !needle) return null;
  const start = root.textContent?.indexOf(needle) ?? -1;
  return start >= 0 ? rangeFromOffsets(root, start, start + needle.length) : null;
}

function rectsForRange(range, shell) {
  if (!range || !shell) return [];
  const shellRect = shell.getBoundingClientRect();
  return Array.from(range.getClientRects())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => ({
      top: rect.top - shellRect.top + shell.scrollTop,
      left: rect.left - shellRect.left + shell.scrollLeft,
      width: rect.width,
      height: rect.height,
    }));
}

function normalizeNote(note) {
  return {
    ...note,
    authorId: note?.authorId ?? note?.author_id ?? "",
    startOffset: Number(note?.startOffset ?? note?.start_offset),
    endOffset: Number(note?.endOffset ?? note?.end_offset),
    selectedText: note?.selectedText ?? note?.selected_text ?? "",
    authorName: note?.authorName ?? note?.author_name ?? "Collaborator",
    authorProfile: note?.authorProfile ?? note?.author_profile ?? "",
    createdAt: note?.createdAt ?? note?.created_at ?? "",
    updatedAt: note?.updatedAt ?? note?.updated_at ?? "",
    resolved: Boolean(note?.resolved),
    resolvedAt: note?.resolvedAt ?? note?.resolved_at ?? "",
  };
}

function noteAuthorName(user) {
  const full = [
    user?.firstName ?? user?.first_name,
    user?.lastName ?? user?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    user?.fullName ||
    user?.displayName ||
    full ||
    user?.username ||
    user?.user_name ||
    user?.preferred_username ||
    user?.email ||
    "Collaborator"
  );
}

function noteAuthorProfile(user) {
  return (
    user?.profilePicture ||
    user?.profile_picture ||
    user?.photoUrl ||
    user?.photo_url ||
    user?.avatarUrl ||
    user?.avatar_url ||
    user?.image ||
    ""
  );
}

function noteAuthorId(user) {
  return String(
    user?.id ??
      user?.sub ??
      user?.keycloakId ??
      user?.keycloak_id ??
      user?.username ??
      user?.user_name ??
      user?.email ??
      "",
  );
}

function initials(value) {
  const parts = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "C";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase?.() ?? "")
    .join("");
}

function NoteAvatar({ note, size = "sm" }) {
  const name = note.authorName || "Collaborator";
  const sizeClass = size === "xs" ? "h-5 w-5 text-[9px]" : "h-8 w-8 text-[11px]";
  if (note.authorProfile) {
    return (
      <img
        src={note.authorProfile}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full border border-white object-cover shadow-sm dark:border-dark-divider`}
      />
    );
  }
  return (
    <span
      className={`${sizeClass} grid shrink-0 place-items-center rounded-full border border-amber-200 bg-amber-100 font-bold text-amber-800 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-200`}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

function notesStorageKey({ owner, repo, filePath, branch }) {
  return [
    "document-viewer-notes",
    owner || "local",
    repo || "workspace",
    branch || "main",
    filePath || "untitled",
  ].join("::");
}

function loadLocalNotes(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed.map(normalizeNote) : [];
  } catch {
    return [];
  }
}

function saveLocalNotes(key, notes) {
  localStorage.setItem(key, JSON.stringify(notes));
}

export default function DocumentNoteOverlay({
  owner,
  repo,
  filePath,
  branch = "main",
  shellRef,
  contentRef,
  enabled = true,
}) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selection, setSelection] = useState(null);
  const [draft, setDraft] = useState("");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [layoutTick, setLayoutTick] = useState(0);
  const [syncError, setSyncError] = useState("");
  const sharedNotesEnabled = Boolean(owner && repo && filePath);

  const storageKey = useMemo(
    () => notesStorageKey({ owner, repo, filePath, branch }),
    [branch, filePath, owner, repo],
  );

  const refreshSharedNotes = useCallback(async () => {
    if (!sharedNotesEnabled) return false;
    try {
      const remoteNotes = await fetchRepositoryFileNotes(owner, repo, filePath, {
        ref: branch,
      });
      setNotes(remoteNotes.map(normalizeNote));
      setSyncError("");
      return true;
    } catch {
      setSyncError("Notes are not syncing. Only repository contributors can load shared notes.");
      return false;
    }
  }, [branch, filePath, owner, repo, sharedNotesEnabled]);

  useEffect(() => {
    if (!enabled || !filePath) return;
    let cancelled = false;
    async function loadNotes() {
      if (sharedNotesEnabled) {
        const loaded = await refreshSharedNotes();
        if (loaded || cancelled) return;
      }
      if (!cancelled && !sharedNotesEnabled) setNotes(loadLocalNotes(storageKey));
    }
    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [enabled, filePath, refreshSharedNotes, sharedNotesEnabled, storageKey]);

  useEffect(() => {
    if (!enabled || !sharedNotesEnabled) return undefined;
    const onFocus = () => {
      refreshSharedNotes();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, refreshSharedNotes, sharedNotesEnabled]);

  useEffect(() => {
    const shell = shellRef?.current;
    if (!shell) return undefined;
    const bump = () => setLayoutTick((value) => value + 1);
    shell.addEventListener("scroll", bump, { passive: true });
    window.addEventListener("resize", bump);
    return () => {
      shell.removeEventListener("scroll", bump);
      window.removeEventListener("resize", bump);
    };
  }, [shellRef]);

  useEffect(() => {
    if (!enabled || !filePath) return undefined;
    const shell = shellRef.current;
    const content = contentRef.current;
    if (!shell || !content) return undefined;

    const captureSelection = () => {
      const selected = window.getSelection();
      if (!selected || selected.rangeCount === 0 || selected.isCollapsed) return;
      const range = selected.getRangeAt(0);
      if (!content.contains(range.commonAncestorContainer)) return;

      const startOffset = textOffset(content, range.startContainer, range.startOffset);
      const endOffset = textOffset(content, range.endContainer, range.endOffset);
      const selectedText = selected.toString().trim();
      const rect =
        range.getBoundingClientRect?.() ||
        Array.from(range.getClientRects?.() || [])[0];
      const shellRect = shell.getBoundingClientRect();
      if (!selectedText || startOffset == null || endOffset == null || !rect) {
        return;
      }

      setSelection({
        selectedText,
        startOffset: Math.min(startOffset, endOffset),
        endOffset: Math.max(startOffset, endOffset),
        top: rect.bottom - shellRect.top + shell.scrollTop + 8,
        left: rect.left - shellRect.left + shell.scrollLeft,
      });
      setDraft("");
    };

    const scheduleCapture = () => window.setTimeout(captureSelection, 0);

    document.addEventListener("mouseup", scheduleCapture);
    document.addEventListener("keyup", scheduleCapture);
    return () => {
      document.removeEventListener("mouseup", scheduleCapture);
      document.removeEventListener("keyup", scheduleCapture);
    };
  }, [contentRef, enabled, filePath, shellRef]);

  const renderedNotes = useMemo(() => {
    const shell = shellRef?.current;
    const content = contentRef?.current;
    if (!shell || !content) return [];

    return notes
      .map((note) => {
        const byOffsets = rangeFromOffsets(content, note.startOffset, note.endOffset);
        const range = byOffsets || firstTextRange(content, note.selectedText);
        const rects = rectsForRange(range, shell);
        if (!rects.length) return null;
        const first = rects[0];
        return {
          note,
          rects,
          marker: {
            top: first.top,
            left: Math.max(8, first.left - 30),
          },
        };
      })
      .filter(Boolean);
  }, [contentRef, layoutTick, notes, shellRef]);

  const activeNote = renderedNotes.find((item) => item.note.id === activeNoteId);
  const sortedNotes = useMemo(
    () => [...renderedNotes].sort((a, b) => a.marker.top - b.marker.top),
    [renderedNotes],
  );
  const activeNoteIndex = sortedNotes.findIndex(
    (item) => item.note.id === activeNoteId,
  );
  const openNoteCount = notes.filter((note) => !note.resolved).length;
  const resolvedNoteCount = notes.length - openNoteCount;
  const navigatorTop = (shellRef.current?.scrollTop ?? 0) + 12;

  const updateLocalNotes = (updater) => {
    setNotes((current) => {
      const next = updater(current);
      saveLocalNotes(storageKey, next);
      return next;
    });
  };

  const copySelection = async () => {
    if (!selection?.selectedText) return;
    try {
      await navigator.clipboard.writeText(selection.selectedText);
      setSelection(null);
    } catch {
      setSelection(null);
    }
  };

  const closeComposer = () => {
    setSelection(null);
    setDraft("");
  };

  const saveNote = async () => {
    if (!selection || !draft.trim()) return;
    const note = normalizeNote({
      id: `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      selectedText: selection.selectedText,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      body: draft.trim(),
      authorId: noteAuthorId(user),
      authorName: noteAuthorName(user),
      authorProfile: noteAuthorProfile(user),
      createdAt: new Date().toISOString(),
      resolved: false,
    });

    if (sharedNotesEnabled) {
      try {
        const saved = normalizeNote(
          await createRepositoryFileNote(owner, repo, {
            branch,
            filePath,
            selectedText: note.selectedText,
            startOffset: note.startOffset,
            endOffset: note.endOffset,
            body: note.body,
          }),
        );
        setNotes((current) => [...current, saved]);
        setActiveNoteId(saved.id);
        setSyncError("");
      } catch {
        setSyncError("Could not save this shared note. Please check that you are an accepted contributor.");
        return;
      }
    } else {
      updateLocalNotes((current) => [...current, note]);
      setActiveNoteId(note.id);
    }
    setSelection(null);
    setDraft("");
    window.getSelection()?.removeAllRanges();
  };

  const handleDraftKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      saveNote();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeComposer();
    }
  };

  const startEdit = (note) => {
    setEditingNoteId(note.id);
    setEditDraft(note.body ?? "");
  };

  const saveEdit = async () => {
    if (!editingNoteId || !editDraft.trim()) return;
    if (sharedNotesEnabled) {
      try {
        const updated = normalizeNote(
          await updateRepositoryFileNote(owner, repo, editingNoteId, {
            body: editDraft.trim(),
          }),
        );
        setNotes((current) =>
          current.map((note) => (note.id === editingNoteId ? updated : note)),
        );
      } catch {
        setSyncError("Could not update this shared note.");
        return;
      }
    } else {
      updateLocalNotes((current) =>
        current.map((note) =>
          note.id === editingNoteId
            ? normalizeNote({
                ...note,
                body: editDraft.trim(),
                updatedAt: new Date().toISOString(),
              })
            : note,
        ),
      );
    }
    setEditingNoteId(null);
    setEditDraft("");
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditDraft("");
  };

  const handleEditKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      saveEdit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  };

  const setResolved = async (noteId, resolved) => {
    if (sharedNotesEnabled) {
      try {
        const updated = normalizeNote(
          await updateRepositoryFileNote(owner, repo, noteId, { resolved }),
        );
        setNotes((current) =>
          current.map((note) => (note.id === noteId ? updated : note)),
        );
        setSyncError("");
        return;
      } catch {
        setSyncError("Could not change this shared note status.");
        return;
      }
    }
    updateLocalNotes((current) =>
      current.map((note) =>
        note.id === noteId
          ? normalizeNote({
              ...note,
              resolved,
              resolvedAt: resolved ? new Date().toISOString() : "",
              updatedAt: new Date().toISOString(),
            })
          : note,
      ),
    );
  };

  const deleteNote = async (noteId) => {
    if (sharedNotesEnabled) {
      try {
        await deleteRepositoryFileNote(owner, repo, noteId);
        setNotes((current) => current.filter((note) => note.id !== noteId));
      } catch {
        setSyncError("Could not delete this shared note.");
        return;
      }
    } else {
      updateLocalNotes((current) => current.filter((note) => note.id !== noteId));
    }
    setActiveNoteId(null);
    setEditingNoteId(null);
    setEditDraft("");
  };

  const navigateNote = (direction) => {
    if (!sortedNotes.length) return;
    const nextIndex =
      activeNoteIndex < 0
        ? direction > 0
          ? 0
          : sortedNotes.length - 1
        : (activeNoteIndex + direction + sortedNotes.length) % sortedNotes.length;
    const target = sortedNotes[nextIndex];
    setActiveNoteId(target.note.id);
    shellRef.current?.scrollTo({
      top: Math.max(0, target.marker.top - 96),
      behavior: "smooth",
    });
  };

  if (!enabled || !filePath) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {sortedNotes.length ? (
        <div
          className="pointer-events-auto absolute right-3 z-30 flex max-w-[calc(100%-1.5rem)] justify-end"
          style={{ top: navigatorTop }}
        >
          <div className="flex max-w-full items-center gap-2 rounded-lg border border-light-divider bg-white/95 px-2.5 py-2 text-xs text-(--color-light-text-primary) shadow-lg backdrop-blur dark:border-dark-divider dark:bg-(--color-dark-card-bg)/95 dark:text-(--color-dark-text-primary)">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              <StickyNote size={15} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {sortedNotes.length} note{sortedNotes.length === 1 ? "" : "s"}
              </p>
              <p className="truncate text-[10px] text-muted dark:text-dark-muted">
                {openNoteCount} open
                {resolvedNoteCount ? `, ${resolvedNoteCount} resolved` : ""}
                {activeNoteIndex >= 0 ? ` · ${activeNoteIndex + 1}/${sortedNotes.length}` : ""}
              </p>
            </div>
            <div className="flex rounded-md border border-light-divider dark:border-dark-divider">
              <button
                type="button"
                className="grid h-8 w-8 place-items-center border-r border-light-divider hover:bg-light-hover dark:border-dark-divider dark:hover:bg-dark-hover"
                onClick={() => navigateNote(-1)}
                aria-label="Previous note"
                title="Previous note"
              >
                <ChevronUp size={15} />
              </button>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center hover:bg-light-hover dark:hover:bg-dark-hover"
                onClick={() => navigateNote(1)}
                aria-label="Next note"
                title="Next note"
              >
                <ChevronDown size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {syncError ? (
        <div
          className="pointer-events-auto absolute left-3 right-3 top-3 z-30 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 shadow-lg dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200"
        >
          {syncError}
        </div>
      ) : null}

      {renderedNotes.flatMap(({ note, rects }) =>
        rects.map((rect, index) => (
          <div
            key={`${note.id}-highlight-${index}`}
            className={`absolute rounded-sm ${
              note.resolved ? "bg-emerald-300/12" : "bg-amber-300/25"
            }`}
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
          />
        )),
      )}

      {renderedNotes.map(({ note, marker }) => (
        <button
          key={note.id}
          type="button"
          className={`pointer-events-auto absolute grid h-8 w-8 place-items-center rounded-full border shadow-sm transition ${
            note.resolved
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
          } ${
            activeNoteId === note.id
              ? "ring-2 ring-(--color-light-input-border-focus) dark:ring-(--color-dark-input-border-focus)"
              : ""
          }`}
          style={{ top: marker.top, left: marker.left }}
          onMouseEnter={() => setActiveNoteId(note.id)}
          onFocus={() => setActiveNoteId(note.id)}
          onClick={() => setActiveNoteId((current) => current === note.id ? null : note.id)}
          aria-label="Show collaborator note"
          aria-pressed={activeNoteId === note.id}
          title={`${note.authorName || "Collaborator"}'s note`}
        >
          <span className="relative">
            <NoteAvatar note={note} size="xs" />
            <span className="absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full border border-white bg-white dark:border-dark-divider dark:bg-(--color-dark-card-bg)">
              {note.resolved ? <CheckCircle2 size={10} /> : <StickyNote size={10} />}
            </span>
          </span>
        </button>
      ))}

      {selection ? (
        <div
          className="pointer-events-auto absolute w-80 rounded-lg border border-light-divider bg-white p-3 text-xs text-(--color-light-text-primary) shadow-xl dark:border-dark-divider dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-primary)"
          style={{ top: selection.top, left: Math.max(8, selection.left) }}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="line-clamp-2 text-[11px] text-muted dark:text-dark-muted">
              {selection.selectedText}
            </p>
            <button
              type="button"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-light-hover dark:hover:bg-dark-hover"
              onClick={() => setSelection(null)}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-light-divider px-2 font-semibold hover:bg-light-hover dark:border-dark-divider dark:hover:bg-dark-hover"
              onClick={copySelection}
            >
              <Copy size={13} />
              Copy
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-light-divider px-2 font-semibold hover:bg-light-hover dark:border-dark-divider dark:hover:bg-dark-hover"
              onClick={() => setDraft((value) => value || " ")}
            >
              <MessageSquarePlus size={13} />
              Add note
            </button>
          </div>
          {draft ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleDraftKeyDown}
                autoFocus
                rows={3}
                className="w-full resize-none rounded-md border border-light-divider bg-white p-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-(--color-light-input-border-focus) dark:border-dark-divider dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-text-muted) dark:focus:border-(--color-dark-input-border-focus)"
                placeholder="Add a note. After the problem is fixed in a commit, mark this note resolved."
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted dark:text-dark-muted">
                  Use this to track a selected issue until a later commit resolves it.
                  <span className="ml-1 font-semibold">Ctrl+Enter saves.</span>
                </p>
                <button
                  type="button"
                  className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-white disabled:opacity-60 dark:bg-dark-primary"
                  onClick={saveNote}
                  disabled={!draft.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeNote ? (
        <div
          className="pointer-events-auto absolute w-80 rounded-lg border border-light-divider bg-white p-3 text-xs text-(--color-light-text-primary) shadow-xl dark:border-dark-divider dark:bg-(--color-dark-card-bg) dark:text-(--color-dark-text-primary)"
          style={{
            top: activeNote.marker.top + 30,
            left: activeNote.marker.left + 4,
          }}
          onMouseEnter={() => setActiveNoteId(activeNote.note.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex flex-1 items-start gap-2">
              <NoteAvatar note={activeNote.note} />
              <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{activeNote.note.authorName}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    activeNote.note.resolved
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                  }`}
                >
                  {activeNote.note.resolved ? "Resolved" : "Open"}
                </span>
              </div>
              {activeNote.note.createdAt ? (
                <p className="mt-0.5 text-[10px] text-muted dark:text-dark-muted">
                  Created {new Date(activeNote.note.createdAt).toLocaleString()}
                </p>
              ) : null}
              <p className="mt-1 line-clamp-2 text-[11px] text-muted dark:text-dark-muted">
                {activeNote.note.selectedText}
              </p>
              </div>
            </div>
            <button
              type="button"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-light-hover dark:hover:bg-dark-hover"
              onClick={() => {
                setActiveNoteId(null);
                setEditingNoteId(null);
              }}
              aria-label="Close note"
            >
              <X size={14} />
            </button>
          </div>

          {editingNoteId === activeNote.note.id ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={editDraft}
                onChange={(event) => setEditDraft(event.target.value)}
                onKeyDown={handleEditKeyDown}
                rows={4}
                className="w-full resize-none rounded-md border border-light-divider bg-white p-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-(--color-light-input-border-focus) dark:border-dark-divider dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-text-muted) dark:focus:border-(--color-dark-input-border-focus)"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="h-8 rounded-md border border-light-divider px-3 font-semibold hover:bg-light-hover dark:border-dark-divider dark:hover:bg-dark-hover"
                  onClick={() => {
                    cancelEdit();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8 rounded-md bg-primary px-3 font-semibold text-white disabled:opacity-60 dark:bg-dark-primary"
                  onClick={saveEdit}
                  disabled={!editDraft.trim()}
                >
                  Save
                </button>
              </div>
              <p className="text-right text-[10px] text-muted dark:text-dark-muted">
                Ctrl+Enter saves. Esc cancels.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-3 whitespace-pre-wrap leading-5">
                {activeNote.note.body}
              </p>
              {!activeNote.note.resolved ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                  After the issue is fixed in a commit, mark this note resolved.
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-light-divider px-2 font-semibold hover:bg-light-hover dark:border-dark-divider dark:hover:bg-dark-hover"
                  onClick={() => startEdit(activeNote.note)}
                >
                  <Pencil size={13} />
                  Edit
                </button>
                {activeNote.note.resolved ? (
                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-light-divider px-2 font-semibold hover:bg-light-hover dark:border-dark-divider dark:hover:bg-dark-hover"
                    onClick={() => setResolved(activeNote.note.id, false)}
                  >
                    <RotateCcw size={13} />
                    Reopen
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                    onClick={() => setResolved(activeNote.note.id, true)}
                  >
                    <CheckCircle2 size={13} />
                    Resolve
                  </button>
                )}
                <button
                  type="button"
                  className="ml-auto inline-flex h-8 items-center gap-1 rounded-md border border-red-200 px-2 font-semibold text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
                  onClick={() => deleteNote(activeNote.note.id)}
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
