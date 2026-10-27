import React from 'react';
import { SurakshaChatbot, SurakshaLogo } from './SurakshaChatbot';

// Re-export for backward compatibility with existing imports
export { SurakshaLogo as ArthaSetuLogo };
export const ArthaSetuChatbot: React.FC<{ activeScenarioId?: string }> = (props) => {
  return <SurakshaChatbot {...props} />;
};

export default ArthaSetuChatbot;
