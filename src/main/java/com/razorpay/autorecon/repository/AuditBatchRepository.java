package com.razorpay.autorecon.repository;

import com.razorpay.autorecon.model.AuditBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditBatchRepository extends JpaRepository<AuditBatch, Long> {
    Optional<AuditBatch> findByBatchId(String batchId);
    List<AuditBatch> findAllByOrderByUploadedAtDesc();
}
