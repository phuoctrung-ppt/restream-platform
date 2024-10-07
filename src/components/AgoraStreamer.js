import React, { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const AgoraStreamer = ({ appId, channel, token, uid }) => {
  const [rtc, setRtc] = useState({
    localAudioTrack: null,
    localVideoTrack: null,
    client: null,
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStreamingInstagram, setIsStreamingInstagram] = useState(false);
  const [model, setModel] = useState(null);
  const [brightness, setBrightness] = useState(0);
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

  const startStreaming = async () => {
    const { client } = rtc;
    if (!client) return;

    try {
      await client.join(appId, channel, token, uid);
      const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: 'high',
        optimizationMode: 'detail'
      });
      setRtc(prev => ({
        ...prev,
        localAudioTrack: microphoneTrack,
        localVideoTrack: screenTrack
      }));

      await client.setClientRole("host");
      await client.publish([microphoneTrack, screenTrack]);

      screenTrack.play(localVideoRef.current);
      setIsStreaming(true);
      console.log("Streaming started successfully");

      // Start processing frames
      processFrames(screenTrack);
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

  const stopStreaming = async () => {
    const { client, localAudioTrack, localVideoTrack } = rtc;
    if (localAudioTrack) await localAudioTrack.stop();
    if (localVideoTrack) await localVideoTrack.stop();
    await client.unpublish();
    await client.leave();
    setIsStreaming(false);
    setIsStreamingInstagram(false);
    console.log("Streaming stopped");
  };

  const startStreamingInstagram = async () => {
    const { client } = rtc;
    if (!client) return;
    
    const facebookRtmpUrl =
      "";

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
          uid: uid,
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
    // await client.setLiveTranscoding(transcodingConfig);
   
    // Start streaming to Facebook
    await client.startLiveStreaming(facebookRtmpUrl, false);
    setIsStreamingInstagram(true);
    console.log("Streaming started to Facebook RTMP!");
  };

  const stopStreamingInstagram = async () => {
    if (!rtc.client) return;

    await rtc.client.stopLiveStreaming(
      "rtmp://live.restream.io/live/re_8606380_b3ccbc1c10a7987ea56e"
    );
    setIsStreamingInstagram(false);
    console.log("Streaming stopped.");
  };

  const processFrames = (videoTrack) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const processFrame = async () => {
      if (videoTrack && model) {
        const videoElement = localVideoRef.current.querySelector('video');
        if (videoElement) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

          // Apply brightness filter
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          const brightnessFactor = 1 + brightness / 100;

          for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.min(255, pixels[i] * brightnessFactor);
            pixels[i + 1] = Math.min(255, pixels[i + 1] * brightnessFactor);
            pixels[i + 2] = Math.min(255, pixels[i + 2] * brightnessFactor);
          }

          ctx.putImageData(imageData, 0, 0);

          // Face detection
          const predictions = await model.estimateFaces(canvas, false);
          predictions.forEach(prediction => {
            const start = prediction.topLeft;
            const end = prediction.bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(start[0], start[1], size[0], size[1]);
          });
        }
      }
      requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  const handleBrightnessChange = (event) => {
    setBrightness(Number(event.target.value));
  };

  return (
    <div>
      <h2>Agora Streamer with TensorFlow Face Detection and Brightness Filter</h2>
      <div ref={localVideoRef} style={{ width: '640px', height: '480px', backgroundColor: 'black' }}></div>
      <div>
        <label htmlFor="brightness">Brightness: </label>
        <input 
          type="range" 
          id="brightness" 
          name="brightness" 
          min="-100" 
          max="100" 
          value={brightness} 
          onChange={handleBrightnessChange}
        />
      </div>
      <button onClick={startStreaming} disabled={isStreaming}>Start Streaming</button>
      <button onClick={stopStreaming} disabled={!isStreaming}>Stop Streaming</button>
      <button onClick={startStreamingInstagram} disabled={isStreamingInstagram}>
          Start Streaming to Instagram
        </button>
        <button onClick={stopStreamingInstagram} disabled={!isStreamingInstagram}>
          Stop Streaming
        </button>
    </div>
  );
};

export default AgoraStreamer;