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
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

function getUserData() {
    try {
        const data = sessionStorage.getItem('bmiData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading data:', error);
        return null;
    }
}

function clearUserData() {
    sessionStorage.removeItem('bmiData');
    sessionStorage.removeItem('bmiTimestamp');
}

function calculateBMI(height, weight) {
    const heightMeters = height / 100;
    return Math.round((weight / (heightMeters * heightMeters)) * 10) / 10;
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
}

function calculateIdealWeightRange(height) {
    const heightMeters = height / 100;
    const minWeight = 18.5 * (heightMeters * heightMeters);
    const maxWeight = 24.9 * (heightMeters * heightMeters);
    return {
        min: Math.round(minWeight * 10) / 10,
        max: Math.round(maxWeight * 10) / 10,
        target: Math.round(22.5 * (heightMeters * heightMeters) * 10) / 10
    };
}

function calculatePercentile(bmi, category) {
    // Simplified percentile calculation based on category
    const percentiles = {
        underweight: Math.max(5, Math.min(15, (bmi / 18.5) * 15)),
        normal: 50 + ((bmi - 21) / 3.9) * 25,
        overweight: 75 + ((bmi - 25) / 5) * 15,
        obese: 90 + Math.min(10, (bmi - 30) / 20 * 10)
    };
    
    return Math.round(percentiles[category]);
}

function calculateDeviation(bmi) {
    const healthyMid = 21.7; // Middle of normal range
    return Math.round((bmi - healthyMid) * 10) / 10;
}

// ============================================
// TIME ESTIMATION FUNCTIONS
// ============================================

function calculateWeightChange(currentWeight, height, targetBMI = TARGET_BMI) {
    const heightMeters = height / 100;
    const targetWeight = targetBMI * (heightMeters * heightMeters);
    const weightChange = targetWeight - currentWeight;
    
    return {
        change: Math.round(Math.abs(weightChange) * 10) / 10,
        direction: weightChange > 0 ? 'gain' : 'reduce',
        targetWeight: Math.round(targetWeight * 10) / 10
    };
}

function estimateTimeToGoal(weightChange, category) {
    const safeRate = 0.5; // kg per week
    const riskFactor = RISK_LEVELS[BMI_CATEGORIES[category].riskLevel].weeksPerUnit;
    
    // Adjust rate based on risk level
    const adjustedRate = safeRate / riskFactor;
    const weeks = Math.ceil(weightChange / adjustedRate);
    
    return {
        weeks: weeks,
        months: Math.ceil(weeks / 4.345),
        rate: adjustedRate,
        safeRate: safeRate
    };
}

function calculateProgressPercentage(currentBMI, category) {
    const categoryInfo = BMI_CATEGORIES[category];
    
    if (category === 'normal') {
        // For normal weight, progress is distance from edges
        const distanceFromBottom = Math.abs(currentBMI - categoryInfo.min);
        const distanceFromTop = Math.abs(currentBMI - categoryInfo.max);
        const rangeWidth = categoryInfo.max - categoryInfo.min;
        
        // Progress towards the middle (22.5)
        const middlePoint = 22.5;
        const distanceFromMiddle = Math.abs(currentBMI - middlePoint);
        const maxDistance = Math.max(middlePoint - categoryInfo.min, categoryInfo.max - middlePoint);
        
        return Math.round(((maxDistance - distanceFromMiddle) / maxDistance) * 100);
    } else {
        // For non-normal categories, progress towards normal range
        const targetEdge = category === 'underweight' ? categoryInfo.max : categoryInfo.min;
        const distance = Math.abs(currentBMI - targetEdge);
        const maxDistance = category === 'underweight' ? 
            categoryInfo.max : 
            Math.min(10, currentBMI - targetEdge); // Cap at 10 BMI points
        
        return Math.round(((maxDistance - distance) / maxDistance) * 100);
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
        }, 500);
    }
    
    // Position markers
    if (currentMarkerEl && goalMarkerEl) {
        const timelineBar = document.querySelector('.timeline-bar');
        if (timelineBar) {
            const barWidth = timelineBar.offsetWidth;
            
            // Current position (always at start for estimation)
            currentMarkerEl.style.left = '0px';
            
            // Goal position based on progress
            const goalPosition = (progressPercentage / 100) * barWidth;
            goalMarkerEl.style.left = `${goalPosition}px`;
        }
    }
    
    // Update summary page
    const summaryTimeEl = document.getElementById('summary-time');
    if (summaryTimeEl) {
        summaryTimeEl.textContent = `${timeEstimate.weeks} weeks`;
    }
    
    return {
        weightChange,
        timeEstimate,
        progressPercentage
    };
}

