// ============================================================================
// In-App Messaging - Steward/member communication
// ============================================================================

import { apiCall } from '../api/client';

export interface Message {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  threadId?: string;
}

export interface MessageThread {
  threadId: string;
  subject: string;
  participants: string[];
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  messages: Message[];
}

/** Get all message threads for current user */
export async function getMessageThreads(): Promise<MessageThread[]> {
  const result = await apiCall<{ threads: MessageThread[] }>({
    action: 'getMessageThreads',
    params: {},
  });
  return result.success && result.data ? result.data.threads : [];
}

/** Get messages in a specific thread */
export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const result = await apiCall<{ messages: Message[] }>({
    action: 'getThreadMessages',
    params: { threadId },
  });
  return result.success && result.data ? result.data.messages : [];
}

/** Send a new message */
export async function sendMessage(params: {
  toEmail: string;
  subject: string;
  body: string;
  threadId?: string;
}): Promise<{ success: boolean; messageId?: string }> {
  const result = await apiCall<{ messageId: string }>({
    action: 'sendMessage',
    params,
  });
  return {
    success: result.success,
    messageId: result.data?.messageId,
  };
}

/** Mark a message as read */
export async function markMessageRead(messageId: string): Promise<boolean> {
  const result = await apiCall({ action: 'markMessageRead', params: { messageId } });
  return result.success;
}

/** Get unread message count */
export async function getUnreadCount(): Promise<number> {
  const result = await apiCall<{ count: number }>({
    action: 'getUnreadMessageCount',
    params: {},
  });
  return result.success && result.data ? result.data.count : 0;
}
