package com.final_project.versioncontrolservice.model;

public enum TaskStatus {
    OPEN("open"),
    CANCELLED("cancelled"),
    COMPLETED("completed"),
    PROGRESS("progress"),
    REVIEW("review");
    private String status;
    TaskStatus(String status){
        this.status=status;
    }

    public String getStatus(){
        return this.status;
    }
}
