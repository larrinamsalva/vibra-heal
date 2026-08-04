import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react'
import {
  dispatchPassiveGuidanceFailure,
  dispatchPassiveGuidanceReady,
  PASSIVE_GUIDANCE_REQUEST_EVENT,
  readPassiveGuidanceRequest,
} from './passiveGuidanceEvents'
import {
  getPassiveGuidanceTool,
  PASSIVE_GUIDANCE_TOOLS,
  type PassiveGuidanceToolId,
} from './toolRegistry'
import './passiveGuidanceHost.css'

type LoadedGuidance = Partial<Record<PassiveGuidanceToolId, ComponentType>>

export default function PassiveGuidanceHost() {
  const [loaded, setLoaded] = useState<LoadedGuidance>({})
  const loadedRef = useRef<LoadedGuidance>({})
  const loadingRef = useRef(new Set<PassiveGuidanceToolId>())
  const announcedRef = useRef(new Set<PassiveGuidanceToolId>())
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const announceWhenMounted = (id: PassiveGuidanceToolId, attempt = 0) => {
      const tool = getPassiveGuidanceTool(id)
      if (!tool) return

      if (document.querySelector(tool.triggerSelector)) {
        announcedRef.current.add(id)
        dispatchPassiveGuidanceReady(id)
        return
      }

      if (attempt >= 30) {
        dispatchPassiveGuidanceFailure(id)
        return
      }

      const timerId = window.setTimeout(
        () => announceWhenMounted(id, attempt + 1),
        20,
      )
      timersRef.current.push(timerId)
    }

    const handleRequest = (event: Event) => {
      const detail = readPassiveGuidanceRequest(event)
      if (!detail) return

      const tool = getPassiveGuidanceTool(detail.id)
      if (!tool) return

      if (loadedRef.current[detail.id]) {
        announceWhenMounted(detail.id)
        return
      }

      if (loadingRef.current.has(detail.id)) return
      loadingRef.current.add(detail.id)

      void tool.loadComponent()
        .then((module) => {
          loadedRef.current = {
            ...loadedRef.current,
            [detail.id]: module.default,
          }
          setLoaded(loadedRef.current)
          window.setTimeout(() => announceWhenMounted(detail.id), 0)
        })
        .catch(() => {
          dispatchPassiveGuidanceFailure(detail.id)
        })
        .finally(() => {
          loadingRef.current.delete(detail.id)
        })
    }

    window.addEventListener(PASSIVE_GUIDANCE_REQUEST_EVENT, handleRequest)
    return () => {
      window.removeEventListener(PASSIVE_GUIDANCE_REQUEST_EVENT, handleRequest)
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      timersRef.current = []
    }
  }, [])

  return (
    <div className="passive-guidance-host" aria-live="off">
      {PASSIVE_GUIDANCE_TOOLS.map((tool) => {
        const Component = loaded[tool.id]
        if (!Component) return null

        return (
          <div
            key={tool.id}
            className="passive-guidance-host-mount"
            data-passive-guidance-id={tool.id}
          >
            <Component />
          </div>
        )
      })}
    </div>
  )
}
