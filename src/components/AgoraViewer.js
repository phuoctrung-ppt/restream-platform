import React, { useState, useEffect } from "react";
import AgoraRTC from "agora-rtc-react";

const AgoraLiveStreaming = () => {
  const [rtc, setRtc] = useState({
    localAudioTrack: null,
    localVideoTrack: null,
    client: null,
  });

  const options = {
    appId: '47dd68489ac045db95646987ec275579', // Replace with your Agora App ID
    channel: "app-test", // Channel name
    token:
      "007eJxTYFgY/dRvg0h0pczRxStOKia+lenNitvqGzj52Vz1lK48PiMFBhPzlBQzCxMLy8RkAxPTlCRLUzMTM0sL89RkI3NTU3PLI1OY0hsCGRk8aq6wMjJAIIjPwZBYUKBbklpcwsAAAHZ0H28=", // Agora temporary token
      uid: 123456
  };

  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const client = AgoraRTC.createClient({
      mode: "live",
      codec: "h264",
    });
    

    setRtc((prev) => ({
      ...prev,
      client,
    }));


    return () => {
      if (rtc.localAudioTrack) rtc.localAudioTrack.close();
      if (rtc.localVideoTrack) rtc.localVideoTrack.close();
    };
  }, []);

  

  const startHost = async () => {
    const { client } = rtc;
    if (!client) return;


    console.log('------------------------app ID ---------------', options.appId)

    // Join the channel with the appId and token
    await client.join(options.appId, options.channel, options.token);

    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    const localVideoTrack = await AgoraRTC.createCameraVideoTrack();

    setRtc((prev) => ({
      ...prev,
      localAudioTrack,
      localVideoTrack,
    }));
    await client.setClientRole("host");
    await client.publish([localAudioTrack, localVideoTrack]);

    // Create a video container for local video stream
    const localPlayerContainer = document.createElement("div");
    localPlayerContainer.id = client.uid; // Ensure client uid is used here
    localPlayerContainer.textContent = "Local user " + client.uid;
    localPlayerContainer.style.width = "640px";
    localPlayerContainer.style.height = "480px";
    document.body.append(localPlayerContainer);

    localVideoTrack.play(localPlayerContainer);
    console.log("Host publish success!");
  };

  const startStreaming = async () => {
    const { client } = rtc;
    if (!client) return;
    
    const facebookRtmpUrl =
      "rtmps://live-api-s.facebook.com:443/rtmp/FB-1999884220442674-0-AbwuZJK2VrWDd_x1";

    // Set transcoding configuration
    const transcodingConfig = {
      width: 1280,
      height: 720,
      videoBitrate: 2500,
      videoFramerate: 30,
      lowLatency: false,
      audioSampleRate: 48000,
      audioBitrate: 128,
      audioChannels: 2,
      videoGop: 30,
      videoCodecProfile: 100, // HIGH
      backgroundColor: 0x000000,
      userCount: 1,
      transcodingUsers: [
        {
          uid: options.uid,
          x: 0,
          y: 0,
          width: 1280,
          height: 720,
          zOrder: 1,
          alpha: 1.0,
          audioChannel: 0,
        },
      ],
    };
    
    console.log('client.connectionState', client.connectionState)
    // Apply transcoding config
    await client.setLiveTranscoding(transcodingConfig);
   
    // Start streaming to Facebook
    await client.startLiveStreaming(facebookRtmpUrl, true);
    setIsStreaming(true);
    console.log("Streaming started to Facebook RTMP!");
  };

  const stopStreaming = async () => {
    if (!rtc.client) return;

    await rtc.client.stopLiveStreaming(
      "rtmps://live-api-s.facebook.com:443/rtmp/FB-1999884220442674-0-AbwuZJK2VrWDd_x1"
    );
    setIsStreaming(false);
    console.log("Streaming stopped.");
  };

  return (
    <div>
      <button onClick={startHost}>Join as Host</button>
      <div>
        <button onClick={startStreaming} disabled={isStreaming}>
          Start Streaming to Instagram
        </button>
        <button onClick={stopStreaming} disabled={!isStreaming}>
          Stop Streaming
        </button>
      </div>
    </div>
  );
};

export default AgoraLiveStreaming;
