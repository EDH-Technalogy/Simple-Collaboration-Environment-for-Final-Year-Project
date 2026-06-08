package com.final_project.blog_service.model;

public enum SharedPlatform {
    TWITTER("TWITTER"), FACEBOOK("FACEBOOK"), LINKEDIN("LINKEDIN"), COPY_LINK("COPYLINK"), EMAIL("EMAIL");

    private final String platform;
    SharedPlatform( String platform){
        this.platform = platform.toUpperCase();
    }
    public String getPlatform(){
        return this.platform.toUpperCase();
    }
}
