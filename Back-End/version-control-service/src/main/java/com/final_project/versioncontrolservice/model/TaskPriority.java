package com.final_project.versioncontrolservice.model;

public enum TaskPriority {
    LOW("low"),
    MEDIUM("medium"),
    HIGH("high"),
    CRITICAL("critical");
    private String value;
    TaskPriority(String value) {
        this.value = value;
    }
    public String value() {
        return this.value;
    }

}
