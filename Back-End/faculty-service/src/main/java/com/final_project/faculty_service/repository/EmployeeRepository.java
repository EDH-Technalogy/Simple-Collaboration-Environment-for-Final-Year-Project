package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Employee;
import com.final_project.faculty_service.models.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends MongoRepository<Employee,String>, EmployeeCustomRepository {

    Page<Employee> findByIsDeletedIsFalse(Pageable pageable);
    Optional<Employee> findByIdAndIsDeletedIsFalse(String  id);
    boolean existsEmployeeByEmailAndIsDeletedIsFalse(String email);
    boolean existsEmployeeByFirstNameAndFatherNameAndLastName(String firstName, String fatherName, String lastName);
    Optional<Employee> findEmployeeByKeycloakIdAndIsDeletedIsFalse(String  id);
    @Query("{ 'isDeleted': false, '$or': [ " +
            "{ 'firstName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'lastName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'email': { $regex: ?0, $options: 'i' } }, " +
            "{ 'code': { $regex: ?0, $options: 'i' } } ] }")
    List<Employee> searchByKeyword(String keyword);
}
