/**
 * Adapt `ArticlePreviewResponse` / list items for `StoryCard` + Home filters.
 */
export function mapArticlePreviewToStory(article, { collectionLabel = "" } = {}) {
  const a = article ?? {};
  const author = typeof a.author === "object" && a.author !== null ? a.author : {};
  const stats = typeof a.stats === "object" && a.stats !== null ? a.stats : {};
  const ct = String(a.contentType ?? "").toUpperCase();
  const meta = typeof a.metadata === "object" && a.metadata !== null ? a.metadata : {};
  const media = typeof a.media === "object" && a.media !== null ? a.media : {};
  const coverImage = typeof a.coverImage === "object" && a.coverImage !== null ? a.coverImage : {};
  const thumbnail = typeof a.thumbnail === "object" && a.thumbnail !== null ? a.thumbnail : {};

  const publish_type =
    ct === "MONOGRAPH" ? "monograph" : "weblog";

  return {
    id: a.id,
    slug: a.slug,
    publish_type,
    title: a.title ?? "—",
    subtitle: a.subtitle ?? a.description ?? "",
    description: a.description ?? a.subtitle ?? "",
    author_name:
      author.displayName ??
      author.userName ??
      author.username ??
      author.name ??
      "—",
    author_id: author.id ?? a.authorId ?? "",
    author_email: author.email ?? "",
    author_profile:
      author.profileImageUrl ??
      author.profile ??
      author.avatarUrl ??
      author.photoUrl ??
      "",
    created_date:
      a.publishedAt ??
      a.createdAt ??
      a.updatedAt ??
      new Date().toISOString(),
    reading_time:
      typeof a.estimatedReadTime === "number"
        ? a.estimatedReadTime
        : Number(a.estimatedReadTimeMinutes) || 1,
    claps_count: stats.likes ?? stats.totalLikes ?? stats.claps ?? 0,
    comment_count: stats.commentCount ?? stats.comments ?? 0,
    share_count: stats.shareCount ?? stats.shares ?? 0,
    view_count: stats.views ?? 0,
    cover_image:
      a.coverImageUrl ??
      a.thumbnailUrl ??
      a.featuredImageUrl ??
      a.imageUrl ??
      coverImage.url ??
      thumbnail.url ??
      meta.coverImageUrl ??
      meta.thumbnailUrl ??
      meta.featuredImageUrl ??
      meta.imageUrl ??
      media.coverImageUrl ??
      media.thumbnailUrl ??
      "",
    tags: Array.isArray(a.tags) ? a.tags : [],
    collection: collectionLabel || "Stories",
    _raw: a,
  };
}
