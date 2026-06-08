import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gooeyToast } from "goey-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Code2,
  Eye,
  Image as ImageIcon,
  MoreHorizontal,
  Quote,
  Rows3,
  X,
} from "lucide-react";
import Select from "../../components/Select";
import {
  DropdownContent,
  DropdownItem,
  DropdownMenuRoot,
  DropdownSeparator,
  DropdownTrigger,
} from "../../components/DropdownMenu";
import { useAuth } from "../../context/AuthContext";
import { htmlToArticleBlocks } from "../../lib/htmlToArticleBlocks";
import {
  useCreateArticle,
  useCreateDraftArticle,
  useArticle,
  useUpdateArticle,
  useUploadBlogFile,
} from "../../services/useApi";

const STORAGE_KEY_PREFIX = "draft_story_v2";
const BLOCK_INSERT_TAGS = new Set(["DIV", "FIGURE", "HR", "VIDEO", "IFRAME"]);
const CODE_BLOCK_CLASS =
  "my-6 max-w-full overflow-x-auto whitespace-pre rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-4 font-mono text-sm leading-6 text-primary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary dark:text-dark-primary";

function draftStorageKey(user) {
  const userKey =
    user?.id || user?.user_name || user?.username || user?.email || "guest";
  return `${STORAGE_KEY_PREFIX}:${String(userKey).toLowerCase()}`;
}

function placeCaretInside(el) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function ensureParagraphAfterBlock(node) {
  if (!BLOCK_INSERT_TAGS.has(node?.nodeName)) return false;
  const p = document.createElement("p");
  p.innerHTML = "<br>";
  node.after(p);
  placeCaretInside(p);
  return true;
}

function insertAtCaret(editorEl, node) {
  if (!editorEl) return;
  editorEl.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    editorEl.appendChild(node);
    ensureParagraphAfterBlock(node);
    return;
  }
  const range = sel.getRangeAt(0);
  let anchor = range.commonAncestorContainer;
  if (anchor.nodeType !== Node.ELEMENT_NODE && anchor.parentElement) {
    anchor = anchor.parentElement;
  }
  const inside = anchor instanceof Element && editorEl.contains(anchor);
  if (!inside) {
    editorEl.appendChild(node);
    ensureParagraphAfterBlock(node);
    return;
  }
  range.deleteContents();
  range.insertNode(node);
  if (!ensureParagraphAfterBlock(node)) {
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

function ensureParagraphAfter(node) {
  const next = node?.nextSibling;
  if (next?.nodeType === Node.ELEMENT_NODE && next.tagName === "P") {
    return next;
  }
  const p = document.createElement("p");
  p.innerHTML = "<br>";
  node.after(p);
  return p;
}

function resizeTextArea(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function IconPlus() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ToolChip({ title: label, children, onClick }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) text-primary shadow-sm transition-colors hover:bg-light-app-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-primary dark:hover:bg-dark-app-tertiary dark:focus-visible:ring-blue-400/15"
    >
      {children}
    </button>
  );
}

