import { Component } from "react";
import ErrorState from "../ui/ErrorState";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled frontend error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="ui-fatal-error">
          <ErrorState
            title="La page ne peut pas être affichée"
            description="Une erreur inattendue est survenue. Rechargez la page pour reprendre votre navigation."
            onRetry={() => window.location.reload()}
          />
        </main>
      );
    }
    return this.props.children;
  }
}
