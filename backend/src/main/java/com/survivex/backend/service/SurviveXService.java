package com.survivex.backend.service;

import com.survivex.backend.dto.CreateCommentRequest;
import com.survivex.backend.dto.CreatePostRequest;
import com.survivex.backend.dto.CreateUserRequest;
import com.survivex.backend.dto.LoginRequest;
import com.survivex.backend.model.Comment;
import com.survivex.backend.model.CommentEntity;
import com.survivex.backend.model.Post;
import com.survivex.backend.model.PostEntity;
import com.survivex.backend.model.PostStatus;
import com.survivex.backend.model.UserAccount;
import com.survivex.backend.model.UserProfile;
import com.survivex.backend.repository.CommentRepository;
import com.survivex.backend.repository.PostRepository;
import com.survivex.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
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

    private final UserAccountRepository userAccountRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public SurviveXService(
            UserAccountRepository userAccountRepository,
            PostRepository postRepository,
            CommentRepository commentRepository
    ) {
        this.userAccountRepository = userAccountRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
    }

    @Transactional(readOnly = true)
    public List<UserProfile> getUsers() {
        return userAccountRepository.findAll().stream()
                .map(UserAccount::toProfile)
                .toList();
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
                request.password().trim()
        );
        return userAccountRepository.save(user).toProfile();
    }

    @Transactional(readOnly = true)
    public UserProfile login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByUsernameIgnoreCase(request.username().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        if (!user.getPassword().equals(request.password().trim())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        return user.toProfile();
    }

    @Transactional(readOnly = true)
    public List<Post> getFeed() {
        return postRepository.findByStatus(PostStatus.APPROVED).stream()
                .sorted(Comparator.comparingInt((PostEntity post) -> post.getLikedUsers().size())
                        .reversed()
                        .thenComparing(PostEntity::getCreatedAt, Comparator.reverseOrder()))
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

    @Transactional(readOnly = true)
    public List<Post> getPendingPostsForAdmin(Long adminId) {
        UserAccount admin = getUserOrThrow(adminId);
        validateAdmin(admin);
        return postRepository.findByStatus(PostStatus.PENDING).stream()
                .sorted(Comparator.comparing(PostEntity::getCreatedAt).reversed())
                .map(this::toPostResponse)
                .toList();
    }

    public Post createPost(CreatePostRequest request) {
        UserAccount author = getUserOrThrow(request.authorId());
        PostStatus status = isAdmin(author) ? PostStatus.APPROVED : PostStatus.PENDING;
        PostEntity post = new PostEntity(
                author,
                request.title().trim(),
                request.story().trim(),
                request.survivalLesson().trim(),
                Instant.now(),
                status
        );
        return toPostResponse(postRepository.save(post));
    }

    public Post approvePost(Long postId, Long adminId) {
        UserAccount admin = getUserOrThrow(adminId);
        validateAdmin(admin);

        PostEntity post = getPostOrThrow(postId);
        post.setStatus(PostStatus.APPROVED);
        return toPostResponse(postRepository.save(post));
    }

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

    public void deletePost(Long postId, Long requesterId) {
        PostEntity post = getPostOrThrow(postId);
        if (!post.getAuthor().getId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author can delete this post");
        }
        postRepository.delete(post);
    }

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
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin can approve posts");
        }
    }

    private Post toPostResponse(PostEntity post) {
        Set<Long> likedUserIds = post.getLikedUsers().stream()
                .map(UserAccount::getId)
                .collect(java.util.stream.Collectors.toCollection(java.util.LinkedHashSet::new));

        List<Comment> comments = post.getComments().stream()
                .sorted(Comparator.comparing(CommentEntity::getCreatedAt))
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
                post.getTitle(),
                post.getStory(),
                post.getSurvivalLesson(),
                post.getCreatedAt(),
                post.getStatus().name(),
                likedUserIds,
                comments
        );
    }
}
