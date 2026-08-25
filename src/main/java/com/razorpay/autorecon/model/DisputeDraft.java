package com.razorpay.autorecon.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class DisputeDraft {
    private String disputeId;
    private String subject;
    private String recipientEmail; // e.g. settlements-support@razorpay.com
    private String merchantId; // e.g. mid_RazorpayEnterpriseDemo
    private LocalDate disputeDate;
    private BigDecimal totalDisputedAmount;
    private int affectedTransactionsCount;
    private String emailBody;
    private List<String> attachedTransactionIds;

    public DisputeDraft() {}

    public DisputeDraft(String disputeId, String subject, String recipientEmail, String merchantId, LocalDate disputeDate, BigDecimal totalDisputedAmount, int affectedTransactionsCount, String emailBody, List<String> attachedTransactionIds) {
        this.disputeId = disputeId;
        this.subject = subject;
        this.recipientEmail = recipientEmail;
        this.merchantId = merchantId;
        this.disputeDate = disputeDate;
        this.totalDisputedAmount = totalDisputedAmount;
        this.affectedTransactionsCount = affectedTransactionsCount;
        this.emailBody = emailBody;
        this.attachedTransactionIds = attachedTransactionIds;
    }

    public String getDisputeId() { return disputeId; }
    public void setDisputeId(String disputeId) { this.disputeId = disputeId; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public String getMerchantId() { return merchantId; }
    public void setMerchantId(String merchantId) { this.merchantId = merchantId; }

    public LocalDate getDisputeDate() { return disputeDate; }
    public void setDisputeDate(LocalDate disputeDate) { this.disputeDate = disputeDate; }

    public BigDecimal getTotalDisputedAmount() { return totalDisputedAmount; }
    public void setTotalDisputedAmount(BigDecimal totalDisputedAmount) { this.totalDisputedAmount = totalDisputedAmount; }

    public int getAffectedTransactionsCount() { return affectedTransactionsCount; }
    public void setAffectedTransactionsCount(int affectedTransactionsCount) { this.affectedTransactionsCount = affectedTransactionsCount; }

    public String getEmailBody() { return emailBody; }
    public void setEmailBody(String emailBody) { this.emailBody = emailBody; }

    public List<String> getAttachedTransactionIds() { return attachedTransactionIds; }
    public void setAttachedTransactionIds(List<String> attachedTransactionIds) { this.attachedTransactionIds = attachedTransactionIds; }
}
