// A simple script to test the PDF extraction endpoint
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testDirectUpload() {
  try {
    const form = new FormData();
    const fileBuffer = fs.readFileSync('../uploads/39f1912b-4b50-48dc-bbe6-1d1c19434422.pdf');
    form.append('file', fileBuffer, { filename: 'test.pdf' });
    
    const response = await axios.post('http://localhost:8055/extensions/llama-pdf-extract', form, {
      headers: form.getHeaders()
    });
    
    console.log('Direct upload response:', response.data);
  } catch (error) {
    console.error('Direct upload error:', error.response?.data || error.message);
  }
}

async function testFileIdRequest() {
  try {
    const fileId = '39f1912b-4b50-48dc-bbe6-1d1c19434422';
    const response = await axios.get(`http://localhost:8055/extensions/llama-pdf-extract/${fileId}`);
    
    console.log('File ID request response:', response.data);
  } catch (error) {
    console.error('File ID request error:', error.response?.data || error.message);
  }
}

// Run the tests
(async () => {
  console.log('Testing PDF extraction endpoint...');
  
  await testFileIdRequest();
  await testDirectUpload();
})();
