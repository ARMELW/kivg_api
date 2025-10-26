import { env } from 'node:process'
import { AutoContentScriptGenerator } from '../services/ai/autocontent-script-generator.service'
import { DalleImageGenerator } from '../services/ai/dalle-image-generator.service'
import { ElevenLabsVoiceSynthesis } from '../services/ai/elevenlabs-voice-synthesis.service'
import { GeminiImageGenerator } from '../services/ai/gemini-image-generator.service'
import { GeminiScriptGenerator } from '../services/ai/gemini-script-generator.service'
import { MiniMaxVoiceSynthesis } from '../services/ai/minimax-voice-synthesis.service'
import { MubertMusicGenerator } from '../services/ai/mubert-music-generator.service'

/**
 * AI Services Configuration
 * Centralized configuration for all AI services with provider abstraction
 */

// API Keys
export const GEMINI_API_KEY = env.GEMINI_API_KEY || ''
export const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY || ''
export const OPENAI_API_KEY = env.OPENAI_API_KEY || ''
export const MINIMAX_API_KEY = env.MINIMAX_API_KEY || ''
export const MUBERT_API_KEY = env.MUBERT_API_KEY || ''
export const AUTOCONTENT_API_KEY = env.AUTOCONTENT_API_KEY || ''

// Initialize Image Generation Services (multiple providers)
export const geminiImageGenerator = GEMINI_API_KEY ? new GeminiImageGenerator(GEMINI_API_KEY) : null
export const dalleImageGenerator = OPENAI_API_KEY ? new DalleImageGenerator(OPENAI_API_KEY) : null

// Primary image generator (prefer DALL-E for direct generation, fallback to Gemini for prompts)
export const imageGenerator = dalleImageGenerator || geminiImageGenerator

// Initialize Script Generation Services (multiple providers)
export const autoContentScriptGenerator = AUTOCONTENT_API_KEY
  ? new AutoContentScriptGenerator(AUTOCONTENT_API_KEY)
  : null
export const geminiScriptGenerator = GEMINI_API_KEY ? new GeminiScriptGenerator(GEMINI_API_KEY) : null

// Primary script generator (prefer AutoContentAPI, fallback to Gemini)
export const scriptGenerator = autoContentScriptGenerator || geminiScriptGenerator

// Initialize Voice Synthesis Services (multiple providers)
export const elevenLabsVoice = ELEVENLABS_API_KEY ? new ElevenLabsVoiceSynthesis(ELEVENLABS_API_KEY) : null
export const minimaxVoice = MINIMAX_API_KEY ? new MiniMaxVoiceSynthesis(MINIMAX_API_KEY) : null

// Primary voice synthesis (prefer ElevenLabs, fallback to MiniMax)
export const voiceSynthesis = elevenLabsVoice || minimaxVoice

// Initialize Music Generation Service
export const musicGenerator = MUBERT_API_KEY ? new MubertMusicGenerator(MUBERT_API_KEY) : null

/**
 * Check if AI services are available
 */
export const isAIAvailable = () => {
  return {
    imageGenerator: imageGenerator?.isAvailable() || false,
    scriptGenerator: scriptGenerator?.isAvailable() || false,
    voiceSynthesis: voiceSynthesis?.isAvailable() || false,
    musicGenerator: musicGenerator?.isAvailable() || false
  }
}

/**
 * Get available AI providers for each service
 */
export const getAIProviders = () => {
  return {
    imageGenerators: [
      dalleImageGenerator?.isAvailable() && 'dalle',
      geminiImageGenerator?.isAvailable() && 'gemini'
    ].filter(Boolean),
    voiceProviders: [
      elevenLabsVoice?.isAvailable() && 'elevenlabs',
      minimaxVoice?.isAvailable() && 'minimax'
    ].filter(Boolean),
    scriptProviders: [
      autoContentScriptGenerator?.isAvailable() && 'autocontent',
      geminiScriptGenerator?.isAvailable() && 'gemini'
    ].filter(Boolean),
    musicProviders: [musicGenerator?.isAvailable() && 'mubert'].filter(Boolean)
  }
}

