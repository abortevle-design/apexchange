// import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
// import {
//   doc,
//   collection,
//   query,
//   where,
//   onSnapshot,
//   setDoc,
//   runTransaction
// } from 'firebase/firestore';
// import { db } from '../firebase/firebase';
// import { useAuth } from '../hooks/useAuth';
// import defaultTransactions from '../data/transactions.json';

// const BankingContext = createContext(null);
// const CACHE_KEY = 'apex_transactions_cache';

// export function BankingProvider({ children }) {
//   const { user } = useAuth();
//   const [transactions, setTransactions] = useState(() => {
//     try {
//       const cached = localStorage.getItem(CACHE_KEY);
//       if (cached) {
//         const parsed = JSON.parse(cached);
//         if (Array.isArray(parsed) && parsed.length > 0) {
//           return parsed;
//         }
//       }
//     } catch {
//       // ignore cache parsing error
//     }
//     return defaultTransactions;
//   });

//   // Fetch transactions in real-time from Firestore
//   useEffect(() => {
//     if (!user?.uid) {
//       setTransactions((prev) => (prev.length > 0 ? prev : defaultTransactions));
//       return;
//     }

//     const isDefault =
//       user.accountNumber === (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130') ||
//       user.email?.toLowerCase() === (import.meta.env.VITE_ADMIN_EMAIL || 'sandrabullock@mail.com').toLowerCase();

//     const q = query(
//       collection(db, 'transactions'),
//       where('userId', '==', user.uid)
//     );

//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const firestoreList = snapshot.docs.map((docSnap) => ({
//           id: docSnap.id,
//           ...docSnap.data()
//         }));

//         let finalList;
//         if (isDefault) {
//           // Merge user's Firestore transactions with default transactions
//           const firestoreIds = new Set(firestoreList.map((t) => t.id));
//           const firestoreRefs = new Set(
//             firestoreList.map((t) => t.referenceNumber || t.reference).filter(Boolean)
//           );

//           const filteredDefaults = defaultTransactions.filter(
//             (dt) => !firestoreIds.has(dt.id) && !firestoreRefs.has(dt.referenceNumber)
//           );

//           finalList = [...firestoreList, ...filteredDefaults];
//         } else {
//           finalList = firestoreList;
//         }

//         // Sort newest first safely
//         finalList.sort((a, b) => {
//           const timeA = new Date(a.createdAt || `${a.date}T${a.time}`).getTime();
//           const timeB = new Date(b.createdAt || `${b.date}T${b.time}`).getTime();
//           return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
//         });

//         setTransactions(finalList);

//         try {
//           localStorage.setItem(CACHE_KEY, JSON.stringify(finalList));
//         } catch {
//           // LocalStorage quota safety
//         }
//       },
//       (error) => {
//         console.error('Transactions onSnapshot error:', error);
//         // Retain existing transactions instead of wiping out on error
//       }
//     );

//     return () => unsubscribe();
//   }, [user?.uid, user?.accountNumber, user?.email]);

//   const balance = useMemo(() => {
//     return user?.checkingBalance ?? 0;
//   }, [user]);

//   const submitTransfer = useCallback(
//     async ({ recipient, iban, bank, amount, reference, description, transferPin, currency = 'USD' }) => {
//       if (!user) throw new Error('User not authenticated.');

//       const normalizedAmount = Number(amount);
//       const fee = Number((normalizedAmount * 0.01).toFixed(2));
//       const totalAmount = Number((normalizedAmount + fee).toFixed(2));

//       const date = new Date().toISOString().slice(0, 10);
//       const time = new Date().toTimeString().slice(0, 5);
//       const referenceNumber = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;

//       const userRef = doc(db, 'users', user.uid);
//       const txRef = doc(collection(db, 'transactions'));

//       let nextCheckingBalance;

//       await runTransaction(db, async (transaction) => {
//         const userDoc = await transaction.get(userRef);
//         if (!userDoc.exists()) {
//           throw new Error('User data not found.');
//         }

//         const userData = userDoc.data();

//         // 1. Verify Transfer PIN
//         if (String(transferPin) !== String(userData.transferPin)) {
//           throw new Error('Incorrect Transfer PIN.');
//         }

