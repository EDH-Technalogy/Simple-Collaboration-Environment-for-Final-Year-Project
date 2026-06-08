package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.University;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UniversityRepository extends MongoRepository<University,String> {
    Page<University> findByIsDeletedIsFalse(Pageable pageable);
    Optional<University> findByIdAndIsDeletedIsFalse(String  id);
    List<University> findByNameContainingIgnoreCase(String name);
    @Query("{ '$or': [ { 'name': { $regex: ?0, $options: 'i' } }, { 'address': { $regex: ?0, $options: 'i' } } ] }")
    List<University> searchByNameOrAddressAndDeletedIsFalse(String keyword);
}
