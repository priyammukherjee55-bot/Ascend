import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser, UserRole, ExperienceLevel, SportType } from '../types/models';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: AppUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (
    email: string,
    pass: string,
    fullName: string,
    role: UserRole,
    initialSport: SportType,
    city: string,
    experienceLevel: ExperienceLevel
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        // Listen to live user profile document in Firestore
        const userRef = doc(db, 'users', fbUser.uid);
        unsubscribeDoc = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.data() as AppUser);
          } else {
            // Profile may be in the middle of being created
            setUserProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("User profile listener error:", err);
          setLoading(false);
        });
      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = null;
        }
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (
    email: string,
    pass: string,
    fullName: string,
    role: UserRole,
    initialSport: SportType,
    city: string,
    experienceLevel: ExperienceLevel
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: fullName });

    const newProfile: AppUser = {
      id: cred.user.uid,
      email: cred.user.email || email,
      name: fullName,
      role,
      experienceLevel,
      location: {
        city: city || 'Unspecified',
        district: '',
        locality: '',
      },
      bio: '',
      activeSports: [initialSport],
      cricketProfile: initialSport === 'cricket' ? {
        battingStyle: 'RHB',
        battingPosition: 'Middle Order',
        bowlingStyle: 'Right-arm Medium',
        isWicketKeeper: false,
        preferredFormats: ['T20', 'ODI'],
      } : undefined,
      footballProfile: initialSport === 'football' ? {
        preferredFoot: 'Right',
        primaryPosition: 'CM',
        characteristics: ['Passer', 'Tactical'],
      } : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    setUserProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (data: Partial<AppUser>) => {
    if (!currentUser) throw new Error("No authenticated user");
    const updated = {
      ...data,
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
    setUserProfile(prev => prev ? { ...prev, ...updated } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
