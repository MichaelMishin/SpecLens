import { css } from 'lit';

export const resetStyles = css`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  :host {
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    overflow-wrap: break-word;
    margin: 0;
  }

  p {
    margin: 0;
  }

  a {
    color: var(--sl-color-primary);
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  code, pre {
    font-family: var(--sl-font-mono);
  }

  pre {
    margin: 0;
    overflow-x: auto;
  }

  button {
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    border: none;
    background: none;
    padding: 0;
    color: inherit;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  img, svg {
    display: block;
    max-width: 100%;
  }
`;
