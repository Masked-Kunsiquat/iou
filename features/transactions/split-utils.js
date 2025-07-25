// features/transactions/split-utils.js

/**
 * @file Contains utility functions for splitting expenses.
 */

import {
    TRANSACTION_TYPES
} from '../../core/constants.js';

/**
 * Calculates the share for each participant in a split expense, handling remainders.
 * @param {number} totalAmount - The total amount of the expense in cents.
 * @param {Array<string>} participantIds - An array of person IDs, including 'ME'.
 * @param {string} splitType - The type of split ('equal').
 * @returns {Array<{personId: string, amount: number}>} An array of objects with personId and their share.
 */
export function calculateShares(totalAmount, participantIds, splitType = 'equal') {
    if (splitType === 'equal') {
        const numParticipants = participantIds.length;
        if (numParticipants === 0) return [];

        // Calculate the base share and the remainder
        const baseShare = Math.floor(totalAmount / numParticipants);
        const remainder = totalAmount % numParticipants;

        // Distribute the remainder cents one by one to the first participants
        const shares = participantIds.map((id, index) => ({
            personId: id,
            amount: baseShare + (index < remainder ? 1 : 0)
        }));

        return shares;
    }
    // Future split types can be added here
    return [];
}


/**
 * Generates IOU and UOM transactions from a SPLIT transaction.
 * @param {object} splitTransaction - The main SPLIT transaction object.
 * @returns {Array<object>} An array of IOU and UOM transactions to be created.
 */
export function generateIOUs(splitTransaction) {
    const {
        totalAmount,
        payerId,
        participants,
        description,
        date,
        dueDate,
        groupTag,
        id: splitId
    } = splitTransaction;
    const shares = calculateShares(totalAmount, participants);
    const transactions = [];

    if (payerId === 'ME') {
        // If I paid, create UOMs for everyone else
        shares.forEach(share => {
            if (share.personId !== 'ME') {
                transactions.push({
                    id: self.crypto.randomUUID(),
                    personId: share.personId,
                    type: TRANSACTION_TYPES.UOM,
                    amount: share.amount,
                    description: `Split: ${description}`,
                    date,
                    dueDate,
                    splitId,
                    groupTag,
                    payments: [],
                    status: 'pending'
                });
            }
        });
    } else {
        // If someone else paid, create an IOU for my share
        const myShare = shares.find(s => s.personId === 'ME');
        if (myShare) {
            transactions.push({
                id: self.crypto.randomUUID(),
                personId: payerId,
                type: TRANSACTION_TYPES.IOU,
                amount: myShare.amount,
                description: `Split: ${description}`,
                date,
                dueDate,
                splitId,
                groupTag,
                payments: [],
                status: 'pending'
            });
        }
    }

    return transactions;
}