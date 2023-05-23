const express = require('express');
const router = express.Router();

const fs = require('fs');
const {VoteChoice, Vote, VoteResult, VoteInfo, GeneralVoteObject} = require("../src/Vote");
const User = require("../src/User");
const generateTimestamp = require("../funcs/timestamp");
const Token = require("../src/Token");
const {generateEditToken} = require("../funcs/tokens");
const votesFilePath = './data/votes.json';
const pollsFilePath = './data/polls.json';
const usersFilePath = './data/users.json';

/**
 POST /vote/lack/{token}
 Add a new vote to the poll
 **/
//TODO User nur einmal abstimmen lassen
router.post('/lack/:token', (req, res) => {
    try {
        //req.header("API-KEY")
        const timeStamp = generateTimestamp();
        const editToken = generateEditToken();
        const editLink = "localhost:8080/poll/" + editToken;


        const tokenParam = req.params.token;

        // Check token
        if(tokenParam == null) {
            res.status(405).json({ message: 'Invalid input' });
            return;
        }

        //############################# Vote Obj. erstellen###############################################
        // Request body in variablen abspeichern
        const { owner, choice } = req.body;

        const user = new User.User(owner.name, owner.lock);

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
                res.status(404).json({ message: 'Poll not found.' });
                return;
            }

            const polls = JSON.parse(data);

            // Polls nach token durchsuchen
            const poll = polls.find(p => p.poll.share.value == tokenParam);
            if (!poll) {
                console.log("ERROR: Find Poll failed");
                res.status(404).json({ code: 404, message: 'Poll not found.' });
                return;
            }
            if (poll.poll.body.setting.deadline < timeStamp)
            {
                console.log("ERROR: Deadline ended");
                res.status(410).json({ code: 410, message: 'Poll is gone.' });
                return;
            }

            //############################# Vote Info Obj. erstellen + Speichern ###############################################
            const voteInfo = new VoteInfo(poll,vote, timeStamp);
            const generalVoteObject = new GeneralVoteObject(voteInfo,editToken)
            let voteInfos = [];

            fs.readFile(votesFilePath, 'utf8', (err, voteData) => {
                if (err) {
                    console.log("ERROR: Read Votes failed");
                    res.status(404).json({ message: 'Poll not found.' });
                    return;
                }

                // Vote in votes-array hinzufügen
                if(voteData){
                   // console.log(voteData);
                    voteInfos = JSON.parse(voteData);
                }
                voteInfos.push(generalVoteObject);

                // Votes in .json abspeichern
                fs.writeFile(votesFilePath, JSON.stringify(voteInfos), 'utf8', (err) => {
                    if (err) {
                        console.log("ERROR: Write PollInfo failed");
                        res.status(404).json({ message: 'Poll not found.' });
                        return;
                    }
                });
            });
            //############################# Response erstellen ###############################################
            //Response:

            const returnToken = new Token(editLink,editToken);
            const voteResult = new VoteResult(returnToken);

            res.status(200).json(voteResult);
        });
        //############################################################################

    } catch (error) {
        console.log("ERROR: Fatal Error");
        res.status(404).json({ message: 'Poll not found.' });
    }
});

/**
 GET /vote/lack/{token}
 Find the vote of the token
 **/
//TODO: implement check that only polls with lack visibility can be accessed!
router.get('/lack/:token', (req, res) => {
    try {
        const editToken = req.params.token;

        // Check token
        if(editToken == null) {
            res.status(405).json({ message: 'Invalid input' });
            return;
        }
        //############################# Vote lesen ###############################################
        fs.readFile(votesFilePath, 'utf8', (err, data) => {
            if (err) {
                console.log("ERROR: Read Polls failed");
                res.status(404).json({message: 'Poll not found.'});
                return;
            }

            const voteObjs = JSON.parse(data);
            // console.log(voteInfos);
            let vote = null;
            // Votes nach token durchsuchen
            voteObjs.forEach(voteObj => {
                if (voteObj == null) {
                    console.log("ERROR: Read VoteInfos failed");
                    res.status(405).json({"code": 405, "message": "Invalid input"});
                    return;
                } else {
                    if (voteObj.editToken == editToken) {
                        // Verfügbarkeit der Poll prüfen
                        const timeStamp = generateTimestamp();
                        if (voteObj.voteInfo.poll.poll.body.setting.deadline < timeStamp) {
                            console.log("ERROR: Deadline ended");
                            res.status(410).json({code: 410, message: 'Poll is gone.'});
                            return;
                        }
                        vote = voteObj;
                    }

                }
            });
            //############################# Response erstellen ###############################################
            if (vote == null) {
                console.log("ERROR: False Edit Token");
                res.status(404).json({message: 'Poll not found.'});
            } else {

            const respVoteInfo = new VoteInfo(vote.voteInfo.poll.poll, vote.voteInfo.vote, vote.voteInfo.time)
            res.status(200).json(respVoteInfo);
            }
        });

    } catch (error) {
        console.log("ERROR: Fatal Error");
        res.status(404).json({ message: 'Poll not found.' });
    }

});

