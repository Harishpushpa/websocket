import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
// Remove any other imports that reference Chat or non-existent components

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log("🔄 Initializing socket connection...");
    
    // Create socket connection
    socketRef.current = io("https://websocket-backend-ws5t.onrender.com", {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    // Connection successful
    socketRef.current.on("connect", () => {
      console.log("✅ Connected with ID:", socketRef.current.id);
      setConnectionStatus("Connected");
      setIsConnected(true);
    });

    // Connection failed
    socketRef.current.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      setConnectionStatus("Connection failed - Server may be starting up");
      setIsConnected(false);
    });

    // Disconnection
    socketRef.current.on("disconnect", (reason) => {
      console.log("🔌 Disconnected:", reason);
      setConnectionStatus("Disconnected");
      setIsConnected(false);
      
      if (reason === "io server disconnect") {
        socketRef.current.connect();
      }
    });

    // Receive all chat messages
    socketRef.current.on("chatMessages", (allMessages) => {
      console.log("📥 Received messages:", allMessages);
      console.log("📊 Total messages:", allMessages.length);
      setMessages(allMessages);
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    });

    // Receive user count updates
    socketRef.current.on("userCount", (count) => {
      console.log("👥 User count:", count);
      setUserCount(count);
    });

    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket connection...");
        socketRef.current.off();
        socketRef.current.disconnect();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (!message.trim()) {
      console.log("⚠️ Empty message, not sending");
      return;
    }

    if (!isConnected) {
      console.log("⚠️ Not connected, cannot send message");
      alert("Not connected to server. Please check connection.");
      return;
    }

    if (!socketRef.current) {
      console.log("⚠️ Socket not initialized");
      return;
    }

    console.log("🚀 Sending message:", message);
    socketRef.current.emit("chatMessage", message.trim());
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reconnect = () => {
    if (socketRef.current) {
      console.log("🔄 Attempting to reconnect...");
      setConnectionStatus("Reconnecting...");
      socketRef.current.connect();
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '20px auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>💬 Real-time Chat</h1>
        <div style={{ textAlign: 'right', fontSize: '14px' }}>
          <div style={{ 
            color: isConnected ? '#28a745' : '#dc3545',
            fontWeight: 'bold',
            marginBottom: '5px'
          }}>
            ● {connectionStatus}
          </div>
          {isConnected && (
            <>
              <div style={{ fontSize: '12px', color: '#666' }}>
                ID: {socketRef.current?.id?.slice(0, 8)}...
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                👥 Online: {userCount}
              </div>
            </>
          )}
          {!isConnected && (
            <button 
              onClick={reconnect}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '5px'
              }}
            >
              🔄 Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div
        style={{
          height: '400px',
          overflowY: 'auto',
          padding: '20px',
          marginBottom: '20px',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0'
        }}
      >
        {!isConnected && (
          <div style={{
            textAlign: 'center',
            color: '#dc3545',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f8d7da',
            borderRadius: '8px',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ Not connected to server. Server may be starting up (Render cold start).
          </div>
        )}

        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666',
            marginTop: '100px'
          }}>
            <p style={{ fontSize: '18px' }}>📭 No messages yet</p>
            <p style={{ fontSize: '14px' }}>Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.id === socketRef.current?.id;
            return (
              <div 
                key={`${msg.id}-${index}`}
                style={{
                  marginBottom: '15px',
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  backgroundColor: isOwnMessage ? '#007bff' : '#e9ecef',
                  color: isOwnMessage ? 'white' : '#333',
                  borderRadius: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ 
                    fontSize: '11px', 
                    opacity: 0.7,
                    marginBottom: '4px',
                    fontWeight: 'bold'
                  }}>
                    {isOwnMessage ? 'You' : `User ${msg.id.slice(0, 4)}`}
                  </div>
                  <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>
                  {msg.timestamp && (
                    <div style={{ 
                      fontSize: '10px', 
                      opacity: 0.6,
                      marginTop: '4px'
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        padding: '15px',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type a message and press Enter..." : "Connecting..."}
          disabled={!isConnected}
          maxLength={500}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '1px solid #ddd',
            borderRadius: '25px',
            fontSize: '16px',
            outline: 'none',
            backgroundColor: isConnected ? '#ffffff' : '#f8f9fa',
            color: '#333333',
            WebkitTextFillColor: '#333333'
          }}
        />
        <button 
          onClick={sendMessage}
          disabled={!isConnected || !message.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: isConnected && message.trim() ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: isConnected && message.trim() ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '80px'
          }}
        >
          Send
        </button>
      </div>

      {/* Debug Info */}
      <div style={{ 
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666',
        border: '1px solid #e0e0e0'
      }}>
        <strong>Debug Info:</strong><br/>
        Connected: {isConnected ? 'Yes' : 'No'}<br/>
        Socket ID: {socketRef.current?.id || 'None'}<br/>
        Messages Count: {messages.length}<br/>
        Current Message Length: {message.length}/500<br/>
        Online Users: {userCount}
      </div>
    </div>
  );
}

export default App;