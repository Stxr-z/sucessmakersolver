// ==UserScript==
// @name         SuccessMaker Solver
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Takes screenshots and uses LLM to solve SuccessMaker problems
// @author       You
// @match        https://sm-student-mfe-production.smhost.net/*
// @match        https://www.successmaker.com/*
// @match        https://successmaker.*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        unsafeWindow
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// ==/UserScript==

// Configuration - Using local Ollama
const LLM_API_URL = 'http://localhost:11434/api/generate';
const LLM_MODEL = 'llava'; // Vision-capable model, run: ollama pull llava

(function() {
    'use strict';

    // Wait for page to load completely
    function waitForElement() {
        return new Promise(resolve => {
            setTimeout(resolve, 2000);
        });
    }

    addEventListener('load', function() {
        waitForElement().then(() => {
            addSolverButton();
        });
    }, true);

    // Try to add button immediately too
    waitForElement().then(() => {
        addSolverButton();
    });

    function addSolverButton() {
        // Check if button already exists
        if (document.getElementById('sm-solver-button')) {
            return;
        }

        // Track problems solved from localStorage
        const problemsSolved = parseInt(localStorage.getItem('sm_problems_solved') || '0');
        const sessionStartTime = parseInt(localStorage.getItem('sm_session_start') || Date.now());
        localStorage.setItem('sm_session_start', sessionStartTime.toString());

        // Create main container for entire UI
        const container = document.createElement('div');
        container.id = 'sm-solver-container';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            user-select: none;
        `;

        // Add header bar (for dragging and close button)
        const headerBar = document.createElement('div');
        headerBar.style.cssText = `
            background-color: #22c55e;
            color: white;
            padding: 8px 12px;
            border-radius: 6px 6px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            font-weight: bold;
            font-size: 14px;
        `;
        headerBar.innerHTML = 'SuccessMaker Solver';

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            padding: 0;
            margin-left: 10px;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onmouseover = () => closeBtn.style.opacity = '0.8';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '1';
        closeBtn.onclick = () => {
            container.style.display = 'none';
        };
        headerBar.appendChild(closeBtn);
        container.appendChild(headerBar);

        // Add stats panel
        const statsPanel = document.createElement('div');
        statsPanel.id = 'sm-stats-panel';
        statsPanel.style.cssText = `
            background-color: #1a1a2e;
            border: 2px solid #22c55e;
            border-top: none;
            border-radius: 0 0 6px 6px;
            padding: 12px;
            min-width: 250px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            font-size: 13px;
            color: #e0e0e0;
        `;

        // Add Solve button inside stats panel at the top
        const solverButton = document.createElement('button');
        solverButton.id = 'sm-solver-button';
        solverButton.innerHTML = '✓ Solve!';
        solverButton.style.cssText = `
            width: 100%;
            margin-bottom: 12px;
            padding: 12px 16px;
            background-color: #22c55e;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: background-color 0.2s;
        `;
        solverButton.onmouseover = () => solverButton.style.backgroundColor = '#16a34a';
        solverButton.onmouseout = () => solverButton.style.backgroundColor = '#22c55e';
        statsPanel.appendChild(solverButton);

        // Create content div for stats that will be updated
        const statsContentDiv = document.createElement('div');
        statsContentDiv.id = 'sm-stats-panel-content';
        statsPanel.appendChild(statsContentDiv);

        // Function to update stats display
        function updateStats() {
            const saved = parseInt(localStorage.getItem('sm_problems_solved') || '0');
            const startTime = parseInt(localStorage.getItem('sm_session_start') || Date.now());
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            let statsHtml = `
                <div style="margin-bottom: 8px; font-weight: bold; color: #22c55e;">📊 Progress Tracker</div>
                <div style="margin-bottom: 6px; color: #e0e0e0;">Problems Solved: <strong>${saved}</strong></div>
                <div style="margin-bottom: 6px; color: #e0e0e0;">Session Time: <strong>${minutes}:${seconds.toString().padStart(2, '0')}</strong> / 20:00</div>
                <div style="width: 100%; background-color: #0a0a0a; border-radius: 4px; height: 8px; margin-bottom: 8px; overflow: hidden;">
                    <div style="background-color: #22c55e; height: 100%; width: ${Math.min((saved / 50) * 100, 100)}%;"></div>
                </div>
                <div style="text-align: center; font-size: 12px; margin-bottom: 8px; color: #888;">
                    ${saved}/50 needed for credit
                </div>
            `;

            if (saved >= 50) {
                statsHtml += `<div style="background-color: #1f4a2a; border-left: 4px solid #22c55e; padding: 8px; border-radius: 2px; color: #4ade80;"><strong>🎉 Quota Complete!</strong><br/>Extra credit available for additional problems.</div>`;
            } else {
                const remaining = 50 - saved;
                statsHtml += `<div style="background-color: #3a3a1f; border-left: 4px solid #f59e0b; padding: 8px; border-radius: 2px; color: #fcd34d;"><strong>${remaining}</strong> more needed to reach quota</div>`;
            }

            statsContentDiv.innerHTML = statsHtml;
        }

        updateStats();
        container.appendChild(statsPanel);
        document.body.appendChild(container);

        // Update stats every second
        setInterval(updateStats, 1000);

        // Make container draggable
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let containerX = 0;
        let containerY = 0;

        headerBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = container.getBoundingClientRect();
            containerX = rect.left;
            containerY = rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                container.style.left = (containerX + deltaX) + 'px';
                container.style.top = (containerY + deltaY) + 'px';
                container.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        solverButton.addEventListener('click', async function() {
            console.log('Starting SuccessMaker solver...');
            solverButton.disabled = true;
            solverButton.innerHTML = '⏳ Processing...';
            
            try {
                // 1. Take a screenshot
                const canvas = await html2canvas(document.body);
                const screenshotBase64 = canvas.toDataURL('image/png').split(',')[1];
                
                console.log('Screenshot captured');
                
                // 2. Send to LLM for analysis
                const answer = await analyzeWithLLM(screenshotBase64);
                console.log('LLM Answer:', answer);
                
                // 3. Input the answer
                if (answer) {
                    await inputAnswer(answer);
                    console.log('Answer inputted');
                    
                    // Wait a bit before clicking
                    await new Promise(r => setTimeout(r, 500));
                    
                    // 4. Click "Done" button
                    await clickDoneButton();
                    console.log('Done button clicked');

                    // Increment counter
                    const current = parseInt(localStorage.getItem('sm_problems_solved') || '0');
                    const newCount = current + 1;
                    localStorage.setItem('sm_problems_solved', newCount.toString());
                    console.log(`Problems solved: ${newCount}`);

                    // Show milestone messages
                    if (newCount === 50) {
                        alert('🎉 Congratulations! You\'ve reached 50 problems! You now have credit. Any additional problems will count as extra credit!');
                    } else if (newCount % 10 === 0) {
                        console.log(`✓ ${newCount} problems solved!`);
                    }
                }
                
                solverButton.innerHTML = '✓ Complete!';
                setTimeout(() => {
                    solverButton.innerHTML = '✓ Solve!';
                    solverButton.disabled = false;
                }, 2000);
            } catch (error) {
                console.error('Error in solver:', error);
                solverButton.innerHTML = '❌ Error';
                solverButton.disabled = false;
            }
        });
    }

    /**
     * Analyze the screenshot with Ollama (running locally)
     * @param {string} screenshotBase64 - Base64 encoded screenshot
     * @returns {Promise<string>} - The answer extracted from the LLM
     */
    async function analyzeWithLLM(screenshotBase64) {
        const payload = {
            model: LLM_MODEL,
            prompt: 'This is a SuccessMaker problem. Analyze the problem in the image and provide ONLY the answer. Format your response as JSON: {"answer": "your_answer_here"}',
            images: [screenshotBase64],
            stream: false
        };

        return new Promise((resolve, reject) => {
            // For Ollama, we use regular fetch since it's local
            fetch(LLM_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(result => {
                console.log('Ollama response:', result);
                try {
                    const content = result.response || '';
                    
                    // Try to extract JSON from response
                    const jsonMatch = content.match(/\{.*"answer".*\}/s);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        resolve(parsed.answer);
                    } else {
                        // If no JSON found, try to extract answer from text
                        const answerMatch = content.match(/answer[:\s]+([^\n}]+)/i);
                        if (answerMatch) {
                            resolve(answerMatch[1].trim().replace(/[",]/g, ''));
                        } else {
                            resolve(content.trim());
                        }
                    }
                } catch (error) {
                    reject(new Error('Could not parse Ollama response: ' + error.message));
                }
            })
            .catch(error => {
                reject(new Error('Ollama API error (is it running on localhost:11434?): ' + error.message));
            });
        });
    }

    /**
     * Input the answer into the SuccessMaker form
     * @param {string} answer - The answer to input
     */
    async function inputAnswer(answer) {
        // Try multiple selectors for the input field
        let inputField = null;
        
        const selectors = [
            'input[type="text"]',
            'input[type="number"]',
            'textarea',
            '[contenteditable="true"]',
            'input[placeholder*="answer"]',
            'input[placeholder*="enter"]',
            'input[placeholder*="type"]',
            '.input-field',
            '#answer',
            'input.answer',
            'input[name="answer"]'
        ];
        
        // First try main document
        for (const selector of selectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                inputField = elements[elements.length - 1];
                console.log(`Found input in main document with selector: ${selector}`, inputField);
                break;
            }
        }
        
        // If not found, try iframes
        if (!inputField) {
            const iframes = document.querySelectorAll('iframe');
            console.log(`Searching in ${iframes.length} iframes...`);
            
            for (const iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!iframeDoc) continue;
                    
                    for (const selector of selectors) {
                        const elements = iframeDoc.querySelectorAll(selector);
                        if (elements.length > 0) {
                            inputField = elements[elements.length - 1];
                            console.log(`Found input in iframe with selector: ${selector}`, inputField);
                            break;
                        }
                    }
                    if (inputField) break;
                } catch (e) {
                    console.log('Could not access iframe (cross-origin?):', e.message);
                }
            }
        }
        
        if (!inputField) {
            throw new Error('Could not find answer input field. Available inputs: ' + 
                          document.querySelectorAll('input, textarea').length);
        }
        
        // Clear and set the value
        inputField.click();
        inputField.focus();
        inputField.value = answer;
        
        // Trigger events for frameworks that listen to them
        inputField.dispatchEvent(new Event('input', { bubbles: true }));
        inputField.dispatchEvent(new Event('change', { bubbles: true }));
        inputField.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        
        console.log('Answer inputted:', answer);
    }

    /**
     * Click the "Done" button
     */
    async function clickDoneButton() {
        let doneButton = null;
        
        // Try main document first
        const allButtons = document.querySelectorAll('button');
        for (const btn of allButtons) {
            if (btn.textContent.trim().toLowerCase() === 'done' ||
                btn.textContent.trim().toLowerCase() === 'check answer' ||
                btn.textContent.trim().toLowerCase() === 'submit' ||
                btn.innerHTML.toLowerCase().includes('done')) {
                doneButton = btn;
                console.log('Found button in main document by text:', btn.textContent);
                break;
            }
        }
        
        // Fallback selectors in main document
        if (!doneButton) {
            doneButton = document.querySelector('button[aria-label*="Done"]') ||
                        document.querySelector('button[title*="Done"]') ||
                        document.querySelector('button.done') ||
                        document.querySelector('.submit-button') ||
                        document.querySelector('[onclick*="done"]');
        }
        
        // Try iframes if not found
        if (!doneButton) {
            const iframes = document.querySelectorAll('iframe');
            for (const iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (!iframeDoc) continue;
                    
                    const iframeButtons = iframeDoc.querySelectorAll('button');
                    for (const btn of iframeButtons) {
                        if (btn.textContent.trim().toLowerCase() === 'done' ||
                            btn.textContent.trim().toLowerCase() === 'check answer' ||
                            btn.textContent.trim().toLowerCase() === 'submit' ||
                            btn.innerHTML.toLowerCase().includes('done')) {
                            doneButton = btn;
                            console.log('Found button in iframe by text:', btn.textContent);
                            break;
                        }
                    }
                    if (doneButton) break;
                } catch (e) {
                    console.log('Could not access iframe buttons:', e.message);
                }
            }
        }
        
        if (!doneButton) {
            throw new Error('Could not find Done button. Available buttons in main doc: ' + allButtons.length);
        }
        
        console.log('Clicking button:', doneButton);
        doneButton.click();
    }
})();
