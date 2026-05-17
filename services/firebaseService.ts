import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const auth = getAuth(app);

import { signInAnonymously } from 'firebase/auth';

// Authenticate anonymously so we can upload files to storage if rules require auth
signInAnonymously(auth).catch(console.error);

export interface ContentItem {
    id?: string;
    section: string; // 'paras', 'ankit', 'dinesh', 'imtiyaz'
    title: string;
    type: string; // 'video', 'image', 'audio', 'pdf', 'text', 'other'
    data: string; // url or text content
    isPublic: boolean;
    createdAt: number;
    uploader: string;
}

export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                // progressive upload could be handled here
            }, 
            (error) => {
                console.error("Storage upload error:", error);
                reject(error);
            }, 
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
};

export const uploadContent = async (content: ContentItem) => {
    try {
        const docRef = await addDoc(collection(db, 'community_content'), content);
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
}

export const toggleVisibility = async (id: string, isPublic: boolean) => {
    try {
        const docRef = doc(db, 'community_content', id);
        await updateDoc(docRef, { isPublic });
    } catch (e) {
        console.error("Error updating document: ", e);
        throw e;
    }
}

export const deleteContent = async (id: string, dataUrl?: string) => {
    try {
        await deleteDoc(doc(db, 'community_content', id));
        // Also try to delete from storage if it's a firebase storage URL
        if (dataUrl && dataUrl.includes('firebasestorage')) {
             try {
                 const fileRef = ref(storage, dataUrl);
                 await deleteObject(fileRef);
             } catch (err) {
                 console.log("Could not delete associated storage object", err);
             }
        }
    } catch (e) {
        console.error("Error deleting document: ", e);
        throw e;
    }
}

export const subscribeToContent = (sectionName: string | null, callback: (data: ContentItem[]) => void) => {
    const q = sectionName 
        ? query(collection(db, 'community_content'), where('section', '==', sectionName))
        : query(collection(db, 'community_content'));
        
    return onSnapshot(q, (snapshot) => {
        const items: ContentItem[] = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as ContentItem);
        });
        // Sort descending locally
        items.sort((a, b) => b.createdAt - a.createdAt);
        callback(items);
    }, (error) => {
        console.error("Error in onSnapshot", error);
    });
}
