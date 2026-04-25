package com.survivex.backend.service;

import com.survivex.backend.dto.CreateCommentRequest;
import com.survivex.backend.dto.CreatePostRequest;
import com.survivex.backend.dto.CreateUserRequest;
import com.survivex.backend.dto.LoginRequest;
import com.survivex.backend.dto.UpdateAboutPageRequest;
import com.survivex.backend.dto.UpdatePostRequest;
import com.survivex.backend.dto.UpdateProfileDetailsRequest;
import com.survivex.backend.dto.UpdateProfileMediaRequest;
import com.survivex.backend.model.AboutPage;
import com.survivex.backend.model.AboutPageEntity;
import com.survivex.backend.model.Comment;
import com.survivex.backend.model.CommentEntity;
import com.survivex.backend.model.Post;
import com.survivex.backend.model.PostEntity;
import com.survivex.backend.model.PostStatus;
import com.survivex.backend.model.TeamMember;
import com.survivex.backend.model.UserAccount;
import com.survivex.backend.model.UserProfile;
import com.survivex.backend.repository.AboutPageRepository;
import com.survivex.backend.repository.CommentRepository;
import com.survivex.backend.repository.PostRepository;
import com.survivex.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class SurviveXService {

    private static final String ADMIN_USERNAME = "admin";
    private static final Long ABOUT_PAGE_ID = 1L;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private final UserAccountRepository userAccountRepository;
    private final AboutPageRepository aboutPageRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final GeminiPostModerationService geminiPostModerationService;

    public SurviveXService(
            UserAccountRepository userAccountRepository,
            AboutPageRepository aboutPageRepository,
            PostRepository postRepository,
            CommentRepository commentRepository,
            GeminiPostModerationService geminiPostModerationService
    ) {
        this.userAccountRepository = userAccountRepository;
        this.aboutPageRepository = aboutPageRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.geminiPostModerationService = geminiPostModerationService;
    }

    @Transactional(readOnly = true)
    public List<UserProfile> getUsers() {
        return userAccountRepository.findAll().stream()
                .map(UserAccount::toProfile)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isUsernameAvailable(String username) {
        String normalizedUsername = username == null ? "" : username.trim().toLowerCase();
        if (normalizedUsername.length() < 4) {
            return false;
        }
        return !userAccountRepository.existsByUsernameIgnoreCase(normalizedUsername);
    }

    public UserProfile createUser(CreateUserRequest request) {
        String normalizedUsername = request.username().trim().toLowerCase();
        if (userAccountRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        UserAccount user = new UserAccount(
                normalizedUsername,
                request.displayName().trim(),
                request.bio().trim(),
                request.survivalFocus().trim(),
                normalizeOptional(request.profilePhotoUrl()),
                normalizeOptional(request.coverImageUrl()),
                passwordEncoder.encode(request.password().trim())
        );
        return userAccountRepository.save(user).toProfile();
    }

    public UserProfile login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(request.username().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        String rawPassword = request.password().trim();
        String storedPassword = user.getPassword();

        if (storedPassword != null && storedPassword.startsWith("$2")) {
            if (!passwordEncoder.matches(rawPassword, storedPassword)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
            }
        } else if (storedPassword != null && storedPassword.equals(rawPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userAccountRepository.save(user);
        } else {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        return user.toProfile();
    }

    @Transactional(readOnly = true)
    public List<Post> getFeed() {
        return postRepository.findByStatus(PostStatus.APPROVED).stream()
                .sorted(Comparator.comparing(PostEntity::getCreatedAt).reversed())
                .map(this::toPostResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Post> getUserPosts(Long userId) {
        getUserOrThrow(userId);
        return postRepository.findByAuthorId(userId).stream()
                .sorted(Comparator.comparing(PostEntity::getCreatedAt).reversed())
                .map(this::toPostResponse)
                .toList();
    }

    public Post createPost(CreatePostRequest request) {
        UserAccount author = getUserOrThrow(request.authorId());
        String normalizedTitle = request.title().trim();
        String normalizedStory = request.story().trim();
        String normalizedLesson = request.survivalLesson().trim();
        PostModerationDecision decision = geminiPostModerationService.moderate(
                normalizedTitle,
                normalizedStory,
                normalizedLesson
        );

        PostStatus status = decision.approved() ? PostStatus.APPROVED : PostStatus.REJECTED;
        return savePost(
                author,
                normalizedTitle,
                normalizedStory,
                normalizedLesson,
                normalizeOptional(request.imageUrl()),
                status,
                decision.reasonCode(),
                decision.message()
        );
    }

    @Transactional
    public Post updatePost(Long postId, UpdatePostRequest request) {
        PostEntity post = getPostOrThrow(postId);
        if (!post.getAuthor().getId().equals(request.requesterId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author can edit this post");
        }

        String normalizedTitle = request.title().trim();
        String normalizedStory = request.story().trim();
        String normalizedLesson = request.survivalLesson().trim();
        PostModerationDecision decision = geminiPostModerationService.moderate(
                normalizedTitle,
                normalizedStory,
                normalizedLesson
        );

        post.setTitle(normalizedTitle);
        post.setStory(normalizedStory);
        post.setSurvivalLesson(normalizedLesson);
        post.setImageUrl(normalizeOptional(request.imageUrl()));
        post.setCreatedAt(Instant.now());
        post.setStatus(decision.approved() ? PostStatus.APPROVED : PostStatus.REJECTED);
        post.setModerationReasonCode(decision.reasonCode());
        post.setModerationMessage(decision.message());

        return toPostResponse(postRepository.save(post));
    }

    @Transactional
    public Post createSeedPost(CreatePostRequest request) {
        UserAccount author = getUserOrThrow(request.authorId());
        return savePost(
                author,
                request.title().trim(),
                request.story().trim(),
                request.survivalLesson().trim(),
                normalizeOptional(request.imageUrl()),
                PostStatus.APPROVED,
                "approved",
                "Sample story published."
        );
    }

    @Transactional(readOnly = true)
    public Post getPost(Long postId) {
        return toPostResponse(getPostOrThrow(postId));
    }

    @Transactional
    public Post toggleLike(Long postId, Long userId) {
        UserAccount user = getUserOrThrow(userId);
        PostEntity post = getPostOrThrow(postId);

        if (post.getLikedUsers().stream().anyMatch(likedUser -> likedUser.getId().equals(user.getId()))) {
            post.getLikedUsers().removeIf(likedUser -> likedUser.getId().equals(user.getId()));
        } else {
            post.getLikedUsers().add(user);
        }

        return toPostResponse(postRepository.save(post));
    }

    @Transactional
    public Post addComment(Long postId, CreateCommentRequest request) {
        UserAccount author = getUserOrThrow(request.authorId());
        PostEntity post = getPostOrThrow(postId);
        if (post.getStatus() != PostStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comments are allowed only on approved posts");
        }

        CommentEntity comment = new CommentEntity(author, post, request.message().trim(), Instant.now());
        commentRepository.save(comment);
        post.getComments().add(comment);
        return toPostResponse(postRepository.save(post));
    }

    @Transactional
    public void deletePost(Long postId, Long requesterId) {
        PostEntity post = getPostOrThrow(postId);
        if (!post.getAuthor().getId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author can delete this post");
        }
        postRepository.delete(post);
    }

    @Transactional
    public Post deleteComment(Long postId, Long commentId, Long requesterId) {
        PostEntity post = getPostOrThrow(postId);

        CommentEntity targetComment = post.getComments().stream()
                .filter(comment -> comment.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!targetComment.getAuthor().getId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author can delete this comment");
        }

        post.getComments().removeIf(comment -> comment.getId().equals(commentId));
        commentRepository.delete(targetComment);
        return toPostResponse(postRepository.save(post));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCommunityOverview() {
        List<PostEntity> posts = postRepository.findByStatus(PostStatus.APPROVED);
        int totalLikes = posts.stream().mapToInt(post -> post.getLikedUsers().size()).sum();
        int totalComments = posts.stream().mapToInt(post -> post.getComments().size()).sum();

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("members", userAccountRepository.count());
        overview.put("stories", posts.size());
        overview.put("likes", totalLikes);
        overview.put("comments", totalComments);
        return overview;
    }

    @Transactional
    public UserProfile updateProfileMedia(Long userId, UpdateProfileMediaRequest request) {
        UserAccount user = getUserOrThrow(userId);
        user.setProfilePhotoUrl(normalizeOptional(request.profilePhotoUrl()));
        user.setCoverImageUrl(normalizeOptional(request.coverImageUrl()));
        return userAccountRepository.save(user).toProfile();
    }

    @Transactional
    public UserProfile updateProfileDetails(Long userId, UpdateProfileDetailsRequest request) {
        UserAccount user = getUserOrThrow(userId);
        user.setBio(request.bio().trim());
        user.setSurvivalFocus(request.survivalFocus().trim());
        return userAccountRepository.save(user).toProfile();
    }

    @Transactional(readOnly = true)
    public AboutPage getAboutPage() {
        return toAboutPage(getAboutPageEntity());
    }

    @Transactional
    public AboutPage updateAboutPage(UpdateAboutPageRequest request) {
        UserAccount admin = getUserOrThrow(request.adminId());
        validateAdmin(admin);
        if (request.members().size() != 4) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exactly 4 team members are required");
        }

        AboutPageEntity aboutPage = getAboutPageEntity();
        aboutPage.setTitle(request.title().trim());
        aboutPage.setTeamPhotoUrl(normalizeOptional(request.teamPhotoUrl()));
        aboutPage.setTeamStory(request.teamStory().trim());
        aboutPage.setMemberOneName(request.members().get(0).name().trim());
        aboutPage.setMemberOnePhotoUrl(normalizeOptional(request.members().get(0).photoUrl()));
        aboutPage.setMemberOneDescription(request.members().get(0).description().trim());
        aboutPage.setMemberTwoName(request.members().get(1).name().trim());
        aboutPage.setMemberTwoPhotoUrl(normalizeOptional(request.members().get(1).photoUrl()));
        aboutPage.setMemberTwoDescription(request.members().get(1).description().trim());
        aboutPage.setMemberThreeName(request.members().get(2).name().trim());
        aboutPage.setMemberThreePhotoUrl(normalizeOptional(request.members().get(2).photoUrl()));
        aboutPage.setMemberThreeDescription(request.members().get(2).description().trim());
        aboutPage.setMemberFourName(request.members().get(3).name().trim());
        aboutPage.setMemberFourPhotoUrl(normalizeOptional(request.members().get(3).photoUrl()));
        aboutPage.setMemberFourDescription(request.members().get(3).description().trim());

        return toAboutPage(aboutPageRepository.save(aboutPage));
    }

    private UserAccount getUserOrThrow(Long userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private PostEntity getPostOrThrow(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    private boolean isAdmin(UserAccount user) {
        return ADMIN_USERNAME.equalsIgnoreCase(user.getUsername());
    }

    private void validateAdmin(UserAccount user) {
        if (!isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can edit the About page");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private AboutPageEntity getAboutPageEntity() {
        return aboutPageRepository.findById(ABOUT_PAGE_ID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "About page not found"));
    }

    private AboutPage toAboutPage(AboutPageEntity aboutPageEntity) {
        return new AboutPage(
                aboutPageEntity.getTitle(),
                aboutPageEntity.getTeamPhotoUrl(),
                aboutPageEntity.getTeamStory(),
                List.of(
                        new TeamMember(
                                aboutPageEntity.getMemberOneName(),
                                aboutPageEntity.getMemberOnePhotoUrl(),
                                aboutPageEntity.getMemberOneDescription()
                        ),
                        new TeamMember(
                                aboutPageEntity.getMemberTwoName(),
                                aboutPageEntity.getMemberTwoPhotoUrl(),
                                aboutPageEntity.getMemberTwoDescription()
                        ),
                        new TeamMember(
                                aboutPageEntity.getMemberThreeName(),
                                aboutPageEntity.getMemberThreePhotoUrl(),
                                aboutPageEntity.getMemberThreeDescription()
                        ),
                        new TeamMember(
                                aboutPageEntity.getMemberFourName(),
                                aboutPageEntity.getMemberFourPhotoUrl(),
                                aboutPageEntity.getMemberFourDescription()
                        )
                )
        );
    }

    private Post toPostResponse(PostEntity post) {
        Set<Long> likedUserIds = post.getLikedUsers().stream()
                .map(UserAccount::getId)
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));

        List<Comment> comments = post.getComments().stream()
                .sorted(Comparator.comparing(CommentEntity::getCreatedAt))
                .collect(java.util.stream.Collectors.toMap(
                        CommentEntity::getId,
                        comment -> comment,
                        (existing, ignored) -> existing,
                        LinkedHashMap::new
                ))
                .values()
                .stream()
                .map(comment -> new Comment(
                        comment.getId(),
                        comment.getAuthor().getId(),
                        comment.getAuthor().getDisplayName(),
                        comment.getMessage(),
                        comment.getCreatedAt()
                ))
                .toList();

        return new Post(
                post.getId(),
                post.getAuthor().getId(),
                post.getAuthor().getDisplayName(),
                "@" + post.getAuthor().getUsername(),
                post.getAuthor().getProfilePhotoUrl(),
                post.getTitle(),
                post.getStory(),
                post.getSurvivalLesson(),
                post.getImageUrl(),
                post.getCreatedAt(),
                post.getStatus().name(),
                post.getModerationReasonCode(),
                post.getModerationMessage(),
                likedUserIds,
                comments
        );
    }

    private Post savePost(
            UserAccount author,
            String title,
            String story,
            String survivalLesson,
            String imageUrl,
            PostStatus status,
            String moderationReasonCode,
            String moderationMessage
    ) {
        PostEntity post = new PostEntity(
                author,
                title,
                story,
                survivalLesson,
                imageUrl,
                Instant.now(),
                status,
                moderationReasonCode,
                moderationMessage
        );
        return toPostResponse(postRepository.save(post));
    }
}
