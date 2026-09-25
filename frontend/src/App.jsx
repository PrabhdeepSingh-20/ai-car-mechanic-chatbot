import { useRef, useState } from "react";
import "./App.css";

const API = "http://51.21.160.45:8000/api";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI Car Mechanic. Tell me what's wrong with your car, and I'll help you troubleshoot it step by step.",
    },
  ]);

  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [diagnosis, setDiagnosis] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [booking, setBooking] = useState({
    customer_name: "",
    phone: "",
    preferred_date: "",
    preferred_time: "",
  });
  const [bookingResult, setBookingResult] = useState(null);

  const fileInput = useRef(null);

  const sendMessage = async (text = input) => {
    const message = text.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send message");
      }

      setConversationId(data.conversation_id);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);

      // Check whether the backend rule engine can produce a diagnosis.
      const diagnosisResponse = await fetch(`${API}/diagnosis/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation_id: data.conversation_id,
          message,
        }),
      });

      const diagnosisData = await diagnosisResponse.json();

      if (diagnosisData.diagnosis_available) {
        setDiagnosis(diagnosisData.diagnosis);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't connect to the mechanic service. Please make sure the backend server is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAnalysis("");

    const formData = new FormData();
    formData.append("file", file);

    if (conversationId) {
      formData.append("conversation_id", conversationId);
    }

    try {
      const response = await fetch(`${API}/upload/`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setConversationId(data.conversation_id);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: `Uploaded ${file.name}`,
          fileUrl: data.media?.file,
          mediaType: data.media?.media_type,
        },
      ]);

      if (data.analysis) {
        setAnalysis(data.analysis);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.analysis,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "The media was uploaded successfully. Tell me what you are noticing in the car so I can help troubleshoot it.",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn't upload that file. Please try again.",
        },
      ]);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const createBooking = async (event) => {
    event.preventDefault();

    if (!diagnosis) return;

    try {
      const response = await fetch(`${API}/booking/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diagnosis: diagnosis.id,
          ...booking,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      setBookingResult(data.booking);
      setBookingOpen(false);
    } catch {
      alert("Unable to create booking. Please check your details.");
    }
  };

  const quickMessage = (message) => {
    sendMessage(message);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">🚗</div>
          <div>
            <h1>AI Car Mechanic</h1>
            <p>Smart vehicle troubleshooting</p>
          </div>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          Mechanic Online
        </div>
      </header>

      <main className="layout">
        <section className="chat-panel">
          <div className="chat-header">
            <div>
              <h2>Vehicle Diagnosis</h2>
              <p>Describe your car problem or upload media for analysis.</p>
            </div>
            <div className="shield">🛡️</div>
          </div>

          <div className="messages">
            {messages.map((message, index) => (
              <div
                className={`message-row ${message.role}`}
                key={`${index}-${message.content}`}
              >
                <div className="avatar">
                  {message.role === "assistant" ? "🔧" : "👤"}
                </div>

                <div className="message">
                  <span className="message-name">
                    {message.role === "assistant" ? "AI Mechanic" : "You"}
                  </span>

                  <div className="bubble">
                    {message.content}

                    {message.fileUrl &&
                      message.mediaType === "image" && (
                        <img
                          className="uploaded-image"
                          src={message.fileUrl}
                          alt="Uploaded vehicle"
                        />
                      )}

                    {message.fileUrl &&
                      message.mediaType === "video" && (
                        <video
                          className="uploaded-video"
                          src={message.fileUrl}
                          controls
                        />
                      )}

                    {message.fileUrl &&
                      message.mediaType === "audio" && (
                        <audio src={message.fileUrl} controls />
                      )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row assistant">
                <div className="avatar">🔧</div>
                <div className="message">
                  <span className="message-name">AI Mechanic</span>
                  <div className="bubble typing">Analyzing your symptoms...</div>
                </div>
              </div>
            )}

            {uploading && (
              <div className="upload-status">Uploading and analyzing media...</div>
            )}
          </div>

          <div className="quick-actions">
            <span>Quick checks:</span>
            <button onClick={() => quickMessage("My car is overheating")}>
              🌡️ Overheating
            </button>
            <button onClick={() => quickMessage("My car won't start")}>
              🔋 Won't start
            </button>
            <button onClick={() => quickMessage("My brakes are making noise")}>
              🛞 Brake noise
            </button>
          </div>

          <div className="composer">
            <button
              className="attach"
              title="Upload image, audio or video"
              onClick={() => fileInput.current?.click()}
            >
              📎
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="image/*,audio/*,video/*"
              hidden
              onChange={handleFile}
            />

            <input
              className="message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Describe what's happening with your car..."
            />

            <button
              className="send"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>

          <p className="disclaimer">
            AI assistance is for troubleshooting guidance. Always consult a
            qualified mechanic for safety-critical repairs.
          </p>
        </section>

        <aside className="side-panel">
          <div className="side-card">
            <div className="card-title">
              <span>🩺</span>
              <div>
                <h3>Diagnosis</h3>
                <p>Based on your symptoms</p>
              </div>
            </div>

            {diagnosis ? (
              <>
                <div className="diagnosis-box">
                  <span className="label">POSSIBLE ISSUE</span>
                  <h3>{diagnosis.problem}</h3>
                </div>

                <div className="detail">
                  <strong>Possible cause</strong>
                  <p>{diagnosis.possible_cause}</p>
                </div>

                <div className="detail">
                  <strong>Recommended action</strong>
                  <p>{diagnosis.recommendation}</p>
                </div>

                <button
                  className="book-button"
                  onClick={() => setBookingOpen(true)}
                >
                  Book a Mechanic →
                </button>
              </>
            ) : (
              <div className="empty-diagnosis">
                <div className="empty-icon">🔍</div>
                <h3>No diagnosis yet</h3>
                <p>
                  Describe your symptoms above. The mechanic will analyze them
                  and show a possible diagnosis here.
                </p>
              </div>
            )}
          </div>

          {analysis && (
            <div className="side-card analysis-card">
              <div className="card-title">
                <span>✨</span>
                <div>
                  <h3>AI Media Analysis</h3>
                  <p>Visual inspection result</p>
                </div>
              </div>
              <p>{analysis}</p>
            </div>
          )}

          {bookingResult && (
            <div className="side-card success-card">
              <div className="success-icon">✓</div>
              <h3>Booking Confirmed</h3>
              <p>
                Booking #{bookingResult.id} has been created successfully.
              </p>
              <small>
                {bookingResult.preferred_date} at{" "}
                {bookingResult.preferred_time}
              </small>
            </div>
          )}

          <div className="side-card features">
            <h3>What I can help with</h3>
            <div className="feature">🔋 Battery & starting issues</div>
            <div className="feature">🌡️ Engine overheating</div>
            <div className="feature">🛞 Brake problems</div>
            <div className="feature">📷 Vehicle image analysis</div>
            <div className="feature">🎥 Audio & video evidence</div>
          </div>
        </aside>
      </main>

      {bookingOpen && (
        <div className="modal-overlay" onClick={() => setBookingOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Book a Mechanic</h2>
                <p>Schedule a service for your vehicle.</p>
              </div>
              <button onClick={() => setBookingOpen(false)}>✕</button>
            </div>

            <form onSubmit={createBooking}>
              <label>
                Your name
                <input
                  required
                  value={booking.customer_name}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      customer_name: e.target.value,
                    })
                  }
                  placeholder="Enter your name"
                />
              </label>

              <label>
                Phone number
                <input
                  required
                  value={booking.phone}
                  onChange={(e) =>
                    setBooking({
                      ...booking,
                      phone: e.target.value,
                    })
                  }
                  placeholder="9876543210"
                />
              </label>

              <div className="form-row">
                <label>
                  Preferred date
                  <input
                    required
                    type="date"
                    value={booking.preferred_date}
                    onChange={(e) =>
                      setBooking({
                        ...booking,
                        preferred_date: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Preferred time
                  <input
                    required
                    type="time"
                    value={booking.preferred_time}
                    onChange={(e) =>
                      setBooking({
                        ...booking,
                        preferred_time: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <button className="confirm-button" type="submit">
                Confirm Mechanic Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;