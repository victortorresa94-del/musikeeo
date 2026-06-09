import React, { createContext, useContext, useEffect, useState } from "react";
import { type User as FirebaseUser, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { User } from "../types";

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: User | null;
    loading: boolean;
    profileLoading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    loginWithDev: () => void;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    profileLoading: false,
    loginWithGoogle: async () => { },
    logout: async () => { },
    loginWithDev: () => { },
    refreshProfile: async () => { }
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    const fetchUserProfile = async (uid: string, authUserFallback?: FirebaseUser) => {
        // DEV BYPASS
        if (uid === 'dev-user-id') {
            setUserProfile({
                uid,
                displayName: 'Usuario Dev',
                email: 'dev@musikeeo.local',
                createdAt: new Date().toISOString(),
                onboardingCompleted: true,
                primaryMode: 'musician',
                activeModes: { musician: true, organizer: false, provider: false }
            } as User);
            return;
        }

        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const profile = userSnap.data() as User;
                setUserProfile(profile);
                writeCachedProfile(profile);
            } else {
                setUserProfile(null);
            }
        } catch (error: any) {
            console.error("Error fetching user profile:", error);

            // Offline fallback: use cached profile if we have it, else null (forces re-auth when back online)
            if (error?.message?.includes("offline") || error?.code === 'unavailable') {
                const cached = readCachedProfile(uid);
                if (cached) {
                    setUserProfile(cached);
                    return;
                }
                // No cache + offline: minimal placeholder that does NOT assume onboarding complete.
                // RequireAuthCompleted will redirect to /onboarding, where Onboarding shows offline error.
                const fallbackProfile: User = {
                    uid,
                    displayName: authUserFallback?.displayName || 'Usuario',
                    email: authUserFallback?.email || '',
                    photoURL: authUserFallback?.photoURL || undefined,
                    createdAt: new Date().toISOString(),
                    onboardingCompleted: false,
                    primaryMode: 'musician',
                    activeModes: { musician: false, organizer: false, provider: false }
                };
                setUserProfile(fallbackProfile);
                return;
            }

            setUserProfile(null);
        }
    };

    const PROFILE_CACHE_KEY = (uid: string) => `musikeeo-profile-${uid}`;

    const writeCachedProfile = (profile: User) => {
        try {
            localStorage.setItem(PROFILE_CACHE_KEY(profile.uid), JSON.stringify(profile));
        } catch { /* quota or disabled — ignore */ }
    };

    const readCachedProfile = (uid: string): User | null => {
        try {
            const raw = localStorage.getItem(PROFILE_CACHE_KEY(uid));
            return raw ? JSON.parse(raw) as User : null;
        } catch { return null; }
    };

    const clearCachedProfile = (uid: string) => {
        try { localStorage.removeItem(PROFILE_CACHE_KEY(uid)); } catch { /* ignore */ }
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
        const uidToClear = user?.uid;
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);

            // Cleanup user-scoped storage to avoid leaking state on shared devices
            try {
                sessionStorage.removeItem('rodrigo_chat_messages');
                sessionStorage.removeItem('rodrigo_chat_state');
                if (uidToClear) clearCachedProfile(uidToClear);
            } catch { /* storage disabled — ignore */ }
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
                setLoading(false); // Auth state known — unblock navigation immediately
                if (authUser) {
                    setProfileLoading(true);
                    await fetchUserProfile(authUser.uid, authUser);
                    setProfileLoading(false);
                } else {
                    setUserProfile(null);
                }
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
        profileLoading,
        loginWithGoogle,
        logout,
        loginWithDev,
        refreshProfile
    }), [user, userProfile, loading, profileLoading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
