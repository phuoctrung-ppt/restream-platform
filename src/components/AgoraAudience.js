import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const AgoraAudience = ({ appId, channel, token, uid }) => {
  const client = useRef(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const init = async () => {
      client.current = AgoraRTC.createClient({ mode: 'live', codec: 'h264' });
        AgoraRTC.setLogLevel(4);
      client.current.on('user-published', async (user, mediaType) => {
        console.log('Audience: user-published event', user.uid, mediaType);
        await client.current.subscribe(user, mediaType);
        console.log('Audience: Subscribed to user:', user.uid, mediaType);

        if (mediaType === 'video') {
          setRemoteUsers(prevUsers => {
            if (!prevUsers.some(u => u.uid === user.uid)) {
              return [...prevUsers, user];
            }
            return prevUsers;
          });
        }
      });

      client.current.on('user-unpublished', (user, mediaType) => {
        console.log('Audience: user-unpublished event', user.uid, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
          if (selectedUser && selectedUser.uid === user.uid) {
            setSelectedUser(null);
          }
        }
      });

      try {
        await client.current.join(appId, channel, token, uid);
        await client.current.setClientRole("audience");
        console.log('Joined channel as audience', uid);
        setIsConnected(true);
      } catch (error) {
        console.error('Error joining channel:', error);
      }
    };

    init();

    return () => {
      if (client.current) {
        client.current.leave();
      }
    };
  }, [appId, channel, token, uid]);

  useEffect(() => {
    if (selectedUser && selectedUser.videoTrack) {
        console.log('selectedUser', selectedUser);
      selectedUser.videoTrack.play('remote-video-container');
    }
  }, [selectedUser]);

  const handleUserSelect = (user) => {
    if (selectedUser && selectedUser.videoTrack) {
      selectedUser.videoTrack.stop();
    }
    setSelectedUser(user);
  };

  return (
    <div>
      <h2>Agora Audience</h2>
      {isConnected ? (
        <div>
          <p>Connected to channel. {remoteUsers.length > 0 ? `${remoteUsers.length} streamer(s) available` : 'Waiting for streamers...'}</p>
          <div>
            {remoteUsers.map(user => (
              <button key={user.uid} onClick={() => handleUserSelect(user)}>
                Watch Streamer {user.uid}
              </button>
            ))}
          </div>
          <div 
            id="remote-video-container" 
            style={{ width: '640px', height: '480px', backgroundColor: 'black', margin: '10px 0' }}
          ></div>
        </div>
      ) : (
        <p>Connecting to channel...</p>
      )}
    </div>
  );
};

export default AgoraAudience;
