'use client'

import { Suspense, lazy, Component, type ReactNode } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
}

// The 3D scene is decorative and loaded from an external CDN. If that fetch
// fails (offline, ad-blocker, CDN hiccup, WebGL unsupported) the Spline runtime
// THROWS — and a <Suspense> only catches loading, not errors. Without this
// boundary the error bubbles to the route error page and takes the whole hero
// down. So we swallow it and degrade to an empty (transparent) slot instead.
class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { /* decorative — intentionally swallowed */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <SceneErrorBoundary fallback={<div className={className} aria-hidden />}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <span className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
          </div>
        }
      >
        <Spline
          scene={scene}
          className={className}
        />
      </Suspense>
    </SceneErrorBoundary>
  )
}
