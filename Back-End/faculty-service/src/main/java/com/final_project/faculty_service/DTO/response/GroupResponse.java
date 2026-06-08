package com.final_project.faculty_service.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class GroupResponse {
    private String id;
    private String name;
    private List<StudentResponseGroupResponse> groupMembers;
    private StudentResponseGroupResponse groupLeader;
    private AcademicYearResponse academicYear;
}
