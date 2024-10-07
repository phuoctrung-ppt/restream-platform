import React, { useState } from 'react';
import './App.css';
import AgoraStreamer from './components/AgoraStreamer';
import AgoraStreamer2 from './components/AgoraStreamer2';
import AgoraAudience from './components/AgoraAudience';

function App() {
  const [role, setRole] = useState('audience');
  const appId = '';
  const channel = '';
  const token = ""; 
  const uid = 123456;
  const uid2 = 123457;
  const uid3 = 123458;
  return (
    <div className="App">
      <h1>Agora Video Streaming with TensorFlow</h1>
      <button onClick={() => setRole('streamer1')}>Be Streamer 1</button>
      <button onClick={() => setRole('streamer2')}>Be Streamer 2</button>
      <button onClick={() => setRole('audience')}>Be an Audience</button>
      
      {role === 'streamer1' && <AgoraStreamer appId={appId} channel={channel} token={token} uid={uid} />}
      {role === 'streamer2' && <AgoraStreamer2 appId={appId} channel={channel} token={token} uid={uid2} />}
      {role === 'audience' && <AgoraAudience appId={appId} channel={channel} token={token} uid={uid3} />}
    </div>
  );
}

export default App;
