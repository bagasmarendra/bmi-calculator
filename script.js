// ============================================
// CONFIGURATION
// ============================================

// ⚠️ REPLACE THIS WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxHg0v9WS6wniLzpBD5IPLfze4EBi6O_AL_vQTYcIWLlGx3oYYvjpgKNMtXA3IopI5tFQ/exec';

// BMI Categories with academic descriptions
const BMI_CATEGORIES = {
    underweight: { 
        min: 0, 
        max: 18.5, 
        name: 'Underweight', 
        color: 'var(--underweight)', 
        direction: 'gain', 
        focus: 'Healthy weight gain through nutrition',
        description: 'Below healthy weight range. May indicate nutritional deficiencies or underlying health conditions.',
        riskLevel: 'low',
        deviation: 'below'
    },
    normal: { 
        min: 18.5, 
        max: 25, 
        name: 'Normal Weight', 
        color: 'var(--normal)', 
        direction: 'maintain', 
        focus: 'Weight maintenance and health optimization',
        description: 'Within healthy weight range. Associated with lowest risk of weight-related health problems.',
        riskLevel: 'very low',
        deviation: 'within'
    },
    overweight: { 
        min: 25, 
        max: 30, 
        name: 'Overweight', 
        color: 'var(--overweight)', 
        direction: 'reduce', 
        focus: 'Moderate weight reduction for health improvement',
        description: 'Above healthy weight range. Increased risk for hypertension, diabetes, and cardiovascular diseases.',
        riskLevel: 'moderate',
        deviation: 'above'
    },
    obese: { 
        min: 30, 
        max: 100, 
        name: 'Obese', 
        color: 'var(--obese)', 
        direction: 'reduce', 
        focus: 'Weight reduction for health risk management',
        description: 'Significantly above healthy weight range. High risk for serious health conditions including heart disease and stroke.',
        riskLevel: 'high',
        deviation: 'above'
    }
};

// Risk Levels for Time Estimation
const RISK_LEVELS = {
    'very low': { weeksPerUnit: 0.5, description: 'Maintenance focus' },
    'low': { weeksPerUnit: 0.8, description: 'Gradual improvement' },
    'moderate': { weeksPerUnit: 1.2, description: 'Moderate pace' },
    'high': { weeksPerUnit: 1.5, description: 'Steady progress' }
};

// Target BMI for weight change calculations
const TARGET_BMI = 22.5; // Middle of normal range

// ============================================
// UTILITY FUNCTIONS
// ============================================

