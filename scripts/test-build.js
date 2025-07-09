#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Next.js build for Netlify deployment...\n');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true, force: true });
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });

  // Run build
  console.log('🏗️  Building application...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build was successful
  if (fs.existsSync('.next')) {
    console.log('✅ Build completed successfully!');
    
    // Check for common issues
    const nextDir = '.next';
    const staticDir = path.join(nextDir, 'static');
    
    if (fs.existsSync(staticDir)) {
      console.log('✅ Static assets generated');
    } else {
      console.log('⚠️  No static assets found');
    }

    // Check for API routes
    const serverDir = path.join(nextDir, 'server');
    if (fs.existsSync(serverDir)) {
      console.log('✅ Server-side functions generated');
    }

    console.log('\n🚀 Build is ready for Netlify deployment!');
    console.log('📝 Make sure to:');
    console.log('   1. Set environment variables in Netlify dashboard');
    console.log('   2. Enable Netlify Next.js plugin');
    console.log('   3. Set build command to: npm run build');
    console.log('   4. Set publish directory to: .next');
    
  } else {
    console.log('❌ Build failed - .next directory not found');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
