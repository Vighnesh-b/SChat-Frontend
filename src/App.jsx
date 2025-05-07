import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Login from './Autentication/Login';
import Home from './Pages/Home';
import { WebSocketProvider } from './context/webSocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorPage from './components/ErrorPage';
import NotFound from './components/NotFound';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <ErrorPage />, 
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '*',
    element: <NotFound />, 
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_startTransition: true,
  },
});

function App() {
  return (
    <React.StrictMode>
      <WebSocketProvider>
        <RouterProvider router={router} />
        <ToastContainer
          position="bottom-center" 
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastStyle={{
            borderRadius: '8px',
            background: '#1e293b', 
            color: '#f8fafc', 
          }}
        />
      </WebSocketProvider>
    </React.StrictMode>
  );
}

export default App;