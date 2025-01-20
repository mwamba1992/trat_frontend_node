import axios from 'axios';
import { Config } from '@/utils/Config';

const LOGIN_URL = Config.API_BASE_URL + '/auth/login';

export  const SetupService = {
    async login(username, password) {
        return axios.post(`${LOGIN_URL}`, { username, password }).then((res) => res.data);
    }
}
