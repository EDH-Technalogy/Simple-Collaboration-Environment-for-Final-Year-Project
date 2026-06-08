package com.final_project.faculty_service.DTO.request;

import com.mongodb.annotations.NotThreadSafe;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class GroupRequest {
    @NotBlank(message = "group name is required")
    @Size(min = 2, max = 50, message = "Group name must be between 3 and 50 characters")
    private String name;


    private List<@NotBlank(message = "Member Id cannot be empty") String> groupMembers;
    @NotBlank(message = "group leader is required")
    private String   groupLeader;
}
