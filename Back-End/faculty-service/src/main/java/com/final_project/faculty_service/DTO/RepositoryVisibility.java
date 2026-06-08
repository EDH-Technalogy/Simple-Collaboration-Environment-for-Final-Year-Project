package com.final_project.faculty_service.DTO;

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
