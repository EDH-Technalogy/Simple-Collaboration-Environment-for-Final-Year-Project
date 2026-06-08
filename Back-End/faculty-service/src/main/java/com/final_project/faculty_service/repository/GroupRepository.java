package com.final_project.faculty_service.repository;

import com.final_project.faculty_service.models.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends MongoRepository<Group,String> {
    Page<Group> findByIsDeletedIsFalse(Pageable pageable);
    Optional<Group> findByIdAndIsDeletedIsFalse(String  id);
    boolean existsByGroupLeader_IdAndIsDeletedIsFalse(String groupLeader);
    boolean existsAllByGroupMembersAndIsDeletedIsFalse(List<String> ids);
    boolean existsByGroupMembers_IdAndIsDeletedIsFalse(String member);
    boolean existsByGroupMembers_IdAndIsDeletedIsFalseAndIdNot(String member, String groupId);
    boolean existsByGroupLeader_IdAndIsDeletedIsFalseAndIdNot(String newLeaderId, String groupId);

}
