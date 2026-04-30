package com.survivex.backend.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_accounts")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(unique = true, length = 320)
    private String email;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false, length = 1000)
    private String bio;

    @Column(nullable = false)
    private String survivalFocus;

    @Column(length = 1000)
    private String profilePhotoUrl;

    @Column(length = 1000)
    private String coverImageUrl;

    @Column(nullable = false)
    private String password;

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PostEntity> posts = new ArrayList<>();

    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CommentEntity> comments = new ArrayList<>();

    public UserAccount() {
    }

    public UserAccount(
            String email,
            String username,
            String displayName,
            String bio,
            String survivalFocus,
            String profilePhotoUrl,
            String coverImageUrl,
            String password
    ) {
        this.email = email;
        this.username = username;
        this.displayName = displayName;
        this.bio = bio;
        this.survivalFocus = survivalFocus;
        this.profilePhotoUrl = profilePhotoUrl;
        this.coverImageUrl = coverImageUrl;
        this.password = password;
    }

    public UserProfile toProfile() {
        return new UserProfile(id, email, username, displayName, bio, survivalFocus, profilePhotoUrl, coverImageUrl);
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getSurvivalFocus() {
        return survivalFocus;
    }

    public void setSurvivalFocus(String survivalFocus) {
        this.survivalFocus = survivalFocus;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getProfilePhotoUrl() {
        return profilePhotoUrl;
    }

    public void setProfilePhotoUrl(String profilePhotoUrl) {
        this.profilePhotoUrl = profilePhotoUrl;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }
}