function saveUserData(data) {
    try {
        sessionStorage.setItem('bmiData', JSON.stringify(data));
        sessionStorage.setItem('bmiTimestamp', new Date().toISOString());
        console.log('💾 Data saved to sessionStorage:', data);
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

function getUserData() {
    try {
        const data = sessionStorage.getItem('bmiData');
        const result = data ? JSON.parse(data) : null;
        console.log('📖 Data retrieved from sessionStorage:', result);
        return result;
    } catch (error) {
        console.error('Error reading data:', error);
        return null;
    }
}

function clearUserData() {
    sessionStorage.removeItem('bmiData');
    sessionStorage.removeItem('bmiTimestamp');
    console.log('🧹 User data cleared');
}

function calculateBMI(height, weight) {
    const heightMeters = height / 100;
    const bmi = Math.round((weight / (heightMeters * heightMeters)) * 10) / 10;
    console.log(`🧮 BMI calculated: ${bmi} (height: ${height}cm, weight: ${weight}kg)`);
    return bmi;
}

function getBMICategory(bmi) {
    let category;
    if (bmi < 18.5) {
        category = 'underweight';
    } else if (bmi < 25) {
        category = 'normal';
    } else if (bmi < 30) {
        category = 'overweight';
    } else {
        category = 'obese';
    }
    console.log(`🏷️ BMI Category: ${category} (BMI: ${bmi})`);
    return category;
}

function getCategoryName(categoryKey) {
    const categories = {
        'underweight': 'Underweight',
        'normal': 'Normal Weight',
        'overweight': 'Overweight',
        'obese': 'Obese'
    };
    return categories[categoryKey] || 'Unknown';
}

function calculateIdealWeightRange(height) {
    const heightMeters = height / 100;
    const minWeight = 18.5 * (heightMeters * heightMeters);
    const maxWeight = 24.9 * (heightMeters * heightMeters);
    const targetWeight = 22.5 * (heightMeters * heightMeters);
    
    const result = {
        min: Math.round(minWeight * 10) / 10,
        max: Math.round(maxWeight * 10) / 10,
        target: Math.round(targetWeight * 10) / 10
    };
    
    console.log(`⚖️ Ideal weight range: ${result.min}kg - ${result.max}kg (target: ${result.target}kg)`);
    return result;
}

function calculatePercentile(bmi, category) {
    // Simplified percentile calculation based on category
    const percentiles = {
        underweight: Math.max(5, Math.min(15, (bmi / 18.5) * 15)),
        normal: 50 + ((bmi - 21) / 3.9) * 25,
        overweight: 75 + ((bmi - 25) / 5) * 15,
        obese: 90 + Math.min(10, (bmi - 30) / 20 * 10)
    };
    
    const percentile = Math.round(percentiles[category]);
    console.log(`📊 Percentile rank: ${percentile}% (BMI: ${bmi}, Category: ${category})`);
    return percentile;
}

function calculateDeviation(bmi) {
    const healthyMid = 21.7; // Middle of normal range
    const deviation = Math.round((bmi - healthyMid) * 10) / 10;
    console.log(`📈 Deviation from healthy mid-point: ${deviation} (BMI: ${bmi})`);
    return deviation;
}

// ============================================
// TIME ESTIMATION FUNCTIONS
// ============================================

function calculateWeightChange(currentWeight, height, targetBMI = TARGET_BMI) {
    const heightMeters = height / 100;
    const targetWeight = targetBMI * (heightMeters * heightMeters);
    const weightChange = targetWeight - currentWeight;
    
    const result = {
        change: Math.round(Math.abs(weightChange) * 10) / 10,
        direction: weightChange > 0 ? 'gain' : 'reduce',
        targetWeight: Math.round(targetWeight * 10) / 10
    };
    
    console.log(`⏳ Weight change needed: ${result.change}kg (direction: ${result.direction})`);
    return result;
}

function estimateTimeToGoal(weightChange, category) {
    const safeRate = 0.5; // kg per week
    const riskFactor = RISK_LEVELS[BMI_CATEGORIES[category].riskLevel].weeksPerUnit;
    
    // Adjust rate based on risk level
    const adjustedRate = safeRate / riskFactor;
    const weeks = Math.ceil(weightChange / adjustedRate);
    
    const result = {
        weeks: weeks,
        months: Math.ceil(weeks / 4.345),
        rate: adjustedRate,
        safeRate: safeRate
    };
    
    console.log(`📅 Time estimation: ${result.weeks} weeks (≈${result.months} months)`);
    return result;
}

function calculateProgressPercentage(currentBMI, category) {
    const categoryInfo = BMI_CATEGORIES[category];
    
    let progress;
    if (category === 'normal') {
        // For normal weight, progress is distance from edges
        const middlePoint = 22.5;
        const distanceFromMiddle = Math.abs(currentBMI - middlePoint);
        const maxDistance = Math.max(middlePoint - categoryInfo.min, categoryInfo.max - middlePoint);
        
        progress = Math.round(((maxDistance - distanceFromMiddle) / maxDistance) * 100);
    } else {
        // For non-normal categories, progress towards normal range
        const targetEdge = category === 'underweight' ? categoryInfo.max : categoryInfo.min;
        const distance = Math.abs(currentBMI - targetEdge);
        const maxDistance = category === 'underweight' ? 
            categoryInfo.max : 
            Math.min(10, currentBMI - targetEdge); // Cap at 10 BMI points
        
        progress = Math.round(((maxDistance - distance) / maxDistance) * 100);
    }
    
    console.log(`📊 Progress percentage: ${progress}% (BMI: ${currentBMI}, Category: ${category})`);
    return Math.max(0, Math.min(100, progress)); // Ensure between 0-100
}

// ============================================
// GOOGLE SHEETS INTEGRATION - FIXED VERSION
// ============================================

async function submitToGoogleSheets(userData) {
    console.log('🚀 Starting Google Sheets submission...');
    console.log('User Data for Sheets:', userData);
    
    // Check if URL is configured
    if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID_HERE') || GOOGLE_APPS_SCRIPT_URL === '') {
        console.error('❌ ERROR: Please replace GOOGLE_APPS_SCRIPT_URL with your actual Web App URL');
        return false;
    }
    
    try {
        // Prepare data sesuai dengan struktur spreadsheet
        const payload = {
            // Parameter HARUS sesuai dengan Google Apps Script
            timestamp: new Date().toLocaleString('id-ID'), // Format: DD/MM/YYYY HH:MM:SS
            height: userData.height.toFixed(1),
            weight: userData.weight.toFixed(1),
            bmi: userData.bmi.toFixed(1),
            category: getCategoryName(userData.category), // Nama kategori lengkap
            note: `BMI: ${userData.bmi.toFixed(1)} | Height: ${userData.height}cm | Weight: ${userData.weight}kg`,
            method: 'Academic BMI Calculator Web App'
        };
        
        console.log('📤 Payload for Google Sheets:', payload);
        
        // Method 1: Try Image Pixel method
        console.log('🔄 Attempting Image Pixel submission...');
        const success = await submitViaImagePixel(payload);
        
        if (success) {
            console.log('✅ Data submitted successfully via Image Pixel');
            return true;
        } else {
            // Method 2: Try Fetch method as fallback
            console.log('🔄 Trying Fetch method as fallback...');
            const fetchSuccess = await submitViaFetch(payload);
            
            if (fetchSuccess) {
                console.log('✅ Data submitted successfully via Fetch');
                return true;
            } else {
                // Fallback to localStorage
                console.log('💾 Saving to localStorage as backup');
                saveToLocalStorage(payload);
                return false;
            }
        }
        
    } catch (error) {
        console.error('❌ Submission error:', error);
        return false;
    }
}

function submitViaImagePixel(payload) {
    return new Promise((resolve) => {
        try {
            // Build URL dengan parameter YANG SESUAI
            const params = new URLSearchParams();
            
            // ⭐⭐⭐ PENTING: Parameter HARUS sesuai dengan Google Apps Script
            params.append('timestamp', payload.timestamp);
            params.append('height', payload.height);
            params.append('weight', payload.weight);
            params.append('bmi', payload.bmi);
            params.append('category', payload.category);
            params.append('note', payload.note);
            params.append('method', payload.method);
            
            const url = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
            console.log('📸 Pixel URL:', url);
            
            // Create invisible image
            const img = new Image();
            img.width = 1;
            img.height = 1;
            img.style.position = 'absolute';
            img.style.left = '-9999px';
            img.style.top = '-9999px';
            img.style.opacity = '0';
            
            let success = false;
            let timedOut = false;
            
            img.onload = function() {
                if (!timedOut) {
                    console.log('✅ Pixel loaded - data sent successfully');
                    success = true;
                    resolve(true);
                    
                    // Clean up after 2 seconds
                    setTimeout(() => {
                        if (img.parentNode) {
                            img.parentNode.removeChild(img);
                        }
                    }, 2000);
                }
            };
            
            img.onerror = function() {
                if (!timedOut) {
                    console.warn('❌ Pixel failed to load');
                    resolve(false);
                }
            };
            
            // Add to page and trigger load
            document.body.appendChild(img);
            img.src = url;
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!success) {
                    console.warn('⏰ Pixel timeout after 10 seconds');
                    timedOut = true;
                    resolve(false);
                }
            }, 10000);
            
        } catch (error) {
            console.error('Pixel method error:', error);
            resolve(false);
        }
    });
}

