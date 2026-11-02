import React from 'react';
import { AudioVisualizer } from './AudioVisualizer';
import { VisualizerStyle } from '../services/storage';

interface AudioWaveLineProps {
  isPlaying: boolean;
  style?: VisualizerStyle;
  className?: string;
}

export const AudioWaveLine: React.FC<AudioWaveLineProps> = (props) => {
  return <AudioVisualizer {...props} />;
};
