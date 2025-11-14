# Development Guide

This document provides detailed information for developers working on the Render Mermaid OnTheFly extension.

## Architecture

### Overview

The extension consists of two main components:

1. **Background Service Worker** (`background.ts`)
   - Manages the context menu
   - Handles user interactions with the "Render Mermaid" menu item
   - Sends messages to content scripts

2. **Content Script** (`content.ts`)
   - Injected into all web pages
   - Creates and manages the overlay UI
   - Renders Mermaid diagrams using the bundled Mermaid.js library
   - Handles zoom, pan, and export functionality

### Technology Stack

- **TypeScript**: For type safety and better developer experience
- **Webpack**: Module bundler that compiles TypeScript and bundles dependencies
- **Mermaid.js**: Diagram rendering library (bundled directly into the extension)
- **Chrome Extension API**: Manifest V3 APIs for context menus and messaging

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm (comes with Node.js)
- Chrome or Chromium-based browser

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd Render-Mermaid-OnTheFly

# Install dependencies
npm install

# Build the extension
npm run build
```

## Development Workflow

### Building

```bash
# Production build (optimized)
npm run build

# Development build with watch mode (rebuilds on changes)
npm run dev

# Clean build directory
npm run clean
```

### Testing

```bash
# Run build validation tests
npm test
```

This test verifies:
- The dist/ directory exists and has the correct structure
- manifest.json is valid and uses Manifest V3
- All required files are present
- JavaScript syntax is valid
- Mermaid library is properly bundled

### Loading in Chrome

1. Build the extension: `npm run build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `dist/` directory
6. Test by:
   - Opening the test.html file in the browser
   - Selecting any Mermaid code
   - Right-clicking and choosing "Render Mermaid"

### Making Changes

1. Edit source files in `src/`:
   - `src/background.ts` - Background service worker
   - `src/content.ts` - Content script
   - `src/styles.css` - Overlay styles
   - `src/manifest.json` - Extension manifest

2. The `npm run dev` command watches for changes and rebuilds automatically

3. After making changes:
   - Reload the extension in `chrome://extensions/` (click the refresh icon)
   - Or use the keyboard shortcut: Ctrl+R (Windows/Linux) or Cmd+R (Mac) while focused on the extensions page
   - Refresh any web pages where you want to test the content script

## Project Structure

```
Render-Mermaid-OnTheFly/
├── src/                      # Source files
│   ├── background.ts         # Background service worker (TypeScript)
│   ├── content.ts           # Content script (TypeScript)
│   ├── styles.css           # Overlay styles
│   ├── manifest.json        # Extension manifest (Manifest V3)
│   ├── icons/               # Extension icons
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── README.md            # User documentation
├── dist/                     # Build output (generated, do not edit)
│   ├── background.js         # Compiled background script
│   ├── content.js           # Compiled content script with bundled Mermaid
│   ├── *.js                 # Webpack chunks
│   ├── styles.css           # Copied styles
│   ├── manifest.json        # Copied manifest
│   └── icons/               # Copied icons
├── node_modules/            # Dependencies (not committed)
├── package.json             # NPM package configuration
├── tsconfig.json           # TypeScript configuration
├── webpack.config.js       # Webpack build configuration
├── test-build.js           # Build validation tests
├── generate_icons.py       # Icon generator script
├── test.html              # Test page with sample Mermaid diagrams
├── .gitignore             # Git ignore rules
└── README.md              # Project documentation
```

## Key Files Explained

### `webpack.config.js`

Configures webpack to:
- Compile TypeScript files
- Bundle all dependencies (including Mermaid.js)
- Copy static assets to dist/
- Generate source maps for debugging

### `tsconfig.json`

TypeScript compiler options:
- Target: ES2020
- Module: ES2020
- Strict type checking enabled
- Includes Chrome extension type definitions

### `manifest.json`

Chrome extension manifest (V3):
- Declares permissions (contextMenus, activeTab)
- Defines background service worker
- Specifies content scripts
- Lists web accessible resources

## Code Style

### TypeScript

- Use strict mode (enabled in tsconfig.json)
- Provide explicit types for function parameters and return values
- Use interfaces for complex types
- Prefer `const` and `let` over `var`
- Use modern ES6+ features

### Naming Conventions

- Variables/functions: `camelCase`
- Classes/interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case.ts` or `camelCase.ts`

### Comments

- Use JSDoc-style comments for functions
- Add inline comments for complex logic
- Keep comments up-to-date with code changes

## Debugging

### Console Logs

- Background script logs: Check the service worker console in `chrome://extensions/`
- Content script logs: Check the page console (F12) on any webpage

### Debugging TypeScript

Source maps are generated in development mode, allowing you to debug TypeScript code directly in Chrome DevTools.

### Common Issues

1. **"Cannot find module"**: Run `npm install` to ensure all dependencies are installed
2. **Extension not loading**: Check the console in `chrome://extensions/` for errors
3. **Changes not appearing**: Make sure to rebuild (`npm run build`) and reload the extension
4. **TypeScript errors**: Run `npx tsc --noEmit` to check for type errors

## Building for Production

Before releasing:

1. Update version in `src/manifest.json`
2. Run `npm run build` to create optimized build
3. Test thoroughly in Chrome
4. Zip the `dist/` directory for distribution

```bash
# Build for production
npm run build

# Create distribution package
cd dist
zip -r ../render-mermaid-onthefly-v1.0.0.zip .
cd ..
```

## Contributing

1. Create a new branch for your feature/fix
2. Make changes in the `src/` directory
3. Test thoroughly
4. Ensure `npm test` passes
5. Update documentation if needed
6. Submit a pull request

## Security

### Content Security Policy (CSP)

Chrome extensions have strict CSP rules. Our approach:
- All code is bundled at build time (no dynamic script loading)
- Mermaid.js is bundled into content.js
- No eval() or inline scripts
- No external script sources

### Permissions

The extension requests minimal permissions:
- `contextMenus`: To add the right-click menu item
- `activeTab`: To inject the content script into the current page

## Performance

### Bundle Size

The content.js bundle is ~727KB due to Mermaid.js. This is acceptable for an extension but could be optimized further if needed:
- Use code splitting
- Lazy load diagram types
- Minify with terser

### Rendering

Mermaid diagrams are rendered on-demand when the user requests it, not automatically on page load.

## Future Improvements

Potential enhancements:
- [ ] Add keyboard shortcuts
- [ ] Support for custom Mermaid themes
- [ ] Save/load diagram settings
- [ ] History of rendered diagrams
- [ ] Export to SVG format
- [ ] Dark mode support
- [ ] Diagram editing capabilities

## Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Mermaid.js Documentation](https://mermaid.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Webpack Documentation](https://webpack.js.org/concepts/)

## License

MIT License - See LICENSE file for details
