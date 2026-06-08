import React from "react";
import { withTranslation } from "react-i18next";

/** Isolates heavy Syncfusion / diff viewers so crashes do not unwind the dashboard shell. */
export class DocumentViewerErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.error("[DocumentViewerErrorBoundary]", err);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-light-error-border bg-light-error-bg p-4 text-sm text-light-error-text dark:border-dark-error-border dark:bg-dark-error-bg dark:text-dark-error-text">
          {this.props.t("documentViewer.errorBoundary")}
        </div>
      );
    }
    return this.props.children;
  }
}

const DocumentViewerErrorBoundary = withTranslation()(
  DocumentViewerErrorBoundaryInner,
);
DocumentViewerErrorBoundary.displayName = "DocumentViewerErrorBoundary";

export default DocumentViewerErrorBoundary;
