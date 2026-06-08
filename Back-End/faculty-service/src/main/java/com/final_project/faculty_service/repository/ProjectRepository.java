package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface ProjectRepository extends MongoRepository<Project,String> {
    Page<Project> findByIsDeletedIsFalse(Pageable pageable);
    Page<Project> findByPublishedIsTrueAndIsDeletedIsFalse(Pageable pageable);
    @Query("""
        {
          'published': true,
          'isDeleted': false,
          '$or': [
            { 'projectName': { $regex: ?0, $options: 'i' } },
            { 'abstractText': { $regex: ?0, $options: 'i' } },
            { 'finalFileName': { $regex: ?0, $options: 'i' } },
            { 'status': { $regex: ?0, $options: 'i' } },
            { 'projectRepository.repositoryName': { $regex: ?0, $options: 'i' } },
            { 'projectRepository.owner': { $regex: ?0, $options: 'i' } },
            { 'projectRepository.description': { $regex: ?0, $options: 'i' } },
            { 'projectRepository.visibility': { $regex: ?0, $options: 'i' } }
          ]
        }
    """)
    Page<Project> searchPublished(String query, Pageable pageable);
    Optional<Project> findByIdAndIsDeletedIsFalse(String  id);
    Optional<Project> findByIdAndPublishedIsTrueAndIsDeletedIsFalse(String id);
    @Query("""
        {
          '_id': ?0,
          'isDeleted': false,
          'group.isDeleted': false,
          'group.groupMembers.$id': ?1
        }
    """)
    Optional<Project> findProjectByIdAndStudentInGroup(String projectId, String studentId);


    @Query("""
    {
      '_id': ?0,
      'isDeleted': false,
      'teacher.$id': ?1,
      'group.isDeleted': false
    }
""")
    Optional<Project> findProjectByIdAndTeacher(
            String projectId,
            String teacherId
    );
    @Query("""
        {
          'isDeleted': false,
          'group.isDeleted': false,
          'group.groupMembers.$id': ?0
        }
    """)
    boolean existsByStudentInAnyGroup(String studentId);

    // Return the project(s) that a student belongs to
    @Query("""
        {
          'isDeleted': false,
          'group.isDeleted': false,
          'group.groupMembers.$id': ?0
        }
    """)
    List<Project> findAllByStudentId(String studentId);

    // Return all projects that a teacher is responsible for
    @Query("""
        {
          'isDeleted': false,
          'teacher._id': ?0
        }
    """)
    List<Project> findAllByTeacherId(String teacherId);

    Optional<Project> findByProjectRepository_IdAndIsDeletedIsFalse(String repositoryId);

    // Return project for a specific teacher and student
    @Query("""
        {
          'isDeleted': false,
          'teacher._id': ?0,
          'group.isDeleted': false,
          'group.groupMembers.$id': ?1
        }
    """)
    Optional<Project> findByTeacherIdAndStudentId(String teacherId, String studentId);

}