function submitViaFetch(payload) {
    return new Promise((resolve) => {
        try {
            const params = new URLSearchParams();
            
            params.append('timestamp', payload.timestamp);
            params.append('height', payload.height);
            params.append('weight', payload.weight);
            params.append('bmi', payload.bmi);
            params.append('category', payload.category);
            params.append('note', payload.note);
            params.append('method', payload.method);
            
            const url = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
            console.log('🔗 Fetch URL:', url);
            
            // Use fetch with no-cors mode for Google Apps Script
            fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache'
            })
            .then(() => {
                console.log('✅ Fetch request sent (no-cors mode)');
                resolve(true);
            })
            .catch(error => {
                console.warn('❌ Fetch request failed:', error);
                resolve(false);
            });
            
        } catch (error) {
            console.error('Fetch method error:', error);
            resolve(false);
        }
    });
}

function saveToLocalStorage(data) {
    try {
        const pending = JSON.parse(localStorage.getItem('bmi_pending_submissions') || '[]');
        pending.push({
            ...data,
            savedAt: new Date().toISOString(),
            attempts: 0,
            id: Date.now() + Math.random().toString(36).substr(2, 9)
        });
        
        localStorage.setItem('bmi_pending_submissions', JSON.stringify(pending));
        console.log('💾 Saved to localStorage. Total pending submissions:', pending.length);
        
        // Try to sync pending submissions every minute
        setTimeout(() => {
            syncPendingSubmissions();
        }, 60000);
        
        return true;
    } catch (error) {
        console.error('LocalStorage error:', error);
        return false;
    }
}

async function syncPendingSubmissions() {
    const pending = JSON.parse(localStorage.getItem('bmi_pending_submissions') || '[]');
    if (pending.length === 0) return;
    
    console.log(`🔄 Syncing ${pending.length} pending submissions...`);
    
    const successful = [];
    const updatedPending = [];
    
    for (let i = 0; i < pending.length; i++) {
        const data = pending[i];
        
        // Skip if already attempted 3 times
        if (data.attempts >= 3) {
            console.log(`Skipping submission ${data.id} - too many attempts`);
            continue;
        }
        
        try {
            // Remove id and attempts from payload
            const { id, attempts, savedAt, ...payload } = data;
            
            const success = await submitViaImagePixel(payload);
            
            if (success) {
                successful.push(data.id);
                console.log(`✅ Successfully synced submission ${data.id}`);
            } else {
                // Increment attempts and keep in pending
                data.attempts = (data.attempts || 0) + 1;
                updatedPending.push(data);
                console.log(`⚠️ Failed to sync submission ${data.id}, attempt ${data.attempts}`);
            }
        } catch (error) {
            console.error(`Error syncing submission ${data.id}:`, error);
            data.attempts = (data.attempts || 0) + 1;
            updatedPending.push(data);
        }
    }
    
    // Update localStorage
    if (successful.length > 0) {
        const remaining = pending.filter(item => !successful.includes(item.id));
        localStorage.setItem('bmi_pending_submissions', JSON.stringify(remaining));
        console.log(`✅ Removed ${successful.length} successfully synced submissions`);
    }
}

