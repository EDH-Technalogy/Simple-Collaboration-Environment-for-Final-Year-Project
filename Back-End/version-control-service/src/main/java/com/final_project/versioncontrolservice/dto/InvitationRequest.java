package com.final_project.versioncontrolservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InvitationRequest {
        private String repository;
        private String  guest;
        private String host;
        private String hostId;
}
