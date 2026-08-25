package com.razorpay.autorecon.repository;

import com.razorpay.autorecon.model.BankTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, Long> {
    Optional<BankTransaction> findByBankUtr(String bankUtr);
    List<BankTransaction> findByMatchStatus(BankTransaction.MatchStatus status);
    List<BankTransaction> findByBatchId(String batchId);
}
