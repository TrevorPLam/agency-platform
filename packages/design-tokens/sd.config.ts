import StyleDictionary from 'style-dictionary';
import type { Dictionary, Platform } from 'style-dictionary';

// Register custom format for Tailwind v4 @theme blocks
StyleDictionary.registerFormat({
  name: 'css/tw-v4-theme',
  format: ({ dictionary, file, options }) => {
    const { outputReferences } = options;
    const formattedTokens = formatThemeTokens(dictionary.tokens, outputReferences);
    return `@theme inline {
${formattedTokens}
}`;
  }
});

// Register custom format for CSS variables in :root blocks
StyleDictionary.registerFormat({
  name: 'css/root-variables',
  format: ({ dictionary, file, options }) => {
    const { outputReferences } = options;
    const formattedTokens = formatRootVariables(dictionary.tokens, outputReferences);
    return `:root {
${formattedTokens}
}`;
  }
});

function formatThemeTokens(tokens: any, outputReferences: boolean): string {
  return Object.entries(tokens)
    .map(([key, value]) => formatTokenValue(key, value, outputReferences, 2))
    .join('\n');
}

function formatRootVariables(tokens: any, outputReferences: boolean): string {
  return Object.entries(tokens)
    .map(([key, value]) => formatTokenValue(key, value, outputReferences, 2))
    .join('\n');
}

function formatTokenValue(key: string, value: any, outputReferences: boolean, indent: number): string {
  const spaces = ' '.repeat(indent);
  
  if (typeof value === 'object' && value !== null && !value.$value) {
    return Object.entries(value)
      .map(([subKey, subValue]) => formatTokenValue(`${key}-${subKey}`, subValue, outputReferences, indent))
      .join('\n');
  }
  
  const tokenValue = value.$value || value;
  const cssVarName = `--${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`;
  const formattedValue = outputReferences && tokenValue.includes('{') 
    ? `var(${tokenValue.replace(/[{}]/g, '').replace(/\./g, '-')})`
    : tokenValue;
  
  return `${spaces}${cssVarName}: ${formattedValue};`;
}

// Style Dictionary configuration
const config: Dictionary = {
  source: [
    'tokens/primitive/**/*.json',
    'tokens/semantic/**/*.json',
    'tokens/component/**/*.json'
  ],
  platforms: {
    'css/primitives': {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        {
          destination: 'primitives.css',
          format: 'css/root-variables',
          filter: (token) => token.path[0] === 'primitive'
        }
      ]
    },
    'css/semantic': {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        {
          destination: 'semantic.css',
          format: 'css/tw-v4-theme',
          filter: (token) => token.path[0] === 'semantic',
          options: {
            outputReferences: true
          }
        }
      ]
    },
    'css/component': {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        {
          destination: 'component.css',
          format: 'css/root-variables',
          filter: (token) => token.path[0] === 'component'
        }
      ]
    }
  }
};

// Initialize and build all platforms
async function buildAllPlatforms() {
  const sd = new StyleDictionary(config);
  
  // Wait for initialization
  await sd.hasInitialized;
  
  try {
    // Build all platforms in parallel
    await Promise.all([
      sd.buildPlatform('css/primitives'),
      sd.buildPlatform('css/semantic'),
      sd.buildPlatform('css/component')
    ]);
    
    console.log('✅ All platforms built successfully');
  } catch (error) {
    console.error('❌ Error building platforms:', error);
    process.exit(1);
  }
}

// Run the build
buildAllPlatforms();
