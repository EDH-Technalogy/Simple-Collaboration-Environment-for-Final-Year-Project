package com.final_project.notification_service.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.final_project.notification_service.event.PasswordChangedEvent;
import com.final_project.notification_service.event.ResetPasswordEvent;
import com.final_project.notification_service.service.IdempotencyService;
import com.final_project.notification_service.service.strategy.PasswordChangedProcessor;
import com.final_project.notification_service.service.strategy.ResetPasswordProcessor;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@AllArgsConstructor
@Component
@Slf4j
public class ResetPasswordConsumer {

    private final ResetPasswordProcessor processor;
    private final IdempotencyService idempotencyService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics           = "reset.password",
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
        log.info("Received PASSWORD_CHANGED event. Topic={} Partition={} Offset={}", topic, partition, offset);
        try {
            ResetPasswordEvent event = objectMapper.convertValue(record.value(), ResetPasswordEvent.class);
            String idempotencyKey = "consumer:password-reset:" + event.getEventId();
            if (!idempotencyService.tryAcquire(idempotencyKey)) {
                log.warn("Duplicate ResetPassword event skipped. EventId={}", event.getEventId());
                ack.acknowledge();
                return;
            }
            processor.process(event);
            ack.acknowledge();
        } catch (Exception ex) {
            log.error("Failed to process PASSWORD_CHANGED event. Key={} Error={}", record.key(), ex.getMessage(), ex);
            throw new RuntimeException("Failed to process PASSWORD_CHANGED event", ex);
        }
    }
}
