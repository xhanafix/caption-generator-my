class ApiKeyManager {
    static getApiKey() {
        return localStorage.getItem('openRouterApiKey');
    }

    static saveApiKey(apiKey) {
        localStorage.setItem('openRouterApiKey', apiKey);
    }
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value;
    if (apiKey) {
        ApiKeyManager.saveApiKey(apiKey);
        document.getElementById('apiSection').style.display = 'none';
        alert('API Key saved successfully!');
    }
}

function updateProgress(percent, message) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressContainer = document.getElementById('progressContainer');
    
    progressContainer.style.display = 'block';
    progressBar.style.width = `${percent}%`;
    progressText.textContent = message;
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

async function generateCaptions() {
    const apiKey = ApiKeyManager.getApiKey();
    if (!apiKey) {
        alert('Sila masukkan kunci API anda terlebih dahulu!');
        return;
    }

    const topic = document.getElementById('topic').value;
    const tone = document.getElementById('toneSelect').value;

    if (!topic) {
        alert('Sila masukkan topik!');
        return;
    }

    const generateButton = document.getElementById('generateButton');
    generateButton.disabled = true;
    updateProgress(0, 'Memulakan...');

    const platforms = ['facebook', 'twitter', 'instagram', 'pinterest'];
    
    platforms.forEach(platform => {
        document.getElementById(`${platform}Caption`).value = '';
    });

    try {
        updateProgress(20, 'Menyediakan prompt...');
        const prompt = `Cipta kapsyen media sosial berdasarkan tajuk: "${topic}" dalam nada ${tone}.

Hasilkan kapsyen yang berbeza untuk Facebook, Twitter, Instagram, dan Pinterest, dengan keperluan berikut:

Facebook:
- Menarik dan terperinci (sehingga 400 aksara)
- Sertakan 1-2 emoji yang berkaitan
- Fokus pada penceritaan
- Akhiri dengan soalan atau seruan untuk bertindak

Twitter:
- Ringkas dan berkesan (maksimum 280 aksara)
- Sertakan 1-2 emoji yang berkaitan
- Gunakan 2-3 hashtag yang berkaitan
- Sertakan seruan untuk bertindak yang jelas

Instagram:
- Menarik dan deskriptif
- Gunakan jarak baris untuk kebolehbacaan
- Sertakan 5-7 hashtag yang berkaitan
- Gunakan 2-3 emoji yang berkaitan
- Akhiri dengan soalan atau seruan untuk bertindak

Pinterest:
- Deskriptif dan kaya dengan kata kunci
- Sertakan 2-3 hashtag yang berkaitan
- Fokus pada manfaat atau penyelesaian
- Seruan untuk bertindak yang jelas

Format jawapan sebagai:
[FACEBOOK]
(kapsyen facebook di sini)

[TWITTER]
(kapsyen twitter di sini)

[INSTAGRAM]
(kapsyen instagram di sini)

[PINTEREST]
(kapsyen pinterest di sini)

PENTING: Sila hasilkan semua kapsyen dalam Bahasa Malaysia.`;

        updateProgress(40, 'Menghantar permintaan...');
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": window.location.href,
                "X-Title": "Social Media Caption Generator",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/learnlm-1.5-pro-experimental:free",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 1000
            })
        });

        updateProgress(60, 'Processing response...');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        updateProgress(80, 'Formatting captions...');
        
        if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response structure from API');
        }

        const captions = data.choices[0].message.content;
        const captionSections = captions.split('[');
        
        let captionsFound = false;
        
        platforms.forEach(platform => {
            const section = captionSections.find(s => s.toLowerCase().startsWith(platform.toLowerCase()));
            if (section) {
                const caption = section.split(']')[1].trim();
                document.getElementById(`${platform}Caption`).value = caption;
                captionsFound = true;
            }
        });

        if (!captionsFound) {
            throw new Error('No captions found in the response');
        }

        updateProgress(100, 'Completed!');
        setTimeout(() => {
            document.getElementById('progressContainer').style.display = 'none';
        }, 1000);

    } catch (error) {
        console.error('Ralat menjana kapsyen:', error);
        const errorMessage = error.message || 'Ralat tidak diketahui berlaku';
        
        updateProgress(100, `Ralat: ${errorMessage}`);
        platforms.forEach(platform => {
            document.getElementById(`${platform}Caption`).value = 
                `Ralat menjana kapsyen: ${errorMessage}\nSila cuba lagi atau periksa kunci API anda.`;
        });
    } finally {
        generateButton.disabled = false;
    }
}

function copyContent(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.select();
    document.execCommand('copy');
    alert('Kapsyen telah disalin ke papan klip!');
}

function clearApiKey() {
    if (confirm('Adakah anda pasti mahu memadamkan kunci API anda?')) {
        localStorage.removeItem('openRouterApiKey');
        document.getElementById('apiKey').value = '';
        document.getElementById('apiSection').style.display = 'block';
        alert('Kunci API berjaya dipadamkan!');
    }
}

window.onload = function() {
    const savedApiKey = ApiKeyManager.getApiKey();
    if (savedApiKey) {
        document.getElementById('apiSection').style.display = 'none';
        document.getElementById('apiKey').value = savedApiKey;
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.getElementById('themeToggle').checked = savedTheme === 'dark';
    
    document.getElementById('themeToggle').addEventListener('change', toggleTheme);
} 