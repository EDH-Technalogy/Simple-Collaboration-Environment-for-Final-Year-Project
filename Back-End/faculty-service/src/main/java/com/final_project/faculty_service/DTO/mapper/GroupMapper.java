package com.final_project.faculty_service.DTO.mapper;

import com.final_project.faculty_service.DTO.request.GroupRequest;
import com.final_project.faculty_service.DTO.response.*;
import com.final_project.faculty_service.models.Group;
import com.final_project.faculty_service.models.Student;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class GroupMapper implements BaseMapper<GroupRequest, GroupResponse, Group> {
    @Override
    public Group toEntity(GroupRequest request) {
        Group group = new Group();

        Student leader = new Student();
        leader.setId(request.getGroupLeader());
        group.setGroupLeader(leader);
        group.setName(request.getName());

        // Ensure leader is in members
        List<Student> members = request.getGroupMembers().stream().map(curr -> {
           Student student = new Student();
           student.setId(curr);
           return student;
        }).toList();

        group.setGroupMembers(members);

        return group;
    }

    @Override
    public GroupResponse toResponse(Group group) {

        GroupResponse groupResponse = new GroupResponse();
        groupResponse.setId(group.getId());
        groupResponse.setName(group.getName());
        Student leader = new  Student();
        leader.setId(group.getGroupLeader().getId());
        groupResponse.setAcademicYear( AcademicYearResponse
                .builder()
                .id(group.getGroupLeader().getSemester().getAcademicYear().getId())
                .calendarType(group.getGroupLeader().getSemester().getAcademicYear().getCalendarType())
                .endDate(group.getGroupLeader().getSemester().getAcademicYear().getEndDate())
                .startDate(group.getGroupLeader().getSemester().getAcademicYear().getStartDate())
                .name(group.getGroupLeader().getSemester().getAcademicYear().getName())
                .build());
        groupResponse.setGroupLeader(new StudentResponseGroupResponse(
            group.getGroupLeader().getId(),
            group.getGroupLeader().getFirstName(),
            group.getGroupLeader().getLastName(),
            group.getGroupLeader().getCode(),
            group.getGroupLeader().getEmail(),
            group.getGroupLeader().getPhone(),
            group.getGroupLeader().getKankorId(),
            group.getGroupLeader().getProfilePicture(),
            new SemesterGroupResponse(
                    new AcademicYearGroupResponse(
                            group.getGroupLeader().getSemester().getAcademicYear().getName(),
                            group.getGroupLeader().getSemester().getAcademicYear().getStartDate(),
                            group.getGroupLeader().getSemester().getAcademicYear().getEndDate()
                    ),
                    group.getGroupLeader().getSemester().getType(),
                    group.getGroupLeader().getSemester().getName(),
                    group.getGroupLeader().getSemester().getStartDate(),
                    group.getGroupLeader().getSemester().getEndDate(),
                    group.getGroupLeader().getSemester().getCode()
            ),
            new DepartmentGroupResponse(
                    group.getGroupLeader().getDepartment().getId(),
                    group.getGroupLeader().getDepartment().getName(),
                    group.getGroupLeader().getDepartment().getField(),
                    group.getGroupLeader().getDepartment().getCode(),
                    group.getGroupLeader().getDepartment().getEmail(),
                    group.getGroupLeader().getDepartment().getPhone()
            ),
            group.getGroupLeader().getStatus(),

            new BatchGroupResponse(
                    group.getGroupLeader().getBatch().getName(),
                    group.getGroupLeader().getBatch().getYear(),
                    group.getGroupLeader().getBatch().getType()
            )

        ));

        List<StudentResponseGroupResponse> groupMemembers = group.getGroupMembers()
                .stream()
                .map(currentMemeber -> {
                    return new StudentResponseGroupResponse(
                            currentMemeber.getId(),
                            currentMemeber.getFirstName(),
                            currentMemeber.getLastName(),
                            currentMemeber.getCode(),
                            currentMemeber.getEmail(),
                            currentMemeber.getPhone(),
                            currentMemeber.getKankorId(),
                            currentMemeber.getProfilePicture(),
                            new SemesterGroupResponse(
                                    new AcademicYearGroupResponse(
                                            currentMemeber.getSemester().getAcademicYear().getName(),
                                            currentMemeber.getSemester().getAcademicYear().getStartDate(),
                                            currentMemeber.getSemester().getAcademicYear().getEndDate()
                                    ),
                                    currentMemeber.getSemester().getType(),
                                    currentMemeber.getSemester().getName(),
                                    currentMemeber.getSemester().getStartDate(),
                                    currentMemeber.getSemester().getEndDate(),
                                    currentMemeber.getSemester().getCode()
                            ),
                            new DepartmentGroupResponse(
                                    currentMemeber.getDepartment().getId(),
                                    currentMemeber.getDepartment().getName(),
                                    currentMemeber.getDepartment().getField(),
                                    currentMemeber.getDepartment().getCode(),
                                    currentMemeber.getDepartment().getEmail(),
                                    currentMemeber.getDepartment().getPhone()
                            ),
                            currentMemeber.getStatus(),
                            new BatchGroupResponse(
                                    currentMemeber.getBatch().getName(),
                                    currentMemeber.getBatch().getYear(),
                                    currentMemeber.getBatch().getType()
                            )
                    );
                }).toList();
        groupResponse.setGroupMembers(groupMemembers);
        return groupResponse;
    }
}
