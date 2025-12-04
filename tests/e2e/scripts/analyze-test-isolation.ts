#!/usr/bin/env npx tsx
/**
 * Test Isolation Analyzer
 *
 * Analyzes test files to detect potential database isolation issues.
 * Looks for patterns that indicate database mutations without proper isolation.
 *
 * Usage:
 *   npx tsx tests/e2e/scripts/analyze-test-isolation.ts
 *   npx tsx tests/e2e/scripts/analyze-test-isolation.ts --strict
 */

import * as fs from 'fs';
import * as path from 'path';

type IssueLevel = 'error' | 'warning' | 'info';

type Issue = {
  file: string;
  line: number;
  level: IssueLevel;
  message: string;
  suggestion: string;
};

// Patterns that indicate database mutations
const MUTATION_PATTERNS = [
  { pattern: /\.deleteMany\s*\(/g, name: 'deleteMany' },
  { pattern: /\.delete\s*\(/g, name: 'delete' },
  { pattern: /\.createMany\s*\(/g, name: 'createMany' },
  { pattern: /\.create\s*\(/g, name: 'create' },
  { pattern: /\.update\s*\(/g, name: 'update' },
  { pattern: /\.updateMany\s*\(/g, name: 'updateMany' },
  { pattern: /\.upsert\s*\(/g, name: 'upsert' },
];

// Patterns that indicate proper isolation
const ISOLATION_PATTERNS = [
  /database\.isolate\s*\(/,
  /database\.withSnapshot\s*\(/,
  /database\.withTransaction\s*\(/,
  /\.beforeAll\s*\(/,
  /\.beforeEach\s*\(/,
];

// Patterns that indicate test structure
const TEST_DESCRIBE_PARALLEL = /test\.describe\.parallel\s*\(/g;
const TEST_DESCRIBE_SERIAL = /test\.describe\.serial\s*\(/g;
const TEST_BLOCK = /test\s*\(\s*['"`]/g;

function findLineNumber(content: string, index: number): number {
  return content.substring(0, index).split('\n').length;
}

function analyzeFile(filePath: string): Issue[] {
  const issues: Issue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  // Check if file uses database fixture
  const usesDatabase =
    content.includes('database') && content.includes('prisma');
  if (!usesDatabase) {
    return issues;
  }

  // Find all test blocks and their contexts
  const lines = content.split('\n');

  // Track which describe blocks are parallel vs serial
  let inParallelBlock = false;
  let parallelBlockDepth = 0;
  let currentBlockStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    // Track parallel/serial blocks
    if (line.match(/test\.describe\.parallel\s*\(/)) {
      inParallelBlock = true;
      parallelBlockDepth++;
      currentBlockStart = lineNum;
    } else if (line.match(/test\.describe\.serial\s*\(/)) {
      if (parallelBlockDepth === 0) {
        inParallelBlock = false;
      }
    }

    // Track block endings (simple heuristic)
    if (line.match(/^\s*}\s*\)\s*;?\s*$/)) {
      if (parallelBlockDepth > 0) {
        parallelBlockDepth--;
        if (parallelBlockDepth === 0) {
          inParallelBlock = false;
        }
      }
    }

    // Check for mutations
    for (const { pattern, name } of MUTATION_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        // Check if this line or nearby lines have isolation
        const contextStart = Math.max(0, i - 20);
        const contextEnd = Math.min(lines.length, i + 5);
        const context = lines.slice(contextStart, contextEnd).join('\n');

        const hasIsolation = ISOLATION_PATTERNS.some((p) => p.test(context));

        if (!hasIsolation) {
          if (inParallelBlock) {
            issues.push({
              file: relativePath,
              line: lineNum,
              level: 'error',
              message: `Database mutation '${name}' in parallel test block without isolation`,
              suggestion:
                'Move to serial block or wrap with database.isolate()',
            });
          } else {
            issues.push({
              file: relativePath,
              line: lineNum,
              level: 'warning',
              message: `Database mutation '${name}' without explicit isolation`,
              suggestion:
                'Consider using database.isolate() or database.withSnapshot()',
            });
          }
        }
      }
    }
  }

  // Check for parallel blocks that might conflict with other files
  const hasParallelTests = TEST_DESCRIBE_PARALLEL.test(content);
  const hasMutations = MUTATION_PATTERNS.some((p) => {
    p.pattern.lastIndex = 0;
    return p.pattern.test(content);
  });

  if (hasParallelTests && hasMutations) {
    issues.push({
      file: relativePath,
      line: 1,
      level: 'info',
      message:
        'File has both parallel tests and database mutations - may conflict with other test files',
      suggestion:
        'Consider using testIgnore in playwright.config.ts or separate projects',
    });
  }

  return issues;
}

function findTestFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.spec.ts')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function main() {
  const args = process.argv.slice(2);
  const strictMode = args.includes('--strict');
  const testDir =
    args.find((a) => !a.startsWith('--')) || 'tests/e2e/suites';

  // eslint-disable-next-line no-console
  console.log('🔍 Analyzing test files for isolation issues...\n');

  const testFiles = findTestFiles(testDir);
  const allIssues: Issue[] = [];

  for (const file of testFiles) {
    const issues = analyzeFile(file);
    allIssues.push(...issues);
  }

  // Group issues by level
  const errors = allIssues.filter((i) => i.level === 'error');
  const warnings = allIssues.filter((i) => i.level === 'warning');
  const infos = allIssues.filter((i) => i.level === 'info');

  // Print results
  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.log('❌ ERRORS:\n');
    for (const issue of errors) {
      // eslint-disable-next-line no-console
      console.log(`  ${issue.file}:${issue.line}`);
      // eslint-disable-next-line no-console
      console.log(`    ${issue.message}`);
      // eslint-disable-next-line no-console
      console.log(`    💡 ${issue.suggestion}\n`);
    }
  }

  if (warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.log('⚠️  WARNINGS:\n');
    for (const issue of warnings) {
      // eslint-disable-next-line no-console
      console.log(`  ${issue.file}:${issue.line}`);
      // eslint-disable-next-line no-console
      console.log(`    ${issue.message}`);
      // eslint-disable-next-line no-console
      console.log(`    💡 ${issue.suggestion}\n`);
    }
  }

  if (infos.length > 0) {
    // eslint-disable-next-line no-console
    console.log('ℹ️  INFO:\n');
    for (const issue of infos) {
      // eslint-disable-next-line no-console
      console.log(`  ${issue.file}:${issue.line}`);
      // eslint-disable-next-line no-console
      console.log(`    ${issue.message}`);
      // eslint-disable-next-line no-console
      console.log(`    💡 ${issue.suggestion}\n`);
    }
  }

  // Summary
  // eslint-disable-next-line no-console
  console.log('─'.repeat(60));
  // eslint-disable-next-line no-console
  console.log(
    `📊 Summary: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info`,
  );
  // eslint-disable-next-line no-console
  console.log(`   Analyzed ${testFiles.length} test files`);

  // Exit with error code if issues found in strict mode
  if (strictMode && errors.length > 0) {
    process.exit(1);
  }
}

main();
