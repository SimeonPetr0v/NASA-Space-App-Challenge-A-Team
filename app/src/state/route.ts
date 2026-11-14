import { useEffect, useState } from 'react'

export type Route = 'overview' | 'log' | 'trends' | 'link' | 'method' | 'brief'

const ROUTES: Route[] = ['overview', 'log', 'trends', 'link', 'method', 'brief']

function parse(): { route: Route; param?: string } {
  const [, route, param] = window.location.hash.split('/')
  return ROUTES.includes(route as Route) ? { route: route as Route, param } : { route: 'overview' }
}

/** Hash routing keeps deep links working on GitHub Pages without a server */
export function useRoute() {
  const [state, setState] = useState(parse)
  useEffect(() => {
    const on = () => {
      setState(parse())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return state
}

export const href = (route: Route, param?: string) => `#/${route}${param ? `/${param}` : ''}`
export const navigate = (route: Route, param?: string) => {
  window.location.hash = href(route, param)
}
