package com.final_project.blog_service.model;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import java.time.LocalDateTime;

/**
 * Comment entity representing blog post comments and replies
 * Supports threaded/nested comments (replies to comments)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "comments")
@CompoundIndexes({
        @CompoundIndex(name = "article_created_idx", def = "{'articleId': 1, 'createdAt': -1}"),
        @CompoundIndex(name = "parent_created_idx", def = "{'parentCommentId': 1, 'createdAt': -1}")
})
public class Comment {

    @Id
    private String id;

    @Indexed
    private String articleId;  // the article being commented on

    @Indexed
    private String parentCommentId;  // null for top-level comments, objectId for replies

    @Indexed
    private String authorId;

    private Author author;  // denormalized for quick access that one comment on a post owner of this comment

    private String body;

    private Engagement engagement;

    @Builder.Default
    private CommentStatus status = CommentStatus.PUBLISHED;  // PUBLISHED, DELETED

    private LocalDateTime editedAt;

    private LocalDateTime createdAt;

    /**
     * Denormalized author info
     * Updated when user profile changes (async event)
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Author {
        private String displayName;
        private String profileImageUrl;
    }

    /**
     * Engagement stats
     * Likes and reply counts for this comment
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Engagement {

        @Builder.Default
        private Long likes = 0L;

        @Builder.Default
        private Long replyCount = 0L;  // number of direct replies to this comment
    }
}