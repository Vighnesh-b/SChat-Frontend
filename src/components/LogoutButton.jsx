import { useNavigate } from 'react-router-dom';
import axios from '../axios';

function LogoutButton() {
  const navigate = useNavigate();

  const cleanupAndRedirect = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/Login');
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      console.warn('No refresh token found. Already logged out?');
      cleanupAndRedirect();
      return;
    }

    try {
      await axios.post('/auth/logout', {
        refreshToken
      });
      cleanupAndRedirect();
    } catch (err) {
      console.error('Logout failed:', err);
      cleanupAndRedirect();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="mt-4 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 cursor-pointer"
    >
      Logout
    </button>
  );
}

export default LogoutButton;
