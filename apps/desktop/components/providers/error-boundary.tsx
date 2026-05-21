"use client";

import { AlertTriangle } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("CaseSpace error boundary caught error", error);
  }

  private handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>
              An unexpected error occurred. Try resetting the workspace or
              reloading the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="break-words text-xs text-muted-foreground">
              {this.state.error?.message ?? "Unknown error"}
            </p>
            <div className="flex gap-2">
              <Button onClick={this.handleReset}>Try again</Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Reload app
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
