package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Teacher;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TeacherCustomRepositoryImpl
        extends DynamicAggregationRepositoryImpl<Teacher>
        implements TeacherCustomRepository {

    public TeacherCustomRepositoryImpl(MongoTemplate mongoTemplate) {
        super(mongoTemplate, Teacher.class);
    }
}