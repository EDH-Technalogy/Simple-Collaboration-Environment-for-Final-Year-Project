package com.final_project.notification_service.kafka.consumer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.notification_service.event.BlogCommentedEvent;
import com.final_project.notification_service.service.IdempotencyService;
import com.final_project.notification_service.service.strategy.BlogCommentedProcessor;
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
public class BlogCommentedConsumer {

    private final BlogCommentedProcessor processor;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics           = "${app.kafka.topics.blog-commented}",
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
        log.info("Received BLOG_COMMENTED event. Topic={} Partition={} Offset={}", topic, partition, offset);
        try {
            BlogCommentedEvent event = objectMapper.convertValue(record.value(), BlogCommentedEvent.class);

            String idempotencyKey = "consumer:blog-comment:" + event.getEventId();
            if (!idempotencyService.tryAcquire(idempotencyKey)) {
                log.warn("Duplicate BLOG_COMMENTED event skipped. EventId={}", event.getEventId());
                ack.acknowledge();
                return;
            }

            processor.process(event);
            ack.acknowledge();

        } catch (Exception ex) {
            log.error("Failed to process BLOG_COMMENTED event. Key={} Error={}", record.key(), ex.getMessage(), ex);
            throw new RuntimeException("Failed to process BLOG_COMMENTED event", ex);
        }
    }
}