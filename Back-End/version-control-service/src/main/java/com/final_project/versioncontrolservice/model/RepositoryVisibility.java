package com.final_project.versioncontrolservice.model;

public enum RepositoryVisibility {
    PUBLIC("public"),PRIVATE("private");
    private String visibility;
    RepositoryVisibility(String visibility){
        this.visibility = visibility;
    }

    public String getVisibility(){
        return visibility;
    }
}
