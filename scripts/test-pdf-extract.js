#!/usr/bin/env node

/**
 * Test script for the llama-pdf-extract endpoint
 * This script sends a PDF file to the endpoint and displays the extracted content
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const API_URL = 'http://localhost:8055'; // Change this if your Directus instance runs on a different port
const PDF_FILE_PATH = path.join(__dirname, '../uploads/39f1912b-4b50-48dc-bbe6-1d1c19434422.pdf');
const ENDPOINT = '/llama-pdf-extract/extract';

async function testPdfExtraction() {
  try {
    console.log('Testing llama-pdf-extract endpoint with PDF file:', PDF_FILE_PATH);
    
    // Check if file exists
    if (!fs.existsSync(PDF_FILE_PATH)) {
      console.error('PDF file not found at path:', PDF_FILE_PATH);
      return;
    }
    
    // Create form data with the PDF file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(PDF_FILE_PATH));
    
    // Send request to the endpoint
    console.log('Sending request to:', `${API_URL}${ENDPOINT}`);
    
    const response = await axios.post(`${API_URL}${ENDPOINT}`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    // Display the result
    console.log('Response status:', response.status);
    
    // Display PDF metadata
    if (response.data.data.metadata) {
      console.log('\n--- PDF Metadata ---');
      console.log(`Number of pages: ${response.data.data.metadata.numberOfPages}`);
      console.log(`PDF Version: ${response.data.data.metadata.version || 'Unknown'}`);
      console.log(`Encrypted: ${response.data.data.metadata.isEncrypted ? 'Yes' : 'No'}`);
      
      if (response.data.data.metadata.info) {
        const info = response.data.data.metadata.info;
        console.log(`Title: ${info.Title || 'Not specified'}`);
        console.log(`Author: ${info.Author || 'Not specified'}`);
        console.log(`Creator: ${info.Creator || 'Not specified'}`);
        console.log(`Producer: ${info.Producer || 'Not specified'}`);
        console.log(`Creation Date: ${info.CreationDate || 'Not specified'}`);
      }
    }
    
    // Display extracted HTML content (first 500 chars)
    console.log('\n--- Extracted HTML Content (preview) ---');
    const htmlPreview = response.data.data.html.substring(0, 500) + 
      (response.data.data.html.length > 500 ? '...' : '');
    console.log(htmlPreview);
    
    // Save the full HTML content to a file for inspection
    const outputFilePath = path.join(__dirname, 'extracted-pdf-content.html');
    fs.writeFileSync(outputFilePath, response.data.data.html);
    console.log(`\nFull HTML content saved to: ${outputFilePath}`);
    
  } catch (error) {
    console.error('Error testing PDF extraction:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Execute the test
testPdfExtraction();