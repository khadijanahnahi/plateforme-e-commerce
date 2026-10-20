package com.boutique.ecommerce.cloud.service;

import com.boutique.ecommerce.cloud.config.AwsCloudProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

@Component
@ConditionalOnProperty(prefix = "app.cloud.secrets", name = "enabled", havingValue = "true")
public class AwsSecretsStartupVerifier implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AwsSecretsStartupVerifier.class);

    private final SecretsManagerClient secretsManagerClient;
    private final AwsCloudProperties properties;

    public AwsSecretsStartupVerifier(SecretsManagerClient secretsManagerClient, AwsCloudProperties properties) {
        this.secretsManagerClient = secretsManagerClient;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        String secretName = properties.getSecrets().getRuntimeSecretName();
        var response = secretsManagerClient.getSecretValue(GetSecretValueRequest.builder()
                .secretId(secretName)
                .build());
        int length = response.secretString() == null ? 0 : response.secretString().length();
        log.info("AWS Secrets Manager runtime secret loaded. secretName={} chars={}", secretName, length);
    }
}
