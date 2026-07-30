import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Send, MessageSquare, Plus, Search, X } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";

export default function DirectMessagesPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const location = useLocation();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef(null);

  // Modal & Search States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // 1. Fetch conversations list
  const loadConversations = async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      setConversations(data?.data?.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 2. Handle state passed from UserProfile "Message" button
  useEffect(() => {
    if (location.state?.targetUser) {
      selectConversation(location.state.targetUser);
    }
  }, [location.state]);

  // 3. Real-time Socket Listener
  useEffect(() => {
    if (!socket || !user) return;

    const currentUserId = user._id || user.id;
    if (currentUserId) {
      socket.emit("join", currentUserId);
    }

    const handleIncomingMessage = (newMessage) => {
      const senderId = newMessage.sender?._id || newMessage.sender?.id || newMessage.sender;
      const recipientId = newMessage.recipient?._id || newMessage.recipient?.id || newMessage.recipient;
      const activeUserId = selectedUser?._id || selectedUser?.id;

      if (
        activeUserId &&
        (senderId?.toString() === activeUserId.toString() ||
          recipientId?.toString() === activeUserId.toString())
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      }

      loadConversations();
    };

    socket.on("message:received", handleIncomingMessage);

    return () => {
      socket.off("message:received", handleIncomingMessage);
    };
  }, [socket, user, selectedUser]);

  // 4. Load Chat History
  const selectConversation = async (contactUser) => {
    setSelectedUser(contactUser);
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/messages/${contactUser._id || contactUser.id}`);
      setMessages(data?.data?.messages || []);
      loadConversations();
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // 5. User Search Functionality
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await api.get(`/users/${query.trim()}`);
      const foundUser = data?.user || data?.data?.user || data;
      const myId = user._id || user.id;

      if (foundUser && (foundUser._id || foundUser.id) !== myId) {
        setSearchResults([foundUser]);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const startNewChat = (target) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    selectConversation(target);
  };

  // 6. Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 7. Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedUser) return;

    const payloadText = text;
    setText("");

    try {
      const { data } = await api.post("/messages", {
        recipientId: selectedUser._id || selectedUser.id,
        text: payloadText,
      });

      const newMsg = data?.data?.message;
      if (newMsg) {
        setMessages((prev) => [...prev, newMsg]);
      }
      loadConversations();
    } catch (err) {
      alert("Failed to send message");
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] border rounded-lg bg-white overflow-hidden m-4 shadow-sm relative">
      {/* LEFT PANEL: CONVERSATIONS LIST */}
      <div className="w-1/3 border-r flex flex-col bg-white">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Messages</span>
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
            title="Start new message"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 divide-y">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              <p>No messages yet.</p>
              <button
                onClick={() => setIsSearchOpen(true)}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                + Start a conversation
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user._id || conv.user.id}
                onClick={() => selectConversation(conv.user)}
                className={`w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition text-left ${
                  (selectedUser?._id || selectedUser?.id) === (conv.user._id || conv.user.id)
                    ? "bg-blue-50/60"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <img
                    src={
                      conv.user.avatar?.url ||
                      conv.user.avatar ||
                      "https://placehold.co/40x40?text=?"
                    }
                    alt={conv.user.username}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <div className="truncate">
                    <p className="text-sm font-semibold truncate text-gray-900">
                      @{conv.user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.text || "Sent an attachment"}
                    </p>
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedUser ? (
          <>
            <div className="p-3.5 bg-white border-b flex items-center gap-3 shadow-xs">
              <img
                src={
                  selectedUser.avatar?.url ||
                  selectedUser.avatar ||
                  "https://placehold.co/36x36?text=?"
                }
                alt=""
                className="w-9 h-9 rounded-full object-cover border"
              />
              <div>
                <span className="font-semibold text-sm block leading-none">
                  @{selectedUser.username}
                </span>
                {selectedUser.fullName && (
                  <span className="text-xs text-gray-400">
                    {selectedUser.fullName}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {loadingMsgs ? (
                <div className="text-center text-sm text-gray-400 mt-10">
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-xs text-gray-400 mt-10">
                  Say hi to @{selectedUser.username}!
                </div>
              ) : (
                messages.map((m) => {
                  const senderId = m.sender?._id || m.sender?.id || m.sender;
                  const myId = user._id || user.id;
                  const isMe = senderId?.toString() === myId?.toString();
                  return (
                    <div
                      key={m._id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none shadow-xs"
                            : "bg-white border text-gray-800 rounded-bl-none shadow-xs"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Message @${selectedUser.username}...`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-full disabled:opacity-40 hover:bg-blue-700 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="p-4 bg-white rounded-full shadow-xs border">
              <MessageSquare className="w-10 h-10 stroke-1 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Your Messages</p>
            <p className="text-xs text-gray-400">
              Send private messages to friends on Instagram.
            </p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="mt-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Send Message
            </button>
          </div>
        )}
      </div>

      {/* NEW MESSAGE MODAL */}
      {isSearchOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-bold text-sm">New Message</h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b flex items-center gap-2 bg-gray-50">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search username..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="bg-transparent border-none text-sm outline-none w-full"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {searching ? (
                <p className="text-xs text-center text-gray-400 py-4">
                  Searching...
                </p>
              ) : searchResults.length > 0 ? (
                searchResults.map((u) => (
                  <button
                    key={u._id || u.id}
                    onClick={() => startNewChat(u)}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-100 rounded-lg text-left transition"
                  >
                    <img
                      src={
                        u.avatar?.url ||
                        u.avatar ||
                        "https://placehold.co/40x40?text=?"
                      }
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <div>
                      <p className="text-sm font-semibold">@{u.username}</p>
                      {u.fullName && (
                        <p className="text-xs text-gray-500">{u.fullName}</p>
                      )}
                    </div>
                  </button>
                ))
              ) : searchQuery.trim() ? (
                <p className="text-xs text-center text-gray-400 py-4">
                  No user found with @{searchQuery}
                </p>
              ) : (
                <p className="text-xs text-center text-gray-400 py-4">
                  Type a username to find contacts
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}