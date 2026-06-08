package com.final_project.faculty_service.DTO.response;

import com.final_project.faculty_service.models.StudentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GroupMemberResponse {
    private String id;
    private String firstName;
    private String lastName;
    private String code;
    private String email;
    private String phone;
    private String kankorId;
    private String profilePicture;
}
