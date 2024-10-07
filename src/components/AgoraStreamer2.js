import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";

const AgoraStreamer2 = ({ appId, channel, token, uid }) => {
  const [rtc, setRtc] = useState({
    localAudioTrack: null,
    localVideoTrack: null,
    client: null,
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const localVideoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const client = AgoraRTC.createClient({ mode: "live", codec: "h264" });
    setRtc({ client });
    return () => {
      if (rtc.localAudioTrack) rtc.localAudioTrack.close();
      if (rtc.localVideoTrack) rtc.localVideoTrack.close();
      client.leave();
    };
  }, []);

  const initializeCanvas = () => {
    const videoElement = localVideoRef.current.querySelector('video');
    const canvas = canvasRef.current;
    if (videoElement && canvas) {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    }
  };

  const startStreaming = async () => {
    const { client } = rtc;
    if (!client) return;

    try {
      await client.join(appId, channel, token, uid);
      console.log("Joined channel successfully", uid);

      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      console.log("Created audio and video tracks");

      cameraTrack.play(localVideoRef.current);
      
      cameraTrack.on('first-frame-decoded', () => {
        initializeCanvas();
        
        const canvasStream = canvasRef.current.captureStream(30);
        const customTrack = AgoraRTC.createCustomVideoTrack({
          mediaStreamTrack: canvasStream.getVideoTracks()[0],
        });

        setRtc(prev => ({
          ...prev,
          localAudioTrack: microphoneTrack,
          localVideoTrack: cameraTrack
        }));

        client.setClientRole("host").then(() => {
          client.publish([microphoneTrack, customTrack]);
          console.log("Published custom video track");
        });

        setIsStreaming(true);
        console.log("Streaming started successfully");

        processFrames(cameraTrack);
      });
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

  const stopStreaming = async () => {
    const { client, localAudioTrack, localVideoTrack } = rtc;
    if (localAudioTrack) {
      await localAudioTrack.stop();
      await client.unpublish(localAudioTrack);
    }
    if (localVideoTrack) {
      await localVideoTrack.stop();
      await client.unpublish(localVideoTrack);
    }
    if (client && client.connectionState === 'CONNECTED') {
      await client.leave();
    }
    setIsStreaming(false);
    console.log("Streaming stopped");
  };

  const processFrames = (videoTrack) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const processFrame = () => {
      const videoElement = localVideoRef.current.querySelector('video');
      if (videoElement) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        // Add any custom drawing or effects here
      }
      requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  return (
    <div>
      <h2>Agora Streamer 2 with Custom Video</h2>
      <div 
        ref={localVideoRef} 
        style={{ width: '640px', height: '480px', backgroundColor: 'black' }}
      ></div>
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      ></canvas>
      <button onClick={startStreaming} disabled={isStreaming}>Start Streaming</button>
      <button onClick={stopStreaming} disabled={!isStreaming}>Stop Streaming</button>
    </div>
  );
};

export default AgoraStreamer2;