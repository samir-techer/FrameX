// ==========================================================================
// FrameX — App Constants
// ==========================================================================

export const AppRoutes = {
  login: 'index.html',
  home: 'home.html',
  editor: 'editor.html',
  export: 'export.html',
};

export const FREE_MAX_PROJECTS = 5;

export const EXPORT_RESOLUTIONS = [
  { label: '480p', width: 854, height: 480, requiresPremium: false },
  { label: '720p', width: 1280, height: 720, requiresPremium: false },
  { label: '1080p', width: 1920, height: 1080, requiresPremium: false },
  { label: '1440p', width: 2560, height: 1440, requiresPremium: true },
  { label: '4K', width: 3840, height: 2160, requiresPremium: true },
];

export const EXPORT_FRAME_RATES = [24, 30, 60];
export const EXPORT_FORMATS = ['MP4', 'MOV', 'GIF'];
export const EXPORT_BITRATES_MBPS = [4, 8, 12, 20, 40];

export const TRANSITIONS = ['Fade', 'Zoom', 'Blur', 'Slide', 'Spin', 'Flash', 'Warp'];
export const EFFECTS = ['VHS', 'RGB', 'Glitch', 'Film Grain', 'Motion Blur', 'Cinematic', 'Retro', 'Neon', 'Lens Distortion'];
export const FILTERS = ['Warm', 'Cool', 'Vintage', 'Black & White', 'HDR', 'Cinematic LUT'];

export const AI_TOOLS = [
  { id: 'captions', label: 'Auto Captions', icon: '💬' },
  { id: 'bg-remove', label: 'Background Removal', icon: '🪄' },
  { id: 'obj-remove', label: 'Object Removal', icon: '✂️' },
  { id: 'voice-enhance', label: 'Voice Enhancement', icon: '🎙️' },
  { id: 'noise-remove', label: 'Noise Removal', icon: '🔇' },
  { id: 'thumbnail', label: 'Thumbnail Generator', icon: '🖼️' },
  { id: 'scene-detect', label: 'Scene Detection', icon: '🎬' },
  { id: 'highlights', label: 'Highlight Generator', icon: '✨' },
  { id: 'smart-crop', label: 'Smart Crop', icon: '🎯' },
  { id: 'enhance', label: 'Video Enhancement', icon: '📈' },
];
