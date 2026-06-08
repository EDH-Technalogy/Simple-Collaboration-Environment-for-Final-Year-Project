package com.final_project.blog_service.repo;

import com.final_project.blog_service.model.ArticleView;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ArticleViewRepository extends MongoRepository<ArticleView, String> {
    boolean existsByArticleIdAndViewerKey(String articleId, String viewerKey);
}
