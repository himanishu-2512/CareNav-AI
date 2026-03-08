import React, { useState, useEffect, useRef } from 'react';
import axios from '../lib/axios';

interface ChatMessage {
  messageId: string;
  sender: 'doctor' | 'patient' | 'system';
  content: string;
  timestamp: string;
  type: 'text' | 'prescription' | 'document' | 'recommendation';
}

interface TreatmentChatProps {
  episodeId: string;
  patientId: string;
  doctorId: string;
  onComplete?: () => void;
}

export const TreatmentChat: React.FC<TreatmentChatProps> = ({
  episodeId,
  patientId: _patientId,
  doctorId: _doctorId,
  onComplete
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [episodeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/treatment/episode/${episodeId}`);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      await axios.post(`/treatment/episode/${episodeId}/message`, {
        sender: 'doctor',
        content: newMessage,
        type: 'text'
      });
      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeEpisode = async () => {
    try {
      await axios.post(`/treatment/episode/${episodeId}/complete`, { outcome, notes });
      setShowCompleteDialog(false);
      onComplete?.();
    } catch (err) {
      console.error('Failed to complete episode:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Treatment Chat</h2>
        <button
          onClick={() => setShowCompleteDialog(true)}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Complete Treatment
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.messageId}
            className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md p-3 rounded ${
                msg.sender === 'doctor'
                  ? 'bg-blue-500 text-white'
                  : msg.sender === 'system'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {msg.sender === 'doctor' ? 'You' : msg.sender === 'system' ? 'System' : 'Patient'}
              </p>
              <p>{msg.content}</p>
              <p className="text-xs mt-1 opacity-75">
                {new Date(msg.timestamp).toLocaleString()}
              </p>
              {msg.type !== 'text' && (
                <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded mt-2 inline-block">
                  {msg.type}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>

      {showCompleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Complete Treatment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Outcome</label>
                <input
                  type="text"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Treatment outcome"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Final Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={4}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={completeEpisode}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowCompleteDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