//         // Verify balance
//         const currentAvailable = Number(userData.availableBalance ?? 0);
//         const currentChecking = Number(userData.checkingBalance ?? 0);

//         if (totalAmount > currentAvailable) {
//           throw new Error('Insufficient funds.');
//         }

//         const nextAvailable = Number((currentAvailable - totalAmount).toFixed(2));
//         const nextChecking = Number((currentChecking - totalAmount).toFixed(2));
//         nextCheckingBalance = nextChecking;

//         // Deduct the pending transfer amount immediately
//         transaction.update(userRef, {
//           availableBalance: nextAvailable,
//           checkingBalance: nextChecking
//         });

//         // Create transaction document with Pending status
//         const txData = {
//           id: txRef.id,
//           transactionId: txRef.id,
//           userId: user.uid,
//           senderName: `${userData.firstName} ${userData.lastName}`,
//           senderAccount: userData.accountNumber,
//           beneficiaryName: recipient,
//           beneficiaryBank: bank || 'Apex exchange bank',
//           beneficiaryAccount: iban,
//           amount: normalizedAmount,
//           currency,
//           status: 'Pending',
//           reference: reference || referenceNumber,
//           referenceNumber: reference || referenceNumber,
//           description: description?.trim() || `Transfer to ${recipient}`,
//           transferFee: fee,
//           fee,
//           totalAmount,
//           type: 'Transfer',
//           date,
//           time,
//           createdAt: new Date().toISOString(),
//           category: 'Bank Transfer',
//           merchant: bank || 'Apex exchange bank',
//           sender: `${userData.firstName} ${userData.lastName} (Checking Account)`,
//           receiver: recipient,
//           balanceAfter: nextChecking
//         };
//         transaction.set(txRef, txData);

//         // Optimistically update transactions so it stays immediately and permanently
//         setTransactions((prev) => {
//           const updated = [txData, ...prev.filter((t) => t.id !== txData.id)];
//           try {
//             localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
//           } catch {}
//           return updated;
//         });
//       });

//       // 3. Create a notification in Firestore
//       const notifRef = doc(collection(db, `users/${user.uid}/notifications`));
//       await setDoc(notifRef, {
//         id: `notif-${Date.now()}`,
//         type: 'transfer',
//         title: 'Transfer Submitted',
//         body: `Your transfer of ${currency === 'USD' ? '$' : currency}${normalizedAmount.toLocaleString()} to ${recipient} has been submitted and is currently pending.`,
//         date: new Date().toISOString(),
//         read: false,
//         createdAt: new Date().toISOString()
//       });

//       // The email notification is now handled automatically by Firebase Cloud Functions.

//       return {
//         success: true,
//         referenceNumber,
//         nextBalance: nextCheckingBalance,
//         amount: normalizedAmount,
//         transactionId: txRef.id,
//         date,
//         time,
//         fee,
//         totalAmount
//       };
//     },
//     [user]
//   );

//   const value = useMemo(
//     () => ({
//       balance,
//       transactions,
//       transfers: [], // kept for backwards compatibility
//       submitTransfer,
//       resetDemoData: () => {} // Deprecated since we use live Firestore db now
//     }),
//     [balance, transactions, submitTransfer]
//   );

//   return <BankingContext.Provider value={value}>{children}</BankingContext.Provider>;
// }

// export function useBanking() {
//   const context = useContext(BankingContext);
//   if (!context) {
//     throw new Error('useBanking must be used within a BankingProvider');
//   }
//   return context;
// }


