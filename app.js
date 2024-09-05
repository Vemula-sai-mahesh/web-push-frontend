const subscribeButton = document.getElementById('subscribeButton');

// Check for service worker support
if ('serviceWorker' in navigator && 'PushManager' in window) {
    subscribeButton.addEventListener('click', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);

                return registration.pushManager.getSubscription()
                    .then(existingSubscription => {
                        if (existingSubscription) {
                            console.log('Already subscribed:', existingSubscription);
                            return existingSubscription;
                        }

                        // Request subscription
                        return registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlB64ToUint8Array('BDxmiSrgapphmNmfo7pLS_aazNNRbkE6ypMVYwtulCGAQ3mF40gnBC_EJ5YPMNL3tJjn09lALyDIRkRWGUIOZq4=')
                        });
                    });
            })
            .then(subscription => {
                console.log('Subscribed:', subscription);

                // Send subscription to the server
                return fetch('http://127.0.0.1:8006/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJST0xFIjoiQURNSU4iLCJzdWIiOiJhZG1pbiIsImlhdCI6MTcyNTQ0MTg4NSwiZXhwIjoxNzI1NDQ1NDg1fQ.1sbqrMttfkg7NniNp0QANVeGtOC6SV44gdwmwB858H4',
                        'X-PrivateTenant': 'tenant1', // Added tenant header
                        'Accept': '*/*'
                    },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
                            auth: arrayBufferToBase64(subscription.getKey('auth'))
                        }
                    })
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log('Server response:', data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });
} else {
    console.warn('Push messaging is not supported');
}

// Utility functions
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
}
