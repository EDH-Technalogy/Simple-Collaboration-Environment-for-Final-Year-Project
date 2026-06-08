package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Batch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface BatchRepository extends MongoRepository<Batch,String> {
    Page<Batch> findByIsDeletedIsFalse(Pageable pageable);
    Optional<Batch> findByIdAndIsDeletedIsFalse(String  id);
}
