import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface ContentItem {
    id?: string;
    section: string; // 'paras', 'ankit', 'dinesh', 'imtiyaz'
    title: string;
    type: string; // 'video', 'image', 'pdf', 'text', 'other'
    data: string; // base64 or url
    isPublic: boolean;
    createdAt: number;
    uploader: string;
}

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

export const deleteContent = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'community_content', id));
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
