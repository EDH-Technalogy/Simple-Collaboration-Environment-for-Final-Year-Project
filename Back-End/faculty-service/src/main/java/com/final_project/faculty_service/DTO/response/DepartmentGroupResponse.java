package com.final_project.faculty_service.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DepartmentGroupResponse {
    private String id;
    private String name;
    private String field;
    private String code;
    private String email;
    private String phone;
}
