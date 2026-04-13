package com.secureshare.repository;

import com.secureshare.entity.FileEntity;
import com.secureshare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {

    List<FileEntity> findByUserOrderByUploadDateDesc(User user);

    Optional<FileEntity> findByToken(String token);

    long countByUser(User user);

    @Query("SELECT SUM(f.currentDownloads) FROM FileEntity f WHERE f.user = :user")
    Long sumDownloadsByUser(@Param("user") User user);

    @Query("SELECT COUNT(f) FROM FileEntity f WHERE f.user = :user AND " +
           "(f.expiryTime IS NULL OR f.expiryTime > CURRENT_TIMESTAMP) AND " +
           "(f.maxDownloads IS NULL OR f.currentDownloads < f.maxDownloads)")
    long countActiveFilesByUser(@Param("user") User user);
}