function updateSubmissionStatus(success, message = '') {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const progressBar = document.getElementById('progress-bar');
    const submissionMessage = document.getElementById('submission-message');
    
    if (!statusDot || !statusText) return;
    
    // Animate progress bar
    if (progressBar) {
        progressBar.style.width = success ? '100%' : '50%';
    }
    
    if (success) {
        statusDot.className = 'status-dot success';
        statusText.textContent = 'Data Submitted Successfully';
        statusText.style.color = 'var(--success-color)';
        
        if (submissionMessage) {
            submissionMessage.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-check-circle"></i> 
                    <div>
                        <strong>Research Data Submitted</strong>
                        <p>Your anonymous BMI data has been successfully recorded in the research database.</p>
                    </div>
                </div>
            `;
        }
        
        // Update status dot after animation
        setTimeout(() => {
            if (statusDot) statusDot.style.animation = 'none';
        }, 2000);
        
    } else {
        statusDot.className = 'status-dot';
        statusDot.style.background = 'var(--warning-color)';
        statusText.textContent = message || 'Data Saved Locally';
        statusText.style.color = 'var(--warning-color)';
        
        if (submissionMessage) {
            const msg = message || 'Data saved locally. Will sync when connection is available.';
            submissionMessage.innerHTML = `
                <div class="warning-message">
                    <i class="fas fa-exclamation-triangle"></i> 
                    <div>
                        <strong>Local Storage</strong>
                        <p>${msg}</p>
                    </div>
                </div>
            `;
        }
    }
}

// ============================================
// DISPLAY FUNCTIONS
// ============================================

function updateTimeEstimationDisplay(userData) {
    const { height, weight, bmi, category } = userData;
    
    // Calculate weight change needed
    const weightChange = calculateWeightChange(weight, height);
    const timeEstimate = estimateTimeToGoal(weightChange.change, category);
    
    // Update display elements
    const weightChangeEl = document.getElementById('weight-change');
    const estimatedTimeEl = document.getElementById('estimated-time');
    const timelineProgressEl = document.getElementById('timeline-progress');
    const timelineEndEl = document.getElementById('timeline-end-weeks');
    const currentMarkerEl = document.getElementById('current-marker');
    const goalMarkerEl = document.getElementById('goal-marker');
    const targetBMIEl = document.getElementById('target-bmi');
    
    if (weightChangeEl) weightChangeEl.textContent = `${weightChange.change} kg`;
    if (estimatedTimeEl) estimatedTimeEl.textContent = `${timeEstimate.weeks} weeks (≈${timeEstimate.months} months)`;
    if (timelineEndEl) timelineEndEl.textContent = `Week ${timeEstimate.weeks}`;
    if (targetBMIEl) targetBMIEl.textContent = TARGET_BMI.toFixed(1);
    
    // Calculate and animate progress
    const progressPercentage = calculateProgressPercentage(bmi, category);
    
    if (timelineProgressEl) {
        setTimeout(() => {
            timelineProgressEl.style.width = `${progressPercentage}%`;
            timelineProgressEl.style.transition = 'width 1.5s ease-in-out';
        }, 500);
    }
    
    // Position markers
    if (currentMarkerEl && goalMarkerEl) {
        const timelineBar = document.querySelector('.timeline-bar');
        if (timelineBar) {
            const barWidth = timelineBar.offsetWidth;
            
            // Current position (always at start for estimation)
            currentMarkerEl.style.left = '0px';
            currentMarkerEl.style.transition = 'left 1.5s ease-in-out';
            
            // Goal position based on progress
            const goalPosition = (progressPercentage / 100) * barWidth;
            goalMarkerEl.style.left = `${goalPosition}px`;
            goalMarkerEl.style.transition = 'left 1.5s ease-in-out';
        }
    }
    
    // Update summary page
    const summaryTimeEl = document.getElementById('summary-time');
    if (summaryTimeEl) {
        summaryTimeEl.textContent = `${timeEstimate.weeks} weeks`;
    }
    
    console.log('⏰ Time estimation display updated');
    
    return {
        weightChange,
        timeEstimate,
        progressPercentage
    };
}

function updateResultDisplay(userData) {
    const { height, weight, bmi, category } = userData;
    const idealWeight = calculateIdealWeightRange(height);
    const categoryInfo = BMI_CATEGORIES[category];
    
    console.log('🔄 Updating result display:', { bmi, category: categoryInfo.name });
    
    // Update basic BMI display
    const bmiValueEl = document.getElementById('bmi-value');
    const bmiCategoryEl = document.getElementById('bmi-category');
    const categorySubtitleEl = document.getElementById('category-subtitle');
    
    if (bmiValueEl) {
        bmiValueEl.textContent = bmi.toFixed(1);
        bmiValueEl.style.transition = 'all 0.5s ease';
    }
    
    if (bmiCategoryEl) {
        bmiCategoryEl.textContent = categoryInfo.name;
        bmiCategoryEl.style.color = categoryInfo.color;
        bmiCategoryEl.style.transition = 'all 0.5s ease';
    }
    
    if (categorySubtitleEl) categorySubtitleEl.textContent = categoryInfo.description;
    
    // Update scale marker
    updateScaleMarker(bmi, category);
    
    // Update calculation time
    const timeDisplayEl = document.getElementById('time-display');
    if (timeDisplayEl) {
        const now = new Date();
        timeDisplayEl.textContent = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // Update statistical details
    const deviationEl = document.getElementById('deviation-value');
    const percentileEl = document.getElementById('percentile-value');
    
    if (deviationEl) {
        const deviation = calculateDeviation(bmi);
        deviationEl.textContent = `${deviation > 0 ? '+' : ''}${deviation}`;
    }
    
    if (percentileEl) {
        const percentile = calculatePercentile(bmi, category);
        percentileEl.textContent = `${percentile}%`;
    }
    
    // Update ideal weight range
    const idealWeightMinEl = document.getElementById('ideal-weight-min');
    const idealWeightMaxEl = document.getElementById('ideal-weight-max');
    
    if (idealWeightMinEl) idealWeightMinEl.textContent = `${idealWeight.min} kg`;
    if (idealWeightMaxEl) idealWeightMaxEl.textContent = `${idealWeight.max} kg`;
    
    // Update health assessment
    const healthAssessmentEl = document.getElementById('health-assessment');
    const comparisonTextEl = document.getElementById('comparison-text');
    
    if (healthAssessmentEl) {
        healthAssessmentEl.textContent = categoryInfo.description;
    }
    
    if (comparisonTextEl) {
        const deviation = calculateDeviation(bmi);
        const direction = deviation > 0 ? 'above' : 'below';
        comparisonTextEl.textContent = `Your BMI is ${Math.abs(deviation)} points ${direction} the healthy range midpoint (21.7).`;
    }
    
    // Update risk indicator
    updateRiskIndicator(category);
    
    // Update summary page
    updateSummaryPage(userData);
    
    console.log('✅ Result display updated successfully');
}

function updateScaleMarker(bmi, category) {
    const marker = document.getElementById('scale-marker');
    if (!marker) {
        console.warn('⚠️ Scale marker element not found');
        return;
    }
    
    let position;
    if (bmi < 18.5) {
        position = (bmi / 18.5) * 25;
    } else if (bmi < 25) {
        position = 25 + ((bmi - 18.5) / 6.5) * 25;
    } else if (bmi < 30) {
        position = 50 + ((bmi - 25) / 5) * 25;
    } else {
        position = 75 + Math.min((bmi - 30) / 20, 25);
    }
    
    marker.style.left = `${position}%`;
    marker.style.transition = 'left 1s ease-in-out';
    
    // Update marker color based on category
    const markerDot = marker.querySelector('.marker-dot');
    if (markerDot) {
        markerDot.style.background = BMI_CATEGORIES[category].color;
        markerDot.style.transition = 'background 0.5s ease';
    }
    
    console.log(`📍 Scale marker positioned at ${position}% (BMI: ${bmi})`);
}

function updateRiskIndicator(category) {
    const riskIndicator = document.getElementById('risk-indicator');
    if (!riskIndicator) {
        console.warn('⚠️ Risk indicator element not found');
        return;
    }
    
    const riskLevel = BMI_CATEGORIES[category].riskLevel;
    
    // Reset all
    riskIndicator.querySelectorAll('.risk-level').forEach(level => {
        level.style.opacity = '0.3';
        level.style.transform = 'scale(1)';
        level.style.transition = 'all 0.3s ease';
    });
    
    // Highlight current risk level
    const currentRisk = riskIndicator.querySelector(`.risk-level.${riskLevel.replace(' ', '-')}`);
    if (currentRisk) {
        currentRisk.style.opacity = '1';
        currentRisk.style.transform = 'scale(1.1)';
        console.log(`⚠️ Risk level highlighted: ${riskLevel}`);
    }
}

function updateSummaryPage(userData) {
    const { category } = userData;
    const categoryInfo = BMI_CATEGORIES[category];
    
    const summaryCategoryEl = document.getElementById('summary-category');
    const summaryDirectionEl = document.getElementById('summary-direction');
    const summaryFocusEl = document.getElementById('summary-focus');
    const summaryCategorySubEl = document.getElementById('summary-category-sub');
    
    if (summaryCategoryEl) {
        summaryCategoryEl.textContent = categoryInfo.name;
        summaryCategoryEl.style.color = categoryInfo.color;
    }
    
    if (summaryDirectionEl) {
        const directionText = categoryInfo.direction === 'gain' ? 'Gradual Weight Gain' :
                            categoryInfo.direction === 'maintain' ? 'Weight Maintenance' :
                            'Gradual Weight Reduction';
        summaryDirectionEl.textContent = directionText;
    }
    
    if (summaryFocusEl) summaryFocusEl.textContent = categoryInfo.focus;
    if (summaryCategorySubEl) summaryCategorySubEl.textContent = categoryInfo.description;
}

// ============================================
// PAGE INITIALIZATION
// ============================================

function initInputPage() {
    console.log('📝 Initializing Input Page...');
    
    // HANYA inisialisasi modal dan reset button di sini
    // Form handling sudah dilakukan oleh inline JavaScript di index.html
    initModals();
    
    // Reset button handler
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            const form = document.getElementById('bmi-form');
            if (form) {
                form.reset();
                document.getElementById('data-consent').checked = true;
                
                const errorDiv = document.getElementById('error-message');
                if (errorDiv) errorDiv.style.display = 'none';
                
                console.log('🔄 Form reset');
            }
        });
    }
    
    // Update navigation links based on existing data
    const resultLink = document.getElementById('result-link');
    const suggestionsLink = document.getElementById('suggestions-link');
    
    if (resultLink && suggestionsLink) {
        const existingBMI = localStorage.getItem('bmiValue');
        if (existingBMI) {
            resultLink.href = 'result.html';
            suggestionsLink.href = 'suggestion.html';
            console.log('🔗 Navigation links updated (data exists)');
        }
    }
    
    // Log debug info
    console.log('✅ Input page initialized');
    console.log('Google Sheets URL:', GOOGLE_APPS_SCRIPT_URL);
    console.log('submitToGoogleSheets function:', typeof submitToGoogleSheets);
}

function initResultPage() {
    console.log('📊 Initializing Result Page...');
    
    const userData = getUserData();
    
    if (!userData) {
        console.log('❌ No user data found, redirecting to index...');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('📋 User Data for Result:', userData);
    
    // Update all displays
    updateResultDisplay(userData);
    const timeEstimation = updateTimeEstimationDisplay(userData);
    
    // Combine data
    const fullData = {
        ...userData,
        timeEstimation: timeEstimation,
        deviation: calculateDeviation(userData.bmi),
        percentile: calculatePercentile(userData.bmi, userData.category),
        idealWeight: calculateIdealWeightRange(userData.height)
    };
    
    // Save updated data
    saveUserData(fullData);
    
    // Set calculation time
    const calculationTime = document.getElementById('calculation-time');
    if (calculationTime) {
        const date = new Date(userData.timestamp);
        calculationTime.textContent = `Calculated: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Initialize modals
    initModals();
    
    // Next button handler
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('➡️ Navigating to suggestions page');
            window.location.href = 'suggestion.html';
        });
    }
    
    // View Data button
    const viewDataBtn = document.getElementById('view-data-btn');
    if (viewDataBtn) {
        viewDataBtn.addEventListener('click', function() {
            const message = `Your Data:\n\nHeight: ${userData.height} cm\nWeight: ${userData.weight} kg\nBMI: ${userData.bmi}\nCategory: ${getCategoryName(userData.category)}\n\nIdeal Weight Range: ${calculateIdealWeightRange(userData.height).min}kg - ${calculateIdealWeightRange(userData.height).max}kg`;
            alert(message);
            console.log('👁️ View data button clicked');
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportDataAsPDF(userData, timeEstimation);
        });
    }
    
    // Submission status untuk data yang sudah disubmit dari index.html
    if (userData.consent) {
        // Data sudah disubmit dari index.html, hanya update status
        updateSubmissionStatus(true, 'Data submitted successfully');
        
        // Check for pending submissions
        const pending = JSON.parse(localStorage.getItem('bmi_pending_submissions') || '[]');
        if (pending.length > 0) {
            console.log(`🔄 Found ${pending.length} pending submissions, attempting sync...`);
            setTimeout(() => {
                syncPendingSubmissions();
            }, 3000);
        }
    } else {
        updateSubmissionStatus(false, 'Opted out of data collection');
    }
    
    console.log('✅ Result page initialized');
}

