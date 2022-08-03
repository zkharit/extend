const readline = require('readline-sync');
const https = require('https');

function promptUser()
{
    response = readline.question("Enter an option to proceed: \n \
        1. List Virtual Cards \n \
        2. List Transactions \n \
        3. List Transaction Details \n \
        4. Logout \n \
        5. Quit \n");

        if(response == 1)
        {
            getUserVirtualCards(token, promptUser);
        }
        else if(response == 2)
        {
            getUserVirtualCards(token, getVirtualCardTransactions);
        }
        else if(response == 3)
        {
            getUserVirtualCards(token, getTransactionDetails);
        }
        else if(response == 4)
        {
            console.log("Successfully Logged Out\n");
            begin();
        }
        else if(response == 5)
        {
            console.log("Goodbye!\n");
        }
        else{
            console.log("Invalid Input\n");
            promptUser();
        }
}

function signIn(email, password, callback)
{
    const data = JSON.stringify({
        email: email,
        password: password
    });

    const options = {
        hostname: 'api.paywithextend.com',
        port: 443,
        path: '/signin',
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Accept': 'application/vnd.paywithextend.v2021-03-12+json'
        },
    };
    
    const req = https.request(options, res => {
        if(res.statusCode == 403)
        {
            console.log("Invalid Credentials\n");
            begin();
        }
        else if(res.statusCode == 200)
        {
            res.on('data', d => {
                obtainedToken = JSON.parse(d).token;
                setUserToken(obtainedToken);

                if(token !== undefined)
                {
                    callback();
                }
                else
                {
                    console.log("Unable to retrieve authentication token exiting...\n");
                }
            });
        }
        else
        {
            console.log(`Unknown HTTP Response Code: ${res.statusCode}\n`);
        }
    });
    
    req.on('error', error => {
        console.error(error);
    });
    
    req.write(data);
    req.end();
}

function getUserVirtualCards(token, callback)
{
    // http request options
    const options = {
        hostname: 'api.paywithextend.com',
        port: 443,
        path: '/virtualcards',
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.paywithextend.v2021-03-12+json',
        'Authorization': `Bearer ${token}`,
        },
    };
    
    const req = https.request(options, res => {    
        if(res.statusCode == 401)
        {
            console.log("Unauthorized Request\n");
            promptUser();
        }
        else if(res.statusCode == 200)
        {
            res.on('data', d => {
                // get virtual card arry from response
                let virtualCardsResponse = JSON.parse(d).virtualCards;
                let virtualCardIDs = [];
                
                if(virtualCardsResponse.length > 0)
                {
                    let formatter = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 2
                    });

                    console.log("Virtual Card IDs: \n");
                    // iterate through virtual card ID's array and print virtual card ID
                    for(let i = 0; i < virtualCardsResponse.length; i++)
                    {
                        virtualCardIDs[i] = virtualCardsResponse[i].id;
                        console.log(`${i+1}: ${virtualCardIDs[i]} ; Balance: ${formatter.format(virtualCardsResponse[i].balanceCents / 100.0)}`);
                    }
                    console.log("");

                    if(callback == promptUser)
                    {
                        promptUser();
                    }
                    else if(callback == getVirtualCardTransactions)
                    {
                        getVirtualCardTransactions(token, virtualCardIDs, promptUser)
                    }
                    else if(callback == getTransactionDetails)
                    {
                        getVirtualCardTransactions(token, virtualCardIDs, getTransactionDetails)
                    }
                }
                else
                {
                    console.log("No Virtual Cards found for this user\n");
                    promptUser();
                }
            });
        }
        else
        {
            console.log(`Unknown HTTP Response Code: ${res.statusCode}\n`);
        }
    });
    
    req.on('error', error => {
        console.error(error);
    });
    
    req.end();
}

