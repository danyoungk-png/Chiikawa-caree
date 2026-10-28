/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHARACTER_CONFIG } from './characterConfig';
import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function App() {
  const [selectedChar, setSelectedChar] = useState<keyof typeof CHARACTER_CONFIG | null>(null);
  const [affinity, setAffinity] = useState(0);
  const [bubble, setBubble] = useState<{ text: string; visible: boolean }>({ text: '', visible: false });
  const [activeFood, setActiveFood] = useState<string | null>(null);
  const [playingMusic, setPlayingMusic] = useState(false);
  const [activeHand, setActiveHand] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showEnding, setShowEnding] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [completedChars, setCompletedChars] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [isBgmOn, setIsBgmOn] = useState(false);
  const bgmAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bgmAudio.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a147d7.mp3');
    bgmAudio.current.loop = true;
    bgmAudio.current.volume = 0.5;
    bgmAudio.current.onerror = (e) => console.error("Audio error:", e);
    return () => { bgmAudio.current?.pause(); };
  }, []);

  const toggleBgm = () => {
    if (isBgmOn) bgmAudio.current?.pause();
    else bgmAudio.current?.play();
    setIsBgmOn(!isBgmOn);
  };

  useEffect(() => {
    if (affinity >= 1000 && !showEnding) {
      setShowEnding(true);
      setShowCertificate(true);
      if (isBgmOn) bgmAudio.current?.pause();
      new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg').play();
      showBubble(`${playerName || '당신'}, 너무너무 좋아해! 💕`);
      setTimeout(() => setShowContinueModal(true), 3000);
    }
  }, [affinity, showEnding, playerName]);

  const resetCharacter = async (charKey: string) => {
    // Re-raising functionality permanently removed per user request.
  };

  const handleContinue = (choice: boolean) => {
    setShowContinueModal(false);
    if (choice) {
      setCompletedChars(prev => [...prev, selectedChar!]);
      setSelectedChar(null);
      setAffinity(0);
      setShowEnding(false);
    }
  };

  const closeCertificate = () => {
    setShowCertificate(false);
    if (isBgmOn) bgmAudio.current?.play();
  };

  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showBubble = (text: string) => {
    if (bubbleTimeoutRef.current) {
      clearTimeout(bubbleTimeoutRef.current);
    }
    setBubble({ text, visible: true });
    bubbleTimeoutRef.current = setTimeout(() => setBubble({ text: '', visible: false }), 3000);
  };

  const updateAffinity = async (charKey: string, amount: number) => {
    try {
      const newAffinity = affinity + amount;
      setAffinity(newAffinity);
      const docRef = doc(db, 'affinity', charKey);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        await updateDoc(docRef, { value: newAffinity });
      } else {
        await setDoc(docRef, { value: newAffinity });
      }
    } catch (error) {
      console.error("Firebase update failed:", error);
    }
  };

  const handleInteraction = (type: 'feed' | 'pet' | 'play') => {
    if (!selectedChar) return;
    const char = CHARACTER_CONFIG[selectedChar];
    showBubble(char.catchphrase);

    if (type === 'feed') {
      const foods = ['🍮', '🍚', '🍜'];
      setActiveFood(foods[Math.floor(Math.random() * foods.length)]);
      setTimeout(() => setActiveFood(null), 1000);
      updateAffinity(selectedChar, 5);
    } else if (type === 'pet') {
      setActiveHand(true);
      updateAffinity(selectedChar, 10);
      setHearts([...hearts, { id: Date.now(), x: 100, y: 100 }]);
      setTimeout(() => setActiveHand(false), 2000);
    } else if (type === 'play') {
      setPlayingMusic(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const startTime = audioCtx.currentTime;
      [440, 554, 659, 440, 554, 659].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        osc.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.start(startTime + i * 0.8);
        osc.stop(startTime + i * 0.8 + 0.7);
      });
      setTimeout(() => {
        setPlayingMusic(false);
        audioCtx.close();
      }, 5000);
      updateAffinity(selectedChar, 10);
    }
  };

  useEffect(() => {
    let timeout: any;
    if (activeHand) {
      timeout = setTimeout(() => {
        setHearts(prev => prev.slice(1));
      }, 2000);
    }
    return () => clearTimeout(timeout);
  }, [activeHand]);

  const handlePetAction = (e: React.MouseEvent) => {
    // No longer needed
  };

  if (!selectedChar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-300 via-yellow-200 to-sky-200 flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans cursor-star">
        <style>{`.cursor-star { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="%23FFD700" d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>'), auto; }`}</style>
        
        {/* Particle Animation */}
        {[...Array(15)].map((_, i) => (
          <motion.div key={`particle-${i}-${Date.now()}`} className="absolute text-2xl" initial={{ y: '100vh', x: `${Math.random() * 100}vw`, opacity: 0 }} animate={{ y: '-10vh', opacity: [0, 1, 0] }} transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 6 }}>
            {['✨', '💖', '☁️', '🎀'][Math.floor(Math.random() * 4)]}
          </motion.div>
        ))}

        <button onClick={toggleBgm} className="absolute top-4 right-4 bg-white/80 p-3 rounded-full text-2xl shadow-lg border-4 border-white hover:scale-110">
          {isBgmOn ? '🎵' : '🔇'}
        </button>

        <motion.div className="flex items-center gap-4 mb-8 bg-white/60 p-6 rounded-full shadow-lg border-4 border-white" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
          <span className="text-4xl">🎀✨</span>
          <h1 className="text-4xl font-black text-pink-600 tracking-tighter drop-shadow">치이카와 키우기 게임</h1>
          <span className="text-4xl">💖🐾</span>
        </motion.div>

        <div className="flex flex-col items-center gap-2 mb-24">
          <div className="bg-pink-400 text-white font-bold px-4 py-1 rounded-full text-sm shadow">✨ 마스터 이름 입력</div>
          <input
            type="text"
            placeholder="이름을 입력해주세요 💖"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="px-8 py-4 rounded-3xl text-center shadow-inner border-4 border-white bg-white/90 focus:outline-none w-64"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-16 overflow-visible">
          {(Object.keys(CHARACTER_CONFIG) as Array<keyof typeof CHARACTER_CONFIG>).map((key) => {
            const isCompleted = completedChars.includes(key);
            const char = CHARACTER_CONFIG[key];
            return (
              <motion.div key={key} whileHover={{ scale: 1.08, rotate: [0, -5, 5, 0] }} className="relative flex flex-col items-center group">
                <button
                  disabled={isCompleted}
                  onClick={() => !isCompleted && setSelectedChar(key)}
                  className={`bg-white p-6 rounded-2xl shadow-2xl border-4 transition-all duration-300 ${isCompleted ? 'opacity-50 grayscale border-gray-300' : 'border-white hover:border-pink-300 hover:shadow-pink-300/50'}`}
                >
                  {isCompleted && <div className="absolute top-2 right-2 text-2xl">👑</div>}
                  <img src={char.image} alt={char.name} className="w-28 h-28 mx-auto mb-4" />
                  <p className="font-black text-xl text-gray-800">{char.name}</p>
                  <span className="mt-2 block bg-gradient-to-r from-pink-300 to-yellow-300 text-white font-bold py-2 px-4 rounded-full shadow-inner hover:brightness-110">선택하기 ♡</span>
                </button>
                {/* Hover bubble */}
                {!isCompleted && (
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="absolute -top-24 left-1/2 -translate-x-1/2 bg-white p-4 rounded-2xl shadow-xl border-2 border-pink-200 text-sm font-bold text-pink-600 opacity-0 group-hover:opacity-100 transition-opacity z-[999] text-center min-w-[180px] max-w-[250px] w-max whitespace-normal break-keep" style={{ wordBreak: 'keep-all' }}>
                    {char.hoverCatchphrase}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-pink-200 rotate-45"></div>
                  </motion.div>
                )}
                {/* Fixed completion bubble */}
                {isCompleted && (
                  <motion.div className="absolute -top-28 left-1/2 -translate-x-1/2 bg-white p-4 rounded-2xl shadow-xl border-2 border-yellow-200 text-[11px] font-bold text-gray-700 z-[999] text-center min-w-[180px] max-w-[220px] w-max whitespace-normal break-keep" style={{ wordBreak: 'keep-all' }}>
                    {char.name}와(과) {playerName || '당신'} 님이 완벽한 베스트 프렌드가 되었습니다!
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-yellow-200 rotate-45"></div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  const char = CHARACTER_CONFIG[selectedChar];

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 font-sans" style={{ backgroundImage: `url('/public/assets/aistudio/95eb6896ff7270bcccc2e4fa1df771cb_0b8be9ce.jpg')` }}>
      <h2 className="text-3xl font-bold mb-4 text-pink-700 tracking-tight">{char.name}를 키우는 중! (친밀도: {affinity})</h2>
      <div className="relative">
        {affinity >= 1000 && <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl">👑</div>}
        <img src={char.image} alt={char.name} className="w-64 h-64 mb-4" />
        <AnimatePresence>
          {bubble.visible && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow text-sm border-2 border-pink-300">
              {bubble.text}
            </motion.div>
          )}
          {activeFood && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, x: 50, y: 50 }} exit={{ opacity: 0 }} className="absolute text-4xl top-0 left-0">
              {activeFood}
            </motion.div>
          )}
          {hearts.map(heart => (
            <motion.div key={heart.id} initial={{ opacity: 1, scale: 0 }} animate={{ opacity: 0, scale: 1.5, y: -50 }} className="absolute text-2xl" style={{ left: heart.x, top: heart.y }}>❤️</motion.div>
          ))}
          {playingMusic && (
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute -top-12 -right-4 text-4xl">
              🎤
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex gap-4">
        <button onClick={() => handleInteraction('feed')} className="px-4 py-2 bg-blue-500 text-white rounded">먹이 주기</button>
        <button onClick={() => handleInteraction('pet')} className="px-4 py-2 bg-green-500 text-white rounded">쓰다듬어주기</button>
        <button onClick={() => handleInteraction('play')} className="px-4 py-2 bg-yellow-500 text-white rounded">놀아주기 🎤</button>
      </div>
      <button onClick={() => { setSelectedChar(null); }} className="mt-8 text-gray-500 underline">뒤로 가기</button>
      {activeHand && <div className="fixed text-6xl pointer-events-none" style={{ left: '50%', top: '50%' }}>✋</div>}
      {showCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-pink-100 to-yellow-100 p-8 rounded-3xl shadow-2xl text-center border-4 border-white">
            <h3 className="text-3xl font-black text-pink-600 mb-6">📜 베스트 프렌드 인증서</h3>
            <p className="text-xl font-bold text-gray-700">🎉 {char.name}와(과) {playerName || '당신'} 님이 완벽한 베스트 프렌드가 되었습니다!</p>
            <button onClick={closeCertificate} className="mt-8 px-6 py-2 bg-pink-500 text-white rounded-full font-bold">확인</button>
          </div>
        </div>
      )}
      {showContinueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <h3 className="text-xl font-bold mb-4">다른 캐릭터로 게임을 계속하시겠습니까?</h3>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleContinue(true)} className="px-4 py-2 bg-green-500 text-white rounded">예</button>
              <button onClick={() => handleContinue(false)} className="px-4 py-2 bg-red-500 text-white rounded">아니오</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
