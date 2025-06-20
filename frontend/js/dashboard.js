document.addEventListener('DOMContentLoaded', () => {
    // Display today's date and day
    const dateDay = document.getElementById('date-day');
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDay.textContent = today.toLocaleDateString('en-US', options);

    // Fetch weather (placeholder: replace with API call)
    const weather = document.getElementById('weather');
    weather.textContent = 'Sunny, 25°C'; // Placeholder

    // Water intake ring
    const waterProgress = document.querySelector('.water-intake-ring .progress');
    const waterText = document.getElementById('water-text');
    let glasses = 0; // Number of glasses consumed
    const glassVolume = 0.25; // 1 glass = 0.25L
    const totalWater = 2; // Target: 2L (8 glasses)

    const updateWaterIntake = () => {
        const waterIntake = glasses * glassVolume; // Calculate total liters
        const percentage = (waterIntake / totalWater) * 100;
        const offset = 283 - (283 * percentage) / 100;
        waterProgress.setAttribute('stroke-dashoffset', offset);
        waterText.textContent = `${waterIntake.toFixed(1)}L / ${totalWater.toFixed(1)}L`;
    };

    // Initialize water intake
    updateWaterIntake();

    // Handle water intake input
    const addWaterButton = document.getElementById('add-water');
    const waterGlassesInput = document.getElementById('water-glasses');
    addWaterButton.addEventListener('click', () => {
        const input = parseInt(waterGlassesInput.value);
        if (!isNaN(input) && input >= 0) {
            glasses += input; // Add glasses to total
            if (glasses > 20) glasses = 20; // Cap at 20 glasses (5L)
            updateWaterIntake();
            waterGlassesInput.value = ''; // Clear input
        } else {
            alert('Please enter a valid number of glasses');
        }
    });

    // BMI Calculator
    const calculateBmi = document.getElementById('calculate-bmi');
    const bmiResult = document.getElementById('bmi-result');
    calculateBmi.addEventListener('click', () => {
        const height = parseFloat(document.getElementById('height').value);
        const weight = parseFloat(document.getElementById('weight').value);
        if (height > 0 && weight > 0) {
            const heightInMeters = height / 100; // Convert cm to meters
            const bmi = weight / (heightInMeters * heightInMeters);
            let category;
            if (bmi < 18.5) category = 'Underweight';
            else if (bmi < 25) category = 'Normal';
            else if (bmi < 30) category = 'Overweight';
            else category = 'Obese';
            bmiResult.textContent = `BMI: ${bmi.toFixed(1)} (${category})`;
        } else {
            bmiResult.textContent = 'Please enter valid height and weight';
        }
    });
});