package com.final_project.blog_service.dto;

public enum ArticleBlockType {
    TEXT("text"),
    HEADING("heading"),
    IMAGE("image"),
    VIDEO("video"),
    CODE("code"),
    QUOTE("quote"),
    EMBED("embed"),
    DIVIDER("divider");
    private final String type;
    ArticleBlockType(String type){
        this.type=type.toLowerCase();
    }
    public String getType(){
        return type.toUpperCase();
    }

}
