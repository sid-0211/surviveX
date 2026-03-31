package com.survivex.backend;

import com.survivex.backend.config.CloudinaryProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(CloudinaryProperties.class)
public class SurviveXApplication {

    public static void main(String[] args) {
        SpringApplication.run(SurviveXApplication.class, args);
    }
}
