// Overlay script for standalone overlay functionality
class StandaloneOverlay {
    constructor() {
        this.isActive = false;
        this.selection = null;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.isSelecting = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.showInstructions();
    }

    bindEvents() {
        const overlay = document.getElementById('overlay-container');
        const backdrop = overlay.querySelector('.overlay-backdrop');
        const solveBtn = overlay.querySelector('.solve-btn');
        const cancelBtn = overlay.querySelector('.cancel-btn');
        const closeBtn = overlay.querySelector('.close-btn');

        // Mouse events for selection
        backdrop.addEventListener('mousedown', (e) => this.startSelection(e));
        document.addEventListener('mousemove', (e) => this.updateSelection(e));
        document.addEventListener('mouseup', (e) => this.endSelection(e));

        // Button events
        solveBtn.addEventListener('click', () => this.solveSelection());
        cancelBtn.addEventListener('click', () => this.deactivate());
        closeBtn.addEventListener('click', () => this.hideAnswer());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.deactivate();
            }
        });
    }

    showInstructions() {
        const instructions = document.querySelector('.instructions');
        instructions.style.display = 'block';
        
        setTimeout(() => {
            instructions.style.display = 'none';
        }, 3000);
    }

    deactivate() {
        // Close the overlay window
        window.close();
    }

    startSelection(e) {
        this.isSelecting = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.endX = e.clientX;
        this.endY = e.clientY;
        
        this.updateSelectionBox();
    }

    updateSelection(e) {
        if (!this.isSelecting) return;
        
        this.endX = e.clientX;
        this.endY = e.clientY;
        this.updateSelectionBox();
    }

    endSelection(e) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        this.endX = e.clientX;
        this.endY = e.clientY;
        
        // Calculate selection bounds
        const left = Math.min(this.startX, this.endX);
        const top = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        const height = Math.abs(this.endY - this.startY);
        
        if (width > 10 && height > 10) {
            this.selection = { left, top, width, height };
            this.showActionPanel();
        } else {
            this.resetSelection();
        }
    }

    updateSelectionBox() {
        const selectionBox = document.querySelector('.selection-box');
        const left = Math.min(this.startX, this.endX);
        const top = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        const height = Math.abs(this.endY - this.startY);
        
        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';
        selectionBox.style.display = 'block';
    }

    resetSelection() {
        const selectionBox = document.querySelector('.selection-box');
        const actionPanel = document.querySelector('.action-panel');
        
        selectionBox.style.display = 'none';
        actionPanel.style.display = 'none';
        this.selection = null;
    }

    showActionPanel() {
        const actionPanel = document.querySelector('.action-panel');
        const left = Math.min(this.startX, this.endX);
        const top = Math.min(this.startY, this.endY);
        const width = Math.abs(this.endX - this.startX);
        
        actionPanel.style.left = (left + width / 2 - 100) + 'px';
        actionPanel.style.top = (top - 60) + 'px';
        actionPanel.style.display = 'flex';
    }

    async solveSelection() {
        if (!this.selection) return;
        
        try {
            this.showAnswerPanel();
            this.showLoading();
            
            // For demo purposes, simulate API call
            setTimeout(() => {
                this.showAnswer("This is a demo answer. In the full implementation, this would be the actual response from the Gemini API based on your selected screen region.");
            }, 2000);
            
        } catch (error) {
            console.error('Error solving selection:', error);
            this.showError('Failed to process your selection. Please try again.');
        }
    }

    showAnswerPanel() {
        const answerPanel = document.querySelector('.answer-panel');
        answerPanel.style.display = 'block';
        answerPanel.style.left = '50%';
        answerPanel.style.top = '50%';
        answerPanel.style.transform = 'translate(-50%, -50%)';
    }

    hideAnswer() {
        const answerPanel = document.querySelector('.answer-panel');
        answerPanel.style.display = 'none';
    }

    showLoading() {
        const answerContent = document.querySelector('.answer-content');
        answerContent.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Analyzing your selection...</p>
            </div>
        `;
    }

    showAnswer(answer) {
        const answerContent = document.querySelector('.answer-content');
        answerContent.innerHTML = `
            <div class="answer-text">
                <p>${answer}</p>
            </div>
            <div class="answer-actions">
                <button class="copy-btn">Copy Answer</button>
                <button class="new-selection-btn">New Selection</button>
            </div>
        `;
        
        // Bind new button events
        const copyBtn = answerContent.querySelector('.copy-btn');
        const newSelectionBtn = answerContent.querySelector('.new-selection-btn');
        
        copyBtn.addEventListener('click', () => this.copyAnswer(answer));
        newSelectionBtn.addEventListener('click', () => {
            this.hideAnswer();
            this.resetSelection();
        });
    }

    showError(error) {
        const answerContent = document.querySelector('.answer-content');
        answerContent.innerHTML = `
            <div class="error">
                <div class="error-icon">⚠️</div>
                <p>${error}</p>
                <button class="retry-btn">Try Again</button>
            </div>
        `;
        
        const retryBtn = answerContent.querySelector('.retry-btn');
        retryBtn.addEventListener('click', () => {
            this.solveSelection();
        });
    }

    async copyAnswer(answer) {
        try {
            await navigator.clipboard.writeText(answer);
            // Show brief success message
            const copyBtn = document.querySelector('.copy-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Error copying text:', error);
        }
    }
}

// Initialize overlay when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StandaloneOverlay();
});
