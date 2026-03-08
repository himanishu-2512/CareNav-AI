import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender: string;
  preview: string;
  time: string;
  avatar: string;
  unread: boolean;
}

const mockMessages: Message[] = [
  { id: '1', sender: 'Eyal Ofer', preview: 'Eion Morgan is a dedicated pediatrician with over 15...', time: 'Just Now', avatar: '👨‍⚕️', unread: true },
  { id: '2', sender: 'Jeff Yass', preview: 'You: Eion Morgan is a dedicated pediatrician with...', time: '2 hours ago', avatar: '👨', unread: false },
  { id: '3', sender: 'Yan Shipley', preview: 'Eion Morgan is a dedicated pediatrician with over 15...', time: 'Yesterday', avatar: '👨‍⚕️', unread: false },
  { id: '4', sender: 'Pedramine G.', preview: 'Eion Morgan is a dedicated pediatrician with over 15 years...', time: 'Monday', avatar: '👨‍⚕️', unread: true },
  { id: '5', sender: 'Kimberly J.', preview: 'Eion Morgan is a dedicated pediatrician with over 15...', time: 'Saturday', avatar: '👩‍⚕️', unread: false },
  { id: '6', sender: 'Stefan Persson', preview: 'You: Eion Morgan is a dedicated pediatrician with...', time: '06 Oct', avatar: '👨', unread: false }
];

export default function Messages() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                M
              </div>
              <div>
                <div className="text-xs text-gray-500">Welcome Back</div>
                <div className="text-sm font-semibold text-gray-900">Inbox</div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-4 pb-24">
        <div className="space-y-2">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center text-2xl flex-shrink-0">
                    {msg.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{msg.sender}</h3>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">{msg.preview}</p>
                  </div>
                </div>
                {msg.unread && (
                  <div className="w-3 h-3 bg-teal-500 rounded-full ml-2 flex-shrink-0"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around py-3">
            <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-gray-400 hover:text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span className="text-xs mt-1">Home</span>
            </button>

            <button onClick={() => navigate('/doctors')} className="flex flex-col items-center text-gray-400 hover:text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-xs mt-1">Doctors</span>
            </button>

            <button
              onClick={() => navigate('/symptoms/chat')}
              className="flex flex-col items-center -mt-6"
            >
              <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </div>
            </button>

            <button className="flex flex-col items-center text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              </svg>
              <span className="text-xs mt-1">Messages</span>
            </button>

            <button onClick={() => navigate('/more')} className="flex flex-col items-center text-gray-400 hover:text-teal-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span className="text-xs mt-1">More</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
