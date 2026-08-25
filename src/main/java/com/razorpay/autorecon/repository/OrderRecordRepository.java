package com.razorpay.autorecon.repository;

import com.razorpay.autorecon.model.OrderRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRecordRepository extends JpaRepository<OrderRecord, Long> {
    Optional<OrderRecord> findByOrderId(String orderId);
    Optional<OrderRecord> findByPaymentId(String paymentId);
    List<OrderRecord> findByReconStatus(OrderRecord.ReconStatus reconStatus);
    List<OrderRecord> findByBatchId(String batchId);
    Optional<OrderRecord> findByBatchIdAndOrderId(String batchId, String orderId);
}
