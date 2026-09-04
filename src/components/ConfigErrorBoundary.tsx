import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BackendNotConfiguredError, ConfigurationError } from '@/infrastructure/config/appConfig';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ConfigErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ConfigError]', error, info.componentStack);
    }
  }

  render() {
    if (this.state.error instanceof ConfigurationError) {
      return (
        <div className="config-error">
          <h1>설정 오류</h1>
          <p>{this.state.error.message}</p>
        </div>
      );
    }

    if (this.state.error instanceof BackendNotConfiguredError) {
      return (
        <div className="config-error">
          <h1>운영 백엔드가 연결되지 않았습니다</h1>
          <p>{this.state.error.message}</p>
          <p>다음 환경변수를 설정해 주세요:</p>
          <ul>
            {this.state.error.requiredEnvVars.map((v) => (
              <li key={v}>
                <code>{v}</code>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (this.state.error) {
      return (
        <div className="config-error">
          <h1>오류가 발생했습니다</h1>
          <p>{this.state.error.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
