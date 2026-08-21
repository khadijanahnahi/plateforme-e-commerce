package com.boutique.ecommerce.cloud.config;

import java.net.URI;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;

@Configuration
@ConditionalOnProperty(prefix = "app.cloud", name = "enabled", havingValue = "true")
public class AwsClientConfig {

    @Bean
    S3Client s3Client(AwsCloudProperties properties) {
        var builder = S3Client.builder()
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(credentials(properties))
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .forcePathStyle(true);
        endpoint(properties, builder::endpointOverride);
        return builder.build();
    }

    @Bean
    SqsClient sqsClient(AwsCloudProperties properties) {
        var builder = SqsClient.builder()
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(credentials(properties))
                .httpClientBuilder(UrlConnectionHttpClient.builder());
        endpoint(properties, builder::endpointOverride);
        return builder.build();
    }

    @Bean
    EventBridgeClient eventBridgeClient(AwsCloudProperties properties) {
        var builder = EventBridgeClient.builder()
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(credentials(properties))
                .httpClientBuilder(UrlConnectionHttpClient.builder());
        endpoint(properties, builder::endpointOverride);
        return builder.build();
    }

    @Bean
    SecretsManagerClient secretsManagerClient(AwsCloudProperties properties) {
        var builder = SecretsManagerClient.builder()
                .region(Region.of(properties.getRegion()))
                .credentialsProvider(credentials(properties))
                .httpClientBuilder(UrlConnectionHttpClient.builder());
        endpoint(properties, builder::endpointOverride);
        return builder.build();
    }

    private AwsCredentialsProvider credentials(AwsCloudProperties properties) {
        if (properties.getAccessKey() == null || properties.getAccessKey().isBlank()
                || properties.getSecretKey() == null || properties.getSecretKey().isBlank()) {
            return DefaultCredentialsProvider.create();
        }
        return StaticCredentialsProvider.create(
                AwsBasicCredentials.create(properties.getAccessKey(), properties.getSecretKey()));
    }

    private void endpoint(AwsCloudProperties properties, java.util.function.Consumer<URI> consumer) {
        if (properties.getEndpoint() != null && !properties.getEndpoint().isBlank()) {
            consumer.accept(URI.create(properties.getEndpoint()));
        }
    }
}
