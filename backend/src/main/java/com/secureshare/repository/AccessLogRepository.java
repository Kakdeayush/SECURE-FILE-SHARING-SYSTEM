package com.secureshare.repository;

import com.secureshare.entity.AccessLog;
import com.secureshare.entity.FileEntity;
import com.secureshare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    List<AccessLog> findByFileOrderByAccessTimeDesc(FileEntity file);

    @Query("SELECT al FROM AccessLog al WHERE al.file.user = :user ORDER BY al.accessTime DESC")
    List<AccessLog> findByFileUserOrderByAccessTimeDesc(@Param("user") User user);

    @Query("SELECT al FROM AccessLog al WHERE al.file.user = :user ORDER BY al.accessTime DESC LIMIT 10")
    List<AccessLog> findTop10ByFileUserOrderByAccessTimeDesc(@Param("user") User user);

    @Query("SELECT COUNT(al) FROM AccessLog al WHERE al.file.user = :user AND al.status LIKE 'Failed%'")
    long countFailedAttemptsByUser(@Param("user") User user);

    @Query("SELECT COUNT(DISTINCT al.ipAddress) FROM AccessLog al WHERE al.file.user = :user")
    long countUniqueVisitorsByUser(@Param("user") User user);

    // For daily analytics chart: last N days
    @Query("SELECT CAST(al.accessTime AS date) as day, COUNT(al) as total " +
           "FROM AccessLog al " +
           "WHERE al.file.user = :user AND al.accessTime >= :since AND al.action = 'DOWNLOAD' " +
           "GROUP BY CAST(al.accessTime AS date) ORDER BY day ASC")
    List<Object[]> findDailyDownloadsByUser(@Param("user") User user, @Param("since") LocalDateTime since);

    @Query("SELECT CAST(al.accessTime AS date) as day, COUNT(al) as total " +
           "FROM AccessLog al " +
           "WHERE al.file.user = :user AND al.accessTime >= :since " +
           "GROUP BY CAST(al.accessTime AS date) ORDER BY day ASC")
    List<Object[]> findDailyViewsByUser(@Param("user") User user, @Param("since") LocalDateTime since);
}
