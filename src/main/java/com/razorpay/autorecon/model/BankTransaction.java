package com.razorpay.autorecon.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_transactions")
public class BankTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String bankUtr; // e.g. UTR_HDFC_99281726

    private String batchId = "batch_demo";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal creditedAmount;

    private String senderDescription; // e.g. "RAZORPAY SOFTWARE PVT LTD / NODAL"
    private LocalDateTime creditTimestamp;
    private String accountNumberLast4;
    private String bankName; // e.g. HDFC, ICICI, SBI

    @Enumerated(EnumType.STRING)
    private MatchStatus matchStatus = MatchStatus.UNMATCHED;

    public enum MatchStatus {
        UNMATCHED,
        MATCHED,
        AMOUNT_MISMATCH
    }

    public BankTransaction() {}

    public BankTransaction(String bankUtr, BigDecimal creditedAmount, String senderDescription, LocalDateTime creditTimestamp, String accountNumberLast4, String bankName) {
        this.bankUtr = bankUtr;
        this.creditedAmount = creditedAmount;
        this.senderDescription = senderDescription;
        this.creditTimestamp = creditTimestamp;
        this.accountNumberLast4 = accountNumberLast4;
        this.bankName = bankName;
        this.matchStatus = MatchStatus.UNMATCHED;
        this.batchId = "batch_demo";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBankUtr() { return bankUtr; }
    public void setBankUtr(String bankUtr) { this.bankUtr = bankUtr; }

    public String getBatchId() { return batchId; }
    public void setBatchId(String batchId) { this.batchId = batchId; }

    public BigDecimal getCreditedAmount() { return creditedAmount; }
    public void setCreditedAmount(BigDecimal creditedAmount) { this.creditedAmount = creditedAmount; }

    public String getSenderDescription() { return senderDescription; }
    public void setSenderDescription(String senderDescription) { this.senderDescription = senderDescription; }

    public LocalDateTime getCreditTimestamp() { return creditTimestamp; }
    public void setCreditTimestamp(LocalDateTime creditTimestamp) { this.creditTimestamp = creditTimestamp; }

    public String getAccountNumberLast4() { return accountNumberLast4; }
    public void setAccountNumberLast4(String accountNumberLast4) { this.accountNumberLast4 = accountNumberLast4; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public MatchStatus getMatchStatus() { return matchStatus; }
    public void setMatchStatus(MatchStatus matchStatus) { this.matchStatus = matchStatus; }
}