function updateResultDisplay(userData) {
    const { height, weight, bmi, category, idealWeight } = userData;
    const categoryInfo = BMI_CATEGORIES[category];
    
    // Update basic BMI display
    const bmiValueEl = document.getElementById('bmi-value');
    const bmiCategoryEl = document.getElementById('bmi-category');
    const categorySubtitleEl = document.getElementById('category-subtitle');
    
    if (bmiValueEl) bmiValueEl.textContent = bmi.toFixed(1);
    if (bmiCategoryEl) {
        bmiCategoryEl.textContent = categoryInfo.name;
        bmiCategoryEl.style.color = categoryInfo.color;
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
        comparisonTextEl.textContent = `Your BMI is ${Math.abs(deviation)} points ${direction} the healthy range midpoint.`;
    }
    
    // Update risk indicator
    updateRiskIndicator(category);
    
    // Update summary page
    updateSummaryPage(userData);
}

function updateScaleMarker(bmi, category) {
    const marker = document.getElementById('scale-marker');
    if (!marker) return;
    
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
    
    // Update marker color based on category
    const markerDot = marker.querySelector('.marker-dot');
    if (markerDot) {
        markerDot.style.background = BMI_CATEGORIES[category].color;
    }
}

function updateRiskIndicator(category) {
    const riskIndicator = document.getElementById('risk-indicator');
    if (!riskIndicator) return;
    
    const riskLevel = BMI_CATEGORIES[category].riskLevel;
    
    // Reset all
    riskIndicator.querySelectorAll('.risk-level').forEach(level => {
        level.style.opacity = '0.3';
    });
    
    // Highlight current risk level
    const currentRisk = riskIndicator.querySelector(`.risk-level.${riskLevel.replace(' ', '-')}`);
    if (currentRisk) {
        currentRisk.style.opacity = '1';
        currentRisk.style.transform = 'scale(1.1)';
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
// GOOGLE SHEETS INTEGRATION
// ============================================

async function submitToGoogleSheets(userData) {
    console.log('🚀 Starting Google Sheets submission...');
    
    // Check if URL is configured
    if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_SCRIPT_ID_HERE')) {
        console.error('❌ ERROR: Please replace GOOGLE_APPS_SCRIPT_URL with your Web App URL');
        updateSubmissionStatus(false, 'URL not configured');
        return false;
    }
    
    try {
        // Prepare data
        const payload = {
            height: userData.height.toFixed(1),
            weight: userData.weight.toFixed(1),
            bmi: userData.bmi.toFixed(1),
            category: BMI_CATEGORIES[userData.category].name,
            note: `Deviation: ${calculateDeviation(userData.bmi)}`,
            method: 'web_app',
            timestamp: Date.now(),
            student1: 'Bagaskara Putera Marendra',
            student2: 'M. Arif Al-Ghifary',
            course: 'Sistem Informasi Manajemen'
        };
        
        console.log('📤 Payload:', payload);
        
        // Submit via Image Pixel method
        const success = await submitViaImagePixel(payload);
        
        if (success) {
            console.log('✅ Data submitted successfully');
            updateSubmissionStatus(true);
            return true;
        } else {
            // Fallback to localStorage
            console.log('💾 Saving to localStorage as backup');
            saveToLocalStorage(payload);
            updateSubmissionStatus(false, 'Saved locally');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Submission error:', error);
        updateSubmissionStatus(false, error.message);
        return false;
    }
}

function submitViaImagePixel(payload) {
    return new Promise((resolve) => {
        try {
            // Build URL with parameters
            const params = new URLSearchParams();
            Object.entries(payload).forEach(([key, value]) => {
                params.append(key, value);
            });
            
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
            
            img.onload = function() {
                console.log('✅ Pixel loaded - data sent');
                success = true;
                resolve(true);
                
                // Clean up
                setTimeout(() => {
                    if (img.parentNode) {
                        img.parentNode.removeChild(img);
                    }
                }, 1000);
            };
            
            img.onerror = function() {
                console.warn('❌ Pixel failed to load');
                resolve(false);
            };
            
            // Add to page and trigger load
            document.body.appendChild(img);
            img.src = url;
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (!success) {
                    console.warn('⏰ Pixel timeout');
                    resolve(false);
                }
            }, 5000);
            
        } catch (error) {
            console.error('Pixel method error:', error);
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
            attempts: 0
        });
        
        localStorage.setItem('bmi_pending_submissions', JSON.stringify(pending));
        console.log('💾 Saved to localStorage. Total pending:', pending.length);
        
        return true;
    } catch (error) {
        console.error('LocalStorage error:', error);
        return false;
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
            statusDot.style.animation = 'none';
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
// PAGE INITIALIZATION
// ============================================

function initInputPage() {
    const form = document.getElementById('bmi-form');
    if (!form) return;
    
    const resetBtn = document.getElementById('reset-btn');
    const errorMessage = document.getElementById('error-message');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const height = parseFloat(document.getElementById('height').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const consent = document.getElementById('data-consent').checked;
        
        // Validation
        if (!height || !weight) {
            showError('Please enter both height and weight for accurate calculation.');
            return;
        }
        
        if (height < 50 || height > 250) {
            showError('Please enter a valid height between 50cm and 250cm.');
            return;
        }
        
        if (weight < 30 || weight > 200) {
            showError('Please enter a valid weight between 30kg and 200kg.');
            return;
        }
        
        // Calculate BMI
        const bmi = calculateBMI(height, weight);
        const category = getBMICategory(bmi);
        const idealWeight = calculateIdealWeightRange(height);
        
        // Prepare user data
        const userData = {
            height: height,
            weight: weight,
            bmi: bmi,
            category: category,
            idealWeight: idealWeight,
            consent: consent,
            timestamp: new Date().toISOString()
        };
        
        // Save and redirect
        if (saveUserData(userData)) {
            // Add smooth transition
            document.body.style.opacity = '0.7';
            setTimeout(() => {
                window.location.href = 'result.html';
            }, 300);
        } else {
            showError('Unable to save data. Please try again.');
        }
    });
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            form.reset();
            if (errorMessage) errorMessage.classList.remove('show');
            // Reset consent checkbox to checked
            document.getElementById('data-consent').checked = true;
        });
    }
    
    initModals();
    
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 5000);
        }
    }
}