function initSuggestionPage() {
    console.log('💡 Initializing Suggestion Page...');
    
    const userData = getUserData();
    
    if (!userData) {
        console.log('❌ No user data found, redirecting to index...');
        window.location.href = 'index.html';
        return;
    }
    
    const { category, timeEstimation } = userData;
    const categoryInfo = BMI_CATEGORIES[category];
    
    console.log('📋 User Data for Suggestions:', { category: categoryInfo.name, timeEstimation });
    
    // Update summary
    updateSummaryPage(userData);
    
    // Update time in summary if available
    if (timeEstimation) {
        const summaryTimeEl = document.getElementById('summary-time');
        if (summaryTimeEl) {
            summaryTimeEl.textContent = `${timeEstimation.timeEstimate.weeks} weeks`;
        }
    }
    
    // Initialize modals
    initModals();
    
    // Button handlers
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            console.log('🖨️ Print button clicked');
            window.print();
        });
    }
    
    const savePlanBtn = document.getElementById('save-plan-btn');
    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', function() {
            console.log('💾 Save plan button clicked');
            saveActionPlan(userData);
        });
    }
    
    console.log('✅ Suggestion page initialized');
}

function exportDataAsPDF(userData, timeEstimation) {
    console.log('📄 Exporting data as PDF...');
    
    // Simple export functionality
    const dataStr = `
ACADEMIC BMI ANALYSIS REPORT
===============================
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

PERSONAL MEASUREMENTS
---------------------
Height: ${userData.height} cm
Weight: ${userData.weight} kg

BMI ANALYSIS
------------
BMI Value: ${userData.bmi} kg/m²
WHO Category: ${getCategoryName(userData.category)}
Percentile Rank: ${calculatePercentile(userData.bmi, userData.category)}%
Deviation from Healthy Range: ${calculateDeviation(userData.bmi)}

IDEAL WEIGHT RANGE
------------------
Minimum: ${calculateIdealWeightRange(userData.height).min} kg
Maximum: ${calculateIdealWeightRange(userData.height).max} kg
Target: ${calculateIdealWeightRange(userData.height).target} kg

TIME ESTIMATION
---------------
Weight Change Needed: ${timeEstimation.weightChange.change} kg
Estimated Time: ${timeEstimation.timeEstimate.weeks} weeks
Safe Rate: ${timeEstimation.timeEstimate.safeRate} kg/week

HEALTH RECOMMENDATIONS
----------------------
Focus Area: ${BMI_CATEGORIES[userData.category].focus}
Direction: ${BMI_CATEGORIES[userData.category].direction}

RESEARCH DATA CONTRIBUTION
--------------------------
This data has been contributed anonymously to academic research.

This report is generated for educational purposes.
Universitas Islam Indonesia - Sistem Informasi Manajemen
Students: Bagaskara Putera Marendra & M. Arif Al-Ghifary
`;
    
    // Create download link
    const blob = new Blob([dataStr], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BMI_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Report downloaded successfully');
    alert('Report downloaded as text file.');
}

function saveActionPlan(userData) {
    console.log('📋 Saving action plan...');
    
    const plan = `
PERSONAL HEALTH ACTION PLAN
============================
Based on BMI Analysis
Generated: ${new Date().toLocaleDateString()}

CURRENT STATUS
--------------
BMI: ${userData.bmi} (${getCategoryName(userData.category)})
Category: ${BMI_CATEGORIES[userData.category].description}

ACTION PLAN
-----------
1. Dietary Adjustments:
   - Focus on ${BMI_CATEGORIES[userData.category].focus}
   - Follow evidence-based nutritional guidelines
   - Monitor portion sizes and meal frequency

2. Physical Activity:
   - Engage in regular moderate exercise
   - Include strength training 2-3 times per week
   - Increase daily non-exercise activity

3. Lifestyle Modifications:
   - Ensure adequate sleep (7-9 hours)
   - Manage stress through mindfulness
   - Stay hydrated throughout the day

4. Monitoring & Evaluation:
   - Track progress weekly
   - Adjust plan based on results
   - Consult healthcare professionals as needed

TIME FRAME
----------
Estimated completion: ${userData.timeEstimation?.timeEstimate.weeks || '--'} weeks
Target BMI: ${TARGET_BMI}

ACADEMIC NOTE
-------------
This plan is based on epidemiological research and WHO guidelines.
Individual results may vary. Consult professionals for personalized advice.

Generated by: Academic BMI Calculator
Universitas Islam Indonesia
Course: Sistem Informasi Manajemen
Students: Bagaskara Putera Marendra & M. Arif Al-Ghifary
`;
    
    // Create download link
    const blob = new Blob([plan], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Health_Action_Plan_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Action plan downloaded successfully');
    alert('Action Plan downloaded successfully.');
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function initModals() {
    console.log('🎪 Initializing modals...');
    
    // 1. Modal close buttons
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                console.log('❌ Modal closed');
            }
        });
    });

    // 2. Modal triggers dengan data-modal attribute
    const modalTriggers = document.querySelectorAll('[data-modal]');
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                // Close semua modal lainnya
                document.querySelectorAll('.modal').forEach(m => {
                    m.style.display = 'none';
                });
                
                // Tampilkan modal yang dipilih
                modal.style.display = 'flex';
                modal.style.animation = 'fadeIn 0.3s ease';
                
                console.log(`📂 Modal opened: ${modalId}`);
            }
        });
    });

    // 3. Close modal saat klik di luar konten
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            console.log('❌ Modal closed (outside click)');
        }
    });

    // 4. Close modal dengan ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            console.log('❌ All modals closed (ESC key)');
        }
    });
    
    console.log('✅ Modals initialized');
}

