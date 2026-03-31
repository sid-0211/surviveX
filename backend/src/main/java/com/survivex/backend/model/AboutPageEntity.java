package com.survivex.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "about_page")
public class AboutPageEntity {

    @Id
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String teamPhotoUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String teamStory;

    @Column(nullable = false)
    private String memberOneName;

    @Column(length = 1000)
    private String memberOnePhotoUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String memberOneDescription;

    @Column(nullable = false)
    private String memberTwoName;

    @Column(length = 1000)
    private String memberTwoPhotoUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String memberTwoDescription;

    @Column(nullable = false)
    private String memberThreeName;

    @Column(length = 1000)
    private String memberThreePhotoUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String memberThreeDescription;

    @Column(nullable = false)
    private String memberFourName;

    @Column(length = 1000)
    private String memberFourPhotoUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String memberFourDescription;

    public AboutPageEntity() {
    }

    public AboutPageEntity(
            Long id,
            String title,
            String teamPhotoUrl,
            String teamStory,
            String memberOneName,
            String memberOnePhotoUrl,
            String memberOneDescription,
            String memberTwoName,
            String memberTwoPhotoUrl,
            String memberTwoDescription,
            String memberThreeName,
            String memberThreePhotoUrl,
            String memberThreeDescription,
            String memberFourName,
            String memberFourPhotoUrl,
            String memberFourDescription
    ) {
        this.id = id;
        this.title = title;
        this.teamPhotoUrl = teamPhotoUrl;
        this.teamStory = teamStory;
        this.memberOneName = memberOneName;
        this.memberOnePhotoUrl = memberOnePhotoUrl;
        this.memberOneDescription = memberOneDescription;
        this.memberTwoName = memberTwoName;
        this.memberTwoPhotoUrl = memberTwoPhotoUrl;
        this.memberTwoDescription = memberTwoDescription;
        this.memberThreeName = memberThreeName;
        this.memberThreePhotoUrl = memberThreePhotoUrl;
        this.memberThreeDescription = memberThreeDescription;
        this.memberFourName = memberFourName;
        this.memberFourPhotoUrl = memberFourPhotoUrl;
        this.memberFourDescription = memberFourDescription;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTeamPhotoUrl() {
        return teamPhotoUrl;
    }

    public void setTeamPhotoUrl(String teamPhotoUrl) {
        this.teamPhotoUrl = teamPhotoUrl;
    }

    public String getTeamStory() {
        return teamStory;
    }

    public void setTeamStory(String teamStory) {
        this.teamStory = teamStory;
    }

    public String getMemberOneName() {
        return memberOneName;
    }

    public void setMemberOneName(String memberOneName) {
        this.memberOneName = memberOneName;
    }

    public String getMemberOnePhotoUrl() {
        return memberOnePhotoUrl;
    }

    public void setMemberOnePhotoUrl(String memberOnePhotoUrl) {
        this.memberOnePhotoUrl = memberOnePhotoUrl;
    }

    public String getMemberOneDescription() {
        return memberOneDescription;
    }

    public void setMemberOneDescription(String memberOneDescription) {
        this.memberOneDescription = memberOneDescription;
    }

    public String getMemberTwoName() {
        return memberTwoName;
    }

    public void setMemberTwoName(String memberTwoName) {
        this.memberTwoName = memberTwoName;
    }

    public String getMemberTwoPhotoUrl() {
        return memberTwoPhotoUrl;
    }

    public void setMemberTwoPhotoUrl(String memberTwoPhotoUrl) {
        this.memberTwoPhotoUrl = memberTwoPhotoUrl;
    }

    public String getMemberTwoDescription() {
        return memberTwoDescription;
    }

    public void setMemberTwoDescription(String memberTwoDescription) {
        this.memberTwoDescription = memberTwoDescription;
    }

    public String getMemberThreeName() {
        return memberThreeName;
    }

    public void setMemberThreeName(String memberThreeName) {
        this.memberThreeName = memberThreeName;
    }

    public String getMemberThreePhotoUrl() {
        return memberThreePhotoUrl;
    }

    public void setMemberThreePhotoUrl(String memberThreePhotoUrl) {
        this.memberThreePhotoUrl = memberThreePhotoUrl;
    }

    public String getMemberThreeDescription() {
        return memberThreeDescription;
    }

    public void setMemberThreeDescription(String memberThreeDescription) {
        this.memberThreeDescription = memberThreeDescription;
    }

    public String getMemberFourName() {
        return memberFourName;
    }

    public void setMemberFourName(String memberFourName) {
        this.memberFourName = memberFourName;
    }

    public String getMemberFourPhotoUrl() {
        return memberFourPhotoUrl;
    }

    public void setMemberFourPhotoUrl(String memberFourPhotoUrl) {
        this.memberFourPhotoUrl = memberFourPhotoUrl;
    }

    public String getMemberFourDescription() {
        return memberFourDescription;
    }

    public void setMemberFourDescription(String memberFourDescription) {
        this.memberFourDescription = memberFourDescription;
    }
}
