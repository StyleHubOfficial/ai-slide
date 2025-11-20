
import React, { useState } from 'react';
import { generatePresentation } from './services/geminiService';
import { Presentation, PresentationStyle } from './types';
import CreationStudio from './components/CreationStudio';
import PresentationView from './components/PresentationView';

function App() {
  const [view, setView] = useState<'CREATE' | 'PRESENT'>('CREATE');
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async (topic: string, style: PresentationStyle, fileContext: string, slideCount: number) => {
    setIsLoading(true);
    try {
      const data = await generatePresentation({ topic, style, fileContext, slideCount });
      setPresentation(data);
      setView('PRESENT');
    } catch (error) {
      console.error("Creation failed:", error);
      alert("Failed to create presentation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePresentation = () => {
    if (window.confirm("Are you sure you want to close? You will lose this deck.")) {
      setView('CREATE');
      setPresentation(null);
    }
  };

  return (
    <div className="w-full h-full">
      {view === 'CREATE' && (
        <CreationStudio onCreate={handleCreate} isLoading={isLoading} />
      )}
      {view === 'PRESENT' && presentation && (
        <PresentationView presentation={presentation} onClose={handleClosePresentation} />
      )}
    </div>
  );
}

export default App;
