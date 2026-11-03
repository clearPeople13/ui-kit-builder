import { createVerifyDetector } from './detectors/verify.mjs'
import { sweepDetector } from './detectors/sweep.mjs'

export function loadDetectors(options) {
  const wanted = options.detectors
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
  const registry = [createVerifyDetector(options.checkCmd, options.checkTimeout), sweepDetector]
  return registry.filter((detector) => wanted.includes(detector.id))
}
