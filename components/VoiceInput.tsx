import React, { useState, useEffect } from 'react';
import { speechRecognitionService, VoiceRecognitionResult } from '../services/speechRecognitionService';

interface VoiceInputProps {
  onNameReceived: (name: string) => void;
  playerNumber: number;
  existingName?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onNameReceived, 
  playerNumber,
  existingName = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [manualInput, setManualInput] = useState(existingName);
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognizedName, setRecognizedName] = useState<string | null>(null);

  useEffect(() => {
    speechRecognitionService.initialize();
  }, []);

  const handleVoiceCapture = async () => {
    setError(null);
    setIsListening(true);

    if (!speechRecognitionService.isSpeechRecognitionAvailable()) {
      setError('Balso atpažinimas nepasiekiamas');
      setShowManualInput(true);
      setIsListening(false);
      return;
    }

    try {
      const result: VoiceRecognitionResult = await speechRecognitionService.recognizeNameWithSpeech('lt-LT');
      
      if (result.success && result.name) {
        setRecognizedName(result.name);
        setManualInput(result.name);
        setShowManualInput(true);
      } else {
        setError(result.error || 'Nepavyko atpažinti vardo');
        setShowManualInput(true);
      }
    } catch (err) {
      setError('Įvyko klaida bandant atpažinti vardą');
      setShowManualInput(true);
    } finally {
      setIsListening(false);
    }
  };

  const handleConfirm = () => {
    if (manualInput.trim()) {
      onNameReceived(manualInput.trim());
      setShowManualInput(false);
      setRecognizedName(null);
    }
  };

  const handleManualOnly = () => {
    setShowManualInput(true);
  };

  if (showManualInput) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#2c1e14] text-white flex items-center justify-center font-black shrink-0">
            {playerNumber}
          </div>
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            placeholder="Įveskite vardą..."
            className="flex-1 bg-white/60 border border-[#4a3728]/30 rounded-xl px-3 py-2 text-sm font-bold text-[#2c1e14] outline-none focus:border-[#d4af37]"
          />
          <button
            onClick={handleConfirm}
            disabled={!manualInput.trim()}
            className="px-4 py-2 rounded-xl bg-[#2c1e14] text-white font-bold hover:bg-[#4a3728] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ✓
          </button>
        </div>
        {recognizedName && (
          <div className="text-xs text-[#4a3728] italic ml-12">
            Atpažintas vardas. Galite pakoreguoti ir patvirtinti.
          </div>
        )}
        {error && (
          <div className="text-xs text-red-600 ml-12">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#2c1e14] text-white flex items-center justify-center font-black">
        {playerNumber}
      </div>
      
      <button
        onClick={handleVoiceCapture}
        disabled={isListening}
        className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 font-bold transition-all ${
          isListening
            ? 'bg-red-500 text-white border-red-400 animate-pulse'
            : 'bg-white/60 text-[#2c1e14] border-[#4a3728]/30 hover:bg-white/80 hover:border-[#d4af37]'
        }`}
      >
        <span className="text-2xl">{isListening ? '🎤' : '🎙️'}</span>
        <span>
          {isListening ? 'Klausoma...' : 'Pasakykite vardą'}
        </span>
      </button>

      <button
        onClick={handleManualOnly}
        className="px-4 py-3 rounded-xl bg-[#4a3728]/20 text-[#2c1e14] border-2 border-[#4a3728]/30 font-bold hover:bg-[#4a3728]/30 transition-all"
        title="Įvesti ranka"
      >
        ✏️
      </button>
    </div>
  );
};
