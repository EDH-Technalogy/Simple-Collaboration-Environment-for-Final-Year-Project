package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Student;
import com.final_project.faculty_service.models.University;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends MongoRepository<Student,String>, StudentCustomRepository {
    Page<Student> findByIsDeletedIsFalse(Pageable pageable);
   Optional< Student> findByIdAndIsDeletedIsFalse(String  id);
    Optional< Student> findStudentByKeycloakIdAndIsDeletedIsFalse(String  id);
    List<Student> findAllByIdInAndIsDeletedIsFalse(List<String> ids);
    boolean existsStudentByEmailAndIsDeletedIsFalse(String email);
    boolean existsStudentByFirstNameAndFatherNameAndLastName(String firstName, String fatherName, String lastName);
    Optional<Student> findStudentByKeycloakId(String keycloakId);

    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } }, " +
            "{ 'code': { $regex: ?0, $options: 'i' } } ] }")
    List<Student> searchByKeyword(String keyword);
}
