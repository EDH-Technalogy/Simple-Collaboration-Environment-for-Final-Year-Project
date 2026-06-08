package com.final_project.blog_service.model;


import com.final_project.blog_service.dto.ContentBlock;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;


@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "articles")
@CompoundIndexes({
        @CompoundIndex(name = "author_published_idx", def = "{'authorId': 1, 'publishedAt': -1}"),
        @CompoundIndex(name = "status_published_idx", def = "{'status': 1, 'publishedAt': -1}"),
        @CompoundIndex(name = "tags_published_idx", def = "{'metadata.tags': 1, 'publishedAt': -1}")
})
public class Article {

    @Id
    private String id;

    @Indexed(unique = true)
    private String slug;  // URL-friendly identifier

    @Indexed
    private String authorId;

    private String title;

    private String subtitle;

    private Content content;

    private Metadata metadata;

    @Builder.Default
    private ArticleStatus status = ArticleStatus.PUBLISHED;

    @Builder.Default
    private ArticleVisiblity visibility = ArticleVisiblity.PUBLIC;

    private Stats stats;

    private Seo seo;

    @Builder.Default
    private List<EditHistory> editHistory = new ArrayList<>();

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;

    private LocalDateTime archivedAt;

    private String coverImageFileId;
    private String coverImageUrl;

    /**
     * Flexible content block structure
     * Supports: text, heading, image, video, code, quote, embed, divider
     */
    /**
     * Block type definitions for reference:
     *
     * TEXT:
     * { type: "text", data: { text: "Your text here" } }
     *
     * HEADING:
     * { type: "heading", data: { level: 1, text: "Heading" } }
     *
     * IMAGE:
     * { type: "image", data: {
     *     fileId: "file_123",
     *     fileUrl: "https://cdn.../image.jpg",
     *     alt: "alt text",
     *     caption: "caption",
     *     width: 800, height: 600
     *   } }
     *
     * VIDEO:
     * { type: "video", data: {
     *     fileId: "video_123",
     *     videoUrl: "https://cdn.../video.mp4",
     *     thumbnailUrl: "https://cdn.../thumb.jpg",
     *     duration: 120
     *   } }
     *
     * CODE:
     * { type: "code", data: {
     *     language: "javascript",
     *     code: "const x = 1;",
     *     showLineNumbers: true
     *   } }
     *
     * QUOTE:
     * { type: "quote", data: {
     *     text: "Quote text",
     *     attribution: "Author name"
     *   } }
     *
     * EMBED:
     * { type: "embed", data: {
     *     provider: "youtube|twitter|codepen|gist",
     *     embedUrl: "https://...",
     *     title: "Embed title"
     *   } }
     *
     * DIVIDER:
     * { type: "divider", data: {} }
     */
}