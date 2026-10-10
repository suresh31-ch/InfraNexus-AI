import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, RefreshCw, ChevronDown, ExternalLink, Bot, User, Trash2 } from 'lucide-react';
import { askInfraNexusAi, ChatMessage } from '../services/aiChatService';

interface AskInfraNexusChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProjectCode?: (code: string) => void;
}

export const AskInfraNexusChatModal: React.FC<AskInfraNexusChatModalProps> = ({
  isOpen,
  onClose,
  onSelectProjectCode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I am **Ask InfraNexus AI**, your municipal infrastructure coordination assistant.\n\nI answer queries strictly using the real public works database (7 tracked projects, right-of-way corridor clashes on GST Road, and verified citizen reports). How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'Which road projects may conflict with water pipeline work next month?',
        'Which projects may be at risk of delay?',
        'Summarize unresolved infrastructure conflicts',
      ],
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputPrompt).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const response = await askInfraNexusAi(q, history);

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources,
        suggestedFollowUps: response.suggestedFollowUps,
        isHeuristicFallback: response.isHeuristicFallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: `An error occurred while querying the infrastructure assistant: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'init-fresh',
        sender: 'assistant',
        text: `Conversation cleared. What would you like to explore regarding municipal works, corridor conflicts, or delay risks?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          'Which road projects may conflict with water pipeline work next month?',
          'Which projects may be at risk of delay?',
          'Summarize unresolved infrastructure conflicts',
        ],
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl w-full max-w-3xl h-[85vh] max-h-[750px] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Ask InfraNexus AI</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                  GROUNDED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Project-Aware Municipal Assistant • One Network. Zero Coordination Blind Spots.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl ${
                      isUser
                        ? 'bg-cyan-600 text-white rounded-tr-xs'
                        : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-[13px]">{m.text}</div>

                    {/* Sources citations */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Verified Sources & Project Records:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map((s, idx) => (
                            <span
                              key={idx}
                              onClick={() => onSelectProjectCode && onSelectProjectCode(s.code)}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px] font-bold cursor-pointer hover:border-cyan-400 transition-colors flex items-center gap-1"
                            >
                              <span>{s.code}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`text-[10px] text-slate-500 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {m.timestamp}
                  </div>

                  {/* Suggested follow-up chips */}
                  {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && !loading && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.suggestedFollowUps.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip)}
                          className="px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-cyan-300 text-[11px] font-medium transition-all cursor-pointer text-left"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-slate-400 p-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Querying verified municipal database and synthesis models...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about road conflicts, pipeline schedules, delay risks..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="text-[10px] text-slate-500 text-center mt-1.5">
            Answers are strictly grounded in municipal database records (dates, coordinates, contractor milestones).
          </div>
        </div>
      </div>
    </div>
  );
};
