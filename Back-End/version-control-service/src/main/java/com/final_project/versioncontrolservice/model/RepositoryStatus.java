package com.final_project.versioncontrolservice.model;

public enum RepositoryStatus {
    ACTIVE("active"),
    ARCHIVED("archived"),
    DELETED("deleted");

    private String status;
    RepositoryStatus(String status){
     this.status=status;
    }

    public String getStatus(){
        return this.status;
    }

}
