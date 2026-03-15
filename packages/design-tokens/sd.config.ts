import StyleDictionary from 'style-dictionary';
import type { Dictionary } from 'style-dictionary';

/** W3C DTCG-style token value (may have $value or nested objects). */
type TokenValue = Record<string, unknown> & { $value?: string };

/** Recursively format a token tree into CSS custom properties. */
function formatThemeTokens(
  tokens: Record<string, unknown>,
  outputReferences: boolean
): string {
  return Object.entries(tokens)
    .map(([key, value]) =>
      formatTokenValue(key, value as TokenValue, outputReferences, 2)
    )
    .join('\n');
}

/** Recursively format a token tree for :root block. */
function formatRootVariables(
  tokens: Record<string, unknown>,
  outputReferences: boolean
): string {
  return Object.entries(tokens)
    .map(([key, value]) =>
      formatTokenValue(key, value as TokenValue, outputReferences, 2)
    )
    .join('\n');
}

function formatTokenValue(
  key: string,
  value: TokenValue,
  outputReferences: boolean,
  indent: number
): string {
  const spaces = ' '.repeat(indent);

  if (
    typeof value === 'object' &&
    value !== null &&
    !('$value' in value && value.$value !== undefined)
  ) {
    return Object.entries(value)
      .map(([subKey, subValue]) =>
        formatTokenValue(
          `${key}-${subKey}`,
          subValue as TokenValue,
          outputReferences,
          indent
        )
      )
      .join('\n');
  }

  const tokenValue =
    (value && typeof value === 'object' && '$value' in value
      ? (value as { $value: string }).$value
      : String(value)) ?? '';
  const cssVarName = `--${key
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()}`;
  const formattedValue =
    outputReferences && typeof tokenValue === 'string' && tokenValue.includes('{')
      ? `var(${tokenValue.replace(/[{}]/g, '').replace(/\./g, '-')})`
      : tokenValue;

  return `${spaces}${cssVarName}: ${formattedValue};`;
}

// Register custom format for Tailwind v4 @theme blocks
StyleDictionary.registerFormat({
  name: 'css/tw-v4-theme',
  format: ({
    dictionary,
    options,
  }: {
    dictionary: { tokens: Record<string, unknown> };
    options: { outputReferences?: boolean };
  }) => {
    const outputReferences = options.outputReferences ?? false;
    const formattedTokens = formatThemeTokens(
      dictionary.tokens,
      outputReferences
    );
    return `@theme inline {
${formattedTokens}
}`;
  },
});

// Register custom format for CSS variables in :root blocks
StyleDictionary.registerFormat({
  name: 'css/root-variables',
  format: ({
    dictionary,
    options,
  }: {
    dictionary: { tokens: Record<string, unknown> };
    options: { outputReferences?: boolean };
  }) => {
    const outputReferences = options.outputReferences ?? false;
    const formattedTokens = formatRootVariables(
      dictionary.tokens,
      outputReferences
    );
    return `:root {
${formattedTokens}
}`;
  },
});

// Style Dictionary configuration (W3C DTCG format)
const config: Dictionary = {
  usesDtcg: true,
  source: [
    'tokens/primitive/**/*.json',
    'tokens/semantic/**/*.json',
    'tokens/component/**/*.json',
  ],
  platforms: {
    'css/primitives': {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        {
          destination: 'primitives.css',
          format: 'css/root-variables',
          filter: (token: { path: string[] }) =>
            token.path.includes('primitive'),
        },
      ],
    },
    'css/semantic': {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        {
          destination: 'semantic.css',
          format: 'css/tw-v4-theme',
          filter: (token: { path: string[] }) =>
            token.path.includes('semantic'),
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    'css/component': {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [
        {
          destination: 'component.css',
          format: 'css/root-variables',
          filter: (token: { path: string[] }) =>
            token.path.includes('component'),
        },
      ],
    },
  },
};

// Initialize and build all platforms (v4 async API)
async function buildAllPlatforms() {
  const sd = new StyleDictionary(config);

  await sd.hasInitialized;

  try {
    await Promise.all([
      sd.buildPlatform('css/primitives'),
      sd.buildPlatform('css/semantic'),
      sd.buildPlatform('css/component'),
    ]);

    console.log('✅ All platforms built successfully');
  } catch (error) {
    console.error('❌ Error building platforms:', error);
    process.exit(1);
  }
}

buildAllPlatforms();
