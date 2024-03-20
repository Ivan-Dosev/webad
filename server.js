/*
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const clients = {};

const transactionsDir = './transactions';
if (!fs.existsSync(transactionsDir)) {
    fs.mkdirSync(transactionsDir);
    console.log(`Created directory: ${transactionsDir}`);
}

app.post('/receive_address', (req, res) => {
    const { clientId, address } = req.body;
    console.log(`Received address: ${address} for client: ${clientId}`);
    if (!clients[clientId]) {
        clients[clientId] = {};
    }
    clients[clientId].lastWalletAddress = address;
    fetchAndSaveTransactions(clientId, address);  // Fetch and save transactions immediately after receiving the address
    res.status(200).send({ message: 'Address received and transactions are being fetched' });
});

const fetchAndSaveTransactions = (clientId, address) => {
    console.log(`Fetching transactions for address: ${address}`);
    const curlCommand = `curl -sS --request GET \
        --url 'https://deep-index.moralis.io/api/v2.2/${address}/verbose?chain=eth&order=DESC' \
        --header 'accept: application/json' \
        --header 'X-API-Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjhkMzA4ZTcyLTU4ZjEtNDVhNi04OGJlLTg2YjEzYjJmZDdjNyIsIm9yZ0lkIjoiMzgzMjQ1IiwidXNlcklkIjoiMzkzNzg2IiwidHlwZUlkIjoiM2Q3MTFmOGUtNjRiNy00MTNhLTk3N2YtOGQ4MjZkNDJlNWUzIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTA2Njg4ODYsImV4cCI6NDg2NjQyODg4Nn0.FC3c9L1nheTUYvOrkbJ8W0OSi5Fa2hRzcVlfZr_C4DY'`;

    exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(`Curl command output snippet: ${stdout.substring(0, 100)}`);
        try {
            const jsonData = JSON.parse(stdout);
            console.log("JSON parsing successful");

            const filePath = `./transactions/${address}.json`;
            console.log(`Saving transactions to ${filePath}`);
            
            fs.writeFile(filePath, stdout, (err) => {
                if (err) {
                    console.error('Error saving transactions to file:', err);
                } else {
                    console.log(`Transactions saved to ${filePath}`);
                }
            });
        } catch (parseError) {
            console.error("Failed to parse JSON:", parseError);
        }
    });
};

app.get('/welcome_message', (req, res) => {
    const { clientId } = req.query;
    if (clients[clientId] && clients[clientId].lastWalletAddress) {
        res.json({ message: `Welcome! Your wallet address is ${clients[clientId].lastWalletAddress}` });
    } else {
        res.json({ message: 'No wallet address found for this client' });
    }
});

app.get('/', (req, res) => {
    res.send('Server is running and ready to receive requests');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
*/
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import OpenAI from "openai";
import dotenv from 'dotenv';
import { exec } from 'child_process';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const clients = {};
const transactionsDir = './transactions';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
if (!fs.existsSync(transactionsDir)) {
    fs.mkdirSync(transactionsDir);
    console.log(`Created directory: ${transactionsDir}`);
}

app.post('/receive_address', (req, res) => {
    const { clientId, address } = req.body;
    if (!clients[clientId]) {
        clients[clientId] = {};
    }
    clients[clientId].lastWalletAddress = address;
    fetchAndSaveTransactions(clientId, address);
    res.status(200).send({ message: 'Address received and transactions are being fetched' });
});

const fetchAndSaveTransactions = async (clientId, address) => {
    console.log(`Fetching transactions for address: ${address}`);
    const curlCommand = `curl -sS --request GET \
        --url 'https://deep-index.moralis.io/api/v2.2/${address}/verbose?chain=eth&order=DESC' \
        --header 'accept: application/json' \
        --header 'X-API-Key: ${process.env.X_API_Key}'`;
exec(curlCommand, async (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            try {
                const jsonData = JSON.parse(stdout);
                const filePath = `${transactionsDir}/${address}.json`;
                fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
                console.log(`Transactions saved to ${filePath}`);
    
                // Using the newer chat completions endpoint
                const prompt = `Analyze the following transaction data: ${JSON.stringify(jsonData)}.\n\n` +
                       `Provide a summary highlighting the number of interactions with different platforms. ` +
                       `Then, based on these interactions, suggest appropriate types of ads that could be shown to the user. ` +
                       `Format your response as follows:\n\n` +
                       `1. Platform: Number of interactions\n` +
                       `2. Suggested Ad Types: List the ad types with brief explanations.`;

    
                const chatCompletion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "system", content: prompt }],
                });
    
                // Accessing the result from the newer structure
                const analysisResult = chatCompletion.choices[0].message.content.trim();
                const analysisFilePath = `${transactionsDir}/analysis_${address}.json`;
                fs.writeFileSync(analysisFilePath, JSON.stringify({ analysis: analysisResult }, null, 2));
                console.log(`Analysis saved to ${analysisFilePath}`);
            } catch (parseError) {
                console.error("Failed to handle data:", parseError);
        }
    });
};

app.get('/welcome_message', (req, res) => {
    const { clientId } = req.query;
    if (clients[clientId] && clients[clientId].lastWalletAddress) {
        res.json({ message: `Welcome! Your wallet address is ${clients[clientId].lastWalletAddress}` });
    } else {
        res.json({ message: 'No wallet address found for this client' });
    }
});

app.get('/', (req, res) => {
    res.send('Server is running and ready to receive requests');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/get_analysis', (req, res) => {
    const { address } = req.query;
    console.log(`Received request for address: ${address}`); // Log to see if this route is hit

    if (!address) {
        return res.status(400).send('Address parameter is required');
    }

    const analysisFilePath = `${transactionsDir}/analysis_${address}.json`;

    fs.readFile(analysisFilePath, (err, data) => {
        if (err) {
            console.error('Error reading analysis file:', err);
            return res.status(500).send('Error reading analysis data');
        }

        res.json(JSON.parse(data));
    });
});
