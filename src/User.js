class User {
    constructor(name, lock) {
        this.name = name
        this.lock = lock
    }
}
class GeneralUser {
    constructor(user, apiKey) {
        this.user = user
        this.apiKey = apiKey
    }
}

module.exports = {User, GeneralUser}