// ============================================
// TEST FUNCTIONS
// ============================================

window.testGoogleSheets = function(height = 170, weight = 65) {
    console.group('🧪 Testing Google Sheets Integration');
    
    const bmi = calculateBMI(height, weight);
    const category = getBMICategory(bmi);
    
    const testData = {
        height: height,
        weight: weight,
        bmi: bmi,
        category: category,
        consent: true,
        timestamp: new Date().toISOString()
    };
    
    console.log('Test Data:', testData);
    
    // Direct test URL
    const params = new URLSearchParams({
        timestamp: new Date().toLocaleString('id-ID'),
        height: height.toFixed(1),
        weight: weight.toFixed(1),
        bmi: bmi.toFixed(1),
        category: getCategoryName(category),
        note: `Test submission from console | BMI: ${bmi.toFixed(1)}`,
        method: 'Test Console Submission'
    });
    
    const testUrl = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
    console.log('Direct Test URL:', testUrl);
    
    // Open in new tab for manual testing
    window.open(testUrl, '_blank');
    
    // Test submission via function
    submitToGoogleSheets(testData).then(success => {
        console.log('Result:', success ? '✅ Success' : '❌ Failed');
        console.groupEnd();
    });
};

window.viewPendingSubmissions = function() {
    const pending = JSON.parse(localStorage.getItem('bmi_pending_submissions') || '[]');
    console.log('📋 Pending Submissions:', pending);
    console.log(`Total: ${pending.length} submissions pending`);
    
    if (pending.length > 0) {
        alert(`There are ${pending.length} submissions pending synchronization. Check console for details.`);
    } else {
        alert('No pending submissions.');
    }
    
    return pending;
};

