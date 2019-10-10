import * as Keychain from 'react-native-keychain';

class Persistence {
    constructor() {
    }

    async save(key, value) {
        try {
            await Keychain.setInternetCredentials(key, '', value)
        } catch (error) {
            console.log({ status: 'Could not save, ' + error });
        }
    }

    async get(key) {
        const credentials = await Keychain.getInternetCredentials(key);
        var value = null;

        if (credentials) {
            value = credentials.password;
        } 

        return value;
    }

    reset(key) {
        return Keychain.resetInternetCredentials(key);
    }
}

const PersistenceService = new Persistence();

export default PersistenceService;