"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { reportError } from "@/lib/logger";

interface Props {
  /** Where the boundary sits, for the error report. */
  scope: string;
  fallback?: ReactNode;
  onError?: () => void;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** A 3D crash never takes down the page UI (SPEC §8.9). Works in DOM and R3F trees. */
export class ThreeErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    reportError(error, {
      fn: `three:${this.props.scope}`,
      tags: { stack: info.componentStack ?? "" },
    });
    this.props.onError?.();
  }

  override render(): ReactNode {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
