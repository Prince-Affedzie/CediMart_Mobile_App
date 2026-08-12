// context/ChatContext.js
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import {
  openConversation as openConversationApi,
  getInbox as getInboxApi,
  getMessages as getMessagesApi,
  sendMessage as sendMessageApi,
  markRead as markReadApi,
  getTotalUnread as getTotalUnreadApi,
} from '../apis/chatApi';
import { NotificationContext } from './NotificationContext';
import { useAuth } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { socket } = useContext(NotificationContext);
  const { user } = useAuth();

  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const joinedRoomRef = useRef(null);

  // ── Inbox ──────────────────────────────────────────────────────────────────

  const loadInbox = useCallback(async () => {
    if (!user) return;
    setInboxLoading(true);
    try {
      const res = await getInboxApi({ status: 'active' });
      if (res.data?.success) {
        setInbox(res.data.conversations);
      }
    } catch (err) {
      console.error('loadInbox error:', err.message);
    } finally {
      setInboxLoading(false);
    }
  }, [user]);

  const loadTotalUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getTotalUnreadApi();
      if (res.data?.success) setTotalUnread(res.data.total);
    } catch (err) {
      console.error('loadTotalUnread error:', err.message);
    }
  }, [user]);

  // ── Open a conversation ────────────────────────────────────────────────────

  const openConversation = useCallback(async ({ productId, recipientId } = {}) => {
    try {
      const payload = {};
      if (productId) payload.productId = productId;
      if (recipientId) payload.recipientId = recipientId;

      const res = await openConversationApi(payload);
      if (res.data?.success) {
        const conversation = res.data.conversation;
        setInbox((prev) => {
          const exists = prev.find((c) => c._id === conversation._id);
          if (exists) return prev;
          return [{ ...conversation, myUnread: 0 }, ...prev];
        });
        return conversation;
      }
    } catch (err) {
      console.error('openConversation error:', err.message);
      throw err;
    }
  }, []);

  // ── Load messages ─────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (conversationId, { reset = false } = {}) => {
    setMessagesLoading(true);
    try {
      const before = reset ? undefined : messages[0]?.createdAt;
      const res = await getMessagesApi(conversationId, { before, limit: 30 });

      if (res.data?.success) {
        const fetched = res.data.messages;
        setHasMoreMessages(fetched.length === 30);

        if (reset) {
          setMessages(fetched);
        } else {
          setMessages((prev) => [...fetched, ...prev]);
        }
      }
    } catch (err) {
      console.error('loadMessages error:', err.message);
    } finally {
      setMessagesLoading(false);
    }
  }, [messages]);

  // ── Enter a conversation ──────────────────────────────────────────────────

  const enterConversation = useCallback(async (conversation) => {
    setActiveConversation(conversation);
    setMessages([]);
    setHasMoreMessages(true);

    await loadMessages(conversation._id, { reset: true });

    if (socket) {
      socket.emit('joinConversation', { conversationId: conversation._id });
      joinedRoomRef.current = conversation._id;
    }

    try {
      await markReadApi(conversation._id);
      socket?.emit('markRead', { conversationId: conversation._id, userId: user._id });
      _clearUnreadInInbox(conversation._id);
      await loadTotalUnread();
    } catch (err) {
      console.error('markRead error:', err.message);
    }
  }, [socket, user, loadMessages, loadTotalUnread]);

  // ── Leave a conversation ──────────────────────────────────────────────────

  const leaveConversation = useCallback(() => {
    if (socket && joinedRoomRef.current) {
      socket.emit('leaveConversation', { conversationId: joinedRoomRef.current });
      socket.emit('stopTyping', { conversationId: joinedRoomRef.current, userId: user._id });
      joinedRoomRef.current = null;
    }
    setActiveConversation(null);
    setMessages([]);
  }, [socket, user]);

  // ── Send a message ────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (conversationId, text, replyTo = null) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const optimisticMsg = {
      _id: `temp_${Date.now()}`,
      conversation: conversationId,
      sender: { _id: user._id, firstName: user.firstName, lastName: user.lastName, profileImage: user.profileImage },
      text: trimmed,
      type: 'text',
      replyTo: replyTo ? { _id: replyTo, text: '...', sender: { firstName: '...' } } : null,
      readAt: null,
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    if (socket) {
      socket.emit('sendMessage', {
        conversationId,
        senderId: user._id,
        text: trimmed,
        replyTo: replyTo || undefined,
      });
    } else {
      try {
        const res = await sendMessageApi(conversationId, { text: trimmed, replyTo: replyTo || undefined });
        if (res.data?.success) {
          setMessages((prev) =>
            prev.map((m) => (m._id === optimisticMsg._id ? res.data.message : m))
          );
        }
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
        console.error('sendMessage REST fallback error:', err.message);
        throw err;
      }
    }
  }, [socket, user]);

  // ── Typing indicators ─────────────────────────────────────────────────────

  const [typingUsers, setTypingUsers] = useState({});

  const emitTyping = useCallback((conversationId) => {
    socket?.emit('typing', { conversationId, userId: user._id });
  }, [socket, user]);

  const emitStopTyping = useCallback((conversationId) => {
    socket?.emit('stopTyping', { conversationId, userId: user._id });
  }, [socket, user]);

  // ── Internal helpers ──────────────────────────────────────────────────────

  const _clearUnreadInInbox = (conversationId) => {
    setInbox((prev) =>
      prev.map((c) =>
        c._id === conversationId
          ? { ...c, myUnread: 0, buyerUnread: 0, sellerUnread: 0 }
          : c
      )
    );
  };

  const _upsertInboxConversation = (updatedConv) => {
    setInbox((prev) => {
      const exists = prev.find((c) => c._id === updatedConv._id);
      if (exists) {
        return prev
          .map((c) => (c._id === updatedConv._id ? updatedConv : c))
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      }
      return [updatedConv, ...prev];
    });
  };

  // ── Socket event listeners ────────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('userOnline', user._id);

    const onNewMessage = (message) => {
      const convId = message.conversation?._id ?? message.conversation;

      if (convId === activeConversation?._id) {
        setMessages((prev) => {
          const isMyMessage = message.sender?._id === user._id;
          if (isMyMessage) {
            const hasOptimistic = prev.some((m) => m._optimistic);
            if (hasOptimistic) {
              return prev.map((m) => (m._optimistic ? message : m));
            }
          }
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        markReadApi(convId).catch(() => {});
        socket.emit('markRead', { conversationId: convId, userId: user._id });
      }
    };

    const onConversationUpdated = (conversation) => {
      const isBuyer = conversation.buyer?._id === user._id || conversation.buyer === user._id;
      const myUnread =
        conversation._id === activeConversation?._id
          ? 0
          : isBuyer
          ? conversation.buyerUnread
          : conversation.sellerUnread;

      _upsertInboxConversation({ ...conversation, myUnread });
      loadTotalUnread();
    };

    const onMessagesRead = ({ conversationId }) => {
      if (conversationId === activeConversation?._id) {
        setMessages((prev) =>
          prev.map((m) => ({ ...m, readAt: m.readAt ?? new Date().toISOString() }))
        );
      }
    };

    const onUserTyping = ({ userId, conversationId }) => {
      if (conversationId === activeConversation?._id && userId !== user._id) {
        setTypingUsers((prev) => ({ ...prev, [userId]: true }));
      }
    };

    const onUserStopTyping = ({ userId }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    socket.on('newMessage', onNewMessage);
    socket.on('conversationUpdated', onConversationUpdated);
    socket.on('messagesRead', onMessagesRead);
    socket.on('userTyping', onUserTyping);
    socket.on('userStopTyping', onUserStopTyping);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('conversationUpdated', onConversationUpdated);
      socket.off('messagesRead', onMessagesRead);
      socket.off('userTyping', onUserTyping);
      socket.off('userStopTyping', onUserStopTyping);
    };
  }, [socket, user, activeConversation]);

  useEffect(() => {
    if (user) {
      loadInbox();
      loadTotalUnread();
    }
  }, [user]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && user) {
        loadTotalUnread();
      }
    });
    return () => sub.remove();
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        inbox,
        inboxLoading,
        totalUnread,
        loadInbox,

        openConversation,
        enterConversation,
        leaveConversation,
        activeConversation,

        messages,
        messagesLoading,
        hasMoreMessages,
        loadMessages,
        sendMessage,

        typingUsers,
        emitTyping,
        emitStopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);