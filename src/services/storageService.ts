
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export const storageService = {
    /**
     * Upload a file to Firebase Storage
     * @param file The file object to upload
     * @param path The path in storage (e.g. 'artists/uid/profile.jpg')
     * @returns Promise resolving to the download URL
     */
    uploadFile: async (file: File, path: string): Promise<string> => {
        try {
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    },

    /**
     * Upload an artist's profile photo
     */
    uploadArtistPhoto: async (userId: string, file: File): Promise<string> => {
        const extension = file.name.split('.').pop() || 'jpg';
        const path = `artists/${userId}/profile_${Date.now()}.${extension}`;
        return storageService.uploadFile(file, path);
    },

    /**
     * Upload an artist's cover photo
     */
    uploadArtistCover: async (userId: string, file: File): Promise<string> => {
        const extension = file.name.split('.').pop() || 'jpg';
        const path = `artists/${userId}/cover_${Date.now()}.${extension}`;
        return storageService.uploadFile(file, path);
    }
};
