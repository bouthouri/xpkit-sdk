import type { z } from 'zod'

export function assertObject(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Config must be an object.')
  }
  return raw as Record<string, unknown>
}

export function assertVersion(candidate: Record<string, unknown>, expected: string): void {
  const version = candidate.schemaVersion
  if (version !== expected) {
    throw new Error(`Unsupported schemaVersion: ${String(version)}`)
  }
}

export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    .join(', ')
}
