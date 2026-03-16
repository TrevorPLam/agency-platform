import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import StyleDictionary from 'style-dictionary'

// Register custom format for client-specific CSS
StyleDictionary.registerFormat({
  name: 'css/client-theme',
  format: ({ dictionary, file, options }) => {
    const { outputReferences } = options
    const formattedTokens = formatClientTokens(dictionary.tokens, outputReferences)
    return `/* Client-specific design tokens for ${file.destination?.split('/').pop()?.replace('.css', '') || 'client'} */
@theme inline {
${formattedTokens}
}
`
  },
})

function formatClientTokens(tokens: any, outputReferences: boolean): string {
  return Object.entries(tokens)
    .map(([key, value]) => formatTokenValue(key, value, outputReferences, 2))
    .join('\n')
}

function formatTokenValue(
  key: string,
  value: any,
  outputReferences: boolean,
  indent: number
): string {
  const spaces = ' '.repeat(indent)

  if (typeof value === 'object' && value !== null && !value.$value) {
    return Object.entries(value)
      .map(([subKey, subValue]) =>
        formatTokenValue(`${key}-${subKey}`, subValue, outputReferences, indent)
      )
      .join('\n')
  }

  const tokenValue = value.$value || value
  const cssVarName = `--${key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`
  const formattedValue =
    outputReferences && tokenValue.includes('{')
      ? `var(${tokenValue.replace(/[{}]/g, '').replace(/\./g, '-')})`
      : tokenValue

  return `${spaces}${cssVarName}: ${formattedValue};`
}

async function buildClientTokens() {
  try {
    const clientsDir = path.join(process.cwd(), 'tokens', 'clients')
    const appsRoot = path.join(process.cwd(), '..', '..', 'apps')

    // Read all client token files
    const clientFiles = await fs.readdir(clientsDir)
    const clientJsonFiles = clientFiles.filter((file) => file.endsWith('.json'))

    console.log(`🔍 Found ${clientJsonFiles.length} client token files`)

    // Build each client's tokens; output dir derived from app location (no hardcoded slug list)
    for (const clientFile of clientJsonFiles) {
      const clientName = clientFile.replace('.json', '')
      const clientTokenPath = path.join(clientsDir, clientFile)
      const clientOutputDir =
        clientName === 'agency'
          ? path.join(appsRoot, 'firm', 'tokens')
          : (() => {
              const prospectivePath = path.join(appsRoot, 'prospective-clients', clientName)
              const appSubdir = existsSync(prospectivePath) ? 'prospective-clients' : 'clients'
              return path.join(appsRoot, appSubdir, clientName, 'tokens')
            })()

      await fs.mkdir(clientOutputDir, { recursive: true })

      // Read client tokens
      const clientTokens = JSON.parse(await fs.readFile(clientTokenPath, 'utf-8'))

      // Create Style Dictionary config for this client
      const clientConfig = {
        source: [
          'tokens/primitive/**/*.json',
          'tokens/semantic/**/*.json',
          'tokens/component/**/*.json',
          `tokens/clients/${clientFile}`,
        ],
        platforms: {
          'css/client': {
            transformGroup: 'css',
            buildPath: `${clientOutputDir}/`,
            files: [
              {
                destination: `${clientName}.css`,
                format: 'css/client-theme',
                filter: (token: any) => {
                  // Include client-specific tokens and override semantic tokens
                  return (
                    token.path[0] === 'brand' ||
                    token.path[0] === 'font' ||
                    (token.path[0] === 'color' && token.path[1] === 'semantic')
                  )
                },
                options: {
                  outputReferences: true,
                },
              },
            ],
          },
        },
      }

      // Build client tokens
      const sd = new StyleDictionary(clientConfig)
      await sd.hasInitialized
      await sd.buildPlatform('css/client')

      console.log(`✅ Built tokens for client: ${clientName}`)
    }

    console.log('🎉 All client tokens built successfully')
  } catch (error) {
    console.error('❌ Error building client tokens:', error)
    process.exit(1)
  }
}

// Run the build
buildClientTokens()