/**### PUT /vote/lack/:token ###*/
/**Update a vote of the token.**/
//TODO: implement check that only polls with lack visibility can be accessed!
router.put('/lack/:token', (req, res) => {

    // Token holen
    const editToken = req.params.token;

    // Request body in variablen abspeichern
    const { owner, choice } = req.body;

    // Check token
    if(editToken == null) {
        console.error('ERROR bei PUT /poll/lack/:token: Kein Token geliefert.');
        res.status(404).json({ message: 'Poll not found.' });
        return;
    }

    // voteInfos lesen
    fs.readFile(votesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Datei:', err);
            res.status(404).json({ message: 'Poll not found.' });
            return;
        }

        const voteObjs = JSON.parse(data);

        // voteObj nach token durchsuchen
        let voteIndex = voteObjs.findIndex(p => p.editToken == editToken);

        // vote bearbeiten
        if (voteIndex != -1) {
            voteObjs[voteIndex].voteInfo.vote.choice = choice
            voteObjs[voteIndex].voteInfo.vote.owner = owner

        } else {
            console.error('Fehler beim Bearbeiten des Polls: ', err)
            res.status(404).json({ code: 404, message: 'Poll not found.' });
            return;
        }

        try {

            fs.writeFileSync(votesFilePath, JSON.stringify(voteObjs, null, 2), 'utf8');
            res.json({ "code": 200, message: "i. O." });

        } catch (err) {
            res.status(404).json({ message: 'Poll not found.' })

        }
    });
});

/**### DELETE /vote/lack/:token ###*/
/**Deletes a vote of a token.**/
//TODO: implement check that only polls with lack visibility can be accessed!
router.delete('/lack/:token', (req, res) => {
    try {
    // Token holen
    const editToken = req.params.token;

    // Check token
    if(editToken == null) {
        console.error('ERROR bei DELETE /poll/lack/:token: Kein Token geliefert.');
        res.status(400).json({code: 404, message: 'Invalid poll admin token.' });
        return;
    }
    //############################# Vote lesen ###############################################
    fs.readFile(votesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.log("ERROR: Read Polls failed");
            res.status(404).json({code: 404, message: 'Poll not found.'});
            return;
        }

        const voteObjs = JSON.parse(data);
        // console.log(voteInfos);
        const notDelVotes = [];
        // Votes nach token durchsuchen
        voteObjs.forEach(voteObj => {
            if (voteObj == null) {
                console.log("ERROR: Read VoteInfos failed");
                res.status(404).json({code: 404, message: "Poll not found."});
                return;
            } else {
                if (voteObj.editToken != editToken) {
                    notDelVotes.push(voteObj);
                }
            }
        });
      //  console.log(notDelVotes);
        //############################# Response erstellen ###############################################
        if (notDelVotes.length < voteObjs.length) {
            fs.writeFileSync(votesFilePath, JSON.stringify(notDelVotes, null, 2), 'utf8');
            res.json({ "code": 200, "message": "i. O." });
        } else {
            console.error('\nERROR bei DELETE /vote/lack/:token: Schreiben des neuen Arrays schlug fehl.');
            console.error('\nEdit Token prüfen.');
            res.status(400).json({ error: 'Invalid poll admin token.' });
        }
       // fs.writeFileSync(votesFilePath, JSON.stringify(notDelVotes, null, 2), 'utf8');
       // res.json({"code": 200, message: "i. O."});
    });
    } catch (error) {
            console.log("ERROR: Fatal Error");
            res.status(404).json({code: 404, message: 'Poll not found.' });
        }
});




/******************************************************************************************************************************/
/************************************************  /vote/lock ENDPOINTS  ******************************************************/
/******************************************************************************************************************************/


/**
 * POST /vote/lock/{token} Add a new vote to the poll
 */
