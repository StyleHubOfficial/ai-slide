
import { SharedPresentation, Presentation, PresentationStyle } from '../types';

const STORAGE_KEY = 'lumina_community_decks';
const HISTORY_KEY = 'lumina_user_history';

// Initial Seed Data
const SEED_DECKS: SharedPresentation[] = [
  {
    id: 'seed-1',
    topic: 'Future of AI',
    title: 'The Generative Age',
    author: 'Sarah Connors',
    style: PresentationStyle.DigitalPad,
    likes: 124,
    downloads: 45,
    sharedBy: 'SarahC',
    dateShared: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
    slides: [] 
  },
  {
    id: 'seed-2',
    topic: 'Sustainable Energy',
    title: 'Green Tech Revolution',
    author: 'EcoLabs',
    style: PresentationStyle.Whiteboard,
    likes: 89,
    downloads: 12,
    sharedBy: 'GreenGuy',
    dateShared: new Date(Date.now() - 86400000 * 1).toLocaleDateString(),
    slides: []
  },
  {
    id: 'seed-3',
    topic: 'Q4 Strategy',
    title: 'Q4 Marketing Blitz',
    author: 'Corp Dynamics',
    style: PresentationStyle.Blueprint,
    likes: 256,
    downloads: 110,
    sharedBy: 'BizMaster',
    dateShared: new Date().toLocaleDateString(),
    slides: []
  }
];

export const communityService = {
  // --- Community Hub Methods ---

  getDecks: (): SharedPresentation[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DECKS));
      return SEED_DECKS;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      return SEED_DECKS;
    }
  },

  publishDeck: (presentation: Presentation, username: string = 'You'): SharedPresentation => {
    const decks = communityService.getDecks();
    
    const newDeck: SharedPresentation = {
      ...presentation,
      id: Math.random().toString(36).substr(2, 9),
      likes: 0,
      downloads: 0,
      sharedBy: username,
      dateShared: new Date().toLocaleDateString()
    };

    const updatedDecks = [newDeck, ...decks];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDecks));
    return newDeck;
  },

  deleteDeck: (deckId: string) => {
    const decks = communityService.getDecks();
    const updated = decks.filter(d => d.id !== deckId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  likeDeck: (deckId: string): SharedPresentation[] => {
    const decks = communityService.getDecks();
    const updated = decks.map(d => {
      if (d.id === deckId) return { ...d, likes: d.likes + 1 };
      return d;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  incrementDownload: (deckId: string): SharedPresentation[] => {
    const decks = communityService.getDecks();
    const updated = decks.map(d => {
      if (d.id === deckId) return { ...d, downloads: d.downloads + 1 };
      return d;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  downloadDeck: (deck: SharedPresentation) => {
      const element = document.createElement("a");
      const file = new Blob([JSON.stringify(deck, null, 2)], {type: 'application/json'});
      element.href = URL.createObjectURL(file);
      element.download = `${deck.title.replace(/\s+/g, '_')}_Lakshya.json`;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
      document.body.removeChild(element);
  },

  // --- User History Methods (Private) ---

  saveHistory: (presentation: Presentation) => {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    let history: Presentation[] = historyStr ? JSON.parse(historyStr) : [];
    
    // Add to top, prevent duplicates by title/topic roughly
    const newEntry = { ...presentation, id: Math.random().toString(36).substr(2, 9) }; 
    history = [newEntry, ...history].slice(0, 20); // Keep last 20
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  },

  getHistory: (): Presentation[] => {
    const historyStr = localStorage.getItem(HISTORY_KEY);
    return historyStr ? JSON.parse(historyStr) : [];
  },

  deleteHistory: (title: string) => {
    const history = communityService.getHistory();
    const updated = history.filter(h => h.title !== title);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  }
};
