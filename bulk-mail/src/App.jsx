import { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

function App() {
  const [emails, setEmails] = useState([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const isValidEmail = (email) =>
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        const extracted = rows
          .map((row) => row[0])
          .filter((email) => typeof email === "string" && isValidEmail(email));

        setEmails(extracted);
      } catch (err) {
        console.error("Error reading Excel:", err);
        alert("Failed to read Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const sendEmails = async () => {
    if (!subject || !body || emails.length === 0) {
      alert("Please fill subject, body, and upload a valid Excel file.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("https://bulkmail-backend-1-6nm3.onrender.com/sendemail", {
        subject,
        text: body,
        recipients: emails,
      });
      setStatus(res.data.results || []);
    } catch (err) {
      console.error("Send failed", err);
      setStatus([{ email: "All recipients", status: "failed" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">
          📧 Bulk Mail Sender
        </h1>

        <input
          type="file"
          onChange={handleFile}
          accept=".xlsx,.xls"
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
        />

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter subject"
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Enter email body"
          rows="4"
          className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-200"
        />

        <button
          onClick={sendEmails}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          {loading ? "📤 Sending..." : "🚀 Send Emails"}
        </button>

        {status.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="font-semibold mb-2 text-gray-800">📬 Status</h2>
            <ul className="space-y-1 max-h-40 overflow-y-auto text-sm">
              {status.map((s, i) => (
                <li
                  key={i}
                  className={`${
                    s.status === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {s.email}: {s.status}
                </li>
              ))}
            </ul>
          </div>
        )}

        {emails.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h2 className="font-semibold mb-2 text-gray-800">
              📋 Extracted Emails ({emails.length})
            </h2>
            <ul className="text-sm max-h-40 overflow-y-auto space-y-1">
              {emails.map((email, i) => (
                <li key={i} className="text-gray-700">
                  {email}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
