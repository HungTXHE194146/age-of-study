"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Minimize2, Maximize2, RotateCcw } from "lucide-react";
import Image from "next/image";
import { chatService, type ChatMessage } from "@/lib/chatService";

// Render simple markdown: **bold**, *italic*, \n newlines
// Inline parser — no library needed for chatbot scope
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let lastIdx = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(line)) !== null) {
      if (m.index > lastIdx) parts.push(line.slice(lastIdx, m.index));
      if (m[1] !== undefined)
        parts.push(<strong key={`${lineIdx}-${m.index}`}>{m[1]}</strong>);
      else if (m[2] !== undefined)
        parts.push(<em key={`${lineIdx}-${m.index}`}>{m[2]}</em>);
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < line.length) parts.push(line.slice(lastIdx));
    return (
      <React.Fragment key={lineIdx}>
        {parts.length > 0 ? parts : line}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

interface Position {
  x: number;
  y: number;
}

const clampToViewport = (pos: Position): Position => {
  if (typeof window === "undefined") return pos;
  // Add 90px bottom padding to avoid overlapping with mobile bottom nav
  const bottomNavOffset = 90;
  const btnSize = window.innerWidth < 768 ? 60 : 80;
  const marginX = window.innerWidth < 768 ? 16 : 60;
  return {
    x: Math.max(0, Math.min(pos.x, window.innerWidth - btnSize - marginX)),
    y: Math.max(
      0,
      Math.min(pos.y, window.innerHeight - btnSize - bottomNavOffset),
    ),
  };
};

export default function FloatingChatbot({
  subjectId,
}: {
  subjectId?: number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      text: "Xin chào! Mình là Cú Mèo - trợ lý học tập của bạn 🦉\nHãy hỏi mình bất cứ điều gì về bài học nhé!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Set initial position to bottom right corner and clamp to current viewport
  useEffect(() => {
    const btnSize = window.innerWidth < 768 ? 60 : 80;
    const marginX = window.innerWidth < 768 ? 16 : 32;
    setPosition(
      clampToViewport({
        x: window.innerWidth - btnSize - marginX,
        y: window.innerHeight - btnSize - 100,
      }),
    );
  }, []);

  // Re-clamp on resize (prevents button from going off-screen on mobile/responsive)
  useEffect(() => {
    const handleResize = () => setPosition((p) => clampToViewport(p));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const btnSize = window.innerWidth < 768 ? 60 : 80;
      const marginX = window.innerWidth < 768 ? 16 : 32;
      const bottomNavOffset = 90;

      // Constrain to viewport, reserving space for bottom nav
      const maxX = window.innerWidth - btnSize - marginX;
      const maxY = window.innerHeight - btnSize - bottomNavOffset;

      const constrainedPos = {
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      };

      setPosition(constrainedPos);
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);

        // Calculate distance moved
        const dist = Math.sqrt(
          Math.pow(e.clientX - startPos.x, 2) +
            Math.pow(e.clientY - startPos.y, 2),
        );

        // If moved more than 5px, it's a drag, don't open chat
        if (dist < 5) {
          setIsOpen(true);
        }
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, position, startPos]);

  // Load chat history when chat is first opened
  const loadHistory = useCallback(async () => {
    if (historyLoaded) return;
    try {
      const history = await chatService.getChatHistory();
      if (history.length > 0) {
        setMessages((prev) => [prev[0], ...history]); // Keep welcome message + add history
      }
      setHistoryLoaded(true);
    } catch {
      setHistoryLoaded(true);
    }
  }, [historyLoaded]);

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      loadHistory();
    }
  }, [isOpen, historyLoaded, loadHistory]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputText;
    setInputText("");
    setIsLoading(true);

    // Create a placeholder bot message for streaming
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: ChatMessage = {
      id: botMessageId,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, botMessage]);

    // Build conversation history from current messages (for context)
    const conversationHistory = messages
      .filter((m) => m.id !== "welcome")
      .slice(-10)
      .map((m) => ({
        role: m.sender === "user" ? ("user" as const) : ("bot" as const),
        text: m.text,
      }));

    await chatService.sendMessageStream(
      messageText,
      subjectId || null,
      conversationHistory,
      {
        onChunk: (text) => {
          // Append each chunk to the bot message (streaming effect)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMessageId ? { ...m, text: m.text + text } : m,
            ),
          );
        },
        onDone: () => {
          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMessageId ? { ...m, isStreaming: false } : m,
            ),
          );
          setIsLoading(false);
        },
        onError: (error) => {
          // Show error as bot message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMessageId
                ? { ...m, text: error, isStreaming: false }
                : m,
            ),
          );
          setIsLoading(false);
        },
      },
    );
  };

  const handleClearChat = async () => {
    const cleared = await chatService.clearHistory();
    if (cleared) {
      setMessages([
        {
          id: "welcome",
          text: "Xin chào! Mình là Cú Mèo - trợ lý học tập của bạn 🦉\nHãy hỏi mình bất cứ điều gì về bài học nhé!",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
      setHistoryLoaded(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div
          ref={buttonRef}
          className={`fixed z-50 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
          onMouseDown={handleMouseDown}
        >
          <button
            className="group relative bg-[#FFF9E5] hover:bg-[#FFF3CC] 
                     text-white rounded-full p-2 shadow-2xl transition-all duration-300 hover:scale-110 
                     border-4 border-yellow-200"
            aria-label="Mở chat với Cú Mèo"
          >
            <div className="relative w-12 h-12 md:w-16 md:h-16 overflow-hidden rounded-full">
              <Image
                src="/logo.svg"
                alt="Cú Mèo"
                fill
                className="object-cover scale-125"
              />
            </div>

            {/* Pulse effect */}
            <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20"></span>

            {/* Tooltip */}
            <div
              className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap
                          pointer-events-none"
            >
              Hỏi Cú Mèo
              <div
                className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 
                            border-transparent border-t-gray-900"
              ></div>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 md:bottom-4 px-2 sm:px-0 z-50 flex flex-col bg-white rounded-2xl shadow-2xl 
                   border-2 border-yellow-200 overflow-hidden transition-all duration-300"
          style={{
            width: isMinimized ? "320px" : "400px",
            height: isMinimized ? "60px" : "600px",
            maxHeight: "75vh",
            maxWidth: "95vw",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between bg-[#FFEDAA] 
                        text-amber-900 p-4 cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full overflow-hidden border border-yellow-200">
                  <Image
                    src="/logo.svg"
                    alt="Cú Mèo"
                    width={40}
                    height={40}
                    className="scale-125 translate-y-1"
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Cú Mèo</h3>
                <p className="text-xs text-amber-700">Trợ lý học tập AI</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearChat();
                }}
                className="hover:bg-amber-500/10 p-2 rounded-lg transition-colors"
                aria-label="Cuộc trò chuyện mới"
                title="Cuộc trò chuyện mới"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="hover:bg-amber-500/10 p-2 rounded-lg transition-colors"
                aria-label={isMinimized ? "Mở rộng" : "Thu nhỏ"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-5 h-5" />
                ) : (
                  <Minimize2 className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="hover:bg-amber-500/10 p-2 rounded-lg transition-colors"
                aria-label="Đóng chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFFDF5]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === "user"
                          ? "bg-[#FFEDAA] text-amber-900 shadow-sm border border-yellow-200"
                          : "bg-white text-gray-800 shadow-md border border-gray-100"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.sender === "bot"
                          ? renderMarkdown(message.text)
                          : message.text}
                        {message.isStreaming && (
                          <span className="inline-block w-1.5 h-4 bg-amber-500 ml-0.5 animate-pulse rounded-sm" />
                        )}
                      </p>
                      {!message.isStreaming && (
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === "user"
                              ? "text-amber-700"
                              : "text-gray-400"
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString(
                            "vi-VN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 shadow-md border border-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></span>
                        <span
                          className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-yellow-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập câu hỏi của bạn..."
                    className="flex-1 px-4 py-3 border border-yellow-200 rounded-xl focus:outline-none 
                             focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() || isLoading}
                    className="bg-[#FFEDAA] hover:bg-[#FFE57A] text-amber-900 p-3 rounded-xl 
                             transition-all duration-200 disabled:opacity-50 
                             disabled:cursor-not-allowed hover:shadow-lg border border-yellow-300"
                    aria-label="Gửi tin nhắn"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() =>
                      setInputText("Giải thích kiến thức này cho mình")
                    }
                    className="px-3 py-1 text-xs bg-yellow-50 text-amber-700 rounded-full 
                             border border-yellow-100 hover:bg-yellow-100 transition-colors"
                  >
                    Giải thích kiến thức
                  </button>
                  <button
                    onClick={() =>
                      setInputText("Cho mình một bài tập tương tự")
                    }
                    className="px-3 py-1 text-xs bg-amber-50 text-amber-700 rounded-full 
                             border border-amber-100 hover:bg-amber-100 transition-colors"
                  >
                    Bài tập tương tự
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
