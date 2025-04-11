// This script handles audio recording functionality,
// including starting/stopping recordings
document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('record-button');
    const audioContainer = document.getElementById('audio-container');
    const timerDisplay = document.createElement('div'); // Timer display for recording
    timerDisplay.style.marginTop = '10px';
    timerDisplay.style.fontSize = '1rem';
    timerDisplay.style.color = '#333';
    audioContainer.parentNode.insertBefore(timerDisplay, audioContainer); // Add timer above the audio container

    let mediaRecorder = null;
    let audioChunks = [];
    let audioCount = 0; // Track the number of recorded audios
    const maxAudios = 3; // Maximum number of audios allowed
    const maxDuration = 5 * 60 * 1000; // Maximum duration in milliseconds (5 minutes)
    let recordingTimeout;
    let recordingStartTime;
    let recordingInterval;

    async function startRecording() {
        try {
            // Check if the browser supports audio recording
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Your browser does not support audio recording. Please use a modern browser like Chrome or Firefox.');
                return;
            }

            // Alert the user about the audio limits if this is the first recording
            if (audioCount === 0) {
                alert('You can record up to 3 audios, and each audio must not exceed 5 minutes.');
            }

            // Check if the maximum number of audios has been reached
            if (audioCount >= maxAudios) {
                alert('You have reached the maximum limit of 3 audios. Please delete an existing audio to record a new one.');
                return;
            }

            // Stop any existing mediaRecorder instance
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = []; // Clear previous chunks

            // Add event listeners for mediaRecorder
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                // Wrap the audio player, download button, and delete button
                const audioWrapper = document.createElement('div');
                audioWrapper.style.display = 'flex';
                audioWrapper.style.flexDirection = 'column'; // Default to column layout
                audioWrapper.style.alignItems = 'flex-start';
                audioWrapper.style.marginTop = '10px';

                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Create an audio player
                const audioPlayer = document.createElement('audio');
                audioPlayer.controls = true;
                audioPlayer.src = audioUrl;

                // Create a container for the buttons
                const buttonWrapper = document.createElement('div');
                buttonWrapper.style.display = 'flex';
                buttonWrapper.style.gap = '10px'; // Add spacing between buttons
                buttonWrapper.style.marginTop = '10px';

                // Create a download button
                const downloadButton = document.createElement('a');
                downloadButton.href = audioUrl;
                downloadButton.download = `recording-${audioCount + 1}.wav`;
                downloadButton.textContent = 'Download';
                downloadButton.style.backgroundColor = '#003087'; // Theme color
                downloadButton.style.color = '#fff'; // White text
                downloadButton.style.padding = '8px 12px';
                downloadButton.style.borderRadius = '5px';
                downloadButton.style.textDecoration = 'none';
                downloadButton.style.fontSize = '0.9rem';
                downloadButton.style.fontWeight = 'bold';
                downloadButton.style.transition = 'background-color 0.3s ease';

                // Add hover effect
                downloadButton.addEventListener('mouseover', () => {
                    downloadButton.style.backgroundColor = '#002060'; // Darker shade on hover
                });
                downloadButton.addEventListener('mouseout', () => {
                    downloadButton.style.backgroundColor = '#003087'; // Reset to theme color
                });

                // Create a delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.style.backgroundColor = '#FF0000'; // Red for delete
                deleteButton.style.color = '#fff'; // White text
                deleteButton.style.padding = '8px 12px';
                deleteButton.style.borderRadius = '5px';
                deleteButton.style.border = 'none';
                deleteButton.style.cursor = 'pointer';
                deleteButton.style.fontSize = '0.9rem';
                deleteButton.style.fontWeight = 'bold';
                deleteButton.style.transition = 'background-color 0.3s ease';

                // Add hover effect for delete button
                deleteButton.addEventListener('mouseover', () => {
                    deleteButton.style.backgroundColor = '#CC0000'; // Darker red on hover
                });
                deleteButton.addEventListener('mouseout', () => {
                    deleteButton.style.backgroundColor = '#FF0000'; // Reset to red
                });

                deleteButton.addEventListener('click', () => {
                    audioContainer.removeChild(audioWrapper);
                    audioCount--; // Decrease the audio count
                });

                // Append buttons to the button wrapper
                buttonWrapper.appendChild(downloadButton);
                buttonWrapper.appendChild(deleteButton);

                // Append the audio player and button wrapper to the audio wrapper
                audioWrapper.appendChild(audioPlayer);
                audioWrapper.appendChild(buttonWrapper);

                // Append the audio wrapper to the container
                audioContainer.appendChild(audioWrapper);

                // Reset recording state
                recordButton.style.backgroundColor = '#003087'; // Reset button color
                clearTimeout(recordingTimeout); // Clear the timeout
                clearInterval(recordingInterval); // Clear the timer interval
                timerDisplay.textContent = ''; // Clear the timer display
                audioCount++; // Increment the audio count
            };

            mediaRecorder.start();
            recordButton.style.backgroundColor = '#FF0000'; // Indicate recording in progress

            // Start the recording timer
            recordingStartTime = Date.now();
            recordingInterval = setInterval(() => {
                const elapsedTime = Date.now() - recordingStartTime;
                timerDisplay.textContent = `Recording: ${formatTime(Math.floor(elapsedTime / 1000))}`;
            }, 1000);

            // Automatically stop recording after the maximum duration
            recordingTimeout = setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    alert('Recording stopped automatically after 5 minutes.');
                }
            }, maxDuration);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert(
                'Microphone access is denied or unavailable. Please follow these steps to enable microphone access:\n\n' +
                '1. Click the lock icon in the address bar of your browser.\n' +
                '2. Find the "Microphone" setting and set it to "Allow".\n' +
                '3. Refresh the page and try again.\n\n' +
                'If you are using a mobile device, ensure that microphone permissions are enabled in your device settings for this browser.'
            );
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    }

    // Format time in MM:SS format
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Simple click to record/stop
    recordButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    });
});