const API_URL = import.meta.env.VITE_API_URL;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const micButton = document.querySelector('.mic-button');
const micIcon = document.getElementById('mic-icon');
const processingIcon = document.getElementById('processing-icon');
const welcomeMessageEl = document.getElementById('welcome-message');
const statusMessageEl = document.getElementById('status-message');
const userInputDisplayEl = document.getElementById('user-input-display');
const customAlert = document.getElementById('custom-alert');
const alertMessage = document.getElementById('alert-message');


const particles = [];
const maxParticles = 100;
const particleRadius = 1.5;
const lineDistance = 100;
let animationFrameId;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
const speechSynthesis = window.speechSynthesis;
let recognition;
let isListening = false;
let isSpeaking = false;
let selectedVoice = null;
let isFirstInteraction = true;
let textDisplayTimeout;

function showAlert(message) {
    alertMessage.textContent = message;
    customAlert.classList.add('show');
    setTimeout(() => {
        customAlert.classList.remove('show');
    }, 3000);
}

function showTextForShortTime(text, duration = 3000) {
    userInputDisplayEl.textContent = text;
    userInputDisplayEl.classList.remove('hidden', 'fade-out');
    if (textDisplayTimeout) {
        clearTimeout(textDisplayTimeout);
    }
    textDisplayTimeout = setTimeout(() => {
        userInputDisplayEl.classList.add('fade-out');
        setTimeout(() => {
            userInputDisplayEl.classList.add('hidden');
        }, 300); 
    }, duration);
}

// --- Canvas & Particle Animation ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, particleRadius, 0, Math.PI * 2);
        ctx.fillStyle = isListening ? '#4ade80' : isSpeaking ? '#6366f1' : 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        // Bounce off edges
        if (this.x > canvas.width || this.x < 0) this.vx *= -1;
        if (this.y > canvas.height || this.y < 0) this.vy *= -1;
    }
}

function createParticles() {
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < lineDistance) {
                ctx.beginPath();
                ctx.strokeStyle = isListening ? `rgba(74, 222, 128, ${1 - distance / lineDistance})` : isSpeaking ? `rgba(99, 102, 241, ${1 - distance / lineDistance})` : `rgba(255, 255, 255, ${1 - distance / lineDistance})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    connectParticles();
    animationFrameId = requestAnimationFrame(animate);
}

function setStatus(text, listeningState) {
    statusMessageEl.textContent = text;
    isListening = listeningState;
    micButton.classList.toggle('listening', isListening);
    micButton.classList.toggle('thinking', isSpeaking);
    micIcon.classList.toggle('hidden', isSpeaking);
    processingIcon.classList.toggle('hidden', !isSpeaking);
}

function speak(text, rate = 1.1) {
    return new Promise((resolve) => {
        if (!speechSynthesis || !selectedVoice) {
            showAlert("Text-to-speech not supported or voice not loaded.");
            resolve();
            return;
        }
        isSpeaking = true;
        setStatus("Speaking...", false);
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice;
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.onend = () => {
            isSpeaking = false;
            setStatus("Tap to speak...", false);
            resolve();
        };
        utterance.onerror = (e) => {
            console.error('SpeechSynthesis error:', e.error);
            showAlert("Speech synthesis failed.");
            isSpeaking = false;
            setStatus("Tap to speak...", false);
            resolve();
        };
        speechSynthesis.speak(utterance);
    });
}

function stopSpeaking() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        isSpeaking = false;
        setStatus("Tap to speak...", false);
    }
}

function getBackendResponse(query) {
    return new Promise((resolve, reject) => {
        fetch(`${API_URL}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => resolve(data.answer))
        .catch(error => {
            console.error('Fetch error:', error);
            showAlert(`Error communicating with backend: ${error.message}.`);
            reject(error);
        });
    });
}

function startListening() {
    if (!SpeechRecognition) {
        showAlert("Speech Recognition is not supported by this browser.");
        return;
    }
    if (isListening) return;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => {
        setStatus("Listening...", true);
    };
    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Recognized:", transcript);
        isListening = false;
        setStatus("Thinking...", false);
        showTextForShortTime(transcript, 3000);
        try {
            const response = await getBackendResponse(transcript);
            console.log("Backend response:", response);
            await speak(response);
        } catch (error) {
            console.error("Failed to get or speak response:", error);
            speak("I'm sorry, an error occurred. Please try again.");
        } finally {
            isSpeaking = false;
            setStatus("Tap to speak...", false);
        }
    };
    recognition.onend = () => {
        if (!isSpeaking) {
            setStatus("Tap to speak...", false);
        }
    };
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        let message;
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            message = "Microphone access denied. Please enable it in your browser settings.";
        } else if (event.error === 'no-speech') {
            message = "No speech detected. Please tap the mic and try again.";
        } else {
            message = `Recognition error: ${event.error}`;
        }
        showAlert(message);
        isListening = false;
        isSpeaking = false;
        setStatus("Tap to speak...", false);
    };
    recognition.start();
}

micButton.addEventListener('click', async () => {
    if (isSpeaking) {
        stopSpeaking();
    } else if (!isListening) {
        if (isFirstInteraction) {
            isFirstInteraction = false;
            const greeting = "Hey there! You’re probably looking for Baishnab, but he’s busy playing games or binge-watching Game of Thrones right now. Don’t worry though—I’m here as Baishnab’s assistant. You can ask me anything: his introduction, projects, experience, skills, certifications, or even his contact details. I’ll walk you through everything.";
            welcomeMessageEl.textContent = "Hi there!";
            await speak(greeting, 1.0);
            welcomeMessageEl.textContent = "Hello!";
            startListening();
        } else {
            startListening();
        }
    } else {
        recognition.stop();
    }
});

window.onload = () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    createParticles();
    animate();
    const setVoices = () => {
        const voices = speechSynthesis.getVoices();
        selectedVoice = voices.find(voice => voice.name.includes('Google') && voice.name.includes('Female')) || 
                        voices.find(voice => voice.name.includes('female')) || 
                        voices.find(voice => voice.lang === 'en-US');
        if (!selectedVoice) {
            console.warn("Could not find a suitable voice. Using the default.");
            selectedVoice = voices[0] || null;
        }
        console.log("Selected Voice:", selectedVoice ? selectedVoice.name : "None");
    };
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = setVoices;
    }
    setVoices();
    welcomeMessageEl.textContent = "Hello!";
    statusMessageEl.textContent = "Tap the mic to begin...";
};
