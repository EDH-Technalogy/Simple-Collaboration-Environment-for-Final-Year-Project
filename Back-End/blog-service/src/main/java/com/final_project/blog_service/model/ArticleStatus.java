package com.final_project.blog_service.model;

public enum ArticleStatus {

    DRAFT("DRAFT"), PUBLISHED("PUBLISHED"), ARCHIVED("ARCHIVED");
    private final String status;
    ArticleStatus(String status) {
        this.status = status.toUpperCase();
    }
    public String getStatus() {
        return this.status;
    }
}
