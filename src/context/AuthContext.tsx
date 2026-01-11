import React, { createContext, useContext, useEffect, useState } from "react";
import { type User, onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    mockLogin: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, mockLogin: () => { } });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const mockLogin = () => {
        const mockUser = {
            uid: 'mock-user-123',
            displayName: 'Músico Dev',
            email: 'musician@dev.com',
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => { },
            getIdToken: async () => 'mock-token',
            getIdTokenResult: async () => ({
                token: 'mock-token',
                claims: { role: 'musician' }, // Mock custom claim
                authTime: Date.now().toString(),
                issuedAtTime: Date.now().toString(),
                expirationTime: (Date.now() + 3600000).toString(),
                signInProvider: 'custom',
                signInSecondFactor: null,
            }),
            reload: async () => { },
            toJSON: () => ({}),
            phoneNumber: null,
            photoURL: null,
        } as unknown as User;

        setUser(mockUser);
    };

    useEffect(() => {
        // Safety check: specific to the modular SDK, we can check if the auth object has a 'currentUser' property 
        // or simply wrapping the subscription in a try-catch isn't enough because onAuthStateChanged validation happens synchronously.

        let unsubscribe: () => void = () => { };

        try {
            // If auth is strictly empty object (due to our fallback), onAuthStateChanged might throw.
            // We'll attempt to standard check.
            unsubscribe = onAuthStateChanged(auth, (authUser) => {
                setUser(authUser);
                setLoading(false);
            });
        } catch (error) {
            console.error("AuthContext: Failed to subscribe to auth state changes.", error);
            // If subscription fails (e.g. bad config), we assume no user and stop loading to show UI.
            setLoading(false);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, mockLogin }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
