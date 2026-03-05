/**
 * Single message in a chat transcript (for OpenAI API).
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
