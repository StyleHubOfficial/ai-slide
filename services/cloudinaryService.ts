export const cloudinaryService = {
  getDecks: async () => {
    console.log("Fetching decks via server proxy.");
    const response = await fetch('/api/cloudinary/proxy', { method: 'POST' });
    return await response.json();
  },
  uploadDeck: async (data: any) => {
    console.log("Uploading deck via server proxy.");
    const response = await fetch('/api/cloudinary/proxy', { method: 'POST', body: JSON.stringify(data) });
    return await response.json();
  },
  deleteDeck: async (id: string) => {
    console.log("Deleting deck via server proxy.");
    const response = await fetch('/api/cloudinary/proxy', { method: 'POST', body: JSON.stringify({ id }) });
    return await response.json();
  }
};