import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { 
  doc,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../hooks/useAuth';
import defaultTransactions from '../data/transactions.json';

const BankingContext = createContext(null);
const CACHE_KEY = 'apex_transactions_cache';

export function BankingProvider({ children }) {
  const { user } = useAuth();

  const [transactions, setTransactions] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);

      if (cached) {
        const parsed = JSON.parse(cached);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore cache parsing errors
    }

    return defaultTransactions;
  });

  // ============================================
  // LIVE USER BALANCE FROM FIRESTORE
  // ============================================

  const [accountBalance, setAccountBalance] = useState({
    checkingBalance: 0,
    availableBalance: 0
  });

  useEffect(() => {
    if (!user?.uid) {
      setAccountBalance({
        checkingBalance: 0,
        availableBalance: 0
      });
      return;
    }

    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.error('User document not found in Firestore.');
          return;
        }

        const data = snapshot.data();

        setAccountBalance({
          checkingBalance: Number(data.checkingBalance ?? 0),
          availableBalance: Number(data.availableBalance ?? 0)
        });
      },
      (error) => {
        console.error('User balance onSnapshot error:', error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);


  // ============================================
  // FETCH TRANSACTIONS IN REAL-TIME
  // ============================================

  useEffect(() => {
    if (!user?.uid) {
      setTransactions((prev) =>
        prev.length > 0 ? prev : defaultTransactions
      );

      return;
    }

    const isDefault =
      user.accountNumber ===
        (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130') ||
      user.email?.toLowerCase() ===
        (import.meta.env.VITE_ADMIN_EMAIL || 'sandrabullock@mail.com').toLowerCase();

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        let finalList;

        if (isDefault) {
          const firestoreIds = new Set(
            firestoreList.map((t) => t.id)
          );

          const firestoreRefs = new Set(
            firestoreList
              .map((t) => t.referenceNumber || t.reference)
              .filter(Boolean)
          );

          const filteredDefaults = defaultTransactions.filter(
            (dt) =>
              !firestoreIds.has(dt.id) &&
              !firestoreRefs.has(dt.referenceNumber)
          );

          finalList = [
            ...firestoreList,
            ...filteredDefaults
          ];
        } else {
          finalList = firestoreList;
        }

        finalList.sort((a, b) => {
          const timeA = new Date(
            a.createdAt || `${a.date}T${a.time}`
          ).getTime();

          const timeB = new Date(
            b.createdAt || `${b.date}T${b.time}`
          ).getTime();

          return (
            (isNaN(timeB) ? 0 : timeB) -
            (isNaN(timeA) ? 0 : timeA)
          );
        });

        setTransactions(finalList);

        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify(finalList)
          );
        } catch {
          // Ignore localStorage errors
        }
      },
      (error) => {
        console.error(
          'Transactions onSnapshot error:',
          error
        );
      }
    );

    return () => unsubscribe();
  }, [
    user?.uid,
    user?.accountNumber,
    user?.email
  ]);


  // ============================================
  // BALANCE USED THROUGHOUT THE APP
  // ============================================

  const balance = useMemo(() => {
    return accountBalance.checkingBalance;
  }, [accountBalance.checkingBalance]);


  // ============================================
  // SUBMIT TRANSFER
  // ============================================

  const submitTransfer = useCallback(
    async ({
      recipient,
      routingNumber,
      iban,
      bank,
      amount,
      reference,
      description,
      transferPin,
      currency = 'USD'
    }) => {
      if (!user) {
        throw new Error('User not authenticated.');
      }

      const normalizedAmount = Number(amount);

      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        throw new Error('Please enter a valid transfer amount.');
      }

      const fee = Number(
        (normalizedAmount * 0.01).toFixed(2)
      );

      const totalAmount = Number(
        (normalizedAmount + fee).toFixed(2)
      );

      const date = new Date()
        .toISOString()
        .slice(0, 10);

      const time = new Date()
        .toTimeString()
        .slice(0, 5);

      const referenceNumber =
        `TRX-${Math.floor(100000 + Math.random() * 900000)}`;

      const userRef = doc(
        db,
        'users',
        user.uid
      );

      const txRef = doc(
        collection(db, 'transactions')
      );

      let nextCheckingBalance;

      await runTransaction(
        db,
        async (transaction) => {
          const userDoc =
            await transaction.get(userRef);

          if (!userDoc.exists()) {
            throw new Error(
              'User data not found.'
            );
          }

          const userData = userDoc.data();

          // =====================================
          // VERIFY TRANSFER PIN
          // =====================================

          if (
            String(transferPin) !==
            String(userData.transferPin)
          ) {
            throw new Error(
              'Incorrect Transfer PIN.'
            );
          }

          // =====================================
          // GET CURRENT FIRESTORE BALANCE
          // =====================================

          const currentAvailable =
            Number(
              userData.availableBalance ?? 0
            );

          const currentChecking =
            Number(
              userData.checkingBalance ?? 0
            );

          // =====================================
          // CHECK AVAILABLE BALANCE
          // =====================================

          if (totalAmount > currentAvailable) {
            throw new Error(
              'Insufficient funds.'
            );
          }

          // =====================================
          // CALCULATE NEW BALANCE
          // =====================================

          const nextAvailable =
            Number(
              (
                currentAvailable -
                totalAmount
              ).toFixed(2)
            );

          const nextChecking =
            Number(
              (
                currentChecking -
                totalAmount
              ).toFixed(2)
            );

          nextCheckingBalance =
            nextChecking;

          // =====================================
          // SAVE NEW BALANCE TO FIRESTORE
          // =====================================

          transaction.update(userRef, {
            availableBalance: nextAvailable,
            checkingBalance: nextChecking
          });

          // =====================================
          // CREATE PENDING TRANSACTION
          // =====================================

          const txData = {
            id: txRef.id,
            transactionId: txRef.id,

            userId: user.uid,

            senderName:
              `${userData.firstName} ${userData.lastName}`,

            senderAccount:
              userData.accountNumber,

            beneficiaryName:
              recipient,

            beneficiaryBank:
              bank || 'Apex exchange bank',

            beneficiaryAccount:
              routingNumber || iban,

            routingNumber:
              routingNumber || iban,

            amount:
              normalizedAmount,

            currency,

            status: 'Pending',

            reference:
              reference || referenceNumber,

            referenceNumber:
              reference || referenceNumber,

            description:
              description?.trim() ||
              `Transfer to ${recipient}`,

            transferFee: fee,

            fee,

            totalAmount,

            type: 'Transfer',

            date,

            time,

            createdAt:
              new Date().toISOString(),

            category:
              'Bank Transfer',

            merchant:
              bank || 'Apex exchange bank',

            sender:
              `${userData.firstName} ${userData.lastName} (Checking Account)`,

            receiver:
              recipient,

            balanceAfter:
              nextChecking
          };

          transaction.set(
            txRef,
            txData
          );

          // Update local transaction display immediately
          setTransactions((prev) => {
            const updated = [
              txData,
              ...prev.filter(
                (t) => t.id !== txData.id
              )
            ];

            try {
              localStorage.setItem(
                CACHE_KEY,
                JSON.stringify(updated)
              );
            } catch {
              // Ignore cache errors
            }

            return updated;
          });
        }
      );

      // ============================================
      // CREATE NOTIFICATION
      // ============================================

      const notifRef = doc(
        collection(
          db,
          `users/${user.uid}/notifications`
        )
      );

      await setDoc(notifRef, {
        id: `notif-${Date.now()}`,
        type: 'transfer',
        title: 'Transfer Submitted',

        body:
          `Your transfer of ${
            currency === 'USD'
              ? '$'
              : currency
          }${normalizedAmount.toLocaleString()} to ${
            recipient
          } has been submitted and is currently pending.`,

        date:
          new Date().toISOString(),

        read: false,

        createdAt:
          new Date().toISOString()
      });

      return {
        success: true,
        referenceNumber,
        nextBalance:
          nextCheckingBalance,
        amount:
          normalizedAmount,
        transactionId:
          txRef.id,
        date,
        time,
        fee,
        totalAmount
      };
    },
    [user]
  );


  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = useMemo(
    () => ({
      balance,
      availableBalance:
        accountBalance.availableBalance,

      checkingBalance:
        accountBalance.checkingBalance,

      transactions,

      transfers: [],

      submitTransfer,

      resetDemoData: () => {}
    }),
    [
      balance,
      accountBalance,
      transactions,
      submitTransfer
    ]
  );


  return (
    <BankingContext.Provider value={value}>
      {children}
    </BankingContext.Provider>
  );
}


export function useBanking() {
  const context =
    useContext(BankingContext);

  if (!context) {
    throw new Error(
      'useBanking must be used within a BankingProvider'
    );
  }

  return context;
}