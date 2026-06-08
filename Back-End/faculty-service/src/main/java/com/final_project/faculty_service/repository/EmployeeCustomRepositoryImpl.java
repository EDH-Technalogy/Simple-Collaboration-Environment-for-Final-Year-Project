package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Employee;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class EmployeeCustomRepositoryImpl
        extends DynamicAggregationRepositoryImpl<Employee>
        implements EmployeeCustomRepository {

    public EmployeeCustomRepositoryImpl(MongoTemplate mongoTemplate) {
        super(mongoTemplate, Employee.class);
    }
}
