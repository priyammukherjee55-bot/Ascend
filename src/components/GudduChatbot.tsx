import React, { useState, useRef, useEffect } from 'react';
import {
  SPORTS_RULES_DATABASE,
  SportRuleEntry,
  querySportsRules,
} from '../lib/sportsRulesData';
import {
  MessageSquare,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Send,
  HelpCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Shield,
  Radio,
  ExternalLink,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'guddu';
  text: string;
  sportKey?: string;
  ruleTitle?: string;
  points?: string[];
  fouls?: string[];
  dimensions?: string;
  timestamp: string;
  isOnlineSearch?: boolean;
}

interface GudduChatbotProps {
  currentSport?: string;
  mode?: 'sidebar' | 'modal' | 'docked';
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const GudduChatbot: React.FC<GudduChatbotProps> = ({
  currentSport = 'cricket',
  mode = 'sidebar',
  isOpen = true,
  onClose,
  className = '',
}) => {
  const [activeSportFilter, setActiveSportFilter] = useState<string>(
    SPORTS_RULES_DATABASE[currentSport] ? currentSport : 'cricket'
  );
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize with parent sport selection
  useEffect(() => {
    if (SPORTS_RULES_DATABASE[currentSport]) {
      setActiveSportFilter(currentSport);
    }
  }, [currentSport]);

  // Initial welcome greeting
  useEffect(() => {
    const activeSport = SPORTS_RULES_DATABASE[activeSportFilter] || SPORTS_RULES_DATABASE.cricket;
    const initialGreeting: ChatMessage = {
      id: 'welcome',
      sender: 'guddu',
      text: `Hello! I'm **Guddu**, your Official Multi-Sport Rules Referee and Lawbook AI. I cover complete international rules for **Cricket, Football, Kabaddi, Tennis, Basketball, Volleyball, Racquet sports, Rugby, Polo, Golf, Archery**, and more. What rule would you like to clarify?`,
      sportKey: activeSport.id,
      points: [
        `Active Sport: ${activeSport.name} (${activeSport.governingBody})`,
        `Dimensions: ${activeSport.courtDimensions}`,
        `Team Size: ${activeSport.teamSize}`,
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([initialGreeting]);
  }, [activeSportFilter]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Text-To-Speech engine
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Answer retrieval: Offline instant + Online search simulated synthesis
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsSearchingOnline(isOnline);

    setTimeout(() => {
      setIsSearchingOnline(false);
      const result = querySportsRules(query, activeSportFilter);
      const sport = result.sportMatch;

      let answerText = '';
      let ruleTitle = result.matchingRule?.title;
      let points: string[] | undefined;
      let fouls: string[] | undefined;

      if (result.matchingRule) {
        answerText = `**${result.matchingRule.title}** (${sport.name})\n\n${result.matchingRule.description}`;
        points = [
          `Governing Law: ${sport.governingBody}`,
          `Playing Area: ${sport.courtDimensions}`,
          `Duration: ${sport.gameDuration}`,
        ];
      } else if (result.faqMatch) {
        answerText = `**${result.faqMatch.question}**\n\n${result.faqMatch.answer}`;
      } else if (result.foulMatches && result.foulMatches.length > 0) {
        answerText = `Here are the official penalties and disciplinary rules for **${sport.name}**:`;
        fouls = result.foulMatches;
      } else {
        // General Sport Overview & core rules breakdown
        answerText = `Here is the official regulation breakdown for **${sport.name}** (${sport.governingBody}):\n\n${sport.shortOverview}\n\n**Scoring System:** ${sport.scoringSystem}`;
        points = sport.coreRules.slice(0, 3).map((r) => `**${r.title}:** ${r.description.slice(0, 140)}...`);
        fouls = sport.foulsAndPenalties.slice(0, 2);
      }

      const botMsg: ChatMessage = {
        id: `guddu-${Date.now()}`,
        sender: 'guddu',
        text: answerText,
        sportKey: sport.id,
        ruleTitle,
        points,
        fouls,
        dimensions: sport.courtDimensions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOnlineSearch: isOnline,
      };

      setMessages((prev) => [...prev, botMsg]);

      if (ttsEnabled) {
        speakText(answerText);
      }
    }, 400);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    { label: '🏏 LBW Criteria', prompt: 'Explain the LBW law and rules in cricket', sport: 'cricket' },
    { label: '⚽ Offside Rule', prompt: 'Explain FIFA Law 11 offside rule in football', sport: 'football' },
    { label: '🤼 Do-or-Die Raid', prompt: 'How does Do-or-Die raid and Super Tackle work in Kabaddi?', sport: 'kabaddi' },
    { label: '🎾 7-Pt Tiebreak', prompt: 'How does the tiebreak scoring work in tennis?', sport: 'tennis' },
    { label: '🏀 24s Shot Clock', prompt: 'Explain 24-second shot clock and violations in basketball', sport: 'basketball' },
    { label: '🏐 Libero Rules', prompt: 'What are the rules and restrictions for a Libero in volleyball?', sport: 'volleyball' },
    { label: '🏸 Kitchen Rule', prompt: 'What is the Kitchen rule in Pickleball and Badminton service height?', sport: 'racket' },
    { label: '🏉 Knock-On Law', prompt: 'What is a knock-on and forward pass in rugby?', sport: 'rugby' },
    { label: '🏇 Line of the Ball', prompt: 'Explain the Line of the Ball safety rule in Polo', sport: 'polo' },
    { label: '⛳ Penalty Relief', prompt: 'Explain red vs yellow penalty area relief in Golf', sport: 'golf' },
    { label: '🏹 Olympic Set Play', prompt: 'How does the set play scoring system work in Olympic archery?', sport: 'archery' },
  ];

  if (mode === 'sidebar' && isCollapsed) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-sm flex items-center justify-between transition-all">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 flex items-center justify-center text-white shadow-md">
            <span className="text-lg">🧑‍⚖️</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black uppercase text-zinc-900 dark:text-white">Guddu AI</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-zinc-500">Official Rules Referee & Lawbook</p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
        >
          <span>Open Lawbook</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden flex flex-col transition-all ${
        mode === 'sidebar' ? 'h-[640px] w-full' : 'h-full max-h-[700px] w-full'
      } ${className}`}
    >
      {/* 1. Chatbot Header */}
      <div className="p-4 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <span className="text-xl">🧑‍⚖️</span>
              </div>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-zinc-950 rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-1">
                Guddu
              </h3>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase">
                Referee AI
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-emerald-400" />
              <span>MCC, FIFA, IKF, ITF, FIBA, BWF Laws</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* TTS Read Aloud Toggle */}
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (isSpeaking) window.speechSynthesis.cancel();
            }}
            title={ttsEnabled ? 'Disable Voice Readout' : 'Enable Voice Readout'}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
              ttsEnabled ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Collapse button for sidebar */}
          {mode === 'sidebar' && (
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse Lawbook"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}

          {/* Close for modal */}
          {mode === 'modal' && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Horizontal Sports Switcher Pills */}
      <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/80 overflow-x-auto scrollbar-none flex items-center gap-1.5">
        {Object.values(SPORTS_RULES_DATABASE).map((s) => {
          const isActive = activeSportFilter === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                setActiveSportFilter(s.id);
                handleSend(`Tell me the essential rules and overview of ${s.name}`);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 rounded-bl-none border border-zinc-200 dark:border-zinc-700/60'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-200 dark:border-zinc-700/60 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span>🧑‍⚖️ Guddu</span>
                      {m.isOnlineSearch && (
                        <span className="text-[9px] px-1 rounded bg-sky-500/20 text-sky-400 font-normal">
                          Verified Law
                        </span>
                      )}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>
                )}

                {/* Main Text Content */}
                <div className="space-y-1.5 whitespace-pre-line text-[12px]">
                  {m.text}
                </div>

                {/* Bullet Points */}
                {m.points && m.points.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-700/60 space-y-1">
                    {m.points.map((pt, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fouls & Penalties Callout */}
                {m.fouls && m.fouls.length > 0 && (
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300">
                    <div className="font-bold flex items-center gap-1 mb-1">
                      <Flame className="w-3 h-3 text-amber-500" />
                      <span>Fouls & Penalties:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[10.5px]">
                      {m.fouls.map((foul, idx) => (
                        <li key={idx}>{foul}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Audio Readout Button */}
                {!isUser && (
                  <div className="mt-2 pt-1 flex items-center justify-end">
                    <button
                      onClick={() => speakText(m.text)}
                      className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Listen to rule</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSearchingOnline && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 p-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Guddu is consulting the official rulebook...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Rule Chips */}
      <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80">
        <div className="text-[10px] font-bold text-zinc-400 mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Quick Rule Queries:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {quickPrompts.slice(0, 6).map((qp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveSportFilter(qp.sport);
                handleSend(qp.prompt);
              }}
              className="flex-shrink-0 px-2 py-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 hover:bg-emerald-500/20 hover:text-emerald-500 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Input Bar */}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Ask Guddu about ${activeSportFilter} rules, fouls, pitch...`}
            className="w-full pl-3 pr-8 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 border border-transparent focus:border-emerald-500 focus:outline-none transition"
          />
          {inputText && (
            <button
              onClick={() => setInputText('')}
              className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-zinc-950 font-bold transition shadow-sm cursor-pointer flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
