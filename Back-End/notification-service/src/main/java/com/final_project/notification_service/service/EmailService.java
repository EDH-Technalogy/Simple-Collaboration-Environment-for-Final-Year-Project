package com.final_project.notification_service.service;
import com.final_project.notification_service.config.AppProperties;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.UnsupportedEncodingException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
//@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final AppProperties appProperties;
    public EmailService (JavaMailSender mailSender, TemplateEngine templateEngine, AppProperties appProperties){
        this.templateEngine = templateEngine;
        this.mailSender = mailSender;
        this.appProperties = appProperties;
    }

    /**
     * Sends an HTML email rendered from a Thymeleaf template.
     *
     * @param to           recipient email address
     * @param subject      email subject
     * @param templateName Thymeleaf template file name (without .html extension)
     * @param variables    template context variables
     */
    @Async("notificationExecutor")
    @CircuitBreaker(name = "emailService", fallbackMethod = "emailFallback")
    @Retry(name = "emailService")
    public CompletableFuture<Void> sendHtmlEmail(
            String to,
            String subject,
            String templateName,
            Map<String, Object> variables
    ) {
        try {
            String html = renderTemplate(templateName, variables);
            sendMimeMessage(to, subject, html);
            log.info("Email sent successfully. To={} Subject={}", to, subject);
            return CompletableFuture.completedFuture(null);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email. To={} Subject={} Error={}", to, subject, e.getMessage());
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }

    /**
     * Sends a plain-text email (for fallback or simple alerts).
     */
    @Async("notificationExecutor")
    @CircuitBreaker(name = "emailService", fallbackMethod = "emailFallback")
    @Retry(name = "emailService")
    public CompletableFuture<Void> sendPlainTextEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(
                    appProperties.getNotification().getFromEmail(),
                    appProperties.getNotification().getFromName()
            );
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
            log.info("Plain text email sent. To={}", to);
            return CompletableFuture.completedFuture(null);
        } catch (Exception e) {
            log.error("Failed to send plain text email. To={} Error={}", to, e.getMessage());
            throw new RuntimeException("Plain text email failed: " + e.getMessage(), e);
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private String renderTemplate(String templateName, Map<String, Object> variables) {
        Context context = new Context();
        context.setVariables(variables);
        return templateEngine.process(templateName, context);
    }

    private void sendMimeMessage(String to, String subject, String html) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(
                appProperties.getNotification().getFromEmail(),
                appProperties.getNotification().getFromName()
        );
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(message);
    }

    // ── Circuit-breaker fallback ──────────────────────────────────────────────

    @SuppressWarnings("unused")
    private CompletableFuture<Void> emailFallback(
            String to, String subject, String templateName,
            Map<String, Object> variables, Throwable ex
    ) {
        log.error("Email circuit breaker OPEN. Falling back for To={} Subject={} Cause={}",
                to, subject, ex.getMessage());
        // In production: publish to DLQ or persist for deferred retry
        return CompletableFuture.failedFuture(
                new RuntimeException("Email service unavailable — notification queued for retry", ex));
    }

    @SuppressWarnings("unused")
    private CompletableFuture<Void> emailFallback(
            String to, String subject, String body, Throwable ex
    ) {
        log.error("Plain email circuit breaker OPEN. To={} Cause={}", to, ex.getMessage());
        return CompletableFuture.failedFuture(
                new RuntimeException("Email service unavailable", ex));
    }
}