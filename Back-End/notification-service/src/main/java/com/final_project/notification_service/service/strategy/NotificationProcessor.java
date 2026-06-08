package com.final_project.notification_service.service.strategy;

import com.final_project.notification_service.model.Notification;

/**
 * Strategy contract for building a {@link Notification} from a raw Kafka event payload.
 * Each event type gets its own implementation.
 */
public interface NotificationProcessor<T> {

    /**
     * Builds and persists the notification for the given event.
     *
     * @param event the deserialized Kafka event
     */
    void process(T event);

    /**
     * Returns the event class this processor handles (used for dispatcher registration).
     */
    Class<T> supportedEventType();
}