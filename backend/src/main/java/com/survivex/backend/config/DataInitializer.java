package com.survivex.backend.config;

import com.survivex.backend.dto.CreateCommentRequest;
import com.survivex.backend.dto.CreatePostRequest;
import com.survivex.backend.dto.CreateUserRequest;
import com.survivex.backend.model.Post;
import com.survivex.backend.model.UserProfile;
import com.survivex.backend.repository.UserAccountRepository;
import com.survivex.backend.service.SurviveXService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    ApplicationRunner loadSeedData(SurviveXService surviveXService, UserAccountRepository userAccountRepository) {
        return args -> {
            if (!userAccountRepository.existsByUsernameIgnoreCase("admin")) {
                surviveXService.createUser(new CreateUserRequest(
                        "admin",
                        "Admin",
                        "Platform moderator for surviveX approvals.",
                        "Moderation",
                        "admin0211"
                ));
            }

            if (userAccountRepository.count() > 1) {
                return;
            }

            UserProfile maya = surviveXService.createUser(new CreateUserRequest(
                    "maya.river",
                    "Maya River",
                    "Documenting close calls and the instincts that mattered most.",
                    "Wilderness awareness",
                    "maya123"
            ));
            UserProfile arjun = surviveXService.createUser(new CreateUserRequest(
                    "arjun.storm",
                    "Arjun Storm",
                    "Sharing survival lessons from mountains, roads, and real life.",
                    "Emergency calm",
                    "arjun123"
            ));
            UserProfile elena = surviveXService.createUser(new CreateUserRequest(
                    "elena.spark",
                    "Elena Spark",
                    "I collect true stories that help people act faster when it counts.",
                    "Urban safety",
                    "elena123"
            ));

            Post firstPost = surviveXService.createPost(new CreatePostRequest(
                    maya.id(),
                    "The river looked calm until it wasn't",
                    "I slipped while crossing a cold river on a hike. My first instinct was to fight the current, but I remembered to turn on my back, point my feet downstream, and focus on reaching the nearest eddy instead of the shore directly. That one decision stopped the panic spiral and gave me control again.",
                    "When water wins on strength, switch to control. Protect your head, keep your feet up, and move diagonally toward calmer water."
            ));
            surviveXService.toggleLike(firstPost.id(), arjun.id());
            surviveXService.addComment(firstPost.id(), new CreateCommentRequest(
                    elena.id(),
                    "That reminder about not standing up too early in moving water is huge."
            ));

            Post secondPost = surviveXService.createPost(new CreatePostRequest(
                    arjun.id(),
                    "I smelled smoke before I saw the wiring fire",
                    "At 2 AM I woke up to a faint burning-plastic smell. There was no visible flame yet, but the outlet near the desk was already overheating. Cutting power at the breaker first prevented a much worse fire. It taught me that strange smells are not something to dismiss when seconds matter.",
                    "If something smells electrically wrong, investigate early, cut power if it is safe, and never pour water on live wiring."
            ));
            surviveXService.toggleLike(secondPost.id(), maya.id());
        };
    }
}
