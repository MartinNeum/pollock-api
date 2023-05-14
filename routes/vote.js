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

        // Neues Vote Objekt
        const vote = new Vote(user, voteChoices);
        //############################# Poll lesen ###############################################
        fs.readFile(pollsFilePath, 'utf8', (err, data) => {
            if (err) {
                console.log("ERROR: Read Polls failed");
                res.status(404).json({ error: 'Poll not found.' });
                return;
            }

            const polls = JSON.parse(data);

            // Polls nach token durchsuchen
            const poll = polls.find(p => p.share.value == token);
            if (!poll) {
                console.log("ERROR: Find Poll failed");
                res.status(404).json({ code: 404, error: 'Poll not found.' });
                return;
            }
            // TODO poll.body.setting.deadline?
            if (poll.deadline < timeStamp)
            {
                console.log("ERROR: Deadline ended");
                res.status(410).json({ code: 410, error: 'Poll is gone.' });
                return;
            }

            //############################# Vote Info Obj. erstellen + Speichern ###############################################
            const voteInfo = new VoteInfo(poll,vote, timeStamp);
            let voteInfos = [];

            fs.readFile(votesFilePath, 'utf8', (err, voteData) => {
                if (err) {
                    console.log("ERROR: Read Votes failed");
                    res.status(404).json({ error: 'Poll not found.' });
                    return;
                }

                // Vote in votes-array hinzufügen
                if(voteData){
                    console.log(voteData);
                    voteInfos = JSON.parse(voteData);
                }
                voteInfos.push(voteInfo);

                console.log(voteInfos);

                // Votes in .json abspeichern
                fs.writeFile(votesFilePath, JSON.stringify(voteInfos), 'utf8', (err) => {
                    if (err) {
                        console.log("ERROR: Write PollInfo failed");
                        res.status(404).json({ error: 'Poll not found.' });
                        return;
                    }
                });
            });
            //############################# Response erstellen ###############################################
            //Response:
            //const token = new Token(poll.share.link, poll.share.value);
            // TODO möglicherweise neues Token erstellen
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

/**
 GET /vote/lack/{token}
 Find the vote of the token
 **/
router.get('/lack/:token', (req, res) => {
    try {


        const token = req.params.token;

        // Check token
        if(token == ':token' || token == null) {
            res.status(405).json({ error: 'Invalid input' });
            return;
        }


        //############################# Vote lesen ###############################################
        fs.readFile(votesFilePath, 'utf8', (err, data) => {
            if (err) {
                console.log("ERROR: Read Polls failed");
                res.status(404).json({ error: 'Poll not found.' });
                return;
            }

            const voteInfos = JSON.parse(data);
           // console.log(voteInfos);
            const votes = [];
            // Votes nach token durchsuchen
            voteInfos.forEach(voteInfos => {
                if (voteInfos == null) {
                    console.log("ERROR: Read VoteInfos failed");
                    res.status(405).json({ "code": 405, "message": "Invalid input" });
                    return;
                } else {
                    if(voteInfos.poll.share.value == token){
                        // Verfügbarkeit der Poll prüfen
                        const timeStamp = generateTimestamp();
                        if (voteInfos.poll.body.setting.deadline < timeStamp)
                        {
                            console.log("ERROR: Deadline ended");
                            res.status(410).json({ code: 410, error: 'Poll is gone.' });
                            return;
                        }
                        votes.push(voteInfos);
                    }

                }
            });


            //############################# Response erstellen ###############################################
            res.status(200).json(votes);
        });
        //############################################################################

    } catch (error) {
        console.log("ERROR: Fatal Error");
        res.status(404).json({ error: 'Poll not found.' });
    }

});


module.exports = router;