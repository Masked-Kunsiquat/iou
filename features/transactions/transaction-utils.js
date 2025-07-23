// features/transactions/transaction-utils.js

/**
 * Calculates the remaining balance for a transaction.
 * @param {object} transaction - The transaction object.
 * @returns {number} The remaining balance in cents.
 */
export function calculateBalance(transaction) {
    const totalPaid = transaction.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    return transaction.amount - totalPaid;
}