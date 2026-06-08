package com.final_project.faculty_service.models;

import lombok.Data;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Document
public class Group {
    @Id
    private String id;
    private String name;
    @DBRef
    private List<Student> groupMembers;
    @DBRef
    private Student groupLeader;
    private boolean isDeleted;

    @CreatedDate
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
    @CreatedBy
    private String createdBy;

    public boolean hasMember(String studentId) {
        return groupMembers != null
                && groupMembers.stream().anyMatch(student -> student != null && studentId.equals(student.getId()));
    }

    public boolean removeMember(String studentId) {
        return groupMembers != null
                && groupMembers.removeIf(student -> student != null && studentId.equals(student.getId()));
    }
}
