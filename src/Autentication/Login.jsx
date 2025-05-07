import { useState, useEffect } from 'react'
import '../styles.css'
import { useNavigate } from 'react-router-dom';
import axios from '../axios';
import { showSuccessToast, showErrorToast, showInfoToast } from '../components/toast';

function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async () => {
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { name, email, password }
        : { email, password };
      const res = await axios.post(endpoint, payload, {
        withCredentials: true
      });

      const data = res.data;

      if (!isRegister) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        showSuccessToast('logged in!');
        navigate('/')
      } else {
        showInfoToast('Registered successfully! Please Login.');
        setIsRegister(false);
      }
    }catch (err) {
      console.log('Error:', err);
      const errorMessage = err.response?.data?.error || 'Server error';
      showErrorToast(errorMessage);
    }
    
  };

  return (
    <>
      <div className='bg-black flex items-center justify-center h-screen w-screen'>
        <div className='bg-gray-400 p-6 rounded-xl  max-w-md'>
          <p className='pb-2 text-3xl'>{isRegister ? 'Register' : 'Login'}</p>
          <p className='pb-2'>{isRegister ? 'Already have an account?' : "New User?"}{' '}
            <span className='cursor-pointer text-white hover:underline' onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'Login' : 'Register'}
            </span>
          </p>
          {isRegister ? <input type="text" className='bg-white w-full p-2 border rounded mb-3' placeholder='Name' value={name} onChange={(e) => setName(e.target.value)} /> : <></>}
          <input type="email" className='bg-white w-full p-2 border rounded mb-3' placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className='bg-white w-full p-2 border rounded mb-3' placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={handleSubmit} className='bg-gray-600 w-full p-2 border rounded mb-3'>
            {isRegister ? 'Register' : 'Login'}
          </button>
        </div>

      </div>
    </>
  )
}

export default Login
