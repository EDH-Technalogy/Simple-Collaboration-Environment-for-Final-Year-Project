package com.final_project.versioncontrolservice.dto;

import com.final_project.versioncontrolservice.model.PullRequestConflict;
import lombok.Data;

import java.util.List;

@Data
public class ResolveConflictRequest {
    private List<FileResolution> files;

    @Data
    public static class FileResolution {
        private String path;
        private List<BlockResolution> blocks;
    }

    @Data
    public static class BlockResolution {
        private String blockId;
        private PullRequestConflict.ConflictResolution resolution;
        private String customContent;
    }
}
