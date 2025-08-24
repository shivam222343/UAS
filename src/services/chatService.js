import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from './firebase';

export class ChatService {
  constructor(userId) {
    this.userId = userId;
    this.chatsCollection = collection(db, 'aiChats');
  }

  // Create a new chat session
  async createChatSession(title = 'New Chat') {
    try {
      const chatData = {
        userId: this.userId,
        title,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messageCount: 0
      };
      
      const docRef = await addDoc(this.chatsCollection, chatData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  // Get all chat sessions for the user
  async getChatSessions() {
    try {
      const q = query(
        this.chatsCollection,
        where('userId', '==', this.userId),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by updatedAt on the client side to avoid composite index requirement
      return sessions.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      throw error;
    }
  }

  // Listen to chat sessions in real-time
  subscribeToChatSessions(callback) {
    const q = query(
      this.chatsCollection,
      where('userId', '==', this.userId),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by updatedAt on the client side to avoid composite index requirement
      const sortedSessions = sessions.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date(0);
        const bTime = b.updatedAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      
      callback(sortedSessions);
    });
  }

  // Add a message to a chat session
  async addMessage(chatId, message, isUser = true) {
    try {
      const messagesCollection = collection(db, 'aiChats', chatId, 'messages');
      const messageData = {
        content: message,
        isUser,
        timestamp: serverTimestamp(),
        id: Date.now().toString()
      };

      await addDoc(messagesCollection, messageData);

      // Update chat session's last updated time and message count
      const chatRef = doc(db, 'aiChats', chatId);
      await updateDoc(chatRef, {
        updatedAt: serverTimestamp(),
        messageCount: (await this.getMessageCount(chatId)) + 1,
        lastMessage: message.substring(0, 100) + (message.length > 100 ? '...' : '')
      });

      return messageData;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Get messages for a chat session
  async getMessages(chatId) {
    try {
      const messagesCollection = collection(db, 'aiChats', chatId, 'messages');
      const q = query(messagesCollection, orderBy('timestamp', 'asc'));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  // Listen to messages in real-time
  subscribeToMessages(chatId, callback) {
    const messagesCollection = collection(db, 'aiChats', chatId, 'messages');
    const q = query(messagesCollection, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  }

  // Update chat title
  async updateChatTitle(chatId, title) {
    try {
      const chatRef = doc(db, 'aiChats', chatId);
      await updateDoc(chatRef, {
        title,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  }

  // Delete a chat session
  async deleteChatSession(chatId) {
    try {
      // Delete all messages first
      const messagesCollection = collection(db, 'aiChats', chatId, 'messages');
      const messagesSnapshot = await getDocs(messagesCollection);
      
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete the chat session
      const chatRef = doc(db, 'aiChats', chatId);
      await deleteDoc(chatRef);
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  // Get message count for a chat
  async getMessageCount(chatId) {
    try {
      const messagesCollection = collection(db, 'aiChats', chatId, 'messages');
      const snapshot = await getDocs(messagesCollection);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting message count:', error);
      return 0;
    }
  }

  // Search messages across all chats
  async searchMessages(searchTerm) {
    try {
      const sessions = await this.getChatSessions();
      const results = [];

      for (const session of sessions) {
        const messages = await this.getMessages(session.id);
        const matchingMessages = messages.filter(msg => 
          msg.content.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matchingMessages.length > 0) {
          results.push({
            session,
            messages: matchingMessages
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }
}
