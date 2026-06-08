package com.final_project.blog_service.model;

public enum ArticleVisiblity {
    PUBLIC("PUBLIC"), PRIVATE("PRIVATE"), UNLISTED("UNLISTED");
    private final String ArticleVisiblity;
    ArticleVisiblity(String ArticleVisiblity) {
        this.ArticleVisiblity = ArticleVisiblity.toUpperCase();
    }

    public String visiblity(){
        return this.ArticleVisiblity;
    }
}
