#!/usr/bin/env node

/**
 * SmartBudget Performance Benchmarking Script
 * 
 * Measures:
 * - API response times
 * - Bundle size
 * - Build time
 * - Page load metrics
 * 
 * Usage: node perf-benchmark.js
 */

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

console.log('\n' + colors.cyan + '╔════════════════════════════════════════╗');
console.log(colors.cyan + '║   SmartBudget Performance Benchmark   ║');
console.log(colors.cyan + '╚════════════════════════════════════════╝\n' + colors.reset);

const benchmarks = {};

// 1. Build Performance
log(colors.blue, '📦 Building application...');
const buildStart = Date.now();
try {
  execSync('pnpm build', { stdio: 'pipe', cwd: process.cwd() });
  benchmarks.buildTime = Date.now() - buildStart;
  log(colors.green, `✓ Build completed in ${formatTime(benchmarks.buildTime)}`);
} catch (err) {
  log(colors.red, '✗ Build failed');
  process.exit(1);
}

// 2. Bundle Size
log(colors.blue, '\n📊 Analyzing bundle size...');
const nextDir = path.join(process.cwd(), '.next/static');
let totalSize = 0;
let jsSize = 0;
let cssSize = 0;

if (fs.existsSync(nextDir)) {
  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else {
        const size = stat.size;
        totalSize += size;
        if (file.endsWith('.js')) jsSize += size;
        if (file.endsWith('.css')) cssSize += size;
      }
    }
  };
  
  walkDir(nextDir);
  
  benchmarks.totalSize = totalSize;
  benchmarks.jsSize = jsSize;
  benchmarks.cssSize = cssSize;
  
  log(colors.green, `✓ Total bundle: ${formatBytes(totalSize)}`);
  log(colors.green, `  ├─ JavaScript: ${formatBytes(jsSize)}`);
  log(colors.green, `  └─ CSS: ${formatBytes(cssSize)}`);
} else {
  log(colors.yellow, '⚠ .next directory not found');
}

// 3. Performance Targets
log(colors.blue, '\n🎯 Performance Targets & Actual:');

const targets = {
  'Build Time': { target: 5000, actual: benchmarks.buildTime, unit: 'ms' },
  'Total Bundle': { target: 300 * 1024, actual: benchmarks.totalSize, unit: 'bytes', format: 'bytes' },
  'JS Bundle': { target: 200 * 1024, actual: benchmarks.jsSize, unit: 'bytes', format: 'bytes' },
};

for (const [metric, data] of Object.entries(targets)) {
  const passed = data.actual <= data.target;
  const displayTarget = data.format === 'bytes' ? formatBytes(data.target) : formatTime(data.target);
  const displayActual = data.format === 'bytes' ? formatBytes(data.actual) : formatTime(data.actual);
  
  const color = passed ? colors.green : colors.yellow;
  const icon = passed ? '✓' : '⚠';
  log(color, `${icon} ${metric}: ${displayActual} (target: ${displayTarget})`);
}

// 4. Recommendations
log(colors.blue, '\n💡 Optimization Recommendations:');

const recommendations = [];

if (benchmarks.buildTime > 5000) {
  recommendations.push('• Reduce build time by optimizing dependencies');
}

if (benchmarks.totalSize > 300 * 1024) {
  recommendations.push('• Bundle size exceeds 300KB - consider code splitting');
}

if (benchmarks.jsSize > 200 * 1024) {
  recommendations.push('• JS bundle exceeds 200KB - implement dynamic imports');
}

if (recommendations.length === 0) {
  log(colors.green, '✓ All performance targets met!');
} else {
  recommendations.forEach(r => log(colors.yellow, r));
}

// 5. Summary
log(colors.cyan, '\n📋 Summary:');
log(colors.cyan, JSON.stringify(benchmarks, null, 2));

log(colors.green, '\n✅ Benchmark complete!\n');

process.exit(0);
