// import axios from 'axios';

// const API = axios.create({
//     baseURL : 'http://localhost:5000/api',
// });

// API.interceptors.request.use((req) => {
//     const user = JSON.parse(localStorage.getItem('user'));

//     if(user && user.token) {
//         req.headers.Authorization = `Bearer ${user.token}`;
//     }
//     return req;
// });

// export default API;

import axios from "axios";

const API = axios.create({
     baseURL: "http://172.20.10.14:5000/api"
    // baseURL: "http://172.20.10.14:5000/api"
});

API.interceptors.request.use((req) => {

    const token = localStorage.getItem("token");
    console.log("TOKEN SENT:", token); 

    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
});

export default API;