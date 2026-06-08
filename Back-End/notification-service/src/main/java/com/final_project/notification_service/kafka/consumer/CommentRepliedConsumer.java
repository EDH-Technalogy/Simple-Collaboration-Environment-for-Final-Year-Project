package com.final_project.notification_service.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.notification_service.event.CommentRepliedEvent;
import com.final_project.notification_service.service.IdempotencyService;
import com.final_project.notification_service.service.strategy.CommentRepliedProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CommentRepliedConsumer {

    private final CommentRepliedProcessor processor;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics           = "${app.kafka.topics.comment-replied}",
            groupId          = "notification-service-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(
            ConsumerRecord<String, Object> record,
            Acknowledgment ack,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset
    ) {
        log.info("Received COMMENT_REPLIED event. Topic={} Partition={} Offset={}", topic, partition, offset);
        try {
            CommentRepliedEvent event = objectMapper.convertValue(record.value(), CommentRepliedEvent.class);

            String idempotencyKey = "consumer:comment-reply:" + event.getEventId();
            if (!idempotencyService.tryAcquire(idempotencyKey)) {
                log.warn("Duplicate COMMENT_REPLIED event skipped. EventId={}", event.getEventId());
                ack.acknowledge();
                return;
            }

            processor.process(event);
            ack.acknowledge();

        } catch (Exception ex) {
            log.error("Failed to process COMMENT_REPLIED event. Key={} Error={}", record.key(), ex.getMessage(), ex);
            throw new RuntimeException("Failed to process COMMENT_REPLIED event", ex);
        }
    }
}
