const fs = require("fs");
const {status} = require("express/lib/response");

const pollsFilePath = './data/polls.json';

function getPolls(filepath) {
    let returnvalue = [];
    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read poll-File.', err);
            status(404).json({error: 'Poll not found.'});
            return;
        }
        //console.log(data);

        returnvalue = JSON.parse(data);
       // console.log(returnvalue);

    });
   // console.log(returnvalue);
    return returnvalue;

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

}

module.exports = getPolls;