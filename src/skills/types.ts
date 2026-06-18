import { Context } from 'telegraf';

/**
 * Skill Interface
 * 
 * All skills must implement this interface to be compatible with the SkillManager.
 */
export interface Skill {
  /** Unique skill identifier */
  name: string;
  
  /** Skill version (semver) */
  version: string;
  
  /** Human-readable description */
  description: string;
  
  /** Author or maintainer */
  author?: string;
  
  /** Telegram commands provided by this skill */
  commands: string[];
  
  /**
   * Initialize the skill
   * Called when skill is loaded by SkillManager
   */
  initialize(): Promise<void>;
  
  /**
   * Handle command interaction
   * @param ctx - The Telegram context
   */
  handleCommand(ctx: Context): Promise<void>;
  
  /**
   * Cleanup and destroy the skill
   * Called when skill is unloaded
   */
  destroy(): Promise<void>;
  
  /**
   * Get skill metadata
   */
  getMetadata(): SkillMetadata;
}

/**
 * Skill Metadata
 */
export interface SkillMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  commands: string[];
  enabled: boolean;
}

/**
 * Skill Configuration
 */
export interface SkillConfig {
  enabled: boolean;
  [key: string]: any;
}

/**
 * Skill Registry Interface
 */
export interface ISkillRegistry {
  register(skill: Skill): void;
  unregister(name: string): boolean;
  getSkill(name: string): Skill | undefined;
  getAllSkills(): Skill[];
  hasSkill(name: string): boolean;
}
