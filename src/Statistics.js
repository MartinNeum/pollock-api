class Statistics {
    constructor(poll, participants, options) {
        this.poll = poll
        this.participants = participants
        this.options = options
    }
}

class StatisticsOption {
    constructor(voted, worst) {
        this.voted = voted
        this.worst = worst
    }
}

module.exports = {
    Statistics,
    StatisticsOption
}