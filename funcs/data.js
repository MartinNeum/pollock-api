const fs = require("fs");
const {status} = require("express/lib/response");

const pollsFilePath = './data/polls.json';

function getPolls() {
    fs.readFile(pollsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read poll-File.', err);
            status(404).json({error: 'Poll not found.'});
            return;
        }
        return JSON.parse(data);
    });
    //TODO: fix this function
}
function addPoll(poll) {
    fs.readFile(pollsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read poll-File.', err);
            status(404).json({error: 'Poll not found.'});
            return;
        }
        return JSON.parse(data);
    });
    //TODO: continue
}

module.exports = getPolls;