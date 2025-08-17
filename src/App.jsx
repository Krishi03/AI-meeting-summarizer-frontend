import { useState } from 'react';
import axios from 'axios';
import './App.css';

// TODO: Replace with your actual production backend URL
const API_BASE = 'https://ai-meeting-summarizer-backend-arx1.onrender.com/api';


function App() {
  const [transcript, setTranscript] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [summary, setSummary] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [summaryId, setSummaryId] = useState('');
  const [recipients, setRecipients] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [inputMethod, setInputMethod] = useState('text');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      // Clear transcript when file is selected
      setTranscript('');
    }
  };

  const handleInputMethodChange = (method) => {
    setInputMethod(method);
    if (method === 'text') {
      setSelectedFile(null);
      setFileName('');
    } else {
      setTranscript('');
    }
  };

  const uploadAndProcessFile = async () => {
    if (!selectedFile || !customPrompt.trim()) {
      alert('Please select a file and provide custom instruction');
      return;
    }

    setFileUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('customPrompt', customPrompt);

    try {
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSummary(response.data.summary);
        setEditedSummary(response.data.summary);
        setSummaryId(response.data.summaryId);
        // Clear file selection after successful upload
        setSelectedFile(null);
        setFileName('');
      }
    } catch (error) {
      alert('Error processing file: ' + error.message);
    }
    setFileUploading(false);
  };

  const generateSummary = async () => {
    if (!transcript.trim() || !customPrompt.trim()) {
      alert('Please provide both transcript and custom instruction');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/summarize`, {
        transcript,
        customPrompt,
      });

      if (response.data.success) {
        setSummary(response.data.summary);
        setEditedSummary(response.data.summary);
        setSummaryId(response.data.summaryId);
      }
    } catch (error) {
      alert('Error generating summary: ' + error.message);
    }
    setLoading(false);
  };

  const sendEmail = async () => {
    if (!editedSummary.trim() || !recipients.trim()) {
      alert('Please provide both summary and recipient emails');
      return;
    }

    const emailList = recipients.split(',').map(email => email.trim());
    
    setEmailSending(true);
    try {
      const response = await axios.post(`${API_BASE}/email`, {
        summaryId,
        recipients: emailList,
        editedSummary,
      });

      if (response.data.success) {
        alert('Email sent successfully!');
        setRecipients('');
      }
    } catch (error) {
      alert('Error sending email: ' + error.message);
    }
    setEmailSending(false);
  };

  const clearAll = () => {
    setTranscript('');
    setCustomPrompt('');
    setSummary('');
    setEditedSummary('');
    setSummaryId('');
    setRecipients('');
    setSelectedFile(null);
    setFileName('');
    setInputMethod('text');
  };

  return (
    <div className="container">
      <h1>AI Meeting Notes Summarizer</h1>
      
      <div className="section">
        <h3>1. Input Method</h3>
        <div className="input-method-tabs">
          <div className="tab-group">
            <label className="tab-label">
              <input
                type="radio"
                name="inputMethod"
                value="text"
                checked={inputMethod === 'text'}
                onChange={() => handleInputMethodChange('text')}
              />
              Text Input
            </label>
            <label className="tab-label">
              <input
                type="radio"
                name="inputMethod"
                value="file"
                checked={inputMethod === 'file'}
                onChange={() => handleInputMethodChange('file')}
              />
              File Upload
            </label>
          </div>
        </div>

        {inputMethod === 'text' ? (
          <div className="text-input-section">
            <h4>Paste Meeting Transcript</h4>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your meeting transcript here..."
              rows={10}
            />
          </div>
        ) : (
          <div className="file-upload-section">
            <h4>Upload Meeting File</h4>
            <div className="file-input-wrapper">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.doc,.docx,.pdf"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-upload-label">
                {fileName || 'Choose a file'}
              </label>
            </div>
            {fileName && (
              <p className="file-info">Selected file: {fileName}</p>
            )}
          </div>
        )}
      </div>

      <div className="section">
        <h3>2. Custom Instruction</h3>
        <input
          type="text"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g., Summarize in bullet points for executives"
        />
      </div>

      <div className="button-group">
        {inputMethod === 'text' ? (
          <button onClick={generateSummary} disabled={loading || !transcript.trim() || !customPrompt.trim()}>
            {loading ? 'Generating Summary...' : 'Generate Summary'}
          </button>
        ) : (
          <button onClick={uploadAndProcessFile} disabled={fileUploading || !selectedFile || !customPrompt.trim()}>
            {fileUploading ? 'Processing File...' : 'Upload & Process File'}
          </button>
        )}
        
        {(transcript || selectedFile || summary) && (
          <button onClick={clearAll} className="clear-button">
            Clear All
          </button>
        )}
      </div>

      {summary && (
        <div className="section">
          <h3>3. Generated Summary (Editable)</h3>
          <textarea
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            rows={15}
          />
        </div>
      )}

      {summary && (
        <div className="section">
          <h3>4. Share via Email</h3>
          <input
            type="text"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="Enter email addresses (comma-separated)"
          />
          <button onClick={sendEmail} disabled={emailSending}>
            {emailSending ? 'Sending Email...' : 'Send Email'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
