package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.services.ProjectService;
import lombok.Data;

import java.util.List;

@Data
public class DashboardResponse {
    private int student;
    private int teacher;
    private int users;
    private int currentProject;
    private int department;
    private List<ProjectResponse> project;


}
