class Poll {
    constructor(body, security, share) {
        this.body = body
        this.security = security
        this.share = share
    }
}

class PollBody {
    constructor(title, description, options, setting, fixed) {
        this.title = title;
        this.description = description;
        this.options = options;
        this.setting = setting;
        this.fixed = fixed
    }
}

class PollOption {
    constructor(id, text) {
        this.id = id
        this.text = text
    }
}

class PollResult {
    constructor(admin, share) {
        this.admin = admin
        this.share = share
    }
}

class PollSecurity {
    constructor(owner, users, visibility) {
        this.owner = owner
        this.users = users
        this.visibility = visibility
    }
}

class PollSetting {
    constructor(voices, worst, deadline) {
        this.voices = voices;
        this.worst = worst;
        this.deadline = deadline
    }
}

module.exports = {
    Poll,
    PollBody,
    PollOption,
    PollResult,
    PollSecurity,
    PollSetting
}