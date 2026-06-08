package com.final_project.faculty_service.DTO.request;

import com.final_project.faculty_service.models.ProjectStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProjectRequest {
    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 50, message = "Project name must be between 3 and 50 characters")
    private String projectName;
    @NotBlank(message = "group is required")
    private String  group;
    @NotBlank(message = "teacher is required")
    private String  teacher;

    private String projectRepository;
    private String abstractText;
    private String finalFileName;
    private String finalFileDownloadUrl;

    private ProjectStatus status;

    @Min(value = 0, message = "Progress must be at least 0")
    @Max(value = 100, message = "Progress must be at most 100")
    private Integer progress;

    @Min(value = 0, message = "Completion must be at least 0")
    @Max(value = 100, message = "Completion must be at most 100")
    private Integer completion;

    private Boolean published;
}
