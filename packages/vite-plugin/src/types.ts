export interface TwstyledPluginOptions {
  include?: string[]
  exclude?: string[]
  outputFile?: string
  projectRoot?: string
}

export interface ExtractedComponent {
  scopeClass: string
  staticClasses: string[]
  ordinal: number
  sourceLocation: { line: number; col: number }
}

export interface ParsedTemplate {
  staticSegments: string[]
  interpolationCount: number
  normalizedClasses: string[]
  sourceSpan: { start: number; end: number }
}

export interface PluginState {
  cssMap: Map<string, string>
  componentMap: Map<string, ExtractedComponent[]>
  options: Required<TwstyledPluginOptions>
}
