package com.boutique.ecommerce.notification;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final AppEmailProperties emailProperties;

    public EmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            AppEmailProperties emailProperties
    ) {
        this.mailSenderProvider = mailSenderProvider;
        this.emailProperties = emailProperties;
    }

    public boolean isConfigured() {
        return mailSenderProvider.getIfAvailable() != null;
    }

    public void sendHtml(String to, String subject, String htmlBody) throws MessagingException {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException("JavaMailSender is not configured.");
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
                message,
                false,
                StandardCharsets.UTF_8.name()
        );
        helper.setFrom(emailProperties.getFrom());
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }
}
