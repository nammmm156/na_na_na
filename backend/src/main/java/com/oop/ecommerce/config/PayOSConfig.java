package com.oop.ecommerce.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import vn.payos.PayOS;

@Configuration
public class PayOSConfig {

    @Bean
    @ConditionalOnProperty(name = "payos.enabled", havingValue = "true")
    public PayOS payOS(PayOSProperties props) {
        if (!StringUtils.hasText(props.getClientId())
                || !StringUtils.hasText(props.getApiKey())
                || !StringUtils.hasText(props.getChecksumKey())) {
            throw new IllegalStateException(
                    "payos.client-id, payos.api-key and payos.checksum-key must be set when PayOS is enabled.");
        }
        return new PayOS(props.getClientId(), props.getApiKey(), props.getChecksumKey());
    }
}
