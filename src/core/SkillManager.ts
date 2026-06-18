import { SkillRegistry } from '../skills/SkillRegistry';
import { Skill } from '../skills/types';
import { Context } from 'telegraf';
import { logger } from '../utils/logger';

/**
 * Skill Manager
 * 
 * Manages the lifecycle of skills including loading, initialization,
 * command handling, and cleanup.
 */
export class SkillManager {
  private registry: SkillRegistry;
  private initialized: boolean = false;
  
  constructor() {
    this.registry = new SkillRegistry();
  }
  
  /**
   * Initialize the skill manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('SkillManager is already initialized');
      return;
    }
    
    logger.info('Initializing SkillManager...');
    this.initialized = true;
    logger.info('SkillManager initialized');
  }
  
  /**
   * Register a skill
   * @param skill - The skill to register
   */
  async registerSkill(skill: Skill): Promise<void> {
    try {
      // Register in registry
      this.registry.register(skill);
      
      // Initialize the skill
      await skill.initialize();
      
      logger.info(`Skill "${skill.name}" registered and initialized successfully`);
    } catch (error) {
      logger.error(`Failed to register skill "${skill.name}":`, error);
      throw error;
    }
  }
  
  /**
   * Unregister a skill
   * @param name - The skill name to unregister
   */
  async unregisterSkill(name: string): Promise<void> {
    const skill = this.registry.getSkill(name);
    
    if (!skill) {
      logger.warn(`Skill "${name}" not found`);
      return;
    }
    
    try {
      // Destroy the skill
      await skill.destroy();
      
      // Remove from registry
      this.registry.unregister(name);
      
      logger.info(`Skill "${name}" unregistered successfully`);
    } catch (error) {
      logger.error(`Failed to unregister skill "${name}":`, error);
      throw error;
    }
  }
  
  /**
   * Handle a command interaction
   * Routes the interaction to the appropriate skill
   * @param ctx - The Telegram context
   */
  async handleCommand(ctx: Context, commandName: string): Promise<void> {
    // Find which skill owns this command
    const skill = this.findSkillForCommand(commandName);
    
    if (!skill) {
      logger.warn(`No skill found for command: ${commandName}`);
      return;
    }
    
    try {
      // Delegate to the skill's handler
      await skill.handleCommand(ctx);
    } catch (error) {
      logger.error(`Error handling command "${commandName}" in skill "${skill.name}":`, error);
      
      await ctx.reply('❌ An error occurred while processing your command');
    }
  }
  
  /**
   * Find the skill that owns a specific command
   * @param commandName - The command name
   * @returns The skill or undefined
   */
  private findSkillForCommand(commandName: string): Skill | undefined {
    const skills = this.registry.getAllSkills();
    
    for (const skill of skills) {
      const hasCommand = skill.commands.some(cmd => cmd === commandName);
      if (hasCommand) {
        return skill;
      }
    }
    
    return undefined;
  }
  
  /**
   * Get all registered skills
   */
  getAllSkills(): Skill[] {
    return this.registry.getAllSkills();
  }
  
  /**
   * Get a specific skill by name
   */
  getSkill(name: string): Skill | undefined {
    return this.registry.getSkill(name);
  }
  
  /**
   * Get skill count
   */
  getSkillCount(): number {
    return this.registry.getSkillCount();
  }
  
  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Shutdown the skill manager
   * Destroys all registered skills
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    logger.info('Shutting down SkillManager...');
    
    const skills = this.registry.getAllSkills();
    
    // Destroy all skills
    for (const skill of skills) {
      try {
        await skill.destroy();
      } catch (error) {
        logger.error(`Error destroying skill "${skill.name}":`, error);
      }
    }
    
    // Clear registry
    this.registry.clear();
    this.initialized = false;
    
    logger.info('SkillManager shut down successfully');
  }
}