router.post('/lock/:token', (req, res) => {
    try {

        const apiKey = req.header("API-KEY")
        const timeStamp = generateTimestamp();
        const editToken = generateEditToken();
        const editLink = "localhost:8080/poll/" + editToken;
        const tokenParam = req.params.token;

        // Check token
        if(tokenParam == null) {
            res.status(405).json({ message: 'Invalid input' });
            return;
        }

        //############################# Vote Obj. erstellen###############################################
        // Request body in variablen abspeichern
        const { owner, choice } = req.body;

        // Check if required fields are provided: owner.name, choice.length
        if (owner.name == "" || owner.name == null || choice.length < 1) {
            console.log("\nError bei POST /vote/lock/:token: Mindestens ein benötigtes Feld wurde nicht geliefert.");
            res.status(405).json({ "code": 405, "message": "Invalid input" });
            return
        }

        const user = new User.User(owner.name, owner.lock);

        const voteChoices = [];
        choice.forEach(choice => {
            if (choice.id == null || choice.worst == null) {
                console.log("\nERROR: Read VoteChoices failed");
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
        fs.readFile(pollsFilePath, 'utf8', (err, pollData) => {
            if(err){
                console.log("\nERROR: Read Polls failed");
                res.status(404).json({ message: 'Poll not found.' });
                return;
            }

            const polls = JSON.parse(pollData);

            // Polls nach token durchsuchen
            const poll = polls.find(p => p.poll.share.value == tokenParam);
            if (!poll) {
                console.log("\nERROR: Find Poll failed");
                res.status(404).json({ code: 404, message: 'Poll not found.' });
                return;
            }

            // Check maximum Votes
            if (choice.length > poll.poll.body.setting.voices) {
                console.log("\nError bei POST /vote/lock/:token: Maximal " + poll.poll.body.setting.voices + " Stimme(n) erlaubt.");
                res.status(405).json({ "code": 405, "message": "Invalid input" });
                return
            }

            // Check Security Permissions
            var myUser = null;
            if (poll.poll.security.visibility == "lock")
            {
                // Get User by API Key
                if (apiKey != null)
                {
                    fs.readFile(usersFilePath, 'utf8', (err, userData) => {
                        if (err) {
                            console.log("\nERROR: Read Polls failed");
                            res.status(404).json({message: 'Poll not found.'});
                            return;
                        }
                        const users = JSON.parse(userData);
                        // Polls nach token durchsuchen
                        myUser = users.find(u => u.apiKey == apiKey);
                    });
                }
                else{
                    res.status(405).json({ message: 'Invalid input' });
                    return;
                }
                if (!poll.poll.security.users.contains(myUser.user) || myUser.user.lock != "true")
                {
                    res.status(404).json({code: 404, message: 'Poll not found.'});
                    return;
                }
            }

            // Check if Poll is alive
            if (poll.poll.body.setting.deadline < timeStamp)
            {
                console.log("\nERROR: Deadline ended");
                res.status(410).json({ code: 410, message: 'Poll is gone.' });
                return;
            }

            //############################# Vote Info Obj. erstellen + Speichern ###############################################
            const voteInfo = new VoteInfo(poll,vote, timeStamp);
            const generalVoteObject = new GeneralVoteObject(voteInfo,editToken)
            let voteInfos = [];

            fs.readFile(votesFilePath, 'utf8', (err, voteData) => {
                if (err) {
                    console.log("\nERROR: Read Votes failed");
                    res.status(404).json({ message: 'Poll not found.' });
                    return;
                }

                // Vote in votes-array hinzufügen
                if(voteData){
                    // console.log(voteData);
                    voteInfos = JSON.parse(voteData);
                }
                voteInfos.push(generalVoteObject);

                // Votes in .json abspeichern
                fs.writeFile(votesFilePath, JSON.stringify(voteInfos), 'utf8', (err) => {
                    if (err) {
                        console.log("\nERROR: Write PollInfo failed");
                        res.status(404).json({ message: 'Poll not found.' });
                        return;
                    }
                });
            });
            //############################# Response erstellen ###############################################
            //Response:

            const returnToken = new Token(editLink,editToken);
            const voteResult = new VoteResult(returnToken);

            res.status(200).json(voteResult);
        });
        //############################################################################

    } catch (error) {
        console.log("ERROR: Fatal Error");
        res.status(404).json({ message: 'Poll not found.' });
    }
});

/**
 GET /vote/lock/{token}
 Find the vote of the token
 **/
//TODO: API-Key prüfen lassen
router.get('/lock/:token', (req, res) => {
    try {
        const editToken = req.params.token;

        // Check token
        if(editToken == null) {
            res.status(405).json({ message: 'Invalid input' });
            return;
        }
        //############################# Vote lesen ###############################################
        fs.readFile(votesFilePath, 'utf8', (err, data) => {
            if (err) {
                console.log("ERROR: Read Polls failed");
                res.status(404).json({message: 'Poll not found.'});
                return;
            }

            const voteObjs = JSON.parse(data);
            // console.log(voteInfos);
            let vote = null;
            // Votes nach token durchsuchen
            voteObjs.forEach(voteObj => {
                if (voteObj == null) {
                    console.log("ERROR: Read VoteInfos failed");
                    res.status(405).json({"code": 405, "message": "Invalid input"});
                    return;
                } else {
                    if (voteObj.editToken == editToken) {
                        // Verfügbarkeit der Poll prüfen
                        const timeStamp = generateTimestamp();
                        if (voteObj.voteInfo.poll.poll.body.setting.deadline < timeStamp) {
                            console.log("ERROR: Deadline ended");
                            res.status(410).json({code: 410, message: 'Poll is gone.'});
                            return;
                        }
                        vote = voteObj;
                    }

                }
            });
            //############################# Response erstellen ###############################################
            if (vote == null) {
                console.log("ERROR: False Edit Token");
                res.status(404).json({message: 'Poll not found.'});
            } else {

                const respVoteInfo = new VoteInfo(vote.voteInfo.poll.poll, vote.voteInfo.vote, vote.voteInfo.time)
                res.status(200).json(respVoteInfo);
            }
        });

    } catch (error) {
        console.log("ERROR: Fatal Error");
        res.status(404).json({ message: 'Poll not found.' });
    }

});

/**### PUT /vote/lock/:token ###*/
/**Update a vote of the token.**/
//TODO: API-Key prüfen lassen
router.put('/lock/:token', (req, res) => {

    // Token holen
    const editToken = req.params.token;

    // Request body in variablen abspeichern
    const { owner, choice } = req.body;

    // Check token
    if(editToken == null) {
        console.error('ERROR bei PUT /poll/lack/:token: Kein Token geliefert.');
        res.status(404).json({ message: 'Poll not found.' });
        return;
    }

    // voteInfos lesen
    fs.readFile(votesFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Fehler beim Lesen der Datei:', err);
            res.status(404).json({ message: 'Poll not found.' });
            return;
        }

        const voteObjs = JSON.parse(data);

        // voteObj nach token durchsuchen
        let voteIndex = voteObjs.findIndex(p => p.editToken == editToken);

        // vote bearbeiten
        if (voteIndex != -1) {
            voteObjs[voteIndex].voteInfo.vote.choice = choice
            voteObjs[voteIndex].voteInfo.vote.owner = owner

        } else {
            console.error('Fehler beim Bearbeiten des Polls: ', err)
            res.status(404).json({ code: 404, message: 'Poll not found.' });
            return;
        }

        try {

            fs.writeFileSync(votesFilePath, JSON.stringify(voteObjs, null, 2), 'utf8');
            res.json({ "code": 200, message: "i. O." });

        } catch (err) {
            res.status(404).json({ message: 'Poll not found.' })

        }
    });
});


/**### DELETE /vote/lock/:token ###*/
/**Deletes a vote of a token.**/
//TODO: API-Key prüfen lassen
router.delete('/lock/:token', (req, res) => {
    try {
        // Token holen
        const editToken = req.params.token;

        // Check token
        if(editToken == null) {
            console.error('ERROR bei DELETE /poll/lack/:token: Kein Token geliefert.');
            res.status(400).json({code: 404, message: 'Invalid poll admin token.' });
            return;
        }
        //############################# Vote lesen ###############################################
        fs.readFile(votesFilePath, 'utf8', (err, data) => {
            if (err) {
                console.log("ERROR: Read Polls failed");
                res.status(404).json({code: 404, message: 'Poll not found.'});
                return;
            }

            const voteObjs = JSON.parse(data);
            // console.log(voteInfos);
            const notDelVotes = [];
            // Votes nach token durchsuchen
            voteObjs.forEach(voteObj => {
                if (voteObj == null) {
                    console.log("ERROR: Read VoteInfos failed");
                    res.status(404).json({code: 404, message: "Poll not found."});
                    return;
                } else {
                    if (voteObj.editToken != editToken) {
                        notDelVotes.push(voteObj);
                    }
                }
            });
            //  console.log(notDelVotes);
            //############################# Response erstellen ###############################################
            if (notDelVotes.length < voteObjs.length) {
                fs.writeFileSync(votesFilePath, JSON.stringify(notDelVotes, null, 2), 'utf8');
                res.json({ "code": 200, "message": "i. O." });
            } else {
                console.error('\nERROR bei DELETE /vote/lack/:token: Schreiben des neuen Arrays schlug fehl.');
                console.error('\nEdit Token prüfen.');
                res.status(400).json({ error: 'Invalid poll admin token.' });
            }
            // fs.writeFileSync(votesFilePath, JSON.stringify(notDelVotes, null, 2), 'utf8');
            // res.json({"code": 200, message: "i. O."});
        });
    } catch (error) {
        console.log("ERROR: Fatal Error");
        res.status(404).json({code: 404, message: 'Poll not found.' });
    }
});


module.exports = router;