function initResultPage() {
    const userData = getUserData();
    
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update all displays
    updateResultDisplay(userData);
    const timeEstimation = updateTimeEstimationDisplay(userData);
    
    // Combine data
    const fullData = {
        ...userData,
        timeEstimation: timeEstimation,
        deviation: calculateDeviation(userData.bmi),
        percentile: calculatePercentile(userData.bmi, userData.category)
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
            window.location.href = 'suggestion.html';
        });
    }
    
    // View Data button
    const viewDataBtn = document.getElementById('view-data-btn');
    if (viewDataBtn) {
        viewDataBtn.addEventListener('click', function() {
            alert(`Your Data:\nHeight: ${userData.height} cm\nWeight: ${userData.weight} kg\nBMI: ${userData.bmi}\nCategory: ${BMI_CATEGORIES[userData.category].name}`);
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportDataAsPDF(userData, timeEstimation);
        });
    }
    
    // Submit to Google Sheets if consent
    if (userData.consent) {
        // Show loading animation
        updateSubmissionStatus(false, 'Submitting data...');
        
        // Delay submission for better UX
        setTimeout(() => {
            submitToGoogleSheets(userData);
        }, 1500);
    } else {
        updateSubmissionStatus(false, 'Opted out of data collection');
    }
}

function initSuggestionPage() {
    const userData = getUserData();
    
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    const { category, timeEstimation } = userData;
    const categoryInfo = BMI_CATEGORIES[category];
    
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
            window.print();
        });
    }
    
    const savePlanBtn = document.getElementById('save-plan-btn');
    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', function() {
            saveActionPlan(userData);
        });
    }
}

