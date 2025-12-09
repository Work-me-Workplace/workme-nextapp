#!/usr/bin/env node

/**
 * Prisma Safety Guard - Node.js version
 * Prevents accidental data loss from destructive Prisma commands
 * 
 * Usage: node scripts/safe-prisma.js <prisma-command> [args...]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DESTRUCTIVE_FLAGS = [
  '--force-reset',
  '--reset',
  '--accept-data-loss',
  '--skip-seed'
];

const DESTRUCTIVE_COMMANDS = [
  'migrate reset',
  'db push --force-reset',
  'db push --reset'
];

function checkForDestructiveOperation(args) {
  const fullCommand = args.join(' ');
  
  // Check for destructive flags
  for (const flag of DESTRUCTIVE_FLAGS) {
    if (args.includes(flag)) {
      return {
        blocked: true,
        reason: `Destructive flag detected: ${flag}`,
        flag
      };
    }
  }
  
  // Check for destructive command patterns
  for (const pattern of DESTRUCTIVE_COMMANDS) {
    if (fullCommand.includes(pattern)) {
      return {
        blocked: true,
        reason: `Destructive command pattern detected: ${pattern}`,
        pattern
      };
    }
  }
  
  return { blocked: false };
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Error: No Prisma command provided');
    console.log('Usage: node scripts/safe-prisma.js <prisma-command> [args...]');
    process.exit(1);
  }
  
  const check = checkForDestructiveOperation(args);
  
  if (check.blocked) {
    console.error('\n❌ BLOCKED: Destructive operation detected!');
    console.error(`   ${check.reason}`);
    console.error('\n   This operation would cause DATA LOSS!');
    console.error('\nIf you REALLY need to do this, you must:');
    console.error('  1. Set ALLOW_DESTRUCTIVE_PRISMA=1 in your environment');
    console.error('  2. Or use npx prisma directly (bypassing this guard)');
    console.error('\n');
    process.exit(1);
  }
  
  // Check for override
  if (process.env.ALLOW_DESTRUCTIVE_PRISMA === '1') {
    console.warn('⚠️  WARNING: Destructive operations allowed via ALLOW_DESTRUCTIVE_PRISMA=1');
    console.warn('   Proceeding with caution...\n');
  }
  
  // Safe to proceed
  console.log('✅ Command is safe, proceeding...\n');
  
  try {
    execSync(`npx prisma ${args.join(' ')}`, { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkForDestructiveOperation };

