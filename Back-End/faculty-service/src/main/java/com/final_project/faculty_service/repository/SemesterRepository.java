package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Semester;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface SemesterRepository extends MongoRepository<Semester,String> {
    Page<Semester> findByIsDeletedIsFalse(Pageable pageable);
    Optional<Semester> findByIdAndIsDeletedIsFalse(String  id);
    @Query("{ 'academicYear.$id': ?0, 'isDeleted': false }")
    List<Semester> findByAcademicYearIdAndIsDeletedFalse(String academicYearId);
}
