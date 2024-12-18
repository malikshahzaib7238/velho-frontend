import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Dashboard from './pages/Dashboard';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import TradingPage from './pages/TradingPage';
const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard /> // Public route
  },
  {
    path: "/trade",
    element: <TradingPage/>
  }
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
