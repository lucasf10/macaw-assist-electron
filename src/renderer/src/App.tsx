import { MutableRefObject, useEffect, useRef, useState } from 'react';

import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): JSX.Element {
  const [isRecording, setIsRecording] = useState(false);
  const systemMediaRecorder = useRef<MediaRecorder | null>(null);
  const micMediaRecorder = useRef<MediaRecorder | null>(null);
  const systemStream = useRef<MediaStream | null>(null);
  const micStream = useRef<MediaStream | null>(null);

  const setUpMediaStream = async () => {
    systemStream.current = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: true,
    });
    micStream.current = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
  }

  const stopTracks = () => {
    systemStream.current?.getTracks().forEach((track) => track.stop());
    micStream.current?.getTracks().forEach((track) => track.stop());
  }

  useEffect(() => {
    setUpMediaStream();

    return stopTracks;
  }, []);

  const recordAudio = (
    track: MediaStreamTrack,
    recorder: MutableRefObject<MediaRecorder | null>,
    source: 'mic' | 'system',
  ) => {
    const mediaStream = new MediaStream();
    mediaStream.addTrack(track)

    const options = { mimeType: "audio/webm" };
    recorder.current = new MediaRecorder(mediaStream, options);
    const audioChunks: Blob[] = [];

    recorder.current.ondataavailable = (event: BlobEvent) => {
      audioChunks.push(event.data);
    };

    recorder.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();

        const date = new Date();
        const dateString = date.toISOString().split('T')[0];
        const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        const fileName = `record_${source}_${dateString}_${timeString}.webm`;

        window.electron.saveAudio(arrayBuffer, fileName);
        window.electron.onSaveAudioResponse((_, response: any) => {
          if (response.success) {
            console.log('File saved successfully', response.filePath);
          } else {
            console.error('Error saving audio', response.error);
          }
        });
      } catch (error) {
        console.error("error saving audio", error);
      }
    };

    recorder.current.start();
  }

  const stopRecordingSystemAudio = () => {
    if (systemStream.current) {
      systemMediaRecorder?.current?.stop();
    }
  }

  const stopRecordingMicAudio = () => {
    if (micStream.current) {
      micMediaRecorder?.current?.stop();
    }
  }

  const stopRecordingAudios = () => {
    setIsRecording(false);
    stopRecordingMicAudio();
    stopRecordingSystemAudio();
  }

  const recordBothAudios = () => {
    if (!isRecording && micStream.current && systemStream.current) {
      const micTrack = micStream.current.getAudioTracks()[0];
      const systemTrack = systemStream.current.getAudioTracks()[0];
      recordAudio(micTrack, micMediaRecorder, 'mic');
      recordAudio(systemTrack, systemMediaRecorder, 'system');
      setIsRecording(true);
    } else {
      stopRecordingAudios();
    }
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Macaw Assist, an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
      <div className="action">
          <a target="_blank" rel="noreferrer" onClick={recordBothAudios}>
            {!isRecording ? 'Start Recording' : 'Stop Recording'}
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
