package com.final_project.blog_service.model;

public enum CommentStatus {
    DELETE("DELETE"), PUBLISHED("PUBLISHED"), EDITED("EDITED");
    private final String status;
    CommentStatus( String status){
        this.status = status.toUpperCase();
    }
    public String getStatus(){
        return this.status;
    }
}
