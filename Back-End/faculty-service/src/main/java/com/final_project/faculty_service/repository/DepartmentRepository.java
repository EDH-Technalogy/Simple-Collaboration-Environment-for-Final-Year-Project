package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepartmentRepository extends MongoRepository<Department,String> {
    Page<Department> findByIsDeletedIsFalse(Pageable pageable);
    Optional<Department> findByIdAndIsDeletedIsFalse(String  id);
}
