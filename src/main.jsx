import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Add this import
import App from './App';
import './styles/main.scss';

const container = document.getElementById('root');
const root = createRoot(container);
try {
    root.render(
        <BrowserRouter> {/* Wrap App with BrowserRouter */}
            <App />
        </BrowserRouter>
    );
} catch (error) {
    console.error('Fatal rendering error:', error);
    root.render(<div>Application crashed: {error.message}</div>);
}

console.log("Main.jsx is running");