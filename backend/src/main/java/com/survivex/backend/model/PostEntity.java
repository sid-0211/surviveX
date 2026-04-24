package com.survivex.backend.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "posts")
public class PostEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private UserAccount author;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 6000)
    private String story;

    @Column(nullable = false, length = 2000)
    private String survivalLesson;

    @Column(length = 1000)
    private String imageUrl;

    @Column(nullable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(32) DEFAULT 'APPROVED'")
    private PostStatus status;

    @Column(length = 64)
    private String moderationReasonCode;

    @Column(length = 500)
    private String moderationMessage;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "post_likes",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<UserAccount> likedUsers = new LinkedHashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<CommentEntity> comments = new ArrayList<>();

    public PostEntity() {
    }

    public PostEntity(
            UserAccount author,
            String title,
            String story,
            String survivalLesson,
            String imageUrl,
            Instant createdAt,
            PostStatus status,
            String moderationReasonCode,
            String moderationMessage
    ) {
        this.author = author;
        this.title = title;
        this.story = story;
        this.survivalLesson = survivalLesson;
        this.imageUrl = imageUrl;
        this.createdAt = createdAt;
        this.status = status;
        this.moderationReasonCode = moderationReasonCode;
        this.moderationMessage = moderationMessage;
    }

    public Long getId() {
        return id;
    }

    public UserAccount getAuthor() {
        return author;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStory() {
        return story;
    }

    public void setStory(String story) {
        this.story = story;
    }

    public String getSurvivalLesson() {
        return survivalLesson;
    }

    public void setSurvivalLesson(String survivalLesson) {
        this.survivalLesson = survivalLesson;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public PostStatus getStatus() {
        return status;
    }

    public void setStatus(PostStatus status) {
        this.status = status;
    }

    public String getModerationReasonCode() {
        return moderationReasonCode;
    }

    public void setModerationReasonCode(String moderationReasonCode) {
        this.moderationReasonCode = moderationReasonCode;
    }

    public String getModerationMessage() {
        return moderationMessage;
    }

    public void setModerationMessage(String moderationMessage) {
        this.moderationMessage = moderationMessage;
    }

    public Set<UserAccount> getLikedUsers() {
        return likedUsers;
    }

    public List<CommentEntity> getComments() {
        return comments;
    }
}
