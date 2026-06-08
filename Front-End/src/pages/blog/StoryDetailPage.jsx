import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MessageCircle, Send, Share2 } from "lucide-react";
import { getStoryById } from "../../data/mockStories";
import ArticleBlocksReader from "../../components/ArticleBlocksReader";
import Avatar from "../../components/Avatar";
import { useAuth } from "../../context/AuthContext";
import { BlogShell } from "./BlogShell";
import { normalizeArticleBlock } from "../../lib/adminArticleMap";
import { mapArticlePreviewToStory } from "../../lib/mapArticlePreviewToStory";
import {
  useArticleComments,
  useArticleLikeStatus,
  useLikeArticle,
  usePostArticleComment,
  usePostArticleCommentReply,
  usePublicArticle,
  useShareArticle,
  useUnlikeArticle,
} from "../../services/useApi";

function isPublicPublishedArticle(article) {
  const status = String(article?.status ?? "").toUpperCase();
  const visibility = String(article?.visibility ?? "PUBLIC").toUpperCase();
  return (
    (!status || status === "PUBLISHED") &&
    !["PRIVATE", "MEMBERS_ONLY"].includes(visibility)
  );
}

function articleBlocks(article) {
  return (article?.content?.blocks ?? article?.blocks ?? [])
    .map(normalizeArticleBlock)
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function extractPaginatedList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
}

