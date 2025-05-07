import axios from 'axios';

const instance=axios.create({
    baseURL:'https://schat-backend-xu2j.onrender.com',
    withCredentials:true,
});

export default instance;