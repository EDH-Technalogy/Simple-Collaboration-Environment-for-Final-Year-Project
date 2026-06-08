package com.final_project.notification_service.dto.response;


import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Aggregated notification statistics")
public class NotificationStatsResponse {

    @Schema(description = "Total notifications in the queried period")
    private long total;

    @Schema(description = "Count by status")
    private Map<String, Long> byStatus;

    @Schema(description = "Count by type")
    private Map<String, Long> byType;

    @Schema(description = "Delivery success rate (0–100)")
    private double successRate;

    @Schema(description = "Average retry count for failed notifications")
    private double averageRetries;
}