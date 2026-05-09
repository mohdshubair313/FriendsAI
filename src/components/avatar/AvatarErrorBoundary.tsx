"use client";

import { Component, ReactNode } from "react";

interface Props {
  fallback: ReactNode;
  /** Called once with the caught error so the parent can swap to sphere mode etc. */
  onError?: (err: unknown) => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches errors thrown by R3F / GLTFLoader / Suspense children — the
 * Ready Player Me CDN going down or a malformed GLB shouldn't take the
 * whole /live_talk page with it.
 *
 * Class component because hooks can't catch render-phase errors.
 */
export default class AvatarErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    console.error("[AvatarErrorBoundary] caught:", err);
    this.props.onError?.(err);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
