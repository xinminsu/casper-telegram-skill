import { Skill, SkillMetadata } from './types';
import { Context } from 'telegraf';

/**
 * Abstract Base Skill
 * 
 * Provides common functionality for all skills.
 * Extend this class to create new skills.
 */
export abstract class BaseSkill implements Skill {
  public readonly name: string;
  public readonly version: string;
  public readonly description: string;
  public readonly author?: string;
  public readonly commands: string[];
  
  protected initialized: boolean = false;
  
  constructor(options: {
    name: string;
    version: string;
    description: string;
    author?: string;
    commands: string[];
  }) {
    this.name = options.name;
    this.version = options.version;
    this.description = options.description;
    this.author = options.author;
    this.commands = options.commands;
  }
  
  /**
   * Initialize the skill
   * Override this method to add custom initialization logic
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error(`Skill ${this.name} is already initialized`);
    }
    
    console.log(`Initializing skill: ${this.name} v${this.version}`);
    this.initialized = true;
  }
  
  /**
   * Handle command interaction
   * Must be implemented by concrete skill classes
   */
  abstract handleCommand(ctx: Context): Promise<void>;
  
  /**
   * Destroy the skill
   * Override this method to add custom cleanup logic
   */
  async destroy(): Promise<void> {
    if (!this.initialized) {
      console.warn(`Skill ${this.name} is not initialized`);
      return;
    }
    
    console.log(`Destroying skill: ${this.name}`);
    this.initialized = false;
  }
  
  /**
   * Get skill metadata
   */
  getMetadata(): SkillMetadata {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      author: this.author,
      commands: this.commands,
      enabled: this.initialized,
    };
  }
  
  /**
   * Check if skill is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