function FormatButton({ active = false, title, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:focus-visible:ring-blue-400/15 ${
        active
          ? "bg-(--color-light-btn-primary-bg) text-(--color-light-btn-primary-text) dark:bg-(--color-dark-btn-primary-bg) dark:text-(--color-dark-btn-primary-text)"
          : "text-secondary hover:bg-light-app-tertiary dark:text-dark-secondary dark:hover:bg-dark-app-tertiary"
      }`}
    >
      {children}
    </button>
  );
}

function mapAudienceToVisibility(v) {
  if (v === "unlisted") return "UNLISTED";
  if (v === "members") return "MEMBERS_ONLY";
  return "PUBLIC";
}

function fileExtensionFromMime(type) {
  const mime = String(type ?? "").toLowerCase();
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "bin";
}

function fileFromDataUrl(dataUrl, fallbackName = "story-image") {
  const match = String(dataUrl ?? "").match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) return null;

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || "";
  const binary = isBase64 ? window.atob(payload) : decodeURIComponent(payload);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const safeName =
    String(fallbackName || "story-image")
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^\w.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "story-image";

  return new File([bytes], `${safeName}.${fileExtensionFromMime(mimeType)}`, {
    type: mimeType,
  });
}

function makeArticleId() {
  const bytes = new Uint8Array(12);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function unwrapUploadResponse(response) {
  return response?.json ?? response?.data ?? response ?? {};
}

function uploadFileId(response) {
  const data = unwrapUploadResponse(response);
  return data.fileId ?? data.id ?? data.file_id ?? "";
}

function uploadFileUrl(response) {
  const data = unwrapUploadResponse(response);
  return data.cdnUrl ?? data.url ?? data.fileUrl ?? data.downloadUrl ?? "";
}

function editorHasPublishableContent(editorEl) {
  if (!editorEl) return false;
  if (String(editorEl.innerText ?? "").trim()) return true;
  return Boolean(
    editorEl.querySelector("img,figure,video,iframe,pre,blockquote,hr"),
  );
}

function articleBlocksToHtml(blocks = []) {
  return [...blocks]
    .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
    .map((block) => {
      const type = String(block?.type ?? block?.blockType ?? "").toUpperCase();
      const data =
        typeof block?.data === "object" && block.data ? block.data : {};
      const text = String(data.text ?? "")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      if (type === "HEADING")
        return `<h${data.level || 2}>${text}</h${data.level || 2}>`;
      if (type === "QUOTE") return `<blockquote>${text}</blockquote>`;
      if (type === "CODE") return `<pre>${String(data.code ?? "")}</pre>`;
      if (type === "DIVIDER") return "<hr />";
      if (type === "IMAGE" && data.url) {
        const fileId = data.fileId || data.file_id || "";
        return `<figure class="my-8 mx-auto flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary"><img src="${data.url}" alt="${data.alt ?? ""}" data-file-id="${fileId}" class="h-full w-full object-cover" /></figure>`;
      }
      return text ? `<p>${text}</p>` : "";
    })
    .join("");
}

export default function WriteStory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const editArticleId = searchParams.get("articleId") || "";

  const userInitial = (
    user?.first_name?.[0] ||
    user?.last_name?.[0] ||
    user?.user_name?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();
  const storageKey = useMemo(() => draftStorageKey(user), [user]);

  const initialDraft = useMemo(() => {
    const defaults = {
      title: "",
      subtitle: "",
      tags: "",
      visibility: "public",
      cover: null,
      body: "",
      restoredAt: null,
    };

    try {
      if (typeof window === "undefined") return defaults;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaults;

      const data = JSON.parse(raw);
      return {
        title: data.title || "",
        subtitle: data.subtitle || "",
        tags: (data.tags || []).join(", "),
        visibility: data.visibility || "public",
        cover: data.cover || null,
        body: data.body || "",
        direction: data.direction || "auto",
        restoredAt: typeof data.lastSaved === "number" ? data.lastSaved : null,
      };
    } catch {
      return defaults;
    }
  }, [storageKey]);

  const [title, setTitle] = useState(initialDraft.title);
  const [subtitle, setSubtitle] = useState(initialDraft.subtitle);
  const [tags, setTags] = useState(initialDraft.tags);
  const [visibility, setVisibility] = useState(initialDraft.visibility);
  /** Data URL preview (local autosave); optional uploaded file below. */
  const [cover, setCover] = useState(initialDraft.cover);
  const [coverFile, setCoverFile] = useState(null);
  const [writingDirection, setWritingDirection] = useState(
    initialDraft.direction || "auto",
  );
  const inlineFileByDataUrlRef = useRef(new Map());
  const [contentKind, setContentKind] = useState("WEBLOG");
  const [savedNote, setSavedNote] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHTML, setPreviewHTML] = useState("");
  const [manualUploadBusy, setManualUploadBusy] = useState(false);
  const [isBodyEmpty, setIsBodyEmpty] = useState(
    !(initialDraft.body || "").trim(),
  );
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [activeBlockTop, setActiveBlockTop] = useState(8);
  const [formatState, setFormatState] = useState({
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const editArticleQuery = useArticle(editArticleId, {
    enabled: Boolean(editArticleId),
    notifyOnError: false,
  });

  const clearLocalDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const resetEditor = useCallback(() => {
    setTitle("");
    setSubtitle("");
    setTags("");
    setVisibility("public");
    setCover(null);
    setCoverFile(null);
    setWritingDirection("auto");
    setIsBodyEmpty(true);
    if (editorRef.current) editorRef.current.innerHTML = "";
  }, []);

  const createJson = useCreateArticle({
    onSuccess: (data) => {
      clearLocalDraft();
      resetEditor();
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      navigate("/author/unpublished");
    },
    showSuccessToast: true,
    toastSuccess: t("writerStory.success.published"),
  });

  const updateJson = useUpdateArticle({
    onSuccess: (data) => {
      clearLocalDraft();
      resetEditor();
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      const nextId = data?.id ?? data?.articleId ?? editArticleId;
      if (nextId) navigate(`/story/${nextId}`);
    },
    showSuccessToast: true,
    toastSuccess: t("writerStory.success.published"),
  });

  const saveDraft = useCreateDraftArticle({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      const nextId = data?.id ?? data?.articleId;
      if (nextId) {
        gooeyToast.success(
          t("writerStory.success.draftWithId", { id: nextId }),
        );
      }
    },
    showSuccessToast: false,
  });

  const uploadBlogFile = useUploadBlogFile({
    showSuccessToast: false,
  });

  const submitBusy =
    manualUploadBusy ||
    createJson.isPending ||
    updateJson.isPending ||
    uploadBlogFile.isPending ||
    saveDraft.isPending;

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    resizeTextArea(titleRef.current);
  }, [title]);

  useEffect(() => {
    if (!initialDraft.restoredAt) return;
    setSavedNote(
      t("writerStory.autosave.restoredAt", {
        time: new Date(initialDraft.restoredAt).toLocaleString(),
      }),
    );
    const tid = window.setTimeout(() => setSavedNote(""), 5200);
    return () => window.clearTimeout(tid);
  }, [initialDraft.restoredAt, t]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = initialDraft.body || "";
  }, [initialDraft.body]);

  useEffect(() => {
    const article = editArticleQuery.data;
    if (!article || !editArticleId) return;
    const meta = article.metadata || {};
    const blocks = article.content?.blocks ?? article.blocks ?? [];
    setTitle(article.title || "");
    setSubtitle(article.subtitle || article.description || "");
    setTags(Array.isArray(article.tags) ? article.tags.join(", ") : "");
    setVisibility(String(article.visibility ?? "PUBLIC").toLowerCase());
    setContentKind(String(article.contentType ?? "WEBLOG").toUpperCase());
    setCover(
      article.coverImageUrl ||
        article.thumbnailUrl ||
        meta.coverImageUrl ||
        meta.thumbnailUrl ||
        null,
    );
    if (editorRef.current) {
      editorRef.current.innerHTML =
        articleBlocksToHtml(blocks) ||
        article.contentHtml ||
        article.body ||
        "";
      setIsBodyEmpty(!editorRef.current.innerText.trim());
    }
  }, [editArticleId, editArticleQuery.data]);

  const updateBlockToolbarPosition = useCallback(() => {
    const ed = editorRef.current;
    const sel = window.getSelection();
    if (!ed || !sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    let node = range.commonAncestorContainer;
    if (node.nodeType !== Node.ELEMENT_NODE && node.parentElement) {
      node = node.parentElement;
    }
    const block =
      node instanceof Element
        ? node.closest("p,h1,h2,h3,h4,h5,h6,blockquote,pre,figure,hr,div")
        : null;
    if (!block || !ed.contains(block)) return;
    const editorRect = ed.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    setActiveBlockTop(Math.max(4, blockRect.top - editorRect.top - 46));
    setFormatState({
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
    });
  }, []);

  const autosave = useCallback(() => {
    const payload = {
      title,
      subtitle,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      visibility,
      cover,
      body: editorRef.current?.innerHTML || "",
      direction: writingDirection,
      lastSaved: Date.now(),
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));
    setSavedNote(t("writerStory.autosave.localSaved"));

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSavedNote("");
    }, 2000);
  }, [
    cover,
    subtitle,
    storageKey,
    tags,
    title,
    visibility,
    writingDirection,
    t,
  ]);

  useEffect(() => {
    const intervalId = setInterval(autosave, 5000);
    return () => {
      clearInterval(intervalId);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [autosave]);

  const exec = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateBlockToolbarPosition();
  };

  const applyDirection = (direction) => {
    setWritingDirection(direction);
    if (editorRef.current) {
      editorRef.current.dir = direction === "auto" ? "auto" : direction;
      editorRef.current.style.textAlign =
        direction === "rtl" ? "right" : direction === "ltr" ? "left" : "";
      editorRef.current.focus();
    }
  };

  const clearCover = () => {
    setCover(null);
    setCoverFile(null);
  };

  const appendOrInsert = useCallback(
    (el) => {
      const ed = editorRef.current;
      if (!ed) return;
      insertAtCaret(ed, el);
      setIsBodyEmpty(!editorHasPublishableContent(ed));
      autosave();
    },
    [autosave],
  );

  const insertImageFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = String(event.target?.result || "");
        if (dataUrl) inlineFileByDataUrlRef.current.set(dataUrl, file);
        const wrapper = document.createElement("figure");
        wrapper.className =
          "my-8 mx-auto flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary text-center dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary";

        const img = document.createElement("img");
        img.src = dataUrl;
        img.alt = file.name || "Story image";
        img.className = "h-full w-full object-cover";

        wrapper.appendChild(img);
        appendOrInsert(wrapper);
      };
      reader.readAsDataURL(file);
    },
    [appendOrInsert],
  );

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    files.forEach(insertImageFile);
  };

  const handlePaste = (event) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type?.startsWith("image/"));
    if (!imageItem) return;

    const file = imageItem.getAsFile();
    insertImageFile(file);
    event.preventDefault();
  };

  const handleInsert = useCallback(
    (type) => {
      const ed = editorRef.current;

      if (type === "divider") {
        const divider = document.createElement("hr");
        divider.className =
          "my-10 border-0 border-t border-light-divider dark:border-dark-divider";
        appendOrInsert(divider);
        return;
      }

      if (type === "image" || type === "gallery") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.onchange = (event) => {
          const files = Array.from(event.target.files || []);
          files.forEach(insertImageFile);
        };
        input.click();
        return;
      }

      if (type === "code") {
        if (!ed) return;
        const pre = document.createElement("pre");
        pre.className = CODE_BLOCK_CLASS;
        pre.innerHTML = "<br>";
        insertAtCaret(ed, pre);
        ensureParagraphAfter(pre);
        placeCaretInside(pre);
        setIsBodyEmpty(false);
        autosave();
        return;
      }

      if (type === "quote") {
        ed?.focus();
        exec("formatBlock", "BLOCKQUOTE");
      }
    },
    [appendOrInsert, autosave, exec, insertImageFile],
  );

  const handleEditorKeyDown = (event) => {
    const ed = editorRef.current;
    const sel = window.getSelection();
    const node = sel?.anchorNode;
    const el =
      node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
    const pre = el?.closest?.("pre");
    if (!ed || !pre || !ed.contains(pre)) return;

    if (event.key === "Tab") {
      event.preventDefault();
      document.execCommand("insertText", false, "  ");
      return;
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertText", false, "\n");
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const p = ensureParagraphAfter(pre);
      placeCaretInside(p);
      setToolbarOpen(false);
      updateBlockToolbarPosition();
    }
  };

  const handleCover = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverFile(file);

    const reader = new FileReader();
    reader.onload = (loadEvent) => setCover(loadEvent.target?.result || null);
    reader.readAsDataURL(file);
  };

  const buildArticlePayload = () => {
    const tagsArr = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    let blocks = htmlToArticleBlocks(editorRef.current);
    if (!blocks.length) {
      blocks = [
        {
          type: "TEXT",
          order: 0,
          data: { text: (editorRef.current?.innerText || "").trim() || " " },
        },
      ];
    }
    const subtitleStr = subtitle.trim();
    const desc =
      subtitleStr || (tagsArr.length ? tagsArr.join(", ") : undefined);
    return {
      title: title.trim(),
      subtitle: subtitleStr || undefined,
      description: desc,
      blocks,
      tags: tagsArr.length ? tagsArr : [],
      keywords: tagsArr.length ? tagsArr : undefined,
      visibility: mapAudienceToVisibility(visibility),
      contentType: contentKind === "MONOGRAPH" ? "MONOGRAPH" : "WEBLOG",
      coverImageUrl:
        typeof cover === "string" && cover.startsWith("http")
          ? cover
          : undefined,
    };
  };

  const handlePublish = async () => {
    if (!user?.id) {
      gooeyToast.error(t("writerStory.error.signInRequired"));
      return;
    }
    if (!title.trim()) {
      gooeyToast.error(t("writerStory.error.titleRequired"));
      return;
    }
    if (!editorHasPublishableContent(editorRef.current)) {
      gooeyToast.error(t("writerStory.error.bodyRequired"));
      return;
    }
    autosave();

    const base = buildArticlePayload();
    const inlineFiles = [];
    const blocksForSubmit = (base.blocks ?? []).map((block) => {
      const type = String(block?.type ?? "").toUpperCase();
      const url = block?.data?.url;
      const isMediaBlock = type === "IMAGE" || type === "VIDEO";
      const mappedFile =
        typeof url === "string"
          ? inlineFileByDataUrlRef.current.get(url)
          : null;
      const reconstructedFile =
        !mappedFile && typeof url === "string" && url.startsWith("data:")
          ? fileFromDataUrl(
              url,
              block?.data?.alt ||
                `${type.toLowerCase()}-${block?.order ?? inlineFiles.length}`,
            )
          : null;
      const file = mappedFile || reconstructedFile;

      if (isMediaBlock && file instanceof File) {
        const uploadIndex = inlineFiles.length;
        inlineFiles.push(file);
        const { url: _url, ...dataWithoutUrl } = block.data ?? {};
        return {
          ...block,
          data: {
            ...dataWithoutUrl,
            alt:
              String(dataWithoutUrl.alt ?? "").trim() ||
              file.name ||
              "Story image",
            uploadIndex,
          },
        };
      }
      if (type === "IMAGE") {
        return {
          ...block,
          data: {
            ...(block.data ?? {}),
            alt: String(block?.data?.alt ?? "").trim() || "Story image",
          },
        };
      }
      if (type === "CODE") {
        return {
          ...block,
          data: {
            ...(block.data ?? {}),
            language: String(block?.data?.language ?? "").trim() || "text",
          },
        };
      }
      return block;
    });
    const unresolvedMediaBlock = blocksForSubmit.find((block) => {
      const type = String(block?.type ?? "").toUpperCase();
      if (type !== "IMAGE" && type !== "VIDEO") return false;
      const data = block?.data ?? {};
      return !data.fileId && data.uploadIndex == null;
    });

    if (unresolvedMediaBlock) {
      gooeyToast.error(t("writerStory.error.imageUploadRequired"));
      return;
    }

    if (coverFile instanceof File || inlineFiles.length) {
      const articleId = editArticleId || makeArticleId();
      setManualUploadBusy(true);
      try {
        let coverImageFileId;
        let coverImageUrl = base.coverImageUrl;

        if (coverFile instanceof File) {
          const uploadedCover = await uploadBlogFile.mutateAsync({
            file: coverFile,
            ownerId: user.id,
            articleId,
          });
          coverImageFileId = uploadFileId(uploadedCover);
          coverImageUrl = uploadFileUrl(uploadedCover);
          if (!coverImageFileId || !coverImageUrl) {
            gooeyToast.error(t("writerStory.error.imageUploadRequired"));
            return;
          }
        }

        const uploadedBlocks = [];
        for (const block of blocksForSubmit) {
          const type = String(block?.type ?? "").toUpperCase();
          const uploadIndex = block?.data?.uploadIndex;
          if ((type === "IMAGE" || type === "VIDEO") && uploadIndex != null) {
            const file = inlineFiles[uploadIndex];
            if (!(file instanceof File)) {
              gooeyToast.error(t("writerStory.error.imageUploadRequired"));
              return;
            }
            const uploaded = await uploadBlogFile.mutateAsync({
              file,
              ownerId: user.id,
              articleId,
            });
            const fileId = uploadFileId(uploaded);
            const url = uploadFileUrl(uploaded);
            if (!fileId || !url) {
              gooeyToast.error(t("writerStory.error.imageUploadRequired"));
              return;
            }
            const { uploadIndex: _uploadIndex, ...dataWithoutUploadIndex } =
              block.data ?? {};
            uploadedBlocks.push({
              ...block,
              data: {
                ...dataWithoutUploadIndex,
                fileId,
                url,
                alt:
                  String(dataWithoutUploadIndex.alt ?? "").trim() ||
                  file.name ||
                  "Story image",
              },
            });
            continue;
          }
          uploadedBlocks.push(block);
        }

        const payload = {
          ...base,
          blocks: uploadedBlocks,
          ...(coverImageFileId ? { coverImageFileId } : {}),
          ...(coverImageUrl ? { coverImageUrl } : {}),
        };

        if (editArticleId) {
          await updateJson.mutateAsync({
            articleId,
            authorId: user.id,
            ...payload,
          });
        } else {
          await createJson.mutateAsync({
            userId: user.id,
            id: articleId,
            ...payload,
          });
        }
      } catch {
        // The mutation layer already shows the localized upload/create error.
      } finally {
        setManualUploadBusy(false);
      }
      return;
    }

    if (editArticleId) {
      updateJson.mutate({
        articleId: editArticleId,
        authorId: user.id,
        ...base,
      });
      return;
    }
    createJson.mutate({ userId: user.id, ...base });
  };

  const handleSaveDraft = () => {
    if (!user?.id) {
      gooeyToast.error(t("writerStory.error.signInRequired"));
      return;
    }
    if (!title.trim()) {
      gooeyToast.error(t("writerStory.error.titleRequired"));
      return;
    }

    autosave();

    const base = buildArticlePayload();

    if (coverFile instanceof File) {
      gooeyToast.success(t("writerStory.warning.draftCoverDeferred"));
    }

    saveDraft.mutate({ userId: user.id, ...base });
  };

  const handlePreview = () => {
    autosave();
    setPreviewHTML(editorRef.current?.innerHTML || "");
    setPreviewOpen(true);
  };

  const closeToolbarAnd = (fn) => {
    fn();
    setToolbarOpen(false);
  };

  return (
    <div className="min-h-full bg-white pb-28 text-neutral-900 dark:bg-dark-app-secondary dark:text-neutral-50">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-neutral-200/90 bg-white/90 px-4 backdrop-blur-md dark:border-neutral-800 dark:bg-zinc-950/90 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="font-blog-display truncate text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50"
          >
            KDR.Write
          </Link>
          <span className="hidden text-sm text-neutral-400 sm:inline dark:text-neutral-500">
            {t("writerStory.meta.draft")}
          </span>
          {savedNote ? (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {savedNote}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-1 sm:gap-2">
          <button
            type="button"
            disabled={submitBusy}
            onClick={handlePublish}
            className="rounded-xl bg-(--color-light-btn-primary-bg) px-4 py-1.5 text-sm font-medium text-(--color-light-btn-primary-text) transition-colors hover:bg-(--color-light-btn-primary-hover) disabled:cursor-not-allowed disabled:opacity-35 dark:bg-(--color-dark-btn-primary-bg) dark:text-(--color-dark-btn-primary-text) dark:hover:bg-(--color-dark-btn-primary-hover)"
          >
            {submitBusy && (createJson.isPending || manualUploadBusy)
              ? t("writerStory.publishing")
              : t("writerStory.publish")}
          </button>

          <DropdownMenuRoot modal={false}>
            <DropdownTrigger
              compactIcon
              showArrow={false}
              className="!size-9 rounded-full border-0 bg-transparent hover:bg-neutral-100 dark:hover:bg-zinc-800"
              aria-label={t("writerStory.menu.more")}
            >
              <MoreHorizontal className="size-[18px] text-neutral-600 dark:text-neutral-400" />
            </DropdownTrigger>
            <DropdownContent align="end" className="min-w-[220px]">
              <DropdownItem
                icon={<Eye className="size-4" />}
                onSelect={(e) => {
                  e.preventDefault();
                  handlePreview();
                }}
              >
                {t("writerStory.menu.preview")}
              </DropdownItem>
              <DropdownItem
                disabled={submitBusy || !user?.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleSaveDraft();
                }}
              >
                {t("writerStory.menu.saveDraft")}
              </DropdownItem>
              <DropdownSeparator />
              <div
                className="flex flex-col gap-2 px-2 py-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Link
                  to="/"
                  className="rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-zinc-800"
                >
                  {t("writerStory.menu.backHome")}
                </Link>
              </div>
              <DropdownSeparator />
              <div
                className="max-h-[260px] space-y-2 overflow-auto px-2 py-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <label className="text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
                  {t("writerStory.fields.subtitle")}
                </label>
                <textarea
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  rows={2}
                  placeholder={t("writerStory.placeholders.subtitle")}
                  className="mb-3 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-400 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
                />
                <label className="text-[11px] font-semibold uppercase text-neutral-400 dark:text-neutral-500">
                  {t("writerStory.fields.tags")}
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder={t("writerStory.placeholders.tags")}
                />
                <Select
                  label={t("writerStory.fields.audience")}
                  value={visibility}
                  onChange={(val) => setVisibility(val)}
                  options={[
                    {
                      value: "public",
                      label: t("writerStory.audience.public"),
                    },
                    {
                      value: "unlisted",
                      label: t("writerStory.audience.unlisted"),
                    },
                    {
                      value: "members",
                      label: t("writerStory.audience.members"),
                    },
                  ]}
                  className="mb-3"
                />
                <Select
                  label={t("writerStory.fields.format")}
                  value={contentKind}
                  onChange={(val) => setContentKind(val)}
                  options={[
                    {
                      value: "WEBLOG",
                      label: t("writerStory.format.weblog"),
                    },
                    {
                      value: "MONOGRAPH",
                      label: t("writerStory.format.monograph"),
                    },
                  ]}
                  className="mb-3"
                />
                <label
                  htmlFor="writer-cover-v2"
                  className="block cursor-pointer rounded-xl border border-dashed border-(--color-light-card-border) px-3 py-2 text-center text-xs font-medium text-secondary transition-colors hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-dark-app-tertiary"
                >
                  {cover
                    ? t("writerStory.cover.replace")
                    : t("writerStory.cover.add")}
                </label>
                <input
                  id="writer-cover-v2"
                  type="file"
                  accept="image/*"
                  onChange={handleCover}
                  className="hidden"
                />
              </div>
            </DropdownContent>
          </DropdownMenuRoot>
        </div>
      </header>

      <main className="mx-auto w-full  max-w-6xl  px-6 sm:px-8">
        <div className="sticky top-14 z-10 -mx-6 border-b border-light-divider bg-(--color-light-card-bg)/92 px-6 py-2 backdrop-blur-md dark:border-dark-divider dark:bg-(--color-dark-card-bg)/92 sm:-mx-10 sm:px-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="me-2 flex flex-wrap items-center gap-1 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-1 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              <FormatButton
                onClick={() => exec("bold")}
                title={t("writerStory.toolbar.bold")}
              >
                B
              </FormatButton>
              <FormatButton
                onClick={() => exec("italic")}
                title={t("writerStory.toolbar.italic")}
              >
                <span className="italic">I</span>
              </FormatButton>
              <FormatButton
                onClick={() => exec("formatBlock", "H2")}
                title={t("writerStory.toolbar.heading")}
              >
                H2
              </FormatButton>
              <FormatButton
                onClick={() => exec("insertUnorderedList")}
                title={t("writerStory.toolbar.bullets")}
              >
                •
              </FormatButton>
              <FormatButton
                onClick={() => exec("justifyLeft")}
                active={formatState.justifyLeft}
                title={t("writerStory.toolbar.alignLeft")}
              >
                L
              </FormatButton>
              <FormatButton
                onClick={() => exec("justifyCenter")}
                active={formatState.justifyCenter}
                title={t("writerStory.toolbar.alignCenter")}
              >
                C
              </FormatButton>
              <FormatButton
                onClick={() => exec("justifyRight")}
                active={formatState.justifyRight}
                title={t("writerStory.toolbar.alignRight")}
              >
                R
              </FormatButton>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-1 dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
              {["ltr", "auto", "rtl"].map((dir) => (
                <FormatButton
                  key={dir}
                  active={writingDirection === dir}
                  onClick={() => applyDirection(dir)}
                  title={t(`writerStory.direction.${dir}`)}
                >
                  {dir}
                </FormatButton>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-14 sm:pt-16">
          <textarea
            ref={titleRef}
            value={title}
            rows={1}
            onChange={(e) => {
              setTitle(e.target.value);
              resizeTextArea(e.currentTarget);
            }}
            dir={writingDirection === "auto" ? "auto" : writingDirection}
            placeholder={t("writerStory.placeholders.title")}
            className="font-blog-display block max-h-[14rem] min-h-[3.25rem] w-full resize-none overflow-hidden whitespace-pre-wrap break-words border-0 bg-transparent px-0 py-2 text-[2.625rem] font-bold leading-[1.08] tracking-tight text-neutral-900 outline-none placeholder:text-neutral-400 sm:text-[2.875rem] dark:text-neutral-50 dark:placeholder:text-zinc-500"
          />
        </div>

        <div className="mt-2">
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            dir={writingDirection === "auto" ? "auto" : writingDirection}
            placeholder={t("writerStory.placeholders.optionalSubtitle")}
            className="font-blog-serif w-full border-0 bg-transparent px-0 py-1 text-[1.2rem] font-normal italic leading-snug text-neutral-600 outline-none placeholder:text-neutral-400 sm:text-xl dark:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <label
            htmlFor="writer-cover-inline"
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-(--color-light-card-border) px-4 text-sm font-medium text-secondary transition-colors hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-dark-app-tertiary"
          >
            <ImageIcon className="size-4" strokeWidth={1.85} />
            {cover
              ? t("writerStory.cover.replace")
              : t("writerStory.cover.add")}
          </label>
          <input
            id="writer-cover-inline"
            type="file"
            accept="image/*"
            onChange={handleCover}
            className="hidden"
          />
          {cover ? (
            <button
              type="button"
              onClick={clearCover}
              className="inline-flex h-9 items-center rounded-xl border border-(--color-light-card-border) px-3 text-xs font-semibold text-secondary transition-colors hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-dark-app-tertiary"
            >
              {t("writerStory.cover.remove")}
            </button>
          ) : null}
        </div>

        {cover && (
          <figure className="mt-10 aspect-video overflow-hidden rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:bg-dark-app-tertiary">
            <img src={cover} alt="" className="h-full w-full object-cover" />
          </figure>
        )}

        <div className="relative mt-8 min-h-[50vh]">
          <div
            className="absolute start-2 z-[3] flex items-start gap-2 transition-[top] duration-200 ease-out"
            style={{ top: activeBlockTop }}
          >
            {toolbarOpen ? (
              <div className="flex origin-left items-center gap-2 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-1 shadow-lg transition-all duration-200 ease-out animate-in fade-in zoom-in-95 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
                <ToolChip
                  title={t("writerStory.toolbar.close")}
                  onClick={() => setToolbarOpen(false)}
                >
                  <X className="size-[18px]" strokeWidth={2.2} />
                </ToolChip>
                <ToolChip
                  title={t("writerStory.toolbar.image")}
                  onClick={() => closeToolbarAnd(() => handleInsert("image"))}
                >
                  <ImageIcon className="size-[18px]" strokeWidth={1.85} />
                </ToolChip>
                <ToolChip
                  title={t("writerStory.toolbar.code")}
                  onClick={() => closeToolbarAnd(() => handleInsert("code"))}
                >
                  <Code2 className="size-[18px]" strokeWidth={1.85} />
                </ToolChip>
                <ToolChip
                  title={t("writerStory.toolbar.divider")}
                  onClick={() => closeToolbarAnd(() => handleInsert("divider"))}
                >
                  <Rows3 className="size-[18px]" strokeWidth={1.85} />
                </ToolChip>
                <ToolChip
                  title={t("writerStory.toolbar.quote")}
                  onClick={() => closeToolbarAnd(() => handleInsert("quote"))}
                >
                  <Quote className="size-[18px]" strokeWidth={1.85} />
                </ToolChip>
              </div>
            ) : (
              <ToolChip
                title={t("writerStory.toolbar.richMedia")}
                onClick={() => setToolbarOpen(true)}
              >
                <IconPlus />
              </ToolChip>
            )}
          </div>
          {isBodyEmpty && (
            <div
              dir={writingDirection === "auto" ? "auto" : writingDirection}
              className={`pointer-events-none absolute top-1 select-none font-blog-serif text-xl font-normal leading-[1.8] text-neutral-400 dark:text-zinc-500 ${
                writingDirection === "rtl" ? "right-14" : "left-14"
              }`}
            >
              {t("writerStory.bodyPlaceholder")}
            </div>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck
            dir={writingDirection === "auto" ? "auto" : writingDirection}
            onDrop={handleDrop}
            onPaste={handlePaste}
            onKeyDown={handleEditorKeyDown}
            onClick={updateBlockToolbarPosition}
            onKeyUp={updateBlockToolbarPosition}
            onInput={(e) => {
              setIsBodyEmpty(!editorHasPublishableContent(e.currentTarget));
              updateBlockToolbarPosition();
            }}
            className="font-blog-serif relative z-[1] min-h-[50vh] w-full border-0 bg-transparent ps-14 pb-24 text-xl leading-[1.8] text-neutral-900 outline-none empty:before:text-neutral-400 focus:outline-none dark:text-neutral-100 [&_pre]:my-6 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-(--color-light-card-border) [&_pre]:bg-light-app-tertiary [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:leading-6 [&_pre]:text-primary dark:[&_pre]:border-(--color-dark-card-border) dark:[&_pre]:bg-dark-app-tertiary dark:[&_pre]:text-dark-primary"
            style={{
              textAlign:
                writingDirection === "rtl"
                  ? "right"
                  : writingDirection === "ltr"
                    ? "left"
                    : undefined,
            }}
          />
        </div>
      </main>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4 md:p-8">
          <div className="mt-12 w-full max-w-3xl rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                  {t("writerStory.preview.badge")}
                </p>
                <h2 className="font-blog-display mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-50 md:text-3xl">
                  {title || t("writerStory.preview.untitled")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-zinc-800"
                aria-label={t("writerStory.preview.closeAria")}
              >
                <X className="size-5" />
              </button>
            </div>

            {cover && (
              <img
                src={cover}
                alt=""
                className="mb-5 max-h-56 w-full rounded-lg object-cover"
              />
            )}

            {subtitle && (
              <p className="font-blog-serif text-lg text-neutral-600 dark:text-zinc-400">
                {subtitle}
              </p>
            )}

            <article
              className="blog-article-prose mt-6 text-neutral-900 dark:text-neutral-100"
              dangerouslySetInnerHTML={{
                __html:
                  previewHTML || `<p>${t("writerStory.preview.emptyBody")}</p>`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
