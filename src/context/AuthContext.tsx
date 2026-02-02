import React, { createContext, useContext, useEffect, useState } from "react";
import { type User as FirebaseUser, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { User } from "../types";

interface AuthContextType {
    user: FirebaseUser | null;     // Firebase Auth User
    userProfile: User | null;      // Firestore User Profile (custom data)
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    loginWithDev: () => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    loginWithGoogle: async () => { },
    logout: async () => { },
    loginWithDev: () => { },
    refreshProfile: async () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async (uid: string) => {
        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUserProfile(userSnap.data() as User);
            } else {
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
        }
    };

    const loginWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;

            // Check if user exists in Firestore
            const userRef = doc(db, "users", firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Initialize new user with NO active modes and incomplete onboarding
                const newUser: User = {
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName || 'Usuario',
                    email: firebaseUser.email || '',
                    photoURL: firebaseUser.photoURL || undefined,
                    createdAt: new Date().toISOString(),
                    onboardingCompleted: false,
                    primaryMode: 'musician', // Default fallback, effectively inactive until onboarding
                    activeModes: {
                        musician: false,
                        organizer: false,
                        provider: false
                    }
                };
                await setDoc(userRef, newUser);
                setUserProfile(newUser);
            } else {
                setUserProfile(userSnap.data() as User);
            }
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user.uid);
        }
    };

    useEffect(() => {
        let unsubscribe: () => void = () => { };

        try {
            unsubscribe = onAuthStateChanged(auth, async (authUser) => {
                setUser(authUser);
                if (authUser) {
                    await fetchUserProfile(authUser.uid);
                } else {
                    setUserProfile(null);
                }
                setLoading(false);
            });
        } catch (error) {
            console.error("AuthContext: Failed to subscribe to auth state changes.", error);
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const loginWithDev = () => {
        // Dev user for testing without Firebase
        const devAuthUser = {
            uid: 'dev-user-id',
            email: 'dev@musikeeo.local',
            displayName: 'Usuario Dev',
            emailVerified: true,
            isAnonymous: false,
            photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dev',
        } as unknown as FirebaseUser;

        const devProfile: User = {
            uid: 'dev-user-id',
            displayName: 'Usuario Dev',
            email: 'dev@musikeeo.local',
            createdAt: new Date().toISOString(),
            onboardingCompleted: true,
            primaryMode: 'musician',
            activeModes: {
                musician: true,
                organizer: false,
                provider: false
            }
        };

        setUser(devAuthUser);
        setUserProfile(devProfile);
    };

    const value = React.useMemo(() => ({
        user,
        userProfile,
        loading,
        loginWithGoogle,
        logout,
        loginWithDev,
        refreshProfile
    }), [user, userProfile, loading]);

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
