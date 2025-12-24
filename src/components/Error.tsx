import {  createElement } from 'react';
interface ErrorProps {
  message: string;
}

export function Error({ message }: ErrorProps) {
  return (
    <div className="nav-error">
      <strong>Error</strong>
      <p>{message}</p>
    </div>
  );
}
