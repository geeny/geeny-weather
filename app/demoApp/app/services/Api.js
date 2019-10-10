import { PersistenceService } from './';

class Api {
    constructor() {
        this.endpoint = 'https://api.tingg.io/';
        this.token = '';
        // @TODO: get topics dynamically through thing type call
        this.topics = ["humidity", "temp_dht", "temp_1w_in", "temp_1w_out", "dust"];
    }

    authHeader() {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + this.token,
        };
    }

    async login(email, password) {
        let trimmedEmail = email.toLowerCase().trim();
        let url = this.endpoint + 'accounts/auth/login';

        try {
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: trimmedEmail,
                    password: password,
                }),
            });

            var jsonResult = {};

            if (response.ok) {
                jsonResult = await response.json();
            }

            if (jsonResult.token !== undefined) {
                this.token = jsonResult.token;
                await this.save('token', this.token);
            }
        } catch (error) {
            console.error(error);
        }
    }

    loadToken = async () => {
        try {
            let token = await PersistenceService.get('token');
            if (token && token.length > 0) {
                this.token = token;
            } else {
                console.log('No token stored')
            }
        } catch (error) {
            console.error('Persistence could not be accessed!', error);
        }
    }

    isLoggedIn = () => {
        return this.token.length > 0;
    }

    logout = () => {
        this.token = '';
        PersistenceService.reset('token');
    }

    save = async (key, value) => {
        await PersistenceService.save(key, value);
    }

    getThings = async () => {
        let url = this.endpoint + 'v1/things';

        try {
            let response = await fetch(url, {
                method: 'GET',
                headers: this.authHeader(),
            });
            var data = [];

            if (response.ok) {
                jsonResult = await response.json();
                data = jsonResult.data !== undefined ? jsonResult.data : [];
            }
            else {
                this.logout();
            }

            return data;
        } catch (error) {
            console.error(error);
        }
    }

    getThingId = async () => {
        try {
            let thingId = await PersistenceService.get('thingId');
            if (thingId && thingId.length > 0) {
                return thingId;
            } else {
                console.log('No thingId stored')
            }
        } catch (error) {
            console.error('Persistence could not be accessed!', error);
        }
    }

    getData = async (thingId) => {
        try {
            var data = {};

            for (const topic of this.topics) {
                let value = await this.getLastDataPointForTopic(thingId, topic);
                
                if(value !== null) {
                   data[topic] = value;
                }
            }

            console.log(data);
            return data;
        } catch (error) {
            console.error(error);
        }
    }

    getLastDataPointForTopic = async (thingId, topic) => {
        const encodedValue = encodeURIComponent(thingId)
        let url = this.endpoint + 'v1/data?thing_id=' + encodedValue + '&limit=1&topic=' + topic;

        try {
            let response = await fetch(url, {
                method: 'GET',
                headers: this.authHeader(),
            });

            var value = null;
            if (response.ok) {
                jsonResult = await response.json();

                value = jsonResult.data && jsonResult.data.length > 0 ? this.parseData(jsonResult.data) : null;
            }
            else {
                this.logout();
            }

            return value;
        } catch (error) {
            console.error(error);
        }
    }

    parseData(data) {
        let dataPoint = data[0];
        let value = dataPoint.payload !== undefined && dataPoint.payload.value !== undefined ? Number(dataPoint.payload.value) : null;

        return value;
    }
}

const ApiService = new Api();

export default ApiService;
