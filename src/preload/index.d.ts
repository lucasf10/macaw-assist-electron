import { ElectronAPI } from '@electron-toolkit/preload'

interface CustomIPCFunctions {
  saveAudio(audioBuffer: ArrayBuffer, fileName: string): void
  onSaveAudioResponse(callback: (event: Event, response: any) => void): void
}

declare global {
  interface Window {
    electron: ElectronAPI & CustomIPCFunctions
    api: unknown
  }
}
