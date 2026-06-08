package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Student;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class StudentCustomRepositoryImpl
        extends DynamicAggregationRepositoryImpl<Student>
        implements StudentCustomRepository {

    public StudentCustomRepositoryImpl(MongoTemplate mongoTemplate) {
        super(mongoTemplate, Student.class);
    }
}
