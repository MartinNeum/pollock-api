class Vote {
    constructor(owner, choice) {
        this.owner = owner
        this.choice = choice
    }
}

class VoteChoice {
    constructor(id, worst) {
        this.id = id
        this.worst = worst
    }
}

class VoteInfo {
    constructor(poll, vote, time) {
        this.poll = poll
        this.vote = vote
        this.time = time
    }
}

class VoteResult {
    constructor(decription, edit) {
        this.decription = decription
        this.edit = edit
    }
}

module.exports = {
    Vote,
    VoteChoice,
    VoteInfo,
    VoteResult
}