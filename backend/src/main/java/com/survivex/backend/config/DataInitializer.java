package com.survivex.backend.config;

import com.survivex.backend.dto.CreateCommentRequest;
import com.survivex.backend.dto.CreatePostRequest;
import com.survivex.backend.dto.CreateUserRequest;
import com.survivex.backend.model.AboutPageEntity;
import com.survivex.backend.model.Post;
import com.survivex.backend.model.UserProfile;
import com.survivex.backend.repository.AboutPageRepository;
import com.survivex.backend.repository.UserAccountRepository;
import com.survivex.backend.service.SurviveXService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    ApplicationRunner loadSeedData(
            SurviveXService surviveXService,
            UserAccountRepository userAccountRepository,
            AboutPageRepository aboutPageRepository
    ) {
        return args -> {
            if (aboutPageRepository.count() == 0) {
                aboutPageRepository.save(new AboutPageEntity(
                        1L,
                        "Our Team",
                        "https://via.placeholder.com/1600x900.png?text=surviveX+Team",
                        """
                        We are a team of four students — Adish Sharma, Aman Bharawa, Arin Arya, and Siddharth Rawal — who have been working together since the very beginning of our engineering journey.

                        From our first year of college, we collaborated on multiple academic projects, assignments, and technical explorations. Over time, what started as a group of classmates evolved into a strong and dependable team built on trust, consistency, and shared learning.

                        Each project we worked on contributed to our growth — not only in technical skills but also in problem-solving, teamwork, and adaptability. We learned how to handle challenges, meet deadlines, and support each other through both successes and setbacks.

                        This project represents the culmination of our journey together. It reflects our combined efforts, ideas, and the experience we have gained over the years.

                        As we move forward into our professional careers, this project stands as a milestone — a symbol of our collaboration, dedication, and the journey we shared as a team.
                        """,
                        "Siddharth Rawal",
                        "https://via.placeholder.com/800x900.png?text=Siddharth+Rawal",
                        "A technology enthusiast with a forward-thinking mindset, Siddharth brings leadership and vision to the team. Known for his calm and composed nature, he focuses on practical execution and long-term impact. His ability to make balanced decisions and guide the team with clarity has been instrumental throughout the project.",
                        "Adish Sharma",
                        "https://via.placeholder.com/800x900.png?text=Adish+Sharma",
                        "A passionate gaming enthusiast with strong experience in C# development, Adish has built several impressive game projects. He brings discipline and consistency to the team, along with a strong sense of responsibility. His dedication both in technical work and personal fitness reflects his focused and balanced approach.",
                        "Aman Bharawa",
                        "https://via.placeholder.com/800x900.png?text=Aman+Bharawa",
                        "A machine learning enthusiast with a natural ability to blend technical depth with creativity, Aman plays a key role in problem-solving and innovation. Known for his excellent sense of humor, he creates a positive and energetic environment within the team, making collaboration both productive and enjoyable.",
                        "Arin Arya",
                        "https://via.placeholder.com/800x900.png?text=Arin+Arya",
                        "Often referred to as the “Vakeel Saab” of the group, Arin possesses strong communication and analytical skills. His ability to approach situations strategically and present ideas convincingly makes him a valuable team member. Academically consistent and detail-oriented, he has a clear understanding of how to navigate challenges effectively."
                ));
            }

            if (!userAccountRepository.existsByUsernameIgnoreCase("admin")) {
                surviveXService.createUser(new CreateUserRequest(
                        "admin",
                        "Admin",
                        "Platform moderator for surviveX approvals.",
                        "Moderation",
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
                        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
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
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
                    "maya123"
            ));
            UserProfile arjun = surviveXService.createUser(new CreateUserRequest(
                    "arjun.storm",
                    "Arjun Storm",
                    "Sharing survival lessons from mountains, roads, and real life.",
                    "Emergency calm",
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
                    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
                    "arjun123"
            ));
            UserProfile elena = surviveXService.createUser(new CreateUserRequest(
                    "elena.spark",
                    "Elena Spark",
                    "I collect true stories that help people act faster when it counts.",
                    "Urban safety",
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80",
                    "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80",
                    "elena123"
            ));

            Post firstPost = surviveXService.createPost(new CreatePostRequest(
                    maya.id(),
                    "The river looked calm until it wasn't",
                    "I slipped while crossing a cold river on a hike. My first instinct was to fight the current, but I remembered to turn on my back, point my feet downstream, and focus on reaching the nearest eddy instead of the shore directly. That one decision stopped the panic spiral and gave me control again.",
                    "When water wins on strength, switch to control. Protect your head, keep your feet up, and move diagonally toward calmer water.",
                    "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1200&q=80"
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
                    "If something smells electrically wrong, investigate early, cut power if it is safe, and never pour water on live wiring.",
                    "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200&q=80"
            ));
            surviveXService.toggleLike(secondPost.id(), maya.id());
        };
    }
}
