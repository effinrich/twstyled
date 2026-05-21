export interface TransformResult {
  filePath: string
  status: 'transformed' | 'skipped' | 'error'
  componentsTransformed: number
  error?: string
  diff?: string
}

export interface TransformSummary {
  filesProcessed: number
  filesTransformed: number
  filesSkipped: number
  totalComponentsTransformed: number
  errors: Array<{ file: string; reason: string }>
}
