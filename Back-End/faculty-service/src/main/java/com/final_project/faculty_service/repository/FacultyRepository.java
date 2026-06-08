package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Faculty;
import com.final_project.faculty_service.models.University;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface FacultyRepository extends MongoRepository<Faculty, String> {
    List<Faculty> findByUniversity(University university);
    Page<Faculty> findByIsDeletedIsFalse(Pageable pageable);
    Optional<Faculty> findByIdAndIsDeletedIsFalse(String  id);
    Page<Faculty> findByUniversityAndIsDeletedIsFalse(University university, Pageable pageable);

}
