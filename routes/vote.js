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
//TODO User nur einmal abstimmen lassen
router.post('/lack/:token', (req, res) => {
    try {
        //req.header("API-KEY")
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
            // TODO testen
            if (poll.body.setting.deadline < timeStamp)
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
            // FIXME möglicherweise Result irgendwo ablegen/ verknüpfen?
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
            voteInfos.forEach(voteInfo => {
                if (voteInfo == null) {
                    console.log("ERROR: Read VoteInfos failed");
                    res.status(405).json({ "code": 405, "message": "Invalid input" });
                    return;
                } else {
                    if(voteInfo.poll.share.value == token){
                        // Verfügbarkeit der Poll prüfen
                        const timeStamp = generateTimestamp();
                        if (voteInfos.poll.body.setting.deadline < timeStamp)
                        {
                            console.log("ERROR: Deadline ended");
                            res.status(410).json({ code: 410, error: 'Poll is gone.' });
                            return;
                        }
                        votes.push(voteInfo);
                    }
                }
            });
            //############################# Response erstellen ###############################################

            res.status(200).json(votes);
        });

    } catch (error) {
        console.log("ERROR: Fatal Error");
        res.status(404).json({ error: 'Poll not found.' });
    }

});

/**### DELETE /vote/lack/:token ###*/
/**Deletes a vote of a token.**/
router.delete('/lack/:token', (req, res) => {
    try {

    // Token holen
    const token = req.params.token;

    // Check token
    if(token == null) {
        console.error('ERROR bei DELETE /poll/lack/:token: Kein Token geliefert.');
        res.status(405).json({ error: 'ERROR bei DELETE /poll/lack/:token: Kein Token geliefert.' });
        return;
    }
    //############################# Vote lesen ###############################################
    fs.readFile(votesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.log("ERROR: Read Polls failed");
            res.status(404).json({error: 'Poll not found.'});
            return;
        }

        const voteInfos = JSON.parse(data);
        // console.log(voteInfos);
        const notDelVotes = [];
        // Votes nach token durchsuchen
        voteInfos.forEach(voteInfo => {
            if (voteInfo == null) {
                console.log("ERROR: Read VoteInfos failed");
                res.status(405).json({"code": 405, "message": "Invalid input"});
                return;
            } else {
               // console.log(voteInfo);
                if (voteInfo.poll.share.value != token) {
                    console.log("hier wird hinzugefügt");
                    notDelVotes.push(voteInfo);
                }

            }
        });
      //  console.log(notDelVotes);
        //############################# Response erstellen ###############################################

        fs.writeFileSync(votesFilePath, JSON.stringify(notDelVotes, null, 2), 'utf8');
        res.json({"code": 200, "message": "i. O."});

        // TODO Admin Token prüfen
        //res.status(400).json({error: 'Invalid poll admin token.'});
    });
    } catch (error) {
            console.log("ERROR: Fatal Error");
            res.status(404).json({ error: 'Poll not found.' });
        }

});
/**### PUT /vote/lack/:token ###*/
/**Update a vote of the token.**/
router.put('/lack/:token', (req, res) => {

    // Token holen
    const token = req.params.token;

    // Request body in variablen abspeichern
    const { owner, choice } = req.body;

    // Check token
    if(token == ':token' || token == null) {
        console.error('ERROR bei PUT /poll/lack/:token: Kein Token geliefert.');
        res.status(404).json({ error: 'Poll not found.' });
        return;
    }

    // voteInfos lesen
    fs.readFile(votesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Datei:', err);
            res.status(404).json({ error: 'Poll not found.' });
            return;
        }

        const voteinfos = JSON.parse(data);

        // voteInfo nach token durchsuchen
        let voteIndex = voteinfos.findIndex(p => p.poll.share.value == token && p.vote.owner.name == owner.name);

        // vote bearbeiten
        if (voteIndex != -1) {
            voteinfos[voteIndex].vote.choice = choice

        } else {
            console.error('Fehler beim Bearbeiten des Polls: ', err)
            res.status(404).json({ code: 404, error: 'Poll not found.' });
            return;
        }

        try {

            fs.writeFileSync(votesFilePath, JSON.stringify(voteinfos, null, 2), 'utf8');
            res.json({ "code": 200, "message": "i. O." });

        } catch (err) {

            console.error('\nERROR bei PUT /poll/lack/:token\n ', error)
            res.status(404).json({ error: 'Poll not found.' })

        }

    });

});


module.exports = router;