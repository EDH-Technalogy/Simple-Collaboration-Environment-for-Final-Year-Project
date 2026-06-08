package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Student;
import com.final_project.faculty_service.models.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends MongoRepository<Teacher,String>, TeacherCustomRepository {
    Page<Teacher> findByIsDeletedIsFalse(Pageable pageable);
    Optional<Teacher> findByIdAndIsDeletedIsFalse(String  id);
    boolean existsTeacherByEmailAndIsDeletedIsFalse(String email);
    Optional<Teacher> findTeacherByKeycloakIdAndIsDeletedIsFalse(String  id);
    boolean existsTeacherByFirstNameAndFatherNameAndLastName(String firstName, String fatherName, String lastName);
    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } }, " +
            "{ 'phone': { $regex: ?0, $options: 'i' } } ] }")
    List<Teacher> searchByKeyword(String keyword);
}
