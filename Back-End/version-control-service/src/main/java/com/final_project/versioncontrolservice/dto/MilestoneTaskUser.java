package com.final_project.versioncontrolservice.dto;

import kotlin.BuilderInference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneTaskUser {
    private String userId;
    private String userName;
    private String firstName;
    private String email;
    private String profile;
}
