package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.AcademicYear;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AcademicYearRepository extends MongoRepository<AcademicYear,String> {
   Page<AcademicYear> findByIsDeletedIsFalse(Pageable pageable);
   Optional<AcademicYear> findByIdAndIsDeletedIsFalse(String  id);
}
