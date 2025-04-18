import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// 初始化VSCode API
const vscode = window.acquireVsCodeApi();
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>
    <App vscode={vscode}/>
  </React.StrictMode>);
//# sourceMappingURL=main.js.map