function exportDataAsPDF(userData, timeEstimation) {
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
WHO Category: ${BMI_CATEGORIES[userData.category].name}
Percentile Rank: ${calculatePercentile(userData.bmi, userData.category)}%

IDEAL WEIGHT RANGE
------------------
Minimum: ${userData.idealWeight.min} kg
Maximum: ${userData.idealWeight.max} kg
Target: ${userData.idealWeight.target} kg

TIME ESTIMATION
---------------
Weight Change Needed: ${timeEstimation.weightChange.change} kg
Estimated Time: ${timeEstimation.timeEstimate.weeks} weeks
Safe Rate: ${timeEstimation.timeEstimate.safeRate} kg/week

HEALTH RECOMMENDATIONS
----------------------
Focus Area: ${BMI_CATEGORIES[userData.category].focus}
Direction: ${BMI_CATEGORIES[userData.category].direction}

This report is generated for educational purposes.
Universitas Islam Indonesia - Sistem Informasi Manajemen
`;
    
    // Create download link
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BMI_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Report downloaded as text file.');
}

function saveActionPlan(userData) {
    const plan = `
PERSONAL HEALTH ACTION PLAN
============================
Based on BMI Analysis

CURRENT STATUS
--------------
BMI: ${userData.bmi} (${BMI_CATEGORIES[userData.category].name})
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
    const blob = new Blob([plan], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Health_Action_Plan_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('Action Plan downloaded successfully.');
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function initModals() {
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    const modals = document.querySelectorAll('.modal');
    
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(e) {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Modal link mappings
    const modalLinks = {
        'privacy-link': 'privacy-modal',
        'methodology-link': 'privacy-modal',
        'references-link': 'references-modal',
        'disclaimer-link': 'disclaimer-modal',
        'about-link': 'references-modal',
        'contact-link': 'privacy-modal'
    };
    
    Object.entries(modalLinks).forEach(([linkId, modalId]) => {
        const link = document.getElementById(linkId);
        const modal = document.getElementById(modalId);
        
        if (link && modal) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                modal.style.display = 'flex';
            });
        }
    });
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
        idealWeight: calculateIdealWeightRange(height),
        consent: true,
        timestamp: new Date().toISOString()
    };
    
    console.log('Test Data:', testData);
    
    // Direct test URL
    const params = new URLSearchParams({
        height: height,
        weight: weight,
        bmi: bmi.toFixed(1),
        category: BMI_CATEGORIES[category].name,
        note: 'Test from console',
        method: 'test',
        timestamp: Date.now(),
        student1: 'Bagaskara Putera Marendra',
        student2: 'M. Arif Al-Ghifary'
    });
    
    const testUrl = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
    console.log('Direct URL:', testUrl);
    
    // Open in new tab
    window.open(testUrl, '_blank');
    
    // Test submission
    submitToGoogleSheets(testData).then(success => {
        console.log('Result:', success ? '✅ Success' : '❌ Failed');
        console.groupEnd();
    });
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
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
    }
    
    // Clear data on start over
    document.querySelectorAll('a[href="index.html"]').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === 'index.html') {
                clearUserData();
            }
        });
    });
    
    // Development helper
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('🛠 Development mode active');
        console.log('Run testGoogleSheets() to test integration');
        console.log('Current URL:', GOOGLE_APPS_SCRIPT_URL);
    }
    
    // Add fade-in animation to cards
    setTimeout(() => {
        document.querySelectorAll('.card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });
    }, 100);
});