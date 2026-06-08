package com.final_project.faculty_service.services;

import com.final_project.faculty_service.DTO.mapper.GroupMapper;
import com.final_project.faculty_service.DTO.request.GroupRequest;
import com.final_project.faculty_service.DTO.response.GroupResponse;
import com.final_project.faculty_service.DTO.response.PageResponse;
import com.final_project.faculty_service.models.AcademicYear;
import com.final_project.faculty_service.models.Group;
import com.final_project.faculty_service.models.Student;
import com.final_project.faculty_service.repository.AcademicYearRepository;
import com.final_project.faculty_service.repository.GroupRepository;
import com.final_project.faculty_service.repository.StudentRepository;
import com.final_project.faculty_service.services.exception.ResourceBadRequest;
import com.final_project.faculty_service.services.exception.ResourceExist;
import com.final_project.faculty_service.services.exception.ResourceNotFoundException;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final GroupMapper groupMapper;
    private final AcademicYearRepository academicYearRepository;
    // List all groups with pagination
    public PageResponse<GroupResponse> findAll(Pageable pageable) {
        Page<Group> pages = groupRepository.findByIsDeletedIsFalse(pageable);
        List<GroupResponse> responses = pages
                .getContent()
                .stream()
                .map(groupMapper::toResponse)
                .toList();
        return PageResponse.<GroupResponse>builder()
                .data(responses)
                .page(pages.getNumber())
                .size(pages.getSize())
                .totalElements(pages.getTotalElements())
                .totalPages(pages.getTotalPages())
                .last(pages.isLast())
                .build();
    }

    // Find group by ID
    public GroupResponse findById(String id) {
        Group group = groupRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + id));
        return groupMapper.toResponse(group);
    }
    public GroupResponse create(GroupRequest request) {

        Student leader = studentRepository.findByIdAndIsDeletedIsFalse(request.getGroupLeader())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Group leader not found: " + request.getGroupLeader()));

        if (groupRepository.existsByGroupLeader_IdAndIsDeletedIsFalse(leader.getId())){
            throw new ResourceExist("Already Assigned to a Group");
        }
        if (groupRepository.existsByGroupMembers_IdAndIsDeletedIsFalse(leader.getId())){
            throw new ResourceExist("Already Assigned to a Group As Member");
        }

        List<Student> members = studentRepository.findAllByIdInAndIsDeletedIsFalse(request.getGroupMembers());
        if (members.isEmpty()) {
            throw new ResourceNotFoundException("There is No Members yet");
        }
        if (members.size() != request.getGroupMembers().size()) {

            List<String> foundIds = members.stream().map(Student::getId).toList();
            List<String> missingIds = request.getGroupMembers().stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
            throw new ResourceNotFoundException("Group members not found: " + missingIds);
        }
        for(Student member : members){
            boolean alreadyMember = groupRepository.existsByGroupMembers_IdAndIsDeletedIsFalse(member.getId());
            boolean alreadyLeader = groupRepository.existsByGroupLeader_IdAndIsDeletedIsFalse(member.getId());

            if (alreadyMember || alreadyLeader) {
                throw new ResourceExist("Already Assigned to a Group");
            }

        }
        if(!request.getGroupMembers().contains(leader.getId())){
                throw new RuntimeException("Leader Must Be Part of Member");
        }
        Group group = groupMapper.toEntity(request);
        group.setGroupLeader(leader);
        group.setGroupMembers(members); // directly set List<Student>

        Group savedGroup = groupRepository.save(group);
        return groupMapper.toResponse(savedGroup);
    }

    // Update an existing group
    public GroupResponse update(String id, GroupRequest request) {
        Group existingGroup = groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + id));

        Group mappedEntity = groupMapper.toEntity(request);

        mappedEntity.setId(id);
        Student leader = studentRepository.findById(request.getGroupLeader())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Group leader not found: " + request.getGroupLeader()));

        if (groupRepository.existsByGroupLeader_IdAndIsDeletedIsFalseAndIdNot(leader.getId(), id)){
            throw new ResourceExist("Already Assigned to a Group");
        }
        if (groupRepository.existsByGroupMembers_IdAndIsDeletedIsFalseAndIdNot(leader.getId(), id)){
            throw new ResourceExist("Already Assigned to a Group As Member");
        }


        List<Student> members = studentRepository.findAllByIdInAndIsDeletedIsFalse(request.getGroupMembers());
        if (members.isEmpty()) {
            throw new ResourceNotFoundException("Some student is Not Exist");
        }

        if (members.size() != request.getGroupMembers().size()) {

            List<String> foundIds = members.stream().map(Student::getId).toList();
            List<String> missingIds = request.getGroupMembers().stream()
                    .filter(currId -> !foundIds.contains(currId))
                    .toList();
            throw new ResourceNotFoundException("Group members not found: " + missingIds);
        }
        for(Student member : members){
            boolean alreadyMember = groupRepository.existsByGroupMembers_IdAndIsDeletedIsFalseAndIdNot(member.getId(), id);
            boolean alreadyLeader = groupRepository.existsByGroupLeader_IdAndIsDeletedIsFalseAndIdNot(member.getId(), id);

            if (alreadyMember || alreadyLeader) {
                throw new ResourceExist("Already Assigned to a Group");
            }

        }
        if(!request.getGroupMembers().contains(leader.getId())){
            throw new RuntimeException("Leader Must Be Part of Member");
        }
        mappedEntity.setGroupLeader(leader);

        mappedEntity.setGroupMembers(members);
        groupRepository.save(mappedEntity);
        return groupMapper.toResponse(mappedEntity);
    }


    // Delete a group
    public void delete(String id) {
        Group group = groupRepository.findByIdAndIsDeletedIsFalse(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + id));
        group.setDeleted(true);
        groupRepository.save(group);
    }
//    public List<StudentResponseGroupResponse> findAllNotYetAssigned(){}

    public GroupResponse updateGroupLeader(String groupId, String groupLeader){
        Group group = groupRepository.findByIdAndIsDeletedIsFalse(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        Student newLeader = studentRepository.findByIdAndIsDeletedIsFalse(groupLeader)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + groupLeader));

        boolean isMember = group.getGroupMembers()
                .stream()
                .anyMatch(s -> s.getId().equals(groupLeader));

        if (!isMember) {
            throw new ResourceBadRequest("Leader must be a group member");

        }

        if (groupRepository.existsByGroupLeader_IdAndIsDeletedIsFalseAndIdNot(groupLeader, groupId)) {
            throw new ResourceBadRequest("Student Already Assigned to a Group as Leader");
        }

        group.setGroupLeader(newLeader);
        return groupMapper.toResponse(groupRepository.save(group));
    }

    public GroupResponse removeGroupMember(String groupId, String studentId) {
        Group group = groupRepository.findByIdAndIsDeletedIsFalse(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        Student member = studentRepository.findByIdAndIsDeletedIsFalse(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        if (!group.hasMember(member.getId())) {
            throw new ResourceBadRequest("Student is not a member of this group");
        }

        if (group.getGroupLeader() != null && member.getId().equals(group.getGroupLeader().getId())) {
            throw new ResourceBadRequest("Group leader cannot be removed. Change leader first");
        }

        group.removeMember(member.getId());
        return groupMapper.toResponse(groupRepository.save(group));
    }
}
