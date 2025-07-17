// JavaScript for the Video Strip Component
document.addEventListener('DOMContentLoaded', () => {
    const videoStrip = document.getElementById('videoStrip');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    const label = playPauseBtn.querySelector('.btn-label');

    // IMPORTANT:
    // 1. Ensure your main content sections have the class 'content-section' and unique IDs.
    //    Example: <div class="content-section" id="home-section">...</div>
    // 2. Ensure your video clips in the HTML have 'data-section-id' attributes matching your section IDs.
    //    Example: <div class="video-clip" data-section-id="home-section"><span>Home</span></div>
    const sections = document.querySelectorAll('.content-section');
    const clips = document.querySelectorAll('.video-clip');

    let isPlaying = false;
    let animationFrameId = null;
    const scrollSpeed = 5; // Pixels to scroll per frame during auto-play

    // Calculate the target translateX for each clip to be centered under the playhead
    const calculateClipTargetOffsets = () => {
        const playheadOffset = window.innerWidth / 2;
        return Array.from(clips).map(clip => {
            const clipCenter = clip.offsetLeft + clip.offsetWidth / 2;
            return -(clipCenter - playheadOffset);
        });
    };

    let clipTargetOffsets = calculateClipTargetOffsets();

    // Function to update strip position based on scroll
    const updateStripPosition = () => {
        const scrollY = window.scrollY;
        // Total scrollable height of the document.
        // Adjust 'document.documentElement.scrollHeight' if your main scrollable content
        // is within a specific container (e.g., a div with 'overflow: auto').
        // If so, replace 'document.documentElement' with a reference to that container.
        const maxScrollY = document.documentElement.scrollHeight - window.innerHeight + 120; // 120px is height of video-editor-controls

        let currentSectionIndex = 0;
        // Determine the current active section based on scroll position
        for (let i = 0; i < sections.length; i++) {
            // Consider a section active when its top is within the upper 1/3 of the viewport
            if (scrollY >= sections[i].offsetTop - window.innerHeight / 3) {
                currentSectionIndex = i;
            }
        }

        let targetTranslateX;

        // If we are not at the last section, interpolate the translateX
        if (currentSectionIndex < sections.length - 1) {
            const currentSectionTop = sections[currentSectionIndex].offsetTop;
            const nextSectionTop = sections[currentSectionIndex + 1].offsetTop;
            const scrollRange = nextSectionTop - currentSectionTop;

            if (scrollRange > 0) {
                // Calculate scroll progress within the current section (0 to 1)
                const scrollProgressInCurrentSection = (scrollY - currentSectionTop) / scrollRange;
                const progress = Math.min(1, Math.max(0, scrollProgressInCurrentSection)); // Clamp between 0 and 1

                const startClipTranslateX = clipTargetOffsets[currentSectionIndex];
                const endClipTranslateX = clipTargetOffsets[currentSectionIndex + 1];

                // Linear interpolation between the target positions of the current and next clip
                targetTranslateX = startClipTranslateX + (endClipTranslateX - startClipTranslateX) * progress;
            } else {
                // Fallback if section heights are zero (shouldn't happen with min-height)
                targetTranslateX = clipTargetOffsets[currentSectionIndex];
            }
        } else {
            // If it's the last section, just use its target translateX
            targetTranslateX = clipTargetOffsets[currentSectionIndex];
        }

        videoStrip.style.transform = `translateX(${targetTranslateX}px)`;

        // Highlight active clip in the strip
        clips.forEach((clip, index) => {
            if (index === currentSectionIndex) {
                clip.classList.add('active');
            } else {
                clip.classList.remove('active');
            }
        });
    };

    // Auto-scroll function for play/pause
    const autoScroll = () => {
        if (isPlaying) {
            const currentScrollY = window.scrollY;
            const maxScrollY = document.documentElement.scrollHeight - window.innerHeight + 120;

            if (currentScrollY < maxScrollY) {
                window.scrollTo(0, currentScrollY + scrollSpeed);
                animationFrameId = requestAnimationFrame(autoScroll);
            } else {
                // Reached end of scrollable area, stop playing
                isPlaying = false;
                playPauseBtn.innerText = 'Play';
                playIcon.style.display = 'inline-block';
                pauseIcon.style.display = 'none';
                cancelAnimationFrame(animationFrameId);
            }
        }
    };

    // Play/Pause button click handler
    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            label.textContent = 'Pause';
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
            // If at the end, jump to start to replay
            const maxScrollY = document.documentElement.scrollHeight - window.innerHeight + 120;
            if (window.scrollY >= maxScrollY - 10) { // Small buffer for end detection
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            animationFrameId = requestAnimationFrame(autoScroll);
        } else {
            label.textContent = 'Play';
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
            cancelAnimationFrame(animationFrameId);
        }
    });

    // Initial call and attach event listeners
    // Recalculate offsets on resize as viewport width changes playhead position
    window.addEventListener('resize', () => {
        clipTargetOffsets = calculateClipTargetOffsets(); // Recalculate on resize
        updateStripPosition(); // Update position immediately
    });

    // Set up initial position and event listeners
    updateStripPosition();
    window.addEventListener('scroll', updateStripPosition);
});
