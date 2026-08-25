package com.razorpay.autorecon.repository;

import com.razorpay.autorecon.model.DiscrepancyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiscrepancyItemRepository extends JpaRepository<DiscrepancyItem, Long> {
    List<DiscrepancyItem> findByResolvedFalse();
    List<DiscrepancyItem> findByResolvedFalseOrderByDetectedAtDesc();
    List<DiscrepancyItem> findByType(DiscrepancyItem.DiscrepancyType type);
    Optional<DiscrepancyItem> findByOrderId(String orderId);
    List<DiscrepancyItem> findByBatchId(String batchId);
    List<DiscrepancyItem> findByBatchIdAndResolvedFalse(String batchId);
}
