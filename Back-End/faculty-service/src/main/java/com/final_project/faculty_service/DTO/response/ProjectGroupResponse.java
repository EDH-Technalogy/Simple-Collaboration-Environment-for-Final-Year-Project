package com.final_project.faculty_service.DTO.response;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ProjectGroupResponse {
    private String id;
    private String name;
    private List<GroupMemberResponse> groupMember;

}
