package com.survivex.backend;

import com.survivex.backend.config.CloudinaryProperties;
import com.survivex.backend.config.ElevenLabsProperties;
import com.survivex.backend.config.GeminiProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({CloudinaryProperties.class, ElevenLabsProperties.class, GeminiProperties.class})
public class SurviveXApplication {

    public static void main(String[] args) {
        SpringApplication.run(SurviveXApplication.class, args);
    }
}