window.clearPendingSubmissions = function() {
    localStorage.removeItem('bmi_pending_submissions');
    console.log('🧹 All pending submissions cleared');
    alert('All pending submissions have been cleared.');
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Document loaded, initializing...');
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    console.log('📄 Current page:', currentPage);
    
    switch(currentPage) {
        case 'index.html':
        case '':
            initInputPage();
            break;
        case 'result.html':
            initResultPage();
            break;
        case 'suggestion.html':
            initSuggestionPage();
            break;
        default:
            console.warn('⚠️ Unknown page, defaulting to index');
            initInputPage();
    }
    
    // Clear data on start over
    document.querySelectorAll('a[href="index.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === 'index.html') {
                console.log('🔄 Starting new assessment, clearing data...');
                clearUserData();
                // Clear localStorage untuk data lama juga
                localStorage.removeItem('bmiHeight');
                localStorage.removeItem('bmiWeight');
                localStorage.removeItem('bmiValue');
                localStorage.removeItem('bmiCategory');
                localStorage.removeItem('bmiCalculated');
            }
        });
    });
    
    // Development helper
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🛠 Development mode active');
        console.log('Available test functions:');
        console.log('- testGoogleSheets(height, weight)');
        console.log('- viewPendingSubmissions()');
        console.log('- clearPendingSubmissions()');
        console.log('Current Google Sheets URL:', GOOGLE_APPS_SCRIPT_URL);
    }
    
    // Add fade-in animation to cards
    setTimeout(() => {
        document.querySelectorAll('.card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }, 100);
    
    console.log('✅ Application initialized successfully');
});

// ============================================
// GLOBAL ERROR HANDLING
// ============================================

window.addEventListener('error', function(e) {
    console.error('🚨 Global error caught:', e.error);
    console.error('Error details:', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

// ============================================
// EXPORT FUNCTIONS FOR GLOBAL USE
// ============================================

// Export important functions for use in inline scripts
window.BMI_APP = {
    calculateBMI,
    getBMICategory,
    getCategoryName,
    calculateIdealWeightRange,
    submitToGoogleSheets,
    saveUserData,
    getUserData,
    clearUserData,
    testGoogleSheets
};

console.log('📦 BMI Application functions exported to window.BMI_APP');