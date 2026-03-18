import { Artifact, ArtifactId } from './types';
import { artifactRegistry } from './registry';

export interface SBOMComponent {
  type: 'library' | 'framework' | 'application' | 'container';
  name: string;
  version: string;
  supplier?: string;
  licenses?: string[];
  copyright?: string;
  description?: string;
  hash?: string;
}

export interface SBOMDocument {
  format: 'cyclonedx' | 'spdx';
  name: string;
  version: string;
  created: string;
  components: SBOMComponent[];
  dependencies: string[];
  vulnerabilities: number;
}

export class SBOMGenerator {
  /**
   * Generate SBOM for an artifact
   */
  async generateSBOM(artifactId: ArtifactId, format: 'cyclonedx' | 'spdx' = 'cyclonedx'): Promise<SBOMDocument> {
    const artifact = await artifactRegistry.getArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Artifact ${artifactId} not found`);
    }

    const components = await this.extractComponents(artifact);
    const dependencies = artifact.metadata.dependencies || [];
    const vulnerabilities = artifact.metadata.vulnerabilities?.length || 0;

    const sbom: SBOMDocument = {
      format,
      name: artifact.name,
      version: artifact.version,
      created: new Date().toISOString(),
      components,
      dependencies,
      vulnerabilities,
    };

    return sbom;
  }

  /**
   * Extract components from artifact metadata and content
   */
  private async extractComponents(artifact: Artifact): Promise<SBOMComponent[]> {
    const components: SBOMComponent[] = [];

    // Add the main artifact as a component
    components.push({
      type: this.mapArtifactTypeToSBOMType(artifact.type),
      name: artifact.name,
      version: artifact.version,
      supplier: 'Agency Platform',
      description: artifact.metadata.description,
      hash: artifact.integrity,
    });

    // Extract package.json dependencies if it's a package
    if (artifact.type === 'package') {
      try {
        const content = await artifactRegistry.getArtifactContent(artifact.id);
        const packageJson = this.extractPackageJson(content);
        
        if (packageJson) {
          // Add dependencies as components
          for (const [name, version] of Object.entries(packageJson.dependencies || {})) {
            components.push({
              type: 'library',
              name,
              version: version as string,
              supplier: 'npm',
            });
          }

          // Add dev dependencies as components
          for (const [name, version] of Object.entries(packageJson.devDependencies || {})) {
            components.push({
              type: 'library',
              name,
              version: version as string,
              supplier: 'npm',
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to extract components from artifact ${artifact.id}:`, error);
      }
    }

    return components;
  }

  /**
   * Extract package.json from content
   */
  private extractPackageJson(content: Buffer): any {
    try {
      const contentString = content.toString('utf-8');
      
      // Try to find package.json in the content
      const packageJsonMatch = contentString.match(/package\.json[\s\S]*?{[\s\S]*?}/);
      if (packageJsonMatch) {
        const jsonStart = packageJsonMatch[0].indexOf('{');
        const jsonEnd = packageJsonMatch[0].lastIndexOf('}') + 1;
        const packageJsonString = packageJsonMatch[0].substring(jsonStart, jsonEnd);
        return JSON.parse(packageJsonString);
      }

      // Try to parse the entire content as JSON (might be package.json directly)
      return JSON.parse(contentString);
    } catch (error) {
      return null;
    }
  }

  /**
   * Map artifact type to SBOM component type
   */
  private mapArtifactTypeToSBOMType(artifactType: string): SBOMComponent['type'] {
    switch (artifactType) {
      case 'package':
        return 'application';
      case 'container':
        return 'container';
      case 'binary':
        return 'application';
      case 'document':
        return 'application';
      default:
        return 'application';
    }
  }

  /**
   * Convert SBOM to CycloneDX JSON format
   */
  toCycloneDX(sbom: SBOMDocument): string {
    const cyclonedx = {
      $schema: 'http://cyclonedx.org/schema/bom/1.4',
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: `urn:uuid:${this.generateUUID()}`,
      version: 1,
      metadata: {
        timestamp: sbom.created,
        component: {
          type: 'application',
          name: sbom.name,
          version: sbom.version,
          supplier: {
            name: 'Agency Platform',
          },
        },
      },
      components: sbom.components.map(comp => ({
        type: comp.type,
        name: comp.name,
        version: comp.version,
        supplier: comp.supplier ? { name: comp.supplier } : undefined,
        licenses: comp.licenses ? { license: comp.licenses.map(license => ({ id: license })) } : undefined,
        copyright: comp.copyright,
        description: comp.description,
        hash: comp.hash ? [{ alg: 'SHA-256', content: comp.hash.replace('sha256:', '') }] : undefined,
      })),
      dependencies: sbom.dependencies.map(dep => ({
        ref: `pkg:npm/${dep}`,
        dependsOn: [],
      })),
    };

    return JSON.stringify(cyclonedx, null, 2);
  }

  /**
   * Convert SBOM to SPDX JSON format
   */
  toSPDX(sbom: SBOMDocument): string {
    const spdx = {
      SPDXID: 'SPDXRef-DOCUMENT',
      spdxVersion: 'SPDX-2.3',
      creationInfo: {
        created: sbom.created,
        creators: ['Tool: Agency Platform SBOM Generator'],
      },
      name: sbom.name,
      documentNamespace: `https://agency.platform/spdx/${sbom.name}-${sbom.version}`,
      packages: sbom.components.map((comp, index) => ({
        name: comp.name,
        SPDXID: `SPDXRef-Package-${index}`,
        versionInfo: comp.version,
        supplier: comp.supplier ? `Organization: ${comp.supplier}` : undefined,
        licenseDeclared: comp.licenses?.[0] || 'NOASSERTION',
        copyrightText: comp.copyright || 'NOASSERTION',
        description: comp.description,
        checksums: comp.hash ? [{ algorithm: 'SHA256', checksumValue: comp.hash.replace('sha256:', '') }] : undefined,
        externalRefs: comp.type === 'library' ? [{
          referenceCategory: 'PACKAGE_MANAGER',
          referenceType: 'purl',
          referenceLocator: `pkg:npm/${comp.name}@${comp.version}`,
        }] : undefined,
      })),
      relationships: sbom.dependencies.map((dep, index) => ({
        spdxElementId: `SPDXRef-Package-0`,
        relatedSpdxElement: `SPDXRef-Package-${index + 1}`,
        relationshipType: 'DEPENDS_ON',
      })),
    };

    return JSON.stringify(spdx, null, 2);
  }

  /**
   * Generate a UUID for SBOM
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Singleton instance
export const sbomGenerator = new SBOMGenerator();
