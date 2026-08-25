package com.razorpay.autorecon.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_records")
public class OrderRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String orderId;

    private String batchId = "batch_demo";

    private String customerEmail;
    private String customerName;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    private String currency = "INR";
    private String status; // CREATED, PAID, REFUNDED, FAILED
    private LocalDateTime orderCreatedAt;
    private String paymentId; // Linked Razorpay payment ID

    @Enumerated(EnumType.STRING)
    private ReconStatus reconStatus = ReconStatus.UNRECONCILED;

    public enum ReconStatus {
        UNRECONCILED,
        RECONCILED,
        FEE_MISMATCH,
        DELAYED_SETTLEMENT,
        MISSING_PAYMENT,
        MISSING_BANK_CREDIT,
        UNSETTLED_REFUND
    }

    public OrderRecord() {}

    public OrderRecord(String orderId, String customerName, String customerEmail, BigDecimal amount, String status, LocalDateTime orderCreatedAt, String paymentId) {
        this.orderId = orderId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.amount = amount;
        this.status = status;
        this.orderCreatedAt = orderCreatedAt;
        this.paymentId = paymentId;
        this.reconStatus = ReconStatus.UNRECONCILED;
        this.batchId = "batch_demo";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getOrderCreatedAt() { return orderCreatedAt; }
    public void setOrderCreatedAt(LocalDateTime orderCreatedAt) { this.orderCreatedAt = orderCreatedAt; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public ReconStatus getReconStatus() { return reconStatus; }
    public void setReconStatus(ReconStatus reconStatus) { this.reconStatus = reconStatus; }
}
