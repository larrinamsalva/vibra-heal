import {
  getPassiveGuidanceTool,
  type PassiveGuidanceToolId,
} from './toolRegistry'

export const PASSIVE_GUIDANCE_REQUEST_EVENT = 'vibraheal:passive-guidance-request'
export const PASSIVE_GUIDANCE_READY_EVENT = 'vibraheal:passive-guidance-ready'
export const PASSIVE_GUIDANCE_FAILED_EVENT = 'vibraheal:passive-guidance-failed'

export type PassiveGuidanceRequestDetail = {
  id: PassiveGuidanceToolId
}

export type PassiveGuidanceFailureDetail = PassiveGuidanceRequestDetail & {
  message: string
}

function detailFromEvent(event: Event): PassiveGuidanceRequestDetail | null {
  const detail = (event as CustomEvent<PassiveGuidanceRequestDetail>).detail
  if (!detail || !getPassiveGuidanceTool(detail.id)) return null
  return detail
}

export function readPassiveGuidanceRequest(event: Event): PassiveGuidanceRequestDetail | null {
  return detailFromEvent(event)
}

export function dispatchPassiveGuidanceReady(id: PassiveGuidanceToolId) {
  window.dispatchEvent(
    new CustomEvent<PassiveGuidanceRequestDetail>(PASSIVE_GUIDANCE_READY_EVENT, {
      detail: { id },
    }),
  )
}

export function dispatchPassiveGuidanceFailure(
  id: PassiveGuidanceToolId,
  message = 'The guidance module could not be loaded.',
) {
  window.dispatchEvent(
    new CustomEvent<PassiveGuidanceFailureDetail>(PASSIVE_GUIDANCE_FAILED_EVENT, {
      detail: { id, message },
    }),
  )
}

export function requestPassiveGuidanceLoad(
  id: PassiveGuidanceToolId,
  timeoutMs = 12_000,
): Promise<void> {
  const tool = getPassiveGuidanceTool(id)
  if (!tool) return Promise.reject(new Error('Unknown passive guidance tool.'))
  if (document.querySelector(tool.triggerSelector)) return Promise.resolve()

  return new Promise((resolve, reject) => {
    let settled = false
    let timeoutId = 0

    const cleanup = () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener(PASSIVE_GUIDANCE_READY_EVENT, handleReady)
      window.removeEventListener(PASSIVE_GUIDANCE_FAILED_EVENT, handleFailure)
    }

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      callback()
    }

    const handleReady = (event: Event) => {
      const detail = detailFromEvent(event)
      if (detail?.id !== id) return
      finish(resolve)
    }

    const handleFailure = (event: Event) => {
      const detail = (event as CustomEvent<PassiveGuidanceFailureDetail>).detail
      if (!detail || detail.id !== id) return
      finish(() => reject(new Error(detail.message)))
    }

    timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error('Timed out while loading the guidance module.')))
    }, timeoutMs)

    window.addEventListener(PASSIVE_GUIDANCE_READY_EVENT, handleReady)
    window.addEventListener(PASSIVE_GUIDANCE_FAILED_EVENT, handleFailure)
    window.dispatchEvent(
      new CustomEvent<PassiveGuidanceRequestDetail>(PASSIVE_GUIDANCE_REQUEST_EVENT, {
        detail: { id },
      }),
    )
  })
}