function getVirtualCardTransactions(token, virtualCardIDs, callback)
{
    let virtualCard;

    if(virtualCardIDs.length > 1)
    {
        // should have better input checking here
        // ask the user which virtual  card they want to use
        virtualCard = readline.question(`Please a virtual Card ID from above (1 - ${virtualCardIDs.length})\n`);
        // subtract 1 since they are numberd starting from 1 rather than 0
        virtualCard--;
    }
    else if(virtualCardIDs.length == 1)
    {
        // dont need to prompt user here since they only have 1 virtual card
        virtualCard = 0;
    }
    else
    {
        console.log("No Virtual Cards Found\n");
        promptUser();
    }

    if(virtualCard < 0)
    {
        console.log("Invalid Virtual Card\n");
        promptUser();
    }
    
    // obtain the virtual card ID from the users response
    let virtualCardID = virtualCardIDs[virtualCard];

    const options = {
        hostname: 'api.paywithextend.com',
        port: 443,
        path: `/virtualcards/${virtualCardID}/transactions`,
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.paywithextend.v2021-03-12+json',
        'Authorization': `Bearer ${token}`,
        },
    };
    
    const req = https.request(options, res => {    
        if(res.statusCode == 401)
        {
            console.log("Unauthorized Request\n");
            promptUser();
        }
        else if(res.statusCode == 200)
        {
            res.on('data', d => {
                // get transaction arry from response
                let transactionsResponse = JSON.parse(d);
                
                let transactionIDs = [];

                if(transactionsResponse.length > 0)
                {
                    console.log("Virtual Card Transaction IDs: \n");
                    // iterate through virtual card transaction ID's array and print virtual card  transaction IDs
                    for(let i = 0; i < transactionsResponse.length; i++)
                    {
                        transactionIDs[i] = transactionsResponse[i].id;
                        console.log(`${i+1}: ${transactionIDs[i]}`);
                    }
                    console.log("");

                    if(callback == promptUser)
                    {
                        promptUser();
                    }
                    else if(callback == getTransactionDetails)
                    {
                        getTransactionDetails(token, transactionIDs, promptUser);
                    }
                }
                else
                {
                    console.log("No Transactions Found For This Virtual Card\n");
                    promptUser();
                }
            });
        }
        else
        {
            console.log(`Unknown HTTP Response Code: ${res.statusCode}\n`);
        }
    });
    
    req.on('error', error => {
        console.error(error);
    });
    
    req.end();
}

function getTransactionDetails(token, transactionIDs, callback)
{
    let transaction;

    if(transactionIDs.length > 1)
    {
        // should have better input checking here
        // ask the user which virtual card transaction they want to use
        transaction = readline.question(`Please a virtual Card Transaction ID from above (1 - ${transactionIDs.length})\n`);
        // subtract 1 since they are numberd starting from 1 rather than 0
        transaction--;
    }
    else if(transactionIDs.length == 1)
    {
        // dont need to prompt user here since they only have 1 virtual card transaction
        transaction = 0;
    }
    else
    {
        console.log("No Transactions Found\n");
        promptUser();
    }

    if(transaction < 0)
    {
        console.log("Invalid Virtual Card Transaction\n");
        promptUser();
    }
    
    // obtain the virtual card transaction ID from the users response
    let transactionID = transactionIDs[transaction];

    const options = {
        hostname: 'api.paywithextend.com',
        port: 443,
        path: `/transactions/${transactionID}`,
        method: 'GET',
        headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.paywithextend.v2021-03-12+json',
        'Authorization': `Bearer ${token}`,
        },
    };
    
    const req = https.request(options, res => {    
        if(res.statusCode == 401)
        {
            console.log("Unauthorized Request\n");
            promptUser();
        }
        else if(res.statusCode == 200)
        {
            res.on('data', d => {
                // get transaction arry from response
                let transactionResponse = JSON.parse(d);

                console.log(`Transaction ID: ${transactionResponse.id}`);
                console.log(`Cardholder ID: ${transactionResponse.cardholderId}`);
                console.log(`Cardholder Name: ${transactionResponse.cardholderName}`);
                console.log("");

                if(callback == promptUser)
                {
                    promptUser();
                }
            });
        }
        else
        {
            console.log(`Unknown HTTP Response Code: ${res.statusCode}\n`);
        }
    });
    
    req.on('error', error => {
        console.error(error);
    });
    
    req.end();
}

function setUserToken(obtainedToken)
{
    token = obtainedToken;
}

function begin()
{
    console.log("Welcome to Extend\n");

    let token;  // token to store user authentication

    // obtain user email and password
    let email = readline.question("What is your email?\n");
    let password = readline.question("What is your password?\n");

    // perform signin and pass promptuser callback function
    signIn(email, password, promptUser);

    password = "";
}

begin();