function initials(name) {
  return (
    String(name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A"
  );
}

function flattenCommentCount(threads) {
  return (threads ?? []).reduce((sum, thread) => {
    const replies = Array.isArray(thread?.replies) ? thread.replies : [];
    return sum + 1 + flattenCommentCount(replies);
  }, 0);
}

function profilePath(author) {
  const key = author?.id || author?.displayName || author?.email;
  return key
    ? `/writer/profile?user=${encodeURIComponent(key)}`
    : "/writer/profile";
}

function compactUserId(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.length > 12 ? `${text.slice(0, 8)}...` : text;
}

function stripHtml(value) {
  return String(value ?? "").replace(/<[^>]*>/g, " ");
}

function blockPlainText(blocks = []) {
  return blocks
    .map((block) => {
      const data = block?.data ?? {};
      return [
        data.text,
        data.caption,
        data.alt,
        data.code,
        typeof data === "string" ? data : "",
      ]
        .filter(Boolean)
        .join(" ");
    })
    .join(" ");
}

function textDirection(value) {
  return /[\u0600-\u06FF]/.test(String(value ?? "")) ? "rtl" : "ltr";
}

function authorDisplayName(author, { preferHandle = false } = {}) {
  const username = author?.userName || author?.username;
  if (preferHandle && username) return `@${String(username).replace(/^@/, "")}`;
  const emailName =
    typeof author?.email === "string" && author.email.includes("@")
      ? author.email.split("@")[0]
      : author?.email;
  return (
    (author?.displayName && author.displayName !== "Reader"
      ? author.displayName
      : "") ||
    username ||
    author?.name ||
    emailName ||
    compactUserId(author?.id) ||
    "User"
  );
}

function parseLikedStatus(payload) {
  if (typeof payload === "boolean") return payload;
  if (!payload || typeof payload !== "object") return false;
  return Boolean(
    payload.liked ??
      payload.isLiked ??
      payload.hasLiked ??
      payload.data?.liked ??
      payload.data?.isLiked,
  );
}

function CommentThread({
  thread,
  isAuthenticated,
  onRequireLogin,
  onReply,
  replying,
  articleAuthorId,
  depth = 0,
}) {
  const comment = thread?.comment ?? thread ?? {};
  const author = comment.author ?? {};
  const createdAt = comment.createdAt
    ? format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")
    : "";
  const replies = Array.isArray(thread?.replies) ? thread.replies : [];
  const isStoryWriter =
    Boolean(articleAuthorId) && String(author.id ?? "") === String(articleAuthorId);
  const isReply = depth > 0;
  const name = authorDisplayName(author, { preferHandle: isReply });
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");

  const submitReply = () => {
    if (!replyDraft.trim()) return;
    onReply?.(comment.id, replyDraft.trim(), () => {
      setReplyDraft("");
      setReplyOpen(false);
    });
  };

  return (
    <li
      className={`rounded-2xl border p-4 ${
        isStoryWriter
          ? "border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm ring-1 ring-(--color-light-btn-primary-bg)/10 dark:border-dark-divider dark:bg-dark-app-tertiary/25 dark:ring-(--color-dark-primary)/10"
          : isReply
            ? "border-(--color-light-card-border) bg-light-app-tertiary/35 dark:border-dark-divider dark:bg-dark-app-tertiary/20"
            : "border-(--color-light-card-border) bg-(--color-light-card-bg) dark:border-dark-divider dark:bg-dark-app-tertiary/15"
      }`}
    >
      <div className="flex items-start gap-3">
        <Link to={profilePath(author)} className="shrink-0 rounded-full">
          <Avatar
            src={author.profileImageUrl || author.profile || author.avatarUrl}
            initials={initials(name)}
            alt={name}
            className="rounded-full"
            sizeClass="inline-flex size-10 select-none items-center justify-center overflow-hidden rounded-full"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={profilePath(author)}
              className="font-semibold text-primary underline-offset-4 hover:underline dark:text-dark-primary"
            >
              {name}
            </Link>
            {isStoryWriter ? (
              <span className="rounded-full border border-(--color-light-btn-primary-bg)/20 bg-(--color-light-btn-primary-bg)/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-(--color-light-btn-primary-bg) dark:border-(--color-dark-primary)/20 dark:bg-(--color-dark-primary)/10 dark:text-(--color-dark-primary)">
                Writer
              </span>
            ) : null}
            {isReply && !isStoryWriter ? (
              <span className="rounded-full border border-(--color-light-card-border) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted dark:border-dark-divider dark:text-dark-muted">
                Response
              </span>
            ) : null}
            {createdAt ? (
              <span className="text-xs text-muted dark:text-dark-muted">
                {createdAt}
              </span>
            ) : null}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-secondary dark:text-dark-secondary">
            {comment.body}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-muted dark:text-dark-muted">
            <span>{comment.engagement?.likes ?? 0} likes</span>
            <span>
              {comment.replyCount ??
                comment.engagement?.replyCount ??
                replies.length}{" "}
              replies
            </span>
            <button
              type="button"
              className="font-semibold text-(--color-light-btn-primary-bg) transition-colors hover:text-(--color-light-btn-primary-hover) dark:text-(--color-dark-primary)"
              onClick={() => {
                if (!isAuthenticated) {
                  onRequireLogin?.("reply to this comment");
                  return;
                }
                setReplyOpen((value) => !value);
              }}
            >
              Reply
            </button>
          </div>
          {replyOpen ? (
            <div className="mt-4 rounded-xl border border-(--color-light-card-border) bg-light-app-tertiary p-3 dark:border-dark-divider dark:bg-dark-app-tertiary/60">
              <textarea
                value={replyDraft}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder={`Reply to ${name}...`}
                rows={3}
                className="w-full resize-y rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-3 py-2 text-sm leading-6 text-(--color-light-text-primary) outline-none transition-colors placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder)"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary h-8 px-3 text-xs"
                  onClick={() => {
                    setReplyDraft("");
                    setReplyOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!replyDraft.trim() || replying}
                  onClick={submitReply}
                >
                  Send reply
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {replies.length ? (
        <ul className="mt-4 space-y-3 border-s border-light-divider ps-4 dark:border-dark-divider">
          {replies.map((reply) => (
            <CommentThread
              key={reply?.comment?.id ?? reply?.id}
              thread={reply}
              isAuthenticated={isAuthenticated}
              onRequireLogin={onRequireLogin}
              onReply={onReply}
              replying={replying}
              articleAuthorId={articleAuthorId}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function StoryResponses({ articleId, storyTitle, fallbackCount, articleAuthorId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, hydrated } = useAuth();
  const [draft, setDraft] = useState("");
  const commentsQuery = useArticleComments(
    articleId,
    { page: 0, pageSize: 50 },
    { enabled: Boolean(articleId), notifyOnError: false },
  );
  const postComment = usePostArticleComment({
    showSuccessToast: false,
    onSuccess: () => {
      const preview = draft.trim().slice(0, 90);
      setDraft("");
      window.GooeyToaster?.success?.("Comment published", {
        description: preview ? `"${preview}${preview.length === 90 ? "..." : ""}"` : undefined,
      });
      queryClient.invalidateQueries({
        queryKey: ["articles", articleId, "comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["articles", "public-detail", articleId],
      });
    },
  });
  const postReply = usePostArticleCommentReply({
    showSuccessToast: false,
    onSuccess: (_data, variables) => {
      window.GooeyToaster?.success?.("Reply published", {
        description: variables?.body
          ? `"${String(variables.body).slice(0, 90)}${String(variables.body).length > 90 ? "..." : ""}"`
          : undefined,
      });
      queryClient.invalidateQueries({
        queryKey: ["articles", articleId, "comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["articles", "public-detail", articleId],
      });
    },
  });

  const comments = useMemo(
    () => extractPaginatedList(commentsQuery.data),
    [commentsQuery.data],
  );
  const commentCount = flattenCommentCount(comments) || fallbackCount || 0;

  const submitComment = () => {
    if (!draft.trim() || !articleId) return;
    postComment.mutate({ articleId, body: draft.trim() });
  };

  const requireLogin = (action = "comment") => {
    window.GooeyToaster?.info?.(`Please log in to ${action}.`);
    navigate("/login", { state: { from: location } });
  };

  const submitReply = (parentCommentId, body, onDone) => {
    if (!articleId || !parentCommentId || !body) return;
    postReply.mutate(
      { articleId, parentCommentId, body },
      { onSuccess: () => onDone?.() },
    );
  };

  return (
    <section
      className="mt-16 border-t border-light-divider pt-10 dark:border-dark-divider"
      aria-labelledby="story-responses-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="story-responses-heading"
            className="font-blog-display text-2xl font-bold text-primary dark:text-dark-primary"
          >
            Comments
          </h2>
          <p className="mt-1 text-sm text-muted dark:text-dark-muted">
            {commentCount} responses on "{storyTitle}"
          </p>
        </div>
      </div>

      {!hydrated ? (
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-light-app-tertiary dark:bg-dark-app-tertiary" />
      ) : !isAuthenticated ? (
        <div className="mt-6 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-5 py-6 text-center dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <p className="text-sm text-secondary dark:text-dark-secondary">
            Sign in to add your response. Public comments are still visible
            below.
          </p>
          <Link
            to="/login"
            state={{ from: location }}
            className="btn-primary mt-4 inline-flex h-9 items-center px-5 text-sm"
          >
            Log in to comment
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-3 dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
          <label htmlFor="story-response" className="sr-only">
            Write a response
          </label>
          <textarea
            id="story-response"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share a thoughtful response..."
            rows={4}
            className="w-full resize-y rounded-xl border border-(--color-light-input-border) bg-(--color-light-input-bg) px-4 py-3 text-sm leading-6 text-(--color-light-text-primary) outline-none transition-colors placeholder:text-(--color-light-input-placeholder) focus:border-(--color-light-input-border-focus) focus:ring-2 focus:ring-blue-500/15 dark:border-dark-input-border dark:bg-(--color-dark-input-bg) dark:text-(--color-dark-text-primary) dark:placeholder:text-(--color-dark-input-placeholder) dark:focus:border-(--color-dark-input-border-focus) dark:focus:ring-blue-400/15"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="btn-primary inline-flex h-9 items-center gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!draft.trim() || postComment.isPending}
              onClick={submitComment}
            >
              <Send className="size-4" strokeWidth={1.8} />
              Publish response
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        {commentsQuery.isLoading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-light-app-tertiary dark:bg-dark-app-tertiary" />
        ) : comments.length ? (
          <ul className="space-y-4">
            {comments.map((thread) => (
              <CommentThread
                key={thread?.comment?.id ?? thread?.id}
                thread={thread}
                isAuthenticated={isAuthenticated}
                onRequireLogin={requireLogin}
                onReply={submitReply}
                replying={postReply.isPending}
                articleAuthorId={articleAuthorId}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-(--color-light-card-border) p-8 text-center text-sm text-muted dark:border-(--color-dark-card-border) dark:text-dark-muted">
            No comments yet. Start the conversation when you sign in.
          </div>
        )}
      </div>
    </section>
  );
}

export default function StoryDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, hydrated } = useAuth();
  const articleQuery = usePublicArticle(id, {
    enabled: Boolean(id),
    notifyOnError: false,
  });
  const story =
    articleQuery.data && isPublicPublishedArticle(articleQuery.data)
      ? {
          ...mapArticlePreviewToStory(articleQuery.data, {
            collectionLabel: "Stories",
          }),
          blocks: articleBlocks(articleQuery.data),
        }
      : getStoryById(id);
  const [localClaps, setLocalClaps] = useState(0);
  const [clapped, setClapped] = useState(false);
  const [progress, setProgress] = useState(0);
  const contentRef = useRef(null);
  const likeStatusQuery = useArticleLikeStatus(story?.id, {
    enabled: Boolean(hydrated && isAuthenticated && story?.id),
    notifyOnError: false,
    retry: false,
    staleTime: 0,
  });

  const likeArticle = useLikeArticle({
    showErrorToast: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", story?.id, "likeStatus"] });
      queryClient.invalidateQueries({ queryKey: ["articles", "public-detail", id] });
    },
    onError: (error) => {
      const message = String(error?.message ?? error?.response?.data?.message ?? "");
      if (
        error?.response?.status === 409 ||
        error?.status === 409 ||
        message.toLowerCase().includes("already liked")
      ) {
        setClapped(true);
        queryClient.invalidateQueries({ queryKey: ["articles", story?.id, "likeStatus"] });
        return;
      }
      setClapped(false);
      setLocalClaps((count) => Math.max(count - 1, 0));
    },
  });
  const unlikeArticle = useUnlikeArticle({
    showErrorToast: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", story?.id, "likeStatus"] });
      queryClient.invalidateQueries({ queryKey: ["articles", "public-detail", id] });
    },
    onError: () => {
      setClapped(true);
      setLocalClaps((count) => count + 1);
    },
  });
  const shareArticle = useShareArticle({
    showSuccessToast: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", "public-detail", id] });
    },
  });

  useEffect(() => {
    setLocalClaps(Number(story?.claps_count ?? 0));
  }, [story?.id, story?.claps_count]);

  useEffect(() => {
    if (!isAuthenticated) {
      setClapped(false);
      return;
    }
    if (likeStatusQuery.isSuccess) {
      setClapped(parseLikedStatus(likeStatusQuery.data));
    }
  }, [isAuthenticated, likeStatusQuery.data, likeStatusQuery.isSuccess]);

  const requireLogin = useCallback((action = "complete this action") => {
    window.GooeyToaster?.info?.(
      `Please log in to ${action}.`,
    );
    navigate("/login", { state: { from: location } });
  }, [location, navigate]);

  const handleClap = useCallback(() => {
    if (!story?.id) return;
    if (!isAuthenticated) {
      requireLogin("like this story");
      return;
    }

    if (clapped) {
      setClapped(false);
      setLocalClaps((count) => Math.max(count - 1, 0));
      unlikeArticle.mutate(story.id);
      return;
    }

    setClapped(true);
    setLocalClaps((count) => count + 1);
    likeArticle.mutate(story.id);
  }, [
    clapped,
    isAuthenticated,
    likeArticle,
    requireLogin,
    story?.id,
    unlikeArticle,
  ]);

  const handleShare = useCallback(async () => {
    if (!story?.id) return;
    if (!isAuthenticated) {
      requireLogin("share this story");
      return;
    }
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: story.title,
          text: story.subtitle,
          url,
        });
      } else {
        await navigator.clipboard?.writeText(url);
        window.GooeyToaster?.success?.("Story link copied");
      }
      shareArticle.mutate({ articleId: story.id, platform: "COPY_LINK" });
    } catch (error) {
      if (error?.name !== "AbortError") {
        window.GooeyToaster?.error?.("Could not share this story");
      }
    }
  }, [
    isAuthenticated,
    requireLogin,
    shareArticle,
    story?.id,
    story?.subtitle,
    story?.title,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const scrolledPercent = height > 0 ? (scrolled / height) * 100 : 0;
      setProgress(Math.min(scrolledPercent, 100));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (articleQuery.isLoading && !story) {
    return (
      <BlogShell variant="article">
        <div className="px-4 py-24 text-center text-secondary dark:text-dark-secondary">
          Loading story...
        </div>
      </BlogShell>
    );
  }

  if (!story) {
    return (
      <BlogShell variant="article">
        <div className="px-4 py-24 text-center">
          <h1 className="font-blog-display text-2xl font-bold text-primary dark:text-dark-primary">
            Story not found
          </h1>
          <p className="mt-3 text-secondary dark:text-dark-secondary">
            That story may have been removed or the link is incorrect.
          </p>
          <Link
            to="/blogs"
            className="btn-primary mt-8 inline-flex h-10 items-center px-6 text-sm"
          >
            Back to stories
          </Link>
        </div>
      </BlogShell>
    );
  }

  const date = story.created_date
    ? format(new Date(story.created_date), "MMM d, yyyy")
    : "";
  const readTime = story.reading_time || 6;
  const contentText = story.blocks?.length
    ? blockPlainText(story.blocks)
    : stripHtml(story.content);
  const titleDir = textDirection(story.title);
  const subtitleDir = textDirection(story.subtitle);
  const contentDir = textDirection(
    [story.title, story.subtitle, contentText].filter(Boolean).join(" "),
  );
  const titleIsRtl = titleDir === "rtl";
  const subtitleIsRtl = subtitleDir === "rtl";
  const contentIsRtl = contentDir === "rtl";
  const authorName = story.author_name || "Anonymous";
  const author = {
    id: story.author_id,
    displayName: authorName,
    email: story.author_email,
    profileImageUrl: story.author_profile,
  };
  const commentCount = Number(story.comment_count ?? 0);

  return (
    <>
      <div className="fixed inset-x-0 top-14 z-19 h-0.5 sm:top-16" aria-hidden>
        <div
          className="h-full bg-(--color-light-btn-primary-bg) transition-[width] duration-150 dark:bg-(--color-dark-primary)"
          style={{ width: `${progress}%` }}
        />
      </div>

      <BlogShell variant="article">
        <article
          ref={contentRef}
          className="mx-auto max-w-4xl pb-24 pt-10 sm:pt-14 lg:pb-28"
        >
          <Link
            to="/blogs"
            className="mb-5 inline-flex h-9 items-center gap-2 rounded-xl border border-(--color-light-card-border) bg-(--color-light-card-bg) px-3 text-sm font-semibold text-secondary transition-colors hover:bg-light-app-tertiary hover:text-primary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary dark:hover:bg-dark-app-tertiary dark:hover:text-dark-primary"
          >
            <ArrowLeft className="size-4" strokeWidth={1.8} />
            Back to blogs
          </Link>
          <header className="rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted dark:text-dark-muted">
              <span className="rounded-full bg-light-app-tertiary px-3 py-1 dark:bg-dark-app-tertiary">
                {story.collection || "Stories"}
              </span>
              <span>{readTime} min read</span>
              {date ? (
                <>
                  <span aria-hidden>&middot;</span>
                  <time dateTime={story.created_date}>{date}</time>
                </>
              ) : null}
            </div>

            <h1
              className={`mt-5 text-3xl font-bold leading-tight text-primary sm:text-4xl dark:text-dark-primary ${
                titleIsRtl ? "font-persian text-right" : "font-blog-display tracking-tight"
              }`}
              dir={titleDir}
            >
              {story.title}
            </h1>
            {story.subtitle ? (
              <p
                className={`mt-4 text-base leading-7 text-secondary sm:text-lg dark:text-dark-secondary ${
                  subtitleIsRtl ? "font-persian text-right" : ""
                }`}
                dir={subtitleDir}
              >
                {story.subtitle}
              </p>
            ) : null}

            <div className="mt-7 flex flex-col gap-4 border-t border-light-divider pt-5 dark:border-dark-divider sm:flex-row sm:items-center sm:justify-between">
              <Link
                to={profilePath(author)}
                className="flex min-w-0 items-center gap-3 rounded-full"
              >
                <Avatar
                  src={story.author_profile}
                  alt={authorName}
                  initials={initials(authorName)}
                  className="rounded-full"
                  sizeClass="inline-flex size-12 select-none items-center justify-center overflow-hidden rounded-full"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-primary underline-offset-4 hover:underline dark:text-dark-primary">
                    {authorName}
                  </span>
                  <span className="block text-xs text-muted dark:text-dark-muted">
                    {story.author_email || "Author"}
                  </span>
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClap}
                  aria-label={`Like, ${localClaps} likes`}
                  className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                    clapped
                      ? "border-(--color-light-btn-primary-bg) bg-(--color-light-badge-bg) text-(--color-light-btn-primary-bg) dark:border-(--color-dark-primary) dark:bg-(--color-dark-badge-bg) dark:text-(--color-dark-primary)"
                      : "border-(--color-light-card-border) text-secondary hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-dark-app-tertiary"
                  }`}
                >
                  <Heart
                    className="size-4"
                    fill={clapped ? "currentColor" : "none"}
                    strokeWidth={1.8}
                  />
                  {localClaps}
                </button>
                <a
                  href="#comments"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-(--color-light-card-border) px-3 text-sm font-semibold text-secondary transition-colors hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-dark-app-tertiary"
                >
                  <MessageCircle className="size-4" strokeWidth={1.8} />
                  {commentCount}
                </a>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-(--color-light-card-border) px-3 text-sm font-semibold text-secondary transition-colors hover:bg-light-app-tertiary dark:border-(--color-dark-card-border) dark:text-dark-secondary dark:hover:bg-dark-app-tertiary"
                >
                  <Share2 className="size-4" strokeWidth={1.8} />
                  Share
                </button>
              </div>
            </div>
          </header>

          {story.cover_image ? (
            <figure className="mt-8 overflow-hidden rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg)">
              <a
                href={story.cover_image}
                target="_blank"
                rel="noreferrer"
                aria-label="Open story image"
                className="block cursor-zoom-in"
              >
                <img
                  src={story.cover_image}
                  alt=""
                  className="aspect-[16/7] w-full object-cover"
                  loading="lazy"
                />
              </a>
            </figure>
          ) : null}

          <section className="mt-10 rounded-2xl border border-(--color-light-card-border) bg-(--color-light-card-bg) p-4 shadow-sm dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) sm:p-6 lg:p-8">
            {story.blocks?.length ? (
              <ArticleBlocksReader
                blocks={story.blocks}
                dir={contentDir}
                className={`mx-auto max-w-3xl text-[15px] leading-7 ${
                  contentIsRtl ? "font-persian text-right" : ""
                }`}
              />
            ) : story.content ? (
              <div
                className={`blog-article-prose mx-auto max-w-3xl text-[15px] leading-7 [&>*:first-child]:mt-0 ${
                  contentIsRtl ? "font-persian text-right" : ""
                }`}
                dir={contentDir}
                dangerouslySetInnerHTML={{ __html: story.content }}
              />
            ) : (
              <p className="py-20 text-center text-lg italic text-muted dark:text-dark-muted">
                Full story body will load from your API.
              </p>
            )}
          </section>

          {story.tags?.length > 0 ? (
            <footer className="mt-8 flex flex-wrap gap-2">
              {story.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/topic/${encodeURIComponent(tag)}`}
                  className="rounded-full border border-(--color-light-card-border) bg-(--color-light-card-bg) px-4 py-2 text-sm font-medium text-secondary transition-colors hover:border-(--color-light-input-border-focus) hover:text-primary dark:border-(--color-dark-card-border) dark:bg-(--color-dark-card-bg) dark:text-dark-secondary dark:hover:border-(--color-dark-input-border-focus) dark:hover:text-dark-primary"
                >
                  {tag}
                </Link>
              ))}
            </footer>
          ) : null}

          <div id="comments">
            <StoryResponses
              articleId={story.id}
              storyTitle={story.title}
              fallbackCount={commentCount}
              articleAuthorId={story.author_id}
            />
          </div>
        </article>
      </BlogShell>
    </>
  );
}
