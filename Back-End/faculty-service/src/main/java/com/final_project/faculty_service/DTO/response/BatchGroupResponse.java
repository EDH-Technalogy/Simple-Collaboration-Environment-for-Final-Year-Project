package com.final_project.faculty_service.DTO.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class BatchGroupResponse {
    private String name;
    private Integer year;
    private String type;
}
