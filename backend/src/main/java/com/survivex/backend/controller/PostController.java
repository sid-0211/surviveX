package com.survivex.backend.controller;

import com.survivex.backend.dto.CreateCommentRequest;
import com.survivex.backend.dto.CreatePostRequest;
import com.survivex.backend.dto.DeleteContentRequest;
import com.survivex.backend.dto.ToggleLikeRequest;
import com.survivex.backend.dto.UpdatePostRequest;
import com.survivex.backend.model.Post;
import com.survivex.backend.service.SurviveXService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PostController {

    private final SurviveXService surviveXService;

    public PostController(SurviveXService surviveXService) {
        this.surviveXService = surviveXService;
    }

    @GetMapping("/feed")
    public List<Post> getFeed() {
        return surviveXService.getFeed();
    }

    @GetMapping("/users/{userId}/posts")
    public List<Post> getUserPosts(@PathVariable Long userId) {
        return surviveXService.getUserPosts(userId);
    }

    @GetMapping("/overview")
    public Map<String, Object> getOverview() {
        return surviveXService.getCommunityOverview();
    }

    @PostMapping("/posts")
    public Post createPost(@Valid @RequestBody CreatePostRequest request) {
        return surviveXService.createPost(request);
    }

    @PutMapping("/posts/{postId}")
    public Post updatePost(@PathVariable Long postId, @Valid @RequestBody UpdatePostRequest request) {
        return surviveXService.updatePost(postId, request);
    }

    @PostMapping("/posts/{postId}/like")
    public Post toggleLike(@PathVariable Long postId, @Valid @RequestBody ToggleLikeRequest request) {
        return surviveXService.toggleLike(postId, request.userId());
    }

    @PostMapping("/posts/{postId}/comments")
    public Post addComment(@PathVariable Long postId, @Valid @RequestBody CreateCommentRequest request) {
        return surviveXService.addComment(postId, request);
    }

    @DeleteMapping("/posts/{postId}")
    public void deletePost(@PathVariable Long postId, @Valid @RequestBody DeleteContentRequest request) {
        surviveXService.deletePost(postId, request.requesterId());
    }

    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public Post deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody DeleteContentRequest request
    ) {
        return surviveXService.deleteComment(postId, commentId, request.requesterId());
    }
}
