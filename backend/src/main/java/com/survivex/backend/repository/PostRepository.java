package com.survivex.backend.repository;

import com.survivex.backend.model.PostEntity;
import com.survivex.backend.model.PostStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<PostEntity, Long> {

    @Override
    @EntityGraph(attributePaths = {"author", "likedUsers", "comments", "comments.author"})
    List<PostEntity> findAll();

    @Override
    @EntityGraph(attributePaths = {"author", "likedUsers", "comments", "comments.author"})
    Optional<PostEntity> findById(Long id);

    @EntityGraph(attributePaths = {"author", "likedUsers", "comments", "comments.author"})
    List<PostEntity> findByStatus(PostStatus status);

    @EntityGraph(attributePaths = {"author", "likedUsers", "comments", "comments.author"})
    List<PostEntity> findByAuthorId(Long authorId);
}
