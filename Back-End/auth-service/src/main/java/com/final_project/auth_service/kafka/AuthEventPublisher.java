package com.final_project.auth_service.kafka;

import com.final_project.auth_service.config.AppProperties;
import com.final_project.auth_service.event.PasswordChangedEvent;
import com.final_project.auth_service.event.ResetPasswordEvent;
import com.final_project.auth_service.event.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthEventPublisher {
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final AppProperties appProperties;

    public void publishUserRegister(UserRegisteredEvent userRegisteredEvent){
        String topic = appProperties.getKafka().getTopics().getUserRegistered();
        kafkaTemplate.send(topic, userRegisteredEvent.getUserId(), userRegisteredEvent)
                .whenComplete((res, ex) -> {
                    if (ex != null) {
                        log.error("Field to publish USER_REGISTERED event. userId {} eventId {} ", userRegisteredEvent.getUserId(), userRegisteredEvent.getEventId());
                    }
                    else{
                        log.info("PUBLISH USER_REGISTERED EVENT. topic {} partition {} offset {} and eventId {} ",
                                res.getProducerRecord().topic(),
                                res.getProducerRecord().partition(),
                                res.getRecordMetadata().hasOffset(),
                                userRegisteredEvent.getEventId()


                                );
                    }
                });

    }
    public void publishPasswordChange(PasswordChangedEvent event){
        String topic = appProperties.getKafka().getTopics().getChangePassword();
        kafkaTemplate.send(topic, event.getEventId(), event)
                .whenComplete((res, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish PASSWORD_CHANGED event. userId={} eventId={}",
                                event.getUserId(), event.getEventId(), ex);
                    }
                    else{
                        log.info("Published PASSWORD_CHANGED event. topic={} partition={} offset={} eventId={}",
                                res.getRecordMetadata().topic(),
                                res.getRecordMetadata().partition(),
                                res.getRecordMetadata().offset(),
                                event.getEventId());
                    }
                });
    }
    public void publishResetPasswordEvent(ResetPasswordEvent event){
        String topic = appProperties.getKafka().getTopics().getResetPassword();
        kafkaTemplate.send(topic, event.getEventId(), event)
                .whenComplete((res, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish PASSWORD_CHANGED event. userId={} eventId={}",
                                event.getUserId(), event.getEventId(), ex);
                    }
                    else{
                        log.info("Published PASSWORD_RESET event. topic={} partition={} offset={} eventId={}",
                                res.getRecordMetadata().topic(),
                                res.getRecordMetadata().partition(),
                                res.getRecordMetadata().offset(),
                                event.getEventId());
                    }
                });
    }

}
