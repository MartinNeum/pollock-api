class User {
    constructor(name, lock) {
        this.name = name
        this.lock = lock
    }
}
class GeneralUser {
    constructor(user, password, apiKey) {
        this.user = user
        this.password = password;
        this.apiKey = apiKey
    }
}

module.exports = {User, GeneralUser}