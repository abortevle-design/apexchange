import { createContext, useEffect, useMemo, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  writeBatch,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { uploadImageToCloudinary } from '../utils/cloudinary';
import defaultTransactions from '../data/transactions.json';
import defaultNotifications from '../data/notifications.json';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if we need to auto-seed the default user when they log in
  const seedDefaultUser = async (uid, email) => {
    const expectedAccountNumber = import.meta.env.VITE_ACCOUNT_NUMBER || '5320130';
    const batch = writeBatch(db);

    // Seeding user document
    const userRef = doc(db, 'users', uid);
    batch.set(userRef, {
      uid,
      firstName: 'Sandra',
      lastName: 'Bullock',
      email: email,
      phone: '+1 512-555-0147',
      phoneNumber: '+1 512-555-0147',
      country: 'United States',
      address: '1847 Cedar Ridge Way, Austin, TX 78704',
      dob: '1988-04-16',
      profilePicture: '',
      profilePictureUrl: '',
      accountNumber: expectedAccountNumber.trim(),
      customerId: '48210357',
      transferPin: import.meta.env.VITE_TRANSFER_PIN || '210846',
      availableBalance: 2800000.00,
      checkingBalance: 2800000.00,
      savingsBalance: 1900000.00,
      investmentBalance: 797320.85,
      businessBalance: 55990.10,
      creditCardBalance: 0.00,
      loanBalance: 0.00,
      rewards: 0,
      createdAt: '2017-07-01T00:00:00Z',
      preferredLanguage: 'en',
      notificationPreferences: { email: true, push: true, sms: false }
    });

    // Seeding notifications
    defaultNotifications.forEach((notif) => {
      const notifRef = doc(collection(db, `users/${uid}/notifications`));
      batch.set(notifRef, {
        id: notif.id,
        type: notif.type,
        titleKey: notif.titleKey,
        bodyKey: notif.bodyKey,
        date: notif.date,
        read: notif.read,
        createdAt: notif.date ? new Date(notif.date).toISOString() : new Date().toISOString()
      });
    });

    await batch.commit();

    // Seed transactions in batches
    try {
      const chunkSize = 100;
      for (let i = 0; i < defaultTransactions.length; i += chunkSize) {
        const txBatch = writeBatch(db);
        const chunk = defaultTransactions.slice(i, i + chunkSize);
        chunk.forEach((tx) => {
          const txRef = doc(collection(db, 'transactions'));
          txBatch.set(txRef, {
            ...tx,
            userId: uid,
            createdAt: new Date(`${tx.date}T${tx.time}`).toISOString()
          });
        });
        await txBatch.commit();
      }
    } catch (txErr) {
      console.warn('Transaction seeding warning:', txErr);
    }
  };

  const login = async (email, password) => {
    // 1. Sign in directly via Firebase Auth
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('Sign in successful');
    } catch (error) {
      console.error('Sign in failed:', error);
      throw new Error(`Authentication Error: ${error.message}`);
    }

    // 2. Seed or update default administrator user if appropriate
    // const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'Sandrabullock@mail.com';
    // if (email.trim().toLowerCase() === adminEmail.toLowerCase() || email.trim().toLowerCase() === 'sandrabullock@mail.com') {
    //   try {
    //     const uid = auth.currentUser.uid;
    //     const userRef = doc(db, 'users', uid);
    //     const userDoc = await getDoc(userRef);
    //     if (!userDoc.exists()) {
    //       await seedDefaultUser(uid, email.trim());
    //     } else {
    //       const data = userDoc.data();
    //       if (
    //         data.firstName !== 'Sandra' ||
    //         data.lastName !== 'Bullock' ||
    //         Number(data.availableBalance) !== 2800000.00 ||
    //         Number(data.checkingBalance) !== 2800000.00 ||
    //         Number(data.savingsBalance) !== 1900000.00 ||
    //         Number(data.investmentBalance) !== 797320.85 ||
    //         Number(data.businessBalance) !== 55990.10 ||
    //         data.createdAt !== '2017-07-01T00:00:00Z'
    //       ) {
    //         await updateDoc(userRef, {
    //           firstName: 'Sandra',
    //           lastName: 'Bullock',
    //           availableBalance: 2800000.00,
    //           checkingBalance: 2800000.00,
    //           savingsBalance: 1900000.00,
    //           investmentBalance: 797320.85,
    //           businessBalance: 55990.10,
    //           createdAt: '2017-07-01T00:00:00Z'
    //         });
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Administrator user seeding/updating failed:', error);
    //   }
    // }
    const adminEmail =
  import.meta.env.VITE_ADMIN_EMAIL ||
  'sandrabullock@mail.com';

if (
  email.trim().toLowerCase() === adminEmail.toLowerCase() ||
  email.trim().toLowerCase() === 'sandrabullock@mail.com'
) {
  try {
    const uid = auth.currentUser.uid;
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Only create the default account if the user document
      // does not exist yet.
      await seedDefaultUser(uid, email.trim());
    }
  } catch (error) {
    console.error(
      'Administrator user seeding failed:',
      error
    );
  }
}

    return true;
  };

  const register = async (details, profilePicFile) => {
    // 1. Validate Form / details
    if (!details.email || !details.password) {
      const err = new Error('Email and password are required for registration.');
      console.error('Validation Error:', err.message, err);
      throw err;
    }


    // 2. Create Firebase Authentication user
    let userCredential;
    try {
      console.log('Attempting to create Firebase Authentication user for:', details.email);
      userCredential = await createUserWithEmailAndPassword(auth, details.email, details.password);
      console.log('Firebase Authentication user created successfully:', userCredential.user.uid);
    } catch (error) {
      console.error('Firebase Authentication registration failed:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      throw new Error(`Authentication Error: [${error.code}] ${error.message}`);
    }

    const uid = userCredential.user.uid;

    // Generate unique random accountNumber and customerId by querying Firestore
    let accountNumber = '';
    let customerId = '';
    let isUnique = false;
    const adminAccountNumber = (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130').trim();

    while (!isUnique) {
      accountNumber = String(Math.floor(1000000 + Math.random() * 9000000));
      customerId = String(Math.floor(10000000 + Math.random() * 90000000));

      if (accountNumber === adminAccountNumber || customerId === '48210357') {
        continue;
      }

      // Check uniqueness in Firestore users collection
      const qAcc = query(collection(db, 'users'), where('accountNumber', '==', accountNumber));
      const qCust = query(collection(db, 'users'), where('customerId', '==', customerId));
      const [snapAcc, snapCust] = await Promise.all([getDocs(qAcc), getDocs(qCust)]);

      if (snapAcc.empty && snapCust.empty) {
        isUnique = true;
      }
    }

    // 3. Upload profile picture to Cloudinary
    let profilePictureUrl = '';
    if (profilePicFile) {
      try {
        console.log('Attempting to upload profile picture to Cloudinary...');
        profilePictureUrl = await uploadImageToCloudinary(profilePicFile);
        console.log('Cloudinary upload succeeded:', profilePictureUrl);
      } catch (error) {
        console.error('Cloudinary profile picture upload failed:', {
          code: error.code || 'UNKNOWN_CLOUDINARY_ERROR',
          message: error.message,
          fullError: error
        });
        throw new Error(`Profile Picture Upload Error: ${error.message}`);
      }
    }

    // 4. Save user document to Firestore
    const userRef = doc(db, 'users', uid);
    const userData = {
      uid,
      firstName: details.firstName || '',
      lastName: details.lastName || '',
      email: details.email,
      phone: details.phoneNumber || '',
      phoneNumber: details.phoneNumber || '',
      country: details.country || '',
      address: details.address || '',
      dob: details.dob || '',
      profilePicture: profilePictureUrl,
      profilePictureUrl: profilePictureUrl,
      accountNumber,
      customerId,
      transferPin: '',
      availableBalance: 0.00,
      checkingBalance: 0.00,
      savingsBalance: 0.00,
      investmentBalance: 0.00,
      businessBalance: 0.00,
      creditCardBalance: 0.00,
      loanBalance: 0.00,
      rewards: 0,
      createdAt: new Date().toISOString(),
      preferredLanguage: details.preferredLanguage || 'en',
      notificationPreferences: { email: true, push: true, sms: false }
    };

    try {
      console.log('Attempting to save user document to Firestore under users/', uid);
      await setDoc(userRef, userData);
      console.log('Firestore user document saved successfully');
    } catch (error) {
      console.error('Firestore save failed for user document:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      if (error.code === 'permission-denied') {
        console.error('Explanation: This error was blocked by Firestore Security Rules. The /users/{userId} rule allows write ONLY if request.auth != null and request.auth.uid == userId. Make sure that the user is correctly authenticated via Firebase Auth before running this operation and that the document ID matches their authenticated UID.');
      }
      throw new Error(`Firestore Database Error: [${error.code}] ${error.message}`);
    }

    // 5. Create welcome notification
    try {
      console.log('Attempting to create welcome notification for:', uid);
      const notifRef = doc(collection(db, `users/${uid}/notifications`));
      await setDoc(notifRef, {
        id: `notif-${Date.now()}`,
        type: 'system',
        title: 'Welcome to Apex exchange bank!',
        body: `Your account number ${accountNumber} has been successfully created.`,
        date: new Date().toISOString(),
        read: false,
        createdAt: new Date().toISOString()
      });
      console.log('Welcome notification created successfully');
    } catch (error) {
      // Don't let notification failure crash the whole registration, but log it
      console.error('Firestore save failed for welcome notification:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
    }

    return userData;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (details) => {
    if (!auth.currentUser) return;
    const updatedDetails = { ...details };
    if ('phoneNumber' in details) {
      updatedDetails.phone = details.phoneNumber;
    }
    if ('phone' in details) {
      updatedDetails.phoneNumber = details.phone;
    }
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, updatedDetails);

    // Add profile updated notification
    const notifRef = doc(collection(db, `users/${auth.currentUser.uid}/notifications`));
    await setDoc(notifRef, {
      id: `notif-${Date.now()}`,
      type: 'system',
      title: 'Profile Updated',
      body: 'Your profile details have been updated successfully.',
      date: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  const updateProfilePicture = async (file) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const downloadUrl = await uploadImageToCloudinary(file);

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      profilePicture: downloadUrl,
      profilePictureUrl: downloadUrl
    });

    const notifRef = doc(collection(db, `users/${uid}/notifications`));
    await setDoc(notifRef, {
      id: `notif-${Date.now()}`,
      type: 'system',
      title: 'Profile Picture Updated',
      body: 'Your profile picture has been updated successfully.',
      date: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  const deleteProfilePicture = async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      profilePicture: '',
      profilePictureUrl: ''
    });

    const notifRef = doc(collection(db, `users/${uid}/notifications`));
    await setDoc(notifRef, {
      id: `notif-${Date.now()}`,
      type: 'system',
      title: 'Profile Picture Removed',
      body: 'Your profile picture was removed successfully.',
      date: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  const changePassword = async (currentPassword, newPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const credentials = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credentials);
    await updatePassword(currentUser, newPassword);

    const notifRef = doc(collection(db, `users/${currentUser.uid}/notifications`));
    await setDoc(notifRef, {
      id: `notif-${Date.now()}`,
      type: 'security',
      title: 'Password Changed',
      body: 'Your account password has been changed successfully.',
      date: new Date().toISOString(),
      read: false,
      createdAt: new Date().toISOString()
    });
  };

  const sendPasswordReset = async (email) => {
    try {
      console.log('Sending password reset email to:', email);
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Password reset failed:', {
        code: error.code,
        message: error.message,
        fullError: error
      });
      throw new Error(`Password Reset Error: [${error.code}] ${error.message}`);
    }
  };

  // Setup Firebase Auth observer and Firestore listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // If user is anonymous, do not start user profile snapshots
        if (currentUser.isAnonymous) {
          setLoading(false);
          return;
        }

        // Setup real-time listener for user profile document
        const unsubscribeProfile = onSnapshot(
          doc(db, 'users', currentUser.uid),
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'marina.wishart@apexexchangebank.com';
              if (
                (data.firstName === 'James' || data.lastName === 'Wilson') &&
                (data.email?.toLowerCase() === 'sandrabullock@mail.com' || data.accountNumber === (import.meta.env.VITE_ACCOUNT_NUMBER || '5320130'))
              ) {
                updateDoc(doc(db, 'users', currentUser.uid), {
                  firstName: 'Sandra',
                  lastName: 'Bullock'
                }).catch(err => console.error('Failed to update name to Sandra Bullock:', err));
              }
              if (data.email === adminEmail && data.createdAt !== '2017-07-01T00:00:00Z') {
                updateDoc(doc(db, 'users', currentUser.uid), {
                  createdAt: '2017-07-01T00:00:00Z'
                }).catch(err => console.error('Failed to update admin createdAt:', err));
              }
              setUser({
                uid: currentUser.uid,
                ...data
              });
              setIsAuthenticated(true);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Profile snapshot error:', error);
            setLoading(false);
          }
        );

        return () => {
          unsubscribeProfile();
        };
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      accountNumber: user?.accountNumber ?? '',
      login,
      logout,
      register,
      updateProfile,
      updateProfilePicture,
      deleteProfilePicture,
      changePassword,
      sendPasswordReset,
      loading
    }),
    [user, isAuthenticated, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
