const express = require('express');
const router = express.Router();

const fs = require('fs');
const {VoteChoice, Vote, VoteResult, VoteInfo} = require("../src/Vote");
const User = require("../src/User");
const generateTimestamp = require("../funcs/timestamp");
const Token = require("../src/Token");
const votesFilePath = './data/votes.json';
const pollsFilePath = './data/polls.json';

/**
 POST /vote/lack/{token}
 Add a new vote to the poll
 **/
router.post('/lack/:token', (req, res) => {
    try {
        const timeStamp = generateTimestamp();

        const token = req.params.token;

        // Check token
        if(token == ':token' || token == null) {
            res.status(405).json({ error: 'Invalid input' });
            return;
        }

        //############################# Vote Obj. erstellen###############################################
        // Request body in variablen abspeichern
        const { owner, choice } = req.body;

        const user = new User(owner.name, owner.lock);

        const voteChoices = [];
        choice.forEach(choice => {
            if (choice.id == null || choice.worst == null) {
                console.log("ERROR: Read VoteChoices failed");
                res.status(405).json({ "code": 405, "message": "Invalid input" });
                return;
            } else {
                const voteChoice = new VoteChoice(choice.id, choice.worst);
                voteChoices.push(voteChoice);
            }
        });
        console.log("2");
        // Neues Vote Objekt
        const vote = new Vote(user, voteChoices);

        fs.readFile(votesFilePath, 'utf8', (err, data) => {
            if (err) {
                console.log("ERROR: Read Votes failed");
                res.status(404).json({ error: 'Poll not found.' });
                return;
            }
        });
        console.log("2.1");
        //############################# Poll lesen ###############################################
        fs.readFile(pollsFilePath, 'utf8', (err, data) => {
            if (err) {
                console.log("ERROR: Read Polls failed");
                res.status(404).json({ error: 'Poll not found.' });
                return;
            }
            console.log("2.2");
            const polls = JSON.parse(data);

            // Polls nach token durchsuchen
            const poll = polls.find(p => p.share.value == token);
            if (!poll) {
                console.log("ERROR: Find Poll failed");
                res.status(404).json({ code: 404, error: 'Poll not found.' });
                return;
            }
            console.log("2.3");
            if (poll.deadline < timeStamp)
            {
                console.log("ERROR: Deadline ended");
                res.status(410).json({ code: 404, error: 'Poll is gone.' });
                return;
            }
            console.log("3");
            //############################# Vote Info Obj. erstellen + Speichern ###############################################
            const voteInfo = new VoteInfo(poll,vote, timeStamp);

            // Vote in votes-array hinzufügen
            let voteInfos = [];
            if (data) {
                voteInfos = JSON.parse(data);
            }
            voteInfos.push(voteInfo);

            // Votes in .json abspeichern
            fs.writeFile(votesFilePath, JSON.stringify(voteInfos), 'utf8', (err) => {
                if (err) {
                    console.log("ERROR: Write PollInfo failed");
                    res.status(404).json({ error: 'Poll not found.' });
                    return;
                }
            });

            //############################# Response erstellen ###############################################
            //Response:
            //const token = new Token(poll.share.link, poll.share.value);

            const voteResult = new VoteResult(poll.share);
            console.log(poll.share);
            res.status(200).json(voteResult);
        });
        //############################################################################

    } catch (error) {
        console.log("ERROR: Fatal Error");
        res.status(404).json({ error: 'Poll not found.' });
    }
});


module.exports = router;