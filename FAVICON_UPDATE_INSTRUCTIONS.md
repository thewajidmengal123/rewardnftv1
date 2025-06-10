# Favicon Update Instructions

## Your New Favicon Design
You have a beautiful gradient "R" logo with:
- Hexagonal shape
- Orange to blue gradient (top-left to bottom-right)
- White "R" letter in the center
- Modern, professional appearance

## Steps to Update Your Favicon

### 1. Prepare the Image Files
You'll need to create multiple sizes of your favicon from the source image:

**Required sizes:**
- `favicon.ico` (16x16, 32x32, 48x48 - multi-size ICO file)
- `favicon-16x16.png` (16x16 pixels)
- `favicon-32x32.png` (32x32 pixels)
- `apple-touch-icon.png` (180x180 pixels)
- `android-chrome-192x192.png` (192x192 pixels)
- `android-chrome-512x512.png` (512x512 pixels)

### 2. Tools to Generate Favicon Files
You can use these online tools to generate all required sizes:

**Option A: RealFaviconGenerator (Recommended)**
1. Go to https://realfavicongenerator.net/
2. Upload your gradient "R" image
3. Configure settings for each platform
4. Download the generated favicon package
5. Replace the files in your `public/` directory

**Option B: Favicon.io**
1. Go to https://favicon.io/favicon-converter/
2. Upload your image
3. Download the generated files
4. Replace the files in your `public/` directory

### 3. Replace Files in Your Project
Replace these files in the `public/` directory:
- `favicon.ico`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`

### 4. Configuration Already Updated
✅ The following files have already been updated in your project:
- `app/layout.tsx` - Added proper favicon metadata
- `public/site.webmanifest` - Updated with RewardNFT branding

### 5. Test Your Favicon
After replacing the files:
1. Clear your browser cache
2. Visit your website
3. Check the browser tab for the new favicon
4. Test on mobile devices to see the app icon

### 6. Favicon Specifications
Your new favicon should maintain these characteristics:
- **Colors**: Orange (#FF8C00) to Blue (#1E90FF) gradient
- **Shape**: Hexagonal background
- **Letter**: White "R" in center
- **Style**: Modern, clean, professional

### 7. Additional Considerations
- Ensure the "R" is clearly visible at 16x16 pixels
- Test contrast on both light and dark browser themes
- Consider a simplified version for very small sizes if needed

## Current Configuration
The favicon configuration in your Next.js app is already set up to use:
- Multiple icon sizes for different devices
- Proper manifest file for PWA support
- Apple touch icon for iOS devices
- Theme colors matching your dark design

Once you replace the image files, your new gradient "R" favicon will be live!