/**
 * Voice synthesis configuration (deprecated - now using ElevenLabs/MiniMax)
 * Kept for backward compatibility
 */
export const VOICE_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'] as const

/**
 * Get voices from all available providers
 */
export const getVoices = async (language?: string, provider?: 'elevenlabs' | 'minimax') => {
  // If provider specified, use that specific provider
  if (provider === 'elevenlabs' && elevenLabsVoice) {
    return await elevenLabsVoice.listVoices(language)
  }
  if (provider === 'minimax' && minimaxVoice) {
    return await minimaxVoice.listVoices(language)
  }

  // Otherwise use primary voice synthesis provider
  if (voiceSynthesis) {
    return await voiceSynthesis.listVoices(language)
  }

  // Fallback to static library
  return language ? VOICE_LIBRARY.filter((v) => v.language === language) : VOICE_LIBRARY
}

/**
 * Legacy voice library for backward compatibility when ElevenLabs is not configured
 */
export const VOICE_LIBRARY = [
  // English voices
  { id: 'en-male-1', name: 'James', language: 'en', gender: 'male' as const, style: 'professional' },
  { id: 'en-male-2', name: 'David', language: 'en', gender: 'male' as const, style: 'casual' },
  { id: 'en-male-3', name: 'Michael', language: 'en', gender: 'male' as const, style: 'narrative' },
  { id: 'en-female-1', name: 'Emma', language: 'en', gender: 'female' as const, style: 'professional' },
  { id: 'en-female-2', name: 'Sarah', language: 'en', gender: 'female' as const, style: 'friendly' },
  { id: 'en-female-3', name: 'Olivia', language: 'en', gender: 'female' as const, style: 'narrative' },

  // Spanish voices
  { id: 'es-male-1', name: 'Carlos', language: 'es', gender: 'male' as const, style: 'professional' },
  { id: 'es-male-2', name: 'Diego', language: 'es', gender: 'male' as const, style: 'casual' },
  { id: 'es-female-1', name: 'Sofia', language: 'es', gender: 'female' as const, style: 'professional' },
  { id: 'es-female-2', name: 'Maria', language: 'es', gender: 'female' as const, style: 'friendly' },

  // French voices
  { id: 'fr-male-1', name: 'Pierre', language: 'fr', gender: 'male' as const, style: 'professional' },
  { id: 'fr-male-2', name: 'Luc', language: 'fr', gender: 'male' as const, style: 'casual' },
  { id: 'fr-female-1', name: 'Amelie', language: 'fr', gender: 'female' as const, style: 'professional' },
  { id: 'fr-female-2', name: 'Marie', language: 'fr', gender: 'female' as const, style: 'friendly' },

  // German voices
  { id: 'de-male-1', name: 'Hans', language: 'de', gender: 'male' as const, style: 'professional' },
  { id: 'de-male-2', name: 'Klaus', language: 'de', gender: 'male' as const, style: 'casual' },
  { id: 'de-female-1', name: 'Anna', language: 'de', gender: 'female' as const, style: 'professional' },
  { id: 'de-female-2', name: 'Greta', language: 'de', gender: 'female' as const, style: 'friendly' },

  // Italian voices
  { id: 'it-male-1', name: 'Marco', language: 'it', gender: 'male' as const, style: 'professional' },
  { id: 'it-male-2', name: 'Giovanni', language: 'it', gender: 'male' as const, style: 'casual' },
  { id: 'it-female-1', name: 'Isabella', language: 'it', gender: 'female' as const, style: 'professional' },
  { id: 'it-female-2', name: 'Lucia', language: 'it', gender: 'female' as const, style: 'friendly' },

  // Portuguese voices
  { id: 'pt-male-1', name: 'João', language: 'pt', gender: 'male' as const, style: 'professional' },
  { id: 'pt-male-2', name: 'Pedro', language: 'pt', gender: 'male' as const, style: 'casual' },
  { id: 'pt-female-1', name: 'Ana', language: 'pt', gender: 'female' as const, style: 'professional' },
  { id: 'pt-female-2', name: 'Beatriz', language: 'pt', gender: 'female' as const, style: 'friendly' },

  // Russian voices
  { id: 'ru-male-1', name: 'Ivan', language: 'ru', gender: 'male' as const, style: 'professional' },
  { id: 'ru-male-2', name: 'Dmitri', language: 'ru', gender: 'male' as const, style: 'casual' },
  { id: 'ru-female-1', name: 'Natasha', language: 'ru', gender: 'female' as const, style: 'professional' },
  { id: 'ru-female-2', name: 'Olga', language: 'ru', gender: 'female' as const, style: 'friendly' },

  // Japanese voices
  { id: 'ja-male-1', name: 'Takeshi', language: 'ja', gender: 'male' as const, style: 'professional' },
  { id: 'ja-male-2', name: 'Hiroshi', language: 'ja', gender: 'male' as const, style: 'casual' },
  { id: 'ja-female-1', name: 'Sakura', language: 'ja', gender: 'female' as const, style: 'professional' },
  { id: 'ja-female-2', name: 'Yuki', language: 'ja', gender: 'female' as const, style: 'friendly' },

  // Korean voices
  { id: 'ko-male-1', name: 'Min-jun', language: 'ko', gender: 'male' as const, style: 'professional' },
  { id: 'ko-male-2', name: 'Jin-woo', language: 'ko', gender: 'male' as const, style: 'casual' },
  { id: 'ko-female-1', name: 'Soo-jin', language: 'ko', gender: 'female' as const, style: 'professional' },
  { id: 'ko-female-2', name: 'Ji-woo', language: 'ko', gender: 'female' as const, style: 'friendly' },

  // Chinese voices
  { id: 'zh-male-1', name: 'Wei', language: 'zh', gender: 'male' as const, style: 'professional' },
  { id: 'zh-male-2', name: 'Li', language: 'zh', gender: 'male' as const, style: 'casual' },
  { id: 'zh-female-1', name: 'Mei', language: 'zh', gender: 'female' as const, style: 'professional' },
  { id: 'zh-female-2', name: 'Ling', language: 'zh', gender: 'female' as const, style: 'friendly' },

  // Additional voices to reach 50
  { id: 'en-male-4', name: 'William', language: 'en', gender: 'male' as const, style: 'educational' },
  { id: 'en-male-5', name: 'Robert', language: 'en', gender: 'male' as const, style: 'dramatic' },
  { id: 'en-female-4', name: 'Charlotte', language: 'en', gender: 'female' as const, style: 'educational' },
  { id: 'en-female-5', name: 'Sophia', language: 'en', gender: 'female' as const, style: 'dramatic' },
  { id: 'es-male-3', name: 'Antonio', language: 'es', gender: 'male' as const, style: 'narrative' },
  { id: 'es-female-3', name: 'Carmen', language: 'es', gender: 'female' as const, style: 'narrative' },
  { id: 'fr-male-3', name: 'Jacques', language: 'fr', gender: 'male' as const, style: 'narrative' },
  { id: 'fr-female-3', name: 'Chloe', language: 'fr', gender: 'female' as const, style: 'narrative' },
  { id: 'de-male-3', name: 'Wolfgang', language: 'de', gender: 'male' as const, style: 'narrative' },
  { id: 'de-female-3', name: 'Heidi', language: 'de', gender: 'female' as const, style: 'narrative' },
  { id: 'it-male-3', name: 'Alessandro', language: 'it', gender: 'male' as const, style: 'narrative' },
  { id: 'it-female-3', name: 'Francesca', language: 'it', gender: 'female' as const, style: 'narrative' }
]

export const getVoicesByLanguage = (language: string) => {
  return VOICE_LIBRARY.filter((v) => v.language === language)
}
