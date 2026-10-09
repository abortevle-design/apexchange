import { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import defaultTransactions from '../data/transactions.json';

export async function getStoredDemoState(userId) {
  if (!userId) return { balance: 0, transactions: [], transfers: [] };
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      return { balance: 0, transactions: [], transfers: [] };
    }
    const userData = userSnap.data();

    const q = query(collection(db, 'transactions'), where('userId', '==', userId));
    const txSnap = await getDocs(q);
    const transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort transactions newest first
    transactions.sort((a, b) => {
      const timeA = new Date(a.createdAt || `${a.date}T${a.time}`).getTime();
      const timeB = new Date(b.createdAt || `${b.date}T${b.time}`).getTime();
      return timeB - timeA;
    });

    return {
      balance: userData.checkingBalance || 0,
      transactions,
      transfers: []
    };
  } catch (error) {
    console.error('Error fetching stored demo state:', error);
    return { balance: 0, transactions: [], transfers: [] };
  }
}

export async function persistDemoState(userId, balance) {
  if (!userId) return;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      checkingBalance: Number(balance),
      availableBalance: Number(balance)
    });
  } catch (error) {
    console.error('Error persisting demo state:', error);
  }
}

export async function resetDemoStorage(userId) {
  if (!userId) return { balance: 0, transactions: [], transfers: [] };
  try {
    const batch = writeBatch(db);

    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      checkingBalance: 2800000.00,
      availableBalance: 2800000.00,
      savingsBalance: 1466990.00
    });

    const q = query(collection(db, 'transactions'), where('userId', '==', userId));
    const txSnap = await getDocs(q);
    txSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    defaultTransactions.forEach((tx) => {
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        ...tx,
        userId,
        createdAt: new Date(`${tx.date}T${tx.time}`).toISOString()
      });
    });

    await batch.commit();

    return {
      balance: 2800000.00,
      transactions: defaultTransactions.map(tx => ({
        ...tx,
        userId,
        createdAt: new Date(`${tx.date}T${tx.time}`).toISOString()
      })),
      transfers: []
    };
  } catch (error) {
    console.error('Error resetting demo storage:', error);
    return { balance: 0, transactions: [], transfers: [] };
  }
}

export function calculateTransferFee(amount) {
  return Math.max(0.5, Number(amount || 0) * 0.01);
}

export function calculateTotalAmount(amount) {
  return Number((Number(amount || 0) + calculateTransferFee(amount)).toFixed(2));
}

export function generateReferenceNumber() {
  return `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function createTransferTransaction({ recipient, accountNumber, routingNumber, amount, bank, referenceNumber, balanceAfter, date, time, fee, totalAmount, currency = 'USD' }) {
  return {
    id: `tx-${Date.now()}`,
    date,
    time,
    description: `Transfer to ${recipient}`,
    category: 'Bank Transfer',
    amount: -Number(amount),
    currency,
    status: 'Completed',
    referenceNumber,
    merchant: 'Bank Transfer',
    sender: 'Sandra Bullock',
    receiver: recipient,
    beneficiaryName: recipient,
    beneficiaryAccount: accountNumber || routingNumber || '',
    accountNumber: accountNumber || '',
    routingNumber: routingNumber || '',
    bank,
    type: 'debit',
    balanceAfter,
    fee,
    totalAmount,
  };
}
