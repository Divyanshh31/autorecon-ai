package com.razorpay.autorecon.repository;

import com.razorpay.autorecon.model.RazorpaySettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RazorpaySettlementRepository extends JpaRepository<RazorpaySettlement, Long> {
    Optional<RazorpaySettlement> findByPaymentId(String paymentId);
    Optional<RazorpaySettlement> findByOrderId(String orderId);
    List<RazorpaySettlement> findBySettlementId(String settlementId);
    List<RazorpaySettlement> findByBatchId(String batchId);
}
