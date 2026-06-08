package com.final_project.faculty_service.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "database_sequence")
public class DatabaseSequence {
    @Id
    private String id;
    private long seq;
}
